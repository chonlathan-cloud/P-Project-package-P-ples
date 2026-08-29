from __future__ import annotations

from datetime import UTC, datetime

import httpx

from ddbox_api.domain.models import LeadCreate, StoredLead
from ddbox_api.repositories.base import NotificationGateway
from ddbox_api.services.leads import (
    LinePushNotificationGateway,
    PrimaryWithFallbackNotificationGateway,
)


def _lead() -> StoredLead:
    return StoredLead(
        id="lead-id",
        reference="DD-TEST123",
        payload=LeadCreate(
            customer_path="has_specifications",
            product_type="กล่องเครื่องสำอาง",
            quantity=1000,
            project_details="ต้องการประเมินรูปแบบกล่องสำหรับสินค้าใหม่",
            contact_name="ลูกค้าทดสอบ",
            phone="0812345678",
            preferred_contact="phone",
            consent=True,
        ),
        payload_fingerprint="fingerprint",
        idempotency_hash="idempotency",
        created_at=datetime.now(UTC),
    )


class _Gateway:
    def __init__(self, channel: str, error: Exception | None = None) -> None:
        self.channel = channel
        self.error = error
        self.calls = 0

    def notify_lead(self, lead: StoredLead) -> str:
        self.calls += 1
        if self.error:
            raise self.error
        return self.channel


def test_line_push_targets_the_configured_group_without_leaking_token() -> None:
    seen: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["authorization"] = request.headers.get("authorization")
        seen["body"] = request.read().decode()
        return httpx.Response(200, json={})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    gateway = LinePushNotificationGateway("secret-token", "C" + "a" * 32, client)

    assert gateway.notify_lead(_lead()) == "line"
    assert seen["authorization"] == "Bearer secret-token"
    assert '"to":"Caaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"' in str(seen["body"])
    assert "secret-token" not in str(seen["body"])


def test_gmail_is_used_only_after_line_failure() -> None:
    primary = _Gateway("line", httpx.HTTPError("LINE unavailable"))
    fallback = _Gateway("gmail")
    gateway = PrimaryWithFallbackNotificationGateway(primary, fallback)

    assert gateway.notify_lead(_lead()) == "gmail"
    assert primary.calls == 1
    assert fallback.calls == 1


def test_gmail_is_not_used_when_line_succeeds() -> None:
    primary: NotificationGateway = _Gateway("line")
    fallback = _Gateway("gmail")
    gateway = PrimaryWithFallbackNotificationGateway(primary, fallback)

    assert gateway.notify_lead(_lead()) == "line"
    assert fallback.calls == 0
