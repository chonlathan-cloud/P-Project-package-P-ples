# DD BOX — Analysis & CRM Implementation Plan

> **ชื่อไฟล์:** `Analysis-CRM-plan.md`  
> **Version:** 1.0 — แผนพัฒนาและคู่มือปฏิบัติงานสำหรับรอบแรก  
> **วันที่จัดทำ/ตรวจแหล่งข้อมูลออนไลน์:** 10 กันยายน 2026 (พ.ศ. 2569)  
> **ขอบเขต:** Website attribution → Excel sales tracking → Google Search Core → readiness ก่อนใช้งบ  
> **สถานะ:** Controlled launch เริ่มแล้วเมื่อ 11 กันยายน 2026; Campaign เปิดใช้งานและอยู่ระหว่าง Google ตรวจโฆษณา/สินทรัพย์
> **ผู้รับผิดชอบการขาย:** คุณเปิ้ล — ผู้ใช้ยืนยัน  
> **ผู้ประสานงานเทคนิค/Marketing ที่เสนอ:** เปา — Owner/ผู้ใช้เป็นผู้อนุมัติ Launch และงบ
> **Repository baseline ที่อ่านได้:** `main` ที่ commit `567b5977bfeb09b5d4bbbcd9b436c21ad84dd0fa`

---

## Execution update — 11 กันยายน 2026

- ส่วน 1–2: PR-A ถึง PR-D พัฒนาและทดสอบแล้ว; Attribution, backend export, Admin export และ Excel master พร้อมหลักฐานทดสอบ แต่ Production deploy และการทดลอง workflow จริงโดยคุณเปิ้ลยังเป็น gate แยก
- ส่วน 3–4: Google Search Core build และ post-Publish inventory เสร็จแล้วประมาณ 98%: Campaign ID `24234245697`, 3 ad groups, 26 Exact/Phrase keywords, 6 RSA, 10 campaign negative phrases, 4 sitelinks, 4 callouts, 1 structured snippet และ 1 call asset
- ส่วน 5: Owner อนุมัติ Launch วันนี้, cost basis เป็น Media only และยืนยันว่าไม่ใช่ EU political ads; Campaign เปิดใช้งานแล้วเมื่อ 2026-09-11 และสถานะล่าสุดเปลี่ยนเป็น `Enabled / Eligible (Learning)` ขณะระบบเรียนรู้ bid strategy
- สถานะตรวจล่าสุด: โฆษณาและ assets ยัง `Pending / Under review`; impressions/clicks/conversions = 0 และ campaign Cost = 0 บาท จึงยังต้องติดตาม policy, delivery, paid-click attribution และ Lead จริงรายแรกต่อใน controlled launch
- ความคืบหน้า minimum launch implementation: **ประมาณ 98%**; งานที่เหลือคือ Google policy completion, real paid-click/Lead validation โดยไม่คลิกโฆษณาตัวเอง, workflow จริงของคุณเปิ้ล และ monitoring Day 1–45

---

## อ่านส่วนไหนก่อน

**เปา:** เริ่มที่ “ข้อตกลงที่ยืนยันแล้ว” และ “แผนงานย่อ” จากนั้นทำส่วน 1 ตาม PR ทีละชุด ไม่ต้องพัฒนาทุกอย่างในครั้งเดียว

**คุณเปิ้ล:** อ่านส่วน 2.1–2.7 โดยเน้นการรับ Lead, อัปเดต Excel, ติดตามใบเสนอราคา และบันทึก PO ไม่จำเป็นต้องเข้าใจโค้ดหรืออ่าน GCLID

**ก่อนเปิดโฆษณา:** ใช้ส่วน 5 เป็น checklist และแนบหลักฐานผลทดสอบจริง ห้ามถือว่า checkbox ในเอกสารนี้เป็นคำอนุมัติเปิดแอด

เอกสารรักษาโครงงาน 5 ส่วนตามที่ตกลงกัน:

1. ทำ Attribution UTM/GCLID → CRM ให้เสร็จ โดย **CRM รอบนี้คือ Excel**
2. QA Lead source + Sales status แบบ end-to-end
3. เตรียม Campaign Build Sheet สำหรับ `DD45_GS_CoreCustom_BKKMetro_Lead_v1`
4. สร้าง Google Search Campaign เป็น Draft
5. ตรวจ readiness รอบสุดท้าย แล้วจึงขออนุมัติเปิดใช้งบ

งานข้อ 3–4 ทำคู่ขนานกับข้อ 1–2 ได้ ไม่จำเป็นต้องรอให้ระบบครบก่อนเริ่มร่างแคมเปญ แต่ต้องผ่านเกณฑ์ก่อนเปิดใช้งบจริง [G7]

---

## ข้อตกลงที่ยืนยันแล้ว

| เรื่อง | ข้อสรุป | ที่มา/สถานะ |
|---|---|---|
| เครื่องมืออัปเดตสถานะการขาย | **Microsoft Excel** | ผู้ใช้ยืนยันล่าสุด [U1] |
| คนอัปเดตสถานะ | **คุณเปิ้ลอัปเดตเอง** | ผู้ใช้ยืนยันล่าสุด [U1] |
| นิยามปิดการขาย | **Won เมื่อได้รับ PO** | ผู้ใช้ยืนยันล่าสุด [U1] |
| Campaign รอบนี้ | `DD45_GS_CoreCustom_BKKMetro_Lead_v1` | ผู้ใช้ยืนยันล่าสุด [U1] |
| ระยะทดลอง | **45 วัน** | ผู้ใช้ยืนยันล่าสุด [U1] |
| Google Core budget | **Average daily budget 250 บาท/วัน** | ผู้ใช้ยืนยันล่าสุด [U1] |
| กรอบคำนวณ Google Core | `250 × 45 = 11,250 บาท` | คำนวณจากกรอบที่ยืนยัน ไม่ใช่ lifetime cap ที่ Google ตั้งให้อัตโนมัติ |
| ผู้ใช้ส่งรูป/ไฟล์เพิ่ม | ผ่าน LINE ให้ Admin จัดการ | ผู้ใช้ยืนยันก่อนหน้า [U2] |
| Public website upload | ยังไม่มี และไม่พัฒนาในรอบนี้ | ผู้ใช้ยืนยันก่อนหน้า [U2] |
| Measurement privacy | คง Strict Basic: ไม่โหลด GTM/GA4 ก่อนยินยอม | แนวทางที่ตกลงและผล QA ที่ผู้ใช้รายงาน [U2] |
| Primary Conversion | GA4 `generate_lead` → Google Ads Primary / Count One | ผู้ใช้รายงานว่าตั้งแล้ว [U2] |
| Business contact | `084-678-9714` / `Nuntha@ddboxprinting.com` | ผู้ใช้ยืนยันให้ใช้ข้อมูลชุดนี้ [U2] |
| Campaign dates / timezone | **2026-09-11 ถึง 2026-10-25 / GMT+07:00** | ผู้ใช้ยืนยันและ Publish แล้ว 2026-09-11 |
| Ad schedule | **Monday–Saturday 08:00–20:00** | ผู้ใช้ยืนยันและตั้งใน Campaign แล้ว 2026-09-11 |
| Lead handling | **Primary คุณเปิ้ล / Backup คุณวิว** | ผู้ใช้ยืนยัน 2026-09-11; ข้อมูลติดต่อสำรองไม่บันทึกซ้ำใน repository |
| Call asset | **อนุมัติสำหรับ Google Ads; Monday–Saturday 07:30–19:30** | สร้างและ associate ระดับ Campaign แล้ว; call reporting ON / recording OFF |
| Creative / assets | **RSA, Sitelink, Callout, Structured snippet approved** | สร้าง RSA 6 ชิ้นและ campaign assets ครบแล้ว; อยู่ระหว่าง Google review |
| Negative keywords | **10 APPLY approved; `template` REVIEW; `แบบกล่อง`/`ฟรี`/`ราคาถูก` HOLD** | ใช้ 10 รายการระดับ Campaign แบบ Phrase Match แล้ว 2026-09-11; รายการ REVIEW/HOLD ไม่ถูกเพิ่ม |
| Budget approver / guard | **Owner/ผู้ใช้; แจ้งเตือน 10,000 บาท, pause 10,750 บาท, เปิดต่อได้เมื่อ Owner อนุมัติ** | ผู้ใช้ยืนยันตนเองเป็นผู้อนุมัติงบ 2026-09-11; guard ใช้ campaign Cost ใน Google Ads และเผื่อ daily-spend exposure 500 บาทก่อนกรอบ 11,250 บาท |
| Cost basis / EU declaration / Launch | **Media only / No / Approved today** | Owner ยืนยันและดำเนินการใน Google Ads แล้ว 2026-09-11 |

**ผลกระทบจากการเลือก Excel:** ไม่สร้างหน้า CRM ที่ให้คุณเปิ้ลต้องอัปเดตสถานะซ้ำในเว็บ และไม่เปลี่ยนไป Google Sheets, HubSpot หรือระบบอื่นโดยอัตโนมัติ ข้อเสนอเดิมเรื่องสร้าง CRM Admin เต็มรูปแบบถูกเปลี่ยนเป็น **การส่งออก Lead อย่างปลอดภัย + Excel master ที่ใช้งานจริง** ตามคำตอบล่าสุด

**สิ่งที่การยืนยันนี้ยังไม่ครอบคลุม:** สิทธิ์เพิ่มงบหรือ re-enable หลัง budget guard ทำงาน, งบสำรอง, งบ Meta/Low MOQ, SLA การตอบ Lead และนโยบายเก็บข้อมูล ไม่มีการอนุมัติเหล่านี้โดยปริยาย

### รายละเอียดที่ยังไม่ทราบ — ไม่ขวางการจัดทำแผน

| รายละเอียด | แนวทางชั่วคราวในเอกสาร | ต้องยืนยันเมื่อใด |
|---|---|---|
| Excel source workbook | ได้รับและตรวจ `DD_BOX_Lead_Master.xlsx` แล้ว; v1 mapping/template พร้อม | resolved สำหรับ implementation; operating location/backup ยังรอ |
| Excel อยู่ในคอม, network drive หรือ OneDrive | ใช้ manual export/import แบบไม่พึ่ง cloud integration | ก่อนแจกไฟล์และกำหนด backup |
| Excel version / Windows / Mac | ไม่บังคับ VBA, Power Query, Microsoft 365 หรือ XLOOKUP | ก่อนใช้ feature เฉพาะ version |
| SLA การตอบ Lead | มี campaign/call schedules และคนสำรองแล้ว แต่ยังไม่กำหนด response-time target | ก่อน Launch |
| เอกสาร PO/ใบเสนอราคาเก็บที่ไหน | บันทึกเลขเอกสารและลิงก์ภายในที่ผู้มีสิทธิ์เปิดได้ | ก่อนคุณเปิ้ลเริ่มใช้งาน |
| มูลค่าใน Excel รวม VAT หรือไม่ | มีช่อง `amount_basis` ให้ระบุ ห้ามรวมยอดต่างฐาน | ก่อนรายงานมูลค่า |
| ระยะเก็บ attribution | เสนอ browser 90 วันต่อ touch; retention ฝั่ง Lead/ไฟล์ส่งออกต้องอนุมัติแยก | ก่อนเปิด capture บน Production |
| ผู้อนุมัติ Launch/เพิ่มงบ | Owner/ผู้ใช้อนุมัติ Launch วันนี้แล้ว; การเพิ่มงบหรือ re-enable หลัง guard ยังต้องอนุมัติใหม่ | ก่อนปรับงบ/เปิดต่อ |

---

## ฐานข้อมูลของแผนและสิ่งที่ตรวจจริง

ใช้ป้ายกำกับ 4 แบบตลอดเอกสาร:

- **[ยืนยันแล้ว]** คำตอบผู้ใช้ล่าสุด เช่น Excel, คุณเปิ้ล, Won = PO, งบ Core
- **[ผู้ใช้รายงาน]** ผล QA/การตั้งค่าบัญชีที่ผู้ใช้ส่งมา ไม่ใช่การเข้าตรวจบัญชีสดซ้ำในงานนี้
- **[ตรวจจาก source]** เนื้อหาไฟล์หรือโค้ดที่เปิดอ่าน พร้อมระบุ revision
- **[ข้อเสนอ]** โครงสร้างใหม่ เกณฑ์การทำงานและค่าเริ่มต้นที่เสนอ ไม่ใช่ข้อเท็จจริงที่บริษัทอนุมัติแล้ว

### สถานะระบบตั้งต้น

| รายการ | สถานะที่ใช้วางแผน |
|---|---|
| Website Production | ผู้ใช้รายงานว่า deploy แล้ว; ไม่ได้ตรวจ Cloud Run revision สด |
| GTM | ผู้ใช้รายงาน Version 3 Live |
| Event mapping | `quote_submit → generate_lead`, `line_click → click_line`, `phone_click → click_call` |
| Consent/Tracking QA | ผู้ใช้รายงาน Accept/Necessary/Persistence/Revoke ผ่าน และ DebugView/Realtime เห็น Events |
| GA4 privacy settings | ผู้ใช้รายงาน redact `reference`, email redaction ON, outbound clicks OFF, form interactions ON |
| GA4 ↔ Google Ads | ผู้ใช้รายงานเชื่อมแล้ว, personalized advertising OFF, auto-tagging ON |
| Google Ads conversion | `generate_lead` Primary/One; `click_line`, `click_call` Secondary/All ตามสรุปล่าสุด |
| Billing | ผู้ใช้รายงานแก้แล้ว ไม่แก้การชำระเงินในงานนี้ |
| Campaign | สร้างและเปิดแล้ว 2026-09-11; ID `24234245697`, `Enabled / Eligible (Learning)`, Cost 0 บาท ณ เวลาตรวจ |
| Attribution เข้า Lead record | ยังไม่พบ structured UTM/GCLID ใน source baseline ที่อ่าน |
| Sales state ใน backend | `StoredLead` มี notification status แต่ยังไม่มี sales lifecycle fields ใน model ที่อ่าน |
| Excel จริง | ได้รับและตรวจ `docs/Analysis-CRM-plan/DD_BOX_Lead_Master.xlsx`; PR-D technical smoke test ผ่านและ 46 export columns ตรง API schema |

