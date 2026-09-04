from __future__ import annotations

import pytest

from ddbox_api.domain.models import ContentKind, ProductContent
from ddbox_api.repositories.memory import InMemoryContentRepository
from ddbox_api.services.content_migration import StructuredContentMigration
from ddbox_api.services.structured_content import StructuredContentService


def _product(summary: str = "ข้อมูลสำหรับประเมินกล่องตามสเปกสินค้า") -> ProductContent:
    return ProductContent(
        slug="folding-carton",
        title="กล่องกระดาษพับสั่งผลิต",
        summary=summary,
        category="กล่องกระดาษพับ",
        overview="เริ่มประเมินจากขนาดสินค้าและวิธีใช้งานจริง",
        hero_image={
            "src": "/images/generated/cosmetic-folding-carton-v2.webp",
            "alt": "ภาพจำลองกล่องกระดาษพับโดยไม่มีตราสินค้า",
        },
        applications=[
            {
                "title": "กล่องพิมพ์แบรนด์",
                "description": "ใช้จัดข้อมูลสินค้าและพื้นที่งานพิมพ์",
            }
        ],
        fit=["ต้องการพื้นที่สำหรับงานพิมพ์และข้อมูลสินค้า"],
        brief=["ขนาดสินค้าและจำนวนโดยประมาณ"],
        decisions=[
            {
                "title": "ขนาดและการจัดวาง",
                "description": "ตรวจขนาดสินค้าและพื้นที่ที่ต้องเผื่อ",
            }
        ],
    )


def test_migration_is_idempotent_and_publishes_updates() -> None:
    repository = InMemoryContentRepository()
    service = StructuredContentService(repository)
    migration = StructuredContentMigration(service)

    assert migration.plan([_product()])[0].action == "create_publish"
    created = migration.apply([_product()], "migration:test")
    assert created[0].action == "create_publish"
    published = service.get_published_by_slug(ContentKind.PRODUCT, "folding-carton")
    assert published.content.summary == "ข้อมูลสำหรับประเมินกล่องตามสเปกสินค้า"

    assert migration.plan([_product()])[0].action == "unchanged"
    assert migration.apply([_product()], "migration:test")[0].action == "unchanged"

    updated = migration.apply([_product("ข้อมูลฉบับเผยแพร่ที่แก้ไขแล้ว")], "migration:test")
    assert updated[0].action == "update_publish"
    published = service.get_published_by_slug(ContentKind.PRODUCT, "folding-carton")
    assert published.content.summary == "ข้อมูลฉบับเผยแพร่ที่แก้ไขแล้ว"


def test_migration_republishes_archived_matching_content() -> None:
    repository = InMemoryContentRepository()
    service = StructuredContentService(repository)
    migration = StructuredContentMigration(service)
    migration.apply([_product()], "migration:test")
    document = service.list_all(ContentKind.PRODUCT)[0]
    service.archive(ContentKind.PRODUCT, document.id, document.version, "admin:test")

    assert migration.plan([_product()])[0].action == "publish"
    migration.apply([_product()], "migration:test")
    assert service.get_published_by_slug(ContentKind.PRODUCT, "folding-carton")


def test_migration_rejects_duplicate_kind_and_slug() -> None:
    migration = StructuredContentMigration(StructuredContentService(InMemoryContentRepository()))

    with pytest.raises(
        ValueError,
        match="duplicate structured-content manifest entry: product/folding-carton",
    ):
        migration.plan([_product(), _product()])
