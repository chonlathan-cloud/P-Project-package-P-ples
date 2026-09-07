# DD BOX MCP & Meta Integration — Action Plan

**Status:** Proposed for review — documentation only; no runtime or Meta asset has been changed by this document  
**Date:** 2026-09-07  
**Primary owner:** Pao  
**Repository:** `chonlathan-cloud/P-Project-package-P-ples`  
**Target region:** `asia-southeast1`  
**Target GCP project:** `the49-487609`

---

## 1. Purpose

สร้างระบบที่ทำให้ Pao ใช้ ChatGPT ถามข้อมูล DD BOX ด้วยภาษาธรรมชาติและได้รับคำตอบจากข้อมูลล่าสุดของ Facebook Page, Meta Ads, Website Leads และสถานะ Integration โดยเน้นผลทางธุรกิจ ไม่ใช่เพียง Reach, Click หรือ Engagement

เป้าหมายระยะยาวคือให้ตอบ Funnel นี้ได้อย่างน่าเชื่อถือ:

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

อย่างไรก็ตาม Repository ปัจจุบันยังมีข้อมูลถึงระดับ Website Lead Intake และ Notification เป็นหลัก จึงต้องแยกสิ่งที่ตอบได้จริงใน V1 ออกจากข้อมูล Sales/CRM ที่ยังไม่มี

---

## 2. Source authority and evidence status

เอกสารนี้แยกแหล่งข้อมูลตามระดับอำนาจดังนี้:

1. **Accepted repository decisions**
   - `docs/decisions/0001-service-boundaries.md`
   - `docs/decisions/0002-shared-gcp-project-exception.md`
   - `AGENTS.md`
2. **Current implementation evidence**
   - `services/content-api/src/ddbox_api/domain/models.py`
   - `services/content-api/src/ddbox_api/services/leads.py`
   - `services/content-api/src/ddbox_api/services/line_flex.py`
   - `services/content-api/src/ddbox_api/api/integrations.py`
3. **Confirmed owner inputs**
   - ChatGPT Pro; Pao เป็นผู้ใช้ MCP คนเดียว
   - Pao มี Full Control ของ Facebook Page
   - ยืนยันให้วางแผนรวม Facebook Page, Ad Account, Pixel/Dataset และ Meta App เข้า Business Portfolio
   - Sales หลักคือคุณเปิ้ลและคุณวิว; มี Admin ช่วยตอบคำถามพื้นฐานอีก 1–2 คน
   - Phase 1 ใช้ Read-only scope และไม่เก็บ Raw Messenger/LINE conversation
4. **Screenshot evidence**
   - มี Business Portfolio ชื่อ `SPA 49` แต่หน้าจอแสดง `0 business assets`
   - Facebook Page `DD Box Printing` และ Business Assets อื่นยังแสดงอยู่ใต้ Personal Account
   - มี Ad Account ที่เจ้าของยืนยัน แต่ Numeric ID จะไม่บันทึกลง Public Repository
   - Meta Developer account มีแล้ว แต่ยังไม่มี App
5. **Working marketing plans**
   - `DD BOX — Offer & Customer Journey Design v1.0`
   - `07 - Campaign & Media Plan`
   - เอกสารเหล่านี้ใช้กำหนดเป้าหมายและ Metrics แต่ข้อความด้านราคา, MOQ, SLA, Lead Time, Sample, Claim และ Sales outcome ยังไม่ถือเป็นข้อเท็จจริงที่อนุมัติทั้งหมด

เมื่อแหล่งข้อมูลขัดกัน ให้ Accepted ADR และ Current Implementation เป็นหลักสำหรับ Architecture/Behavior ส่วน Business Claims ต้องใช้ข้อมูลที่ Owner อนุมัติแล้วเท่านั้น

---

## 3. Executive decisions

| Area | Decision |
| --- | --- |
| Environment | สร้างเฉพาะ Production resources สำหรับ MCP และ Meta Integration |
| Release model | Production-only with guarded releases; ไม่ใช่การแก้ Live โดยไม่มี Test |
| Runtime services | `ddbox-mcp-prod`, `ddbox-meta-integration-prod` |
| Runtime identities | `ddbox-mcp-prod`, `ddbox-meta-integration-prod` service accounts |
| MCP capability | Read-only tools เท่านั้นใน V1 เพราะ ChatGPT Pro รองรับ Custom MCP แบบ read/fetch |
| MCP user | Pao คนเดียว ผ่าน Google Sign-in และ immutable user allowlist |
| Business data ownership | `ddbox-content-api-prod` ยังคงเป็นเจ้าของ Website Leads และ Business Rules |
| Meta data ownership | `ddbox-meta-integration-prod` เป็นเจ้าของ Page ingestion, webhook state และ normalized Meta data |
| Database access | `ddbox-mcp-prod` ห้ามอ่าน Firestore โดยตรง; เรียก Internal APIs เท่านั้น |
| Analytics store | เริ่มด้วย Firestore daily rollups; ยังไม่เพิ่ม BigQuery ใน V1 |
| Paid Ads | ใช้ Official Meta Ads MCP แบบ Read-only ก่อน; สร้าง Marketing API ingestion เองเมื่อมีเหตุผลรองรับ |
| Conversations | ไม่เก็บ Raw Messenger หรือ Raw LINE conversation ใน V1 |
| Automated actions | ไม่ Post, Reply, Pause Ads, Change Budget หรือแก้ Lead Status อัตโนมัติ |
| Pixel/CAPI | วางแผน Asset ได้ แต่ยังไม่ Activate จน Privacy/Consent/Tracking QA ผ่าน |

