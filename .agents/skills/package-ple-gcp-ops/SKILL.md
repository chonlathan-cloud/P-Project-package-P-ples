---
name: package-ple-gcp-ops
description: Inspect and diagnose Google Cloud infrastructure for Package-ple project the49-487609 using local gcloud and bq credentials. Use for read-only GCP inventory, Cloud Run status and logs, IAM review, BigQuery metadata, Firestore, Cloud Storage, Pub/Sub, Secret Manager metadata, and operational troubleshooting; require explicit approval before any cloud mutation.
---

# Package-ple GCP Ops

## Scope and defaults

Target project `the49-487609`. Authenticate only through the caller's existing Application Default Credentials or `gcloud` session. Never request, print, copy, or commit credential JSON, private keys, access tokens, secret payloads, or sensitive environment-variable values.

Prefer an explicit `--project the49-487609` on every command. Do not change the caller's active gcloud configuration. Do not assume a region, zone, resource name, database, dataset, bucket, service account, or enabled API; discover it first.

Treat the following as safe defaults:

- Read resource metadata and bounded logs.
- List resources before describing a selected resource.
- Bound result size, time range, and query cost.
- Redact credentials, tokens, cookies, authorization headers, PII, and secret-like values from reported output.

Before create, update, delete, deploy, enable/disable API, change IAM, execute DDL/DML, publish a message, run a job, or access a Secret Manager payload, explain the exact mutation and obtain explicit user approval.

## Start each investigation

Confirm tools and identity without emitting tokens:

```bash
gcloud version
gcloud auth list --filter=status:ACTIVE --format='value(account)'
gcloud projects describe the49-487609 --format='yaml(projectId,name,projectNumber,lifecycleState)'
```

Use the repo-local helper for a consistent baseline:

```bash
python3 .agents/skills/package-ple-gcp-ops/scripts/gcp_readonly_ops.py context
python3 .agents/skills/package-ple-gcp-ops/scripts/gcp_readonly_ops.py --format json inventory
```

The helper accepts `--project` to override the default for an explicitly requested project and `--dry-run` to show commands without executing them.

## Investigation workflow

1. Establish identity, project visibility, and relevant enabled APIs.
2. Inventory only the service family relevant to the request.
3. Describe the selected resource and its runtime identity/configuration metadata.
4. Inspect bounded logs or metadata around the failure window.
5. Correlate revision, request/trace ID, resource name, deployment time, and upstream/downstream dependencies.
6. Report root cause or the narrowest remaining blocker with evidence. Do not mutate cloud state as part of diagnosis.

For exact service commands and safety boundaries, read [references/read-only-workflows.md](references/read-only-workflows.md) only for the service family being investigated.

## Query and data safety

For BigQuery, inspect metadata first and dry-run unfamiliar SQL. Apply `maximum_bytes_billed` when cost is uncertain, select only required columns, and add a small `LIMIT` for exploratory reads. Do not assume `LIMIT` alone bounds bytes scanned.

For Firestore and Cloud Storage, read the minimum path/object metadata needed. Do not download or display user content unless it is necessary and the user requested it.

For Cloud Logging, always use a bounded freshness or timestamp range and a result limit. Avoid live tailing unless the user explicitly asks to monitor.

For IAM, distinguish the human caller, deployment identity, and runtime service account. Report broad roles and risky grants, but never change a binding without approval.

## Failure handling

If credentials are absent, permissions are denied, an API is disabled, or a quota blocks inspection, report the failing command, the relevant error, and the minimum access or configuration needed. Do not enable APIs, grant roles, impersonate another identity, or switch projects automatically.
