import type { Metadata } from "next";
import Image from "next/image";
import { QuoteForm } from "@/features/leads/quote-form";

export const metadata: Metadata = {
  title: "ส่งรายละเอียดงาน",
  description: "เลือกเส้นทางและส่งข้อมูลกล่องบรรจุภัณฑ์เพื่อให้ทีมประเมิน",
  alternates: { canonical: "/quote" },
};

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{
    path?: string;
    product_type?: string;
    reference?: string;
  }>;
}) {
  const params = await searchParams;
  const path =
    params.path === "has_specifications"
      ? "has_specifications"
      : "needs_guidance";
  return (
    <section className="quote-page">
      <div className="shell">
        <div className="quote-layout">
          <aside className="quote-context">
            <div className="quote-intro">
              <p className="eyebrow">PROJECT BRIEF</p>
              <h1>ส่งข้อมูลเท่าที่มี ให้ทีมช่วยประเมินงาน</h1>
              <p>
                เลือกจุดเริ่มของคุณ แล้วส่งรายละเอียดเท่าที่ทราบ
                ทีมจะตรวจข้อมูลก่อนติดต่อกลับเพื่อประเมินแนวทางและราคา
              </p>
            </div>
            <figure className="quote-visual">
              <Image
                src="/images/generated/quote-brief-workspace-v1.webp"
                fill
                priority
                sizes="(max-width: 900px) calc(100vw - 40px), 430px"
                alt="ภาพจำลองการวัดกล่องและเตรียมข้อมูลโครงสร้างบรรจุภัณฑ์"
              />
            </figure>
          </aside>
          <QuoteForm
            initialPath={path}
            initialProductType={params.product_type?.slice(0, 120) ?? ""}
            reference={params.reference?.slice(0, 160) ?? ""}
          />
        </div>

        <ul className="quote-reassurance" aria-label="ข้อมูลก่อนส่งรายละเอียด">
          <li>
            <span>01</span>
            <strong>เริ่มได้แม้ยังไม่มีแบบ</strong>
          </li>
          <li>
            <span>02</span>
            <strong>ทีมตรวจรายละเอียดก่อนเสนอราคา</strong>
          </li>
          <li>
            <span>03</span>
            <strong>ข้อมูลใช้สำหรับตรวจสอบงานและติดต่อกลับ</strong>
          </li>
        </ul>
      </div>
    </section>
  );
}
