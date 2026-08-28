"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { company } from "@/content/company";

export function MobileActions() {
  const pathname = usePathname();
  if (
    pathname.startsWith("/quote") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/solutions")
  )
    return null;
  return (
    <nav className="mobile-actions" aria-label="ทางลัดติดต่อ">
      <Link href="/quote">ขอใบเสนอราคา</Link>
      <a href={`tel:${company.phoneHref}`}>โทรคุณเปิ้ล</a>
    </nav>
  );
}
