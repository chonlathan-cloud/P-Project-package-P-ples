# DD BOX MCP & Meta Integration — Action Plan v1.1

**Status:** Proposed for review — documentation only; no GCP resource, Meta asset, token, campaign, tracking setting, or production runtime has been changed by this document  
**Decision date:** 2026-09-07  
**Primary owner:** Pao  
**Repository:** `chonlathan-cloud/P-Project-package-P-ples`  
**Target GCP project:** `the49-487609`  
**Target region:** `asia-southeast1`

---

## 1. Purpose

สร้างระบบที่ทำให้ Pao ใช้ ChatGPT ถามข้อมูลล่าสุดของ DD BOX จาก Facebook Page, Meta Ads, Website Leads และ Integration Health ด้วยภาษาธรรมชาติ โดยเน้นผลทางธุรกิจและความน่าเชื่อถือของข้อมูล ไม่ใช่เพียง Reach, Click หรือ Engagement

เป้าหมายระยะยาวคือวัด Funnel ต่อไปนี้ได้จริง:

```text
Spend
→ Raw Lead
→ Contactable Lead
→ Qualified Lead
→ Quotation
→ Won Order
→ Revenue
→ Repeat Order
```

Repository ปัจจุบันมีข้อมูลถึงระดับ Website Lead Intake และ Notification เป็นหลัก จึงต้องแยก Metrics ที่วัดได้จริงใน V1 ออกจาก Sales/CRM Metrics ที่ยังไม่มี Source of Truth

---

## 2. Confirmed decisions

| Area | Confirmed decision |
| --- | --- |
| MCP user | Pao คนเดียว |
| ChatGPT plan | ChatGPT Pro |
| MCP capability | Read-only / fetch tools เท่านั้นใน V1 |
| End-user login | Google Sign-in |
| Allowlist account | บัญชีเดียวกับ Firebase admin/recovery ที่ระบุอยู่ใน Repository |
| Meta owner for V1 | Pao Personal Facebook Account |
| Meta App | สร้างแล้ว ชื่อ `DD BOX M integration`; Numeric App ID เก็บเป็น protected runtime configuration ไม่บันทึกใน Public Repository |
| Meta App contact | ใช้บัญชีเดียวกับ Firebase admin/recovery; ไม่บันทึก Email ซ้ำในเอกสาร Public |
| Business Portfolio | Deferred; ไม่เป็น Blocker ของ V1 |
| Environment | สร้างเฉพาะ Production resources สำหรับ MCP และ Meta Integration |
| Release model | Production-only with guarded releases and shadow mode |
| Cloud Run services | `ddbox-mcp-prod`, `ddbox-meta-integration-prod` |
| Service accounts | `ddbox-mcp-prod`, `ddbox-meta-integration-prod` |
| Meta scope | Page/Post/Public Comment/Insights แบบ Read-only; Messenger data ปิดใน V1 |
| Paid Ads | ใช้ Official Meta Ads MCP แบบ Read-only ก่อน |
| Website Leads | Aggregate และ Masked detail ผ่าน `ddbox-content-api-prod` |
| Private conversations | ไม่เก็บ Raw Messenger หรือ Raw LINE conversation |
| Retention | อนุมัติ Default Retention ตาม Section 12 |
| SLA | ปิด SLA measurement/alert ใน V1; ใช้ `TBD` จนมี business hours และ tracked response state |
| Automated actions | ไม่มีการ Post, Reply, Pause Ads, Change Budget หรือแก้ Lead Status อัตโนมัติ |
| Pixel/CAPI | ยังไม่ Activate จน Privacy/Consent/Tracking QA ผ่าน |

---

## 3. Source authority and evidence status

### 3.1 Accepted repository decisions

- `docs/decisions/0001-service-boundaries.md`
- `docs/decisions/0002-shared-gcp-project-exception.md`
- `AGENTS.md`

### 3.2 Current implementation evidence

- `services/content-api/src/ddbox_api/domain/models.py`
- `services/content-api/src/ddbox_api/services/leads.py`
- `services/content-api/src/ddbox_api/services/line_flex.py`
- `services/content-api/src/ddbox_api/api/integrations.py`

### 3.3 Business and marketing planning references

- `DD BOX — Offer & Customer Journey Design v1.0`
- `07 - Campaign & Media Plan`
- `Facebook Page 45 วัน - Content Calendar พร้อมสารที่ต้องการสื่อสาร`

Marketing plans define intended goals and measurement direction. Draft statements about MOQ, price, lead time, sample terms, SLA, claims, quotation performance, and customer outcomes do not become confirmed business facts automatically.

### 3.4 Owner-confirmed but not independently verified

- Pao has Full Control of the DD BOX Facebook Page
- Meta App exists under Pao's Developer account
- The supplied Page and Ad Account are intended DD BOX assets
- Sales primary team is คุณเปิ้ล and คุณวิว, with 1–2 Admins helping answer basic questions

