#!/usr/bin/env bash

set -Eeuo pipefail

DDBOX_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DDBOX_PROJECT_ID="the49-487609"
DDBOX_REGION="asia-southeast1"
DDBOX_SOURCE_BUCKET="gs://the49-487609-ddbox-build/source"
DDBOX_REGISTRY="asia-southeast1-docker.pkg.dev/the49-487609/ddbox"
DDBOX_SERVICE_KIND="${1:-}"
DDBOX_ENVIRONMENT="${2:-}"

if [[ -z "$DDBOX_SERVICE_KIND" || -z "$DDBOX_ENVIRONMENT" ]]; then
  echo "Usage: $0 <web|api> <test|prod> [--dry-run] [--yes] [--tag TAG]" >&2
  exit 2
fi
shift 2

DDBOX_DRY_RUN="false"
DDBOX_ASSUME_YES="false"
DDBOX_IMAGE_TAG=""

while (($# > 0)); do
  case "$1" in
    --dry-run)
      DDBOX_DRY_RUN="true"
      shift
      ;;
    --yes)
      DDBOX_ASSUME_YES="true"
      shift
      ;;
    --tag)
      if (($# < 2)); then
        echo "--tag requires a value" >&2
        exit 2
      fi
      DDBOX_IMAGE_TAG="$2"
      shift 2
      ;;
    -h | --help)
      echo "Usage: $0 <web|api> <test|prod> [--dry-run] [--yes] [--tag TAG]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

case "$DDBOX_SERVICE_KIND" in
  web | api) ;;
  *)
    echo "Service must be web or api" >&2
    exit 2
    ;;
esac

case "$DDBOX_ENVIRONMENT" in
  test | prod) ;;
  *)
    echo "Environment must be test or prod" >&2
    exit 2
    ;;
esac

if [[ -z "$DDBOX_IMAGE_TAG" ]]; then
  DDBOX_IMAGE_TAG="${DDBOX_ENVIRONMENT}-${DDBOX_SERVICE_KIND}-$(date -u +%Y%m%d-%H%M%S)"
fi

if [[ ! "$DDBOX_IMAGE_TAG" =~ ^[a-z0-9][a-z0-9._-]{0,127}$ ]]; then
  echo "Invalid image tag: $DDBOX_IMAGE_TAG" >&2
  exit 2
fi

if [[ "$DDBOX_DRY_RUN" == "true" ]]; then
  if [[ "$DDBOX_ENVIRONMENT" == "prod" ]]; then
    DDBOX_MUTATION="build-candidate-verify-promote"
  else
    DDBOX_MUTATION="build-and-deploy"
  fi
  echo "DD Box deployment plan"
  echo "mode=$DDBOX_ENVIRONMENT service=$DDBOX_SERVICE_KIND mutation=$DDBOX_MUTATION"
  echo "project=$DDBOX_PROJECT_ID region=$DDBOX_REGION image_tag=$DDBOX_IMAGE_TAG"
  exit 0
fi

require_commands() {
  local DDBOX_COMMAND
  for DDBOX_COMMAND in "$@"; do
    if ! command -v "$DDBOX_COMMAND" >/dev/null 2>&1; then
      echo "Required command not found: $DDBOX_COMMAND" >&2
      exit 1
    fi
  done
}

confirm_exact() {
  local DDBOX_EXPECTED="$1"
  local DDBOX_PROMPT="$2"
  local DDBOX_ANSWER

  if [[ "$DDBOX_ASSUME_YES" == "true" ]]; then
    return 0
  fi
  if [[ ! -t 0 ]]; then
    echo "Production deployment requires an interactive terminal or --yes." >&2
    exit 2
  fi
  read -r -p "$DDBOX_PROMPT" DDBOX_ANSWER
  if [[ "$DDBOX_ANSWER" != "$DDBOX_EXPECTED" ]]; then
    echo "Deployment cancelled."
    exit 2
  fi
}

smoke_web() {
  local DDBOX_BASE_URL="$1"
  local DDBOX_TARGET_ENVIRONMENT="$2"
  local DDBOX_ROBOTS
  local DDBOX_HOME

  curl --silent --show-error --fail --max-time 30 "$DDBOX_BASE_URL/" >/dev/null || return 1
  curl --silent --show-error --fail --max-time 30 "$DDBOX_BASE_URL/admin" >/dev/null || return 1
  DDBOX_ROBOTS="$(curl --silent --show-error --fail --max-time 30 "$DDBOX_BASE_URL/robots.txt")" || return 1

  if [[ "$DDBOX_TARGET_ENVIRONMENT" == "prod" ]]; then
    grep -Fq "Allow: /" <<<"$DDBOX_ROBOTS" || return 1
    grep -Fq "Sitemap: https://www.ddboxprinting.com/sitemap.xml" <<<"$DDBOX_ROBOTS" || return 1
    DDBOX_HOME="$(curl --silent --show-error --fail --max-time 30 "$DDBOX_BASE_URL/")" || return 1
    grep -Fq "https://www.ddboxprinting.com" <<<"$DDBOX_HOME" || return 1
  else
    grep -Fq "Disallow: /" <<<"$DDBOX_ROBOTS" || return 1
  fi
}

