"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const navigation = [
  ["สินค้า", "/products"],
  ["โซลูชัน", "/solutions"],
  ["ผลงาน", "/gallery"],
  ["เกี่ยวกับเรา", "/company"],
  ["ติดต่อ", "/contact"],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link
          className="brand"
          href="/"
          aria-label="DD Box Printing หน้าหลัก"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/images/dd-box-logo.png"
            width={180}
            height={60}
            priority
            alt="DD Box Printing"
          />
        </Link>
        <nav className="desktop-navigation" aria-label="เมนูหลัก">
          <ul className="desktop-nav">
            {navigation.map(([label, href]) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={pathname.startsWith(href) ? "page" : undefined}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          className="button header-quote"
          href="/quote"
          onClick={() => setOpen(false)}
        >
          ขอใบเสนอราคา
        </Link>
        <button
          ref={trigger}
          className="menu-trigger"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((current) => !current)}
        >
          <span className="sr-only">{open ? "ปิดเมนู" : "เปิดเมนู"}</span>
          <span aria-hidden="true">{open ? "×" : "☰"}</span>
        </button>
      </div>
      <nav
        id="mobile-menu"
        className="mobile-menu"
        aria-label="เมนูหลักสำหรับมือถือ"
        hidden={!open}
      >
        <div className="shell mobile-menu-inner">
          {navigation.map(([label, href], index) => (
            <Link href={href} key={href} onClick={() => setOpen(false)}>
              <span>0{index + 1}</span>
              {label}
            </Link>
          ))}
          <Link className="button" href="/quote" onClick={() => setOpen(false)}>
            ส่งรายละเอียดเพื่อขอราคา
          </Link>
        </div>
      </nav>
    </header>
  );
}
