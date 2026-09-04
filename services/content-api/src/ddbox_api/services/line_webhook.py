from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
from typing import Any, Literal

from ddbox_api.domain.errors import ForbiddenError, ValidationError
from ddbox_api.domain.models import LineGroupCandidate, utc_now
from ddbox_api.repositories.base import ContentRepository

REGISTRATION_COMMAND = "#ddbox-register"
logger = logging.getLogger(__name__)


class LineWebhookService:
    def __init__(self, repository: ContentRepository, channel_secret: str) -> None:
        self._repository = repository
        self._channel_secret = channel_secret

    @property
    def configured(self) -> bool:
        return bool(self._channel_secret)

    def process(self, raw_body: bytes, signature: str) -> int:
        if not self._channel_secret:
            raise RuntimeError("LINE webhook is not configured")
        expected = base64.b64encode(
            hmac.new(self._channel_secret.encode(), raw_body, hashlib.sha256).digest()
        ).decode()
        if not signature or not hmac.compare_digest(signature, expected):
            raise ForbiddenError("invalid LINE webhook signature")

        try:
            payload = json.loads(raw_body)
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise ValidationError("invalid LINE webhook payload") from error
        if not isinstance(payload, dict) or not isinstance(payload.get("events"), list):
            raise ValidationError("invalid LINE webhook payload")

        destination = payload.get("destination")
        event_types: set[str] = set()
        source_types: set[str] = set()
        registration_message_events = 0
        recorded = 0
        for event in payload["events"]:
            if isinstance(event, dict):
                event_types.add(str(event.get("type", "unknown")))
                source = event.get("source")
                if isinstance(source, dict):
                    source_types.add(str(source.get("type", "unknown")))
                message = event.get("message")
                if (
                    event.get("type") == "message"
                    and isinstance(message, dict)
                    and message.get("type") == "text"
                    and str(message.get("text", "")).strip().lower() == REGISTRATION_COMMAND
                ):
                    registration_message_events += 1
            candidate = self._candidate_from_event(event, destination)
            if candidate is None:
                continue
            self._repository.upsert_line_group_candidate(candidate)
            recorded += 1
        logger.info(
            "line_webhook_event_summary",
            extra={
                "event_count": len(payload["events"]),
                "event_types": sorted(event_types),
                "source_types": sorted(source_types),
                "registration_message_events": registration_message_events,
                "group_candidates_recorded": recorded,
            },
        )
        return recorded

    @staticmethod
    def _candidate_from_event(event: Any, destination: Any) -> LineGroupCandidate | None:
        if not isinstance(event, dict):
            return None
        source = event.get("source")
        if not isinstance(source, dict) or source.get("type") != "group":
            return None
        group_id = source.get("groupId")
        if not isinstance(group_id, str):
            return None

        event_type = event.get("type")
        candidate_event_type: Literal["join", "registration_message"] | None = None
        if event_type == "join":
            candidate_event_type = "join"
        elif event_type == "message":
            message = event.get("message")
            if (
                isinstance(message, dict)
                and message.get("type") == "text"
                and str(message.get("text", "")).strip().lower() == REGISTRATION_COMMAND
            ):
                candidate_event_type = "registration_message"
        if candidate_event_type is None:
            return None

        now = utc_now()
        candidate_id = hashlib.sha256(group_id.encode()).hexdigest()
        return LineGroupCandidate(
            id=candidate_id,
            group_id=group_id,
            bot_user_id=destination if isinstance(destination, str) else None,
            event_type=candidate_event_type,
            first_seen_at=now,
            last_seen_at=now,
        )
