#!/usr/bin/env python3
"""Bounded, read-only GCP diagnostics for the Package-ple project."""

from __future__ import annotations

import argparse
import os
import shlex
import shutil
import subprocess
import sys
from typing import Sequence


DEFAULT_PROJECT = "the49-487609"


def run(command: Sequence[str], *, dry_run: bool, timeout: int = 90) -> int:
    print("$ " + shlex.join(command))
    if dry_run:
        return 0
    try:
        completed = subprocess.run(
            command,
            check=False,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout,
        )
    except FileNotFoundError:
        print(f"missing executable: {command[0]}", file=sys.stderr)
        return 127
    except subprocess.TimeoutExpired:
        print(f"command timed out after {timeout}s", file=sys.stderr)
        return 124

    if completed.stdout:
        print(completed.stdout.rstrip())
    if completed.stderr:
        print(completed.stderr.rstrip(), file=sys.stderr)
    return completed.returncode


def gcloud(args: argparse.Namespace, *parts: str) -> list[str]:
    command = ["gcloud", *parts, "--project", args.project]
    if args.format == "json":
        command.append("--format=json")
    return command


def run_all(args: argparse.Namespace, commands: Sequence[Sequence[str]]) -> int:
    result = 0
    for command in commands:
        result = max(result, run(command, dry_run=args.dry_run))
    return result


def context(args: argparse.Namespace) -> int:
    commands = [
        ["gcloud", "auth", "list", "--filter=status:ACTIVE", "--format=value(account)"],
        gcloud(args, "projects", "describe", args.project),
    ]
    return run_all(args, commands)


def inventory(args: argparse.Namespace) -> int:
    commands = [
        gcloud(args, "projects", "describe", args.project),
        gcloud(args, "services", "list", "--enabled"),
        [
            "gcloud",
            "asset",
            "search-all-resources",
            f"--scope=projects/{args.project}",
            f"--limit={args.limit}",
            "--format=json"
            if args.format == "json"
            else "--format=table(assetType,displayName,location,state)",
        ],
    ]
    return run_all(args, commands)


def cloud_run(args: argparse.Namespace) -> int:
    base = ["run", "services"]
    if args.service:
        base.extend(["describe", args.service])
    else:
        base.extend(["list", "--platform=managed"])
    if args.region:
        base.extend(["--region", args.region])
    return run(gcloud(args, *base), dry_run=args.dry_run)


def logs(args: argparse.Namespace) -> int:
    filters = [
        'resource.type="cloud_run_revision"',
        f'resource.labels.service_name="{args.service}"',
    ]
    if args.severity:
        filters.append(f"severity>={args.severity}")
    command = gcloud(
        args,
        "logging",
        "read",
        " AND ".join(filters),
        f"--freshness={args.freshness}",
        f"--limit={args.limit}",
    )
    return run(command, dry_run=args.dry_run)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--project",
        default=os.environ.get("CLOUDSDK_CORE_PROJECT", DEFAULT_PROJECT),
        help=f"GCP project (default: CLOUDSDK_CORE_PROJECT or {DEFAULT_PROJECT})",
    )
    parser.add_argument("--format", choices=("table", "json"), default="table")
    parser.add_argument("--dry-run", action="store_true")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("context")

    inventory_parser = subparsers.add_parser("inventory")
    inventory_parser.add_argument("--limit", type=int, default=200)

    run_parser = subparsers.add_parser("cloud-run")
    run_parser.add_argument("--service")
    run_parser.add_argument("--region")

    logs_parser = subparsers.add_parser("logs")
    logs_parser.add_argument("--service", required=True)
    logs_parser.add_argument("--severity", default="ERROR")
    logs_parser.add_argument("--freshness", default="2h")
    logs_parser.add_argument("--limit", type=int, default=100)

    return parser


def main() -> int:
    args = build_parser().parse_args()
    if not shutil.which("gcloud"):
        print("missing executable: gcloud", file=sys.stderr)
        return 127
    handlers = {
        "context": context,
        "inventory": inventory,
        "cloud-run": cloud_run,
        "logs": logs,
    }
    return handlers[args.command](args)


if __name__ == "__main__":
    raise SystemExit(main())
