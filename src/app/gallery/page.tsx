import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery-grid";
import { getPublishedGallery } from "@/lib/content-api";
import type { GalleryItem } from "@/features/gallery/types";

export const metadata: Metadata = {
  title: "ผลงานกล่องบรรจุภัณฑ์",
  description: "ผลงานกล่องบรรจุภัณฑ์ที่ตรวจสอบข้อมูลและสิทธิ์เผยแพร่แล้ว",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  let items: GalleryItem[] = [];
  let unavailable = false;
  try {
    items = await getPublishedGallery();
  } catch {
    unavailable = true;
  }
  return (
    <section className="page-section">
      <div className="shell page-heading">
        <p className="eyebrow">SELECTED WORK</p>
        <h1>ผลงานที่ได้รับอนุญาตให้เผยแพร่</h1>
        <p>
          ภาพและรายละเอียดในหน้านี้มาจากรายการที่ผ่านขั้นตอน publish
          ของระบบจัดการเนื้อหา
        </p>
      </div>
      <div className="shell">
        {unavailable ? (
          <div className="error-state" role="status">
            <h2>ยังโหลดผลงานไม่ได้</h2>
            <p>กรุณาลองใหม่ภายหลัง หรือเริ่มส่งรายละเอียดงานได้ทันที</p>
          </div>
        ) : (
          <GalleryGrid items={items} />
        )}
      </div>
    </section>
  );
}
