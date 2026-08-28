from __future__ import annotations

import hashlib
import json
import logging
from uuid import uuid4

from ddbox_api.domain.models import LeadCreate, LeadReceipt, StoredLead, utc_now
from ddbox_api.repositories.base import ContentRepository, NotificationGateway

logger = logging.getLogger(__name__)


class LoggingNotificationGateway:
    """Safe local stub. It logs only the non-sensitive lead reference."""

    def notify_lead(self, lead: StoredLead) -> None:
        logger.info("lead_notification_stub", extra={"lead_reference": lead.reference})


class LeadService:
    def __init__(
        self, repository: ContentRepository, notification_gateway: NotificationGateway
    ) -> None:
        self._repository = repository
        self._notifications = notification_gateway

    def create(self, payload: LeadCreate, idempotency_key: str) -> tuple[LeadReceipt, str]:
        canonical = json.dumps(
            payload.model_dump(mode="json"),
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        fingerprint = hashlib.sha256(canonical.encode()).hexdigest()
        key_hash = hashlib.sha256(idempotency_key.encode()).hexdigest()
        lead_id = uuid4().hex
        lead = StoredLead(
            id=lead_id,
            reference=f"DD-{lead_id[:10].upper()}",
            payload=payload,
            payload_fingerprint=fingerprint,
            idempotency_hash=key_hash,
            created_at=utc_now(),
        )
        stored, duplicate = self._repository.create_lead_once(lead, key_hash, fingerprint)
        return LeadReceipt(reference=stored.reference, duplicate=duplicate), stored.id

    def notify(self, lead_id: str) -> None:
        # Notification delivery becomes a durable Cloud Tasks workflow before launch.
        # The vertical slice keeps storage durable before this best-effort stub runs.
        try:
            lead = self._repository.get_lead(lead_id)
            if lead is None:
                return
            self._notifications.notify_lead(lead)
            self._repository.mark_notification(lead_id, "sent")
        except Exception:
            logger.exception("lead_notification_failed", extra={"lead_id": lead_id})
            self._repository.mark_notification(lead_id, "failed")
