# DD Box deployment configuration

Environment-specific build and runtime configuration is deliberately split into `-test` and
`-prod` files. Production files are prepared only; do not submit or deploy them until production
secret versions, canonical domain, approved legal content, monitoring, and launch validation are
complete.

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

The first test API deployment uses `DDBOX_NOTIFICATION_BACKEND=logging` only to receive a signed
LINE webhook and discover the approved group ID. After promotion into
`ddbox-test-line-notification-target-id`, redeploy with `line_gmail` and attach all four notification
secrets.