smoke_api() {
  local DDBOX_BASE_URL="$1"
  curl --silent --show-error --fail --max-time 30 "$DDBOX_BASE_URL/health" | grep -Fq '"status":"ok"' || return 1
  curl --silent --show-error --fail --max-time 30 "$DDBOX_BASE_URL/ready" | grep -Fq '"status":"ready"' || return 1
}

smoke_service() {
  local DDBOX_BASE_URL="$1"
  local DDBOX_TARGET_ENVIRONMENT="$2"
  if [[ "$DDBOX_SERVICE_KIND" == "web" ]]; then
    smoke_web "$DDBOX_BASE_URL" "$DDBOX_TARGET_ENVIRONMENT"
  else
    smoke_api "$DDBOX_BASE_URL"
  fi
}

resolve_firebase_config() {
  local DDBOX_FIREBASE_APP_NAME="$1"
  local DDBOX_ACCESS_TOKEN
  local DDBOX_APPS_JSON

  DDBOX_ACCESS_TOKEN="$(gcloud auth print-access-token)"
  DDBOX_APPS_JSON="$(
    curl --silent --show-error --fail \
      -H "Authorization: Bearer ${DDBOX_ACCESS_TOKEN}" \
      -H "x-goog-user-project: ${DDBOX_PROJECT_ID}" \
      "https://firebase.googleapis.com/v1beta1/projects/${DDBOX_PROJECT_ID}/webApps"
  )"
  DDBOX_FIREBASE_APP_ID="$(
    jq -er --arg app_name "$DDBOX_FIREBASE_APP_NAME" \
      'first(.apps[] | select(.displayName == $app_name and .state == "ACTIVE") | .appId)' \
      <<<"$DDBOX_APPS_JSON"
  )"
  DDBOX_FIREBASE_CONFIG="$(
    curl --silent --show-error --fail \
      -H "Authorization: Bearer ${DDBOX_ACCESS_TOKEN}" \
      -H "x-goog-user-project: ${DDBOX_PROJECT_ID}" \
      "https://firebase.googleapis.com/v1beta1/projects/-/webApps/${DDBOX_FIREBASE_APP_ID}/config"
  )"
  DDBOX_FIREBASE_API_KEY="$(jq -er '.apiKey | select(type == "string" and length > 0)' <<<"$DDBOX_FIREBASE_CONFIG")"
  DDBOX_FIREBASE_AUTH_DOMAIN="$(jq -er '.authDomain | select(type == "string" and length > 0)' <<<"$DDBOX_FIREBASE_CONFIG")"
  jq -e \
    --arg project_id "$DDBOX_PROJECT_ID" \
    --arg app_id "$DDBOX_FIREBASE_APP_ID" \
    '.projectId == $project_id and .appId == $app_id' \
    <<<"$DDBOX_FIREBASE_CONFIG" >/dev/null
  unset DDBOX_ACCESS_TOKEN DDBOX_APPS_JSON DDBOX_FIREBASE_CONFIG
}

require_commands gcloud curl jq
if [[ "$DDBOX_SERVICE_KIND" == "web" ]]; then
  require_commands npm
else
  require_commands uv
fi

cd "$DDBOX_REPO_ROOT"

DDBOX_ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' | head -1)"
if [[ -z "$DDBOX_ACTIVE_ACCOUNT" ]]; then
  echo "No active gcloud account. Run: gcloud auth login" >&2
  exit 1
fi
gcloud projects describe "$DDBOX_PROJECT_ID" --format='value(projectId)' >/dev/null
echo "Using gcloud account: $DDBOX_ACTIVE_ACCOUNT"

if [[ "$DDBOX_SERVICE_KIND" == "web" ]]; then
  npm test
  npm run typecheck
  npm run lint
  npm run build
else
  (
    cd services/content-api
    uv run ruff check .
    uv run mypy
    uv run pytest
  )
fi

if [[ "$DDBOX_ENVIRONMENT" == "prod" ]]; then
  confirm_exact "DEPLOY" "Type DEPLOY to build a Production candidate: "
fi

