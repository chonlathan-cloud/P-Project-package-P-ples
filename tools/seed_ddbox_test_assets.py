#!/usr/bin/env python3
"""Idempotently seed approved DD Box generated assets into a selected GCP environment."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from google.cloud import firestore, storage
from PIL import Image

ASSETS = (
    {
        "id": "hero-print-production-v2",
        "title": "ภาพจำลองพื้นที่ผลิตสำหรับหน้าแรก",
        "alt": "ภาพจำลองพื้นที่ผลิตสิ่งพิมพ์และเครื่องพิมพ์ออฟเซ็ต",
        "category": "site-hero",
    },
    {
        "id": "cosmetic-folding-carton-v2",
        "title": "แนวทางกล่องกระดาษพับสำหรับสินค้าอุปโภค",
        "alt": "ภาพจำลองกล่องกระดาษพับสามขนาดในโทนครีม เหลือง ดำ และแดง โดยไม่มีตราสินค้า",
        "category": "folding-carton",
        "summary": "ภาพจำลองเพื่ออธิบายสัดส่วนกล่อง การเปิดใช้งาน และแนวทางจัดระบบกราฟิกก่อนเริ่มทำอาร์ตเวิร์กจริง",
    },
    {
        "id": "corrugated-structure-v2",
        "title": "แนวทางโครงสร้างกล่องลูกฟูกและชิ้นรองสินค้า",
        "alt": "ภาพจำลองกล่องลูกฟูกสีน้ำตาลสามโครงสร้างพร้อมชิ้นรองไดคัท โดยไม่มีตราสินค้า",
        "category": "corrugated",
        "summary": "ภาพจำลองกล่องฝาชน กล่องเมลเลอร์ และชิ้นรองไดคัทสำหรับคุยเรื่องการบรรจุและการป้องกันสินค้า",
    },
    {
        "id": "premium-die-cut-v2",
        "title": "แนวทางกล่องไดคัทพร้อมชิ้นรองเฉพาะสินค้า",
        "alt": "ภาพจำลองกล่องไดคัทสีครีมที่เปิดให้เห็นชิ้นรองภายใน คู่กับปลอกกล่องลายเรขาคณิต",
        "category": "die-cut",
        "summary": "ภาพจำลองเพื่ออธิบายกลไกเปิดปิด ชิ้นรอง และพื้นที่พิมพ์ของกล่องโครงสร้างเฉพาะ",
    },
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def upload_object(
    bucket: storage.Bucket,
    path: Path,
    object_name: str,
    content_type: str,
    checksum: str,
) -> None:
    blob = bucket.blob(object_name)
    if blob.exists():
        blob.reload()
        if (blob.metadata or {}).get("sha256") != checksum:
            raise RuntimeError(f"existing object checksum mismatch: gs://{bucket.name}/{object_name}")
        return
    blob.cache_control = "public, max-age=31536000, immutable"
    blob.metadata = {
        "sha256": checksum,
        "source": "openai-imagegen",
        "asset_version": "v2",
    }
    blob.upload_from_filename(
        path,
        content_type=content_type,
        if_generation_match=0,
    )


def create_if_absent(
    batch: firestore.WriteBatch,
    reference: firestore.DocumentReference,
    payload: dict[str, Any],
) -> bool:
    snapshot = reference.get()
    if snapshot.exists:
        existing = snapshot.to_dict() or {}
        if existing.get("asset_version") != payload.get("asset_version"):
            raise RuntimeError(f"refusing to overwrite existing document: {reference.path}")
        return False
    batch.create(reference, payload)
    return True


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", required=True)
    parser.add_argument("--database", required=True)
    parser.add_argument("--bucket", required=True)
    parser.add_argument(
        "--asset-dir",
        type=Path,
        default=Path("public/images/generated"),
    )
    args = parser.parse_args()

    storage_client = storage.Client(project=args.project)
    bucket = storage_client.bucket(args.bucket)
    if not bucket.exists():
        raise RuntimeError(f"bucket does not exist: {args.bucket}")

    db = firestore.Client(project=args.project, database=args.database)
    now = datetime.now(UTC)
    records: list[dict[str, Any]] = []

    for asset in ASSETS:
        asset_id = str(asset["id"])
        webp = args.asset_dir / f"{asset_id}.webp"
        jpeg = args.asset_dir / f"{asset_id}.jpg"
        if not webp.is_file() or not jpeg.is_file():
            raise RuntimeError(f"missing local variants for {asset_id}")
        with Image.open(webp) as image:
            width, height = image.size
        webp_checksum = sha256(webp)
        jpeg_checksum = sha256(jpeg)
        prefix = f"site-assets/v2/{asset_id}"
        upload_object(bucket, webp, f"{prefix}/image.webp", "image/webp", webp_checksum)
        upload_object(bucket, jpeg, f"{prefix}/image.jpg", "image/jpeg", jpeg_checksum)
        record = {
            **asset,
            "asset_version": "v2",
            "source": "ai-generated",
            "disclosure": "ภาพจำลองเพื่อการนำเสนอ ไม่ใช่ภาพผลงานลูกค้าจริง",
            "width": width,
            "height": height,
            "local_url": f"/images/generated/{asset_id}.webp",
            "local_fallback_url": f"/images/generated/{asset_id}.jpg",
            "gcs_webp_uri": f"gs://{args.bucket}/{prefix}/image.webp",
            "gcs_jpeg_uri": f"gs://{args.bucket}/{prefix}/image.jpg",
            "webp_sha256": webp_checksum,
            "jpeg_sha256": jpeg_checksum,
            "created_at": now,
            "approved_for_test": True,
        }
        metadata = json.dumps(record, ensure_ascii=False, default=str, indent=2).encode()
        metadata_checksum = hashlib.sha256(metadata).hexdigest()
        metadata_blob = bucket.blob(f"{prefix}/metadata.json")
        if not metadata_blob.exists():
            metadata_blob.metadata = {
                "sha256": metadata_checksum,
                "source": "openai-imagegen",
                "asset_version": "v2",
            }
            metadata_blob.upload_from_string(
                metadata,
                content_type="application/json; charset=utf-8",
                if_generation_match=0,
            )
        records.append(record)

    batch = db.batch()
    writes = 0
    for record in records:
        reference = db.collection("site_assets").document(str(record["id"]))
        writes += int(create_if_absent(batch, reference, record))

    for record in records[1:]:
        item_id = f"generated-{record['id']}"
        slug = str(record["id"])
        gallery_payload = {
            "id": item_id,
            "slug": slug,
            "locale": "th",
            "title": record["title"],
            "summary": record["summary"],
            "category": f"ภาพจำลอง · {record['category']}",
            "image": {
                "id": record["id"],
                "url": record["local_url"],
                "fallback_url": record["local_fallback_url"],
                "width": record["width"],
                "height": record["height"],
                "alt": record["alt"],
            },
            "customer_permission": True,
            "status": "published",
            "version": 1,
            "created_at": now,
            "updated_at": now,
            "published_at": now,
            "created_by": "codex:imagegen",
            "updated_by": "codex:imagegen",
        }
        writes += int(
            create_if_absent(
                batch,
                db.collection("gallery_items").document(item_id),
                gallery_payload,
            )
        )
        writes += int(
            create_if_absent(
                batch,
                db.collection("gallery_slugs").document(slug),
                {"item_id": item_id, "asset_version": "v2"},
            )
        )

    audit_payload = {
        "actor_uid": "codex:imagegen",
        "action": "seed_generated_assets",
        "entity_type": "site_asset_set",
        "entity_id": "v2",
        "created_at": now,
        "asset_version": "v2",
    }
    writes += int(
        create_if_absent(
            batch,
            db.collection("audit_logs").document("seed-generated-assets-v2"),
            audit_payload,
        )
    )
    if writes:
        batch.commit()

    print(
        json.dumps(
            {
                "project": args.project,
                "database": args.database,
                "bucket": args.bucket,
                "assets": len(records),
                "firestore_writes": writes,
                "status": "seeded" if writes else "already-current",
            }
        )
    )


if __name__ == "__main__":
    main()
