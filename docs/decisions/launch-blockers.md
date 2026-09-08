# Launch-blocking decisions and inputs

These remaining business and operational inputs cannot be inferred from the repository and must be resolved as post-cutover launch follow-up.

Resolved: the owner accepted the documented shared-project exception for `the49-487609` on 2026-08-28, and the isolated foundation was applied from an approved Terraform plan. See `docs/decisions/0002-shared-gcp-project-exception.md`. The named Firebase admin/recovery owner is `paobansawang@gmail.com`. Both public test Cloud Run services and their test runtime secret versions were deployed on 2026-08-29. The test LINE OA group target was registered and promoted on 2026-09-04; both quote paths produced idempotent test leads and successful LINE notifications through the deployed web/API path. The test-only Cloud Tasks queue, OIDC task identity, least-privilege IAM, and Products/Offers/FAQs/Pages indexes were applied on 2026-09-04. API and Web test revisions were deployed by digest, and a synthetic lead verified Web → API → Firestore → Cloud Tasks → LINE delivery plus idempotent replay without a duplicate task. The reviewed Thai structured-content manifest was then published to `ddbox-test` with 5 Products, 3 Offers, 24 FAQs, and 3 Pages; a repeat plan reported all 35 records unchanged, and the public CMS-backed routes were live-verified. The guided Admin UI, Firebase test-app configuration guard, and sales-first LINE Flex payload were deployed as API revision `ddbox-content-api-test-00009-pxz`; Web revision `ddbox-web-test-00013-wtv` adds pre-upload file validation, Thai upload errors, strict finalized-media mapping for Gallery draft creation, focused error summaries, and the reviewed Gallery behavior that shows concept images only by default and orders concepts before authorized customer work in category views. The Google-managed Production certificate became active and Cloudflare `@`/`www` were cut over to `34.111.32.235` on 2026-09-05. Web revision `ddbox-web-prod-00004-yof` now serves 100% of Production traffic with indexing enabled and the owner-confirmed replacement logos. The replacement Production LINE group was registered and promoted into Secret Manager version 2 on 2026-09-05; API revision `ddbox-content-api-prod-00004-mep` now serves 100% of API traffic with that latest target. Gmail fallback remains unit-tested but was not forced live because doing so would require temporarily breaking valid runtime notification configuration.

| Decision/input                                                                         | Required owner            | Blocks                                          |
| -------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------- |
| Approved NAP, LINE OA, email, hours, and map                                           | Business owner            | Contact page and LocalBusiness JSON-LD          |
| Approved website terms                                                                 | Business/legal owner      | Public Terms page                               |
| Approved claims, MOQ guidance, lead times, delivery coverage, and factory capabilities | Operations/business owner | Trust, offers, product copy, FAQs               |
| Publishing rights for each logo, testimonial, case study, and branded image            | Business owner            | Gallery/content migration                       |
| Authentic high-resolution factory, machinery, team, and QC media                       | Business owner            | Proof sections and launch visual QA             |
| Legacy Wix URL inventory and redirect decisions                                        | SEO/business owner        | Post-cutover redirect completeness and SEO      |

The Production foundation, Content API, Web, HTTPS load balancer, managed certificate, and canonical
domain are live. Production currently uses LINE-only notification with durable Cloud Tasks retry;
Gmail fallback is deferred pending owner approval of an App Password. Nine owner-supplied client-logo
assets are published, including the owner-confirmed Fulfill and Hua Hed replacements. Production
indexing is enabled; analytics/ads remain disabled, the legacy Wix URL inventory is incomplete, and
the Wix site should remain available as the rollback origin for at least seven days after cutover.

The business owner approved the website Privacy Notice, consent behavior, and a 24-month retention
period for non-customer quote requests on 2026-09-08. The notice is effective from that date;
analytics and advertising tags remain disabled.
