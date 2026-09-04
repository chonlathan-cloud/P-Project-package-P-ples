# DD Box GCP infrastructure

This tree isolates DD Box resources inside the shared `the49-487609` project. It must not import, modify, or reuse any `spa-*`, `the49-*`, `(default)`, `spa-db`, `spa-test-db`, or existing application bucket.

## State bootstrap

The bootstrap stack creates only `the49-487609-ddbox-tfstate`. It was applied on 2026-08-28 with `1 added, 0 changed, 0 destroyed`. The foundation backend now uses that bucket.

```bash
terraform -chdir=infra/bootstrap init
terraform -chdir=infra/bootstrap plan -out=bootstrap.tfplan

terraform -chdir=infra/foundation init -backend-config=backend.hcl.example
terraform -chdir=infra/foundation plan -out=foundation.tfplan
```

Do not apply either plan without a reviewed plan artifact and explicit approval. Terraform never creates secret versions: add the two random 32-byte values per environment through an approved non-logging workflow after the secret containers exist.

Test secret versions were created on 2026-08-28 through stdin-only generation:

- `ddbox-test-media-token-key`: version `1`, enabled
- `ddbox-test-web-revalidation-token`: version `1`, enabled

Production secret containers still have no versions. Secret payloads remain outside Terraform and the repository.

The foundation stack was applied on 2026-08-28 with `37 added, 0 changed, 0 destroyed`. A post-apply refresh reported no drift. Re-plan before any future apply; the saved initial plan must not be reused.

The test-only durable notification/CMS expansion was applied from the reviewed
`infra/foundation/notification-cms.tfplan` on 2026-09-04 with `8 added, 0 changed, 0 destroyed`:
one Cloud Tasks queue, one dedicated task OIDC service account, two least-privilege IAM bindings,
and four test Firestore composite indexes for Products, Offers, FAQs, and Pages. A post-apply plan
reported no drift. The saved plan must not be reused. Production queues and structured-content
indexes stay disabled by default until production rollout is separately approved.

The Firebase revocation-check IAM fix was applied to the test API runtime on 2026-09-04 with
`2 added, 0 changed, 0 destroyed`: one project custom role containing only
`firebaseauth.users.get` and one binding for `ddbox-api-test`. No Cloud Run service was redeployed.
The equivalent production binding is declared in Terraform but remains unapplied pending separate
production approval; a full post-apply plan reported that binding as the only outstanding change.

The media upload CORS fix was applied in place to the test bucket on 2026-09-04 with
`0 added, 1 changed, 0 destroyed`. The allowlist accepts signed `PUT` uploads only from the exact
test Cloud Run web origin; a live preflight returned `200` with the expected CORS response headers.
The non-secret Test and Prod origin values are maintained in `foundation/ddbox.auto.tfvars`.
The equivalent Prod bucket update and Prod Firebase token-verifier binding remain unapplied pending
production approval; the full post-apply plan contains only those two production changes.

Because this is a shared project, principals with inherited project-level Owner or Editor roles can access the state bucket even when its bucket IAM is narrow. Never put secret payloads, service-account keys, tokens, or credentials in Terraform configuration or state.

Cloud Run services are intentionally outside this foundation stack until image digests, Firebase web-app values, exact CORS origins, canonical domain, scaling limits, and public/private ingress decisions are available. Deploy immutable digests, not mutable tags.
