import type { Metadata } from "next";
import { GalleryGrid } from "@/components/gallery-grid";
import { generatedGalleryConcepts } from "@/content/generated-gallery";
import { getPublishedGallery } from "@/lib/content-api";
import type { GalleryItem } from "@/features/gallery/types";

export const metadata: Metadata = {
  title: "ผลงานและแนวทางกล่องบรรจุภัณฑ์",
  description: "ผลงานที่ได้รับอนุญาตและภาพจำลองแนวทางโครงสร้างกล่องบรรจุภัณฑ์",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  let items: GalleryItem[] = generatedGalleryConcepts;
  let unavailable = false;
  try {
    const published = await getPublishedGallery();
    if (published.length > 0) items = published;
  } catch {
    unavailable = true;
  }
  return (
    <section className="page-section gallery-page">
      <div className="shell page-heading gallery-page-heading">
        <p className="eyebrow">SELECTED WORK</p>
        <h1>ผลงานและแนวทางโครงสร้าง</h1>
        <p>
          ผลงานลูกค้าจะแสดงเฉพาะรายการที่ได้รับอนุญาต ส่วนรายการที่ระบุว่า
          “ภาพจำลอง” ใช้เพื่ออธิบายแนวทางโครงสร้างและไม่ใช่ผลงานลูกค้าจริง
        </p>
        <div className="gallery-context" aria-label="ประเภทผลงานที่ระบบรองรับ">
          <span>กล่องกระดาษพับ</span>
          <span>กล่องลูกฟูก</span>
          <span>กล่องไดคัท</span>
        </div>
      </div>
      <div className="shell">
        {unavailable ? (
          <p className="concept-notice" role="status">
            ระบบผลงานจริงยังเชื่อมต่อไม่ได้ ขณะนี้จึงแสดงภาพจำลองโครงสร้างแทน
          </p>
        ) : null}
        <GalleryGrid items={items} />
      </div>
    </section>
  );
}