Canonical Meta asset IDs and permissions must still be verified through the authorized Meta UI/API during implementation.

---

## 4. Strategic principle

> MCP is an AI access layer, not a source of truth, CRM, webhook engine, token vault, or autonomous marketing operator.

Consequences:

- `ddbox-content-api-prod` remains the owner of Website Lead business rules
- `ddbox-meta-integration-prod` owns Meta Page ingestion and normalized Meta data
- `ddbox-mcp-prod` exposes bounded business tools but does not read Firestore directly
- Write actions remain outside V1
- Missing Sales data is reported as unavailable, not inferred or replaced with zero

---

## 5. V1 goals and non-goals

### 5.1 V1 goals

1. Read and summarize Facebook Page/Post performance for a requested period
2. Read approved Public Comment data after redaction
3. Summarize Website Lead Intake as aggregate and masked records
4. Distinguish Raw Leads from rule-based potential high-value leads
5. Show data freshness, webhook health, sync status, permission/token health, and tracking readiness
6. Read Paid Ads delivery/performance through Official Meta Ads MCP when connected
7. Answer the three confirmed business questions in Section 16
8. Include time window, timezone, source, freshness, and limitations in every tool response

### 5.2 Explicit non-goals for V1

- CRM or Sales Pipeline implementation
- Customer assignment automation
- Quotation creation
- Verified revenue attribution
- Messenger ingestion
- Raw LINE conversation ingestion
- Automated comment/message reply
- Automated campaign, budget, audience, or creative changes
- BigQuery or Looker Studio
- Multi-user RBAC
- Customer-facing chatbot
- Sentiment classification presented as fact

---

## 6. V1 identity and credential strategy

### 6.1 Personal-account-backed Meta authorization

V1 uses Pao's Personal Facebook Account as the human identity authorizing the DD BOX Page:

```text
Pao Personal Facebook Account
        |
        | Meta OAuth authorization
        v
DD BOX M integration
        |
        | User/Page access token
        v
Secret Manager
        |
        v
ddbox-meta-integration-prod
```

Controls:

- Do not store or request Facebook password
- Do not paste User/Page Access Token into ChatGPT or GitHub
- Store token values only in Secret Manager
- Store only non-secret token metadata in Firestore
- Monitor token validity and permission loss
- Reauthorization is an explicit owner action

### 6.2 Credential abstraction

The Meta client must depend on an interface rather than a Personal token implementation:

```text
MetaCredentialProvider
├── PersonalOwnerTokenProvider        # V1
└── BusinessSystemUserTokenProvider   # Future hardening
```

This prevents a future Portfolio/System User migration from forcing changes to MCP tool contracts or Meta domain logic.

### 6.3 Business Portfolio is deferred

The existing `SPA 49` Portfolio and DD BOX asset assignment are not V1 blockers.

Portfolio work becomes a separate hardening gate before one or more of the following:

- Long-lived business-owned machine identity
- Pixel/Dataset/CAPI activation
- Multi-user business administration
- Partner access
- Business continuity independent of one Personal Account

Do not assign or move assets during V1 implementation without a separate reviewed operational plan.

---

## 7. Target architecture

```text
                                  ChatGPT Pro
                                      |
                     +----------------+----------------+
                     |                                 |
          Official Meta Ads MCP                DD BOX Custom MCP
          paid ads read/reporting                read-only tools
                     |                                 |
                Meta OAuth                 Google Sign-in + OAuth 2.1
                                                       |
                                               ddbox-mcp-prod
                                         public endpoint, OAuth required
                                                       |
                         +-----------------------------+------------------+
                         |                                                |
          Google-signed Cloud Run ID token                              |
                         |                                                |
              ddbox-content-api-prod                         ddbox-meta-integration-prod
              Website lead source of truth                  Meta Page integration owner
                         |                                   |          |
                    Firestore                               |          +--> Graph API sync
                    ddbox-prod                              |
                                                            +--> Meta Webhook endpoint
                                                                    |
                                                                  Pub/Sub
                                                                    |
                                                        normalized event processing
                                                                    |
                                                              Firestore
                                                           ddbox-meta-prod
```

---

## 8. Service boundaries

### 8.1 `ddbox-mcp-prod`

Responsibilities:

- Serve a Streamable HTTP MCP endpoint
- Expose only read-only, business-oriented tools
- Validate OAuth issuer, audience, expiry, scopes, and immutable subject
- Enforce Pao-only allowlist
- Call internal DD BOX services with short-lived Google-signed ID tokens
- Normalize responses into stable versioned schemas
- Add provenance, freshness, timezone, and limitations
- Log tool name, caller subject hash, latency, result count, and status without PII

Must not:

- Store Meta access tokens
- Read Firestore directly
- Return raw phone, email, LINE ID, or private messages
- Execute write/modify actions
- Proxy arbitrary URLs or Graph API paths supplied by the model
- Accept free-form SQL, collection names, or unlimited date ranges

