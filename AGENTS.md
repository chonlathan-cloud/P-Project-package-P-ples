# Repository instructions

- Read `action-plan.md` before changing architecture, scope, data contracts, security, or deployment behavior.
- `DESIGN.md` is the only design-system authority. `Package/DESIGN.md` and `SKILLS.md` are retained historical sources, not implementation guidance.
- For new or materially changed frontend pages, use `$ui-ux-review` in Critique Mode before implementation, Implementation Plan Mode before editing, and Final Review Mode before completion.
- Do not route backend, API, data, infrastructure, or operational work through `$ui-ux-review`.
- The public web uses Next.js App Router and TypeScript. The content API uses Python, FastAPI, and Pydantic.
- Keep domain logic independent from HTTP handlers and infrastructure adapters. Browser code must not write directly to Firestore.
- Keep environment-specific project IDs, database names, buckets, domains, API URLs, and secrets out of application modules.
- Treat Thai as the primary locale. Do not add English routes until complete reviewed translations exist.
- Do not publish unverified claims, prices, lead times, customer branding, testimonials, addresses, or contact details.
- Add or update focused tests for meaningful behavior changes and report only commands actually run.

