from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime, timedelta
from typing import cast

from fastapi.testclient import TestClient

from ddbox_api.domain.models import (
    AttributionDropReason,
    AttributionStatus,
    LeadCreate,
    StoredLead,
)
from ddbox_api.repositories.memory import InMemoryContentRepository


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


def _measurement_metadata(
    *,
    campaign: str = "dd45_core_custom_box",
    gclid: str = "RealShape-GCLID_123",
) -> dict[str, object]:
    captured_at = datetime.now(UTC) - timedelta(hours=1)
    touch = {
        "utm_source": "google",
        "utm_medium": "cpc",
        "utm_campaign": campaign,
        "utm_id": "1111111111",
        "utm_content": "3333333333",
        "utm_term": "รับทำกล่องออฟเซ็ท",
        "adgroup_id": "2222222222",
        "gclid": gclid,
        "landing_path": "/products/folding-carton",
        "captured_at": captured_at.isoformat(),
        "expires_at": (captured_at + timedelta(days=90)).isoformat(),
    }
    return {
        "submission_path": "/quote",
        "measurement_consent": {
            "mode": "all",
            "version": 1,
            "updated_at": (captured_at - timedelta(minutes=1)).isoformat(),
        },
        "attribution": {
            "schema_version": 1,
            "model": "first_last_tagged",
            "first_touch": touch,
            "last_touch": touch,
        },
    }


def _stored_leads(client: TestClient) -> list[StoredLead]:
    repository = cast(InMemoryContentRepository, client.app.state.repository)
    return repository.list_leads(
        datetime(2020, 1, 1, tzinfo=UTC),
        datetime(2035, 1, 1, tzinfo=UTC),
    )


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


def test_lead_accepts_typed_attribution_metadata(client: TestClient) -> None:
    payload = _lead_payload() | _measurement_metadata()

    response = client.post(
        "/v1/leads",
        headers={"Idempotency-Key": "stable-client-key-attribution"},
        json=payload,
    )

    assert response.status_code == 201
    lead = _stored_leads(client)[0]
    assert lead.payload_fingerprint_version == 2
    assert lead.lead_origin == "website_form"
    assert lead.attribution_status == AttributionStatus.CAPTURED
    assert lead.payload.attribution is not None
    assert lead.payload.attribution.last_touch is not None
    assert lead.payload.attribution.last_touch.gclid == "RealShape-GCLID_123"


def test_lead_drops_attribution_when_measurement_consent_is_not_granted(
    client: TestClient,
) -> None:
    metadata = _measurement_metadata()
    metadata["measurement_consent"] = {
        "mode": "necessary",
        "version": 1,
        "updated_at": datetime.now(UTC).isoformat(),
    }

    response = client.post(
        "/v1/leads",
        headers={"Idempotency-Key": "stable-client-key-necessary"},
        json=_lead_payload() | metadata,
    )

    assert response.status_code == 201
    lead = _stored_leads(client)[0]
    assert lead.payload.attribution is None
    assert lead.attribution_status == AttributionStatus.CONSENT_DENIED
    assert lead.attribution_drop_reason == AttributionDropReason.CONSENT_NOT_GRANTED


def test_unset_measurement_consent_is_unavailable_not_denied(client: TestClient) -> None:
    metadata = _measurement_metadata()
    metadata["measurement_consent"] = {
        "mode": "unset",
        "version": None,
        "updated_at": None,
    }

    response = client.post(
        "/v1/leads",
        headers={"Idempotency-Key": "stable-client-key-unset"},
        json=_lead_payload() | metadata,
    )

    assert response.status_code == 201
    lead = _stored_leads(client)[0]
    assert lead.payload.attribution is None
    assert lead.attribution_status == AttributionStatus.UNAVAILABLE
    assert lead.attribution_drop_reason == AttributionDropReason.CONSENT_UNAVAILABLE