---

## 4. Important clarification: Business Portfolio is not ready yet

จาก Screenshot ยืนยันได้ว่า **มี Business Portfolio อยู่จริง** แต่ยังไม่ยืนยันว่า DD BOX Assets ถูกจัดเข้า Portfolio แล้ว:

```text
Business Portfolio: SPA 49
Business assets: 0

Personal account:
- DD Box Printing Facebook Page
- Other Facebook Pages
- Ad Account
```

ดังนั้นสถานะที่ถูกต้องคือ:

> Portfolio exists, but DD BOX asset ownership/assignment is still pending.

### Recommended decision

ก่อนสร้าง Meta App ให้เลือกหนึ่งทาง:

**Option A — Repurpose existing `SPA 49`**  
ใช้ได้เฉพาะเมื่อยืนยันว่า Portfolio นี้ไม่ใช่ของธุรกิจอื่น ไม่มี Asset, Partner, Billing หรือ Future use และสามารถเปลี่ยนชื่อเป็น `DD Box Printing` ได้โดยไม่กระทบระบบอื่น

**Option B — Create a dedicated `DD Box Printing` portfolio**  
ใช้เมื่อ `SPA 49` เป็นคนละธุรกิจหรืออาจนำกลับมาใช้ภายหลัง

**Strong recommendation:** ห้ามผสม DD BOX กับ Business Portfolio ของธุรกิจอื่น แม้ Owner จะเป็นคนเดียวกัน

ก่อน Assign Ad Account ต้องตรวจ Ownership, Billing, Existing permissions และผลของการย้ายใน Meta UI อีกครั้ง ไม่ดำเนินการจาก Screenshot อย่างเดียว

---

## 5. Goals and non-goals

### 5.1 V1 goals

1. อ่านและสรุป Facebook Page/Post performance ตามช่วงวันที่
2. แสดง Public Comments หรือ Message metadata ที่อาจต้องติดตาม โดยไม่เปิด Raw private conversation
3. สรุป Website Lead Intake แบบ Aggregate และ Masked detail
4. แยก Raw Lead ออกจาก Rule-based potential high-value lead
5. ตรวจ Data freshness, Webhook health, Sync status, Token status และ Tracking readiness
6. ใช้ข้อมูล Paid Ads จาก Official Meta Ads MCP เมื่อเชื่อมต่อได้
7. ให้ทุกคำตอบระบุ Source, Time window, Timezone, Freshness และ Limitation

### 5.2 Explicit non-goals for V1

- CRM เต็มรูปแบบ
- Sales assignment automation
- Quotation generation
- Revenue attribution แบบสมบูรณ์
- Automated comment/message reply
- Automated campaign or budget changes
- Raw Messenger/LINE archive
- Sentiment classification ที่ถือเป็นข้อเท็จจริง
- BigQuery/Looker Studio
- Multi-user RBAC
- Customer-facing chatbot

---

## 6. Target architecture

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
                                         (public network, OAuth required)
                                                       |
                         +-----------------------------+------------------+
                         |                                                |
          Cloud Run service-to-service ID token                         |
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

### Architectural principle

> MCP is an AI access layer, not a source of truth, CRM, webhook engine or token vault.

`ddbox-mcp-prod` ต้องไม่มีสิทธิ์อ่านฐานข้อมูลโดยตรง เพื่อให้ Business Rules, Masking, Query limits และ Audit ถูกบังคับใน Service ที่เป็นเจ้าของข้อมูล

---

## 7. Service boundaries

### 7.1 `ddbox-mcp-prod`

Responsibilities:

- Serve Streamable HTTP MCP endpoint
- Expose read-only, business-oriented tools
- Validate OAuth access tokens and scopes
- Enforce Pao allowlist
- Call internal DD BOX services with short-lived Cloud Run ID tokens
- Normalize tool responses into stable schemas
- Add data provenance, freshness and limitations
- Log tool name, caller subject, latency, result count and status without PII