if [[ "$DDBOX_SERVICE_KIND" == "web" ]]; then
  if [[ "$DDBOX_ENVIRONMENT" == "prod" ]]; then
    DDBOX_FIREBASE_APP_NAME="ddbox-web-prod"
    DDBOX_SITE_URL="https://www.ddboxprinting.com"
    DDBOX_CONTENT_API_URL="https://ddbox-content-api-prod-439060579730.asia-southeast1.run.app"
    DDBOX_BUILD_CONFIG="deploy/cloudbuild-web-prod.yaml"
    DDBOX_INDEXING="true"
  else
    DDBOX_FIREBASE_APP_NAME="ddbox-web-test"
    DDBOX_SITE_URL="https://ddbox-web-test-439060579730.asia-southeast1.run.app"
    DDBOX_CONTENT_API_URL="https://ddbox-content-api-test-439060579730.asia-southeast1.run.app"
    DDBOX_BUILD_CONFIG="deploy/cloudbuild-web-test.yaml"
    DDBOX_INDEXING="false"
  fi
  resolve_firebase_config "$DDBOX_FIREBASE_APP_NAME"
  echo "Firebase configuration verified for $DDBOX_FIREBASE_APP_NAME."
  gcloud builds submit . \
    --project="$DDBOX_PROJECT_ID" \
    --region="$DDBOX_REGION" \
    --config="$DDBOX_BUILD_CONFIG" \
    --gcs-source-staging-dir="$DDBOX_SOURCE_BUCKET" \
    --substitutions="_IMAGE_TAG=${DDBOX_IMAGE_TAG},_SITE_URL=${DDBOX_SITE_URL},_SITE_INDEXING_ENABLED=${DDBOX_INDEXING},_CONTENT_API_URL=${DDBOX_CONTENT_API_URL},_FIREBASE_API_KEY=${DDBOX_FIREBASE_API_KEY},_FIREBASE_AUTH_DOMAIN=${DDBOX_FIREBASE_AUTH_DOMAIN},_FIREBASE_APP_ID=${DDBOX_FIREBASE_APP_ID}" \
    --quiet
  unset DDBOX_FIREBASE_API_KEY DDBOX_FIREBASE_AUTH_DOMAIN DDBOX_FIREBASE_APP_ID
else
  DDBOX_BUILD_CONFIG="deploy/cloudbuild-content-api-${DDBOX_ENVIRONMENT}.yaml"
  gcloud builds submit . \
    --project="$DDBOX_PROJECT_ID" \
    --region="$DDBOX_REGION" \
    --config="$DDBOX_BUILD_CONFIG" \
    --gcs-source-staging-dir="$DDBOX_SOURCE_BUCKET" \
    --substitutions="_IMAGE_TAG=${DDBOX_IMAGE_TAG}" \
    --quiet
fi

if [[ "$DDBOX_ENVIRONMENT" == "test" ]]; then
  DDBOX_TEST_SERVICE="ddbox-${DDBOX_SERVICE_KIND}-test"
  if [[ "$DDBOX_SERVICE_KIND" == "api" ]]; then
    DDBOX_TEST_SERVICE="ddbox-content-api-test"
  fi
  DDBOX_TEST_URL="$(
    gcloud run services describe "$DDBOX_TEST_SERVICE" \
      --project="$DDBOX_PROJECT_ID" \
      --region="$DDBOX_REGION" \
      --format='value(status.url)'
  )"
  smoke_service "$DDBOX_TEST_URL" test
  echo "Deployment completed and verified: $DDBOX_TEST_URL"
  exit 0
fi

DDBOX_IMAGE_NAME="$DDBOX_SERVICE_KIND"
if [[ "$DDBOX_SERVICE_KIND" == "api" ]]; then
  DDBOX_IMAGE_NAME="content-api"