### 8.2 `ddbox-meta-integration-prod`

Responsibilities:

- Receive and verify Meta Webhooks
- Pull Page/Post/Insights data through a pinned Graph API version
- Read Public Comments only within approved permission and retention scope
- Normalize and redact data before storage
- Deduplicate and safely retry webhook delivery
- Run scheduled reconciliation for missed events
- Maintain token/permission health metadata without exposing token values
- Serve internal read-only query endpoints to `ddbox-mcp-prod`
- Serve Pub/Sub/Scheduler worker endpoints protected by Google ID tokens

Must not:

- Reply to comments or messages
- Publish posts
- Manage campaigns
- Store Messenger data in V1
- Store raw private conversations
- Expose a generic Graph API passthrough

### 8.3 `ddbox-content-api-prod`

Existing owner of:

- Website Lead creation and validation
- Lead idempotency
- LINE notification and Gmail fallback
- Content/media business rules

Required internal endpoints:

```text
GET /internal/v1/analytics/leads/summary
GET /internal/v1/analytics/leads/action-needed
GET /internal/v1/analytics/health
```

Requirements:

- Require Google-signed ID token from `ddbox-mcp-prod`
- Validate audience and caller service account
- Return aggregate or masked data only
- Apply bounded date windows and result limits
- Do not copy Website Lead PII into `ddbox-meta-prod`

### 8.4 `ddbox-web-prod`

No MCP-specific privileged access.

Future tracking may add:

- Consent-aware Meta Pixel
- UTM and click-ID capture
- Browser/server event ID deduplication
- Server-side Lead event only after durable Lead storage

Tracking activation is a separate approval gate.

---

## 9. Paid Ads strategy

### 9.1 Preferred V1 path

Use Official Meta Ads MCP as a separate read-only data source:

```text
Official Meta Ads MCP
- Spend
- Impressions
- Clicks
- CPC / CPM / CTR
- Campaign / Ad Set / Ad delivery
- Available signal diagnostics

DD BOX MCP
- Organic Page/Post performance
- Public Comment attention state
- Website Lead intake
- Internal integration health
```

This avoids duplicating Meta-maintained Ads reporting, token lifecycle, rate-limit handling, and campaign schemas.

### 9.2 Custom Ads ingestion fallback gate

Add `ads_read` ingestion to `ddbox-meta-integration-prod` only when at least one condition is proven:

1. ChatGPT Pro cannot reliably combine both MCP sources
2. Server-side scheduled cross-channel joins are required
3. Long-term Ads history must be retained independently
4. Ads alerts must run without a ChatGPT request
5. Official Meta Ads MCP lacks a required read-only metric

No Ads write permission is required in V1.

---

## 10. GCP resource plan

### 10.1 Required resources

```text
Cloud Run
- ddbox-mcp-prod
- ddbox-meta-integration-prod

Service accounts
- ddbox-mcp-prod
- ddbox-meta-integration-prod

Firestore
- ddbox-meta-prod

Pub/Sub
- ddbox-meta-events-prod
- ddbox-meta-events-worker-prod
- ddbox-meta-events-dlq-prod

Cloud Scheduler
- ddbox-meta-reconcile-prod
- ddbox-meta-daily-rollup-prod

Secret Manager containers
- ddbox-prod-meta-app-secret
- ddbox-prod-meta-webhook-verify-token
- ddbox-prod-meta-runtime-token
- ddbox-prod-mcp-auth-config
- ddbox-prod-mcp-pseudonymization-key
```

Secret names are proposals. Terraform may create secret containers but must not write secret payloads into state.

### 10.2 Firestore boundary

Use named database `ddbox-meta-prod` rather than reusing `ddbox-prod`.

Reasons:

- Isolate Meta-derived data from Website Lead PII
- Give the Meta integration identity access to one database only
- Keep MCP without database permission
- Support independent TTL/retention
- Reduce blast radius in the shared GCP project

Controls:

- Native mode
- `asia-southeast1`
- Deletion protection
- No browser access
- Conditional datastore IAM limited to `ddbox-meta-prod`

### 10.3 Initial low-cost sizing

| Service | Min instances | Max instances | CPU | Memory | Concurrency |
| --- | ---: | ---: | ---: | ---: | ---: |
| `ddbox-mcp-prod` | 0 | 2 | 1 | 512 MiB | 20 |
| `ddbox-meta-integration-prod` | 0 | 2 | 1 | 512 MiB | 20 |

Tune only from measured latency, backlog, failure rate, and cost.

---

## 11. Authentication and authorization

### 11.1 MCP end-user authentication

Confirmed policy:

```text
Upstream identity: Google Sign-in
Allowed user: Pao only
Bootstrap account: same as repository Firebase admin/recovery
Primary authorization key after first login: immutable OAuth subject (`sub`)
Default data access: Aggregate + Masked PII
```

