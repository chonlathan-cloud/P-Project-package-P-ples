# DD BOX Google Search Core — Build Sheet v1

> สถานะ: **Published และ Enabled แล้ว 2026-09-11; ล่าสุด `Eligible (Learning)` ขณะ bid strategy เรียนรู้**
> Campaign: `DD45_GS_CoreCustom_BKKMetro_Lead_v1`
> Campaign ID: `24234245697`
> ขอบเขต: Google Search Core, 45 วัน, average daily budget 250 THB (กรอบคำนวณ 11,250 THB; ไม่ใช่ hard cap ของระบบ)
> วันที่จัดทำ/อัปเดตล่าสุด: 2026-09-10 / 2026-09-11 (Asia/Bangkok)
> ความคืบหน้า minimum launch implementation: **ประมาณ 98%**; controlled launch เริ่มแล้ว และการติดตามผล Day 1–45 ยังดำเนินต่อ

เอกสารนี้เป็น build sheet และ execution record ของ Campaign จริง Owner อนุมัติ Media only, EU political ads = No และ Launch today เมื่อ 2026-09-11 แล้ว การเพิ่มงบหรือ re-enable หลัง budget guard ยังต้องขออนุมัติใหม่

## 1. Campaign settings

| Setting | Build value | สถานะ / หลักฐาน |
|---|---|---|
| Account | `630-967-1635` — DD BOX PRINTING Co.,Ltd. | ตรวจแบบ read-only ใน Google Ads เมื่อ 2026-09-10 |
| Currency / timezone | THB / `(GMT+07:00) Indochina Time` | ตรวจจาก Overview; timezone ตรง Asia/Bangkok |
| Campaign name | `DD45_GS_CoreCustom_BKKMetro_Lead_v1` | Published; Campaign ID `24234245697` |
| Type / objective | Search; campaign goal `Submit lead forms` | สร้างผ่าน “Create a campaign without guidance” เพราะ Leads-guided flow บังคับ Google-hosted form และไม่เปิดให้เลือก existing `generate_lead`; ตรวจ goal ที่ Review แล้ว |
| Budget | 250 THB average daily | เปิดใช้งานแล้ว; Cost = 0 บาท ณ เวลาตรวจ 2026-09-11 และต้องตรวจยอดสะสมเทียบกรอบ 11,250 บาท |
| Budget approver / guard | Owner/ผู้ใช้; manual alert ที่ 10,000 THB; pause ที่ 10,750 THB; ห้าม re-enable/เพิ่มงบโดยไม่มี Owner approval | ใช้ `Cost` ระดับ campaign ใน Google Ads เป็น source of truth; ตรวจอย่างน้อยวันละครั้งและก่อนเปลี่ยนงบ; เผื่อ 500 THB จาก daily-spend exposure สูงสุดตาม average daily budget 250 THB |
| Bid strategy | Maximize Conversions; ไม่ใส่ tCPA | ตั้งแล้ว; customer acquisition ไม่เปิด และไม่รับคำแนะนำเพิ่มงบอัตโนมัติ |
| Primary conversion | `generate_lead`, GA4 Website, Primary, Count One, 90-day click window | ตั้ง campaign-specific goal ให้ UI แสดง `Submit lead forms` แล้ว; `click_line`/`click_call` ไม่ได้เพิ่มเข้า bidding goal |
| Secondary conversions | `click_line`, `click_call`, GA4 Website, Secondary, Count Every, 90-day click window | ตรวจแล้วว่าไม่อยู่ใน account-level goals; ห้ามเพิ่มเข้า custom bidding goal |
| Networks | Google Search only; Display OFF; Search Partners OFF | ตรวจซ้ำหลัง Publish แล้ว 2026-09-11 |
| Locations | กรุงเทพฯ, สมุทรปราการ, นนทบุรี, ปทุมธานี, นครปฐม, สมุทรสาคร, ฉะเชิงเทรา, ชลบุรี | ตั้งและตรวจครบ 8 จังหวัดแล้ว |
| Location option | Presence: people in or regularly in targeted locations | ตั้งใน Campaign แล้ว |
| Language | Thai | ตั้งใน Campaign แล้ว; Planner evidence เดิมเป็น All languages ตามข้อจำกัดของ workflow |
| Keyword match | Exact + Phrase | 26 entries จาก 13 seeds ใน 3 ad groups; ไม่มี Broad และไม่รับ broad-match recommendation |
| AI Max / automatic expansion | OFF | ตั้ง AI Max, Text customization และ Final URL expansion เป็น OFF แล้ว |
| Auto-tagging | ON | ตรวจใน Account settings; sample query preservation ผ่านแล้ว ส่วน paid-click ValueTrack validation รอ traffic จริง |
| Personalized advertising | คง OFF | ห้ามเปลี่ยนในงานนี้ |
| Start / end date | `2026-09-11` / `2026-10-25` | Published; ใช้ timezone บัญชี `(GMT+07:00) Indochina Time` |
| Ad schedule | Monday–Saturday 08:00–20:00 | Monday–Friday 08:00–20:00 และ Saturday 08:00–20:00; Sunday ไม่แสดงโฆษณา |
| Campaign final URL suffix | `utm_source=google&utm_medium=cpc&utm_campaign=dd45_core_custom_box&utm_id={campaignid}&utm_content={creative}&utm_term={keyword}&adgroup_id={adgroupid}` | บันทึกใน Campaign; sample UTM/GCLID ไม่หายและ Ad-level override ว่าง; รอ paid-click จริงเพื่อยืนยัน ValueTrack IDs โดยไม่คลิกโฆษณาตัวเอง |

