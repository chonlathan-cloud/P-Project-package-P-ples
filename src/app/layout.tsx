import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { MobileActions } from "@/components/mobile-actions";
import { serverEnv } from "@/lib/env";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(serverEnv.SITE_URL),
  title: {
    default: "DD Box Printing | กล่องบรรจุภัณฑ์สั่งผลิต",
    template: "%s | DD Box Printing",
  },
  description:
    "ส่งสเปกงานหรือข้อมูลสินค้าเพื่อประเมินแนวทางกล่องบรรจุภัณฑ์สั่งผลิต",
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <a className="skip-link" href="#main-content">
          ข้ามไปยังเนื้อหาหลัก
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <MobileActions />
      </body>
    </html>
  );
}
