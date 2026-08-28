from __future__ import annotations

from fastapi.testclient import TestClient


def _lead_payload() -> dict[str, object]:
    return {
        "customer_path": "has_specifications",
        "product_type": "กล่องเครื่องสำอาง",
        "quantity": 1000,
        "dimensions": "20 x 10 x 5 ซม.",
        "project_details": "ต้องการประเมินรูปแบบกล่องและวัสดุสำหรับสินค้าใหม่",
        "contact_name": "ผู้ติดต่อทดสอบ",
        "phone": "0812345678",
        "preferred_contact": "phone",
        "consent": True,
    }


def test_lead_submission_is_idempotent(client: TestClient) -> None:
    key = "stable-client-key-123456"
    first = client.post("/v1/leads", headers={"Idempotency-Key": key}, json=_lead_payload())
    second = client.post("/v1/leads", headers={"Idempotency-Key": key}, json=_lead_payload())
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["reference"] == second.json()["reference"]
    assert first.json()["duplicate"] is False
    assert second.json()["duplicate"] is True


def test_idempotency_key_rejects_different_payload(client: TestClient) -> None:
    key = "stable-client-key-654321"
    assert (
        client.post("/v1/leads", headers={"Idempotency-Key": key}, json=_lead_payload()).status_code
        == 201
    )
    changed = _lead_payload()
    changed["quantity"] = 2000
    response = client.post("/v1/leads", headers={"Idempotency-Key": key}, json=changed)
    assert response.status_code == 409


def test_lead_requires_matching_contact_method_and_quantity(client: TestClient) -> None:
    payload = _lead_payload()
    payload.pop("phone")
    payload.pop("quantity")
    response = client.post(
        "/v1/leads",
        headers={"Idempotency-Key": "stable-client-key-validation"},
        json=payload,
    )
    assert response.status_code == 422
    assert response.json()["code"] == "request_validation"


def test_honeypot_rejects_bot_submission(client: TestClient) -> None:
    payload = _lead_payload()
    payload["website"] = "https://spam.invalid"
    response = client.post(
        "/v1/leads",
        headers={"Idempotency-Key": "stable-client-key-honeypot"},
        json=payload,
    )
    assert response.status_code == 422
