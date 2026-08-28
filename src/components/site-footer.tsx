import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <p className="eyebrow light">DD BOX PRINTING</p>
          <h2>เริ่มจากข้อมูลที่คุณมี</h2>
          <p>
            ส่งสเปกงาน หรือบอกข้อมูลสินค้าเพื่อให้ทีมประเมินแนวทางบรรจุภัณฑ์
          </p>
        </div>
        <div className="footer-actions">
          <Link className="button" href="/quote">
            ส่งรายละเอียดเพื่อขอราคา
          </Link>
          <Link href="/contact">ดูช่องทางติดต่อ</Link>
        </div>
      </div>
      <div className="shell footer-meta">
        <span>© {new Date().getFullYear()} DD Box Printing</span>
        <span>
          <Link href="/privacy">ความเป็นส่วนตัว</Link> ·{" "}
          <Link href="/terms">เงื่อนไข</Link>
        </span>
      </div>
    </footer>
  );
}
