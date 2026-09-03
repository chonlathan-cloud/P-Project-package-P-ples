from __future__ import annotations

import argparse
from datetime import UTC, datetime
from typing import Any

from google.cloud import firestore
from seed_gallery_test import DATABASE, DISCLAIMER, PRICING, PROJECT_ID

TARGET_IDS = {"sticker-label", "brand-print-media"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Upsert the two approved product pricing benchmarks into test Firestore"
    )
    parser.add_argument("--project", required=True)
    parser.add_argument("--database", required=True)
    parser.add_argument("--apply", action="store_true")
    return parser.parse_args()


def guard_test_target(args: argparse.Namespace) -> None:
    if (args.project, args.database) != (PROJECT_ID, DATABASE):
        raise SystemExit(
            f"refusing non-test target: expected {(PROJECT_ID, DATABASE)}, "
            f"received {(args.project, args.database)}"
        )


def main() -> None:
    args = parse_args()
    guard_test_target(args)
    records = [price for price in PRICING if price["id"] in TARGET_IDS]
    if {record["id"] for record in records} != TARGET_IDS:
        raise SystemExit("approved pricing records are missing from the seed source")

    print(
        f"target project={args.project} database={args.database} "
        f"documents={','.join(sorted(TARGET_IDS))}"
    )
    if not args.apply:
        print("dry run only; pass --apply to write the two documents")
        return

    client = firestore.Client(project=args.project, database=args.database)
    now = datetime.now(UTC)
    actor = "upsert-product-pricing-test"
    batch = client.batch()

    for record in records:
        reference = client.collection("pricing_benchmarks").document(record["id"])
        snapshot = reference.get()
        existing: dict[str, Any] = snapshot.to_dict() or {}
        payload: dict[str, Any] = {
            **record,
            "locale": "th",
            "disclaimer": DISCLAIMER,
            "status": "published",
            "version": int(existing.get("version", 0)) + 1,
            "created_at": existing.get("created_at", now),
            "updated_at": now,
            "published_at": now,
            "created_by": existing.get("created_by", actor),
            "updated_by": actor,
        }
        batch.set(reference, payload)

    batch.commit()
    print("upsert complete")


if __name__ == "__main__":
    main()
