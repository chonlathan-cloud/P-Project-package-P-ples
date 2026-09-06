#!/usr/bin/env bash
set -Eeuo pipefail

DDBOX_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$DDBOX_REPO_ROOT/deploy-ddbox.sh" api test "$@"
