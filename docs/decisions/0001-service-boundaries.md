# ADR 0001: Separate web rendering from content writes

Status: accepted for the first implementation slice

## Decision

Run two independently deployable Cloud Run services:

- `ddbox-web`: Next.js App Router and TypeScript; public SSR/SSG/ISR plus admin UI; read-only published-content access.
- `ddbox-content-api`: Python 3.13, FastAPI, and Pydantic; owns validation, Firebase admin authorization, content mutations, media finalization, leads, idempotency, and audit behavior.

The browser must never write directly to Firestore. Admin browser calls carry a Firebase ID token to the Python API, where `admin=true` is enforced. Environment-specific project, database, bucket, service URL, and domain values remain configuration.

## Consequences

- The public renderer does not require content-write IAM, reducing blast radius.
- API and web contracts cross a network boundary and require versioning, revalidation, observability, and integration tests.
- Type definitions are not shared across Python and TypeScript by source import; OpenAPI-based client generation may be added after contracts stabilize.
- Local media storage is an adapter for the vertical slice only. The production adapter uses private Cloud Storage with signed direct uploads and API-served immutable variants; its bucket, IAM, secrets, and CORS configuration must exist before deployment.

## Rejected alternative

A single Next.js service would reduce initial deployment count but would combine public rendering and content mutation permissions. That increased blast radius is not justified by the current architecture goals.
