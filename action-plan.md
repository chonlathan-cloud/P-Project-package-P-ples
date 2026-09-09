# DD Box Printing Website — Action Plan

Status: implementation in progress; Test is deployed and the Production canonical domain was cut over to the Google HTTPS load balancer on 2026-09-05. `https://www.ddboxprinting.com` is live on Web revision `ddbox-web-prod-00012-per` with indexing enabled, Basic Consent Mode for GTM container `GTM-MWW3HWHR`, the managed certificate active, apex/HTTP redirects verified, and custom-domain API/Media CORS working. Gmail fallback, post-cutover SEO monitoring, and remaining business launch inputs are tracked in `docs/decisions/launch-blockers.md`.
Target: conversion-focused, SEO-ready DD Box Printing website with a structured admin CMS
GCP discovery project: `the49-487609`

## 1. Executive decisions

Use the existing Stitch prototype as visual direction, not as production-ready information architecture or code. Rework the experience around the marketing feedback before implementing pages.

Recommended baseline:

- Build a Thai-first, English-ready website with Next.js App Router and TypeScript.
- Build `ddbox-content-api` with Python, FastAPI, and Pydantic. Python is the required backend language for this project; select a currently supported Python version at implementation time.
- Server-render or pre-render all indexable content. Client-side JavaScript must not be required to discover primary copy, navigation, product links, gallery content, canonical metadata, or structured data.
- Optimize for qualified quote leads, not a full transactional checkout. Do not present an “instant price” unless pricing rules are accurate, approved, and maintainable.
- Support two primary customer paths:
  - customer already has specifications and wants a quote;
  - customer has a product but needs packaging guidance.
- Represent the three commercial offers separately: Starter / Low MOQ, Brand Growth Packaging, and Scale / Recurring Supply.
- Implement a structured CMS for products, gallery work, case studies, FAQs, offers, and global business information. Do not build a free-form page builder in the first release.
- Use Firebase Authentication with no public sign-up and one authorization role: `admin`.
- Keep all writes behind a server-side API that verifies Firebase ID tokens and the `admin` claim. Browser code must not receive direct Firestore write access.
- Use dedicated GCP resources and service accounts for DD Box. Do not reuse existing `spa-*`, `the49-*`, Firestore databases, or buckets without an explicit architecture decision and source ownership review.
- Create the `ui-ux-review` repo skill before page implementation so it can act as a design-quality gate throughout development.

## 2. Source material and authority

Use these sources in this order when they conflict:

