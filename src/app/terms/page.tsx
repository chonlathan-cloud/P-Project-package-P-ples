import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "เงื่อนไขการใช้เว็บไซต์ (รออนุมัติ)",
  robots: { index: false, follow: false },
};
export default function TermsPage() {
  return (
    <section className="page-section">
      <div className="shell narrow prose">
        <p className="eyebrow">DRAFT · NOINDEX</p>
        <h1>เงื่อนไขการใช้เว็บไซต์อยู่ระหว่างการอนุมัติ</h1>
        <p>
          ข้อมูลบนเว็บไซต์และการส่ง brief ไม่ใช่ใบเสนอราคา สัญญาซื้อขาย
          หรือการรับรองกำหนดส่ง
          การยืนยันเชิงพาณิชย์ต้องเกิดผ่านกระบวนการที่เจ้าของธุรกิจกำหนด
        </p>
        <p>
          หน้านี้ต้องได้รับการตรวจสอบและเติมข้อมูลนิติบุคคล การรับประกัน
          ข้อจำกัดความรับผิด และกฎหมายที่ใช้บังคับก่อนเปิด production
        </p>
      </div>
    </section>
  );
}