Email can be used only as a bootstrap/secondary check. The immutable `sub` becomes the primary allowlist value after the first verified login.

### 11.2 OAuth provider decision

Do not build a custom OAuth authorization server before a compatibility spike.

The selected provider must support the current ChatGPT remote-MCP requirements, including:

- Authorization Code + PKCE
- Refresh/offline access
- Protected Resource Metadata
- Authorization Server Metadata
- Audience-restricted access tokens
- JWKS or secure token introspection
- Google as upstream Identity Provider
- Stable immutable subject

Provider selection is an Engineering ADR, not a Business-input blocker. Compare managed options on compatibility, cost, operational burden, revocation, and auditability before choosing.

### 11.3 Proposed MCP scopes

```text
ddbox.read.summary
ddbox.read.content
ddbox.read.leads.masked
ddbox.read.attention
ddbox.read.health
```

No write scope exists in V1.

### 11.4 Service-to-service authentication

Use attached service identities and short-lived Google-signed ID tokens.

Each receiving service validates:

- Signature
- Issuer
- Audience
- Expiration
- Caller service account

Do not download service-account keys.

### 11.5 Public endpoint controls

Both services require public network reachability:

- ChatGPT reaches the MCP endpoint
- Meta reaches the Webhook endpoint

Application-layer controls are mandatory:

- MCP routes: OAuth bearer token
- Meta webhook: verification challenge and `X-Hub-Signature-256`
- Pub/Sub/Scheduler/internal routes: Google ID token
- Health/metadata routes: non-sensitive output only

---

## 12. Privacy and approved retention defaults

The owner approved the following V1 defaults:

| Data | V1 policy | Retention |
| --- | --- | ---: |
| Public Comments | Store only after PII redaction and actor pseudonymization | 90 days |
| Webhook processing metadata | Store event key/status without raw private body | 30 days |
| Messenger metadata/body | Do not collect in V1 | 0 days |
| Raw LINE conversation | Do not collect | 0 days |
| Page/Post daily aggregate metrics | Aggregate only | 25 months |
| Sync/job health records | No PII | 90 days |
| Attention items | Redacted; remove 90 days after resolution | 90 days after resolution |
| Website Lead data | Remains under `ddbox-content-api-prod` policy | No copy to Meta database |

Additional controls:

- Mask PII in every MCP response
- Use a keyed hash for commenter identifiers where needed
- Store token values only in Secret Manager
- Do not place PII in logs, traces, metrics, errors, or alert titles
- Use synthetic fixtures in tests
- Enforce bounded date windows and result limits

These values are approved operating defaults for V1; they do not replace final legal/privacy review required for broader public tracking or App Review.

---

## 13. Meta App and Page setup plan

### 13.1 App inventory

Owner-confirmed configuration:

```text
Display name: DD BOX M integration
Owner identity: Pao Personal Facebook Account
App ID: recorded outside this public document
Contact account: same as repository Firebase admin/recovery
```

App Secret, User Access Token, Page Access Token, Webhook Verify Token, and OAuth credentials must never be sent through ChatGPT or committed to Git.

### 13.2 Verify canonical Page and Ad Account IDs

Before enabling production reads:

- Authorize with Pao's Meta account
- List accessible Pages through the current supported Graph API flow
- Match Page name, URL, and ownership
- Record the canonical Page ID in protected runtime configuration
- Confirm the intended DD BOX Ad Account in Ads MCP/Ads Manager
- Do not rely only on screenshot text or a profile URL identifier

### 13.3 Minimum-permission principle

Exact current permission names and review requirements must be rechecked against official Meta documentation during implementation.

Expected V1 needs:

- Discover accessible Pages
- Read Page-owned content and engagement
- Read available Page/Post insights
- Subscribe to Page webhook fields
- Read approved Public Comment fields

Explicitly excluded from V1:

- Messenger permissions
- Post/comment write permissions
- Ads management permissions
- Instant Form Lead retrieval
- Business Portfolio management at runtime

### 13.4 Webhook endpoints

```text
GET  /v1/webhooks/meta
POST /v1/webhooks/meta
```

Requirements:

- Verify subscription challenge token
- Verify `X-Hub-Signature-256` against raw request bytes
- Enforce body-size limits
- Generate a deterministic event key
- Publish a minimal normalized envelope to Pub/Sub
- Return quickly; do not call Graph API in the webhook request path
- Never log raw payloads containing user-derived content

### 13.5 Token lifecycle

- Store token values only in Secret Manager
- Store non-secret metadata: verified time, scopes, asset IDs, expiry where available
- Run scheduled permission/token health checks
- Alert on expiry risk, revocation, or permission loss
- Use explicit reauthorization; never scrape or automate Personal login
- Do not deploy temporary development tokens as permanent production credentials

### 13.6 Portfolio migration later

