from __future__ import annotations

import base64
import hashlib
import hmac
import json
from typing import Any, Literal

from ddbox_api.domain.errors import ForbiddenError, ValidationError
from ddbox_api.domain.models import LineGroupCandidate, utc_now
from ddbox_api.repositories.base import ContentRepository

REGISTRATION_COMMAND = "#ddbox-register"


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
        recorded = 0
        for event in payload["events"]:
            candidate = self._candidate_from_event(event, destination)
            if candidate is None:
                continue
            self._repository.upsert_line_group_candidate(candidate)
            recorded += 1
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
