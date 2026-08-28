# Read-only GCP workflows

Use `the49-487609` unless the user explicitly overrides the project. Add `--region` or `--zone` only after discovering or receiving the location.

## Project and resource inventory

```bash
gcloud services list --enabled --project the49-487609
gcloud asset search-all-resources --scope=projects/the49-487609 --limit=200 --format=json
```

Cloud Asset Inventory may be unavailable or permission-restricted. Fall back to service-specific list commands rather than enabling an API.

## Cloud Run and Cloud Logging

```bash
gcloud run services list --platform=managed --project the49-487609
gcloud run services describe SERVICE --region REGION --project the49-487609 --format=export
gcloud run revisions list --service SERVICE --region REGION --project the49-487609
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="SERVICE" AND severity>=ERROR' \
  --project the49-487609 --freshness=2h --limit=100 --format=json
```

Inspect service account, image digest, latest ready revision, traffic split, scaling limits, VPC connector, Cloud SQL attachment, ingress, and non-secret environment-variable names. Redact environment values that look sensitive.

## BigQuery

```bash
bq ls --project_id=the49-487609
bq ls the49-487609:DATASET
bq show --schema --format=prettyjson the49-487609:DATASET.TABLE
bq query --project_id=the49-487609 --use_legacy_sql=false --dry_run 'SELECT ...'
bq query --project_id=the49-487609 --use_legacy_sql=false --maximum_bytes_billed=BYTES --max_rows=20 'SELECT ... LIMIT 20'
```

Prefer INFORMATION_SCHEMA for metadata investigations. DDL, DML, load, extract, transfer, and scheduled-query changes are mutations.

## Firestore

```bash
gcloud firestore databases list --project the49-487609
gcloud firestore databases describe --database='(default)' --project the49-487609
```

The gcloud CLI does not provide complete document browsing. Use an existing repository client or the Firestore REST API with the caller's short-lived gcloud token only when a document path is known and its contents are necessary. Never print the token.

## Cloud Storage

```bash
gcloud storage buckets list --project the49-487609
gcloud storage ls gs://BUCKET --project the49-487609
gcloud storage objects describe gs://BUCKET/OBJECT --project the49-487609 --format=json
```

List or describe metadata first. Downloading object content is outside the default diagnostic scope.

## Pub/Sub and Cloud Tasks

```bash
gcloud pubsub topics list --project the49-487609
gcloud pubsub subscriptions list --project the49-487609
gcloud tasks queues list --location REGION --project the49-487609
gcloud tasks queues describe QUEUE --location REGION --project the49-487609
```

Publishing, acknowledging, purging, running a task, pausing/resuming a queue, or changing retry policy requires approval.

## Secret Manager

```bash
gcloud secrets list --project the49-487609
gcloud secrets describe SECRET --project the49-487609 --format=json
gcloud secrets versions list SECRET --project the49-487609
```

Do not run `gcloud secrets versions access` by default. Secret payload access requires an explicit user request and approval immediately before access; never include the value in logs or chat output.

## IAM and service accounts

```bash
gcloud projects get-iam-policy the49-487609 --format=json
gcloud iam service-accounts list --project the49-487609
gcloud iam service-accounts get-iam-policy SERVICE_ACCOUNT --project the49-487609 --format=json
```

Check primitive roles, owner/editor grants, public principals, service-account impersonation, and whether Cloud Run runtime identities have only required roles. Do not create keys or expose unique IDs unnecessarily.

## Cloud SQL, Memorystore, and VPC

```bash
gcloud sql instances list --project the49-487609
gcloud redis instances list --region REGION --project the49-487609
gcloud compute networks list --project the49-487609
gcloud compute networks subnets list --project the49-487609
gcloud compute firewall-rules list --project the49-487609
gcloud compute networks vpc-access connectors list --region REGION --project the49-487609
```

Correlate private IP ranges, connectors, egress mode, authorized networks, TLS/auth settings, and runtime identity. Never open firewall access or rotate credentials during diagnosis.
