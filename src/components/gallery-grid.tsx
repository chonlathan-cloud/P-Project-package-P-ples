import type { GalleryItem } from "@/features/gallery/types";

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h2>กำลังจัดเตรียมผลงานที่ได้รับอนุญาต</h2>
        <p>
          ผลงานจะปรากฏที่นี่เมื่อข้อมูลภาพและสิทธิ์เผยแพร่ผ่านการตรวจสอบแล้ว
        </p>
      </div>
    );
  }
  return (
    <div className="gallery-grid">
      {items.map((item, index) => (
        <article
          className={
            index % 3 === 0 ? "gallery-item gallery-featured" : "gallery-item"
          }
          key={item.id}
        >
          <picture>
            {item.image.fallback_url ? (
              <source srcSet={item.image.url} type="image/webp" />
            ) : null}
            {/* API-controlled image dimensions prevent layout shift. */}
            <img
              src={item.image.fallback_url ?? item.image.url}
              width={item.image.width}
              height={item.image.height}
              alt={item.image.alt}
            />
          </picture>
          <div className="gallery-caption">
            <span>{item.category}</span>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