Source code ที่ตรวจพบใช้ Next.js/TypeScript ฝั่งเว็บ, FastAPI/Pydantic ฝั่ง API และมี repository สำหรับ Firestore; `toLeadPayload()` ยังส่ง `landing_page` จาก `window.location.href` ส่วน `LeadCreate` มี `campaign_source` แต่ไม่ได้มีโครง attribution แบบ first/last touch [R1–R4]

**ข้อจำกัด:** การอ่าน repo ไม่ยืนยันการตั้งค่าใน Google Ads/GA4, สิทธิ์ใน Excel, revision ที่ deploy, ผล CI หรือผลขายจริง

---

## แผนงานย่อ: ทำเท่าที่จำเป็นก่อน Launch

```text
Google Ads + UTM/Auto-tagging
                 │
                 ▼
Website — อ่าน/เก็บ attribution หลัง consent เท่านั้น
                 │
                 ▼
Lead API → Firestore เก็บ Lead + acquisition snapshot
                 │
         ┌───────┴────────┐
         ▼                ▼
แจ้งคุณเปิ้ลทาง LINE    Export Lead แบบ read-only
         │                │
         └────────┬───────┘
                  ▼
Excel master — คุณเปิ้ลติดตาม Qualified / Quotation / PO
                  │
                  ▼
เปารวมรายงาน Cost → Qualified → Quotation → Won (PO)
```

**ไม่สร้างใน v1:** CRM SaaS ใหม่, bid automation, two-way Excel sync, ระบบบัญชี, public file upload, LINE-message tracking อัตโนมัติ หรือ offline conversion uploader

**ทำก่อน Launch:** capture ที่เคารพ consent, Lead ID ที่ join ได้, export ที่ปลอดภัย, Excel ที่ไม่เขียนทับสถานะเดิม, คุณเปิ้ลทดลองใช้จริง, campaign draft และ readiness

**ทำหลังมีข้อมูล:** ส่งผล Qualified/Won กลับ Google Ads, dashboard automation, Power Query/OneDrive integration, advanced attribution

---

# 1. Attribution UTM/GCLID → Excel CRM

## 1.1 งานนี้ทำเพื่ออะไร

เมื่อระบบรับคำขอ `DD-…` คุณเปิ้ลต้องติดตามได้ว่าเป็นงานอะไร ส่วนเปาต้องต่อได้ว่าคำขอนี้มาจาก Campaign/Keyword ใด แล้วสุดท้ายได้รับ PO หรือไม่

**GA4 ไม่ได้อัปเดต Excel ให้เอง** และการเปิด Auto-tagging ไม่ได้ทำให้ FastAPI/Firestore เก็บ GCLID ให้อัตโนมัติ ต้องเชื่อมข้อมูลเข้า Lead payload และส่งออกให้ Excel อย่างชัดเจน [G1–G2]

| คำสำคัญ | ความหมายในแผนนี้ |
|---|---|
| UTM | ชื่อแหล่ง/สื่อ/Campaign ที่ติดในลิงก์ เช่น `utm_source=google` |
| GCLID | ตัวระบุคลิกของ Google Ads; เก็บเพื่อเชื่อม outcome ในอนาคต ไม่ใช่ Lead ID |
| `utm_term={keyword}` | Keyword ที่ match ในบัญชี Google Ads **ไม่ใช่คำค้นจริงของผู้ใช้เสมอไป** [G3] |
| `utm_content={creative}` | Ad ID ไม่ใช่ข้อความ headline ที่แสดงจริงทุก combination [G3] |
| Lead ID | ID ของ record ที่ backend สร้าง ใช้ join ระบบกับ Excel |
| Lead reference | รหัสอ้างอิงสั้น `DD-…` ที่คนใช้คุยใน LINE |
| Attribution snapshot | สำเนาที่มาของคำขอ ณ ตอนรับ Lead ไม่ใช่ข้อมูลที่เปลี่ยนตาม browser ภายหลัง |
| Missing attribution | ไม่ทราบที่มา/ไม่เก็บเพราะ consent/ข้อมูลหาย ไม่ใช่ยอดศูนย์หรือ Direct โดยอัตโนมัติ |

การเห็น `gclid` ใน URL เป็นข้อมูลจาก client ที่ต้อง validate ไม่ใช่หลักฐานว่า Google ยืนยันคลิกนั้นแล้ว ระบบเราไม่สามารถถอดรหัส GCLID เพื่อรู้ Keyword ได้เอง

## 1.2 เลือก source of truth ให้แต่ละข้อมูล

| ข้อมูล | แหล่งอ้างอิงหลัก | ใครแก้ |
|---|---|---|
| การรับ Lead, เวลา server, ID, acquisition snapshot | Backend/Firestore | ระบบ |
| เจ้าของ Lead, ผลการคุย, qualification, นัดติดตาม | Excel master | คุณเปิ้ล |
| ใบเสนอราคา/PO | เอกสารจริง + รายการใน Excel | คุณเปิ้ลตามหลักฐาน |
| Spend/Impressions/Clicks | รายงาน Google Ads | เปานำเข้ารายงาน ไม่กรอกตัวเลขสมมติ |
| พฤติกรรมเว็บและ Events | GA4 | ระบบ |
| รายรับเงินจริง/รายได้ทางบัญชี | เอกสารจากฝ่ายบัญชีที่ตรวจสอบแล้ว | ไม่อนุมานจาก PO |

**ผลสำคัญ:** Excel เป็น CRM ที่ทีมใช้ แต่ raw click ID ไม่จำเป็นต้องอยู่ในไฟล์ขายที่ทุกคนเปิดได้ ให้เก็บใน backend ที่จำกัดสิทธิ์ แล้ว join ด้วย Lead ID เมื่อจำเป็น

## 1.3 กฎการเก็บข้อมูล v1

ข้อกำหนดต่อไปนี้เป็น **ข้อเสนอทางเทคนิคที่สอดคล้องกับ Strict Basic ของ DD BOX** ไม่ใช่ข้อสรุปว่า Google Consent Mode บังคับระบบ CRM ทุกบริษัทให้เก็บข้อมูลแบบนี้ [G4]

| เหตุการณ์ | สิ่งที่ทำ |
|---|---|
| เข้าเว็บ ยังไม่เลือก consent | ไม่ persist UTM/GCLID และไม่ queue acquisition event ไว้ส่งย้อนหลัง |
| เลือก Necessary | ไม่เก็บ marketing attribution; ยังส่งฟอร์ม/เปิด LINE ได้ |
| Accept ขณะ URL ยังมี UTM/GCLID | อ่าน current URL หลัง consent แล้วบันทึกข้อมูลที่ผ่าน validation |
| เคย Accept และ consent ยัง valid | อ่าน entry URL เมื่อ page load/route เปลี่ยน ตามกฎ eligible touch |
| ไป Product → Quote ภายในเว็บ | รักษา touch เดิม ไม่เขียนทับด้วย URL ที่ไม่มี Campaign |
| มี Campaign ใหม่ที่ valid | สร้าง touch ใหม่ทั้งก้อน ไม่ปะ GCLID เก่ากับ UTM ใหม่ |
| กลับมา Direct โดยไม่มี tag | ไม่ล้าง tagged touch ที่ยังไม่หมดอายุ; ไม่อ้างว่า record นี้คือ last click จริงทุกช่องทาง |
| Revoke | ล้าง attribution storage และ in-memory cache ก่อน reload; ไม่แนบกับคำขอถัดไป |
| consent/storage เสียหรือหมดอายุ | fail closed: ไม่ใช้ข้อมูลเก่า; Lead capture ยังทำงาน |

**ข้อแลกเปลี่ยน:** ผู้ใช้ที่เดินออกจาก landing page ก่อน Accept อาจทำให้ UTM/GCLID จากหน้าแรกหาย เราจะไม่แอบเก็บ entry URL ก่อน consent เพื่ออุดช่องว่าง และจะไม่บังคับให้ยอมรับเพื่อส่งคำขอ

**ขอบเขตของ first/last ใน v1:** หมายถึง first และ last **eligible tagged touch ที่ระบบสังเกตได้ภายในอายุข้อมูล** ไม่ใช่ first touch ตลอดชีวิตลูกค้า หรือ GA4 data-driven attribution รอบนี้ยังไม่ทำ organic/referrer attribution engine

## 1.4 Schema ที่เสนอ

เป็น contract สำหรับพัฒนา ไม่ใช่โค้ดที่พร้อม copy โดยไม่ปรับเข้ากับ project types

```ts
// src/features/analytics/attribution.ts — ไฟล์ใหม่ที่เสนอ
export type AttributionTouch = Readonly<{
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_id: string | null;          // Google Ads campaign ID
  utm_content: string | null;     // Google Ads ad ID ใน suffix รอบนี้
  utm_term: string | null;        // matched keyword, ไม่ใช่ search query
  adgroup_id: string | null;
  gclid: string | null;
  landing_path: string;          // pathname ที่ sanitize แล้ว ไม่มี query/hash
  captured_at: string;           // ISO 8601 จาก client; ไม่ใช่ server timestamp
  expires_at: string;
}>;

export type LeadAttribution = Readonly<{
  schema_version: 1;
  model: "first_last_tagged";
  first_touch: AttributionTouch | null;
  last_touch: AttributionTouch | null;
}>;

export type MeasurementConsentSnapshot = Readonly<{
  mode: "unset" | "necessary" | "all";
  version: number | null;
  updated_at: string | null;
}>;
```

**Storage key ที่เสนอ:** `ddbox_attribution_v1` แยกจาก `ddbox_privacy_consent` ไม่เปลี่ยน consent key/version ที่ใช้งานแล้วโดยไม่จำเป็น

**TTL ที่เสนอ:** 90 วันต่อ touch โดยนับจาก `captured_at`; นี่เป็นข้อเสนอของโครงการที่ต้องอนุมัติ ไม่ใช่ระยะที่กฎหมายหรือ Google กำหนดสำหรับ CRM ทุกกรณี การกลับมาหน้าเดิมไม่ควรเลื่อน expiry ไปเรื่อย ๆ

พิจารณาเพิ่ม click identifiers แบบอื่นใน phase ถัดไปเมื่อเจอ use case จริง ไม่ปลอมค่า `gclid` ขึ้นเมื่อไม่มี และไม่รับประกันว่าทุก Google Ads visit จะมี GCLID

### Data validation ที่ต้องทำทั้ง browser และ server

| Field | กฎที่เสนอ |
|---|---|
| `utm_source`, `utm_medium` | controlled tokens; max 100 ตัวอักษร ไม่รับ control characters |
| `utm_campaign`, `utm_content` | max 200; ใช้ชื่อ/ID ที่ทีมกำหนด ไม่ใส่ข้อมูลลูกค้า |
| `utm_id`, `adgroup_id` | เก็บเป็น **string**; สำหรับ Google campaign นี้รับ numeric ID ตาม contract |
| `utm_term` | รองรับภาษาไทย; max 300; ไม่ใช้ regex เฉพาะ ASCII |
| `gclid` | opaque string ที่รักษาตัวพิมพ์; เสนอ cap 512 bytes, ปฏิเสธ whitespace/control characters ไม่ truncate หรือ lowercase [G2] |
| `landing_path` | path ภายในเว็บที่ validate แล้ว; ไม่รับ URL ภายนอกหรือ query/hash |
| เวลา | parse ได้, timezone ชัด, `expires_at > captured_at`; server แยก `received_at` ของตนเอง |
| Unknown query keys | ไม่เก็บ ไม่ส่ง ไม่ log payload ดิบ |
| repeated/conflicting query values | ตัด field ที่กำกวมหรือทั้ง touch ตาม validator พร้อม reason code ไม่เดาค่า |
| unresolved placeholders เช่น `{campaignid}` | ถือเป็นค่าที่ยังไม่ resolve; ไม่บันทึกเป็น Campaign ID จริง |

เพียง allowlist ชื่อ field **ยังไม่ทำให้ปลอด PII 100%** เพราะคนอาจใส่อีเมลลง `utm_campaign` ได้ ต้องควบคุมลิงก์ที่ทีมสร้าง, ตรวจ pattern ที่ชัดเจน, จำกัดค่าตาม contract และทดสอบ payload จริง ข้อมูล attribution ที่ join กับบุคคลควรจำกัดสิทธิ์เหมือนข้อมูล Lead

## 1.5 Functions ที่ต้องมี

