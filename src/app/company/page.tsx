import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { company } from "@/content/company";

export const metadata: Metadata = {
  title: "เกี่ยวกับ DD Box Printing",
  description:
    "รู้จัก DD Box Printing ผู้ผลิตบรรจุภัณฑ์ที่บางพลี แนวทางทำงาน ความสามารถในการผลิต และวิธีเริ่มประเมินงานกล่อง",
  alternates: { canonical: "/company" },
};

const processSteps = [
  {
    title: "รับฟังความต้องการ",
    text: "เริ่มจากสินค้า จำนวน วิธีใช้งาน งบประมาณ และกำหนดใช้เท่าที่ลูกค้ามี",
  },
  {
    title: "แนะนำโครงสร้างและวัสดุ",
    text: "พิจารณาประเภทกล่อง ความแข็งแรง วัสดุ และรูปแบบงานพิมพ์ร่วมกัน",
  },
  {
    title: "ออกแบบและเตรียมไฟล์",
    text: "ตรวจข้อมูลจากอาร์ตเวิร์ก โลโก้ ภาพอ้างอิง หรือแบบเดิมก่อนเข้าสู่ขั้นตอนถัดไป",
  },
  {
    title: "ทำ Mockup หรือตัวอย่าง",
    text: "ใช้ตรวจสอบขนาด โครงสร้าง และภาพรวมตามความเหมาะสมของแต่ละประเภทงาน",
  },
  {
    title: "ผลิตและตรวจสอบงาน",
    text: "ดำเนินการตามแบบและรายละเอียดที่อนุมัติ พร้อมตรวจความเรียบร้อยก่อนส่งมอบ",
  },
  {
    title: "จัดส่งและตรวจสอบปัญหา",
    text: "จัดส่งตามเงื่อนไขที่ตกลง และรับข้อมูลพร้อมหลักฐานหากต้องตรวจสอบปัญหาหลังส่งมอบ",
  },
] as const;

const customerSegments = [
  {
    title: "เจ้าของแบรนด์และธุรกิจที่กำลังเริ่มต้น",
    text: "มีสินค้าแล้วแต่ยังไม่แน่ใจเรื่องขนาด โครงสร้าง วัสดุ หรือการเตรียมแบบกล่อง",
  },
  {
    title: "แบรนด์ที่กำลังจัดระบบการสั่งซ้ำ",
    text: "มีกล่องเดิม อาร์ตเวิร์ก หรือหลาย SKU และต้องการให้ข้อมูลสำหรับรอบถัดไปตรวจสอบได้ง่ายขึ้น",
  },
  {
    title: "ทีมจัดซื้อและงานผลิตต่อเนื่อง",
    text: "มีข้อกำหนด ปริมาณ รอบความต้องการ หรือหลายปลายทางที่ต้องพิจารณาร่วมกัน",
  },
] as const;

const qualityChecks = [
  "จำนวน ขนาด และรายละเอียดตามข้อมูลที่อนุมัติ",
  "โครงสร้าง การไดคัท และการขึ้นรูป",
  "งานพิมพ์และตำแหน่งข้อมูลสำคัญ",
  "การประกอบและความเรียบร้อยจากกระบวนการผลิต",
] as const;

