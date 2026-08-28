import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "โซลูชันตามระยะธุรกิจ",
  description: "เลือกแนวทางเตรียม brief บรรจุภัณฑ์ตามระยะและข้อกำหนดของธุรกิจ",
  alternates: { canonical: "/solutions" },
};

const solutions = [
  [
    "01",
    "เริ่มสินค้าใหม่",
    "จัดลำดับข้อมูลสินค้าและเปลี่ยนแนวคิดให้เป็น brief ที่ประเมินได้",
    "/solutions/starter",
  ],
  [
    "02",
    "แบรนด์กำลังเติบโต",
    "จัดระบบสเปก วัสดุ และอาร์ตเวิร์กให้พร้อมสำหรับการสั่งซ้ำ",
    "/solutions/growth",
  ],
  [
    "03",
    "งานผลิตต่อเนื่อง",
    "เตรียมข้อกำหนด ปริมาณ รอบความต้องการ และปลายทางร่วมกัน",
    "/solutions/scale",
  ],
] as const;

export default function SolutionsPage() {
  return (
    <>
      <section className="overview-hero">
        <div className="shell overview-grid">
          <div>
            <p className="eyebrow">PACKAGING SOLUTIONS</p>
            <h1>
              เริ่มประเมินงาน
              <br />
              ให้ตรงกับระยะธุรกิจ
            </h1>
            <p className="lead">
              ข้อมูลที่ต้องเตรียมต่างกันตามเป้าหมายของสินค้าและรูปแบบการสั่งผลิต
              เลือกจุดเริ่มที่ใกล้กับงานของคุณที่สุด
            </p>
          </div>
          <div className="overview-media">
            <Image
              src="/images/generated/premium-die-cut-v2.webp"
              fill
              sizes="(max-width: 900px) 100vw, 48vw"
              alt="ภาพจำลองกล่องไดคัทที่เปิดให้เห็นชิ้นรองเฉพาะสินค้า"
            />
          </div>
        </div>
      </section>
      <section className="section">
        <div className="shell solution-card-grid">
          {solutions.map(([number, title, text, href]) => (
            <Link href={href} key={href}>
              <span>{number}</span>
              <h2>{title}</h2>
              <p>{text}</p>
              <strong>ดูข้อมูลที่ควรเตรียม →</strong>
            </Link>
          ))}
        </div>
      </section>
      <section className="technical-strip">
        <div className="shell technical-grid">
          <div>
            <p className="eyebrow">TECHNICAL BRIEF</p>
            <h2>ทุกเส้นทางกลับมาที่ข้อมูลหลักชุดเดียวกัน</h2>
          </div>
          <ul>
            <li>ขนาดและน้ำหนักสินค้า</li>
            <li>จำนวนโดยประมาณและรอบความต้องการ</li>
            <li>วัสดุ งานพิมพ์ และข้อจำกัดโครงสร้าง</li>
            <li>กำหนดใช้และพื้นที่จัดส่ง</li>
          </ul>
        </div>
      </section>
    </>
  );
}
