# DD Box Production domain cutover

Canonical URL: `https://www.ddboxprinting.com`

Status: completed on 2026-09-05 at approximately 16:43 Asia/Bangkok. Cloudflare `@` and `www`
are DNS-only A records for `34.111.32.235`; Certificate Manager reports `ACTIVE`; Web revision
`ddbox-web-prod-00004-yof` serves 100% of Production traffic with indexing enabled. Public DNS,
HTTPS, apex/HTTP redirects, public routes, canonical metadata, sitemap, Admin noindex, API/Media
CORS, and the two owner-confirmed replacement logo files were live-verified. A synthetic Production
lead was intentionally not submitted because it would notify the live LINE destination.

This runbook replaces the Wix origin while Cloudflare remains the authoritative DNS provider. Do
not change MX, SPF, DKIM, DMARC, or unrelated TXT/CNAME records.

## Current rollback targets

Record these values again from Cloudflare immediately before cutover because Wix can change them:

- apex `A`: `185.230.63.171`
- `www` CNAME: `www143.wixdns.net`

Keep the Wix site and subscription active until the new site has been stable for at least seven
days.

## Google edge values

Retrieve the Terraform-managed values rather than copying them from an old plan:

```bash
terraform -chdir=infra/foundation output -json production_web_edge
```

The reserved Production frontend IPv4 address is `34.111.32.235`.

## Certificate validation phase (does not move web traffic)

1. Add both `dns_authorizations` CNAME records from the Terraform output to Cloudflare.
2. Use `DNS only` for both validation records.
3. Do not replace the Wix apex or `www` records in this phase.
4. Wait until this command reports `ACTIVE`:

```bash
gcloud certificate-manager certificates describe ddbox-web-prod \
  --project=the49-487609 \
  --location=global \
  --format='yaml(managed.state,managed.authorizationAttemptInfo,managed.provisioningIssue)'
```

## Application gate

Before changing DNS:

- Production API and GCS CORS must accept `https://ddboxprinting.com` and
  `https://www.ddboxprinting.com`.
- Firebase Authorized Domains must contain both hostnames.
- `/product` must redirect directly to `/products`.
- `/ddboxprinting` must redirect directly to `/company`.
- The release candidate must render canonical URLs and sitemap entries under
  `https://www.ddboxprinting.com`.
- The final cutover image must be built with `SITE_INDEXING_ENABLED=true`; candidate and `run.app`
  validation remain `noindex` until the approved cutover window.

## Cloudflare cutover

Export the Cloudflare DNS zone immediately before making changes. Set the affected records to a
300-second TTL where the account allows it.

Replace only these records and leave them `DNS only` for the initial launch:

| Type | Name  | Target          |
| ---- | ----- | --------------- |
| A    | `@`   | `34.111.32.235` |
| A    | `www` | `34.111.32.235` |

Do not enable the Cloudflare proxy during the initial cutover. It adds another cache/TLS layer and
can hide origin failures. Consider it later with SSL/TLS `Full (strict)` and explicit bypass rules
for `/admin`, authentication, preview, and other dynamic routes.

## Required verification

- `http://ddboxprinting.com/*` redirects once to `https://www.ddboxprinting.com/*`.
- `https://ddboxprinting.com/*` redirects once to `https://www.ddboxprinting.com/*`.
- Public routes return `200`; legacy routes return one permanent redirect to the correct route.
- `/robots.txt` permits public crawling, while `/admin`, preview, and thank-you routes remain
  `noindex`.
- `/sitemap.xml` and canonical tags contain no `run.app` URLs.
- Admin login, CMS read/write/publish, signed media upload, and quote-to-LINE delivery pass.
- Cloud Run and Load Balancer logs show no new 5xx/CORS/auth errors.

Because the hostname does not change, do not use Search Console Change of Address. Keep or verify
the Domain property, submit `https://www.ddboxprinting.com/sitemap.xml`, and monitor indexing and
404 reports.

## Rollback

If the availability, admin, upload, or lead-notification gate fails:

1. Restore the two Wix DNS targets captured immediately before cutover.
2. Keep the certificate-validation CNAME records; they do not route user traffic.
3. Route `ddbox-web-prod` traffic back to the last verified revision if the issue is application
   specific.
4. Restore global `noindex` before exposing the candidate again outside the approved window.
5. Record the failing request IDs and inspect bounded Cloud Run/Load Balancer logs.