| Function ที่เสนอ | ความรับผิดชอบ |
|---|---|
| `parseAttributionTouch(url, now)` | parse เฉพาะ fields ที่อนุญาตและ validate โดยไม่ทำ network request |
| `readAttribution(now)` | อ่าน storage, ตรวจ version/expiry, คืน null เมื่อใช้ไม่ได้ |
| `captureAttributionIfAllowed()` | ตรวจ consent ปัจจุบันก่อน capture; update first/last แบบ deterministic |
| `getAttributionForLead()` | คืน snapshot ที่ใช้ได้ ณ ตอนส่งคำขอ; Necessary/unset → null |
| `clearAttribution()` | ล้าง storage และ in-memory cache เมื่อ revoke/version ไม่ใช้แล้ว |

### กฎ first/last แบบชัดเจน

1. Eligible touch คือมี `utm_source` + `utm_medium` ที่ valid หรือมี GCLID ที่ valid ทางโครงสร้าง
2. ถ้าไม่มี touch ที่ยัง valid ให้ตั้ง first และ last เป็น touch ใหม่เดียวกัน
3. ถ้ามี first ที่ยังไม่หมดอายุ ให้เก็บไว้ แล้วแทน last ด้วย touch ใหม่
4. ถ้า touch เดิมจาก URL เดิมถูกอ่านซ้ำเพราะ hydration/refresh ไม่สร้าง touch ใหม่และไม่ยืด TTL โดยไม่จำเป็น
5. GCLID ต่างกันถือเป็นคนละ click candidate แม้ UTM เหมือนกัน; UTM อย่างเดียวไม่ได้แยกทุกคลิกได้สมบูรณ์
6. ถ้า entry ใหม่ไม่มี GCLID ให้ `last_touch.gclid = null` ไม่ดึงของ first มาเติม
7. ถ้ามีเฉพาะ GCLID ให้เก็บ UTMs เป็น null; อาจแสดง “Google Ads click ID detected” แบบ inferred แยกจากค่า source ที่รับมา ห้ามเติม Campaign/Keyword จากการเดา
8. ถ้า first หมดอายุให้ตัดทิ้ง; first ที่รายงานคือ touch เก่าสุดที่ยังเหลืออยู่ ไม่ใช่ประวัติทั้งหมด
9. การคง tagged touch หลัง direct revisit เป็น attribution rule ของเรา ต้องระบุในรายงาน ไม่เรียกว่า GA4 last-click

## 1.6 เชื่อมกับ ConsentManager เดิม

ใช้ `readPrivacyConsent()` และ consent-change event ที่มีอยู่ ไม่สร้างตัวอ่าน consent คนละชุด [R2]

```text
เปิดหน้า/route เปลี่ยน
  → อ่าน consent ล่าสุด
  → all? capture จาก URL ปัจจุบัน
  → necessary/unset? ไม่ capture

ผู้ใช้ Accept
  → ทำ consent update ตามระบบเดิม
  → capture URL ปัจจุบันหลังได้รับสิทธิ์
  → GTM loader เดิมทำงานตามปกติ

ผู้ใช้ Revoke
  → บันทึก necessary
  → ล้าง attribution ทั้ง storage และ memory
  → consent update ตามระบบเดิม
  → reload
```

ติด listener เพียงครั้งเดียวและ cleanup เมื่อ unmount; ทดสอบ Next.js navigation และ React development re-mount ไม่ให้จับซ้ำ รวมถึง consent change จากอีกแท็บ

**ไม่ใช้ GTM เป็นคนอ่าน/เก็บ CRM attribution:** ให้ code ฝั่ง application ทำ เพื่อให้ consent, payload และ API contract ทดสอบอัตโนมัติได้ GTM v3 ที่ผ่าน QA ไม่ต้องถูกสร้างใหม่เพราะงานนี้

## 1.7 เปลี่ยน Lead payload อย่างปลอดภัย

ใน `src/features/leads/schema.ts` และ `quote-form.tsx`:

- คง business validation/receipt schema และ `quote_submit` หลัง API success
- เพิ่ม `attribution`, `measurement_consent` โดยทำ optional เพื่อรองรับ client เก่า
- เปลี่ยน `landing_page` เดิมจาก raw `window.location.href` เป็น canonical URL/path ที่ไม่มี query/hash; เพิ่ม `submission_path` หากต้องแยกความหมายชัดเจน
- อย่าเรียกหน้า `/quote` ตอน submit ว่า landing page จากโฆษณา; landing จริงใช้จาก attribution touch
- consent ที่ใช้ให้ฝ่ายขายติดต่อกลับในฟอร์ม **คนละตัวกับ** measurement consent ห้ามแปลง checkbox ฟอร์มเป็น `all`
- ไม่เพิ่ม GCLID, PO, contact fields หรือ Lead reference ลง `dataLayer`/GA4 custom events

ตัวอย่างส่วน metadata ของคำขอหลัง consent:

```json
{
  "landing_page": "https://www.ddboxprinting.com/quote",
  "submission_path": "/quote",
  "measurement_consent": {
    "mode": "all",
    "version": 1,
    "updated_at": "2026-09-10T07:00:00.000Z"
  },
  "attribution": {
    "schema_version": 1,
    "model": "first_last_tagged",
    "first_touch": {
      "utm_source": "google",
      "utm_medium": "cpc",
      "utm_campaign": "dd45_core_custom_box",
      "utm_id": "1111111111",
      "utm_content": "3333333333",
      "utm_term": "รับทำกล่องออฟเซ็ท",
      "adgroup_id": "2222222222",
      "gclid": "TEST-GCLID-DO-NOT-IMPORT",
      "landing_path": "/products/folding-carton",
      "captured_at": "2026-09-10T07:00:00.000Z",
      "expires_at": "2026-12-09T07:00:00.000Z"
    },
    "last_touch": {
      "utm_source": "google",
      "utm_medium": "cpc",
      "utm_campaign": "dd45_core_custom_box",
      "utm_id": "1111111111",
      "utm_content": "3333333333",
      "utm_term": "รับทำกล่องออฟเซ็ท",
      "adgroup_id": "2222222222",
      "gclid": "TEST-GCLID-DO-NOT-IMPORT",
      "landing_path": "/products/folding-carton",
      "captured_at": "2026-09-10T07:00:00.000Z",
      "expires_at": "2026-12-09T07:00:00.000Z"
    }
  }
}
```

ตัวอย่างนี้ใช้ IDs/เวลา/GCLID สมมติเพื่อแสดง schema; เมื่อเพิ่งจับ touch แรก first และ last จึงมีค่าเดียวกัน ห้ามนำ test GCLID ไป upload เข้า Google Ads

กรณี Necessary/unset ให้ `attribution: null` และ snapshot ตาม consent จริง ไม่ส่ง UTM/GCLID ผ่านช่อง `landing_page` เป็นทางอ้อม

## 1.8 Backend / Firestore

แก้ `LeadCreate` ให้มี schema metadata ที่กำหนดไว้ พร้อมรองรับ record เก่าโดย default เป็น null; เพิ่ม `lead_origin = website_form` จาก endpoint ฝั่ง server ไม่รับค่าจาก client ที่อ้างว่าเป็นแหล่งอื่น [R3]

แนวทาง validation:

1. Business fields ผิด → แจ้ง validation error ตามเดิม
2. Optional attribution ผิด แต่ business fields valid → **ข้อเสนอ:** รับ Lead ต่อ, drop attribution ที่ผิดและเก็บ reason code แบบไม่ใส่ค่า URL ดิบ
3. `measurement_consent.mode != all` หรือ snapshot ไม่ valid → ไม่เก็บ acquisition snapshot ที่แนบมา
4. สถานะจาก client เป็น evidence of reported consent ไม่ใช่หลักฐานยืนยันตัวตนหรือ consent ที่ server พิสูจน์ได้ทั้งหมด
5. Timestamp หลักของ Lead ใช้ server UTC; เวลา client ใช้แค่ประกอบ attribution
6. เก็บ snapshot ของ Lead เดิมไม่ให้เปลี่ยนตาม campaign visit ใน browser ภายหลัง

### ห้ามทำให้ idempotency พัง

Service เดิมสร้าง fingerprint จาก payload ที่ serialize แล้ว [R4] ถ้าเติม `captured_at`/consent ลง payload โดยไม่คิดเรื่อง retry คำขอเดิมอาจเกิด fingerprint mismatch

**ข้อเสนอ implementation:**

- ทำ business fingerprint จาก field ธุรกิจที่ canonicalize ชัดเจน แยก acquisition/consent metadata ออก
- retain Idempotency-Key สำหรับ retry ของ submission เดิม; freeze business snapshot
- ถ้า field ธุรกิจเปลี่ยนจริง ต้องจัดการเป็นคำขอใหม่หรือแจ้งให้ผู้ใช้ยืนยัน ไม่ยอมเปลี่ยนข้อมูลภายใต้ key เดิมเงียบ ๆ
- retry ที่มี consent เปลี่ยนต้องไม่สร้าง Lead เพิ่ม และไม่กลับมาแนบ attribution หลังผู้ใช้ถอน
- record เก่าต้องตรวจด้วย fingerprint strategy รุ่นเดิมหรือ compatibility path; ห้ามเปลี่ยน hash algorithm แล้วทำให้ keys เดิมใช้ไม่ได้
- การล้าง browser storage ไม่ลบข้อมูล server ที่เคยรับไปแล้ว ต้องมีขั้นตอนจัดการคำขอลบ/ถอนการใช้ข้อมูลของบริษัทแยกต่างหาก ไม่อ้างว่า reload ลบประวัติได้

### Privacy/Logging

ตรวจ access logs, API error logs และการบันทึก raw URL ด้วย; Strict Basic ควบคุม Google measurement tags ไม่ได้รับประกันว่า URL จะไม่ปรากฏใน infrastructure logs เลย จึงไม่ควรนำ raw log ของผู้ปฏิเสธมาเติม marketing attribution ย้อนหลัง

ก่อน Production ให้ข้อความ Privacy ครอบคลุมการเชื่อมข้อมูลที่มากับคำขอ, การใช้ Excel ภายใน, ผู้เข้าถึง, retention และการจัดการสิทธิ์ โดยผู้รับผิดชอบบริษัทตรวจข้อความ ไม่ถือว่าแผนเทคนิคนี้เป็นการรับรองความถูกต้องทางกฎหมาย

## 1.9 ส่งออกเข้า Excel — ไม่บังคับใช้ระบบใหม่

**แนวทาง v1 ที่เสนอ:** ปุ่มดาวน์โหลด Lead export แบบมี authentication ใน Admin เดิม หรือ utility ที่ผู้ดูแลรันโดยมีสิทธิ์ ให้ส่งออก `.xlsx` แบบ read-only snapshot ไม่ใช่ให้เว็บเขียนทับ Excel ของคุณเปิ้ลโดยตรง

เส้นทาง API ที่เสนอ เช่น `GET /v1/admin/leads/export` เป็น endpoint ใหม่ที่ยังต้องพัฒนา ไม่ใช่ URL ที่ใช้งานได้แล้ว

ข้อกำหนด:

- ตรวจ Firebase/role ฝั่ง server ตามขอบเขตสิทธิ์ที่ใช้อยู่ จำกัดเฉพาะผู้มีหน้าที่รับ Lead/export; ไม่ใช่ secret URL ที่เปิดสาธารณะ
- ใช้ backend repository ไม่ให้ browser อ่าน Firestore โดยตรง
- กำหนดช่วงเวลาและ cutoff ของ snapshot; รองรับ pagination/large export และไม่ตกหล่นที่รอยต่อเวลา
- ให้ export ทุก record ในช่วงที่กำหนดพร้อม immutable `lead_id`; การ export ไม่เปลี่ยน sales status และไม่ส่ง notification ซ้ำ
- บันทึก metadata ของ export: เวลาสร้าง, environment, ช่วงเวลา, schema version, จำนวน record และ export ID
- ไม่เก็บไฟล์ export ไว้ใน public bucket/repo; response มี `Cache-Control: no-store`
- ไม่ export raw GCLID ลงไฟล์ขายโดย default; ให้ `gclid_present` และ Campaign/Keyword ที่คนอ่านได้ ส่วน raw อยู่ backend
- ID, โทรศัพท์, PO number และเลขเอกสารเป็นข้อความ เพื่อรักษาเลขศูนย์นำหน้าและเลขยาว
- เขียนค่าที่มาจากผู้ใช้เป็น literal text ไม่ใช่ formula; ตรวจ formula injection, control characters และ automatic hyperlinks
- ส่งออกข้อมูลติดต่อที่จำเป็นให้คุณเปิ้ลได้ แต่ไม่ปะปนในไฟล์รายงาน Marketing ที่แชร์วงกว้าง

**อย่าส่งลิงก์ไฟล์ที่มีข้อมูลลูกค้าแบบ public ไปในกลุ่ม LINE** ใช้ช่องทางภายในที่บริษัทอนุมัติ

## 1.10 ตารางงานสำหรับ Developer