### Account snapshot ก่อนสร้าง draft

- Campaign table แสดง `Drafts in progress: 0`, ไม่มี enabled campaign และ account total budget 0 THB/day เมื่อ 2026-09-10; removed state ยังไม่ได้พิสูจน์แยก แต่ชื่อ campaign ซ้ำไม่ใช่เหตุให้ publish ได้
- Conversion actions มี 3 รายการ: `generate_lead`, `click_call`, `click_line`; ทั้งหมดเป็น GA4 imports และยังไม่มี recent conversions
- `generate_lead` เป็น Primary/One แต่ `Included in account-level goals = No` จึงห้ามปล่อย campaign ใช้ default goal โดยไม่ตรวจ
- Account settings แสดงบัญชี Active และ Auto-tagging ON; ตรวจ Overview ซ้ำเมื่อ 2026-09-11 พบ balance 0 THB, มี primary payment method, ไม่มี backup payment method และไม่พบข้อความ account suspension/restriction แต่ยังไม่ใช่หลักฐานว่า ad จะผ่าน policy review หลัง Publish
- Policy > Account แสดง ad disclosure เป็น “Ads funded by DD BOX PRINTING Co.,Ltd.” และ organization questions ตอบแล้วเมื่อ 2026-09-10; Owner ยืนยัน EU political ads = No และบันทึก declaration แล้ว 2026-09-11 ส่วน D&B/affiliation อยู่ใต้ optional verification tasks ตาม UI ปัจจุบัน
- บัญชีแสดง promotion spend 12,000 THB เพื่อรับ credit ภายใน 2026-11-09; promotion นี้ไม่ใช่เหตุอนุมัติเพิ่มงบหรือเปลี่ยนกรอบ 11,250 THB

### Live execution status

- Published จาก draft ID `10213453263`; Campaign ID จริง `24234245697`; provisional ID เดิม `281499221396078` ใช้เป็นข้อมูลประวัติเท่านั้น
- ใช้ “Create a campaign without guidance” แล้วเลือก Search เพื่อคง existing website conversion; Leads-guided flow ขอ Google-hosted lead form และไม่เปิด existing `generate_lead` ให้เลือก จึงไม่ใช้ flow นั้น
- ตั้ง campaign-specific `Submit lead forms`, Maximize Conversions, Search-only, 8 จังหวัดแบบ Presence, Thai, AI Max/automatic expansion OFF, final URL suffix, ช่วง 2026-09-11–2026-10-25, schedule Monday–Saturday 08:00–20:00 และ 250 THB/day แล้ว
- Rename `Ad group 1` เป็น `AG_BrandFolding`, เพิ่ม `AG_Corrugated` และ `AG_DieCutInsert`; รวม 26 Exact/Phrase keywords และ 6 RSA ครบตาม build sheet
- เพิ่ม campaign negative Phrase Match 10 รายการตาม Owner approval; `template` คง Review และ `แบบกล่อง`/`ฟรี`/`ราคาถูก` คง Hold จึงไม่ถูกเพิ่ม
- Associate campaign assets แล้ว: Sitelink 4, Callout 4, Structured snippet 1 และ Call asset 1; ทั้งหมดอยู่ `Pending / Under review` ณ เวลาตรวจ
- Call asset ใช้ schedule Monday–Friday 07:30–19:30 และ Saturday 07:30–19:30; เปิด call reporting และปิด call recording ตามค่าที่ตรวจได้ โดยไม่เพิ่ม `phone call lead` เข้า conversion goal
- RSA ใหม่ผ่าน automated save-time policy check ว่าไม่พบปัญหา; เปลี่ยน branding ใน Risk Reduction จาก `DD BOX PRINTING` เป็น `DD Box Printing` หลังพบ Capitalisation warning ในรายการแรก
- Owner ยืนยัน cost basis = Media only, EU political ads = No และ Launch today; Campaign เปิดเป็น `Enabled / Eligible (Learning)` แล้ว โดยสถานะก่อนหน้า `Eligible (Limited)` เปลี่ยนเป็นช่วง bid strategy learning
- ไม่ขยาย Broad/AI Max เพื่อแก้ optimisation status เพราะขัด controlled scope; มีบาง Exact/Phrase keyword เป็น `Low search volume` แต่ keyword อื่นยัง `Eligible`
- ณ เวลาตรวจ 2026-09-11: impressions/clicks/conversions = 0 และ campaign Cost = 0 บาท; policy/delivery และ Lead จริงรายแรกเป็นงานติดตามต่อ

