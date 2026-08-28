import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { company } from "@/content/company";

export const metadata: Metadata = {
  title: "เกี่ยวกับ DD Box Printing",
  description:
    "แนวทางทำงานและภาพพื้นที่ผลิตที่เจ้าของโครงการจัดเตรียมสำหรับ DD Box Printing",
  alternates: { canonical: "/company" },
};

export default function CompanyPage() {
  return (
    <>
      <section className="company-hero">
        <Image
          src="/images/generated/hero-print-production-v2.webp"
          fill
          priority
          sizes="100vw"
          alt="ภาพจำลองพื้นที่ผลิตสิ่งพิมพ์และเครื่องพิมพ์ออฟเซ็ต"
        />
        <div className="company-hero-shade" aria-hidden="true" />
        <div className="shell company-hero-copy">
          <p className="eyebrow hero-kicker">ABOUT DD BOX PRINTING</p>
          <h1>
            เริ่มจากข้อกำหนด
            <br />
            ก่อนเลือกโครงสร้างกล่อง
          </h1>
          <p>
            {company.legalName} ให้บริการงานสิ่งพิมพ์และกล่องสำหรับอุตสาหกรรม
            โดยใช้ข้อมูลสินค้า การใช้งาน งานพิมพ์ และการส่งมอบเป็นแกนในการจัด
            brief
          </p>
          <Link className="button button-yellow" href="/quote">
            เริ่มส่งรายละเอียดงาน
          </Link>
        </div>
      </section>
      <section className="section">
        <div className="shell company-story">
          <div className="story-media">
            <Image
              src="/images/generated/cosmetic-folding-carton-v2.webp"
              fill
              sizes="(max-width: 900px) 100vw, 45vw"
              alt="ภาพจำลองกล่องกระดาษพับหลายขนาดโดยไม่มีตราสินค้า"
            />
          </div>
          <div>
            <p className="eyebrow">HOW WE START</p>
            <h2>ข้อมูลจริงนำการตัดสินใจ</h2>
            <p>
              เว็บไซต์นี้ไม่คำนวณราคาอัตโนมัติและไม่รับรองกำหนดส่งจากข้อมูลเบื้องต้น
              ทีมต้องตรวจสอบประเภทสินค้า ขนาด จำนวน วัสดุ อาร์ตเวิร์ก
              และข้อจำกัดการจัดส่งก่อน
            </p>
            <p>
              หากข้อมูลยังไม่ครบ สามารถเริ่มจากเป้าหมายของสินค้า
              แล้วจัดลำดับสิ่งที่ต้องเตรียมต่อได้
            </p>
          </div>
        </div>
      </section>
      <section className="factory-section">
        <div className="shell">
          <div className="section-heading">
            <p className="eyebrow light">FACTORY REFERENCE</p>
            <h2>ภาพจริงจากเว็บไซต์เดิมของบริษัท</h2>
          </div>
          <div className="factory-grid">
            <figure>
              <Image
                src="/images/factory-press.jpg"
                fill
                sizes="50vw"
                alt="เครื่องพิมพ์ในพื้นที่ผลิต"
              />
              <figcaption>Printing equipment</figcaption>
            </figure>
            <figure>
              <Image
                src="/images/factory-cutter.jpg"
                fill
                sizes="50vw"
                alt="เครื่องตัดกระดาษและกองกระดาษในพื้นที่ผลิต"
              />
              <figcaption>Paper cutting equipment</figcaption>
            </figure>
          </div>
        </div>
      </section>
    </>
  );
}
