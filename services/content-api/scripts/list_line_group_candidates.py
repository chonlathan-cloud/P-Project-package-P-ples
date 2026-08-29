from __future__ import annotations

import argparse
from datetime import datetime

from google.cloud import firestore


def main() -> None:
    parser = argparse.ArgumentParser(
        description="List LINE group candidates without exposing complete LINE group IDs."
    )
    parser.add_argument("--project", required=True)
    parser.add_argument("--database", required=True)
    args = parser.parse_args()

    client = firestore.Client(project=args.project, database=args.database)
    candidates = list(client.collection("line_notification_targets").limit(100).stream())
    candidates.sort(
        key=lambda snapshot: str((snapshot.to_dict() or {}).get("last_seen_at", "")),
        reverse=True,
    )
    if not candidates:
        print("No LINE group candidates found.")
        return

    for snapshot in candidates:
        data = snapshot.to_dict() or {}
        group_id = str(data.get("group_id", ""))
        masked = f"{group_id[:4]}…{group_id[-4:]}" if len(group_id) >= 8 else "invalid"
        last_seen = data.get("last_seen_at")
        if isinstance(last_seen, datetime):
            last_seen = last_seen.isoformat()
        print(
            f"candidate={snapshot.id} group={masked} status={data.get('status', 'unknown')} "
            f"event={data.get('event_type', 'unknown')} last_seen={last_seen}"
        )


if __name__ == "__main__":
    main()
