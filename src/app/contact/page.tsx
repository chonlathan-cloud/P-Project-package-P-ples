import type { Metadata } from "next";
import Link from "next/link";
import { company } from "@/content/company";

export const metadata: Metadata = {
  title: "ติดต่อ",
  description: "เลือกวิธีเริ่มติดต่อ DD Box Printing ตามข้อมูลที่พร้อม",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <section className="page-section contact-page">
      <div className="shell page-heading contact-heading">
        <p className="eyebrow">CONTACT</p>
        <h1>
          คุยเรื่องกล่อง
          <br />
          จากข้อมูลที่คุณมี
        </h1>
        <p>
          ส่ง brief ผ่านเว็บไซต์ หรือคุยกับคุณเปิ้ลโดยตรงผ่านโทรศัพท์ อีเมล และ
          LINE ตามข้อมูลติดต่อของบริษัท
        </p>
      </div>
      <div className="shell contact-layout">
        <div className="contact-primary">
          <p className="eyebrow">PROJECT BRIEF</p>
          <h2>ส่งข้อมูลเพื่อให้ทีมประเมิน</h2>
          <p>
            เลือกเส้นทางตามความพร้อมของสเปก ระบบจะแสดงเฉพาะข้อมูลที่เกี่ยวข้อง
            และป้องกันการสร้างรายการซ้ำเมื่อกดส่งซ้ำ
          </p>
          <div className="contact-actions">
            <Link
              className="button button-yellow"
              href="/quote?path=has_specifications"
            >
              ฉันมีสเปกงานแล้ว
            </Link>
            <Link
              className="button-secondary"
              href="/quote?path=needs_guidance"
            >
              ฉันต้องการคำแนะนำ
            </Link>
          </div>
        </div>
        <aside
          className="contact-status"
          aria-labelledby="contact-status-heading"
        >
          <h2 id="contact-status-heading">ช่องทางติดต่อโดยตรง</h2>
          <div>
            <span>01</span>
            <strong>{company.contactName}</strong>
            <p>ผู้ติดต่อสำหรับงานกล่องและสิ่งพิมพ์</p>
          </div>
          <div id="line">
            <span>02</span>
            <strong>LINE</strong>
            <p>
              <a className="text-link" href={company.lineHref}>
                {company.lineId}
              </a>
            </p>
          </div>
          <div id="phone">
            <span>03</span>
            <strong>โทรศัพท์</strong>
            <p>
              <a className="text-link" href={`tel:${company.phoneHref}`}>
                {company.phoneDisplay}
              </a>
            </p>
          </div>
          <div>
            <span>04</span>
            <strong>อีเมล</strong>
            <p>
              <a className="text-link" href={`mailto:${company.email}`}>
                {company.email}
              </a>
            </p>
          </div>
          <div>
            <span>05</span>
            <strong>ที่ตั้งบริษัท</strong>
            <p>{company.address}</p>
            <a className="text-link" href={company.mapHref}>
              เปิดใน Google Maps →
            </a>
          </div>
          <small className="contact-source">
            ตรวจสอบจากเว็บไซต์เดิมเมื่อ {company.sourceCheckedAt}
          </small>
        </aside>
      </div>
    </section>
  );
}
