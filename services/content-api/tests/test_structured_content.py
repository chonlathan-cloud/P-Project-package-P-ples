from __future__ import annotations

from fastapi.testclient import TestClient


def _product(slug: str = "mailer-box") -> dict[str, object]:
    return {
        "kind": "product",
        "slug": slug,
        "title": "กล่องไปรษณีย์สั่งผลิต",
        "summary": "ข้อมูลสำหรับประเมินรูปแบบกล่องตามสเปกสินค้า",
        "display_order": 10,
        "category": "กล่องไดคัท",
        "overview": "ตรวจขนาดสินค้า โครงสร้าง และวิธีใช้งานก่อนประเมินงาน",
        "hero_image": {
            "src": "/images/generated/corrugated-structure-v2.webp",
            "alt": "ภาพจำลองกล่องลูกฟูกโดยไม่มีตราสินค้า",
        },
        "applications": [
            {
                "title": "กล่องไปรษณีย์",
                "description": "เริ่มจากขนาดสินค้าและรูปแบบการจัดส่ง",
            }
        ],
        "fit": ["ต้องพิจารณาการขนส่งร่วมกับขนาด"],
        "brief": ["ขนาดและน้ำหนักสินค้า"],
        "decisions": [
            {
                "title": "ขนาดและการจัดวาง",
                "description": "ตรวจพื้นที่เผื่อและวิธีวางสินค้า",
            }
        ],
        "materials": ["กระดาษลูกฟูก"],
        "use_cases": ["จัดส่งสินค้า"],
        "moq_guidance": "แจ้งจำนวนเพื่อให้ทีมประเมินตามแบบและวัสดุ",
        "lead_time_wording": "กำหนดส่งประเมินหลังยืนยันสเปกและแบบพิมพ์",
        "media_ids": [],
        "seo": {
            "title": "กล่องไปรษณีย์สั่งผลิต",
            "description": "ดูข้อมูลกล่องและส่งสเปกเพื่อให้ทีมประเมิน",
        },
    }


def _offer() -> dict[str, object]:
    return {
        "kind": "offer",
        "slug": "starter",
        "title": "เริ่มต้นทำบรรจุภัณฑ์",
        "summary": "แนวทางสำหรับแบรนด์ที่ต้องการทดลองรูปแบบก่อนขยายการผลิต",
        "display_order": 10,
        "label": "START WITH GUIDANCE",
        "status_label": "ยังไม่มีสเปก",
        "audience": "แบรนด์ที่กำลังเริ่มต้นหรือยังต้องการคำแนะนำด้านโครงสร้าง",
        "quote_path": "needs_guidance",
        "inputs": ["ภาพหรือสินค้าตัวอย่าง"],
        "checks": [
            {
                "title": "ข้อมูลที่ยังขาด",
                "description": "จัดลำดับข้อมูลที่ต้องตรวจสอบเพิ่ม",
            }
        ],
        "moq_guidance": "แจ้งรูปแบบและจำนวนเพื่อประเมินความเหมาะสม",
        "benefits": ["ช่วยทบทวนสเปกก่อนประเมินราคา"],
        "cta_label": "ส่งข้อมูลให้ทีมแนะนำ",
        "cta_href": "/quote",
        "proof_reference_ids": [],
    }


def _faq() -> dict[str, object]:
    return {
        "kind": "faq",
        "slug": "how-to-request-quote",
        "title": "ข้อมูลที่ใช้ขอประเมินราคา",
        "summary": "รายการข้อมูลเบื้องต้นที่ช่วยให้ทีมประเมินงานได้ตรงขึ้น",
        "question": "ควรเตรียมข้อมูลอะไรเพื่อขอประเมินราคา",
        "answer": "แจ้งประเภทสินค้า ขนาด จำนวน วัสดุที่สนใจ และวันที่ต้องการใช้งาน",
        "page_scopes": ["quote", "products"],
        "order": 10,
    }


def _page() -> dict[str, object]:
    return {
        "kind": "page",
        "slug": "packaging-guide",
        "title": "แนวทางเตรียมข้อมูลบรรจุภัณฑ์",
        "summary": "โครงสร้างเนื้อหาสำหรับช่วยลูกค้าเตรียมข้อมูลก่อนคุยกับทีม",
        "sections": [
            {
                "type": "text",
                "key": "hero",
                "heading": "เริ่มจากข้อมูลสินค้า",
                "paragraphs": ["แจ้งขนาด น้ำหนัก และวิธีจัดส่งของสินค้า"],
                "bullets": ["ขนาดสินค้า", "จำนวนที่ต้องการ"],
                "items": [
                    {
                        "title": "จัดข้อมูลสินค้า",
                        "description": "รวบรวมขนาด น้ำหนัก และวิธีใช้งาน",
                    }
                ],
            },
            {
                "type": "entity_list",
                "heading": "ประเภทกล่องที่เกี่ยวข้อง",
                "entity_kind": "products",
                "entity_ids": ["mailer-box"],
            },
            {
                "type": "cta",
                "heading": "พร้อมให้ทีมช่วยประเมิน",
                "body": "ส่งข้อมูลที่มีอยู่ ทีมจะช่วยทบทวนส่วนที่ยังไม่ครบ",
                "label": "เริ่มส่งรายละเอียด",
                "href": "/quote",
            },
        ],
    }