A future Portfolio migration must be documented separately and include:

- Asset ownership review
- Billing and partner impact
- Before/after inventory
- Runtime credential rotation
- Rollback path

---

## 14. Meta ingestion flow

### 14.1 Webhook flow

```text
Meta
→ /v1/webhooks/meta
→ verify challenge/signature
→ derive deterministic event key
→ Pub/Sub
→ authenticated worker
→ normalize and redact
→ Firestore transaction
→ update attention/read model
```

### 14.2 Scheduled reconciliation

Webhooks are not the only source of truth for data completeness.

```text
Every 15–60 minutes, starting conservatively:
- reconcile recent Page Posts/Public Comments
- recover missed events
- refresh permission/token health

Daily:
- Page/Post insights rollup
- freshness checks
- TTL/retention cleanup checks
```

### 14.3 Reliability controls

- Assume at-least-once delivery
- Idempotent writes by deterministic event key
- Exponential backoff with jitter
- Retry only transient failures
- Bounded attempts and DLQ
- Reconciliation window for missed events
- Separate source timestamps from ingestion timestamps
- Report missing data as unavailable, not zero

---

## 15. Firestore data model

Proposed collections in `ddbox-meta-prod`:

| Collection | Purpose | Retention |
| --- | --- | ---: |
| `connections` | App/Page connection metadata; no token value | Active + audit history |
| `page_posts` | Page-owned Post metadata and sanitized excerpt | 25 months |
| `page_daily_metrics` | Daily Page aggregates | 25 months |
| `post_daily_metrics` | Daily Post aggregates | 25 months |
| `public_comments` | Redacted Public Comment and pseudonymous actor key | 90 days |
| `webhook_events` | Deduplication and processing state | 30 days |
| `sync_runs` | Cursor, status, rate-limit metadata, redacted errors | 90 days |
| `daily_rollups` | MCP-ready aggregates | 25 months |
| `attention_items` | Open/resolved follow-up state | 90 days after resolution |

Required common fields:

```text
source
source_id
source_created_at
ingested_at
last_reconciled_at
schema_version
redaction_version
status
```

---

## 16. MCP tool contracts

Every tool is read-only, bounded, deterministic, and versioned.

Every response includes:

```text
window
comparison_window when applicable
timezone = Asia/Bangkok
generated_at
sources[]
source_freshness[]
metrics_or_items
limitations[]
```

### 16.1 `get_marketing_snapshot`

Purpose: สรุป Facebook Page, Website Leads, and Paid Ads source status for a requested period.

Inputs:

```text
start_date: YYYY-MM-DD
end_date: YYYY-MM-DD
compare_to_previous_period: boolean = true
include: [page, website_leads, ads]
```

Outputs:

- Page posts published
- Available Page/Post metrics
- Public Comments received/open
- Website Raw Leads
- Quantity bands
- Potential high-value lead count
- Lead notification failure count
- Ads source availability and available metrics
- Explicit data gaps

### 16.2 `get_content_performance`

Purpose: Compare Organic Posts without claiming that an Engagement winner is a business winner.

Inputs:

```text
start_date
end_date
rank_by: engagement | reach | clicks | comments | recent
limit: 1..20
```

Outputs:

- Post ID/permalink
- Published time
- Format
- Sanitized excerpt
- Available metrics
- Freshness
- Attribution limitation

Do not expose `lead_assists` until UTM/content attribution is implemented and validated.

### 16.3 `get_attention_queue`

Purpose: Show items requiring human review.

Inputs:

```text
since_hours: 1..168
types: [public_comment, website_lead, integration]
status: open | all
limit: 1..50
```

Possible outputs:

- Redacted Public Comment requiring Page review
- Website Lead reference with masked fields and notification failure
- Stale/failed integration

No Messenger item type exists in V1.

### 16.4 `get_lead_intake_summary`

Purpose: Analyze Website Lead Intake without presenting it as Sales qualification.

Inputs:

```text
start_date
end_date
group_by: source | quantity_band | product_type | province
include_masked_examples: boolean = false
limit: 1..20
```

Outputs:

- Unique Raw Leads
- Duplicate submissions
- Captured source/campaign values
- Quantity bands
- Potential high-value lead proxy
- Missing-data counts
- Notification status

### 16.5 `get_integration_health`

Outputs:

- MCP auth health
- Content API health
- Last successful/failed Meta webhook
- Last Page reconciliation
- Last insights rollup
- Token/permission health without token values
- Pub/Sub backlog/DLQ state
- Pixel/Dataset configured/active state
- Official Ads MCP connection state when observable
- Blocking actions

### 16.6 Future `get_campaign_performance`

Create only when custom Ads ingestion passes the fallback gate. Until then, use Official Meta Ads MCP directly.

---

## 17. Confirmed business questions

### Question 1

> สรุปผล Facebook Page, Meta Ads และ Website Leads ในช่วง 7 หรือ 30 วันที่ผ่านมา