def test_all_measurement_consent_without_a_touch_is_recorded(client: TestClient) -> None:
    now = datetime.now(UTC)
    payload = _lead_payload() | {
        "measurement_consent": {
            "mode": "all",
            "version": 1,
            "updated_at": now.isoformat(),
        }
    }

    response = client.post(
        "/v1/leads",
        headers={"Idempotency-Key": "stable-client-key-no-touch"},
        json=payload,
    )

    assert response.status_code == 201
    lead = _stored_leads(client)[0]
    assert lead.attribution_status == AttributionStatus.NO_VALID_TOUCH
    assert lead.attribution_drop_reason is None


def test_invalid_measurement_consent_drops_only_optional_metadata(
    client: TestClient,
) -> None:
    metadata = _measurement_metadata()
    metadata["measurement_consent"] = {
        "mode": "all",
        "version": None,
        "updated_at": None,
    }

    response = client.post(
        "/v1/leads",
        headers={"Idempotency-Key": "stable-client-key-invalid-consent"},
        json=_lead_payload() | metadata,
    )

    assert response.status_code == 201
    lead = _stored_leads(client)[0]
    assert lead.payload.measurement_consent is None
    assert lead.payload.attribution is None
    assert lead.attribution_status == AttributionStatus.INVALID
    assert lead.attribution_drop_reason == AttributionDropReason.INVALID_MEASUREMENT_CONSENT


def test_lead_keeps_business_data_when_optional_attribution_is_invalid(
    client: TestClient,
) -> None:
    metadata = _measurement_metadata()
    attribution = cast(dict[str, object], metadata["attribution"])
    first_touch = cast(dict[str, object], attribution["first_touch"])
    first_touch["gclid"] = "contains whitespace"
    first_touch["utm_source"] = None
    first_touch["utm_medium"] = None

    response = client.post(
        "/v1/leads",
        headers={"Idempotency-Key": "stable-client-key-invalid-attribution"},
        json=_lead_payload() | metadata,
    )

    assert response.status_code == 201
    lead = _stored_leads(client)[0]
    assert lead.payload.product_type == "กล่องเครื่องสำอาง"
    assert lead.payload.attribution is None
    assert lead.attribution_status == AttributionStatus.INVALID
    assert lead.attribution_drop_reason == AttributionDropReason.INVALID_ATTRIBUTION


def test_expired_attribution_is_not_stored(client: TestClient) -> None:
    metadata = _measurement_metadata()
    attribution = cast(dict[str, object], metadata["attribution"])
    captured_at = datetime.now(UTC) - timedelta(days=91)
    for key in ("first_touch", "last_touch"):
        touch = cast(dict[str, object], attribution[key])
        touch["captured_at"] = captured_at.isoformat()
        touch["expires_at"] = (captured_at + timedelta(days=90)).isoformat()

    response = client.post(
        "/v1/leads",
        headers={"Idempotency-Key": "stable-client-key-expired"},
        json=_lead_payload() | metadata,
    )

    assert response.status_code == 201
    lead = _stored_leads(client)[0]
    assert lead.payload.attribution is None
    assert lead.attribution_status == AttributionStatus.EXPIRED
    assert lead.attribution_drop_reason is None


def test_future_client_attribution_time_is_rejected_without_losing_the_lead(
    client: TestClient,
) -> None:
    metadata = _measurement_metadata()
    attribution = cast(dict[str, object], metadata["attribution"])
    captured_at = datetime.now(UTC) + timedelta(minutes=10)
    for key in ("first_touch", "last_touch"):
        touch = cast(dict[str, object], attribution[key])
        touch["captured_at"] = captured_at.isoformat()
        touch["expires_at"] = (captured_at + timedelta(days=90)).isoformat()

    response = client.post(
        "/v1/leads",
        headers={"Idempotency-Key": "stable-client-key-future-touch"},
        json=_lead_payload() | metadata,
    )

    assert response.status_code == 201
    lead = _stored_leads(client)[0]
    assert lead.payload.attribution is None
    assert lead.attribution_status == AttributionStatus.INVALID
    assert lead.attribution_drop_reason == AttributionDropReason.CLIENT_TIME_INVALID


