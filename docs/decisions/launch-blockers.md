# Launch-blocking decisions and inputs

These items cannot be inferred from the repository and must be resolved before production provisioning or publication.

Resolved: the owner accepted the documented shared-project exception for `the49-487609` on 2026-08-28, and the isolated foundation was applied from an approved Terraform plan. See `docs/decisions/0002-shared-gcp-project-exception.md`. The named Firebase admin/recovery owner is `paobansawang@gmail.com`. Both public test Cloud Run services and their test runtime secret versions were deployed on 2026-08-29.

| Decision/input | Required owner | Blocks |
| --- | --- | --- |
| Canonical domain and Wix replacement/cutover plan | Business owner | Canonical URLs, redirects, Search Console, DNS |
| Register the LINE OA in the approved LINE Group and promote its captured target ID | Business owner | Enabling LINE-primary/Gmail-fallback notifications |
| Approved NAP, LINE OA, email, hours, and map | Business owner | Contact page and LocalBusiness JSON-LD |
| Approved privacy notice, consent behavior, retention, and terms | Business/legal owner | Public legal pages, analytics, production leads |
| Approved claims, MOQ guidance, lead times, delivery coverage, and factory capabilities | Operations/business owner | Trust, offers, product copy, FAQs |
| Publishing rights for each logo, testimonial, case study, and branded image | Business owner | Gallery/content migration |
| Authentic high-resolution factory, machinery, team, and QC media | Business owner | Proof sections and launch visual QA |
| Legacy Wix URL inventory and redirect decisions | SEO/business owner | Domain cutover |

Until resolved, the implementation omits unsupported claims and contact facts, keeps legal drafts `noindex`, disables analytics/ads, and does not mutate GCP resources.