### Lead handling ที่ยืนยันแล้ว

- Primary owner: คุณเปิ้ล
- Backup owner: คุณวิว; เก็บหมายเลขสำรองไว้นอก repository เพื่อลดการกระจายข้อมูลติดต่อส่วนบุคคล
- Public call asset: ใช้หมายเลขสาธารณะที่ Owner อนุมัติสำหรับ Google Ads และจำกัดเวลาแสดงตาม schedule ด้านบน

### Budget guard ที่ยืนยันแล้ว

- ผู้อนุมัติงบ: Owner/ผู้ใช้
- Working envelope: 11,250 THB ของ media `Cost` ระดับ Campaign ใน Google Ads; Owner ยืนยัน cost basis เป็น **Media only** จึงไม่รวม VAT/ค่าบริการ
- Alert threshold: เมื่อ cumulative campaign Cost ถึง 10,000 THB ให้แจ้ง Owner และตรวจ lead quality/remaining dates ก่อนดำเนินต่อ
- Pause threshold: เมื่อ cumulative campaign Cost ถึงหรือเกิน 10,750 THB ให้ pause campaign โดยเร็ว และห้าม re-enable หรือเพิ่มงบโดยไม่มี Owner approval ใหม่
- Guard นี้เป็น manual operational control ที่ต้องตรวจอย่างน้อยวันละครั้ง ไม่ใช่ automated rule หรือ hard lifetime cap; ยังไม่ได้เปลี่ยน Google Ads account mode เพื่อตั้ง automation เพราะอยู่นอกขอบเขต approval ครั้งนี้
- เหตุผลของ buffer 500 THB: average daily budget 250 THB อาจใช้ได้สูงสุดประมาณสองเท่าในบางวัน; guard นี้ลดความเสี่ยงเกิน working envelope แต่ไม่ใช่ billing hard cap และค่าใช้จ่ายอาจ settle หลัง pause
- Cadence: ผู้ดูแล Ads ตรวจ campaign Cost อย่างน้อยวันละครั้ง และตรวจเพิ่มก่อนแก้ budget, schedule หรือ status

### Decision: ปรับ ad-group structure

Build นี้รวม Logo/Custom + Offset เป็น `AG_BrandFolding` และแยก Corrugated กับ Die-cut ออกจากกัน เพราะเว็บมี landing intent คนละหน้า การแยกนี้ลด keyword overlap และทำให้ ad promise ตรงกับเนื้อหาหน้ามากกว่าการรวม Corrugated/Die-cut ไว้กลุ่มเดียว

## 2. Ad groups and keywords

Landing URLs ด้านล่างตอบ HTTP 200; เมื่อ 2026-09-11 ตรวจซ้ำที่ mobile viewport 390px แล้วว่าไม่มี horizontal overflow, มี H1 ครบ, quote form แสดงได้ และ sample UTM/GCLID คงอยู่หลัง redirect

