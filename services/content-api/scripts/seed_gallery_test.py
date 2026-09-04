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
PROD_DATABASE = "ddbox-prod"
PROD_BUCKET = "the49-487609-ddbox-media-prod"
APPROVED_TARGETS = {
    (PROJECT_ID, DATABASE, BUCKET): "test",
    (PROJECT_ID, PROD_DATABASE, PROD_BUCKET): "prod",
}
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
            "ภาพแนะนำกล่องกระดาษพับสามขนาดบนพื้นสีครีม",
            "ภาพแนะนำกล่องกระดาษพับเปิดฝาพร้อมชิ้นรองสินค้า",
            "ภาพแนะนำระยะใกล้ของฝาพับและพื้นผิวกระดาษ",
            "ภาพแนะนำแบบคลี่และกล่องกระดาษพับที่ประกอบแล้ว",
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
            "ภาพแนะนำกล่องลูกฟูกไปรษณีย์ปิดฝาบนพื้นสีครีม",
            "ภาพแนะนำกล่องลูกฟูกเปิดฝาพร้อมชิ้นรองและขวดสินค้า",
            "ภาพแนะนำระยะใกล้ของลอนกระดาษและลิ้นล็อกกล่อง",
            "ภาพแนะนำกล่องลูกฟูก แบบคลี่ และชิ้นรองหลายมุม",
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
            "ภาพแนะนำกล่องไดคัทลูกฟูกเปิดฝาพร้อมโครงสร้างรองรับ",
            "ภาพแนะนำกล่องไดคัทพร้อมชิ้นรองสำหรับกระปุกสินค้า",
            "ภาพแนะนำระยะใกล้ของลิ้นล็อกและขอบลูกฟูกไดคัท",
            "ภาพแนะนำแบบคลี่ กล่องกึ่งประกอบ และกล่องไดคัทสำเร็จ",
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
            "ภาพแนะนำชิ้นรองกระดาษในกล่องชุดผลิตภัณฑ์สามชิ้น",
            "ภาพแนะนำกล่อง ชิ้นรอง แบบคลี่ และผลิตภัณฑ์จากมุมบน",
            "ภาพแนะนำระยะใกล้ของจุดล็อกและช่องวางบนชิ้นรองกระดาษ",
            "ภาพแนะนำชิ้นรองกระดาษตั้งแต่แบบคลี่จนประกอบในกล่อง",
        ),
    ),
    ProjectSeed(
        item_id="generated-sticker-label-v1",
        slug="sticker-label-v1",
        title="สติ๊กเกอร์และฉลากสำหรับผลิตภัณฑ์",
        summary=(
            "ตัวอย่างฉลากสำหรับบรรจุภัณฑ์ที่แสดงการใช้งานจริง รูปทรงไดคัท "
            "และความแตกต่างของวัสดุกระดาษ PP ขาว และ PP ใส"
        ),
        category="สติ๊กเกอร์และฉลากสินค้า",
        source_dir="sticker-label-v1",
        pricing_id="sticker-label",
        material="สติ๊กเกอร์กระดาษ / PP ขาว / PP ใส",
        quantity="ประมาณ 1,000 ดวง",
        application="ฉลากแบรนด์ ฉลากข้อมูลสินค้า และซีลบรรจุภัณฑ์",
        alt_texts=(
            "ภาพแนะนำสติ๊กเกอร์และฉลากหลายรูปทรงบนม้วนและแผ่น",
            "ภาพแนะนำฉลากติดบนขวดและกระปุกแก้วสีชาโดยไม่มีตราสินค้า",
            "ภาพแนะนำวัสดุสติ๊กเกอร์กระดาษ PP ขาว และ PP ใส",
            "ภาพแนะนำระยะใกล้ของฉลากไดคัทหลายวัสดุพร้อมหยดน้ำและมุมลอก",
        ),
    ),
    ProjectSeed(
        item_id="generated-brand-print-media-v1",
        slug="brand-print-media-v1",
        title="โบรชัวร์ คู่มือ และสื่อสิ่งพิมพ์แบรนด์",
        summary=(
            "ตัวอย่างชุดสื่อสิ่งพิมพ์ที่แสดงความต่างของขนาด จำนวนหน้า "
            "การพับ และการเข้าเล่ม เพื่อช่วยเตรียม brief ก่อนประเมินงาน"
        ),
        category="งานพิมพ์สื่อแบรนด์",
        source_dir="brand-print-media-v1",
        pricing_id="brand-print-media",
        material="กระดาษอาร์ตหรือกระดาษไม่เคลือบตามรูปแบบงาน",
        quantity="โบรชัวร์หรือแผ่นพับ A4 ประมาณ 500 ชิ้น",
        application="โบรชัวร์ แผ่นพับ ใบปลิว คู่มือ และแคตตาล็อก",
        alt_texts=(
            "ภาพแนะนำโบรชัวร์ แผ่นพับ และคู่มือในชุดสีเดียวกัน",
            "ภาพแนะนำแผ่นพิมพ์ โบรชัวร์พับ และคู่มือเปิดหน้า",
            "ภาพแนะนำระยะใกล้ของรอยพับ ขอบตัด และสันเย็บมุงหลัง",
            "ภาพแนะนำมุมบนของโบรชัวร์ แผ่นพับ คู่มือ และแคตตาล็อก",
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
    {
        "id": "sticker-label",
        "label": "สติ๊กเกอร์และฉลากสินค้า",
        "category": "สติ๊กเกอร์และฉลากสินค้า",
        "starting_price_min_satang": 50,
        "starting_price_max_satang": None,
        "benchmark_min_satang": 50,
        "benchmark_max_satang": 500,
        "benchmark_open_ended": False,
        "unit": "ชิ้น",
        "quantity_basis": "ประมาณ 1,000 ดวง",
        "material": "สติ๊กเกอร์กระดาษ / PP ขาว / PP ใส",
    },
    {
        "id": "brand-print-media",
        "label": "งานพิมพ์สื่อแบรนด์",
        "category": "งานพิมพ์สื่อแบรนด์",
        "starting_price_min_satang": 800,
        "starting_price_max_satang": None,
        "benchmark_min_satang": 800,
        "benchmark_max_satang": 2800,
        "benchmark_open_ended": False,
        "unit": "ชิ้น",
        "quantity_basis": "โบรชัวร์หรือแผ่นพับ A4 ประมาณ 500 ชิ้น",
        "material": "กระดาษอาร์ตหรือกระดาษไม่เคลือบตามรูปแบบงาน",
    },
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed approved Gallery concept records")
    parser.add_argument("--project", required=True)
    parser.add_argument("--database", required=True)
    parser.add_argument("--bucket", required=True)
    parser.add_argument("--public-api-url", default="http://localhost:8000")
    parser.add_argument("--asset-root", type=Path)
    parser.add_argument("--local-media-root", type=Path)
    parser.add_argument(
        "--only-project",
        action="append",
        choices=[project.slug for project in PROJECTS],
        default=[],
        help="Seed only the selected project slug; repeat for multiple projects",
    )
    parser.add_argument(
        "--skip-pricing",
        action="store_true",
        help="Do not write pricing benchmark documents",
    )
    parser.add_argument("--apply", action="store_true")
    parser.add_argument(
        "--confirm-target",
        help="Required with --apply; must exactly equal PROJECT/DATABASE/BUCKET.",
    )
    return parser.parse_args()


def guard_targets(args: argparse.Namespace) -> str:
    actual = (args.project, args.database, args.bucket)
    environment = APPROVED_TARGETS.get(actual)
    if environment is None:
        raise SystemExit(f"refusing unapproved target: {actual}")
    target = "/".join(actual)
    if args.apply and args.confirm_target != target:
        raise SystemExit(f"--confirm-target must exactly equal {target}")
    return environment


def plan(args: argparse.Namespace, environment: str) -> None:
    repository_root = Path(__file__).resolve().parents[3]
    asset_root = args.asset_root or repository_root / "assets" / "gallery-source"
    selected_slugs = set(args.only_project)
    selected_projects = tuple(
        project for project in PROJECTS if not selected_slugs or project.slug in selected_slugs
    )
    for project in selected_projects:
        source_files = sorted((asset_root / project.source_dir).glob("*.png"))
        if len(source_files) != len(project.alt_texts):
            raise SystemExit(f"expected {len(project.alt_texts)} images in {project.source_dir}")
    selected_pricing_ids = {project.pricing_id for project in selected_projects}
    price_count = 0 if args.skip_pricing else len(selected_pricing_ids)
    print(
        json.dumps(
            {
                "mode": "plan",
                "environment": environment,
                "target": f"{args.project}/{args.database}/{args.bucket}",
                "gallery_items": len(selected_projects),
                "pricing_benchmarks": price_count,
                "media_assets": sum(len(project.alt_texts) for project in selected_projects),
                "slugs": [project.slug for project in selected_projects],
            },
            ensure_ascii=False,
        )
    )


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


def seed(args: argparse.Namespace, environment: str) -> None:
    repository_root = Path(__file__).resolve().parents[3]
    asset_root = args.asset_root or repository_root / "assets" / "gallery-source"
    local_media_root = args.local_media_root
    now = datetime.now(UTC)
    actor = f"seed-gallery-{environment}"
    public_api_url = args.public_api_url.rstrip("/")
    gcs = storage.Client(project=args.project)
    bucket = gcs.bucket(args.bucket)
    database = firestore.Client(project=args.project, database=args.database)
    batch = database.batch()
    selected_slugs = set(args.only_project)
    selected_projects = tuple(
        project for project in PROJECTS if not selected_slugs or project.slug in selected_slugs
    )
    selected_pricing_ids = {project.pricing_id for project in selected_projects}
    selected_prices = (
        ()
        if args.skip_pricing
        else tuple(
            price for price in PRICING if not selected_slugs or price["id"] in selected_pricing_ids
        )
    )

    for price in selected_prices:
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

    for project in selected_projects:
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
            "entity_type": "gallery_concept_dataset",
            "entity_id": ",".join(project.slug for project in selected_projects),
            "created_at": now,
        },
    )
    batch.commit()
    print(
        f"seeded {len(selected_projects)} gallery projects and "
        f"{len(selected_prices)} prices into {args.database}"
    )


if __name__ == "__main__":
    arguments = parse_args()
    target_environment = guard_targets(arguments)
    if arguments.apply:
        seed(arguments, target_environment)
    else:
        plan(arguments, target_environment)
