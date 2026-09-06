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

Production media, revalidation, and LINE secret containers each have enabled version `1`. The
Production Gmail App Password container has no version and remains intentionally deferred. Secret
payloads remain outside Terraform and the repository.

The foundation stack was applied on 2026-08-28 with `37 added, 0 changed, 0 destroyed`. A post-apply refresh reported no drift. Re-plan before any future apply; the saved initial plan must not be reused.

The durable notification/CMS expansion was first applied to Test from the reviewed
`infra/foundation/notification-cms.tfplan` on 2026-09-04 with `8 added, 0 changed, 0 destroyed`:
one Cloud Tasks queue, one dedicated task OIDC service account, two least-privilege IAM bindings,
and four test Firestore composite indexes for Products, Offers, FAQs, and Pages. A post-apply plan
reported no drift. Production equivalents were subsequently applied during the approved Production
rollout. Saved plans must not be reused.

The Firebase revocation-check IAM fix was applied to the test API runtime on 2026-09-04 with
`2 added, 0 changed, 0 destroyed`: one project custom role containing only
`firebaseauth.users.get` and one binding for `ddbox-api-test`. No Cloud Run service was redeployed.
The equivalent Production binding was subsequently applied during the approved Production rollout.

The media upload CORS fix was applied in place to the test bucket on 2026-09-04 with
`0 added, 1 changed, 0 destroyed`. The allowlist accepts signed `PUT` uploads only from the exact
test Cloud Run web origin; a live preflight returned `200` with the expected CORS response headers.
The non-secret Test and Prod origin values are maintained in `foundation/ddbox.auto.tfvars`.
The Production bucket allowlist was applied on 2026-09-05 for the Production Cloud Run URL and both
custom-domain origins; live preflight checks passed for the apex and canonical origins.

Because this is a shared project, principals with inherited project-level Owner or Editor roles can access the state bucket even when its bucket IAM is narrow. Never put secret payloads, service-account keys, tokens, or credentials in Terraform configuration or state.

Cloud Run services are intentionally outside this foundation stack until image digests, Firebase web-app values, exact CORS origins, canonical domain, scaling limits, and public/private ingress decisions are available. Deploy immutable digests, not mutable tags.

The Production edge stack was applied on 2026-09-05 with a reserved global IPv4 address, global
external HTTPS load balancer, Production Cloud Run serverless NEG, HTTP-to-HTTPS/apex-to-`www`
redirects, and Certificate Manager DNS authorizations for `ddboxprinting.com` and
`www.ddboxprinting.com`. The Production media bucket CORS allowlist was expanded in place for both
custom-domain origins. Terraform reported no drift after apply. Certificate issuance remains in
`PROVISIONING` until both DNS authorization CNAME records are added at Cloudflare. Follow
`deploy/domain-cutover.md`; do not replace Wix DNS records before the approved cutover window.
