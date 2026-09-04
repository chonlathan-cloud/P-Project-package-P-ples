from __future__ import annotations

import argparse
import json
import sys
from collections import Counter

from pydantic import TypeAdapter

from ddbox_api.domain.models import StructuredContent
from ddbox_api.repositories.firestore import FirestoreContentRepository
from ddbox_api.services.content_migration import StructuredContentMigration
from ddbox_api.services.structured_content import StructuredContentService


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Plan or apply an idempotent structured-content manifest migration."
    )
    parser.add_argument("--project", required=True)
    parser.add_argument("--database", required=True)
    parser.add_argument("--actor", default="migration:public-content-v1")
    parser.add_argument(
        "--confirm-target",
        help="Required with --apply; must exactly equal PROJECT/DATABASE.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write and publish changes. Without this flag the command is read-only.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    target = f"{args.project}/{args.database}"
    if args.apply and args.confirm_target != target:
        raise SystemExit(f"--confirm-target must exactly equal {target}")
    contents = TypeAdapter(list[StructuredContent]).validate_json(sys.stdin.read())
    repository = FirestoreContentRepository(args.project, args.database)
    migration = StructuredContentMigration(StructuredContentService(repository))
    results = migration.apply(contents, args.actor) if args.apply else migration.plan(contents)
    counts = Counter(item.action for item in results)
    print(
        json.dumps(
            {
                "mode": "apply" if args.apply else "plan",
                "total": len(results),
                "actions": dict(sorted(counts.items())),
                "items": [
                    {
                        "kind": item.kind.value,
                        "slug": item.slug,
                        "action": item.action,
                    }
                    for item in results
                ],
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
