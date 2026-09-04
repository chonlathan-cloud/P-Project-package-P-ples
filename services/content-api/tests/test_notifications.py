from __future__ import annotations

import json
from datetime import UTC, datetime

import httpx

from ddbox_api.domain.models import LeadCreate, StoredLead
from ddbox_api.repositories.base import NotificationGateway
from ddbox_api.services.leads import (
    LinePushNotificationGateway,
    PrimaryWithFallbackNotificationGateway,
)
from ddbox_api.services.line_flex import build_lead_flex_contents


def _lead(customer_path: str = "has_specifications") -> StoredLead:
    return StoredLead(
        id="lead-id",
        reference="DD-TEST123",
        payload=LeadCreate(
            customer_path=customer_path,
            product_type="กล่องเครื่องสำอาง",
            quantity=1000 if customer_path == "has_specifications" else None,
            dimensions="10 x 10 x 5 ซม.",
            required_date="15 ก.ย. 2026",
            delivery_province="กรุงเทพมหานคร",
            project_details="ต้องการประเมินรูปแบบกล่องสำหรับสินค้าใหม่และต้องการคำแนะนำเรื่องวัสดุ",
            contact_name="ลูกค้าทดสอบ",
            company="ABC Cosmetics",
            phone="0812345678",
            line_id="abc-cosmetics",
            preferred_contact="phone",
            consent=True,
            campaign_source="google_search",
        ),
        payload_fingerprint="fingerprint",
        idempotency_hash="idempotency",
        created_at=datetime(2026, 9, 4, 3, 4, tzinfo=UTC),
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


def test_line_push_targets_group_with_sales_first_flex_without_leaking_token() -> None:
    seen: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["authorization"] = request.headers.get("authorization")
        seen["body"] = json.loads(request.read().decode())
        return httpx.Response(200, json={})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    gateway = LinePushNotificationGateway(
        "secret-token",
        "C" + "a" * 32,
        environment="test",
        lead_detail_base_url="https://admin.example.com/leads",
        client=client,
    )

    assert gateway.notify_lead(_lead()) == "line"
    assert seen["authorization"] == "Bearer secret-token"
    assert "secret-token" not in json.dumps(seen["body"], ensure_ascii=False)

    body = seen["body"]
    assert isinstance(body, dict)
    assert body["to"] == "Caaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    message = body["messages"][0]
    assert message["type"] == "flex"
    assert message["contents"]["header"]["contents"][1]["text"] == "Lead ใหม่"
    assert message["contents"]["footer"]["contents"][0]["action"]["label"] == (
        "เปิดรายละเอียด Lead"
    )
    assert message["contents"]["footer"]["contents"][0]["action"]["uri"] == (
        "https://admin.example.com/leads/DD-TEST123"
    )


def test_flex_summary_translates_customer_path_and_marks_non_production() -> None:
    flex = build_lead_flex_contents(_lead("needs_guidance"), environment="test")

    header = flex["header"]["contents"]
    assert header[2]["text"] == "ต้องการคำแนะนำบรรจุภัณฑ์"

    body_text = json.dumps(flex["body"], ensure_ascii=False)
    assert "TEST ENVIRONMENT • ห้ามติดต่อลูกค้า" in body_text
    assert "needs_guidance" not in body_text
    assert "ข้อมูลงาน" in body_text
    assert "ผู้ติดต่อ" in body_text
    assert "google_search" in body_text


def test_production_flex_omits_test_warning() -> None:
    flex = build_lead_flex_contents(_lead(), environment="production")
    body_text = json.dumps(flex["body"], ensure_ascii=False)

    assert "ห้ามติดต่อลูกค้า" not in body_text
    assert "มีสเปกแล้ว — ขอใบเสนอราคา" in json.dumps(flex["header"], ensure_ascii=False)


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
