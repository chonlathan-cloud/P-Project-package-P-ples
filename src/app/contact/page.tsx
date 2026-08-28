import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ติดต่อ",
  description: "เลือกวิธีเริ่มติดต่อ DD Box Printing ตามข้อมูลที่พร้อม",
  alternates: { canonical: "/contact" },
};
export default function ContactPage() {
  return (
    <section className="page-section">
      <div className="shell page-heading">
        <p className="eyebrow">CONTACT</p>
        <h1>
          เริ่มติดต่อจากงาน
          <br />
          ไม่ต้องเริ่มจากแบบฟอร์มยาว
        </h1>
        <p>
          รายละเอียดโทรศัพท์, LINE OA, อีเมล, ที่อยู่
          และเวลาทำการจะเปิดใช้งานเมื่อเจ้าของธุรกิจยืนยันข้อมูล canonical แล้ว
        </p>
      </div>
      <div className="shell contact-list">
        <div id="line">
          <span>01</span>
          <h2>ส่งรายละเอียดงาน</h2>
          <p>
            ช่องทางที่พร้อมใช้งานใน vertical slice และเก็บข้อมูลแบบ idempotent
          </p>
          <Link className="text-link" href="/quote">
            เปิดแบบฟอร์ม →
          </Link>
        </div>
        <div id="phone">
          <span>02</span>
          <h2>LINE และโทรศัพท์</h2>
          <p>
            รอข้อมูล LINE OA และหมายเลขธุรกิจที่ได้รับอนุมัติ
            หลีกเลี่ยงการเผยแพร่ข้อมูลเดาจากเว็บไซต์เดิม
          </p>
        </div>
        <div>
          <span>03</span>
          <h2>โรงงานและเวลาทำการ</h2>
          <p>รอการยืนยัน NAP, แผนที่ และเวลาทำการก่อนเพิ่ม structured data</p>
        </div>
      </div>
    </section>
  );
}