| ID | ไฟล์/ส่วน | สิ่งที่ต้องทำ | ผลสำเร็จที่ตรวจได้ |
|---|---|---|---|
| A01 | `src/features/analytics/attribution.ts` ใหม่ | parser, schema, first/last, TTL, clear/read | unit tests ผ่านทุก state |
| A02 | `src/features/analytics/consent-manager.tsx` | hook หลัง grant, revoke cleanup, route listener | ไม่เพิ่ม GTM script ซ้ำ, Necessary ไม่ capture |
| A03 | `src/features/leads/schema.ts` | optional metadata, clean landing/submission path | raw query ไม่เข้า Lead ผ่านช่องเก่า |
| A04 | `src/features/leads/quote-form.tsx` | snapshot ตอน submit, retry consent handling | Lead success/dup guards ยังผ่าน |
| A05 | `src/app/api/leads/route.ts` | ทวน pass-through, error handling, ไม่ log PII | request contract end-to-end |
| A06 | `services/content-api/src/ddbox_api/domain/models.py` | typed metadata, backward compatibility | old clients/old records ยังอ่านได้ |
| A07 | `services/content-api/src/ddbox_api/services/leads.py` | versioned business fingerprint, metadata snapshot | timeout/retry ไม่สร้าง duplicate |
| A08 | repositories `base.py`, `firestore.py`, `memory.py` | save/read metadata + export query ตามจำเป็น | tests ทั้ง memory/Firestore integration |
| A09 | admin API + export service ใหม่ | authenticated `.xlsx` export | unauthorized ถูกปฏิเสธ, safe cells, record ครบ |
| A10 | Admin UI ปุ่ม export | เพิ่มเฉพาะ export/status of export | ไม่สร้าง CRM status editor ซ้ำกับ Excel |
| A11 | Tests/docs | regression, API contract, runbook, privacy approval record | มีหลักฐานก่อน deploy |

รายการไฟล์ที่มีอยู่มาจาก repo baseline; ชื่อไฟล์/endpoint ใหม่เป็นข้อเสนอให้ Developer ปรับเข้ากับ conventions ของ repo ไม่ใช่การยืนยันว่าทำแล้ว

### แบ่ง PR เพื่อตรวจง่าย

- **PR-A:** Attribution module และ tests โดย feature ยังไม่เปิด Production
- **PR-B:** Backend schema/fingerprint/export และ compatibility tests
- **PR-C:** เชื่อม Frontend, sanitized metadata, UI export และ end-to-end QA
- **PR-D:** Excel template/import instructions และ final smoke test

ลำดับ deploy ที่เสนอ: **Backend ที่รองรับ metadata ใหม่ก่อน → Web Test → QA → Frontend Production** เพราะ backend เดิมใช้ `extra=forbid`; frontend ส่ง field ใหม่ก่อน API พร้อมอาจทำให้รับ Lead ไม่ได้ [R3]

Rollback: ปิด attribution capture/attachment แต่คงฟอร์มและ Tracking ที่ผ่าน QA เดิม; อย่า rollback backend schema จนอ่าน records ที่มี optional metadata ใหม่ไม่ได้

---

# 2. Excel CRM และ QA Lead source + Sales status end-to-end

## 2.1 รูปแบบ Excel ที่เสนอ

**ชื่อไฟล์ทำงาน:** `DD_BOX_Lead_Master.xlsx` — ได้รับไฟล์และปรับเป็น master template แล้ว; รายละเอียด QA อยู่ใน `docs/analysis-crm-prd-test-evidence.md`

ใช้ workbook master เพียงชุดเดียวที่มีผู้รับผิดชอบชัดเจน ไม่ส่งสำเนาหลายชื่อให้หลายคนแก้พร้อมกัน

| Sheet ที่เสนอ | หน้าที่ | คนใช้งานหลัก |
|---|---|---|
| `Leads` | หนึ่งแถวต่อ inquiry/Lead; ที่มาและการติดตาม | คุณเปิ้ล |
| `Import_Staging` | วาง export ชุดล่าสุดและตรวจ Lead ใหม่/ซ้ำ | เปาหรือผู้ช่วยที่ได้รับมอบหมาย |
| `Quotations` | เลขใบเสนอราคา/รุ่นเอกสาร/มูลค่า/วันที่ส่ง | คุณเปิ้ล |
| `Orders_PO` | PO ที่ได้รับจริง, status, มูลค่า, วันรับ | คุณเปิ้ล |
| `Media_Daily` | รายงาน Spend/Clicks ตามวันและ campaign ID | เปา |
| `Guide_Lists` | คำอธิบาย dropdown, วันที่รายงาน, นิยาม/งบ | ทั้งคู่ |

นี่คือ logical structure สำหรับทำ template หลังเห็น Excel จริง ไม่บังคับรื้อ workbook เดิม ถ้ามีตาราง Quotation/PO อยู่แล้วให้ reuse และเพิ่ม Lead ID เพื่อ join แทนคัดลอกมูลค่าซ้ำหลายแห่ง

**ไม่ต้องกรอกทุก Sheet ทุกวัน:** คุณเปิ้ลทำงานที่ `Leads` เป็นหลัก และเติม Quotation/PO เมื่อมีเอกสารจริง เปาจัดการนำเข้าและรายงาน

## 2.2 Data dictionary ของ Leads

### A. System/imported fields — ไม่ให้ Sales แก้ที่มาเอง

| Field | รายละเอียด |
|---|---|
| `lead_id` | canonical backend ID; key หลัก ห้ามแก้/เปลี่ยนตามเลขแถว |
| `lead_reference` | `DD-…` สำหรับคุยกับลูกค้า/LINE ไม่ใช่รหัสยืนยันสิทธิ์เข้าข้อมูล |
| `created_at_utc` / `received_at_th` | เวลา backend และเวลาแสดง Asia/Bangkok |
| `lead_origin` | เช่น `website_form`; แยกจาก acquisition source |
| `contact_name`, `company`, `preferred_contact`, contact fields ที่จำเป็น | ใช้ติดตามงานในไฟล์สิทธิ์จำกัด |
| `customer_path`, `product_type`, `quantity` | ข้อมูลงานที่ได้รับ; ไม่ตีความเป็นข้อมูลที่ Sales ยืนยันแล้วทั้งหมด |
| `submission_path` | หน้าที่ส่งฟอร์ม; ไม่มี query |
| `attribution_status` | `captured`, `consent_denied`, `no_valid_touch`, `expired`, `invalid`, `unavailable`, `legacy_unknown` ตาม evidence ที่มี |
| `first_*` | source, medium, campaign, campaign ID, adgroup ID, ad ID, matched keyword, landing path, captured time |
| `last_*` | fields ชุดเดียวกับ first สำหรับ last tagged touch |
| `gclid_present` | yes/no; raw value ไม่ต้องแสดง Sales |
| `exported_at`, `source_environment` | รอบส่งออกและ Test/Production |

หากระบบแยกเหตุผล missing ไม่ได้จริงให้ใช้ `unavailable` ห้ามแต่ง reason; records เก่าที่ไม่เก็บข้อมูลให้เป็น `legacy_unknown`

### B. Sales-owned fields — คุณเปิ้ลอัปเดต

| Field | เมื่อไรต้องกรอก |
|---|---|
| `owner` | เมื่อรับงาน; ค่าเริ่มต้นคุณเปิ้ล |
| `record_class` | `Real`, `Test`, `Spam`, `Duplicate`; ใช้กรองรายงาน |
| `duplicate_of` | เมื่อยืนยันว่าซ้ำจริง อ้าง lead_id เดิม |
| `sales_status` | สถานะงานล่าสุดจากรายการในส่วน 2.3 |
| `contactability` | `Unknown`, `Contactable`, `Unreachable`; ห้ามถือว่าโทรไม่รับครั้งเดียวเป็น Lost |
| `qualification_result` | `Pending`, `Qualified`, `Unqualified`; แยกจาก sales_status |
| `qualification_reason` | เหตุผลที่ทีมตรวจจริง ไม่อนุมานจาก click |
| `priority` / `repeat_potential` | การจัดลำดับและโอกาสสั่งซ้ำตามการคุย |
| `first_contact_attempt_at` | ครั้งแรกที่ทีมพยายามติดต่อ |
| `contacted_at` | ครั้งแรกที่ติดต่อสำเร็จ |
| `qualified_at` | วันที่/เวลาที่คัดกรองผ่าน; ไม่ลบเมื่อย้ายเป็น Won/Lost |
| `last_contact_at`, `next_follow_up_at`, `next_action` | ทุกครั้งที่คุยหรือกำหนดงานถัดไป |
| `quotation_first_sent_at` | เมื่อส่งใบเสนอราคาจริงครั้งแรก |
| `won_at` | เวลารับ PO แรกที่อ้างถึง Lead นี้ ตามนิยามที่ยืนยัน |
| `lost_at`, `lost_reason` | เมื่อมีเหตุผลให้ปิด Lost |
| `updated_at`, `updated_by`, `notes` | เมื่ออัปเดต ไม่ใส่บันทึกส่วนตัวที่ไม่เกี่ยวกับงาน |

เริ่มใช้งานโดยแสดงคอลัมน์จำเป็นด้านซ้าย: Reference, ผู้ติดต่อ, งาน/จำนวน, Owner, Status, Qualification, นัดติดตาม, Next action แล้วจัด technical columns ไว้ด้านขวา ไม่บังคับคุณเปิ้ลอ่าน UTM/GCLID

## 2.3 สถานะ Lead และสิ่งที่ถือว่าเกิดแล้ว

Journey เดิมเสนอ 17 สถานะ ตั้งแต่ New Lead ถึง Reordered [S2] ตารางต่อไปนี้เป็น **ข้อเสนอการใช้ใน Excel รอบนี้** โดยคงชื่อเดิมในช่วงขาย และแยกสถานะหลังการขายออกเพื่อไม่ทำให้ประวัติ Won หาย

| Status | ใช้เมื่อ | หลักฐาน/ข้อมูลที่ต้องมี |
|---|---|---|
| New Lead | ระบบรับแล้ว ยังไม่มีการติดตาม | Lead ID/เวลารับ |
| Contacting | กำลังพยายามติดต่อ | เวลา attempt + next action |
| Contacted | คุยกับลูกค้าได้แล้ว | เวลา/ช่องทาง |
| Awaiting Information | รอจำนวน สเปก หรือข้อมูลอื่น | รายการข้อมูลที่รอ + นัดติดตาม |
| Qualified | คุณเปิ้ลตรวจว่ามีโอกาสงานที่ตรงบริการ | qualification reason + qualified_at |
| Unqualified | ตรวจแล้วไม่ตรงบริการ/ไม่ใช่โอกาสที่เหมาะ | เหตุผล ไม่เหมารวมงานต่ำกว่า 500 ใบทั้งหมด |
| Quotation Preparing | กำลังประเมินราคา | ผู้รับผิดชอบ/สิ่งที่รอ |
| Quotation Sent | ส่งใบเสนอราคาจริง | quotation ID/version/date |
| Sample / Mockup | อยู่ขั้นตัวอย่างที่ตกลง | บันทึกขอบเขตจริง ไม่แปลว่าทำฟรี |
| Negotiation | คุยปรับเงื่อนไขหรือราคา | next action/date |
| **Won** | **ได้รับ PO** | PO number/issuer/date/evidence และ `won_at` |
| Lost | ลูกค้าไม่เลือก/ยกเลิก/ยืนยันไม่เดินต่อ | lost_reason/date |

สถานะ Production, Delivered, Claim, Reorder Opportunity, Reordered ใน Journey เดิมยังมีประโยชน์ แต่เก็บเป็น fulfillment/reorder fields หรือ phase ถัดไป ไม่ใช้แทนการลบ milestone Won ของงานเดิม

**กรณีลูกค้าสั่งด้วย LINE แต่ไม่มี PO:** ยังไม่ mark Won ตามกฎล่าสุด ให้บันทึก Pending PO/Negotiation จนมีหลักฐานที่บริษัทรับรองว่าเป็น PO หรือมีการอนุมัติเปลี่ยนนิยามแยกต่างหาก

**กรณี PO ยกเลิกภายหลัง:** เก็บประวัติรับ PO เดิมและ cancellation ของ Order ไม่ลบแถวเพื่อทำให้ตัวเลขสวย รายงานแยก gross won, cancelled และ net active order value

## 2.4 เกณฑ์ Qualified ที่เสนอให้คุณเปิ้ลยืนยัน

Journey เดิมให้ความสำคัญ Owner Brand/B2B, งาน Custom, จำนวน 500–3,000 ใบขึ้นไปและโอกาสสั่งซ้ำ [S2] แต่การคัดกรองควรพิจารณาหลายปัจจัย ไม่ใช่ if quantity >= 500 แล้วเป็น Qualified อัตโนมัติ

ข้อเสนอ checklist:

- ติดต่อได้และเป็นคำขอจริง ไม่ใช่ spam/test/duplicate
- ประเภทงานอยู่ในบริการที่บริษัทรับทำ
- เข้าใจโจทย์/จำนวนหรือมีข้อมูลพอที่จะช่วยจัด brief ต่อ
- มีความต้องการและช่วงเวลาใช้งานที่พอประเมินได้
- พื้นที่/เงื่อนไขส่งมอบทำได้ หรือทีมเห็นช่องทางดำเนินการต่อ

Priority A/B/C และ repeat potential เป็นการจัดลำดับเพิ่มเติม ไม่ใช่ตัวเดียวกับ Qualified; งานน้อยอาจมีศักยภาพ ส่วนงานจำนวนมากแต่ติดต่อไม่ได้ก็ยังไม่ควรอ้างว่า Qualified แล้ว

## 2.5 Quotation / PO / เงิน: ห้ามนับเป็นอย่างเดียวกัน

| สิ่งที่วัด | นิยามในแผน |
|---|---|
| Quotation value | มูลค่าที่เสนอ ยังไม่ใช่ออเดอร์ |
| Won orders | จำนวน PO/Order ที่ได้รับตามกฎบริษัท |
| Won PO value | มูลค่าออเดอร์จาก PO; เป็น booked order value ไม่ใช่รายได้ที่รับรู้หรือเงินสดรับ |
| Cash received | เงินที่รับจริงตามข้อมูลฝ่ายบัญชี |
| Recognized revenue | ใช้เมื่อฝ่ายบัญชียืนยันข้อมูลและนิยามเท่านั้น |

