#!/usr/bin/env bash

set -euo pipefail

DDBOX_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DDBOX_PROJECT_ID="the49-487609"
DDBOX_REGION="asia-southeast1"
DDBOX_FIREBASE_APP_NAME="ddbox-web-test"
DDBOX_SITE_URL="https://ddbox-web-test-439060579730.asia-southeast1.run.app"
DDBOX_CONTENT_API_URL="https://ddbox-content-api-test-439060579730.asia-southeast1.run.app"
DDBOX_SOURCE_BUCKET="gs://the49-487609-ddbox-build/source"
DDBOX_IMAGE_TAG="${1:-test-$(date -u +%Y%m%d-%H%M%S)}"

for DDBOX_COMMAND in gcloud firebase jq; do
  if ! command -v "$DDBOX_COMMAND" >/dev/null 2>&1; then
    echo "Required command not found: $DDBOX_COMMAND" >&2
    exit 1
  fi
done

if [[ ! "$DDBOX_IMAGE_TAG" =~ ^[a-z0-9][a-z0-9._-]{0,127}$ ]]; then
  echo "Invalid image tag: $DDBOX_IMAGE_TAG" >&2
  exit 1
fi

cd "$DDBOX_REPO_ROOT"

echo "Resolving Firebase configuration for $DDBOX_FIREBASE_APP_NAME..."
DDBOX_FIREBASE_APP_ID="$(
  firebase apps:list \
    --project "$DDBOX_PROJECT_ID" \
    --json |
    jq -er --arg app_name "$DDBOX_FIREBASE_APP_NAME" '
      first(
        .result[]
        | select(.displayName == $app_name and (.platform | ascii_downcase) == "web")
        | .appId
      )
    '
)"

DDBOX_FIREBASE_CONFIG="$(
  firebase apps:sdkconfig WEB "$DDBOX_FIREBASE_APP_ID" \
    --project "$DDBOX_PROJECT_ID" \
    --json
)"
DDBOX_FIREBASE_API_KEY="$(
  printf '%s' "$DDBOX_FIREBASE_CONFIG" |
    jq -er '.result.sdkConfig.apiKey | select(type == "string" and length > 0)'
)"
DDBOX_FIREBASE_AUTH_DOMAIN="$(
  printf '%s' "$DDBOX_FIREBASE_CONFIG" |
    jq -er '.result.sdkConfig.authDomain | select(type == "string" and length > 0)'
)"

printf '%s' "$DDBOX_FIREBASE_CONFIG" |
  jq -e \
    --arg project_id "$DDBOX_PROJECT_ID" \
    --arg app_id "$DDBOX_FIREBASE_APP_ID" '
      .result.sdkConfig.projectId == $project_id and
      .result.sdkConfig.appId == $app_id
    ' >/dev/null || {
      echo "Resolved Firebase configuration does not match the requested test app." >&2
      exit 1
    }

echo "Firebase configuration verified for $DDBOX_FIREBASE_APP_NAME."

echo "Submitting DD Box web test build: $DDBOX_IMAGE_TAG"
gcloud builds submit . \
  --project="$DDBOX_PROJECT_ID" \
  --region="$DDBOX_REGION" \
  --config=deploy/cloudbuild-web-test.yaml \
  --gcs-source-staging-dir="$DDBOX_SOURCE_BUCKET" \
  --substitutions="_IMAGE_TAG=${DDBOX_IMAGE_TAG},_SITE_URL=${DDBOX_SITE_URL},_CONTENT_API_URL=${DDBOX_CONTENT_API_URL},_FIREBASE_API_KEY=${DDBOX_FIREBASE_API_KEY},_FIREBASE_AUTH_DOMAIN=${DDBOX_FIREBASE_AUTH_DOMAIN},_FIREBASE_APP_ID=${DDBOX_FIREBASE_APP_ID}"

echo "Deployment completed: $DDBOX_SITE_URL"
