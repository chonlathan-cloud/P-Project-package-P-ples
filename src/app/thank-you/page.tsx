import type { Metadata } from "next";
import { ThankYouActions } from "@/features/leads/thank-you-actions";

export const metadata: Metadata = {
  title: "รับข้อมูลแล้ว",
  robots: { index: false, follow: false },
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const candidate = (await searchParams).reference?.trim();
  const reference =
    candidate && /^DD-[A-F0-9]{10}$/.test(candidate) ? candidate : undefined;
  return (
    <section className="confirmation">
      <div className="shell confirmation-shell">
        <div className="confirmation-heading">
          <p className="eyebrow">BRIEF RECEIVED</p>
          <h1>ระบบรับข้อมูลแล้ว</h1>
          <p>
            ทีมงานได้รับรายละเอียดเรียบร้อยแล้ว ไม่จำเป็นต้องส่งซ้ำ
            และจะติดต่อผ่านช่องทางที่คุณเลือก
          </p>
        </div>
        <ThankYouActions reference={reference} />
      </div>
    </section>
  );
}
