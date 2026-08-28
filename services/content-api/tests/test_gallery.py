from __future__ import annotations

from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image


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
    item = response.json()
    publish = client.post(
        f"/v1/admin/publish/gallery-item/{item['id']}",
        headers=admin_headers,
        json={"expected_version": 1},
    )
    assert publish.status_code == 422
    assert publish.json()["code"] == "validation_error"


def test_admin_endpoints_reject_missing_token(client: TestClient) -> None:
    response = client.post("/v1/admin/media/uploads", json={})
    assert response.status_code == 403
    assert response.json()["request_id"]