Must not:

- Store Meta access tokens
- Read Firestore directly
- Return raw phone, email, LINE ID or private messages by default
- Execute write/modify actions
- Proxy arbitrary URLs, Graph API fields or Firestore queries supplied by the model
- Accept free-form SQL, collection names or Graph API paths

### 7.2 `ddbox-meta-integration-prod`

Responsibilities:

- Receive and verify Meta Webhooks
- Subscribe to the minimum Page webhook fields required by approved scope
- Pull Page/Post/Insights data through pinned Graph API version
- Normalize and redact events before storage
- Deduplicate webhook delivery
- Retry transient failures and quarantine poison events
- Maintain connection and token metadata without storing token values in Firestore
- Serve internal read-only query endpoints to `ddbox-mcp-prod`
- Serve internal job endpoints for Pub/Sub and Cloud Scheduler with Google ID token validation

Must not:

- Reply to comments or messages
- Publish posts
- Manage campaigns
- Store raw private conversations
- Expose generic Graph API passthrough endpoints

### 7.3 `ddbox-content-api-prod`

Existing owner of:

- Website Lead creation and validation
- Lead idempotency
- LINE notification and Gmail fallback
- Content and media business rules

Required additions:

```text
GET /internal/v1/analytics/leads/summary
GET /internal/v1/analytics/leads/action-needed
GET /internal/v1/analytics/health
```

These endpoints must:

- Require Google-signed ID token from `ddbox-mcp-prod`
- Validate audience and caller service account
- Return Aggregate or Masked data only
- Apply bounded date ranges and result limits
- Avoid returning PII unless a future separately approved scope exists

### 7.4 `ddbox-web-prod`

No MCP-specific privileged access.

Future tracking work may add:

- Consent-aware Meta Pixel
- Event ID generation for browser/server deduplication
- UTM and click ID capture
- Lead submission event only after durable storage succeeds

Tracking activation remains blocked until Privacy/Consent and Launch Readiness are approved.

---

## 8. Paid Ads strategy: do not rebuild Meta's official MCP first

### Preferred V1 path

Connect Meta's official Ads MCP as a separate read-only app and restrict it to the DD BOX Ad Account. Use ChatGPT to combine:

```text
Official Meta Ads MCP
- Spend
- Impressions
- Clicks
- CPC/CPM/CTR
- Campaign, Ad Set, Ad performance
- Dataset/signal diagnostics when available

DD BOX MCP
- Organic Page/Post performance
- Website lead intake
- Attention queue
- Internal integration health
```

This avoids maintaining a second Ads API client, token lifecycle, rate-limit handling and campaign schema in DD BOX code.

### Fallback gate

Add custom `ads_read` ingestion to `ddbox-meta-integration-prod` only when at least one condition is true:

1. ChatGPT Pro cannot reliably invoke both MCP apps in one answer
2. Cross-channel joins must run server-side on a schedule
3. Long-term daily history is required independent of Meta retention
4. Alerting must use Ads data without waiting for a ChatGPT request
5. Official Ads MCP does not expose a required read-only metric

No Ads write permission is required in V1.

---

## 9. GCP resource plan

### 9.1 Required resources

```text
Cloud Run services
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

Secret names are proposed; payloads must never be committed or placed in Terraform state.

### 9.2 Firestore boundary

Use a separate named database `ddbox-meta-prod` rather than reusing `ddbox-prod`.

Reasons:

- Isolate Meta event data from Website Lead PII
- Give `ddbox-meta-integration-prod` access to only one database
- Keep MCP without database permission
- Allow independent retention and TTL policies
- Reduce blast radius in the shared GCP project

Initial controls:

- Firestore Native mode
- `asia-southeast1`
- Delete protection enabled
- Restrictive client rules; no browser access
- Conditional `roles/datastore.user` binding limited to `ddbox-meta-prod`

### 9.3 Initial Cloud Run sizing

Proposed low-cost defaults, subject to measured load:

| Service | Min instances | Max instances | CPU | Memory | Concurrency |
| --- | ---: | ---: | ---: | ---: | ---: |
| `ddbox-mcp-prod` | 0 | 2 | 1 | 512 MiB | 20 |
| `ddbox-meta-integration-prod` | 0 | 2 | 1 | 512 MiB | 20 |

Do not increase limits before observing latency, webhook backlog, error rate and cost.

---

## 10. Authentication and authorization

### 10.1 MCP end-user authentication

Confirmed requirement:

```text
Upstream identity: Google Sign-in
Allowed user: Pao only
Default access: Aggregate + Masked PII
```

A Google login button alone is not enough. The MCP endpoint needs an OAuth 2.1-compatible authorization server that supports MCP discovery, PKCE, refresh tokens and audience-restricted access tokens.

### Recommended approach

Use a managed MCP-compatible authorization server with Google as upstream Identity Provider.

**Preferred:** WorkOS AuthKit  
**Acceptable alternative:** Auth0  
**Rejected for V1:** building a custom OAuth authorization server, using a shared static bearer token, relying on email header alone, or exposing a no-auth MCP endpoint

The final provider is an implementation decision, but it must support:

- OAuth Authorization Code + PKCE
- Refresh token/offline access needed by ChatGPT
- `/.well-known/oauth-authorization-server`
- MCP Protected Resource Metadata / RFC 9728
- JWT verification through JWKS or secure token introspection
- Audience validation for the exact MCP resource
- Stable immutable `sub`
- Google Sign-in

Authorization rule:

```text
allow when:
  token.iss == configured_issuer
  AND token.aud contains configured_mcp_audience
  AND token.sub is in allowed_subjects
  AND required scope is present
