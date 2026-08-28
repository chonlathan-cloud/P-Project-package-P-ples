import Link from "next/link";
export default function NotFound() {
  return (
    <section className="confirmation">
      <div className="shell narrow">
        <p className="eyebrow">404</p>
        <h1>ไม่พบหน้าที่ต้องการ</h1>
        <p>ลิงก์อาจถูกเปลี่ยนหรือเนื้อหายังไม่ได้เผยแพร่</p>
        <Link className="button" href="/">
          กลับหน้าหลัก
        </Link>
      </div>
    </section>
  );
}