| Ad group | Final URL | Keyword seed | Match type | Intent / decision | Planner |
|---|---|---|---|---|---|
| `AG_BrandFolding` | `https://www.ddboxprinting.com/products/folding-carton` | รับทำกล่องพิมพ์โลโก้ | Exact + Phrase | ต้องการผู้ผลิตกล่องแบรนด์ | unavailable |
| `AG_BrandFolding` | same | โรงงานผลิตกล่องพิมพ์โลโก้ | Exact + Phrase | เจตนาเลือกโรงงาน/ผู้ผลิต | unavailable |
| `AG_BrandFolding` | same | ผลิตกล่องตามแบบ | Exact + Phrase | ต้องการโครงสร้าง/ขนาดตามงาน | unavailable |
| `AG_BrandFolding` | same | กล่องออฟเซ็ท | Exact + Phrase | ตรงประเภทสินค้าใน landing | 10–100/mo; Medium; top bid 14.90–48.75 THB |
| `AG_BrandFolding` | same | รับทำกล่องออฟเซ็ท | Exact + Phrase | เจตนาขอผู้รับผลิต | unavailable |
| `AG_Corrugated` | `https://www.ddboxprinting.com/products/corrugated-box` | กล่องลูกฟูกพิมพ์โลโก้ | Exact + Phrase | ต้องการกล่องขนส่งพร้อมแบรนด์ | unavailable |
| `AG_Corrugated` | same | รับทำกล่องลูกฟูก | Exact + Phrase | เจตนาขอผู้รับผลิต | 10–100/mo; High; top bid 24.59–75.56 THB |
| `AG_Corrugated` | same | กล่องไปรษณีย์พิมพ์โลโก้ | Exact + Phrase | ตรง use case กล่องไปรษณีย์ | 10–100/mo; High; bid unavailable |
| `AG_Corrugated` | same | โรงงานผลิตกล่องลูกฟูก | Exact + Phrase | เจตนาเลือกโรงงาน/ผู้ผลิต | 100–1K/mo; High; top bid 18.08–42.50 THB |
| `AG_DieCutInsert` | `https://www.ddboxprinting.com/products/custom-die-cut` | กล่องไดคัทพิมพ์โลโก้ | Exact + Phrase | ต้องการโครงสร้างไดคัทพร้อมแบรนด์ | unavailable |
| `AG_DieCutInsert` | same | รับทำกล่องไดคัท | Exact + Phrase | เจตนาขอผู้รับผลิต | 10–100/mo; High; top bid 26.19–55.93 THB |
| `AG_DieCutInsert` | same | กล่องไดคัทตามแบบ | Exact + Phrase | ต้องการโครงสร้างเฉพาะงาน | unavailable |
| `AG_DieCutInsert` | same | ชิ้นรองสินค้าไดคัท | Exact + Phrase | ตรง landing เรื่อง insert/ยึดสินค้า | unavailable |

สร้างแต่ละ seed เป็น `[exact]` และ `"phrase"` ครบ 26 keyword entries จาก 13 seeds แล้ว; ห้ามเติม estimate เอง หาก Planner ไม่มีข้อมูลให้บันทึก `unavailable`

**สถานะ Live:** `AG_BrandFolding` 10 entries, `AG_Corrugated` 8 entries และ `AG_DieCutInsert` 8 entries; Google แสดง 26/26 โดยไม่มี Broad match บางรายการเป็น `Low search volume` ตามข้อมูลปัจจุบัน

### Keyword Planner evidence

- Plan ID: `1437654046`; สร้าง 2026-09-10 ประมาณ 21:00 `(GMT+07:00)`
- Period: Last 12 months; Network: Google; Location: Bangkok, Samut Prakan, Nonthaburi, Pathum Thani, Nakhon Pathom, Samut Sakhon, Chachoengsao, Chon Buri (province level)
- Historical-metrics workflow ล็อก Language เป็น All languages; ค่าในตารางจึงไม่ใช่ Thai-only estimate ส่วน Campaign ยังคงตั้ง Thai ตาม controlled v1
- Google Ads แสดงเป็นช่วงกว้างเพราะบัญชียังไม่มี campaign history; 8 จาก 13 seeds ไม่มีข้อมูล จึงคง `unavailable` โดยไม่ตีความเป็นศูนย์
- Decision: คงทั้ง 13 seeds ใน Draft แบบ Exact + Phrase เพื่อทดสอบ intent แต่ให้จับตา `กล่องออฟเซ็ท` และ `โรงงานผลิตกล่องลูกฟูก` เป็นกลุ่ม volume หลัก; ห้ามขยายเป็น Broad จากผลนี้

## 3. Campaign negative keyword review

