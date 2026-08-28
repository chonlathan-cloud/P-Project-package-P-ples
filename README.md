# DD Box Printing website

Thai-first marketing website, structured content CMS, and quote-lead pipeline for DD Box Printing.

## Architecture

- Web: Next.js App Router, React, and TypeScript (`src/`)
- Content API: Python 3.13, FastAPI, and Pydantic (`services/content-api/`)
- Target runtime: separate Cloud Run services
- Target data: a dedicated named Firestore database and Cloud Storage bucket
- Admin auth: Firebase Authentication with server-enforced `admin=true`

See `action-plan.md` for product scope, `DESIGN.md` for the canonical design system, `docs/decisions/0001-service-boundaries.md` for service-boundary rationale, and `docs/decisions/0002-shared-gcp-project-exception.md` for the approved GCP isolation model.

## Local setup

Requirements: Node.js 24, npm, Python 3.13, and `uv`.

```bash
cp .env.example .env.local
npm install

cd services/content-api
cp .env.example .env
uv sync --all-groups
uv run uvicorn ddbox_api.main:app --reload --port 8000
```

In another terminal from the repository root:

```bash
npm run dev
```

Open `http://localhost:3000`. API docs are available at `http://localhost:8000/docs` outside production.

Admin login remains unavailable until the Firebase client variables and `DDBOX_GCP_PROJECT_ID` are configured and the user has the custom claim `admin=true`. There is no development auth bypass outside `DDBOX_ENVIRONMENT=test`.

### Containers

```bash
docker compose up --build
```

The default Compose configuration uses in-memory API data and secure/unconfigured Firebase auth. It is suitable for public-flow development, not persistence or production.

## Validation

Frontend:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Backend:

```bash
cd services/content-api
uv run ruff format --check .
uv run ruff check .
uv run mypy src
uv run pytest
```

## Repository map

```text
src/app/                       Public/admin routes and web API bridge
src/components/                Shared public UI
src/features/                  Gallery and lead feature modules
services/content-api/          Python API, repositories, services, and tests
infra/                         Terraform bootstrap and shared-project foundation
.agents/skills/ui-ux-review/   Frontend review quality gate
docs/decisions/                Architecture decisions and launch blockers
Package/                       Historical source design/assets; not production output
```

## Security and content boundaries

- Browser code never writes directly to Firestore or Storage.
- Project IDs, database names, buckets, domains, and API URLs are environment configuration.
- Direct Firestore and Firebase Storage client rules deny all access.
- Do not publish existing customer-branded assets until permission is recorded.
- Legal pages remain `noindex`, analytics/advertising are disabled, and unsupported business claims are omitted until the owners listed in `docs/decisions/launch-blockers.md` approve them.
- Local media storage remains local/test only. Production uses private Cloud Storage, ten-minute signed direct uploads, stateless HMAC finalize tokens, decoded-image verification, metadata stripping through re-encoding, and immutable API-served variants.
- The shared-project boundary is accepted, but no GCP resources have been provisioned. Cloud apply requires the explicit staged approvals documented in `infra/README.md`.