export default function CompanyPage() {
  return (
    <>
      <section className="company-hero">
        <Image
          src="/images/generated/company-team-placeholder-v1.webp"
          fill
          priority
          sizes="100vw"
          alt="ภาพจำลองทีมงานบรรจุภัณฑ์กำลังตรวจแบบคลี่ วัสดุ และตัวอย่างกล่องร่วมกัน"
        />
        <div className="company-hero-shade" aria-hidden="true" />
        <div className="shell company-hero-copy">
          <p className="eyebrow hero-kicker">ABOUT DD BOX PRINTING</p>
          <h1>
            จากไอเดียสินค้า
            <br />
            สู่กล่องพร้อมใช้งาน
          </h1>
          <p>
            {company.legalName} เป็นผู้ผลิตบรรจุภัณฑ์สำหรับเจ้าของแบรนด์ ธุรกิจ
            และงาน B2B ช่วยจัดข้อมูลตั้งแต่โครงสร้าง วัสดุ แบบและตัวอย่าง
            ไปจนถึงการผลิตและส่งมอบตามเงื่อนไขของแต่ละงาน
          </p>
          <div className="company-hero-actions">
            <Link
              className="button button-yellow"
              href="/quote?path=needs_guidance"
            >
              ส่งข้อมูลสินค้าให้ทีมช่วยจัด brief
            </Link>
            <Link
              className="button button-outline-light"
              href="/quote?path=has_specifications"
            >
              มีสเปกแล้ว ส่งเพื่อประเมินงาน
            </Link>
          </div>
        </div>
        <p className="company-placeholder-note">
          ภาพจำลองสำหรับ development — ต้องเปลี่ยนเป็นภาพทีมงานจริงก่อน
          production
        </p>
      </section>

      <section className="company-facts" aria-label="ข้อมูลบริษัทที่ยืนยันแล้ว">
        <div className="shell company-facts-grid">
          <div>
            <strong>พ.ศ. 2549</strong>
            <span>ก่อตั้งเมื่อ {company.profile.foundedDisplay}</span>
          </div>
          <div>
            <strong>{company.profile.teamSize} คน</strong>
            <span>ทีมงานที่เกี่ยวข้องในปัจจุบัน</span>
          </div>
          <div>
            <strong>{company.profile.machineCount} เครื่อง</strong>
            <span>เครื่องจักรหลายขนาดในพื้นที่ผลิต</span>
          </div>
          <div>
            <strong>{company.profile.capacity.display}</strong>
            <span>กำลังผลิตโดยประมาณ</span>
          </div>
        </div>
        <p className="shell company-capacity-note">
          {company.profile.capacity.qualification}
        </p>
      </section>

      <section className="section company-origin-section">
        <div className="shell company-origin-grid">
          <div>
            <p className="eyebrow">WHY DD BOX STARTED</p>
            <h2>ตั้งใจเติบโตไปกับธุรกิจของลูกค้า</h2>
          </div>
          <div className="company-origin-copy">
            <p className="company-origin-lead">{company.profile.purpose}</p>
            <p>
              เราเชื่อว่ากล่องที่เหมาะสมไม่ได้เริ่มจากการเลือกตัวเลือกที่ราคาต่ำที่สุด
              แต่เริ่มจากการเข้าใจสินค้า วิธีใช้งาน จำนวน งบประมาณ
              และเป้าหมายของธุรกิจให้เป็น brief ที่ตรวจสอบได้
            </p>
            <p>
              ปัจจุบันลูกค้าหลักคือ{company.profile.customerFocus}{" "}
              ขณะเดียวกันลูกค้าที่กำลังเริ่มต้นสามารถส่งข้อมูลเท่าที่มี
              เพื่อให้ทีมช่วยระบุสิ่งที่ต้องเตรียมต่อได้
            </p>
          </div>
        </div>
      </section>

      <section className="company-process-section">
        <div className="shell company-process-grid">
          <figure className="company-process-media">
            <Image
              src="/images/generated/solutions-workflow-v1.webp"
              fill
              sizes="(max-width: 900px) 100vw, 45vw"
              alt="ภาพจำลองโต๊ะเตรียมแบบคลี่ ตัวอย่างวัสดุ และกล่องหลายระยะของการพัฒนางาน"
            />
            <figcaption>
              ภาพจำลองเพื่ออธิบายกระบวนการ ไม่ใช่ผลงานลูกค้า
            </figcaption>
          </figure>
          <div>
            <div className="section-heading">
              <p className="eyebrow">FROM IDEA TO DELIVERY</p>
              <h2>ข้อมูลหนึ่งชุด เดินงานต่อได้เป็นลำดับ</h2>
            </div>
            <ol className="company-process-list">
              {processSteps.map((step, index) => (
                <li key={step.title}>
                  <span>0{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="factory-section">
        <div className="shell factory-heading-grid">
          <div>
            <p className="eyebrow light">PRODUCTION REFERENCE</p>
            <h2>พื้นที่ผลิตและเครื่องจักรของบริษัท</h2>
          </div>
          <p>
            เครื่องจักรขนาดใหญ่ {company.profile.machineBreakdown.large} เครื่อง
            ขนาดกลาง {company.profile.machineBreakdown.medium} เครื่อง
            และขนาดเล็ก {company.profile.machineBreakdown.small} เครื่อง
            ใช้ประกอบการวางแผนตามประเภทและปริมาณของแต่ละงาน
          </p>
        </div>
        <div className="shell factory-grid">
          <figure className="factory-featured">
            <Image
              src="/images/factory-press.jpg"
              fill
              sizes="(max-width: 640px) 100vw, 58vw"
              alt="เครื่องพิมพ์ในพื้นที่ผลิตของ DD Box Printing"
            />
            <figcaption>เครื่องพิมพ์ในพื้นที่ผลิต</figcaption>
          </figure>
          <figure>
            <Image
              src="/images/factory-cutter.jpg"
              fill
              sizes="(max-width: 640px) 100vw, 32vw"
              alt="เครื่องตัดกระดาษและกองกระดาษในพื้นที่ผลิตของ DD Box Printing"
            />
            <figcaption>เครื่องตัดและเตรียมกระดาษ</figcaption>
          </figure>
          <figure>
            <Image
              src="/images/factory-detail.jpg"
              fill
              sizes="(max-width: 640px) 100vw, 32vw"
              alt="รายละเอียดเครื่องตัดกระดาษในพื้นที่ผลิตของ DD Box Printing"
            />
            <figcaption>รายละเอียดเครื่องจักรในพื้นที่ผลิต</figcaption>
          </figure>
        </div>
      </section>

      <section className="section company-quality-section">
        <div className="shell company-quality-grid">
          <div>
            <p className="eyebrow">QUALITY &amp; RESPONSIBILITY</p>
            <h2>ตรวจงานจากรายละเอียดที่อนุมัติ</h2>
            <ul className="company-quality-list">
              {qualityChecks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <aside aria-labelledby="company-resolution-heading">
            <p className="eyebrow">เมื่อพบปัญหา</p>
            <h3 id="company-resolution-heading">มีทีมรับข้อมูลเพื่อตรวจสอบ</h3>
            <p>
              หากงานไม่ตรงกับรายละเอียดที่อนุมัติหรือพบข้อบกพร่องที่อาจเกิดจากกระบวนการผลิต
              ลูกค้าสามารถแจ้งทีมพร้อมภาพ หลักฐาน และข้อมูลการส่งมอบ
              เพื่อให้ตรวจสอบสาเหตุและเสนอแนวทางตามเงื่อนไขของงาน
            </p>
            <p>
              ข้อความนี้ไม่ใช่การรับประกันทุกกรณี
              ผลการตรวจสอบขึ้นอยู่กับแบบที่อนุมัติ ขอบเขตงาน
              และหลักฐานที่เกี่ยวข้อง
            </p>
          </aside>
        </div>
      </section>

      <section className="company-fit-section">
        <div className="shell company-fit-grid">
          <div>
            <p className="eyebrow">WHO WE WORK WITH</p>
            <h2>งานแบบไหนที่เริ่มคุยกับเราได้</h2>
            <p>
              จำนวนสั่งขั้นต่ำและเงื่อนไขการผลิตต้องประเมินตามประเภทกล่อง ขนาด
              โครงสร้าง วัสดุ และลายพิมพ์ของแต่ละงาน
            </p>
          </div>
          <ol className="company-fit-list">
            {customerSegments.map((segment, index) => (
              <li key={segment.title}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{segment.title}</h3>
                  <p>{segment.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="company-location-section">
        <div className="shell company-location-grid">
          <div>
            <p className="eyebrow">BANG PHLI · SAMUT PRAKAN</p>
            <h2>โรงงานและทีมงานอยู่ที่บางโฉลง</h2>
          </div>
          <address>
            <strong>{company.displayName}</strong>
            <p>{company.address}</p>
            <a className="text-link" href={company.mapHref}>
              เปิดที่อยู่ใน Google Maps →
            </a>
          </address>
        </div>
      </section>

      <section className="company-closing-section">
        <div className="shell company-closing-heading">
          <p className="eyebrow">START WITH YOUR INFORMATION</p>
          <h2>เริ่มจากข้อมูลที่คุณมี</h2>
        </div>
        <div className="shell company-closing-grid">
          <div>
            <span>01</span>
            <h3>มีขนาด แบบ หรือกล่องเดิมแล้ว</h3>
            <p>ส่งรายละเอียดให้ทีมตรวจสอบวิธีผลิตและข้อมูลที่ต้องยืนยันต่อ</p>
            <Link
              className="button button-yellow"
              href="/quote?path=has_specifications"
            >
              ส่งสเปกเพื่อประเมินงาน
            </Link>
          </div>
          <div>
            <span>02</span>
            <h3>มีสินค้าแต่ยังไม่มีสเปก</h3>
            <p>ส่งรูป ขนาด น้ำหนัก และเป้าหมายเท่าที่มีให้ทีมช่วยจัด brief</p>
            <Link
              className="button button-outline-light"
              href="/quote?path=needs_guidance"
            >
              ส่งข้อมูลสินค้าให้ทีมแนะนำ
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
