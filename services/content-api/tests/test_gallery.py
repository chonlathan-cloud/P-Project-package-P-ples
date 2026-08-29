from __future__ import annotations

from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from ddbox_api.domain.models import ContentStatus, PricingBenchmark, utc_now


def _image_bytes() -> bytes:
    output = BytesIO()
    Image.new("RGB", (80, 60), color=(255, 204, 0)).save(output, "PNG")
    return output.getvalue()


def _upload_media(client: TestClient, headers: dict[str, str]) -> dict[str, object]:
    body = _image_bytes()
    session_response = client.post(
        "/v1/admin/media/uploads",
        headers=headers,
        json={
            "filename": "sample.png",
            "content_type": "image/png",
            "size": len(body),
            "purpose": "gallery",
            "alt": "ตัวอย่างกล่องบรรจุภัณฑ์สีเหลือง",
        },
    )
    assert session_response.status_code == 201
    session = session_response.json()
    upload_response = client.put(
        session["upload_url"], headers={"Content-Type": "image/png"}, content=body
    )
    assert upload_response.status_code == 204
    final_response = client.post(
        f"/v1/admin/media/uploads/{session['id']}/finalize",
        headers={**headers, "X-Media-Finalize-Token": session["finalize_token"]},
    )
    assert final_response.status_code == 200
    media = final_response.json()
    rendered = client.get(str(media["url"]))
    assert rendered.status_code == 200
    assert rendered.headers["content-type"] == "image/webp"
    assert rendered.headers["cache-control"] == "public, max-age=31536000, immutable"
    return media


def _media_ref(media: dict[str, object]) -> dict[str, object]:
    return {key: media[key] for key in ("id", "url", "fallback_url", "width", "height", "alt")}