Mapping:

```text
get_marketing_snapshot
+ Official Meta Ads MCP reporting tools
```

### Question 2

> Post และ Campaign ใดทำผลงานดีที่สุด แยกตาม Engagement, Click และ Potential high-value leads

Mapping:

```text
get_content_performance
+ get_lead_intake_summary
+ Official Meta Ads MCP reporting tools
```

The answer must not label an Engagement winner as a Sales winner without verified attribution.

### Question 3

> มี Comment, Lead หรือ Integration รายการใดที่ต้องตรวจสอบหรือติดตามต่อ

Mapping:

```text
get_attention_queue
+ get_integration_health
```

---

## 18. Metric semantics and truthfulness

### 18.1 Supported V1 terms

**Raw Lead**  
A unique Website form submission stored successfully by `ddbox-content-api-prod`.

**Potential high-value lead**  
A rule-based proxy, initially based on quantity such as `quantity >= 500`. It is not a Sales-qualified Lead.

**Notification sent**  
LINE or fallback notification delivery succeeded. It does not prove that Sales contacted the customer.

**Open Public Comment**  
A stored redacted comment with no tracked Page reply/resolution. It does not prove the customer was ignored through another channel.

### 18.2 Unavailable until Sales Pipeline exists

Return `unavailable` or `not_tracked`, never zero or an inference, for:

- Contactable Lead
- Qualified Lead
- Response Time
- Quotation count/value
- Won/Lost
- Closed Revenue
- Repeat Order
- CAC/ROAS based on verified revenue

### 18.3 Attribution rules

- Do not sum Google and Meta platform conversions as unique customers without deduplication
- Do not treat a LINE click, Messenger click, or Form Start as a Lead
- Do not treat Quotation value as realized revenue
- Do not infer causation from a short observation window
- Always disclose attribution window and source
- Join Campaign/Post data through stable UTM/content IDs, not fuzzy name matching

---

## 19. Alert and Sales operating model

### 19.1 Confirmed team

- Sales primary: คุณเปิ้ล
- Sales secondary: คุณวิว
- Admin triage: 1–2 people, identities not required for MCP V1

### 19.2 Existing Lead notification

The Content API already builds Sales-first LINE Flex messages and supports LINE push with Gmail fallback.

Interpretation:

```text
notification_status = sent
```

means the notification channel accepted delivery. It does not mean:

```text
customer_contacted = true
SLA_met = true
```

### 19.3 SLA policy for V1

Confirmed decision:

```text
SLA monitoring: disabled / TBD
Sales response-time metric: unavailable
SLA alerts: disabled
```

Reason:

- Business hours are not formally approved
- No tracked `customer_contacted_at` event exists
- Lead assignment is not yet stored
- “พร้อมตอบตลอดเวลา” is an operating intention, not a measurable 24/7 SLA

### 19.4 Alert routing

Sales LINE Group:

- Existing new Website Lead notification
- Existing fallback behavior
- No new SLA reminders in V1

Cloud Monitoring / owner channel:

- Webhook signature failure spike
- Token/permission failure
- Sync stale beyond technical threshold
- Pub/Sub DLQ greater than zero
- MCP authentication failure spike
- Internal API error/latency

Do not send infrastructure noise to the Sales LINE Group by default.

---

## 20. Production-only testing and release strategy

Production-only reduces duplicated infrastructure; it does not authorize untested changes.

### 20.1 Required local and CI tests

- Unit tests for every MCP tool and policy
- Contract tests for input/output schemas
- Synthetic Content API and Meta API fixtures
- Webhook challenge/signature tests
- Duplicate and out-of-order webhook tests
- PII redaction tests
- OAuth issuer/audience/scope/subject tests
- Cloud Run ID-token authorization tests
- Rate-limit, timeout, retry, and DLQ tests
- No-write regression tests
- Failure-path tests proving PII/secrets are absent from logs

### 20.2 Guarded rollout

```text
1. Provision integrations disabled
2. Deploy immutable image digest
3. Enable health and OAuth metadata only
4. Deploy candidate revision with no production traffic when possible
5. Run smoke tests against revision tag
6. Enable DDBOX_META_MODE=shadow
7. Ingest/compare data without customer-facing actions
8. Reconcile samples with Meta UI and Website records
9. Enable read-only MCP tools for Pao
10. Observe errors, freshness, and cost
11. Roll back to the previous revision on acceptance failure
```

### 20.3 Required feature flags

```text
DDBOX_MCP_READ_ONLY=true
DDBOX_META_MODE=disabled|shadow|active
DDBOX_MESSENGER_ENABLED=false
DDBOX_STORE_PRIVATE_MESSAGE_BODY=false
DDBOX_CUSTOM_ADS_SYNC_ENABLED=false
DDBOX_PIXEL_CAPI_ENABLED=false
DDBOX_SALES_SLA_ALERTS_ENABLED=false
```