`Quotations` ควรมี: `quotation_record_id`, `lead_id`, `quotation_no`, `revision`, `sent_at`, `amount`, `currency`, `amount_basis`, `is_current`, `document_link`

`Orders_PO` ควรมี: `order_id`, `lead_id`, `customer_or_issuer`, `po_number`, `po_received_at`, `amount`, `currency`, `amount_basis`, `order_status`, `document_link`

**หนึ่ง Lead มีหลายใบเสนอราคา/หลาย PO ได้:** อย่าคัดลอก Lead เป็นแถวใหม่เพียงเพราะแก้ราคา และอย่าใช้ PO number อย่างเดียวเป็น unique key เพราะลูกค้าต่างรายอาจใช้เลขเหมือนกัน ควรมี internal order_id

ใบเสนอราคาฉบับแก้ไม่ใช่โอกาสใหม่: รายงานจำนวน Lead ที่ได้รับใบเสนอราคาแยกจากจำนวนเอกสาร และไม่บวกรวมทุกรุ่นของเอกสารเดียวกันเป็น pipeline

มูลค่าต้องมีฐานเดียวกัน เช่น ไม่รวม VATทั้งหมดหรือรวม VATทั้งหมดตามที่ยืนยัน ไม่เลือกอัตราหรือหักภาษีจากการเดา

## 2.6 วิธีนำเข้า Excel โดยไม่เขียนทับงานคุณเปิ้ล

**ข้อเสนอ v1:** เปาดูแลนำเข้า source data คุณเปิ้ลดูแลสถานะขาย วิธีนี้ไม่ต้องติดตั้ง Excel connector และไม่สร้าง two-way sync ที่ซับซ้อน

1. เก็บ backup ของ master ก่อนนำเข้า และให้คุณเปิ้ลปิด/หยุดแก้ไฟล์ระหว่าง merge
2. ดาวน์โหลด export ช่วงเวลาที่ต้องการจากระบบที่มีสิทธิ์ จำกัดเฉพาะ Production เมื่อทำงานจริง
3. วางใน `Import_Staging` เท่านั้น ไม่วางทับ `Leads`
4. เทียบ `lead_id` กับ `Leads`; label เป็น NEW / EXISTS / DUPLICATE_IN_IMPORT
5. นำเข้าเฉพาะ NEW โดย paste values ไปท้ายตาราง และกำหนด Owner/Status เริ่มต้น
6. ไม่ใช้ sort order/row number จับคู่ข้อมูล เพราะลำดับแถวเปลี่ยนได้
7. EXISTS ไม่ overwrite `sales_status`, notes, วันนัด, qualification, PO หรือ field ที่คุณเปิ้ลกรอก
8. ถ้า system data ของแถวเดิมต่างกัน ให้สร้าง conflict report ให้ผู้ดูแลตรวจ ไม่ merge แบบเงียบ
9. ตรวจ `จำนวนเดิม + NEW = จำนวนหลังนำเข้า` และไม่มี lead_id ซ้ำ
10. บันทึก export ID/วันนำเข้า/จำนวนเพิ่ม จากนั้นให้คุณเปิ้ลใช้ master ชุดเดียวต่อ

ตัวอย่างสูตรช่วยตรวจเมื่อใช้ Excel Tables ชื่อ `Leads` และ `Incoming` (ตรวจ syntax กับ locale/version ก่อนใช้):

```excel
=IF(COUNTIF(Incoming[lead_id],[@lead_id])>1,"DUPLICATE_IN_IMPORT",IF(COUNTIF(Leads[lead_id],[@lead_id])=0,"NEW","EXISTS"))
```

สูตรนี้เป็นตัวช่วยคัดแถว ไม่ใช่ permission control และไม่เขียน/อัปเดตข้อมูลให้อัตโนมัติ ห้ามเปิดไฟล์ export ใหม่แล้วใช้แทน master เพราะจะทำให้ status ที่คุณเปิ้ลแก้หายไป

### ความปลอดภัยและการใช้งาน Excel

- ให้ไฟล์หลักอยู่ในตำแหน่งที่บริษัทควบคุมและ backup ได้; ยังไม่ assume ว่ามี OneDrive/SharePoint
- จำกัดผู้เข้าถึงและไม่แชร์ไฟล์ที่มี PII แบบ anyone-with-link
- แยกคอลัมน์ import/read-only, manual และ calculated ชัดเจน; ใช้ data validation สำหรับ status
- วันที่เป็นค่า date/time จริงและแสดง `yyyy-mm-dd hh:mm` พร้อมระบุ `Asia/Bangkok`; IDs/โทรศัพท์เป็น Text
- ไม่ใช้สีอย่างเดียวบอกสถานะ และไม่ทำตารางกว้างจนคุณเปิ้ลต้องอ่าน technical columns ทุกวัน
- สูตร/summary ต้องไม่แปลง missing เป็น 0; ถ้า denominator = 0 ให้แสดง “ข้อมูลไม่พอ”
- Spreadsheet protection ช่วยลดการแก้ผิด ไม่ใช่สิ่งทดแทน access control ของไฟล์
- อนาคตใช้ Power Query/Graph/automation ได้เมื่อทราบ version, location, permissions และมีเหตุผลเรื่องปริมาณงาน ไม่ใช่ prerequisite ของรอบทดลอง

## 2.7 SOP รายวันของคุณเปิ้ล

### เมื่อมี Lead ใหม่

เปิดแจ้งเตือน LINE → ดู reference → หาคำขอเดียวกันใน Excel → ตรวจช่องทางติดต่อและโจทย์ → ติดต่อ → บันทึกผลและ next action

การติดต่อไม่ต้องรอรอบ import: เมื่อ LINE แจ้งเตือนมา คุณเปิ้ลเริ่มตอบได้ทันที ส่วนแถวที่ยังไม่ถูกนำเข้าให้เปาช่วย reconcile ภายในวันทำการตามรอบที่ตกลง ห้ามสร้าง canonical backend ID ขึ้นเองจากการเดา

### หลังคุยกับลูกค้า

อัปเดต contactability, qualification/status, สิ่งที่รอ, วัน follow-up และเวลาอัปเดตให้ครบ คำขอรูป/Artwork ให้ส่งผ่าน LINE ตามระบบเดิม อย่านับการกด LINE เป็นหลักฐานว่าได้ไฟล์แล้ว

### เมื่อส่งใบเสนอราคา

เพิ่มเลข/รุ่นเอกสารใน `Quotations`, อัปเดต `Quotation Sent` และ `quotation_first_sent_at` แล้วนัดติดตาม ไม่บันทึก Won ในขั้นนี้

### เมื่อได้รับ PO

ตรวจว่า PO อ้างถึงงานใด → เพิ่ม `Orders_PO` → ใส่หลักฐาน/วันรับ → mark Won และ `won_at` → ตรวจฐานมูลค่า ไม่เพิ่มเงินสดรับถ้ายังไม่ได้รับเงินจริง

### ก่อนจบวัน

ดู New ที่ยังไม่ติดต่อ, งานที่ถึงกำหนด follow-up, Awaiting Information, Quotation Sent และรายการที่ยังไม่มี owner/next action แล้วปรับให้ครบ

**SLA:** Journey เดิมเสนอการตอบภายใน 1–2 ชั่วโมงในเวลาทำการ แต่ยังไม่ยืนยันเวลาทำการ/ผู้สำรองในคำตอบล่าสุด จึงไม่ทำ automation ที่ตัดสินว่า “ผิด SLA” จากเวลาปฏิทินทั้งหมด [S2]

## 2.8 Test plan end-to-end

ทดสอบบน Web Test ด้วย backend/test database และไฟล์ Excel ทดสอบแยกจากของจริงก่อน อย่าให้ GTM/GA4 Production รับ TEST traffic เพราะตั้ง hostname/ปลายทางทดสอบไม่ครบ

| ID | Scenario | Expected evidence |
|---|---|---|
| T01 | Tagged landing → Accept → Products → Quote → Submit | backend first/last ถูก, landing ต่างจาก submission, Excel join ได้ |
| T02 | Tagged landing → Necessary → Submit | Lead สำเร็จ, attribution null, ไม่มี raw GCLID ใน landing field |
| T03 | Unset → Submit | Lead สำเร็จและไม่สร้าง attribution ย้อนหลัง |
| T04 | Accept แล้ว Refresh/internal navigation | touch ไม่ reset; GTM ไม่ inject ซ้ำ |
| T05 | Campaign A → Campaign B | first A, last B; ไม่มี GCLID A ติดกับ UTMs B |
| T06 | Tagged visit → direct return | first/last tagged ที่ยัง valid อยู่; report ไม่อ้างว่า direct หายจาก GA4 |
| T07 | Expired/invalid storage | ไม่ใช้ touch เก่า, form ยังทำงาน |
| T08 | Revoke ก่อน Submit/ระหว่าง retry | local attribution ถูกล้าง; คำขอถัดไปไม่มี tracking metadata; ไม่ replay |
| T09 | หลาย tab/route hydration | consent ล่าสุดถูกใช้ ไม่มี duplicate captures |
| T10 | Valid lead + malformed optional metadata | เก็บ Lead, drop metadata ตาม contract พร้อม safe reason |
| T11 | API timeout + retry key เดิม | backend 1 Lead, notification ตาม idempotency, ไม่ duplicate Event |
| T12 | เปลี่ยน metadata/time แต่ธุรกิจเดิม | fingerprint compatibility ไม่ทำให้คำขอซ้ำหรือปฏิเสธผิด |
| T13 | Export โดยไม่มีสิทธิ์ | ถูกปฏิเสธ ไม่มีไฟล์/PII รั่ว |
| T14 | Export ภาษาไทย/phone/long IDs/formula payload | text ตรง, ศูนย์ไม่หาย, formula ไม่ execute |
| T15 | Import export เดิมสองครั้ง | จำนวน Lead ไม่เพิ่มและ Sales fields ไม่เปลี่ยน |
| T16 | Import overlap รอบเวลา | ไม่ตกหล่น ไม่เพิ่มซ้ำ มี reconcile counts |
| T17 | คุณเปิ้ลทดลอง New → Contacted → Qualified → Quotation Sent → Won | timestamp, documents, PO และ lead_id เชื่อมได้ครบ |
| T18 | Refresh Thank-you + คลิก LINE ต่อ | ไม่เพิ่ม Lead; contact click ไม่เป็น Won/Qualified |
| T19 | Lost/duplicate/spam/test | เหตุผลถูกและถูกกรองออกตามนิยามรายงาน |
| T20 | 2 quote revisions + 2 POs ของ Lead เดียว | pipeline ไม่บวก revisions ซ้ำ, Lead count ยังหนึ่ง, order count สอง |
| T21 | ไม่มี PO แต่ลูกค้าบอกสนใจ | ไม่ mark Won |
| T22 | Poisoned UTMs/unknown params/PII-looking values | ไม่ persist ค่าอันตราย, ไม่ log URL ดิบ, ไม่รั่ว GA4 custom payload |
| T23 | เปลี่ยน schema/backend rollback | old record/client ยังอ่าน/ส่งได้ ไม่มี form outage |
| T24 | Regression GA4 v3/Consent | events เดิมยังถูก, Necessary ยังใช้งานเว็บได้ |

**URL ทดสอบ:** ใช้ Test host และบัญชี/ปลายทางทดสอบเท่านั้น ตัวอย่างค่าทดสอบด้านล่างไม่ใช่คลิกโฆษณาจริง:

```text
/quote?utm_source=google&utm_medium=cpc&utm_campaign=qa_attribution&utm_id=1111111111&utm_content=3333333333&utm_term=qa_keyword&adgroup_id=2222222222&gclid=TEST-GCLID-DO-NOT-IMPORT
```

เปิดหน้าแรกแล้ว navigate ตาม flow ด้วยเพื่อทดสอบ persistence ไม่ทดสอบเฉพาะ `/quote` โดยตรง การใช้ TEST-GCLID พิสูจน์ได้แค่ capture/transport ไม่พิสูจน์ว่า Google Ads attribution/import ใช้ได้จริง

### ชุด TEST ที่ผู้ใช้รายงานก่อนหน้า

`DD-DA98EC8633`, `DD-23EB845C07`, `DD-450744E67B`

ให้ verify และกำหนด `record_class=Test` เมื่อเข้าถึงข้อมูลจริง ไม่ถือว่าเอกสารนี้ได้แก้ record เหล่านั้นแล้ว ห้ามนำไปออกใบเสนอราคาจริง นับยอดขาย หรือส่ง offline conversion เพิ่ม

## 2.9 Definition of Done ของส่วน 1–2

- [x] Backend รับ Lead ได้ทั้ง consent all และ necessary
- [x] Positive path ได้ UTM/GCLID snapshot ที่ join กลับถึง Excel ด้วย lead_id
- [x] Negative path ไม่เก็บ acquisition ผ่านช่องทางลัด
- [x] Export/import ซ้ำไม่เพิ่ม Lead และไม่เขียนทับสถานะคุณเปิ้ล
- [ ] คุณเปิ้ลทดลองอัปเดตสถานะถึง Won พร้อม PO สมมติใน test workbook ได้จริง
- [x] มี evidence ของ T01–T24 ตามขอบเขตที่ใช้ และระบุสิ่งที่ยังไม่ได้ทดสอบ
- [x] Source fields / sales fields / money fields ถูกแยก
- [x] ผ่าน tests, build และ Web Test; Test revisions/rollback ระบุใน evidence แล้ว
- [ ] ตำแหน่งใช้งาน Excel master, backup และสิทธิ์ยังต้องตกลง; campaign/call hours และผู้สำรองยืนยันแล้ว