| Keyword | Match | Level | Decision | Reason |
|---|---|---|---|---|
| สมัครงาน | Phrase | Campaign | APPLIED 2026-09-11 | เจตนาหางาน |
| หางาน | Phrase | Campaign | APPLIED 2026-09-11 | เจตนาหางาน |
| เงินเดือน | Phrase | Campaign | APPLIED 2026-09-11 | เจตนาหางาน |
| เครื่องทำกล่อง | Phrase | Campaign | APPLIED 2026-09-11 | ค้นหาเครื่องจักร ไม่ใช่งานผลิต |
| เครื่องจักรผลิตกล่อง | Phrase | Campaign | APPLIED 2026-09-11 | ค้นหาเครื่องจักร |
| กล่องพลาสติก | Phrase | Campaign | APPLIED 2026-09-11 | วัสดุนอก landing intent |
| กล่องโฟม | Phrase | Campaign | APPLIED 2026-09-11 | วัสดุนอก landing intent |
| ลังพลาสติก | Phrase | Campaign | APPLIED 2026-09-11 | สินค้านอกขอบเขต |
| กล่องไม้ | Phrase | Campaign | APPLIED 2026-09-11 | วัสดุนอกขอบเขต |
| ดาวน์โหลดเทมเพลต | Phrase | Campaign | APPLIED 2026-09-11 | เจตนาดาวน์โหลด ไม่ใช่ขอผลิต |
| template | Phrase | Campaign | REVIEW | ตรวจ Search terms ไทย/อังกฤษก่อน apply |
| แบบกล่อง | — | Campaign | HOLD | อาจเป็นผู้ซื้อที่ต้องการคำแนะนำโครงสร้าง |
| ฟรี | — | Campaign | HOLD | อาจอยู่ใน query ที่ยังมี commercial intent; ห้าม broad-negative อัตโนมัติ |
| ราคาถูก | — | Campaign | HOLD | ไม่ตัดผู้ซื้อจากคำเดียวก่อนเห็น lead quality |

Owner อนุมัติ 10 รายการ `APPLY` และเพิ่มระดับ Campaign แบบ Phrase Match ครบแล้ว 2026-09-11; `template` คง `REVIEW` และคำที่เป็น `HOLD` ไม่ถูกนำไปใช้

## 4. RSA inventory — live copy

Owner อนุมัติ RSA inventory เมื่อ 2026-09-11 แล้ว ไม่มีข้อความ “ตัวอย่างฟรี”, deadline รับประกัน หรือราคาที่ไม่ได้รับรอง ใช้ได้สูงสุด 30 ตัวอักษรต่อ headline และ 90 ตัวอักษรต่อ description; สร้างครบ 6 ชิ้นใน 3 ad groups และอยู่ `Pending` ระหว่าง policy review

### AG_BrandFolding / Complete Service

Final URL: `https://www.ddboxprinting.com/products/folding-carton`
Display path: `กล่องแบรนด์ / ประเมินงาน`

- H: `รับผลิตกล่องพิมพ์แบรนด์`
- H: `รับทำกล่องพิมพ์โลโก้`
- H: `กล่องออฟเซ็ทสำหรับแบรนด์`
- H: `ส่งสเปกเพื่อประเมินราคา`
- H: `เริ่มจากขนาดและจำนวน`
- H: `วางข้อมูลแบรนด์บนกล่อง`
- H: `กล่องกระดาษพับสั่งผลิต`
- H: `แจ้งกำหนดใช้งานกับทีม`
- H: `เริ่มประเมินจากข้อมูลที่มี`
- H: `DD BOX PRINTING`
- D: `แจ้งขนาดสินค้า จำนวน งานพิมพ์ และกำหนดใช้ เพื่อให้ทีมประเมินแนวทางกล่อง`
- D: `เริ่มจากโลโก้ ข้อมูลสินค้า และขนาดจริง เพื่อประเมินโครงสร้างกระดาษพับ`
- D: `ส่งสเปกเพื่อประเมินราคาจริง ทีมตรวจรายละเอียดก่อนยืนยันแนวทางและเงื่อนไขงาน`
- D: `มีรูปสินค้า กล่องเดิม หรือข้อมูลเบื้องต้น ก็เริ่มส่งรายละเอียดให้ทีมตรวจได้`

### AG_BrandFolding / Risk Reduction

Final URL: `https://www.ddboxprinting.com/products/folding-carton`
Display path: `กล่องออฟเซ็ท / ส่งข้อมูล`