def test_gallery_upload_draft_preview_publish(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    media = _upload_media(client, admin_headers)
    create_response = client.post(
        "/v1/admin/gallery-items",
        headers=admin_headers,
        json={
            "slug": "yellow-box-sample",
            "title": "ตัวอย่างกล่องสีเหลือง",
            "summary": "ตัวอย่างสำหรับทดสอบกระบวนการเผยแพร่เนื้อหา",
            "category": "กล่องสั่งผลิต",
            "customer_permission": True,
            "image": {
                "id": media["id"],
                "url": media["url"],
                "fallback_url": media["fallback_url"],
                "width": media["width"],
                "height": media["height"],
                "alt": media["alt"],
            },
        },
    )
    assert create_response.status_code == 201
    draft = create_response.json()
    assert draft["status"] == "draft"
    assert len(draft["images"]) == 1
    assert "image" not in draft
    assert client.get("/v1/gallery-items").json() == []

    preview_response = client.get(
        f"/v1/admin/gallery-items/{draft['id']}/preview", headers=admin_headers
    )
    assert preview_response.status_code == 200

    publish_response = client.post(
        f"/v1/admin/publish/gallery-item/{draft['id']}",
        headers=admin_headers,
        json={"expected_version": 1},
    )
    assert publish_response.status_code == 200
    assert publish_response.json()["version"] == 2
    public_items = client.get("/v1/gallery-items").json()
    assert [item["slug"] for item in public_items] == ["yellow-box-sample"]

    conflict = client.post(
        f"/v1/admin/publish/gallery-item/{draft['id']}",
        headers=admin_headers,
        json={"expected_version": 1},
    )
    assert conflict.status_code == 409


def test_publish_requires_permission(client: TestClient, admin_headers: dict[str, str]) -> None:
    media = _upload_media(client, admin_headers)
    response = client.post(
        "/v1/admin/gallery-items",
        headers=admin_headers,
        json={
            "slug": "permission-required",
            "title": "ผลงานที่ยังไม่อนุมัติ",
            "summary": "รายการนี้ต้องไม่เผยแพร่จนกว่าจะมีสิทธิ์ใช้งาน",
            "category": "กล่องสั่งผลิต",
            "customer_permission": False,
            "images": [
                {
                    "id": media["id"],
                    "url": media["url"],
                    "fallback_url": media["fallback_url"],
                    "width": media["width"],
                    "height": media["height"],
                    "alt": media["alt"],
                }
            ],
        },
    )
    item = response.json()
    publish = client.post(
        f"/v1/admin/publish/gallery-item/{item['id']}",
        headers=admin_headers,
        json={"expected_version": 1},
    )
    assert publish.status_code == 422
    assert publish.json()["code"] == "validation_error"


def test_concept_can_publish_without_customer_permission(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    media = _upload_media(client, admin_headers)
    response = client.post(
        "/v1/admin/gallery-items",
        headers=admin_headers,
        json={
            "slug": "concept-structure",
            "title": "ภาพจำลองโครงสร้างกล่อง",
            "summary": "ภาพจำลองสำหรับอธิบายโครงสร้างและงบประมาณเท่านั้น",
            "category": "กล่องไดคัท",
            "evidence_type": "concept",
            "customer_permission": False,
            "images": [_media_ref(media)],
        },
    )
    assert response.status_code == 201
    item = response.json()
    publish = client.post(
        f"/v1/admin/publish/gallery-item/{item['id']}",
        headers=admin_headers,
        json={"expected_version": 1},
    )
    assert publish.status_code == 200


def test_public_gallery_resolves_legacy_local_media_origin(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    response = client.post(
        "/v1/admin/gallery-items",
        headers=admin_headers,
        json={
            "slug": "legacy-local-media",
            "title": "ภาพจากข้อมูลเดิม",
            "summary": "ต้องใช้ public API origin ของ environment ปัจจุบัน",
            "category": "กล่องกระดาษพับ",
            "evidence_type": "concept",
            "images": [
                {
                    "id": "legacy-image",
                    "url": "http://localhost:8000/media/legacy-image/image.webp",
                    "fallback_url": "http://localhost:8000/media/legacy-image/image.jpg",
                    "width": 1200,
                    "height": 900,
                    "alt": "ภาพจำลองกล่องจากข้อมูลเดิม",
                }
            ],
        },
    )
    item = response.json()
    publish = client.post(
        f"/v1/admin/publish/gallery-item/{item['id']}",
        headers=admin_headers,
        json={"expected_version": 1},
    )
    assert publish.status_code == 200

    image = client.get("/v1/gallery-items").json()[0]["images"][0]
    assert image["url"] == "http://testserver/media/legacy-image/image.webp"
    assert image["fallback_url"] == "http://testserver/media/legacy-image/image.jpg"


def test_gallery_rejects_more_than_twelve_images(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    media = _upload_media(client, admin_headers)
    response = client.post(
        "/v1/admin/gallery-items",
        headers=admin_headers,
        json={
            "slug": "too-many-images",
            "title": "รายการภาพเกินกำหนด",
            "summary": "ต้องปฏิเสธรายการที่มีภาพมากกว่าสิบสองภาพ",
            "category": "กล่องไดคัท",
            "evidence_type": "concept",
            "images": [_media_ref(media)] * 13,
        },
    )
    assert response.status_code == 422


def test_public_pricing_returns_only_published(client: TestClient) -> None:
    repository = client.app.state.repository
    now = utc_now()
    repository.seed_pricing_benchmark(
        PricingBenchmark(
            id="folding-carton",
            label="กล่องกระดาษพับ",
            category="กล่องกระดาษพับ",
            starting_price_min_satang=400,
            benchmark_min_satang=400,
            benchmark_max_satang=1000,
            unit="ใบ",
            quantity_basis="500-1,000 ใบ",
            material="Art Card 300-350 แกรม",
            disclaimer="ราคาโดยประมาณ กรุณาส่งสเปกเพื่อประเมินราคาอีกครั้ง",
            status=ContentStatus.PUBLISHED,
            created_at=now,
            updated_at=now,
            published_at=now,
            created_by="test",
            updated_by="test",
        )
    )
    response = client.get("/v1/pricing-benchmarks")
    assert response.status_code == 200
    assert [item["id"] for item in response.json()] == ["folding-carton"]


def test_admin_endpoints_reject_missing_token(client: TestClient) -> None:
    response = client.post("/v1/admin/media/uploads", json={})
    assert response.status_code == 403
    assert response.json()["request_id"]