---

# 3. Campaign Build Sheet — Google Search Core

## 3.1 เป้าหมายและกรอบงบ

**[ยืนยันแล้ว]** Campaign `DD45_GS_CoreCustom_BKKMetro_Lead_v1`, ทดลอง 45 วัน, Average daily budget 250 บาท/วัน

**[จากแผนเดิม S1]** เน้น Owner Brand/B2B กล่อง Custom, Main Offer = Brand Growth Packaging, ไม่ใช้ Low MOQ เป็น Hero Message

**กรอบคำนวณ:** 11,250 บาทสำหรับ Google Core เท่านั้น ไม่ได้อนุมัติให้โยกงบ Meta/Reserve หรือใช้เครดิตโปรโมชั่นเป็นเหตุเพิ่ม spend

Google ระบุว่าสำหรับแคมเปญส่วนใหญ่ ค่าใช้จ่ายรายวันอาจสูงถึง 2 เท่าของ average daily budget และมี monthly spending limit ตามเงื่อนไขระบบ จึงต้องตรวจสะสมแยกจาก `250 × 45`; **250 บาท/วันไม่ใช่ hard daily cap และ 11,250 ไม่ได้ถูก lock อัตโนมัติ** [G5]

Owner ยืนยันว่า 11,250 บาทเป็น media-only working envelope แล้ว ให้ติดตาม Campaign Cost ระดับ Google Ads, แจ้งที่ 10,000 บาท และ pause ที่ 10,750 บาท; VAT/ค่าบริการอยู่นอกกรอบนี้และไม่คำนวณเพิ่มเอง

**สถานะ guard ปัจจุบัน:** เป็น operational control แบบ manual ที่ต้องตรวจอย่างน้อยวันละครั้ง ไม่ใช่ automated rule หรือ hard lifetime cap ใน Google Ads; ยังไม่ได้เปลี่ยน account mode เพื่อตั้ง automation เพราะอยู่นอกขอบเขตการอนุมัติ Launch ครั้งนี้

## 3.2 ตารางตั้งค่าที่จะนำเข้า UI

| Setting | ค่า/ข้อเสนอ | Authority |
|---|---|---|
| Type / Objective | Search / Leads | S1 |
| Main conversion | `generate_lead` จาก GA4, Primary, Count One | สถานะบัญชีตาม U2; ต้องตรวจ campaign goal ตอนสร้าง |
| Secondary | `click_line`, `click_call` ตามปัจจุบัน Secondary/All | ไม่เปลี่ยนค่าเงียบ ๆ และไม่ใช้ bid |
| Bidding | Maximize Conversions; ยังไม่ใส่ tCPA | S1; รักษา baseline ไม่เดา target จากข้อมูลว่าง |
| Daily budget | 250 THB | U1 |
| Dates | Day 1 = วันที่เปิดเงินจริงหลัง QA/อนุมัติ; end หลัง 45 วันตาม timezone | วันปฏิทินยังไม่กำหนด |
| Locations | สมุทรปราการ, กรุงเทพฯ, นนทบุรี, ปทุมธานี, นครปฐม, สมุทรสาคร, ฉะเชิงเทรา, ชลบุรี | S1 |
| Location option | Presence: people in or regularly in target locations | S1; Google อธิบายต่างจาก Presence or Interest [G8] |
| Keyword match | Exact + Phrase | S1 |
| Google Display | ไม่เปิด | S1 |
| Search Partners | เสนอปิดในรอบแรกเพื่อคุมแหล่ง Traffic | ข้อเสนอ ต้องบันทึกตอนล็อก build sheet |
| AI Max/automatic expansion | เสนอไม่เปิดใน controlled v1 | ข้อเสนอ ไม่ใช่ข้อจำกัดว่าห้ามใช้ตลอดไป |
| Language | เสนอเริ่มภาษาไทย; ให้ตรวจภาษา/Keyword Planner และกลุ่มผู้ใช้ก่อนล็อก | ไม่คัดลอก geography มาใช้เป็น language |
| Ad schedule / Call asset hours | กำหนดหลังทราบเวลารับ Lead; หน้าเว็บรับคำขอได้ไม่เท่ากับมีคนรับสายตลอด | รอยืนยัน |
| Auto-tagging | ON ตาม U2; ตรวจ redirect ไม่ลบค่า | G1 |
| Personalized advertising | คง OFF ตามสถานะล่าสุด | U2; ไม่เปิด remarketing ในงานนี้ |

**Primary/Secondary มีผลตาม Goal ที่ Campaign ใช้ด้วย** โดย Custom Goal อาจใช้ action ที่ตั้ง Secondary เป็น bidding signal ได้ จึงตรวจ goal composition ไม่ดูเฉพาะชื่อ Primary อย่างเดียว [G6]

## 3.3 Ad groups / Keyword / Landing Page

ตารางนี้เป็น **seed build sheet** จาก keyword clusters ใน S1 ไม่ใช่ผลวิจัย search volume/CPC ของบัญชี และไม่ใช่การยืนยันว่าทุกหน้า Landing ผ่าน QA แล้ว

| Ad group | Seed keywords | Match ที่เตรียม | Candidate landing |
|---|---|---|---|
| Logo / Custom Box | รับทำกล่องพิมพ์โลโก้; โรงงานผลิตกล่องพิมพ์โลโก้; ผลิตกล่องตามแบบ | Exact + Phrase ของคำที่เลือก | หน้าที่อธิบาย Custom/brand packaging; ระบุ URL หลังตรวจความตรง |
| Offset Box | กล่องออฟเซ็ท; โรงงานกล่องออฟเซ็ท; รับทำกล่องออฟเซ็ท | Exact + Phrase | `/products/folding-carton` — candidate จากโครงเว็บก่อนหน้า |
| Corrugated / Die-cut | กล่องลูกฟูกพิมพ์โลโก้; กล่องไดคัทพิมพ์โลโก้; กล่องไปรษณีย์พิมพ์โลโก้ | Exact + Phrase | `/products/corrugated-box` หรือ `/products/custom-die-cut` — เลือกตามข้อความ/งาน |

อย่ากระจายเพิ่มหลาย Campaign เพราะอยากแยกทุกประเภทในวันแรก หากกลุ่ม Corrugated/Die-cut มี landing intent ต่างกันจนประกอบ ad แล้วคลาดเคลื่อน ให้ปรับ grouping ใน build sheet พร้อมเหตุผลก่อนสร้างจริง

### วิธีใช้ Keyword Planner

เปาเปิด Planner ในบัญชีจริง เลือกพื้นที่เป้าหมาย ใส่ seed keywords และบันทึก date range/locations/estimated volume/CPC ที่เครื่องมือแสดง ค่าไม่มีข้อมูลให้เว้น/ระบุ unavailable ไม่ใส่เลขจากการคาดเดา

ตาราง Keyword inventory ที่ต้องเติม:

```text
ad_group | keyword | match_type | landing_url | intent_reason
planner_period | planner_location | planner_estimate | decision | reviewer
```

คำใน `utm_term` คือ matched keyword; Search terms report เป็นอีกแหล่งสำหรับดู query ที่ระบบรายงาน ห้ามใช้ UTM claim ว่ารู้คำที่ลูกค้าพิมพ์ทุกคน [G3]

## 3.4 Negative Keywords

แผนเดิม S1 มีทั้งคำเจตนาผิดชัดเจนและคำที่ต้องระวัง เช่น “แบบกล่อง”, “ฟรี” เอกสารนี้ไม่ตัดสินใจลบ/เปลี่ยนรายการเดิมเงียบ ๆ

**ข้อเสนอชุดแรกสำหรับ review:** สมัครงาน, หางาน, เงินเดือน, เครื่องทำกล่อง, เครื่องจักร, กล่องพลาสติก, กล่องโฟม, ลังพลาสติก, กล่องไม้, ดาวน์โหลด template

ต้องเลือก match type และตรวจผลกระทบทีละคำก่อน apply ไม่ใส่ทุกคำเป็น broad negative โดยอัตโนมัติ

**คำที่พักไว้ตรวจเพิ่ม:** แบบกล่อง, ฟรี, ราคาถูก — อาจกันผู้ซื้อที่ต้องการคำแนะนำหรือถามราคาได้ ไม่ตัด “ราคา” ทิ้งเป็น default ตาม S1

Negative sheet ต้องมี `keyword`, `match_type`, `level`, `reason`, `added_at`, `approved_by`; เมื่อใช้ Search terms จริงให้บันทึกหลักฐานและประเมิน lead quality ไม่ใช้ CTR เพียงอย่างเดียว

## 3.5 RSA / Assets

ตาม S1 เตรียม 2 RSA ต่อ Ad Group: **Complete Service** และ **Risk Reduction** พร้อม 10–15 Headlines และ 3–4 Descriptions ต่อชิ้น; Google รองรับสูงสุด 15 headlines/4 descriptions และ headline 30/description 90 ตัวอักษร ให้ตรวจใน UI อีกครั้ง [G9]

**ข้อสำคัญ:** เอกสารนี้ไม่อนุมัติคำว่า “ตัวอย่างฟรี”, “ทุกงานเสร็จ 1–3 วัน”, ราคาใด ๆ หรือ claim คุณภาพที่ไม่มีหลักฐาน แม้เคยอยู่ใน Journey draft

โครง Ad copy inventory:

```text
ad_group | ad_variant | final_url | display_path
headline_01 ... headline_15
Description_01 ... Description_04
claim_source | claim_approved_by | approval_date | status
```

ตัวอย่างข้อความร่างเพื่อให้เห็นแนวทาง ไม่ใช่ final ads ที่อนุมัติแล้ว:

- Headline กลาง: `รับผลิตกล่องพิมพ์แบรนด์`, `ส่งสเปกเพื่อประเมินราคา`, `DD BOX PRINTING`
- กลุ่ม Offset: `กล่องออฟเซ็ทสำหรับแบรนด์`, `ขอประเมินงานกล่องออฟเซ็ท`
- Description ร่าง: `แจ้งประเภทกล่อง จำนวน และวันใช้งาน เพื่อให้ทีมประเมินรายละเอียดงาน`
- Risk Reduction: เขียนเรื่องขั้นตอนตรวจสเปก/ตัวอย่างเฉพาะส่วนที่บริษัทอนุมัติว่ามีให้ตามเงื่อนไข ไม่เพิ่มคำว่า “ฟรี” เอง

Sitelinks/Callouts/Structured snippets/Call assets ให้มี final URL และ claim proof ของตนเอง เบอร์ธุรกิจใช้ `084-678-9714`; Call asset ไม่สร้าง native call conversion เป็น Primary เพิ่มโดยไม่ตรวจ

ข้อความทุกชิ้นต้องอยู่ได้ด้วยตนเองและเมื่อนำมาประกอบกัน ไม่ใช้การ pin เป็นวิธีแก้ข้อความที่สัญญาขัดกัน

## 3.6 Final URL suffix และ field mapping

**ข้อเสนอ suffix ระดับ Campaign นี้:**

```text
utm_source=google&utm_medium=cpc&utm_campaign=dd45_core_custom_box&utm_id={campaignid}&utm_content={creative}&utm_term={keyword}&adgroup_id={adgroupid}
```

ไม่ใส่ `?` นำหน้า ไม่ใส่ full landing URL หรือ `{lpurl}` ในช่อง suffix และไม่เพิ่ม GCLID ปลอม/ซ้ำเองเมื่อเปิด Auto-tagging; ตรวจการตั้งค่าระดับ Ad/Ad group/Keyword ที่อาจ override ด้วย [G1, G3]

| URL parameter | CRM field | ความหมาย |
|---|---|---|
| `utm_source` | `utm_source` | google |
| `utm_medium` | `utm_medium` | cpc |
| `utm_campaign` | `utm_campaign` | ชื่อมนุษย์อ่านได้ `dd45_core_custom_box` |
| `utm_id={campaignid}` | `utm_id` / campaign_id ใน export | stable campaign identifier |
| `utm_content={creative}` | `utm_content` / ad_id ใน export | ID ของ ad ไม่ใช่ creative text combination |
| `utm_term={keyword}` | `utm_term` / matched_keyword | keyword ในบัญชีที่ matched |
| `adgroup_id={adgroupid}` | `adgroup_id` | ad group identifier |
| Google เพิ่ม `gclid` | `gclid` | opaque click identifier |

ต่างจากตัวอย่างก่อนหน้าที่มี `utm_id` แต่ schema ไม่มี: **รอบนี้ schema, parser, backend และ export ต้องรองรับ field ชุดเดียวกับ suffix ครบ** ห้ามขาด campaign/adgroup ID ที่จะใช้ join รายงานค่าใช้จ่าย

ไม่ใส่ UTM ใหม่ในลิงก์ภายใน Home → Product → Quote เพราะจะทำให้แหล่งที่มาเดิมคลาดเคลื่อน

## 3.7 Definition of Done ของ Build Sheet