No V1 flag may enable a write operation.

---

## 21. Implementation phases

### Phase 0 — Documentation and protected inventory

Deliverables:

- Record Meta App ID, canonical Page ID, and Ad Account ID outside Public source files
- Verify Page access through Pao OAuth
- Record current permissions and token metadata
- Confirm no unrelated Meta asset is modified

Acceptance:

- Canonical asset IDs verified through authorized UI/API
- No secret or Personal identifier committed
- Portfolio remains deferred without blocking V1

### Phase 1 — MCP authentication spike

Deliverables:

- Compare managed OAuth providers against current ChatGPT MCP requirements
- Record ADR for selected provider
- Configure Google upstream login
- Bootstrap with the repository admin/recovery account
- Store immutable subject allowlist after first successful login
- Prove unauthorized users cannot scan/call tools

Acceptance:

- Pao receives refreshable access
- Wrong issuer/audience/subject/scope is rejected
- No shared static token exists

### Phase 2 — GCP foundation

Deliverables:

- Terraform for two Cloud Run services, two service accounts, `ddbox-meta-prod`, Pub/Sub, Scheduler, Secret containers, IAM, logs, and alerts
- No secret payload in Terraform state
- MCP identity has no Firestore access
- Meta identity has database-scoped access only

Acceptance:

- Reviewed Terraform plan
- No access to unrelated `spa-*`, `the49-*`, `(default)`, `spa-db`, or `spa-test-db` resources

### Phase 3 — Meta Page integration in shadow mode

Deliverables:

- Personal-account-backed credential provider
- Graph API client with pinned version and bounded fields
- Webhook verification and Pub/Sub worker
- Page/Post/Public Comment sync
- PII redaction and pseudonymization
- Daily aggregate rollups
- Reconciliation and health endpoints

Acceptance:

- Duplicate webhook yields one normalized state transition
- No Messenger/private content is stored
- Samples reconcile with Meta UI within expected reporting delay
- Missed events are recoverable

### Phase 4 — Website Lead read model and MCP V1 tools

Deliverables:

- Internal Lead summary/action-needed endpoints
- Five read-only MCP tools
- Masking and bounded queries
- Tool audit logs
- Freshness/limitation metadata

Acceptance:

- Three confirmed business questions can be answered
- PII is absent from default outputs
- Qualified/Quotation/Revenue remain unavailable
- Existing LINE notification behavior is unchanged

### Phase 5 — Official Meta Ads MCP

Deliverables:

- Connect Official Meta Ads MCP read-only
- Verify the intended DD BOX Ad Account
- Validate combined prompts using Ads MCP and DD BOX MCP
- Record whether custom Ads ingestion is necessary

Acceptance:

- Spend/delivery reconcile with Ads Manager for the same dates, timezone, and attribution view
- No Ads write permission is granted
- Source failure is reported, not replaced with zero

### Phase 6 — Pixel/Dataset/CAPI readiness

Separate approval gate; not part of MCP V1 completion.

Required first:

- Approved public Privacy Notice and Consent behavior
- DD BOX business asset ownership decision
- Event naming and source-of-truth definition
- Browser/server event deduplication
- End-to-end Test Events QA

### Phase 7 — Sales Pipeline foundation

Future scope:

- Assignment
- Contact timestamps
- Qualification
- Quotation
- Won/Lost
- Revenue
- Reorder
- Offline/CAPI outcome feedback

Only after this phase may the system expose true CPQL, Quotation Rate, Win Rate, Revenue Attribution, or Repeat Rate.

---

## 22. Planned repository changes after approval

```text
docs/
├── Action_MCP_DDbox.md
└── decisions/
    ├── 0003-production-only-mcp-boundary.md
    ├── 0004-personal-meta-credential-boundary.md
    └── 0005-mcp-auth-provider.md

services/
├── content-api/
│   └── internal analytics endpoints and tests
├── ddbox-mcp/
│   ├── pyproject.toml
│   ├── Dockerfile
│   ├── src/ddbox_mcp/
│   │   ├── server.py
│   │   ├── auth/
│   │   ├── clients/
│   │   ├── policies/
│   │   ├── tools/
│   │   └── observability/
│   └── tests/
└── meta-integration/
    ├── pyproject.toml
    ├── Dockerfile
    ├── src/ddbox_meta/
    │   ├── api/
    │   ├── credentials/
    │   ├── graph/
    │   ├── webhooks/
    │   ├── repositories/
    │   ├── services/
    │   └── observability/
    └── tests/

deploy/
├── cloudbuild-mcp-prod.yaml
├── cloudbuild-meta-integration-prod.yaml
├── cloudrun-mcp-prod.env.yaml
└── cloudrun-meta-integration-prod.env.yaml

infra/
└── reviewed MCP/Meta resources and scoped IAM
```

