#!/usr/bin/env bash
set -euo pipefail

stitch_mcp_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export STITCH_API_KEY
STITCH_API_KEY="$(gcloud secrets versions access latest \
  --secret=STITCH-API-KEY \
  --project=the49-487609)"

exec node "${stitch_mcp_dir}/server.mjs"
