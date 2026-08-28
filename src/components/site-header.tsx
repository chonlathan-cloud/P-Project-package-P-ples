import Link from "next/link";

const navigation = [
  ["สินค้า", "/products"],
  ["ทางเลือกสำหรับธุรกิจ", "/solutions/starter"],
  ["ผลงาน", "/gallery"],
  ["ติดต่อ", "/contact"],
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="DD Box Printing หน้าหลัก">
          <span className="brand-mark" aria-hidden="true">
            DD
          </span>
          <span>BOX PRINTING</span>
        </Link>
        <nav aria-label="เมนูหลัก">
          <ul className="desktop-nav">
            {navigation.map(([label, href]) => (
              <li key={href}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link className="button button-compact" href="/quote">
          ส่งรายละเอียด
        </Link>
      </div>
    </header>
  );
}