Implement through small PRs, one trust/data boundary at a time.

---

## 23. Definition of done for MCP V1

V1 is complete only when all conditions pass:

1. Pao signs in through Google and no other subject can invoke tools
2. ChatGPT Pro scans and calls the remote read-only MCP
3. Tool schemas are versioned and contract-tested
4. MCP has no direct Firestore permission
5. Meta integration accesses only `ddbox-meta-prod`
6. Meta webhook signatures and Google internal tokens are validated
7. No Messenger or Raw LINE conversation is collected
8. Public Comment redaction and PII masking tests pass
9. Approved retention/TTL controls are active
10. Every response states date window, timezone, source, freshness, and limitations
11. Website Lead counts reconcile with Content API records
12. Page/Post metrics reconcile with Meta UI within expected reporting delay
13. Paid Ads values reconcile through Official Meta Ads MCP or an approved fallback
14. Missing Sales outcomes are shown as unavailable
15. No write/modify Meta or CRM tool exists
16. Rollback and shadow-mode procedures are tested
17. Monitoring covers auth failure, stale sync, DLQ, permission loss, and service errors
18. Production secret values exist only in Secret Manager and are absent from Git/Terraform state

---

## 24. Remaining engineering decisions — no additional business input required now

| Decision | Resolution method | Needed before |
| --- | --- | --- |
| MCP OAuth provider | Engineering compatibility/cost spike and ADR | Phase 1 completion |
| Canonical Page/Ad Account identifiers | Authorized Meta UI/API discovery | Shadow-mode configuration |
| Exact Meta permissions/webhook fields | Current official docs and App dashboard validation | Meta connection |
| Personal token renewal behavior | Controlled integration test | Active sync |
| Custom Ads ingestion needed or not | Official Ads MCP integration test | Phase 5 completion |
| Business Portfolio migration | Separate future owner decision | Business-owned credentials or Pixel/CAPI |
| Approved business hours and response event | Sales process design | SLA metrics/alerts |
| Final public privacy/consent implementation | Business/legal review | Pixel/CAPI and broader public tracking |

These items must not be guessed silently, but none requires more information from Pao before beginning the implementation sequence.

---

## 25. Decision log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-09-07 | MCP/Meta services are Production-only | Small project and single developer; reduce operational overhead |
| 2026-09-07 | Use guarded releases and shadow mode | Preserve test/rollback discipline without duplicate runtime services |
| 2026-09-07 | MCP V1 is read-only | ChatGPT Pro scope and lower operational risk |
| 2026-09-07 | Pao is the only MCP user | Current operating model |
| 2026-09-07 | Google Sign-in uses repository admin/recovery account | Reuse an existing controlled owner identity |
| 2026-09-07 | Immutable OAuth subject becomes primary allowlist | Avoid relying only on mutable Email |
| 2026-09-07 | V1 Meta authorization uses Pao Personal Account | Sufficient for owner-operated read-only V1 |
| 2026-09-07 | Business Portfolio is deferred | Not required to prove Page read integration; avoid premature asset movement |
| 2026-09-07 | Meta App `DD BOX M integration` is the V1 App | Owner-confirmed existing App |
| 2026-09-07 | Separate `ddbox-meta-prod` database | Isolate Meta-derived data from Website Lead PII |
| 2026-09-07 | Default retention approved | Data minimization with enough aggregate history for analysis |
| 2026-09-07 | Messenger and Raw LINE content excluded | Privacy and App Review risk reduction |
| 2026-09-07 | SLA monitoring disabled/TBD | No approved business hours or measurable contact event yet |
| 2026-09-07 | Prefer Official Meta Ads MCP | Avoid duplicating Meta-maintained Ads tooling |
| 2026-09-07 | Qualified Lead remains unavailable until Sales records it | Marketing proxy must not become a false Sales outcome |

---

## 26. References

Repository:

- `README.md`
- `AGENTS.md`
- `action-plan.md`
- `docs/decisions/0001-service-boundaries.md`
- `docs/decisions/0002-shared-gcp-project-exception.md`
- `docs/decisions/launch-blockers.md`
- `services/content-api/src/ddbox_api/domain/models.py`
- `services/content-api/src/ddbox_api/services/leads.py`
- `services/content-api/src/ddbox_api/services/line_flex.py`
- `services/content-api/src/ddbox_api/api/integrations.py`

Project planning sources:

- `DD BOX — Offer & Customer Journey Design v1.0`
- `07 - Campaign & Media Plan`
- `Facebook Page 45 วัน - Content Calendar พร้อมสารที่ต้องการสื่อสาร`

External implementation references must be checked again at implementation time:

- OpenAI Developer Mode and MCP App documentation
- Model Context Protocol Authorization specification
- Google Cloud Run service identity and rollout documentation
- Firestore named database and conditional IAM documentation
- Official Meta Pages API, Webhooks, Marketing API, and Ads MCP documentation
