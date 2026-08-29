from __future__ import annotations

import hashlib
import json
import logging
import smtplib
from email.message import EmailMessage
from uuid import uuid4

import httpx

from ddbox_api.domain.models import LeadCreate, LeadReceipt, StoredLead, utc_now
from ddbox_api.repositories.base import ContentRepository, NotificationGateway

logger = logging.getLogger(__name__)


class LoggingNotificationGateway:
    """Safe local stub. It logs only the non-sensitive lead reference."""

    def notify_lead(self, lead: StoredLead) -> str:
        logger.info("lead_notification_stub", extra={"lead_reference": lead.reference})
        return "logging"


def format_lead_notification(lead: StoredLead) -> str:
    payload = lead.payload
    lines = [
        f"Lead ใหม่ {lead.reference}",
        f"จุดเริ่มต้น: {payload.customer_path.value}",
        f"ประเภทงาน: {payload.product_type}",
        f"จำนวน: {payload.quantity or 'ยังไม่ระบุ'}",
        f"ขนาด: {payload.dimensions or 'ยังไม่ระบุ'}",
        f"วันที่ต้องการ: {payload.required_date or 'ยังไม่ระบุ'}",
        f"จังหวัดจัดส่ง: {payload.delivery_province or 'ยังไม่ระบุ'}",
        f"ผู้ติดต่อ: {payload.contact_name}",
        f"บริษัท/แบรนด์: {payload.company or 'ไม่ได้ระบุ'}",
        f"โทรศัพท์: {payload.phone or 'ไม่ได้ระบุ'}",
        f"LINE: {payload.line_id or 'ไม่ได้ระบุ'}",
        f"อีเมล: {payload.email or 'ไม่ได้ระบุ'}",
        f"ช่องทางที่สะดวก: {payload.preferred_contact.value}",
        "",
        "รายละเอียด:",
        payload.project_details,
    ]
    return "\n".join(lines)[:4900]


class LinePushNotificationGateway:
    def __init__(
        self,
        access_token: str,
        target_id: str,
        client: httpx.Client | None = None,
    ) -> None:
        self._access_token = access_token
        self._target_id = target_id
        self._client = client or httpx.Client(timeout=10.0)

    def notify_lead(self, lead: StoredLead) -> str:
        response = self._client.post(
            "https://api.line.me/v2/bot/message/push",
            headers={"Authorization": f"Bearer {self._access_token}"},
            json={
                "to": self._target_id,
                "messages": [{"type": "text", "text": format_lead_notification(lead)}],
            },
        )
        response.raise_for_status()
        return "line"


class GmailFallbackNotificationGateway:
    def __init__(self, email: str, app_password: str) -> None:
        self._email = email
        self._app_password = app_password

    def notify_lead(self, lead: StoredLead) -> str:
        message = EmailMessage()
        message["Subject"] = f"[DD Box] Lead ใหม่ {lead.reference} — LINE ส่งไม่สำเร็จ"
        message["From"] = self._email
        message["To"] = self._email
        message.set_content(format_lead_notification(lead))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as smtp:
            smtp.login(self._email, self._app_password)
            smtp.send_message(message)
        return "gmail"


class PrimaryWithFallbackNotificationGateway:
    def __init__(self, primary: NotificationGateway, fallback: NotificationGateway) -> None:
        self._primary = primary
        self._fallback = fallback

    def notify_lead(self, lead: StoredLead) -> str:
        try:
            return self._primary.notify_lead(lead)
        except Exception:
            logger.exception(
                "lead_primary_notification_failed",
                extra={"lead_reference": lead.reference},
            )
            return self._fallback.notify_lead(lead)


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
            channel = self._notifications.notify_lead(lead)
            self._repository.mark_notification(lead_id, "sent")
            logger.info(
                "lead_notification_sent",
                extra={"lead_reference": lead.reference, "notification_channel": channel},
            )
        except Exception:
            logger.exception("lead_notification_failed", extra={"lead_id": lead_id})
            self._repository.mark_notification(lead_id, "failed")
