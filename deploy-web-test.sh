#!/usr/bin/env bash
set -Eeuo pipefail

# Backward-compatible alias. Prefer ./deploy_web_test.sh.
DDBOX_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if (($# > 0)) && [[ "$1" != -* ]]; then
  DDBOX_LEGACY_TAG="$1"
  shift
  exec "$DDBOX_REPO_ROOT/deploy_web_test.sh" --tag "$DDBOX_LEGACY_TAG" "$@"
fi
exec "$DDBOX_REPO_ROOT/deploy_web_test.sh" "$@"
