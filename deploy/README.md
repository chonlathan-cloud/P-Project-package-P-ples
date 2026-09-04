# DD Box deployment configuration

Environment-specific build and runtime configuration is deliberately split into `-test` and
`-prod` files. The Production API is deployed behind its Cloud Run URL for pre-cutover validation;
the Production Web must keep `SITE_INDEXING_ENABLED=false` until the canonical-domain and DNS
cutover is approved.

Cloud Build runs as `ddbox-deployer`, writes source/log artifacts to the private
`the49-487609-ddbox-build` bucket, and pushes immutable tags to the `ddbox` Artifact Registry
repository. Cloud Run must be deployed by digest, never by a mutable tag.

Every `gcloud builds submit` command must include
`--gcs-source-staging-dir=gs://the49-487609-ddbox-build/source`. The organization policy prevents
the deployer service account from reading the default Cloud Build source bucket. Test services use
`--no-invoker-iam-check` because the same organization policy rejects an `allUsers` IAM binding;
this setting is scoped to the two public DD Box test services.

To build and deploy the test web service from the repository root, run:

```bash
./deploy-web-test.sh
```

The script discovers the Firebase test app configuration and creates a timestamped image tag. An
explicit immutable tag can be supplied when needed: `./deploy-web-test.sh test-logo-v2`.

The initial test API deployment used `DDBOX_NOTIFICATION_BACKEND=logging` only to receive a signed
LINE webhook and discover the approved group ID. The test group was captured with
`#ddbox-register`, promoted without exposing its ID, and the test API was deployed with `line_gmail`
and all four notification secret references on 2026-09-04. Re-register and explicitly promote a new
candidate before changing the target group; never copy a target ID into repository configuration.

The test API uses the regional `ddbox-lead-notifications-test` Cloud Tasks queue. The foundation
resources and API/Web revisions were deployed and live-verified on 2026-09-04.
The API runtime can enqueue only to that queue and can attach only the dedicated
`ddbox-tasks-test` identity. Tasks contain no lead PII: the deterministic task name and URL include
only the opaque lead ID. The internal delivery endpoint verifies an OIDC token for the exact task
identity and Cloud Run audience before loading the lead from Firestore. Failed delivery returns a
retryable status; the queue retries for up to seven days. A crash after LINE or Gmail accepts a
message but before Firestore records `sent` can still produce one duplicate because those
destinations do not expose an idempotency key.

Cloud Run reserves some paths ending in `z`; service health endpoints are `/health` and `/ready`.

`cloudbuild-content-api-image.yaml` builds and pushes an immutable candidate without changing a
running service. Use it when a revision must be validated before choosing its target environment.

## Structured public-content migration

The reviewed migration source is the current Thai public content in `src/content/products.ts` and
`src/content/solutions.ts`. Public routes do not import those files; they are retained only to build
the versioned migration manifest. Plan against the test database before applying:

```bash
node scripts/build-structured-content-manifest.mjs \
  | (cd services/content-api && uv run python scripts/migrate_structured_content.py \
      --project=the49-487609 \
      --database=ddbox-test)
```

Apply only after the compatible Content API revision is live and the plan has been reviewed:

```bash
node scripts/build-structured-content-manifest.mjs \
  | (cd services/content-api && uv run python scripts/migrate_structured_content.py \
      --project=the49-487609 \
      --database=ddbox-test \
      --apply \
      --confirm-target=the49-487609/ddbox-test)
```

The migration is idempotent, uses normal CMS create/update/publish semantics, and does not archive
or delete records absent from the manifest. Deploy in this order: Content API by immutable digest,
migration plan/apply, public API verification, then Web by immutable digest. Never apply a manifest
with fields unsupported by the running API model.

The reviewed test manifest was applied on 2026-09-04: 5 Products, 3 Offers, 24 FAQs, and 3 Pages.
An immediate repeat plan returned all 35 records as unchanged. Content API revision
`ddbox-content-api-test-00009-pxz` and Web revision `ddbox-web-test-00013-wtv` serve 100% of test
traffic from immutable image digests. This release adds the guided Admin UI, verified Firebase test
app configuration, and sales-first LINE Flex payload while preserving Cloud Tasks delivery and
Gmail fallback. The Web revision also validates Gallery image type/count/size before upload,
returns actionable Thai upload errors, maps finalized media to the strict Gallery API contract,
shows only concept images in the default `ภาพแนะนำทั้งหมด` view, and orders concept images before
authorized customer work inside every category.
Production API revision `ddbox-content-api-prod-00002-bvf` serves 100% of API traffic by immutable
digest. The Production LINE group candidate was promoted without exposing its target ID. Until the
owner approves a Gmail App Password, Production uses the `line` notification backend with durable
Cloud Tasks retries and no Gmail fallback. The reviewed migration contains 5 Products, 3 Offers,
24 FAQs, 3 Pages, 6 Gallery concepts, and 6 pricing benchmarks; no `Testing` Gallery item was
migrated. Production DNS and the Production Web service have not been changed in this rollout.
