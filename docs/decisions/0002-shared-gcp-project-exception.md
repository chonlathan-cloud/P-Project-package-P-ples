# ADR 0002: Isolate DD Box inside the shared GCP project

Status: accepted and provisioned on 2026-08-28; runtime deployment pending

## Context

The owner selected `the49-487609` for DD Box instead of creating dedicated test and production projects. Read-only discovery confirmed that this project already hosts unrelated `spa-*` and `the49-*` Cloud Run services, Firestore databases, buckets, service accounts, repositories, and secrets.

## Decision

Use the shared project with a strict `ddbox-*` ownership boundary and `asia-southeast1` as the regional location. Test and production remain separate inside the project:

| Resource | Test | Production |
| --- | --- | --- |
| Firestore database | `ddbox-test` | `ddbox-prod` |
| Media bucket | `the49-487609-ddbox-media-test` | `the49-487609-ddbox-media-prod` |
| API runtime identity | `ddbox-api-test` | `ddbox-api-prod` |
| Web runtime identity | `ddbox-web-test` | `ddbox-web-prod` |
| Cloud Run API | `ddbox-content-api-test` | `ddbox-content-api-prod` |
| Cloud Run web | `ddbox-web-test` | `ddbox-web-prod` |

Shared DD Box resources use Artifact Registry repository `ddbox`, deployment identity `ddbox-deployer`, and Terraform state bucket `the49-487609-ddbox-tfstate`.

The implementation must:

- never import, reuse, mutate, or grant DD Box identities access to `(default)`, `spa-db`, `spa-test-db`, existing buckets, `spa-*`, or `the49-*` services;
- use conditional `roles/datastore.user` bindings restricted to one named database per API identity;
- scope media object permissions to the corresponding private bucket;
- give the web identities no Firestore or Storage permissions;
- keep test/prod secrets, runtime identities, databases, buckets, Cloud Run services, scaling controls, logs, alerts, and budgets distinct;
- deploy images by immutable digest and keep the deployment identity separate from runtime identities;
- provision with reviewed Terraform plans and never put secret payloads in Terraform state.

## Reliability and data protection

Both databases and buckets use deletion protection in Terraform. Production Firestore enables PITR and a daily backup retained for 14 days. Media buckets use uniform bucket-level access, enforced public-access prevention, object versioning, and one-day cleanup of abandoned `staging/` uploads.

## Consequences

This accepts shared quota, billing, API enablement, organization policy, IAM policy, and project-level outage blast radius. Per-resource identity and data isolation reduce accidental cross-application access but do not provide the failure-domain isolation of separate projects. A later move to dedicated projects remains possible because all project IDs, database IDs, bucket names, domains, and service URLs are environment configuration.

Project-level Owners and Editors retain inherited access to the Terraform state bucket in this shared project; bucket-level allow policies cannot subtract that inherited access. Terraform therefore must not manage secret payloads or credentials, and separate projects remain the stronger isolation option.