```

Email may be checked as a secondary safety control, but immutable `sub` is the primary identifier. The allowlist value must live in Secret Manager or protected runtime configuration, not the public repository.

### 10.2 Proposed MCP scopes

```text
ddbox.read.summary
ddbox.read.content
ddbox.read.leads.masked
ddbox.read.attention
ddbox.read.health
```

No write scope exists in V1.

### 10.3 Service-to-service authentication

`ddbox-mcp-prod` calls internal DD BOX endpoints with Google-signed ID tokens using its attached service account.

Each receiving endpoint must validate:

- Signature
- Issuer
- Audience
- Expiration
- Caller identity

Grant `roles/run.invoker` only where needed. Do not use downloaded service-account keys.

### 10.4 Public endpoint implications

Both services need public network reachability for different reasons:

- ChatGPT must reach the MCP endpoint
- Meta must reach the Webhook endpoint

Therefore Cloud Run IAM alone cannot be the only control. Application-layer authentication is mandatory:

- MCP routes: OAuth bearer token
- Meta webhook: verification challenge plus `X-Hub-Signature-256`
- Pub/Sub/Scheduler/internal routes: Google ID token
- Health/metadata routes: non-sensitive output only

All other unauthenticated requests return `401` or `404` without revealing internal details.

---

## 11. Meta asset and app setup plan

### Step 1 — Resolve Business Portfolio boundary

- Confirm whether `SPA 49` is unused and can be repurposed
- If not, create dedicated `DD Box Printing` portfolio
- Do not mix unrelated business assets
- Record the final Portfolio ID in protected deployment configuration, not source code

### Step 2 — Verify canonical asset IDs

The supplied Page URL and separately supplied Page ID contain different numeric identifiers. Before configuration:

- Query accessible Pages through the Graph API using Pao's authorized session
- Match Page name, URL and asset ownership
- Record the canonical Page ID
- Verify the Ad Account belongs to Pao and is the intended DD BOX account
- Do not rely on screenshot text as the only source of truth

Actual numeric IDs must be injected through environment configuration or Secret Manager and must not be hardcoded in the public repository.

### Step 3 — Assign assets

After ownership review, plan to assign:

- DD Box Printing Facebook Page
- DD BOX Ad Account
- Pixel/Dataset to be created
- Meta Developer App to be created

Record before/after screenshots and an asset inventory. Assignment is an operational action and requires separate execution approval.

### Step 4 — Create Meta App

Create the App under the selected DD BOX Business Portfolio. Because Meta changes App creation flows and use-case labels, select the current official use case at implementation time rather than hardcoding an old App Type in this document.

The App should initially remain in Development mode and allow only Pao/App roles until permissions, privacy policy, data deletion instructions and review requirements are satisfied.

### Step 5 — Request minimum permissions

Expected permissions must be validated against current official Meta documentation before implementation:

| Expected permission | Purpose | V1 status |
| --- | --- | --- |
| `pages_show_list` | Discover Pages the authorized user can access | Required |
| `pages_read_engagement` | Read Page-owned content and engagement | Required |
| `read_insights` | Page/Post insights | Required when available for requested metrics |
| `pages_manage_metadata` | Subscribe App to Page webhooks | Required for webhook setup |
| `pages_read_user_content` | Read public user content/comments where permitted | Required only for approved comment scope |
| `pages_messaging` | Receive/manage Messenger events | Metadata-only subset; defer if review burden is high |
| `ads_read` | Custom Ads reporting fallback | Not required when Official Ads MCP is sufficient |
| `business_management` | Asset setup/discovery where required | Setup-only; avoid in runtime if possible |
| `leads_retrieval` | Meta Instant Form leads | Excluded from V1 because campaign plan uses Website Leads |

Request no permission without a specific tool or data-flow requirement.

### Step 6 — Configure Webhooks

Public endpoint:

```text
POST /v1/webhooks/meta
GET  /v1/webhooks/meta
```

Requirements:

- Verify subscription challenge token
- Verify `X-Hub-Signature-256` against raw request bytes
- Enforce body-size limit
- Generate deterministic event key
- Publish normalized envelope to Pub/Sub
- Return success quickly; no Graph API call in request path
- Do not log raw payload or message text

Subscribe only to fields required for:

- Post/feed changes
- Public comments
- Messenger event metadata when approved

Exact field names must be discovered from the current App dashboard/API version during implementation.

### Step 7 — Token lifecycle

Production token strategy should prefer a Business/System User or another Meta-supported server-to-server mechanism tied to the DD BOX Portfolio and only the required assets.

Controls:

- Store token value only in Secret Manager
- Store token metadata separately: issued/verified time, scopes, asset IDs, expiry if present
- Run scheduled token/permission health check
- Alert before expiry or on permission loss
- Never paste access tokens into ChatGPT, GitHub, Terraform or logs
- Temporary development tokens must not be deployed as production secrets

### Step 8 — Pixel/Dataset and CAPI

Create the Pixel/Dataset in the DD BOX Portfolio, but activation is a separate tracking project gate.

Required before activation:

- Approved Privacy Notice and Consent behavior
- Event naming and source-of-truth definition
- Browser/server `event_id` deduplication
- Test Events verification
- UTM/click identifier storage
- `Lead` emitted only after durable lead creation
- No PII in analytics payload unless explicitly allowed, normalized and hashed according to platform requirements

The Campaign Plan requires tracking, CRM status updates and lead notification QA before Ad Day 1. Asset creation alone does not satisfy readiness.

---

## 12. Meta ingestion flow

### 12.1 Webhook flow

```text
Meta
→ /v1/webhooks/meta
→ verify signature
→ create event key
→ Pub/Sub topic
→ authenticated worker endpoint
→ normalize/redact
→ Firestore transaction
→ update attention state
```

### 12.2 Scheduled reconciliation

Webhooks are not sufficient as the only data source. Cloud Scheduler triggers:

```text
Every 15–60 minutes:
- reconcile recent posts/comments/message metadata
- detect missed webhook events
- refresh connection health

