import type { GalleryItem } from "./types";

const HOME_GALLERY_ITEM_IDS = [
  "generated-sticker-label-v1",
  "generated-brand-print-media-v1",
  "generated-premium-die-cut-v2",
  "generated-paper-insert-v1",
] as const;

export function selectHomeGalleryItems(items: GalleryItem[]): GalleryItem[] {
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return HOME_GALLERY_ITEM_IDS.flatMap((itemId) => {
    const item = itemsById.get(itemId);
    return item?.evidence_type === "concept" ? [item] : [];
  });
}