1. Approved business/marketing content and factual evidence.
2. [Marketing feedback](https://docs.google.com/document/d/1ooHsZtTDGUaZ47NYDxsjlPQeq3KLMyKAIDLwsxn-UHw/edit) for conversion flow, offer segmentation, claim discipline, forms, and mobile priorities.
3. `DESIGN.md` after it is promoted to the repository root as the canonical design-system document.
4. [Stitch prototype](https://stitch.withgoogle.com/preview/1683649861335380565?node-id=5b9ab2278b1c4ec3b176d4dbf8722efe) for visual direction and existing composition.
5. `Package/FLOW.md` for the original sitemap and product-discovery journey.
6. Current production website content only after factual verification; legacy copy is not automatically authoritative.

The Stitch prototype and current Wix website are references, not code-generation sources. Do not copy placeholder claims, placeholder client names, `href="#"` links, mixed-language labels, or prototype-only assets into production.

## 3. Current-state findings

### Repository

- The repository currently contains design documents and images, but no frontend, backend, test suite, package manifest, deployment configuration, or infrastructure-as-code.
- There is no root `AGENTS.md` or root `DESIGN.md`.
- `Package/DESIGN.md` is the strongest current design source.
- Root `SKILLS.md` contains overlapping and partially stale design guidance. It is not a Codex-discoverable repo skill location and must not remain a second design authority.
- The attachment states that backend/business logic is stable, but that implementation is not present in this repository. No existing API contract can be assumed until its source or specification is linked.
- A repo-scoped GCP operations skill already exists at `.agents/skills/package-ple-gcp-ops/`.

### Prototype

The inspected prototype is a single responsive page with:

- sticky header and quote CTA;
- generic factory hero;
- three product/capability cards;
- three trust statements;
- placeholder client brands;
- footer links.

Observed gaps:

- generic hero message does not identify the target customer or the two customer paths;
- no offer segmentation by order size or business maturity;
- no proof-driven factory, process, case study, review, lead-time, or quality-control sections;
- no quote/consultation form;
- no real navigation destinations;
- no product, gallery, contact, or offer detail routes;
- no mobile sticky actions for form, LINE, and phone;
- no SEO metadata/content model beyond visible prototype copy;
- mixed Thai/English content without an explicit locale strategy.

### Content assets

- Existing product cutouts can seed the gallery after ownership/usage approval, classification, alt text, captions, and optimization.
- Existing factory/machine images are only approximately 265–405 px wide and are not sufficient for a production hero or large proof section.
- The PNG logo is high resolution but should be converted into approved SVG, monochrome, favicon, and social-share variants.
- Product images containing customer branding require permission before publication.
- Placeholder client logos must not ship.

### GCP project

Read-only inspection confirmed:

- Firestore, Firebase/Identity Toolkit, Cloud Run, Cloud Storage, Cloud Asset Inventory, and Secret Manager APIs are enabled.
- Firestore is in `asia-southeast1` and already contains `(default)`, `spa-db`, and `spa-test-db` databases.
- The project already hosts multiple unrelated `spa-*` and `the49-*` Cloud Run services and buckets.
- `STITCH-API-KEY` exists with an enabled version; its payload was not accessed because the prototype was already readable.
- The existing project is a shared failure and IAM boundary. A dedicated production project is preferable.
- Existing Cloud Run metadata exposed at least one credential-like value as a plaintext environment variable in an unrelated service. Do not repeat or reuse it. Track rotation and migration to Secret Manager as a separate security remediation.

## 4. Product scope

### Public routes

| Route | Purpose | Indexing |
| --- | --- | --- |
| `/` | Main conversion landing page | index |
| `/products` | Product/category discovery | index |
| `/products/[slug]` | Product-specific information and quote entry | index when published |
| `/solutions/starter` | Starter / Low MOQ offer | index |
| `/solutions/growth` | Brand Growth Packaging offer | index |
| `/solutions/scale` | Recurring and production-scale offer | index |
| `/gallery` | Filterable portfolio and proof | index |
| `/case-studies/[slug]` | Evidence-backed project story | index when approved |
| `/quote` | Progressive quote/consultation funnel | index only if content is useful beyond the form |
| `/contact` | NAP, map, hours, LINE, phone, email, form | index |
| `/privacy` | Privacy notice | index |
| `/terms` | Service/site terms | index |
| `/thank-you` | Lead confirmation and next steps | noindex |
| `/admin/**` | CMS and lead management | noindex, authenticated |

Do not create thin landing pages only to target keywords. Each indexable route must answer a distinct user intent with unique, useful content and a clear next action.

### Home-page information architecture

Implement this order after copy and evidence are approved:

1. Hero with target-specific headline and the two customer paths.
2. Compact trust bar with factual, provable strengths.
3. Real work/gallery preview.
4. “Who DD Box is for” customer-fit section.
5. Three offer paths by order size/business stage.
6. Box/product categories.
7. Brief-to-delivery process.
8. Mockup/sample risk-reduction explanation.
9. Factory, machinery, team, and quality-control proof.
10. Approved case study/review.
11. Lead-time and delivery coverage with qualified wording.
12. FAQ.
13. Progressive lead form.
14. Contact, LINE, phone, business hours, and factory address.

On mobile, keep persistent but non-obstructive actions for “ส่งข้อมูล”, LINE, and phone. Respect safe-area insets and do not cover form actions or cookie controls.

### Explicit non-goals for the first release

- shopping cart, online payment, inventory, and order fulfillment;
- unrestricted WYSIWYG page builder;
- customer accounts;
- live 3D product configurator;
- AI-written copy published without review;
- automatic pricing before approved pricing rules exist;
- coupling to unrelated Cloud Run services or their data stores.

## 5. Recommended architecture

```text
Search crawler / customer / admin browser
                    |
             HTTPS custom domain
                    |
          +---------+----------+
          |                    |
  ddbox-web (Cloud Run)   ddbox-content-api (Cloud Run)
  Next.js SSR/SSG/ISR     Python / FastAPI / Pydantic
  Public site + admin UI  Lead + admin CRUD APIs and Firebase auth
          |                    |
          | read published     +--- Firestore (content, leads, audit)
          | content            +--- Cloud Storage (media)
          +--------------------+--- Firebase Auth (admin only)
                               +--- Secret Manager
                               +--- Cloud Logging/Monitoring
```

### Service boundaries

`ddbox-web`:

- renders indexable pages and metadata on the server;
- serves the admin UI but performs no direct privileged browser writes;
- uses a read-only runtime identity for published content;
- marks admin, preview, and internal routes `noindex`;
- exposes an authenticated internal cache-revalidation endpoint.

`ddbox-content-api`:

- uses Python with FastAPI for HTTP transport and Pydantic for versioned request, response, and domain-boundary validation;
- owns content validation, draft/publish state, media metadata, lead submission, and audit logging;
- verifies Firebase ID tokens and checks `admin=true` for all admin operations;
- provides a narrowly protected public lead endpoint;
- uses separate runtime identity and least-privilege IAM;
- never returns secret values or raw service-account credentials.

This split adds one service but prevents the public rendering service from holding broad content-write permissions. If the team deliberately chooses a single Next.js service for the MVP, document the increased blast radius in an ADR and keep domain logic behind explicit repository/service interfaces.

### Environment isolation

Recommended:

- separate GCP projects for test and production;
- separate Firebase apps, Firestore databases, buckets, service accounts, secrets, analytics properties, and domains;
- production deploy identity distinct from runtime identities and human admin access.

If `the49-487609` must host the first release, treat it as shared infrastructure and use unique `ddbox-*` names, explicit IAM bindings, dedicated service accounts, a new named Firestore database, and separate test/prod resources. Reusing `spa-db`, `spa-test-db`, `(default)`, or existing asset buckets requires explicit approval after data-owner review.

Decision (2026-08-28): use `the49-487609` under the shared-project exception documented in `docs/decisions/0002-shared-gcp-project-exception.md`. This decision does not authorize reuse of any existing non-DD Box resource.

## 6. Target repository structure

Keep the initial repository simple; do not introduce a monorepo framework without a demonstrated need.

```text
.
├── AGENTS.md
├── DESIGN.md
├── README.md
├── action-plan.md
├── .agents/
│   └── skills/
│       ├── package-ple-gcp-ops/
│       └── ui-ux-review/
│           ├── SKILL.md
│           └── agents/openai.yaml
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── admin/
│   │   ├── forms/
│   │   ├── marketing/
│   │   └── ui/
│   ├── features/
│   │   ├── auth/
│   │   ├── content/
│   │   ├── gallery/
│   │   ├── leads/
│   │   └── products/
│   ├── lib/
│   │   ├── firebase/
│   │   ├── observability/
│   │   ├── seo/
│   │   ├── storage/
│   │   └── validation/
│   └── styles/
├── services/
│   └── content-api/
│       ├── pyproject.toml
│       ├── src/
│       └── tests/
├── infra/
│   ├── environments/
│   └── modules/
├── tests/
│   ├── e2e/
│   ├── accessibility/
│   └── seo/
└── public/
```

Repository-governance changes:

- Create concise `AGENTS.md` pointing frontend work to `DESIGN.md` and `$ui-ux-review` without affecting backend/infra tasks.
- Promote and reconcile `Package/DESIGN.md` into root `DESIGN.md` as the single source of truth.
- Preserve unique guidance from root `SKILLS.md`, then remove its authority or retire it to prevent conflicting tokens and stale brand references.
- Keep raw source assets separate from optimized production assets; do not serve all files directly from `Package/ASSET`.

## 7. Structured content model

Use a new named Firestore database. Final database and collection names must be environment-configured rather than hardcoded.

### Common content fields

All publishable entities should have:

- stable ID and immutable slug once published;
- locale;
- `draft` or `published` status;
- title, summary, and structured body fields;
- SEO title, description, canonical override only when needed, and social image;
- created/updated/published timestamps;
- creator/updater admin UID;
- monotonic version or update precondition for optimistic concurrency;
- preview-safe validation state.

### Collections

| Collection | Purpose | Important fields |
| --- | --- | --- |
| `site_settings` | NAP, contact methods, hours, social links, global SEO defaults | address, phone, LINE, email, hours, locales |
| `offers` | Starter, Growth, Scale | audience, MOQ guidance, benefits, CTA, proof references |
| `products` | Box/category pages | slug, category, materials, MOQ guidance, lead time wording, media |
| `gallery_items` | Portfolio records | category, images, alt text, caption, customer permission, related product |
| `case_studies` | Detailed proof | problem, constraints, process, result, timeline, approved claims |
| `faqs` | Approved questions and answers | page scope, order, publish state |
| `pages` | Structured page-level sections and ordering | allowed section types, references to entities |
| `media_assets` | Storage metadata | object path, dimensions, MIME, checksum, variants, alt/caption status |
| `leads` | Quote/consultation submissions | path type, job data, contact data, consent, attribution, status |
| `audit_logs` | Append-only admin mutation trail | actor, action, entity, before/after references, request ID, timestamp |

Avoid storing arbitrary executable HTML. Rich text must be constrained to an allowlisted schema and sanitized on write and render.

### Publish workflow

1. Admin saves a validated draft.
2. Admin previews the draft through an authenticated, noindex preview route.
3. Publish operation writes an immutable content version or audit entry in the same transaction.
4. API calls the web service's authenticated internal revalidation endpoint.
5. Public site serves the new version with stale-while-revalidate fallback.
6. Failed revalidation is retried and observable; it must not corrupt the published version.

## 8. API plan

Version the API, validate every boundary, and return consistent problem details with request IDs.

### Public endpoint

`POST /v1/leads`

- accepts the progressive form payload, attribution fields, and an idempotency key;
- validates file references, consent state, required contact method, and conditional fields;
- applies bot protection and rate limiting;
- writes a lead exactly once;
- emits a notification asynchronously after durable storage;
- returns a non-sensitive lead reference and thank-you next steps;
- does not place PII in application logs or analytics events.

### Admin resources

- `/v1/admin/products`
- `/v1/admin/gallery-items`
- `/v1/admin/offers`
- `/v1/admin/case-studies`
- `/v1/admin/faqs`
- `/v1/admin/pages`
- `/v1/admin/site-settings`
- `/v1/admin/media`
- `/v1/admin/leads`
- `/v1/admin/publish/{entityType}/{id}`

Use RESTful list/create/read/update/archive operations. Prefer archive/unpublish to destructive deletion for already-published content. Mutations require Firebase ID token verification, `admin` authorization, optimistic concurrency, input validation, and audit logging.

### Media upload

1. Admin requests an upload session from the API.
2. API validates filename, declared type, size, and purpose, then creates a short-lived upload target in a staging prefix.
3. The media bucket allows signed `PUT` uploads only from the exact configured web origins; never use a wildcard CORS origin for admin uploads.
4. Upload finalization verifies actual MIME/type, decodes the image, strips unsafe metadata, records dimensions/checksum, and creates optimized AVIF/WebP plus fallback variants.
5. API moves/marks the asset as ready and creates `media_assets` metadata.
6. Orphan staging objects expire through lifecycle policy.

Do not proxy large original uploads through the web frontend. Reject SVG uploads unless a safe sanitization pipeline is implemented.

## 9. Authentication and authorization

- Use Firebase Authentication or Identity Platform already associated with the GCP project.
- Disable public self-registration for the admin application.
- Provision the initial admin identity out-of-band.
- Store only the authorization claim `admin=true`; there are no additional application roles in v1.
- Verify ID-token issuer, audience/project, signature, expiry, revocation policy, and `admin` claim server-side.
- Grant the API runtime identity only `firebaseauth.users.get` so revocation and disabled-user checks can read Firebase user state without broader Firebase administration access.
- Do not trust client route guards as authorization.
- Require recent authentication for account-sensitive operations if later added.
- Use secure, HTTP-only session cookies for the Next.js admin surface where practical; protect state-changing cookie-authenticated requests against CSRF.
- Add audit records for login-sensitive operations and every content mutation without logging tokens or form PII.
- Deny direct client Firestore access. Storage writes must use API-issued upload targets with narrow paths and TTLs.

## 10. SEO implementation standard

### Crawlability and rendering

- Pre-render or server-render all meaningful page content and crawlable links.
- Return correct `200`, `301`, `404`, `410`, and `5xx` statuses. Do not ship soft 404s.
- Use real `<a href>` navigation rather than JavaScript-only click handlers.
- Generate one canonical URL per indexable page in the initial HTML.
- Generate `robots.txt`, XML sitemap, and image sitemap from published content only.
- Block `/admin`, preview routes, internal endpoints, staging domains, and thank-you pages from indexing.
- Use a custom-domain canonical URL; never index `run.app` service URLs.

### Page metadata

Each indexable page must have:

- unique Thai-first title and meta description aligned to search intent;
- one useful H1 and coherent semantic headings;
- canonical URL;
- Open Graph and social metadata;
- meaningful image alt text and explicit dimensions;
- breadcrumb navigation where hierarchy exists;
- internal links to related products, offers, gallery work, and quote path;
- last-modified data when factually correct.

### Structured data

Render JSON-LD from the same validated content used for the visible page. Start with:

- `Organization` or the applicable `LocalBusiness` subtype using verified NAP and hours;
- `BreadcrumbList` on nested routes;
- product-related markup only when all required visible product facts are accurate;
- FAQ markup only for visible FAQs and without promising rich-result eligibility.

Validate with Google's Rich Results Test and Schema Markup Validator. Structured data must never contain claims, ratings, prices, or availability that are absent from the visible page.

### Content and local SEO

- Complete a keyword/intention map before final copy, grouped by product, offer, use case, and location intent.
- Use one stable, descriptive slug per page; do not change published slugs casually.
- Keep name, address, phone, hours, and map details consistent with approved business records and Google Business Profile.
- Replace broad claims such as “premium”, “fast”, or “complete service” with approved evidence and qualified wording.
- Record customer permission for logos, testimonials, case studies, and branded product photographs.
- Decide whether English pages are justified. Until translated content is complete, ship Thai pages without fake or partial `hreflang` alternatives.

### Performance targets

At the 75th percentile of real-user traffic, target:

- LCP ≤ 2.5 s;
- INP ≤ 200 ms;
- CLS ≤ 0.1.

Enforce page-level image and JavaScript budgets in CI. The hero image must be responsive, correctly sized, compressed, and preloaded only when it is the actual LCP candidate. Do not use autoplay carousels or heavy animation as decorative defaults.

### Migration from the current Wix site

Before launch:

1. Crawl and export every indexable legacy URL, title, description, canonical, inbound-link target, and traffic-bearing page.
2. Decide `keep`, `merge`, `replace`, or `retire` for each URL.
3. Create exact 301 redirects; do not redirect unrelated retired pages to the home page.
4. Preserve verified contact/business facts and replace keyword-stuffed or unverified copy.
5. Validate redirects, canonical tags, sitemap, and status codes in staging.
6. Verify the domain in Search Console, submit sitemap, and monitor indexing/404s after launch.

Reference standards:

- [Google Search SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Google JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds)
- [Next.js metadata and Open Graph images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Next.js sitemap convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)

## 11. Conversion and analytics plan

### Lead funnel

The quote form should progressively collect:

1. Job information: product type, quantity, whether specifications exist, required date, delivery province.
2. Additional detail: box type, dimensions, artwork status, product photo, repeat-order likelihood, attachments.
3. Contact: name, brand/company, phone, LINE or email, and preferred response channel.

Conditional fields must follow the chosen customer path. Do not show 15–20 fields at once. Save a lead only after validated submission unless a separately approved partial-lead strategy is introduced.

The thank-you state must explain business-hours response expectations and how to send extra material through LINE OA. Do not promise response times that operations cannot meet.

### Analytics events

Decision (2026-09-08): Production uses Google Tag Manager container
`GTM-MWW3HWHR` with Basic Consent Mode. The web application does not load the
container before an explicit opt-in, keeps rejection functionally equivalent
to the necessary-only experience, and exposes a footer control for changing
the saved choice. Application-owned `dataLayer` events use a typed allowlist
and exclude lead contact data, job details, artwork, and attachment URLs.

Refinement (2026-09-09): Consent defaults for the four Consent Mode v2 signals
are queued as `denied` before application scripts. The binary choice is stored
as a versioned first-party `ddbox_privacy_consent` record; legacy consent values
are migrated without prompting returning visitors again. Choosing all enables
the container only after the same-page consent update and emits
`ddbox_consent_granted` plus `ddbox_consent_updated`. Choosing necessary keeps
the container blocked. Changing from all to necessary persists the revocation,
updates consent to denied, and reloads the page so measurement stops cleanly.

Event contract (2026-09-09): Application events remain internal `dataLayer`
names and GTM maps them to reporting names. A successful, runtime-validated
lead receipt emits `quote_submit` once with only `customer_path` and a
non-MOQ `quantity_band`; GTM maps it to GA4 `generate_lead`. Contact links emit
`line_click` or `phone_click` with an allowlisted page `location` and
`contact_context` (`general` or `after_quote`); GTM maps them to `click_line`
and `click_call`. Every event is rebuilt from a runtime allowlist and is dropped
when consent is absent or necessary-only. Measurement failures never fail lead
capture, navigation, LINE, or telephone actions. A LINE click means only that
the website link was activated, not that a message was sent. The application
does not emit lead events from the thank-you page.

Before publishing GA4 tags, redact the `reference` query parameter, disable
automatic outbound-click measurement, verify automatic form interactions, and
isolate non-production hostnames from the Production GA4 data stream.

Define and document events before implementation:

- `primary_cta_click`
- `customer_path_selected`
- `offer_view`
- `product_view`
- `gallery_item_view`
- `quote_start`
- `quote_step_complete`
- `quote_submit`
- `line_click`
- `phone_click`

Capture campaign attribution and landing page on the lead record. Do not send names, phone numbers, email addresses, LINE IDs, artwork, or attachment URLs to GA4, Google Ads, or Meta Pixel.

Load non-essential analytics/advertising tags only after the applicable consent. Privacy/consent language and retention periods require business/legal approval; technical implementation alone is not a compliance determination.

## 12. UI/UX Review Skill plan

Create:

```text
.agents/skills/ui-ux-review/
├── SKILL.md
└── agents/openai.yaml
```

Do not add scripts unless repeated deterministic checks later justify them.

The skill must:

- read root `DESIGN.md` before every review;
- inspect relevant components and neighboring pages;
- identify primary user task and primary visual anchor;
- prefer existing patterns and tokens;
- review product/UX, visual hierarchy, information density, responsive behavior, semantics, accessibility, and maintainability;
- detect generic AI patterns such as excessive cards, nested containers, rounded boxes, decorative gradients, weak hierarchy, duplicate CTAs, excessive whitespace, badges, icons, and helper text;
- prefer `remove > simplify > merge > restructure > add`;
- preserve backend behavior, API contracts, auth, domain models, and business rules.

Required modes:

1. Critique Mode: review only, using `REMOVE`, `MERGE`, `MOVE`, `REDUCE`, `EMPHASIZE`, `REPLACE`, or `KEEP` recommendations.
2. Implementation Plan Mode: map approved critique to files, reused components, layout, responsiveness, accessibility, and risk without modifying code.
3. Final Review Mode: score the required seven dimensions and assign AI-template smell `LOW`, `MEDIUM`, or `HIGH`; never approve `HIGH`.

Integration:

- Add a short frontend-only routing instruction to `AGENTS.md`.
- Keep detailed behavior in the skill, not duplicated in `AGENTS.md`.
- Validate skill discovery, relative references, and the three modes.
- Run at least these forward tests:
  - critique the home hero and offer hierarchy;
  - plan a mobile quote-form improvement without touching API behavior;
  - final-review a gallery page with deliberately excessive cards.

Quality gate for frontend PRs:

- Critique exists for new or materially redesigned pages.
- Implementation plan records approved changes.
- Final review has no `HIGH` AI-template smell.
- Accessibility, responsive, and design-token checks pass independently of the subjective review.

## 13. Delivery phases

### Phase 0 — Resolve product and operational decisions

Actions:

- confirm canonical domain and whether the Wix site will be replaced;
- confirm Thai-only or bilingual launch scope;
- confirm that v1 is quote-first rather than instant pricing;
- name the initial admin identity and account recovery owner;
- decide dedicated production GCP project versus shared-project exception;
- confirm notification/CRM destination: LINE, email, Google Sheet, HubSpot, or another system;
- approve privacy/consent wording and retention policy;
- inventory factual claims, factory capabilities, lead time, MOQ rules, delivery areas, and proof;
- audit rights for every existing image/logo/testimonial.

Exit criteria:

- decision log/ADRs contain no unresolved launch-blocking ownership or environment decisions;
- content owner and technical owner are named;
- all unverified claims are marked unavailable rather than drafted as facts.

### Phase 1 — Repository governance and UI review capability

Actions:

- create concise root `AGENTS.md`;
- establish root `DESIGN.md` as canonical and reconcile stale/conflicting design guidance;
- build and validate `.agents/skills/ui-ux-review`;
- define coding, accessibility, responsive, and test conventions;
- update README with local setup and repository map.

Exit criteria:

- Codex discovers the skill;
- three review modes behave as specified;
- no instructions route backend/infra work through the UI skill;
- exactly one design-system authority remains.

### Phase 2 — Conversion-ready design and content model

Actions:

- rework the Stitch design or create implementation-ready wireframes for all public routes;
- apply the two customer paths and three offer segments;
- define mobile-first quote funnel and sticky contact actions;
- build content inventory, page/section model, SEO field model, and evidence matrix;
- obtain desktop, tablet, and mobile approval;
- run Critique Mode and approve the Implementation Plan Mode output.

Exit criteria:

- above-the-fold message answers what DD Box does, for whom, why it is credible, and what to do next;
- required proof and form states have real content or explicit placeholders owned by the business;
- mobile layouts and states are designed, not inferred during coding;
- no placeholder brands, unverified claims, or dead links remain in approved copy.

### Phase 3 — Application foundation and public shell

Actions:

- bootstrap supported Next.js App Router + TypeScript versions at implementation time;
- add linting, formatting, type checks, unit tests, environment validation, CSP/security headers, error boundaries, and structured logging;
- implement design tokens and primitive components from `DESIGN.md`;
- build semantic responsive header, footer, navigation, layout, buttons, forms, and media components;
- implement route skeletons, metadata defaults, robots, sitemap, canonical handling, and 404/500 behavior;
- configure local Firebase emulators or isolated test resources.

Exit criteria:

- clean build and test baseline;
- no hardcoded project IDs, API URLs, credentials, or production domains in application modules;
- public page shell renders useful HTML with JavaScript disabled;
- admin and preview paths are noindex.

### Phase 4 — Data layer, API, and media pipeline

Actions:

- bootstrap the Python API with a supported Python runtime, FastAPI, Pydantic, dependency locking, linting, static type checks, and pytest;
- create versioned contracts and validation schemas;
- implement Firestore repositories independent from HTTP handlers;
- implement content CRUD, draft/publish transactions, optimistic concurrency, audit logs, and cache revalidation;
- implement media upload/finalization and lifecycle cleanup;
- define required Firestore indexes and backup/PITR settings;
- add least-privilege runtime/deployment identities and Secret Manager bindings.

Exit criteria:

- API integration tests cover validation, unauthorized/forbidden, conflicts, publish rollback, and retries;
- no browser can write Firestore directly;
- upload validation rejects oversized, mismatched, or unsafe media;
- content publication is idempotent and auditable.

### Phase 5 — Admin CMS

Actions:

- implement admin sign-in/session flow and route protection;
- implement structured editors for products, gallery, offers, case studies, FAQs, pages, and global settings;
- implement accessible media selection/upload, alt/caption requirements, preview, publish, archive, and error states;
- implement lead list/detail with minimum necessary PII visibility;
- prevent accidental navigation away from unsaved changes.

Exit criteria:

- only an authorized admin can read/write admin resources;
- admin can add/edit/publish a gallery item and product without developer intervention;
- publishing updates the public site within the agreed cache window;
- audit trail identifies actor, entity, action, and time.

### Phase 6 — Public experience and lead pipeline

Actions:

- implement home, offer, product, gallery, case-study, quote, contact, privacy, and terms routes;
- render published CMS content server-side;
- implement two-path progressive form, idempotent lead creation, attachment workflow, bot protection, and thank-you state;
- integrate approved notification/CRM destination asynchronously;
- implement consent-aware analytics and conversion events.

Exit criteria:

- both customer paths complete successfully on desktop and mobile;
- failed notification does not lose the lead;
- form retries do not create duplicates;
- no PII appears in analytics or routine logs;
- all CTA destinations are real and measurable.

### Phase 7 — SEO, content migration, and performance

Actions:

- complete legacy URL crawl and 301 map;
- load approved Thai-first content, gallery metadata, case studies, FAQs, NAP, and proof;
- implement page-specific metadata, canonical, JSON-LD, sitemap/image sitemap, breadcrumbs, internal links, and social images;
- optimize images/fonts and reduce client-side JavaScript;
- run Search Console URL inspection, Rich Results Test, link/status validation, and Lighthouse/field-metric setup.

Exit criteria:

- every indexable route has unique useful content and metadata;
- rendered HTML contains primary content, links, canonical, and structured data;
- staging/admin/preview routes cannot enter the index;
- redirect map has no chains or loops;
- performance budgets and lab targets pass on representative mobile profiles.

### Phase 8 — Security, reliability, and launch

Actions:

- run threat-model review for auth, CMS content injection, uploads, lead spam, PII, and supply chain;
- verify IAM, ingress, CORS, CSP, secrets, dependency provenance, audit logs, backup/restore, and rollback;
- configure Monitoring dashboards, alerting, uptime checks, Error Reporting, trace correlation, and cost budgets;
- perform cross-browser, device, accessibility, SEO, load, and end-to-end tests;
- run Final Review Mode on every key public page;
- execute staged domain cutover and monitor crawl/errors/conversions.

Exit criteria:

- no critical/high security finding is open;
- backup restore and deployment rollback are tested;
- all key pages have AI-template smell `LOW` or accepted `MEDIUM`, never `HIGH`;
- launch checklist, incident owner, and rollback trigger are approved;
- Search Console, analytics, alerts, and conversion reporting are receiving expected data.

## 14. Test and validation matrix

| Area | Minimum validation |
| --- | --- |
| Domain logic | unit tests for validation, publish state, slugs, lead idempotency, claim qualification |
| API | integration tests against Firestore/Auth emulators or isolated test resources |
| Auth | missing, expired, wrong-project, revoked, and non-admin tokens; no client-only bypass |
| Admin | CRUD, concurrent edits, upload failure, preview, publish, archive, unsaved changes |
| Public UX | navigation, both quote paths, conditional fields, errors, loading, empty states, thank-you |
| Accessibility | keyboard, focus order, labels/errors, landmarks, contrast, reduced motion, axe checks |
| Responsive | representative mobile/tablet/desktop widths and zoom/text expansion |
| SEO | raw HTML assertions, status codes, canonical, metadata, robots, sitemap, JSON-LD, redirects |
| Performance | Lighthouse CI, bundle/image budgets, production-like load, real-user CWV reporting |
| Security | authorization, CSRF/CORS/CSP, stored XSS, upload validation, rate limiting, secret scanning |
| Reliability | notification retry, revalidation retry, rollback, Firestore restore, storage lifecycle |

Do not claim production readiness from Lighthouse alone. Pair lab checks with real-user metrics after launch.

## 15. Observability and operations

- Emit structured logs with environment, service, release, request ID, trace ID, route template, latency, status, and non-sensitive error code.
- Never log form payloads, tokens, cookies, uploaded content, or secret values.
- Track lead acceptance, duplicate prevention, notification success/failure, publish/revalidation result, image processing result, and admin authorization failures.
- Configure alerts on availability, 5xx rate, latency, lead failures, notification backlog, publish failures, auth anomalies, and cost/quota thresholds.
- Define content/database backup frequency and verify restore, not only backup creation.
- Keep an operational runbook for failed lead notification, compromised admin account, bad content publish, image processing backlog, domain/DNS issue, and rollback.

## 16. Risks and required decisions

| Risk/decision | Recommendation | Blocking point |
| --- | --- | --- |
| Shared GCP project contains unrelated systems | Create a dedicated production project; otherwise document shared-project exception and isolate all DD Box resources | before production provisioning |
| Backend described as stable but absent from repo | Obtain source/API contract before integration; do not couple to discovered services by name | before API integration |
| Thai vs bilingual scope | Launch Thai-first; add English only with complete reviewed content and `hreflang` | before final routing/content |
| Quote vs instant pricing | Ship quote-first; treat pricing engine as separate product capability | before PDP implementation |
| Admin identity ownership | Provision one named admin and recovery owner; no public registration | before admin testing |
| Existing images contain brands | Record publishing permission per asset | before content migration |
| Factory imagery too small | Produce high-resolution authentic photography/video with usage rights | before visual QA/performance tuning |
| Claims and lead-time promises | Require operational evidence and owner approval | before publishing copy |
| Analytics/ads consent | Obtain approved policy and consent behavior; keep PII out of tools | before enabling tags |
| Existing plaintext credential-like runtime config | Rotate and migrate through a separate security change; never copy into this repository | immediate parallel remediation |
| Free-form CMS could break design/SEO | Keep structured content types and approved section variants | architecture decision |

## 17. Definition of done

The project is complete only when:

- the public website is deployed on the canonical domain with correct redirects and no indexable staging/service URL;
- target pages are server-rendered/pre-rendered, crawlable, unique, and useful;
- approved business proof replaces placeholder claims and brands;
- both customer paths produce durable, deduplicated leads and reliable notifications;
- an authorized admin can manage and publish structured products/gallery/content without developer intervention;
- authorization is enforced server-side and all DD Box identities/resources follow least privilege;
- SEO, accessibility, responsive, security, performance, observability, backup, restore, and rollback gates pass;
- Core Web Vitals reporting is active, with the defined targets used for ongoing monitoring;
- the UI/UX Final Review reports no `HIGH` AI-template smell;
- every created resource, secret name, environment variable, API contract, content model, and operational procedure is documented for long-term ownership.

## 18. First implementation slice

Start with a vertical slice that proves the architecture without building the entire CMS:

1. Complete Phase 0 decisions required for environment, supported runtime versions, and admin identity. Python is already selected for the backend language.
2. Create `AGENTS.md`, canonical `DESIGN.md`, and the validated `ui-ux-review` skill.
3. Bootstrap the public web and content API with local/emulator configuration.
4. Implement one CMS-managed gallery item from admin upload → draft → preview → publish → public SSR gallery output.
5. Implement one customer-path lead submission end to end with idempotency and notification stub.
6. Validate auth, SEO HTML, accessibility, mobile layout, logging, and rollback on this slice.

Proceed to the remaining pages only after this slice proves that content publishing, media, auth, SEO rendering, and operational boundaries work together.