- H: `ยังไม่มีขนาดก็เริ่มคุยได้`
- H: `ไม่ต้องมีอาร์ตเวิร์กครบ`
- H: `ส่งภาพสินค้าหรือกล่องเดิม`
- H: `ทีมตรวจสเปกก่อนยืนยัน`
- H: `เริ่มจากข้อมูลเท่าที่มี`
- H: `ช่วยจัดลำดับข้อมูลที่ขาด`
- H: `ตรวจวัสดุและพื้นที่พิมพ์`
- H: `คุยรายละเอียดก่อนผลิต`
- H: `ส่งจำนวนโดยประมาณ`
- H: `DD Box Printing`
- D: `ยังไม่ทราบขนาดกล่อง ส่งขนาดสินค้า ภาพสินค้า และวิธีจัดวางให้ทีมเริ่มตรวจได้`
- D: `ไม่จำเป็นต้องมีอาร์ตเวิร์กพร้อมสำหรับการเริ่มประเมิน แจ้งสถานะไฟล์เท่าที่มี`
- D: `ทีมตรวจขนาด วัสดุ และข้อกำหนดงานพิมพ์ก่อนยืนยันแนวทางการผลิต`
- D: `ข้อมูลบนหน้าเว็บเป็นแนวทางเบื้องต้น ยังไม่ใช่การยืนยันสเปกหรือเงื่อนไขงาน`

### AG_Corrugated / Complete Service

Final URL: `https://www.ddboxprinting.com/products/corrugated-box`
Display path: `กล่องลูกฟูก / ประเมินงาน`

- H: `รับทำกล่องลูกฟูกตามงาน`
- H: `กล่องลูกฟูกพิมพ์แบรนด์`
- H: `กล่องไปรษณีย์สั่งผลิต`
- H: `เริ่มจากน้ำหนักสินค้า`
- H: `แจ้งรูปแบบการขนส่ง`
- H: `ประเมินขนาดและโครงสร้าง`
- H: `กล่องขนส่งสำหรับสินค้า`
- H: `ส่งจำนวนและพื้นที่จัดส่ง`
- H: `ตรวจการซ้อนก่อนยืนยัน`
- H: `DD BOX PRINTING`
- D: `แจ้งขนาด น้ำหนัก จำนวนต่อกล่อง และวิธีขนส่ง เพื่อให้ทีมประเมินโครงสร้าง`
- D: `เตรียมข้อมูลการซ้อน พื้นที่จัดเก็บ และปลายทางไว้ใน brief เดียวกัน`
- D: `ต้องการพื้นที่โลโก้บนกล่องลูกฟูก ส่งข้อมูลแบรนด์พร้อมเงื่อนไขการขนส่ง`
- D: `ทีมตรวจวัสดุ โครงสร้าง และการใช้งานจริงก่อนยืนยันข้อกำหนดงาน`

### AG_Corrugated / Risk Reduction

Final URL: `https://www.ddboxprinting.com/products/corrugated-box`
Display path: `กล่องขนส่ง / ส่งข้อมูล`

- H: `เริ่มจากขนาดสินค้าได้`
- H: `ส่งน้ำหนักให้ทีมประเมิน`
- H: `ยังไม่มีกล่องเดิมก็เริ่มได้`
- H: `ตรวจวิธีวางและการซ้อน`
- H: `แจ้งจุดที่สินค้าเคลื่อนตัว`
- H: `ประเมินชิ้นรองในกล่อง`
- H: `ตรวจข้อจำกัดก่อนผลิต`
- H: `ส่งข้อมูลเท่าที่ทราบ`
- H: `คุยโครงสร้างกับทีม`
- H: `DD Box Printing`
- D: `หากยังไม่มีกล่องเดิม เริ่มจากขนาด น้ำหนัก และจำนวนสินค้าต่อกล่องได้`
- D: `แจ้งจุดแตกหักหรือเคลื่อนตัว เพื่อให้ทีมพิจารณาการยึดและชิ้นรอง`
- D: `รูปแบบขนส่ง การซ้อน และพื้นที่จัดเก็บ เป็นข้อมูลประกอบการประเมินโครงสร้าง`
- D: `ผลประเมินต้องตรวจวัสดุ ขนาด น้ำหนัก และการใช้งานจริงก่อนยืนยัน`

### AG_DieCutInsert / Complete Service

Final URL: `https://www.ddboxprinting.com/products/custom-die-cut`
Display path: `กล่องไดคัท / ประเมินงาน`

