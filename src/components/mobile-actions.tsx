"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileActions() {
  const pathname = usePathname();
  if (pathname.startsWith("/quote") || pathname.startsWith("/admin"))
    return null;
  return (
    <nav className="mobile-actions" aria-label="ทางลัดติดต่อ">
      <Link href="/quote">ส่งข้อมูล</Link>
      <Link href="/contact#line">LINE</Link>
      <Link href="/contact#phone">โทร</Link>
    </nav>
  );
}