def test_business_validation_still_rejects_a_lead_with_invalid_metadata(
    client: TestClient,
) -> None:
    payload = _lead_payload() | _measurement_metadata()
    payload["product_type"] = "x"
    attribution = cast(dict[str, object], payload["attribution"])
    first_touch = cast(dict[str, object], attribution["first_touch"])
    first_touch["gclid"] = "contains whitespace"

    response = client.post(
        "/v1/leads",
        headers={"Idempotency-Key": "stable-client-key-invalid-business"},
        json=payload,
    )

    assert response.status_code == 422


def test_idempotency_ignores_changed_attribution_metadata(client: TestClient) -> None:
    key = "stable-client-key-metadata-retry"
    first_payload = _lead_payload() | _measurement_metadata(campaign="campaign_a")
    second_payload = _lead_payload() | _measurement_metadata(
        campaign="campaign_b",
        gclid="Different-GCLID_456",
    )

    first = client.post("/v1/leads", headers={"Idempotency-Key": key}, json=first_payload)
    second = client.post("/v1/leads", headers={"Idempotency-Key": key}, json=second_payload)

    assert first.status_code == 201
    assert second.status_code == 201
    assert second.json()["duplicate"] is True
    assert len(_stored_leads(client)) == 1
    stored = _stored_leads(client)[0]
    assert stored.payload.attribution is not None
    assert stored.payload.attribution.last_touch is not None
    assert stored.payload.attribution.last_touch.utm_campaign == "campaign_a"


def test_retry_cannot_attach_attribution_to_a_consent_denied_snapshot(
    client: TestClient,
) -> None:
    key = "stable-client-key-consent-retry"
    first_metadata = _measurement_metadata()
    first_metadata["measurement_consent"] = {
        "mode": "necessary",
        "version": 1,
        "updated_at": datetime.now(UTC).isoformat(),
    }

    first = client.post(
        "/v1/leads",
        headers={"Idempotency-Key": key},
        json=_lead_payload() | first_metadata,
    )
    second = client.post(
        "/v1/leads",
        headers={"Idempotency-Key": key},
        json=_lead_payload() | _measurement_metadata(),
    )

    assert first.status_code == 201
    assert second.status_code == 201
    assert second.json()["duplicate"] is True
    assert len(_stored_leads(client)) == 1
    stored = _stored_leads(client)[0]
    assert stored.payload.attribution is None
    assert stored.attribution_status == AttributionStatus.CONSENT_DENIED


def test_new_fingerprint_accepts_a_retry_for_a_legacy_lead(client: TestClient) -> None:
    key = "stable-client-key-legacy-retry"
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    legacy_payload_data = _lead_payload() | {
        "landing_page": "https://www.ddboxprinting.com/quote?utm_source=legacy",
        "campaign_source": "legacy_campaign",
    }
    payload = LeadCreate.model_validate(legacy_payload_data)
    legacy_fields = {
        "campaign_source",
        "company",
        "consent",
        "contact_name",
        "customer_path",
        "delivery_province",
        "dimensions",
        "email",
        "landing_page",
        "line_id",
        "phone",
        "preferred_contact",
        "product_type",
        "project_details",
        "quantity",
        "required_date",
    }
    canonical = json.dumps(
        payload.model_dump(mode="json", include=legacy_fields),
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )
    legacy_fingerprint = hashlib.sha256(canonical.encode()).hexdigest()
    old_lead = StoredLead(
        id="legacy-lead-id",
        reference="DD-0123456789",
        payload=payload,
        payload_fingerprint=legacy_fingerprint,
        idempotency_hash=key_hash,
        created_at=datetime.now(UTC),
    )
    repository = cast(InMemoryContentRepository, client.app.state.repository)
    repository.create_lead_once(old_lead, key_hash, legacy_fingerprint)

    response = client.post(
        "/v1/leads",
        headers={"Idempotency-Key": key},
        json=_lead_payload() | _measurement_metadata(),
    )

    assert response.status_code == 201
    assert response.json() == {
        "reference": "DD-0123456789",
        "duplicate": True,
        "next_step": "ทีมงานจะตรวจสอบข้อมูลและติดต่อกลับผ่านช่องทางที่เลือก",
    }