- H: `รับทำกล่องไดคัทตามแบบ`
- H: `กล่องไดคัทพิมพ์แบรนด์`
- H: `ชิ้นรองสินค้าตามรูปทรง`
- H: `เริ่มจากตัวอย่างสินค้า`
- H: `แจ้งวิธีเปิดและจัดวาง`
- H: `ประเมินจุดยึดสินค้า`
- H: `โครงสร้างเฉพาะงาน`
- H: `ส่งขนาดและน้ำหนักสินค้า`
- H: `เตรียมข้อมูลก่อนทำแบบ`
- H: `DD BOX PRINTING`
- D: `แจ้งรูปทรง ขนาด น้ำหนัก และวิธีจัดวาง เพื่อให้ทีมเริ่มประเมินโครงสร้าง`
- D: `ต้องการชิ้นรองสินค้า ส่งตำแหน่งที่ต้องยึดและวิธีหยิบให้ทีมตรวจ`
- D: `อธิบายลำดับการเปิดและส่วนที่ต้องการให้ลูกค้าเห็น เพื่อจัด brief งานเดียวกัน`
- D: `ส่งจำนวน กำหนดใช้ และสถานะอาร์ตเวิร์ก เพื่อประเมินขั้นตอนถัดไป`

### AG_DieCutInsert / Risk Reduction

Final URL: `https://www.ddboxprinting.com/products/custom-die-cut`
Display path: `ชิ้นรองสินค้า / ส่งข้อมูล`

- H: `ยังไม่มีแบบคลี่ก็เริ่มได้`
- H: `ส่งภาพหรือสินค้าตัวอย่าง`
- H: `ตรวจความพอดีก่อนสรุป`
- H: `เริ่มจากวิธีเปิดกล่อง`
- H: `แจ้งจุดรับแรงของสินค้า`
- H: `ทีมตรวจพื้นที่งานพิมพ์`
- H: `วางข้อมูลก่อนทำตัวอย่าง`
- H: `ตรวจข้อจำกัดของโครงสร้าง`
- H: `ส่งข้อมูลเท่าที่มี`
- H: `DD Box Printing`
- D: `เริ่มจากภาพสินค้า วิธีเปิดปิด และขนาดเท่าที่มี เพื่อจัดลำดับข้อมูลที่ขาด`
- D: `ระบุสิ่งที่ต้องตรวจ เช่น ความพอดี การหยิบสินค้า และพื้นที่งานพิมพ์`
- D: `ข้อมูลเบื้องต้นยังไม่ยืนยันแบบ วัสดุ หรือการผลิตจนกว่าทีมจะตรวจสเปก`
- D: `ส่งสถานะอาร์ตเวิร์ก จำนวน และกำหนดใช้ เพื่อให้ทีมวางขั้นตอนประเมินงาน`

## 5. Assets — Campaign

| Type | Text | Final URL / detail | Status |
|---|---|---|---|
| Sitelink | ประเภทกล่อง | `https://www.ddboxprinting.com/products` | Campaign-level; `Pending / Under review` |
| Sitelink | ผลงานและแนวทางราคา | `https://www.ddboxprinting.com/gallery` | Campaign-level; `Pending / Under review`; live page มีผลงานและแนวทางราคาพร้อม caveat |
| Sitelink | รู้จัก DD BOX | `https://www.ddboxprinting.com/company` | Campaign-level; `Pending / Under review` |
| Sitelink | ติดต่อทีม | `https://www.ddboxprinting.com/contact` | Campaign-level; `Pending / Under review` |
| Callout | ส่งข้อมูลเท่าที่มี | — | Campaign-level; `Pending / Under review` |
| Callout | ตรวจสเปกก่อนยืนยัน | — | Campaign-level; `Pending / Under review` |
| Callout | รองรับงานตามแบบ | — | Campaign-level; `Pending / Under review` |
| Callout | คุยรายละเอียดกับทีม | — | Campaign-level; `Pending / Under review` |
| Structured snippet | ประเภท: กล่องกระดาษพับ, กล่องลูกฟูก, กล่องไดคัท, ชิ้นรองสินค้า | — | Campaign-level; `Pending / Under review` |
| Call asset | หมายเลขสาธารณะที่ Owner อนุมัติ | Monday–Friday 07:30–19:30; Saturday 07:30–19:30; call reporting ON; recording OFF | Campaign-level; `Pending / Under review`; คง `generate_lead` เป็น Campaign Primary และไม่เพิ่ม phone call lead ใน bidding goal |

## 6. Launch execution and active monitoring

