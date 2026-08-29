from __future__ import annotations

import argparse
import hashlib
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from io import BytesIO
from pathlib import Path
from typing import Any

from google.cloud import firestore, storage
from PIL import Image

PROJECT_ID = "the49-487609"
DATABASE = "ddbox-test"
BUCKET = "the49-487609-ddbox-media-test"
DISCLAIMER = (
    "ราคาเป็นข้อมูลประมาณการเบื้องต้น ราคาจริงขึ้นอยู่กับขนาด จำนวน วัสดุ งานพิมพ์ "
    "และกระบวนการหลังพิมพ์ กรุณาส่งรายละเอียดให้ทีมประเมินราคาอีกครั้ง"
)


@dataclass(frozen=True)
class ProjectSeed:
    item_id: str
    slug: str
    title: str
    summary: str
    category: str
    source_dir: str
    pricing_id: str
    material: str
    quantity: str
    application: str
    alt_texts: tuple[str, ...]


PROJECTS = (
    ProjectSeed(
        item_id="generated-cosmetic-folding-carton-v2",
        slug="cosmetic-folding-carton-v2",
        title="กล่องกระดาษพับสำหรับผลิตภัณฑ์ดูแลผิว",
        summary=("ตัวอย่างการออกแบบกล่องกระดาษพับที่แสดงสัดส่วน ฝาพับ พื้นผิววัสดุ และแบบคลี่ก่อนขึ้นรูป"),
        category="กล่องกระดาษพับ",
        source_dir="folding-carton-v1",
        pricing_id="folding-carton",
        material="Art Card 300-350 แกรม",
        quantity="500-1,000 ใบ",
        application="สกินแคร์ เครื่องสำอาง สินค้าขนาดเล็ก",
        alt_texts=(
            "ภาพจำลองกล่องกระดาษพับสามขนาดบนพื้นสีครีม",
            "ภาพจำลองกล่องกระดาษพับเปิดฝาพร้อมชิ้นรองสินค้า",
            "ภาพจำลองระยะใกล้ของฝาพับและพื้นผิวกระดาษ",
            "ภาพจำลองแบบคลี่และกล่องกระดาษพับที่ประกอบแล้ว",
        ),
    ),
    ProjectSeed(
        item_id="generated-corrugated-structure-v2",
        slug="corrugated-structure-v2",
        title="กล่องลูกฟูกสำหรับจัดส่งพร้อมชิ้นรอง",
        summary=("ตัวอย่างกล่องไปรษณีย์ที่เน้นความแข็งแรงระหว่างขนส่ง พร้อมชิ้นรองกระดาษสำหรับยึดสินค้าให้อยู่กับที่"),
        category="กล่องลูกฟูก / ไปรษณีย์",
        source_dir="corrugated-mailer-v1",
        pricing_id="corrugated-mailer",
        material="ลูกฟูก 3 ชั้น KA / KI / KT",
        quantity="ขนาดเล็ก-กลาง",
        application="E-commerce ชุดสินค้า และงานจัดส่ง",
        alt_texts=(
            "ภาพจำลองกล่องลูกฟูกไปรษณีย์ปิดฝาบนพื้นสีครีม",
            "ภาพจำลองกล่องลูกฟูกเปิดฝาพร้อมชิ้นรองและขวดสินค้า",
            "ภาพจำลองระยะใกล้ของลอนกระดาษและลิ้นล็อกกล่อง",
            "ภาพจำลองกล่องลูกฟูก แบบคลี่ และชิ้นรองหลายมุม",
        ),
    ),
    ProjectSeed(
        item_id="generated-premium-die-cut-v2",
        slug="premium-die-cut-v2",
        title="กล่องไดคัทลูกฟูกพร้อมโครงสร้างรองรับ",
        summary=("ตัวอย่างโครงสร้างไดคัทที่ออกแบบจุดล็อกและพื้นที่รองรับเฉพาะสินค้า เพื่อช่วยลดการเคลื่อนตัวภายในกล่อง"),
        category="กล่องไดคัทลูกฟูก",
        source_dir="corrugated-die-cut-v1",
        pricing_id="corrugated-die-cut",
        material="ลูกฟูก 3 ชั้น ลอน E / B",
        quantity="ประเมินตามขนาดและโครงสร้าง",
        application="สินค้าที่ต้องการโครงสร้างเฉพาะและการป้องกันเพิ่ม",
        alt_texts=(
            "ภาพจำลองกล่องไดคัทลูกฟูกเปิดฝาพร้อมโครงสร้างรองรับ",
            "ภาพจำลองกล่องไดคัทพร้อมชิ้นรองสำหรับกระปุกสินค้า",
            "ภาพจำลองระยะใกล้ของลิ้นล็อกและขอบลูกฟูกไดคัท",
            "ภาพจำลองแบบคลี่ กล่องกึ่งประกอบ และกล่องไดคัทสำเร็จ",
        ),
    ),
    ProjectSeed(
        item_id="generated-paper-insert-v1",
        slug="paper-insert-v1",
        title="ชิ้นรองกระดาษสำหรับชุดผลิตภัณฑ์",
        summary=(
            "ตัวอย่างชิ้นรองกระดาษที่กำหนดช่องวางตามรูปทรงสินค้า พร้อมแสดงรายละเอียดจุดพับ จุดล็อก และขั้นตอนประกอบ"
        ),
        category="ชิ้นรอง / Paper Insert",
        source_dir="paper-insert-v1",
        pricing_id="paper-insert",
        material="Art Card / Duplex / Corrugated",
        quantity="ประเมินร่วมกับกล่องและจำนวนช่อง",
        application="Gift set ชุดเครื่องสำอาง และสินค้าหลายชิ้น",
        alt_texts=(
            "ภาพจำลองชิ้นรองกระดาษในกล่องชุดผลิตภัณฑ์สามชิ้น",
            "ภาพจำลองกล่อง ชิ้นรอง แบบคลี่ และผลิตภัณฑ์จากมุมบน",
            "ภาพจำลองระยะใกล้ของจุดล็อกและช่องวางบนชิ้นรองกระดาษ",
            "ภาพจำลองชิ้นรองกระดาษตั้งแต่แบบคลี่จนประกอบในกล่อง",
        ),
    ),
)


