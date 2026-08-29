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
          {(() => {
            const image = item.images[0];
            return (
              <picture>
                {image.fallback_url ? (
                  <source srcSet={image.url} type="image/webp" />
                ) : null}
                {/* API-controlled image dimensions prevent layout shift. */}
                <img
                  src={image.fallback_url ?? image.url}
                  width={image.width}
                  height={image.height}
                  alt={image.alt}
                />
              </picture>
            );
          })()}
          <div className="gallery-caption">
            <span>
              {item.evidence_type === "concept" ? "ภาพจำลอง · " : ""}
              {item.category}
            </span>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
