"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="confirmation">
      <div className="shell narrow">
        <p className="eyebrow">ERROR</p>
        <h1>หน้านี้ยังแสดงผลไม่ได้</h1>
        <p>
          ลองโหลดใหม่อีกครั้ง
          หากยังพบปัญหาให้เก็บรหัสคำขอจากข้อความที่แสดงในแบบฟอร์ม
        </p>
        <button className="button" onClick={reset}>
          ลองอีกครั้ง
        </button>
      </div>
    </section>
  );
}
