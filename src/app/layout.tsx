import type { Metadata } from "next";
import { Libre_Franklin, Noto_Sans_Thai } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { MobileActions } from "@/components/mobile-actions";
import { company } from "@/content/company";
import { serverEnv } from "@/lib/env";
import "@/styles/globals.css";

const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-libre-franklin",
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

const organizationSchema = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: company.legalName,
  alternateName: company.displayName,
  url: serverEnv.SITE_URL,
  email: company.email,
  telephone: company.phoneHref,
  address: {
    "@type": "PostalAddress",
    streetAddress: "10 หมู่ 7 ถนนวัดศรีวารีน้อย",
    addressLocality: "ตำบลบางโฉลง อำเภอบางพลี",
    addressRegion: "สมุทรปราการ",
    postalCode: "10540",
    addressCountry: "TH",
  },
}).replaceAll("<", "\\u003c");

export const metadata: Metadata = {
  metadataBase: new URL(serverEnv.SITE_URL),
  title: {
    default: "DD Box Printing | กล่องบรรจุภัณฑ์สั่งผลิต",
    template: "%s | DD Box Printing",
  },
  description:
    "ส่งสเปกงานหรือข้อมูลสินค้าเพื่อประเมินแนวทางกล่องบรรจุภัณฑ์สั่งผลิต",
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/images/New-logo.png", type: "image/png", sizes: "1254x1254" },
    ],
    shortcut: [{ url: "/images/New-logo.png", type: "image/png" }],
    apple: [
      { url: "/images/New-logo.png", type: "image/png", sizes: "1254x1254" },
    ],
  },
  robots: serverEnv.SITE_INDEXING_ENABLED
    ? undefined
    : { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={`${libreFranklin.variable} ${notoSansThai.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationSchema }}
        />
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