Daily:
- Page/Post insights rollup
- data freshness checks
- aggregate retention cleanup
```

Actual schedule should respect API limits and Page activity. Start conservatively and reduce frequency only when a business need exists.

### 12.3 Reliability controls

- At-least-once delivery assumed
- Idempotent writes by deterministic event key
- Exponential backoff with jitter
- Retry only transient failures
- Dead-letter after bounded attempts
- Per-source circuit breaker for throttling or invalid token
- Reconciliation window to recover missed events
- Source timestamps retained separately from ingestion timestamps

---

## 13. Firestore data model

Proposed collections in `ddbox-meta-prod`:

| Collection | Purpose | Retention proposal |
| --- | --- | --- |
| `connections` | Page/App/Ad connection metadata; no token value | Active + history |
| `page_posts` | Page-owned post metadata and sanitized message | 25 months or while needed |
| `page_daily_metrics` | Daily Page metrics | 25 months |
| `post_daily_metrics` | Daily post metrics | 25 months |
| `public_comments` | Sanitized public comment, state and pseudonymous actor key | 90 days |
| `messenger_thread_state` | Thread hash, received/responded timestamps, state; no message body | 30 days |
| `webhook_events` | Deduplication and processing state; no raw private content | 30 days |
| `sync_runs` | Job status, cursor, rate-limit metadata and errors | 90 days |
| `daily_rollups` | MCP-ready aggregates | 25 months |
| `attention_items` | Open/resolved follow-up state | 90 days after resolution |

Retention values are proposals, not legal approval. Final policy remains blocked by the repository's Privacy/Retention decision.

### Required common fields

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

Every metric document must include a clear metric name, period and source timestamp. Missing metrics are stored as unavailable, not zero.

---

## 14. MCP tool contracts

All tools are read-only, bounded and deterministic. Every response must include:

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

### 14.1 `get_marketing_snapshot`

Purpose: ตอบคำถามสรุป Facebook Page, Website Leads และสถานะ Paid Ads source ในช่วงวันที่

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
- Public comments received/open
- Website raw leads
- Quantity bands
- Potential high-value lead count
- Notification failure count
- Ads source status and metrics when Official Ads MCP/custom sync is available
- Explicit data gaps

### 14.2 `get_content_performance`

Purpose: เปรียบเทียบ Organic Posts โดยไม่สรุปว่าผู้ชนะทาง Engagement คือผู้ชนะทางธุรกิจ

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
- Data freshness
- Attribution note

`lead_assists` must not be exposed until UTM/content attribution is implemented and validated.

### 14.3 `get_attention_queue`

Purpose: แสดงรายการที่ควรให้คนตรวจสอบ

Inputs:

```text
since_hours: 1..168
types: [public_comment, messenger_metadata, website_lead, integration]
status: open | all
limit: 1..50
```

Outputs may include:

- Public comment requiring Page review
- Messenger thread metadata without message body
- Website lead with masked detail and failed notification
- Stale/failed integration

Must not return raw phone, email, LINE ID or private message body.

### 14.4 `get_lead_intake_summary`

Purpose: วิเคราะห์ Lead Intake โดยไม่อ้างว่าเป็น Qualified Lead

Inputs:

```text
start_date
end_date
group_by: source | quantity_band | product_type | province
include_masked_examples: boolean = false
limit: 1..20
```

Outputs:

- Unique raw leads
- Duplicate submissions
- Source/campaign values where captured
- Quantity bands
- `potential_high_value_leads` based on explicit proxy rule
- Missing-data counts
- Notification status

### 14.5 `get_integration_health`

Purpose: ตรวจความพร้อมและความสดของระบบ

Outputs:

- MCP auth health
- Content API health
- Meta webhook last success/failure
- Last Page sync
- Last insight rollup
- Token/permission health without token value
- Pub/Sub backlog/DLQ count
- Pixel/Dataset configured/active status
- Official Ads MCP connected status when discoverable
- Blocking actions

### 14.6 Optional future `get_campaign_performance`

Create only when custom Ads ingestion passes the fallback gate. Until then use Official Meta Ads MCP directly.

---

## 15. Metric semantics and truthfulness rules

### 15.1 Current supported terms

**Raw Lead**  
A unique Website form submission stored successfully by `ddbox-content-api-prod`.

**Potential high-value lead**  
A rule-based proxy, initially `quantity >= 500`, optionally combined with company/brand and repeat-intent data when those fields exist. This is not a Sales-qualified Lead.

**Notification sent**  
LINE or fallback delivery succeeded. It does not prove that Sales contacted the customer.

**Open public comment**  
A comment event that has no recorded Page reply/resolution state. It does not prove the customer was ignored outside the tracked channel.

### 15.2 Terms unavailable until CRM exists

The MCP must return `unavailable` or `not_tracked`, not zero, for:

- Contactable Lead
- Qualified Lead
- Response Time
- Quotation count/value
- Won/Lost
- Closed Revenue
- Repeat Order
- CAC/ROAS based on verified revenue

### 15.3 Attribution rules

- Do not sum Meta and Google platform conversions as unique customers without deduplication
- Do not treat LINE click, Messenger click or Form Start as a Lead
- Do not treat Quotation value as realized revenue
- Do not infer causation from correlation or a short observation window
- Always disclose attribution window and source
- Campaign/Post names should be joined through stable UTM/content IDs, not fuzzy text matching

---

## 16. Privacy and data minimization

### V1 policy

- Aggregate by default
- Mask PII in all MCP outputs
- Never store Raw LINE conversation
- Never store Raw Messenger message body
- Public comments may be stored only after PII redaction
- Pseudonymize commenter/thread identifiers with a keyed hash
- Do not store access tokens or secrets in Firestore
- Do not put PII in logs, traces, metrics, exception messages or alert titles
- Do not expose arbitrary post/comment search over unlimited history
- Enforce maximum date window and result limits

### Public repository policy

The repository is public. Do not commit:

- Meta numeric asset IDs unless explicitly approved as public
- Pao email or OAuth subject allowlist
- App ID when not operationally necessary
- Access token, App Secret or webhook verify token
- Customer contact data
- Raw webhook samples containing real user data

Use synthetic fixtures in tests.

---

## 17. Alert and Sales operating model

### Confirmed team

- Sales primary: คุณเปิ้ล
- Sales secondary: คุณวิว
- Admin triage: 1–2 people, identities TBD

### Existing implementation

The Content API already builds a Sales-first LINE Flex message and uses LINE push with Gmail fallback. This is useful foundation, but current code still notes that durable Cloud Tasks delivery is required before launch.

Therefore:

- `notification_status=sent` means delivery to notification channel, not customer contact
- “Sales พร้อมตอบตลอดเวลา” is an operating intention, not a measurable 24/7 SLA
- Alerts can be delivered continuously, but SLA timers must wait for approved business hours and owner assignment rules

### Alert routing

**Sales LINE Group**

- New Website Lead
- High-value proxy badge when quantity supports it
- Lead notification delivery failure only when Sales action is required

**Cloud Monitoring / owner email**

- Meta webhook signature failure spike
- Token/permission failure
- Sync stale beyond threshold
- Pub/Sub DLQ > 0
- MCP OAuth failure spike
- Internal API error/latency

Do not send infrastructure noise to the Sales LINE Group by default.

No automatic customer reply is authorized in V1.

---

## 18. Production-only testing and release strategy

Removing separate test services reduces operational work, but it does not remove testing.

### 18.1 Required local and CI tests

- Unit tests for every MCP tool and policy
- Contract tests for tool input/output schemas
- Synthetic Content API and Meta API fixtures
- Webhook challenge and signature tests
- Duplicate/out-of-order webhook tests
- PII redaction tests
- OAuth issuer/audience/scope/subject tests
- Cloud Run ID token authorization tests
- Rate-limit, timeout and retry tests
- No-write regression tests
- Failure-path tests proving secrets and PII are not logged

### 18.2 Guarded production rollout

```text
1. Provision service with all integrations disabled
2. Deploy immutable image digest
3. Enable only health and OAuth metadata
4. Deploy candidate revision with revision tag / no production traffic when possible
5. Run smoke tests against tagged revision
6. Enable DDBOX_META_MODE=shadow
7. Receive and validate events without alerts or downstream actions
8. Compare sampled data against Meta UI and Website records
9. Enable read-only MCP tools for Pao
10. Observe errors, freshness and cost
11. Roll back to prior revision on acceptance failure
```

### 18.3 Required feature flags

```text
DDBOX_MCP_READ_ONLY=true
DDBOX_META_MODE=disabled|shadow|active
DDBOX_MESSENGER_METADATA_ENABLED=false
DDBOX_STORE_PRIVATE_MESSAGE_BODY=false
DDBOX_CUSTOM_ADS_SYNC_ENABLED=false
DDBOX_PIXEL_CAPI_ENABLED=false
DDBOX_SALES_ALERTS_ENABLED=false
```

No flag may enable write operations in V1.

---

## 19. Implementation phases

### Phase 0 — Governance and asset inventory

Deliverables:

- Resolve `SPA 49` reuse vs dedicated DD BOX Portfolio
- Verify canonical Page and Ad Account IDs
- Create private asset inventory
- Confirm Privacy/Retention owner and business hours as open decisions
- Record current permissions and ownership screenshots

Acceptance:

- One unambiguous DD BOX Business Portfolio boundary
- No unrelated assets included
- Canonical IDs verified through API/UI

### Phase 1 — GCP foundation and MCP authentication

Deliverables:

- Terraform for two Cloud Run services, two service accounts, `ddbox-meta-prod`, Pub/Sub, Scheduler, secrets and IAM
- Managed OAuth provider with Google Sign-in
- Pao immutable-subject allowlist
- MCP health and metadata endpoints
- Internal service-to-service authentication proof

Acceptance:

- Unauthorized user cannot scan or call tools
- Pao can authenticate and receive refreshable access
- MCP service has no Firestore role
- Meta integration identity can access only `ddbox-meta-prod`

### Phase 2 — Meta Page integration in shadow mode

Deliverables:

- Meta App and minimum permissions
- Webhook verification/signature handling
- Pub/Sub worker and deduplication
- Page/Post sync
- Daily metrics rollup
- Public comment sanitization
- Connection health endpoint

Acceptance:

- Duplicate webhook produces one normalized state change
- No raw private message content is stored
- Sample metrics reconcile with Meta UI within expected reporting delay
- Missed event can be recovered by reconciliation job

### Phase 3 — Website Lead read model and MCP V1 tools

Deliverables:

- Internal lead summary/action-needed endpoints in Content API
- Five read-only MCP tools
- Masking and bounded queries
- Tool audit logs
- Freshness and limitation fields

Acceptance:

- Default three business questions can be answered
- PII is absent from default outputs
- Qualified/Quotation/Revenue are shown as unavailable until tracked
- LINE notification path continues to work unchanged

### Phase 4 — Paid Ads connection

Deliverables:

- Connect Official Meta Ads MCP read-only
- Restrict account selection to DD BOX
- Validate combined prompts using Official Ads MCP + DD BOX MCP
- Document fallback decision

Acceptance:

- Spend/delivery values match Ads Manager for the same date, timezone and attribution view
- No campaign, budget or audience write permission is granted
- Failure of one source is reported rather than silently replaced with zero

### Phase 5 — Pixel/Dataset/CAPI readiness

Separate approval gate after Privacy/Consent is approved.

Deliverables:

- Pixel/Dataset ownership in DD BOX Portfolio
- Consent-aware browser event plan
- Server Lead event after durable storage
- Event ID deduplication
- Test Events and end-to-end QA
- `get_integration_health` tracking checks

Acceptance:

- One real form submission produces one durable Lead and one deduplicated Meta Lead event
- Button clicks do not count as Primary Leads
- No advertising launch before readiness checklist passes

### Phase 6 — Sales pipeline foundation

Future scope:

- Lead assignment
- Contact timestamps
- Qualification
- Quotation
- Won/Lost
- Revenue
- Reorder
- Offline/CAPI outcome feedback

Only after this phase may MCP expose true CPQL, Quotation rate, Win rate, Revenue attribution or Repeat rate.

---

## 20. Default business questions and tool mapping

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

The answer must not call an Engagement winner a Sales winner without verified attribution.

### Question 3

> มี Comment, Lead หรือ Integration รายการใดที่ต้องตรวจสอบหรือติดตามต่อ

Mapping:

```text
get_attention_queue
+ get_integration_health
```

---

## 21. Planned repository changes after document approval

```text
docs/
├── Action_MCP_DDbox.md
└── decisions/
    ├── 0003-production-only-mcp-boundary.md
    ├── 0004-meta-asset-and-token-boundary.md
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
└── foundation or dedicated reviewed modules for MCP/Meta resources
```

Do not implement all files in one change. Use small PRs with one security/data boundary at a time.

---

## 22. Definition of done for V1

V1 is done only when all conditions pass:

1. Pao signs in with Google and no other user can invoke tools
2. ChatGPT Pro can scan and call the remote read-only MCP
3. Tool schemas are versioned and contract-tested
4. MCP has no direct Firestore access
5. Meta integration can only access `ddbox-meta-prod`
6. Meta webhook signatures and Google internal tokens are validated
7. No raw Messenger/LINE conversation is stored
8. PII masking tests pass
9. Every response states date window, timezone, sources, freshness and limitations
10. Website Lead count reconciles with Content API records
11. Page/Post metrics reconcile with Meta UI within expected reporting delay
12. Paid Ads values reconcile through Official Meta Ads MCP or the approved fallback
13. Missing Sales outcomes are shown as unavailable, not inferred
14. No write/modify Meta or CRM tool exists
15. Rollback is documented and tested
16. Monitoring covers authentication failure, stale sync, DLQ, permission loss and service error rate
17. Production secrets exist only in Secret Manager and are absent from Git history and Terraform state

---

## 23. Open decisions that do not block this document

| Decision | Recommended owner | Needed before |
| --- | --- | --- |
| Repurpose `SPA 49` or create dedicated Portfolio | Pao | Meta App/asset assignment |
| Final MCP auth provider: WorkOS AuthKit or Auth0 | Pao/Engineering | Phase 1 implementation |
| Approved business hours for measurable SLA | Business owner/Sales | SLA alerts and response-time metrics |
| Final privacy and retention values | Business/legal owner | Production storage of user-derived events |
| Enable Messenger metadata in V1 or defer | Pao | Meta permission review |
| Official Ads MCP works reliably with Pro/multi-app prompts | Pao/Engineering | Phase 4 completion |
| Durable Cloud Tasks for Website lead notification | Engineering | Production lead notification readiness |

These items must remain explicit; they must not be silently guessed during implementation.

---

## 24. Decision log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-09-07 | New MCP/Meta services are Production-only | Small project, single developer, lower operational overhead |
| 2026-09-07 | Use guarded releases instead of separate test services | Preserve rollback and test discipline without duplicate runtime stack |
| 2026-09-07 | MCP V1 is read-only | ChatGPT Pro capability and lower operational risk |
| 2026-09-07 | Pao is the only MCP user | Current operating model |
| 2026-09-07 | Google Sign-in plus immutable allowlist | Avoid shared credentials and support revocation/audit |
| 2026-09-07 | Separate `ddbox-meta-prod` database | Isolate Meta-derived data from Website Lead PII |
| 2026-09-07 | Do not store raw Messenger/LINE content | Data minimization and privacy risk reduction |
| 2026-09-07 | Prefer Official Meta Ads MCP before custom Ads ingestion | Avoid duplicating Meta-maintained reporting/tooling |
| 2026-09-07 | Qualified Lead remains unavailable until Sales records it | Marketing proxy must not be presented as verified Sales outcome |

---

## 25. Reference documents

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

Current external implementation references must be rechecked at implementation time:

- OpenAI Developer mode and MCP apps documentation
- Model Context Protocol Authorization specification
- Google Cloud Run service-to-service authentication and rollout documentation
- Firestore named database and conditional IAM documentation
- Official Meta Pages API, Webhooks, Marketing API and Ads MCP documentation