- [x] Campaign settings มีค่า, ที่มา และผู้อนุมัติ; ไม่มี hidden budget change
- [x] Keyword/Negative มี intent และ match type ที่ตรวจแล้ว
- [x] Landing URL เปิดได้จริงบนมือถือ และสอดคล้องกับ ad promise
- [x] RSA/Assets ครบตามที่จะใช้งานและได้รับ approval ของข้อความ/claims
- [x] Final URL suffix ตรง schema และ sample URL ไม่ทำ redirect พารามิเตอร์หาย; paid-click validation รอ traffic จริง
- [x] Primary goal ใช้เฉพาะ lead ที่ต้องการ ไม่มี secondary หลุดเข้า custom bidding goal
- [x] กำหนดวันเริ่ม/วันจบและ timezone แล้ว

---

# 4. สร้าง Google Search Campaign จาก Draft สู่ Publish

## 4.1 แยกสามคำนี้ให้ชัด

| คำ | ความหมาย |
|---|---|
| Build Sheet | สเปกบนเอกสาร; รอบนี้นำไปตั้งใน Campaign จริงแล้ว |
| Unpublished campaign draft | งานตั้งค่าร่างใน Google Ads ยังไม่เผยแพร่ |
| Paused campaign | Campaign ที่สร้างแล้วแต่หยุดอยู่ ไม่ใช่ draft แบบเดียวกัน |

Google รองรับการเก็บ campaign ที่กำลังสร้างเป็น draft และ resume ภายหลังได้ [G7] ไม่ใช้วิธี publish แล้วค่อยรีบ pause เพื่อทดลอง เพราะอาจเปิด delivery โดยไม่ตั้งใจ

**Execution 2026-09-11:** สร้าง unpublished draft และหยุดที่ Review ก่อนตามแผน หลัง Owner อนุมัติ Launch จึง Publish; pause ชั่วคราวเพื่อปิด post-Publish inventory แล้วเปิดกลับเป็น Enabled ไม่ใช่การ publish เพื่อทดลองโดยไม่มีอนุมัติ

## 4.2 ลำดับทำใน UI

1. เลือก Google Ads account ของ DD BOX ให้ถูก ตรวจ currency/timezone และไม่มี billing restriction ที่ขัดขวางการใช้งาน
2. New campaign → Leads → Search ตามหน้าจอปัจจุบัน [G10]
3. ตรวจ conversion goals ของ Campaign: `generate_lead` Primary/One จากแหล่งเดิมเพียงหนึ่งตัว; ไม่สร้าง native tag ซ้ำกับ GA4 import
4. ใส่ชื่อ Campaign ตามที่ยืนยัน
5. ตั้ง bid strategy และงบจาก Build Sheet ไม่กดรับคำแนะนำเพิ่มงบ/ขยายการจับคู่อัตโนมัติโดยไม่พิจารณา
6. ตั้ง networks, locations, Presence, languages และ schedule ที่อนุมัติ
7. ใส่ Ad Groups/Keywords/Negative/RSA/Assets พร้อม Final URL suffix
8. ตรวจ Review page, กลับไปแก้ส่วนที่ UI เตือน และบันทึก draft
9. ออกจาก flow แล้วเปิด draft กลับมาตรวจว่าข้อมูลยังอยู่; เก็บ screenshot/export ของค่าที่ใช้
10. **หยุดก่อนปุ่มที่มีความหมาย Publish/Enable/Launch** จนมีอนุมัติเปิดใช้งบโดยตรง

หน้าจออาจเปลี่ยนชื่อ/ตำแหน่งได้ ให้ยึดความหมายการตั้งค่าและคู่มือปัจจุบัน ไม่ตีความคำแปลจาก browser ว่า “Save” เท่ากับ “Publish” เสมอ

## 4.3 สิ่งที่ต้องบันทึกก่อนส่งตรวจ Draft

Campaign name/ID เมื่อมี, status, budget, bid strategy, goal actions, network choices, locations/Presence, schedule/dates, ad/keyword counts, URL suffix, auto-tagging และผู้ตรวจ

เลข campaign/adgroup/ad อาจยังไม่ครบใน draft ให้เติมเมื่อระบบสร้างจริง ไม่ใช้ IDs สมมติแทนในเอกสารที่จะ deploy

---

# 5. Final Readiness → Controlled Launch → การอ่านผล

## 5.1 Launch gate ที่ต้องมีหลักฐาน

| Gate | หลักฐานขั้นต่ำ | คนรับผิดชอบที่เสนอ |
|---|---|---|
| Website/Consent | mobile/form QA + Necessary ไม่เก็บ marketing attribution + regression GTM | เปา |
| Lead capture | คำขอหนึ่งรายการอยู่ backend จริงและ notification ถึงผู้รับ | เปา/คุณเปิ้ล |
| Excel | นำเข้าได้, IDs join ได้, status ไม่หายเมื่อ import ซ้ำ | เปา/คุณเปิ้ล |
| Sales | คุณเปิ้ลทดลองอัปเดต, มีวัน–เวลารับงานและคนสำรอง | คุณเปิ้ล/Owner |
| Attribution | positive/negative tests + missing reasons + no raw URL escape | เปา |
| Google measurement | mapping/version/source/Count/Goal ถูก; ไม่มี double counting | เปา |
| Account | Billing พร้อม; ตรวจ Advertiser Verification/task/deadline และไม่มี restriction ห้าม serving | ผู้ดูแล Ads |
| Creative/claims | Ads/Assets/LP ตรง approved company facts | Owner/ผู้มีอำนาจ |
| Budget | 250/day, 45-day scope, cumulative guard และ basis ของค่าใช้จ่ายถูกยืนยัน | ผู้อนุมัติงบ |
| Dates | วันเริ่ม/วันจบ/Timezone และผู้อนุมัติจริง | เปา/Owner |
| Recovery | มีคนเข้าถึง pause, rollback code และสำรอง Excel | เปา/ผู้สำรอง |

**Advertiser Verification:** อย่าอนุมานว่าเข้าหน้า Overview ได้แปลว่า verified แล้ว และอย่ากล่าวว่าทุกบัญชีต้อง completed ก่อนร่าง campaign ตรวจข้อความจริงในบัญชี/กำหนดเวลาที่ Google แจ้ง; หากมี restriction ห้าม serving ต้องแก้ก่อน Launch

**ขอบเขต Meta:** S1 เดิมวาง Google Core + Meta Prospecting เปิดคู่กัน; เอกสารนี้เตรียมเฉพาะ Google Core ตาม U1 จึงต้องบันทึกว่าเป็น scope นี้ ไม่ถือว่า Meta Pixel/CAPI หรือ campaign อื่นเสร็จ และไม่โยกงบ Meta มาใช้เอง

**สิ่งที่ไม่ต้องรอ:** custom CRM ขนาดใหญ่, automatic offline imports, attribution ครบทุกคน, realtime dashboard และ sales automation ทั้งหมด ไม่ควรให้สิ่งเหล่านี้ถ่วง controlled test ที่มี manual process ใช้งานได้จริง

## 5.2 อนุมัติและเปิดจริง

ก่อน enable ให้มีข้อความอนุมัติที่ระบุ Campaign, งบ, ระยะ/วันเริ่ม, ผู้รับ Lead และสถานะผ่าน gate อย่างชัดเจน การสร้างไฟล์นี้ไม่ใช่คำอนุมัติเปิดแอด

หลังเปิด:

- ตรวจ Campaign/ad eligibility และพื้นที่/goal/budget ว่าตรง draft
- ตรวจคำขอจริงรายแรกที่ consent ยินยอมว่ามี attribution และ Sales เห็นข้อมูล โดยไม่สร้าง conversion ปลอมเพิ่ม
- ไม่ค้นหาคำโฆษณาแล้วคลิกแอดตัวเองเพื่อ QA; ใช้เครื่องมือ preview และ test environment สำหรับ synthetic cases
- ถ้ามี TEST บน Production ให้จำกัดเท่าที่จำเป็น ระบุ reference และตัดจาก CRM business report; ไม่อ้างว่า GA4/Ads ลบ test events ย้อนหลังแล้วโดยอัตโนมัติ
- การตั้งสถานะ conversion ถูกต้องยังไม่พิสูจน์ paid-click attribution จนมีคลิก/Lead ที่เข้าเงื่อนไขจริง

## 5.3 จังหวะตรวจ 45 วัน

ใช้ S1 เป็น baseline และแยก metric ธุรกิจจาก diagnostic metrics

| ช่วง | ทำอะไร | เกณฑ์ตัดสิน |
|---|---|---|
| Day 1–7 | ตรวจ form, consent, duplicate/spam, export/Excel, การติดต่อ; Search terms วันที่ 2, 4, 7 | แก้ tracking/LP ที่เสียทันที ไม่เปลี่ยนทุกอย่างเพราะข้อมูล 1–2 วัน |
| Day 8–14 | เพิ่ม negative จาก query จริง, ตรวจ cluster/message และ Lead quality | ไม่เปิด Low MOQ อัตโนมัติ เพราะนอก scope Core ที่ยืนยัน |
| Day 15–21 | Review Spend → Lead → Contactable → Qualified → Quotation → PO | สัญญาณเบื้องต้น ไม่เรียก winner จาก lead จำนวนเล็กน้อย |
| Day 22–35 | ปรับสิ่งที่มี evidence ทีละตัวแปร, ทบทวน lost reasons | เพิ่มงบ/โยก reserve ต้องขออนุมัติแยก |
| Day 36–45 | ติดตามใบเสนอราคา/PO และสรุป cohort; ไม่เริ่มการทดลองใหญ่ใหม่ | แยก pending pipeline จาก won orders/รายได้จริง |

S1 มี reserve decision guardrails: ไม่มี Qualified ไม่ใช้ reserve; 1–2 รายใช้ได้จำกัด; 3+ และอย่างน้อย 1 Quotation พิจารณาเพิ่มได้ **นี่เป็นเกณฑ์เดิมสำหรับพิจารณา ไม่ใช่การอนุมัติเงินสำรองในไฟล์นี้**

## 5.4 วิธีทำรายงานจาก Excel

### รายงานพื้นฐานที่ควรเห็น

```text
Reporting period / timezone / data cutoff / attribution model
Campaign ID / Campaign name
Ad spend
Raw form Leads
Real Leads (ตัด Test/Spam/Duplicate)
Contactable
Qualified
Leads with Quotation
Won Leads (ได้รับ PO)
PO/Order count
Won PO value (ระบุฐาน VAT)
Actual revenue / Cash received: แสดงเฉพาะเมื่อมีข้อมูลตรวจสอบ
Unattributed count / missing reasons
```

`qualification_result/qualified_at` ต้องยังอยู่แม้ sales_status ย้ายเป็น Quotation/Won เพื่อไม่ทำให้รายงาน Qualified ลดลงเพียงเพราะฝ่ายขายทำงานคืบหน้า

### สูตรเชิงนิยาม

| Metric | สูตร/ขอบเขต |
|---|---|
| Raw Lead count | จำนวนคำขอจาก backend ไม่ใช่ event count ของ GA4 |
| Real Leads | distinct lead_id ที่ record_class = Real |
| Qualified Leads | Real lead_id ที่ถูก qualify จริง; ดู milestone ไม่ใช่เฉพาะ status ปัจจุบัน |
| Observed CPQL | ค่าแอด Campaign/ช่วงที่ระบุ ÷ Qualified Leads ที่ผูกกลับ Campaign ตาม model/ช่วงที่ระบุ |
| Quotation rate | Qualified Leads ที่มีใบเสนอราคา ÷ Qualified Leads ของ cohort เดียวกัน |
| Lead-to-PO rate | Real Leads ที่ได้รับ PO ÷ Real Leads ของ cohort เดียวกัน |
| PO count | distinct internal order_id ที่มีหลักฐาน PO และ status ตามนิยาม gross/net |
| PO-value-to-ad-spend | มูลค่า PO ที่ระบุว่า attributed ÷ spend; **ห้ามติดป้ายเป็น realized revenue ROAS** |
| Attribution coverage | Real website Leads ที่มี valid tagged touch ÷ Real website Leads |
| Consent-granted capture coverage | Leads ที่ consent all และมี touch ÷ Leads ที่ consent all; รายงานแยกจาก coverage รวม |

สูตรข้างต้นเป็นข้อเสนอการวิเคราะห์ ไม่ใช่ผลการดำเนินงานจริง ไม่มีข้อมูล margin/repeat value พอสร้าง hard CPQL/CAC threshold ในเอกสารนี้

### ข้อควรระวังเมื่อเปรียบเทียบ

- แยก “Lead cohort ตามวันที่รับคำขอ” กับ “PO received ตามวันที่ได้รับ PO” อย่าเอา PO ของ Leads เก่ามาปนสรุป conversion rate ของ Leads ใหม่
- ยอด Ads มักรายงานตาม interaction/date logic และ attribution windows ของ action; Excel ใช้วันที่รับ Lead/PO ต้องระบุให้ชัด ไม่บังคับสองระบบเท่ากันทุกวัน
- Window จับคู่ใน browser, CRM retention และ Google conversion window เป็นคนละเรื่อง ไม่ใช้ 90 วันค่าเดียวแทนทุกอย่าง
- First-touch และ last-touch เป็นคนละมุมมอง ห้ามบวกทั้งคู่เป็นยอดลูกค้าสองราย
- ข้อมูลไม่ครบให้ระบุ “ไม่ทราบ/รออัปเดต” ไม่ใส่ 0
- แหล่งที่มาจาก UTM/GCLID เป็น observed attribution ไม่พิสูจน์ incremental sales หรือสาเหตุเชิงทดลองทั้งหมด
- ข้อมูลที่หายเพราะไม่ยินยอม/เปลี่ยนอุปกรณ์ทำให้ coverage ต่ำได้ ไม่ใช้วิธีติดตามลับเพื่อให้รายงานเต็ม

