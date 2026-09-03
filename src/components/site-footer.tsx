import Image from "next/image";
import Link from "next/link";
import { company } from "@/content/company";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <Image
            src="/images/dd-box-logo.png"
            width={210}
            height={70}
            alt="DD Box Printing"
          />
          <p>เริ่มประเมินบรรจุภัณฑ์จากข้อมูลสินค้า สเปก และข้อจำกัดที่คุณมี</p>
        </div>
        <nav aria-label="สินค้าและงานพิมพ์">
          <h2>สินค้า</h2>
          <Link href="/products/folding-carton">กล่องออฟเซ็ท / กระดาษพับ</Link>
          <Link href="/products/corrugated-box">กล่องลูกฟูก / ไปรษณีย์</Link>
          <Link href="/products/custom-die-cut">กล่องไดคัท / ชิ้นรอง</Link>
          <Link href="/products/sticker-label">สติ๊กเกอร์ / ฉลากสินค้า</Link>
          <Link href="/products/brand-print-media">งานพิมพ์สื่อแบรนด์</Link>
        </nav>
        <nav aria-label="ข้อมูลและการติดต่อ">
          <h2>ข้อมูล</h2>
          <Link href="/solutions">วิธีเริ่มงาน</Link>
          <Link href="/gallery">ผลงาน</Link>
          <Link href="/company">เกี่ยวกับเรา</Link>
          <Link href="/contact">ติดต่อ</Link>
        </nav>
        <nav aria-label="ช่องทางติดต่อ">
          <h2>ติดต่อ DD Box</h2>
          <a href={company.lineOaHref}>LINE OA: {company.lineOaId}</a>
          <a href={company.lineSaleHref}>LINE ฝ่ายขาย: {company.lineSaleId}</a>
          <a href={`tel:${company.phoneHref}`}>{company.phoneDisplay}</a>
          <a href={`mailto:${company.email}`}>{company.email}</a>
          <a href={company.facebookHref}>Facebook Page</a>
          <Link href="/contact">ที่อยู่และแผนที่</Link>
        </nav>
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
