import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { solutions } from "@/content/solutions";

export const metadata: Metadata = {
  title: "เลือกวิธีเริ่มงานกล่อง",
  description:
    "เลือกวิธีเตรียมข้อมูลบรรจุภัณฑ์จากสถานการณ์ของงาน ตั้งแต่ยังไม่มีสเปกจนถึงงานที่มีข้อกำหนดต่อเนื่อง",
  alternates: { canonical: "/solutions" },
};

const commonInputs = [
  "ภาพหรือขนาดสินค้า",
  "จำนวนโดยประมาณ",
  "วิธีบรรจุและใช้งาน",
  "กำหนดใช้และข้อมูลจัดส่งเท่าที่มี",
] as const;

export default function SolutionsPage() {
  return (
    <>
      <section className="solution-overview-hero">
        <div className="shell solution-overview-grid">
          <div className="solution-overview-copy">
            <p className="eyebrow">เลือกวิธีเริ่มงาน</p>
            <h1>
              งานกล่องของคุณ
              <br />
              อยู่ในสถานการณ์ไหน
            </h1>
            <p className="lead">
              หน้า Products ช่วยเลือกประเภทกล่อง
              ส่วนหน้านี้ช่วยเลือกวิธีเตรียมข้อมูล
              เลือกจากสิ่งที่คุณมีอยู่ตอนนี้ ไม่จำเป็นต้องรอให้สเปกครบ
            </p>
            <Link className="text-link" href="/products">
              หากกำลังเลือกประเภทกล่อง ดูหน้า Products →
            </Link>
          </div>
          <figure className="solution-overview-media">
            <Image
              src="/images/generated/solutions-workflow-v1.webp"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
              alt="ภาพจำลองโต๊ะทำงานที่มีภาพร่าง แบบคลี่ ตัวอย่างวัสดุ และกล่องหลายระยะของการเตรียมงาน"
            />
            <figcaption>
              ภาพจำลองเพื่ออธิบายขั้นตอนเตรียมข้อมูล ไม่ใช่ผลงานลูกค้า
            </figcaption>
          </figure>
        </div>
      </section>

      <section
        className="section solution-paths-section"
        aria-labelledby="solution-paths-title"
      >
        <div className="shell solution-paths-heading">
          <p className="eyebrow">CHOOSE FROM WHAT YOU HAVE</p>
          <h2 id="solution-paths-title">เลือกจากข้อมูลที่มีอยู่ตอนนี้</h2>
          <p>
            ทั้งสามเส้นทางใช้เพื่อจัด brief ให้เหมาะกับความพร้อมของงาน
            ไม่ใช่แพ็กเกจราคาหรือการรับรองเงื่อนไขการผลิต
          </p>
        </div>
        <div className="shell solution-path-list">
          {solutions.map((solution) => (
            <article className="solution-path-row" key={solution.slug}>
              <span className="solution-path-number">{solution.number}</span>
              <div className="solution-path-intro">
                <p>{solution.status}</p>
                <h3>{solution.title}</h3>
                <p>{solution.summary}</p>
              </div>
              <div className="solution-path-column">
                <h4>เหมาะเมื่อ</h4>
                <ul>
                  {solution.fit.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="solution-path-column">
                <h4>เริ่มส่งข้อมูล</h4>
                <ul>
                  {solution.inputs.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <Link
                className="solution-path-link"
                href={`/solutions/${solution.slug}`}
              >
                ดูวิธีเริ่มเส้นทางนี้ →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="solution-common-section">
        <div className="shell solution-common-grid">
          <div>
            <p className="eyebrow">ส่งเท่าที่มี</p>
            <h2>ข้อมูลพื้นฐานที่ใช้ได้ทุกเส้นทาง</h2>
            <p>
              ไม่จำเป็นต้องมีครบทุกข้อ
              ทีมจะตรวจสอบข้อมูลที่ส่งมาและระบุสิ่งที่ต้องถามเพิ่มก่อนประเมินงาน
            </p>
            <Link
              className="button button-yellow"
              href="/quote?path=needs_guidance"
            >
              ยังไม่แน่ใจ ให้ทีมช่วยจัด brief
            </Link>
          </div>
          <ol className="solution-common-list">
            {commonInputs.map((item, index) => (
              <li key={item}>
                <span>0{index + 1}</span>
                <strong>{item}</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