def test_admin_can_manage_each_structured_resource(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    resources = {
        "products": _product(),
        "offers": _offer(),
        "faqs": _faq(),
        "pages": _page(),
    }

    for resource, content in resources.items():
        kind = str(content["kind"])
        created_response = client.post(f"/v1/admin/{resource}", headers=admin_headers, json=content)
        assert created_response.status_code == 201
        created = created_response.json()
        assert created["status"] == "draft"
        assert created["version"] == 1
        assert created["has_unpublished_changes"] is True

        listed = client.get(f"/v1/admin/{resource}", headers=admin_headers).json()
        assert [item["id"] for item in listed] == [created["id"]]

        published_response = client.post(
            f"/v1/admin/publish/{kind}/{created['id']}",
            headers=admin_headers,
            json={"expected_version": 1},
        )
        assert published_response.status_code == 200
        published = published_response.json()
        assert published["status"] == "published"
        assert published["version"] == 2
        assert published["has_unpublished_changes"] is False

        public = client.get(f"/v1/{resource}/{content['slug']}")
        assert public.status_code == 200
        public_payload = public.json()
        assert public_payload["content"]["slug"] == content["slug"]
        assert "created_by" not in public_payload
        assert "published_content" not in public_payload


def test_published_content_uses_snapshot_until_next_publish(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    created = client.post("/v1/admin/products", headers=admin_headers, json=_product()).json()
    published = client.post(
        f"/v1/admin/publish/product/{created['id']}",
        headers=admin_headers,
        json={"expected_version": created["version"]},
    ).json()
    changed_content = _product()
    changed_content["title"] = "ชื่อร่างที่ยังไม่เผยแพร่"

    updated_response = client.put(
        f"/v1/admin/products/{created['id']}",
        headers=admin_headers,
        json={"expected_version": published["version"], "content": changed_content},
    )

    assert updated_response.status_code == 200
    updated = updated_response.json()
    assert updated["has_unpublished_changes"] is True
    public = client.get("/v1/products/mailer-box").json()
    assert public["content"]["title"] == "กล่องไปรษณีย์สั่งผลิต"

    republished = client.post(
        f"/v1/admin/publish/product/{created['id']}",
        headers=admin_headers,
        json={"expected_version": updated["version"]},
    )
    assert republished.status_code == 200
    assert client.get("/v1/products/mailer-box").json()["content"]["title"] == ("ชื่อร่างที่ยังไม่เผยแพร่")


def test_structured_content_enforces_kind_slug_and_version(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    mismatch = client.post("/v1/admin/offers", headers=admin_headers, json=_product())
    assert mismatch.status_code == 422

    first = client.post("/v1/admin/products", headers=admin_headers, json=_product()).json()
    duplicate = client.post("/v1/admin/products", headers=admin_headers, json=_product())
    assert duplicate.status_code == 409

    stale = client.put(
        f"/v1/admin/products/{first['id']}",
        headers=admin_headers,
        json={"expected_version": 99, "content": _product()},
    )
    assert stale.status_code == 409

    published = client.post(
        f"/v1/admin/publish/product/{first['id']}",
        headers=admin_headers,
        json={"expected_version": first["version"]},
    ).json()
    renamed = _product("renamed-after-publish")
    immutable_slug = client.put(
        f"/v1/admin/products/{first['id']}",
        headers=admin_headers,
        json={"expected_version": published["version"], "content": renamed},
    )
    assert immutable_slug.status_code == 409


def test_structured_content_rejects_html_and_requires_admin(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    forbidden = client.get("/v1/admin/products")
    assert forbidden.status_code == 403

    payload = _page()
    payload["sections"] = [
        {
            "type": "text",
            "heading": "เนื้อหาที่ไม่ปลอดภัย",
            "paragraphs": ["<script>alert('x')</script>"],
        }
    ]
    rejected = client.post("/v1/admin/pages", headers=admin_headers, json=payload)
    assert rejected.status_code == 422


def test_archive_removes_document_from_public_reads(
    client: TestClient, admin_headers: dict[str, str]
) -> None:
    created = client.post("/v1/admin/offers", headers=admin_headers, json=_offer()).json()
    published = client.post(
        f"/v1/admin/publish/offer/{created['id']}",
        headers=admin_headers,
        json={"expected_version": created["version"]},
    ).json()
    archived = client.post(
        f"/v1/admin/archive/offer/{created['id']}",
        headers=admin_headers,
        json={"expected_version": published["version"]},
    )
    assert archived.status_code == 200
    assert archived.json()["status"] == "archived"
    assert client.get("/v1/offers/starter").status_code == 404