fi
DDBOX_TAGGED_IMAGE="${DDBOX_REGISTRY}/${DDBOX_IMAGE_NAME}:${DDBOX_IMAGE_TAG}"
DDBOX_DIGEST="$(
  gcloud artifacts docker images describe "$DDBOX_TAGGED_IMAGE" \
    --project="$DDBOX_PROJECT_ID" \
    --format='value(image_summary.digest)'
)"
if [[ ! "$DDBOX_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]]; then
  echo "Could not resolve an immutable image digest." >&2
  exit 1
fi
DDBOX_IMMUTABLE_IMAGE="${DDBOX_REGISTRY}/${DDBOX_IMAGE_NAME}@${DDBOX_DIGEST}"

if [[ "$DDBOX_SERVICE_KIND" == "web" ]]; then
  DDBOX_PROD_SERVICE="ddbox-web-prod"
  DDBOX_RUNTIME_IDENTITY="ddbox-web-prod@the49-487609.iam.gserviceaccount.com"
  DDBOX_ENV_FILE="deploy/cloudrun-web-prod.env.yaml"
  DDBOX_SECRET_FLAGS="CONTENT_API_REVALIDATION_TOKEN=ddbox-prod-web-revalidation-token:latest"
  DDBOX_PROD_URL="https://www.ddboxprinting.com"
else
  DDBOX_PROD_SERVICE="ddbox-content-api-prod"
  DDBOX_RUNTIME_IDENTITY="ddbox-api-prod@the49-487609.iam.gserviceaccount.com"
  DDBOX_ENV_FILE="deploy/cloudrun-content-api-prod.env.yaml"
  DDBOX_SECRET_FLAGS="DDBOX_MEDIA_TOKEN_KEY=ddbox-prod-media-token-key:latest,DDBOX_WEB_REVALIDATION_TOKEN=ddbox-prod-web-revalidation-token:latest,DDBOX_LINE_CHANNEL_ACCESS_TOKEN=ddbox-line-channel-access-token:latest,DDBOX_LINE_CHANNEL_SECRET=ddbox-line-channel-secret:latest,DDBOX_LINE_NOTIFICATION_TARGET_ID=ddbox-line-notification-target-id:latest"
  DDBOX_PROD_URL="https://ddbox-content-api-prod-439060579730.asia-southeast1.run.app"
fi

DDBOX_SERVICE_JSON="$(
  gcloud run services describe "$DDBOX_PROD_SERVICE" \
    --project="$DDBOX_PROJECT_ID" \
    --region="$DDBOX_REGION" \
    --format=json
)"
DDBOX_ROLLBACK_REVISION="$(
  jq -er 'first(.status.traffic[] | select((.percent // 0) == 100) | .revisionName) // .status.latestReadyRevisionName' \
    <<<"$DDBOX_SERVICE_JSON"
)"
DDBOX_CANDIDATE_TAG="deploy-${DDBOX_SERVICE_KIND}-candidate"

gcloud run deploy "$DDBOX_PROD_SERVICE" \
  --project="$DDBOX_PROJECT_ID" \
  --region="$DDBOX_REGION" \
  --platform=managed \
  --image="$DDBOX_IMMUTABLE_IMAGE" \
  --service-account="$DDBOX_RUNTIME_IDENTITY" \
  --env-vars-file="$DDBOX_ENV_FILE" \
  --update-secrets="$DDBOX_SECRET_FLAGS" \
  --no-traffic \
  --tag="$DDBOX_CANDIDATE_TAG" \
  --no-invoker-iam-check \
  --labels=application=ddbox,environment=prod,managed-by=cloud-build \
  --quiet

DDBOX_SERVICE_JSON="$(
  gcloud run services describe "$DDBOX_PROD_SERVICE" \
    --project="$DDBOX_PROJECT_ID" \
    --region="$DDBOX_REGION" \
    --format=json
)"
DDBOX_CANDIDATE_REVISION="$(jq -er '.status.latestCreatedRevisionName' <<<"$DDBOX_SERVICE_JSON")"
DDBOX_CANDIDATE_URL="$(
  jq -er --arg tag "$DDBOX_CANDIDATE_TAG" \
    'first(.status.traffic[] | select(.tag == $tag) | .url)' \
    <<<"$DDBOX_SERVICE_JSON"
)"

smoke_service "$DDBOX_CANDIDATE_URL" prod
echo "Candidate verified: $DDBOX_CANDIDATE_REVISION"
confirm_exact "PROMOTE" "Type PROMOTE to route 100% of Production traffic to this candidate: "

gcloud run services update-traffic "$DDBOX_PROD_SERVICE" \
  --project="$DDBOX_PROJECT_ID" \
  --region="$DDBOX_REGION" \
  --to-revisions="${DDBOX_CANDIDATE_REVISION}=100" \
  --quiet

if ! smoke_service "$DDBOX_PROD_URL" prod; then
  echo "Post-deploy smoke test failed; restoring $DDBOX_ROLLBACK_REVISION." >&2
  gcloud run services update-traffic "$DDBOX_PROD_SERVICE" \
    --project="$DDBOX_PROJECT_ID" \
    --region="$DDBOX_REGION" \
    --to-revisions="${DDBOX_ROLLBACK_REVISION}=100" \
    --quiet
  exit 1
fi

echo "Production deployment completed: $DDBOX_CANDIDATE_REVISION"
echo "Rollback revision: $DDBOX_ROLLBACK_REVISION"
