import type { Metadata } from "next";
import { QuoteForm } from "@/features/leads/quote-form";

export const metadata: Metadata = {
  title: "ส่งรายละเอียดงาน",
  description: "เลือกเส้นทางและส่งข้อมูลกล่องบรรจุภัณฑ์เพื่อให้ทีมประเมิน",
  alternates: { canonical: "/quote" },
};

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  const path =
    (await searchParams).path === "has_specifications"
      ? "has_specifications"
      : "needs_guidance";
  return (
    <section className="quote-page">
      <div className="shell quote-layout">
        <div className="quote-context">
          <p className="eyebrow">PROJECT BRIEF</p>
          <h1>
            ส่งข้อมูลเท่าที่มี
            <br />
            เพื่อเริ่มประเมินงาน
          </h1>
          <p>
            แบบฟอร์มจะแสดงเฉพาะข้อมูลที่เกี่ยวกับจุดเริ่มของคุณ
            และจะยังไม่คำนวณราคาอัตโนมัติ
          </p>
          <ul>
            <li>ไม่มีการสร้างบัญชีลูกค้า</li>
            <li>ข้อมูลใช้สำหรับตรวจสอบงานและติดต่อกลับ</li>
            <li>กดส่งซ้ำจะไม่สร้างรายการซ้ำ</li>
          </ul>
        </div>
        <QuoteForm initialPath={path} />
      </div>
    </section>
  );
}