PRICING = (
    {
        "id": "folding-carton",
        "label": "กล่องกระดาษพับ / Folding Carton",
        "category": "กล่องกระดาษพับ",
        "starting_price_min_satang": 400,
        "starting_price_max_satang": None,
        "benchmark_min_satang": 400,
        "benchmark_max_satang": 1000,
        "benchmark_open_ended": False,
        "unit": "ใบ",
        "quantity_basis": "500-1,000 ใบ",
        "material": "Art Card 300-350 แกรม",
    },
    {
        "id": "corrugated-mailer",
        "label": "กล่องลูกฟูก / ไปรษณีย์",
        "category": "กล่องลูกฟูก / ไปรษณีย์",
        "starting_price_min_satang": 230,
        "starting_price_max_satang": None,
        "benchmark_min_satang": 300,
        "benchmark_max_satang": 1500,
        "benchmark_open_ended": False,
        "unit": "ใบ",
        "quantity_basis": "ขนาดเล็ก-กลาง",
        "material": "ลูกฟูก 3 ชั้น KA / KI / KT",
    },
    {
        "id": "corrugated-die-cut",
        "label": "กล่องไดคัทลูกฟูก",
        "category": "กล่องไดคัทลูกฟูก",
        "starting_price_min_satang": 400,
        "starting_price_max_satang": None,
        "benchmark_min_satang": 800,
        "benchmark_max_satang": 2000,
        "benchmark_open_ended": False,
        "unit": "ใบ",
        "quantity_basis": None,
        "material": "ลูกฟูก 3 ชั้น ลอน E / B",
    },
    {
        "id": "paper-insert",
        "label": "ชิ้นรอง / Paper Insert",
        "category": "ชิ้นรอง / Paper Insert",
        "starting_price_min_satang": 200,
        "starting_price_max_satang": 500,
        "benchmark_min_satang": 300,
        "benchmark_max_satang": 1000,
        "benchmark_open_ended": True,
        "unit": "ชิ้น",
        "quantity_basis": None,
        "material": "Art Card / Duplex / Corrugated",
    },
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed approved gallery concepts into test only")
    parser.add_argument("--project", required=True)
    parser.add_argument("--database", required=True)
    parser.add_argument("--bucket", required=True)
    parser.add_argument("--public-api-url", default="http://localhost:8000")
    parser.add_argument("--asset-root", type=Path)
    parser.add_argument("--local-media-root", type=Path)
    parser.add_argument("--apply", action="store_true")
    return parser.parse_args()


def guard_test_targets(args: argparse.Namespace) -> None:
    expected = (PROJECT_ID, DATABASE, BUCKET)
    actual = (args.project, args.database, args.bucket)
    if actual != expected:
        raise SystemExit(f"refusing non-test target: expected {expected}, received {actual}")
    if not args.apply:
        raise SystemExit("dry run only; pass --apply after reviewing the exact test targets")


def render_variants(source: Path) -> tuple[bytes, bytes, int, int, str]:
    raw = source.read_bytes()
    image = Image.open(BytesIO(raw))
    image.load()
    normalized = image.convert("RGB")
    webp = BytesIO()
    jpeg = BytesIO()
    normalized.save(webp, "WEBP", quality=84, method=6)
    normalized.save(jpeg, "JPEG", quality=87, optimize=True)
    return (
        webp.getvalue(),
        jpeg.getvalue(),
        image.width,
        image.height,
        hashlib.sha256(raw).hexdigest(),
    )


def upload_variant(blob: storage.Blob, body: bytes, content_type: str) -> None:
    blob.cache_control = "public, max-age=31536000, immutable"
    blob.upload_from_string(body, content_type=content_type)
    blob.patch()


def seed(args: argparse.Namespace) -> None:
    repository_root = Path(__file__).resolve().parents[3]
    asset_root = args.asset_root or repository_root / "assets" / "gallery-source"
    local_media_root = args.local_media_root
    now = datetime.now(UTC)
    actor = "seed-gallery-test"
    public_api_url = args.public_api_url.rstrip("/")
    gcs = storage.Client(project=args.project)
    bucket = gcs.bucket(args.bucket)
    database = firestore.Client(project=args.project, database=args.database)
    batch = database.batch()

    for price in PRICING:
        payload: dict[str, Any] = {
            **price,
            "locale": "th",
            "disclaimer": DISCLAIMER,
            "status": "published",
            "version": 1,
            "created_at": now,
            "updated_at": now,
            "published_at": now,
            "created_by": actor,
            "updated_by": actor,
        }
        batch.set(database.collection("pricing_benchmarks").document(price["id"]), payload)

    for project in PROJECTS:
        source_files = sorted((asset_root / project.source_dir).glob("*.png"))
        if len(source_files) != len(project.alt_texts):
            raise SystemExit(f"expected {len(project.alt_texts)} images in {project.source_dir}")
        images: list[dict[str, Any]] = []
        for index, (source, alt) in enumerate(zip(source_files, project.alt_texts, strict=True), 1):
            asset_id = f"{project.slug}-{index:02d}"
            webp, jpeg, width, height, checksum = render_variants(source)
            prefix = f"ready/{asset_id}"
            upload_variant(bucket.blob(f"{prefix}/image.webp"), webp, "image/webp")
            upload_variant(bucket.blob(f"{prefix}/image.jpg"), jpeg, "image/jpeg")
            base_url = f"{public_api_url}/media/{asset_id}"
            metadata = {
                "id": asset_id,
                "original_filename": source.name,
                "content_type": "image/png",
                "width": width,
                "height": height,
                "checksum_sha256": checksum,
                "url": f"{base_url}/image.webp",
                "fallback_url": f"{base_url}/image.jpg",
                "alt": alt,
                "created_at": now.isoformat(),
            }
            upload_variant(
                bucket.blob(f"{prefix}/metadata.json"),
                json.dumps(metadata, ensure_ascii=False).encode(),
                "application/json",
            )
            if local_media_root:
                target = local_media_root / asset_id
                target.mkdir(parents=True, exist_ok=True)
                (target / "image.webp").write_bytes(webp)
                (target / "image.jpg").write_bytes(jpeg)
            images.append(
                {
                    "id": asset_id,
                    "url": metadata["url"],
                    "fallback_url": metadata["fallback_url"],
                    "width": width,
                    "height": height,
                    "alt": alt,
                }
            )

        gallery_payload = {
            "id": project.item_id,
            "slug": project.slug,
            "locale": "th",
            "title": project.title,
            "summary": project.summary,
            "category": project.category,
            "images": images,
            "evidence_type": "concept",
            "pricing_benchmark_id": project.pricing_id,
            "specs": {
                "material": project.material,
                "quantity": project.quantity,
                "application": project.application,
            },
            "customer_permission": False,
            "status": "published",
            "version": 1,
            "created_at": now,
            "updated_at": now,
            "published_at": now,
            "created_by": actor,
            "updated_by": actor,
        }
        batch.set(database.collection("gallery_items").document(project.item_id), gallery_payload)
        batch.set(
            database.collection("gallery_slugs").document(project.slug),
            {"item_id": project.item_id},
        )

    audit_ref = database.collection("audit_logs").document()
    batch.set(
        audit_ref,
        {
            "actor_uid": actor,
            "action": "seed",
            "entity_type": "gallery_test_dataset",
            "entity_id": "gallery-concepts-v1",
            "created_at": now,
        },
    )
    batch.commit()
    print(f"seeded {len(PROJECTS)} gallery projects and {len(PRICING)} prices into {DATABASE}")


if __name__ == "__main__":
    arguments = parse_args()
    guard_test_targets(arguments)
    seed(arguments)
