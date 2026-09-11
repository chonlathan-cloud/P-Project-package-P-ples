# Operations runbook (vertical slice)

## Lead accepted but notification failed

1. Correlate the non-sensitive lead reference and request ID in structured logs; never paste form payloads into tickets.
2. Verify the lead exists before retrying notification.
3. Retry through the durable notification job once implemented. Do not ask the customer to resubmit unless the lead record is absent.
4. Alert on repeated failures and preserve idempotency records.

## Lead export failed or contains unexpected records

1. Record the non-sensitive request ID, export ID, environment, Bangkok calendar range, UTC cutoff, and record count. Never attach the workbook to a public ticket or LINE group.
2. Confirm the request used `GET /v1/admin/leads/export` with an authorized Firebase account and that the browser received `Content-Disposition`, `X-DDBox-Export-ID`, and `X-DDBox-Record-Count` through CORS.
3. Reconcile the exported `lead_id` values against the same half-open server range (`created_from <= created_at < created_to`). Do not edit Firestore or change sales status to make counts match.
4. Import into `Import_Staging` and append only rows marked `NEW`. A repeated export/import must not overwrite notes, qualification, quotation, PO, or other sales-owned fields in the master workbook.
5. Treat every workbook as confidential customer data: keep it outside the repository and public buckets, restrict access, and remove temporary copies according to the approved retention policy.

## Attribution incident or rollback

1. If acquisition data appears without measurement consent, stop the Web rollout and shift traffic to the last known-good Web revision. Keep the backward-compatible API revision so records containing optional attribution remain readable.
2. Verify the browser key `ddbox_attribution_v1` is cleared after choosing Necessary-only consent and that subsequent Lead payloads contain `attribution: null`.
3. Correlate by Lead reference and request ID only. Do not copy raw URLs, GCLIDs, phone numbers, or email addresses into logs or tickets.
4. Do not open Production capture until the company has approved the privacy wording, server-side retention period, access policy, and deletion/revocation process.

## Bad gallery publish

1. Stop further publishes and record entity ID/version/request ID.
2. Unpublish or restore the previous immutable version once version history is implemented; do not delete audit records.
3. Revalidate `/` and `/gallery` and verify raw HTML.

## Media upload or finalization failed

1. Correlate the request ID, session ID, environment, and object metadata; never log the signed URL or finalize token.
2. Confirm the object is under the environment bucket's `staging/{session_id}/original` path and does not exceed the configured size.
3. Do not copy objects between test and production. A failed finalization can be retried with the same session token before its ten-minute expiry; successful finalization is idempotent.
4. The lifecycle rule removes abandoned staging objects after one day. Public variants remain private in Storage and are served only through immutable `/media/{asset_id}/image.{webp,jpg}` API paths.

## Compromised admin account

1. Disable/revoke the Firebase identity and sessions.
2. Review audit logs for every mutation by UID and time window.
3. Rotate any exposed session/revalidation secret through Secret Manager and redeploy affected service revisions.

## Rollback

1. Shift Cloud Run traffic to the last known-good immutable revision.
2. Verify health/readiness, one read path, one rejected unauthorized admin call, and one idempotent lead retry.
3. Roll back content separately from code; never overwrite newer audit history.

## Infrastructure boundary

- Project: `the49-487609`; region: `asia-southeast1`.
- Test/prod resources and identities are listed in ADR 0002 and managed by `infra/foundation`.
- Never target `(default)`, `spa-db`, `spa-test-db`, or any `spa-*`/`the49-*` resource during DD Box operations.
- Review saved Terraform plans before apply. Bootstrap and foundation apply are separate approvals; secret versions and Cloud Run deployments are separate mutations again.

Alert policies, tested Firestore restore commands, runtime owners, and escalation contacts remain launch blockers.
