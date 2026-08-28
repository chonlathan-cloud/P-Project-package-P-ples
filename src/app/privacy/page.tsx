import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "ความเป็นส่วนตัว (รออนุมัติ)",
  robots: { index: false, follow: false },
};
export default function PrivacyPage() {
  return (
    <section className="page-section">
      <div className="shell narrow prose">
        <p className="eyebrow">DRAFT · NOINDEX</p>
        <h1>ประกาศความเป็นส่วนตัวอยู่ระหว่างการอนุมัติ</h1>
        <p>
          ระบบ vertical slice เก็บข้อมูล brief
          และช่องทางติดต่อเฉพาะเมื่อผู้ใช้ยินยอมส่งแบบฟอร์ม ไม่มีการเปิดใช้
          analytics หรือ advertising tags ในระยะนี้
        </p>
        <p>
          ก่อนเปิด production ต้องระบุผู้ควบคุมข้อมูล วัตถุประสงค์
          ฐานการประมวลผล ระยะเวลาเก็บ ผู้รับข้อมูล ช่องทางใช้สิทธิ์
          และนโยบายไฟล์แนบโดยเจ้าของธุรกิจหรือที่ปรึกษากฎหมาย
        </p>
      </div>
    </section>
  );
}
