from __future__ import annotations

import argparse
import re
import subprocess
import sys

from google.cloud import firestore

GROUP_ID_PATTERN = re.compile(r"^C[0-9a-f]{32}$")
CANDIDATE_ID_PATTERN = re.compile(r"^[0-9a-f]{64}$")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Promote a verified LINE group candidate from Firestore into Secret Manager "
            "without printing the group ID. Requires an explicitly reviewed cloud mutation."
        )
    )
    parser.add_argument("--project", required=True)
    parser.add_argument("--database", required=True)
    parser.add_argument("--environment", required=True, choices=("test", "prod"))
    parser.add_argument("--candidate-id", required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not CANDIDATE_ID_PATTERN.fullmatch(args.candidate_id):
        raise SystemExit("candidate ID must be a 64-character lowercase SHA-256 digest")

    client = firestore.Client(project=args.project, database=args.database)
    candidate_ref = client.collection("line_notification_targets").document(args.candidate_id)
    snapshot = candidate_ref.get()
    if not snapshot.exists:
        raise SystemExit("LINE group candidate was not found")
    candidate = snapshot.to_dict() or {}
    group_id = candidate.get("group_id")
    if not isinstance(group_id, str) or not GROUP_ID_PATTERN.fullmatch(group_id):
        raise SystemExit("candidate does not contain a valid LINE group ID")

    secret_id = (
        "ddbox-test-line-notification-target-id"
        if args.environment == "test"
        else "ddbox-line-notification-target-id"
    )
    command = [
        "gcloud",
        "secrets",
        "versions",
        "add",
        secret_id,
        f"--project={args.project}",
        "--data-file=-",
        "--quiet",
    ]
    result = subprocess.run(  # noqa: S603 - fixed executable and validated arguments
        command,
        input=group_id.encode(),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )
    if result.returncode != 0:
        sys.stderr.buffer.write(result.stdout)
        return result.returncode

    candidate_ref.update(
        {
            "status": "active",
            "promoted_at": firestore.SERVER_TIMESTAMP,
            "secret_id": secret_id,
        }
    )
    print(
        f"Promoted candidate {args.candidate_id[:12]}… into {secret_id}; group ID was not printed."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