- [x] Owner อนุมัติ RSA, Sitelink, Callout, Structured snippet, Call asset และ negative list 10 รายการเมื่อ 2026-09-11; เพิ่ม campaign negative Phrase Match ครบ 10 รายการแล้ว
- [x] Keyword Planner: period, locations, volume/CPC และ initial decision บันทึกแล้ว
- [x] ตรวจ account/currency/timezone และ conversion-action properties แบบ read-only
- [x] ตรวจ account Active, primary payment method และ policy/verification tasks; ไม่พบ suspension/restriction, Owner ยืนยัน EU political ads = No และบันทึก declaration แล้ว; ไม่มี backup payment method และ policy review ยังเป็นความเสี่ยงคงเหลือ
- [x] ตั้ง campaign-specific goal ให้ใช้ `generate_lead` (`Submit lead forms`) เท่านั้น; secondary ไม่เข้า bidding goal
- [ ] ตรวจ Auto-tagging ON, campaign suffix และ Ad-level overrides แล้ว; live sample URL ผ่าน แต่ยังต้องยืนยัน paid-click ValueTrack/GCLID จาก traffic จริงโดยไม่คลิกโฆษณาตัวเอง
- [x] ทำ mobile QA ของ landing ทั้ง 3 หน้าและ quote form ที่ viewport 390px; ไม่มี horizontal overflow และ CTA/form แสดงได้
- [ ] ทดสอบ live sample URL แล้วว่า UTM/GCLID ไม่หาย; real ValueTrack resolution ของ campaign/ad group/ad IDs รอ paid click/Lead จริง
- [x] ระบุวันเริ่ม/สิ้นสุด, campaign/call schedules, เวลารับ Lead, Primary และ Backup owner แล้ว
- [x] ระบุ Owner/ผู้ใช้เป็นผู้อนุมัติงบ; alert ที่ 10,000 THB และ pause ที่ 10,750 THB โดยใช้ campaign Cost เป็นเกณฑ์และห้ามเปิดต่อโดยไม่มี approval ใหม่
- [x] Owner ยืนยัน Media only, EU political ads = No และ Launch today; Published/Enabled แล้ว 2026-09-11, Campaign ID `24234245697`, Cost 0 บาท ณ เวลาตรวจ

### งานที่เหลือหลัง Controlled launch

1. รอ Google policy review ของ RSA 6 ชิ้นและ Campaign assets 10 associations; แก้เฉพาะรายการที่ระบบระบุเหตุผลชัดเจน
2. ตรวจ delivery/Cost และ search terms ตาม cadence Day 1–7; Campaign อยู่ `Eligible (Learning)` และบาง keyword เป็น Low search volume จึงยังไม่ขยาย Broad/AI Max โดยไม่มี evidence
3. ยืนยัน ValueTrack/GCLID/redirect จาก paid click และ Lead จริงรายแรก โดยไม่ค้นหาแล้วคลิกโฆษณาของตนเองและไม่สร้าง conversion ปลอม
4. ให้คุณเปิ้ลทดลอง workflow รับ Lead → Excel → Contactable/Qualified/Quotation/Won = PO และตรวจ notification/backup handoff
5. ตรวจ cumulative Campaign Cost อย่างน้อยวันละครั้ง: แจ้ง Owner ที่ 10,000 บาท และ pause ที่ 10,750 บาท; ห้ามเพิ่มงบหรือ re-enable หลัง guard โดยไม่มี Owner approval ใหม่

## 7. Sources inside the repository

- `docs/Analysis-CRM-plan.md` sections 3–5
- `src/content/products.ts` สำหรับข้อความที่อ้างอิงหน้า Product
- `src/content/company.ts` สำหรับข้อมูลติดต่อบริษัท
- Live route checks (HTTP 200 และ sample query preservation) เมื่อ 2026-09-11: `/products/folding-carton`, `/products/corrugated-box`, `/products/custom-die-cut`, `/quote`

Current Google Ads references checked on 2026-09-10:

- [Responsive Search Ad text limits and pinning](https://support.google.com/google-ads/answer/12159014?hl=en)
- [Responsive Search Ads support up to 15 headlines and 4 descriptions](https://support.google.com/google-ads/answer/7331111?hl=en)
- [Final URL suffix behavior and configuration levels](https://support.google.com/google-ads/answer/9054021?hl=en)
- [ValueTrack parameters](https://support.google.com/google-ads/answer/6305348?hl=en)
- [Average daily and monthly spending limits](https://support.google.com/google-ads/answer/2375454?hl=en)
