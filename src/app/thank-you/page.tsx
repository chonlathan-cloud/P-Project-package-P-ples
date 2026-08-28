import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "รับข้อมูลแล้ว",
  robots: { index: false, follow: false },
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const reference = (await searchParams).reference;
  return (
    <section className="confirmation">
      <div className="shell narrow">
        <p className="eyebrow">BRIEF RECEIVED</p>
        <h1>ระบบรับข้อมูลแล้ว</h1>
        {reference ? (
          <p className="reference">
            รหัสอ้างอิง <strong>{reference}</strong>
          </p>
        ) : null}
        <p>
          ทีมงานจะตรวจสอบรายละเอียดและติดต่อผ่านช่องทางที่คุณเลือก
          หากต้องการส่งข้อมูลเพิ่ม โปรดเก็บรหัสอ้างอิงนี้ไว้
        </p>
        <Link className="button" href="/">
          กลับหน้าหลัก
        </Link>
      </div>
    </section>
  );
}
