# PR-D — Excel CRM / import smoke-test evidence

Date: 2026-09-10 (Asia/Bangkok)
Scope: `DD_BOX_Lead_Master.xlsx` v1.1, authenticated Lead export schema v1, manual append-new workflow
Environment: local workbook QA with synthetic records; live export header verified against Web/API Test

## Result

PR-D technical smoke test: **PASS**

- Final workbook: `outputs/analysis-crm-prd/DD_BOX_Lead_Master.xlsx`
- Existing 8 worksheets, names, and order preserved.
- `Import_Staging!A:AT` matches the 46 API export columns exactly and in the same order.
- `Import_Staging!AU:AV` contains formula-only `import_decision` and `conflict_check` fields.
- `Leads!A:AD` remains the sales-owned working area; API/attribution fields are isolated to the right and formula outputs moved to `BQ:BV`.
- Dashboard, Quotation, and PO formulas were migrated to the new Lead column positions.
- Raw GCLID is not present; the workbook receives only `gclid_present`.
- Imported validations were normalized so obsolete validation rules do not overlap the schema-v1 columns.
- Final `.xlsx` passed ZIP integrity, Artifact Tool re-import, exact-header comparison, table-name/range checks, and a formula-error scan with zero matches.

## Synthetic workflow smoke test

The test used one non-customer, production-shaped record only in an in-memory QA workbook. The delivered master remains empty.

| Check | Result |
|---|---|
| First staging import | `NEW` |
| Same row after Lead exists | `EXISTS` |
| Existing system fields match | `ตรงกัน` |
| Current quotation count | `1` |
| Valid PO count | `1` |
| Lead row checks | `ครบ` |
| Report eligible | `1` |
| Dashboard total / quoted / won | `1 / 1 / 1` |

This covers the formula behavior for T15 and the technical portion of T17. It does not replace the required hands-on trial by คุณเปิ้ล.

## Visual QA

Rendered and inspected after the edit:

- `Guide_Lists`
- `Leads`
- `Dashboard`
- `Import_Staging`

The existing navy/yellow/cream/green visual language was retained. The technical columns remain to the right so the primary sales workflow stays in the left section.

## Data handling

- The original user workbook under `docs/Analysis-CRM-plan/` was not overwritten.
- The live Test export was used only to verify its 46-column header and then moved from Downloads to Trash.
- `.gcloudignore` excludes all `.xlsx` files, including the supplied workbook and generated output, from Cloud Run source uploads.
- No Production Google Ads, GA4, GTM, Firestore, Cloud Run, or website setting was changed for PR-D.

## Remaining acceptance work

- คุณเปิ้ล performs a hands-on New → Contacted → Qualified → Quotation Sent → Won trial in a disposable test copy.
- Confirm the controlled master/backup location, access list, retention, and who may export/import customer data.
- Confirm business hours and backup Lead owner.
- Confirm the accounting amount basis used for operational reporting.
