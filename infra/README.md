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

The foundation stack was applied on 2026-08-28 with `37 added, 0 changed, 0 destroyed`. A post-apply refresh reported no drift. Re-plan before any future apply; the saved initial plan must not be reused.

Because this is a shared project, principals with inherited project-level Owner or Editor roles can access the state bucket even when its bucket IAM is narrow. Never put secret payloads, service-account keys, tokens, or credentials in Terraform configuration or state.

Cloud Run services are intentionally outside this foundation stack until image digests, Firebase web-app values, exact CORS origins, canonical domain, scaling limits, and public/private ingress decisions are available. Deploy immutable digests, not mutable tags.