## 5.5 เกณฑ์แก้ไข/หยุดที่เสนอ

**หยุดและแก้ทันทีเมื่อ:** ฟอร์มส่งไม่ได้, ข้อมูลลูกค้ารั่ว, measurement ส่งก่อน consent, Primary conversion นับผิด, budget/goal เปลี่ยนผิด หรือไม่สามารถรับ/ติดตาม Lead ได้

**ยังไม่เพิ่มงบเมื่อ:** มีแต่ raw Leads แต่ไม่ Qualified, Excel ไม่มี status, attribution/duplicate ยังผิด, หรือใช้เงินเกินกรอบที่อนุมัติ

**ไม่ตัดสินจาก:** Click/CTR/CPC/Like เพียงอย่างเดียว และไม่ประกาศว่า campaign แพ้เพราะข้อมูล 1–2 วันโดยยังไม่ดู intent และ sales-cycle delay

---

# 6. Phase ถัดไป — ส่งผลขายกลับ Google Ads

ส่วนนี้วางทิศทางไว้ ไม่อยู่ใน minimum launch implementation

เมื่อคุณเปิ้ลอัปเดต Excel สม่ำเสมอแล้ว เปาสามารถนำ snapshot ที่อนุมัติมา join `lead_id` กับ backend GCLID เพื่อเตรียม offline outcomes เช่น `qualified_lead` และ `won_po`

```text
Excel sales outcomes + backend acquisition snapshot
                         ↓ join lead_id
                  Reviewed conversion batch
                         ↓ validate consent/IDs/timestamps
                  Google Ads offline conversion
```

ต้องมีขั้นตอน review, dry run, import ledger และ dedup key สำหรับ event เดียวกัน ไม่อัปโหลด `generate_lead` ซ้ำกับ GA4 import เดิม และไม่เปิด downstream หลาย action เป็น Primary พร้อมกันโดยไม่พิจารณาการนับ/การ Optimize [G2, G6]

Google มีทั้ง offline import จาก click ID และแนวทาง enhanced conversions for leads ซึ่งใช้ข้อมูลลูกค้าเพิ่มเติม [G2] รอบนี้ **ไม่เปิด Enhanced Conversions หรือส่ง hashed email/phone อัตโนมัติ** เพียงเพราะมีข้อมูลใน Lead ให้ตรวจ purpose/consent/ข้อกำหนดปัจจุบันและขออนุมัติต่างหาก

ข้อจำกัดที่จะต้องตรวจตอน implement จริง:

- GCLID ต้องเป็นของจริงและอยู่ใน window/method ที่รองรับ; test string ไม่ใช้ได้
- เวลา qualification/PO ต้องเป็นเวลาที่ outcome เกิด ไม่ใช่เวลาที่ export
- ค่า `won_po` คือมูลค่า PO ตามนิยามธุรกิจ ไม่ใช่ recognized revenue
- Consents/retention/revocation ฝั่ง server ต้องรองรับการใช้ข้อมูลนี้ก่อนส่ง
- first/last touch สองรายการไม่ใช่ click history ทั้งหมด; ถ้าจะเลือก last Google Ads click ต้องออกแบบ policy เพิ่ม ไม่เดาจาก campaign ที่เห็นล่าสุด
- Excel ไม่ sync outcome กลับ Google Ads เอง การมี field GCLID เป็นเพียงการเตรียมความสามารถในอนาคต

---

# 7. Decision log และรายการที่ต้องยืนยันต่อ

| ID | เรื่อง | ข้อสรุป/สถานะ | เหตุผล |
|---|---|---|---|
| D01 | Sales tool | **Confirmed: Excel** | ตามวิธีทำงานที่ผู้ใช้เลือก ไม่สร้าง CRM ซ้ำ |
| D02 | Sales owner | **Confirmed: คุณเปิ้ล** | ผู้ใช้ยืนยันเป็นคนอัปเดต |
| D03 | Won definition | **Confirmed: PO received** | แยก order outcome ออกจากเงินรับ/รายได้บัญชี |
| D04 | Campaign/budget | **Confirmed: Core / 45 วัน / 250 บาทต่อวันเฉลี่ย; Owner/ผู้ใช้เป็นผู้อนุมัติงบ; alert 10,000 / pause 10,750 บาท** | ใช้ Google Ads campaign Cost เป็นเกณฑ์; ไม่เปลี่ยน campaign อื่นและไม่เปิดต่อหลัง pause โดยไม่มี Owner approval |
| D05 | Import workflow | Proposed: authenticated export → staging → append-new master | รองรับ Excel โดยไม่ทำ two-way sync |
| D06 | Source truth | Proposed: backend acquisition / Excel sales / Ads spend | ลดความสับสนเรื่องข้อมูลขัดกัน |
| D07 | Browser attribution TTL | Proposed: 90 วันต่อ touch | ต้องอนุมัติและเปิดเผยตามการใช้จริง |
| D08 | Raw click IDs in sales workbook | Proposed: ไม่ export เป็น default | ลดการกระจายข้อมูลที่ Sales ไม่จำเป็นต้องอ่าน |
| D09 | Qualified/SLA | Proposed criteria; campaign/call hours และ backup owner confirmed, response-time target ยังรอ | ยังไม่ได้ยืนยัน SLA วิธีทำงานรายวันทั้งหมด |
| D10 | Offline import | Deferred | ไม่ขวาง Launch ที่มี manual outcome tracking |
| D11 | Draft concurrency | Build Sheet/Draft ทำคู่ขนานได้ | gate อยู่ก่อน spend ไม่ใช่ก่อนร่าง |
| D12 | Publication/deploy | **Confirmed and executed: Google Ads Publish/Enable 2026-09-11** | Owner ยืนยัน Media only, EU political ads = No และ Launch today; ไม่ครอบคลุมการเพิ่มงบหรือ re-enable หลัง guard |

### ข้อมูลเพิ่มเติมที่ขอภายหลังได้โดยไม่ขวางการเริ่ม PR-A

Excel version/location และ backup policy, การเก็บ PO/ใบเสนอราคา, ฐานมูลค่า VAT, response-time SLA, ผู้อนุมัติ Launch และนโยบาย retention

ไม่ต้องส่งข้อมูลลูกค้าจริง, เลขบัตร, password, token, service account key หรือเอกสารการเงินที่ไม่เกี่ยวกับ scope นี้

---

# 8. ใบงานเริ่มต้นสำหรับเปา

ทำตามลำดับนี้ได้ โดยยังไม่ต้องสร้าง/เปิดแอด:

1. เพิ่มไฟล์แผนนี้ใน working branch ตามวิธี review ของ repo เมื่อคุณอนุมัติ ไม่ commit ข้อมูลลูกค้าหรือ Excel master
2. กำหนด schema v1 และเช็ก field parity ของ Final URL suffix → parser → API → Firestore → export
3. ทำ PR-A (attribution module + tests) โดย reuse consent เดิม
4. ทำ PR-B (backend compatibility/idempotency/export) และ deploy backend ไป Test ก่อน frontend
5. เตรียม Excel ทดสอบแบบไม่มี PII จริง; ให้คุณเปิ้ลทดลองสถานะถึง Won = PO
6. ทำ Web Test end-to-end แล้วเก็บ evidence/commit SHA/revision
7. ในเวลาเดียวกันเตรียม Keyword/Ads/LP ใน Build Sheet และสร้าง draft ที่ไม่เปิดใช้งบ
8. ปิด TBD ที่เกี่ยวกับการใช้งานจริง แล้วใช้ Launch gate ขออนุมัติก่อน enable

**ปลายทางที่ต้องได้:** คุณเปิ้ลยังใช้ Excel ได้ตามถนัด ขณะที่เปาต่อข้อมูลจากเงินโฆษณาไปถึง Lead, ใบเสนอราคา และ PO ได้ โดยไม่ทำให้ระบบรับลูกค้าเสีย ไม่ติดตามเกิน consent และไม่สับสนว่า pipeline คือรายได้จริง

---

# 9. แหล่งอ้างอิงและขอบเขตหลักฐาน

แหล่งออนไลน์ด้าน platform ตรวจวันที่ **2026-09-10**; เมนูและข้อจำกัดอาจเปลี่ยน ให้ตรวจเอกสารต้นทางอีกครั้งก่อน implement/launch หากเวลาผ่านไป

## User/project sources

- **[U1]** คำตอบล่าสุดของผู้ใช้ในบทสนทนานี้: ใช้ Excel, คุณเปิ้ลอัปเดตเอง, Won เมื่อได้รับ PO, Campaign `DD45_GS_CoreCustom_BKKMetro_Lead_v1`, 45 วัน/Google Core เฉลี่ย 250 บาทต่อวัน — confirmed inputs
- **[U2]** สรุปการทำ GA4/GTM/Google Ads และผล QA ที่ผู้ใช้ส่งในบทสนทนา วันที่ 9–10 กันยายน 2026 — user-reported operational evidence ไม่ใช่การทดสอบสดซ้ำในงานสร้างเอกสาร
- **[S1]** `07 - Campaign & Media Plan` ที่แนบในโปรเจกต์ — baseline intended plan; ดูหัวข้อ Campaign G1, budget, readiness gate, conversion configuration, KPI/diagnostic logic. URL อ้างอิง: <https://docs.google.com/document/d/1-ssI72sT0f5CV80FH-Cx4G5S1Jd6FOSpu0WHAKGcFPw> เนื้อหาที่ใช้มาจากไฟล์แนบที่โหลดไว้ ไม่ได้อ้างว่าเปิด live Google Doc ซ้ำ
- **[S2]** `DD BOX — Offer & Customer Journey Design v1.0` ที่มีใน source — **Working Draft**; ใช้เป็นฐานเรื่อง journey, qualification และ statuses ไม่ใช้ยืนยันราคา/เงื่อนไข/เวลาตอบแทน Owner
- **[S3]** `DESIGN.md` ที่แนบ — authority สำหรับ UI/CI หากเพิ่มปุ่ม export หรือสร้างหน้าที่เกี่ยวข้อง ไม่เปลี่ยน customer artwork/brand assets ในงานนี้

## Repository snapshot

Baseline: <https://github.com/chonlathan-cloud/P-Project-package-P-ples/commit/567b5977bfeb09b5d4bbbcd9b436c21ad84dd0fa>

- **[R1]** Frontend lead schema/payload: <https://github.com/chonlathan-cloud/P-Project-package-P-ples/blob/567b5977bfeb09b5d4bbbcd9b436c21ad84dd0fa/src/features/leads/schema.ts>
- **[R2]** Consent/helper: <https://github.com/chonlathan-cloud/P-Project-package-P-ples/blob/567b5977bfeb09b5d4bbbcd9b436c21ad84dd0fa/src/features/analytics/consent.ts> และ `consent-manager.tsx` ในโฟลเดอร์เดียวกัน
- **[R3]** Backend LeadCreate/StoredLead: <https://github.com/chonlathan-cloud/P-Project-package-P-ples/blob/567b5977bfeb09b5d4bbbcd9b436c21ad84dd0fa/services/content-api/src/ddbox_api/domain/models.py>
- **[R4]** Lead service/idempotency: <https://github.com/chonlathan-cloud/P-Project-package-P-ples/blob/567b5977bfeb09b5d4bbbcd9b436c21ad84dd0fa/services/content-api/src/ddbox_api/services/leads.py>
- **[R5]** Admin ปัจจุบัน: <https://github.com/chonlathan-cloud/P-Project-package-P-ples/blob/567b5977bfeb09b5d4bbbcd9b436c21ad84dd0fa/src/features/admin/admin-workspace.tsx> และ backend `api/admin.py` — baseline ที่อ่านเป็น content operations ไม่ใช่ Excel sales sync

## Current official platform documentation

- **[G1] Google Ads — Auto-tagging:** <https://support.google.com/google-ads/answer/1752125?hl=en>
- **[G2] Google Ads — Offline conversions using GCLID:** <https://support.google.com/google-ads/answer/7012522?hl=en>
- **[G3] Google Ads — ValueTrack parameters:** <https://support.google.com/google-ads/answer/6305348?hl=en>
- **[G4] Google — Consent Mode overview:** <https://developers.google.com/tag-platform/security/concepts/consent-mode>
- **[G5] Google Ads — Spending limits:** <https://support.google.com/google-ads/answer/10486637?hl=en>
- **[G6] Google Ads — Primary and secondary conversion actions:** <https://support.google.com/google-ads/answer/11461796?hl=en>
- **[G7] Google Ads — Campaign drafts during creation:** <https://support.google.com/google-ads/answer/11052121?hl=en>
- **[G8] Google Ads — Advanced location options:** <https://support.google.com/google-ads/answer/1722038?hl=en>
- **[G9] Google Ads — Responsive Search Ads:** <https://support.google.com/google-ads/answer/7684791?hl=en>
- **[G10] Google Ads — Create a Search campaign:** <https://support.google.com/google-ads/answer/9510373?hl=en>
- **[G11] GA4 — Data redaction:** <https://support.google.com/analytics/answer/13544947?hl=en>

**ขอบเขตการสรุป:** Google documentation รองรับความหมายและการทำงานของ platform แต่ไม่ได้รับรอง schema, TTL, Excel workflow, Qualified criteria หรือ sales accounting ของ DD BOX รายละเอียดเหล่านั้นถูกระบุเป็นข้อเสนอ/คำยืนยันของผู้ใช้แยกไว้ในเอกสาร
