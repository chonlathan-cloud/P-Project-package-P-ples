import { describe, expect, it } from "vitest";
import type { GalleryItem } from "./types";
import { selectHomeGalleryItems } from "./home-selection";

function galleryItem(
  id: string,
  evidenceType: GalleryItem["evidence_type"],
): GalleryItem {
  return {
    id,
    slug: id,
    title: id,
    summary: `${id} summary`,
    category: "กล่องกระดาษพับ",
    status: "published",
    version: 1,
    images: [
      {
        id: `${id}-image`,
        url: `https://media.example/${id}.webp`,
        fallback_url: null,
        width: 1200,
        height: 800,
        alt: `${id} image`,
      },
    ],
    evidence_type: evidenceType,
    pricing_benchmark_id: null,
    customer_permission: evidenceType === "customer_work",
    specs: { material: null, quantity: null, application: null },
  };
}

describe("selectHomeGalleryItems", () => {
  it("keeps the approved concepts and excludes all admin uploads", () => {
    const items = [
      galleryItem("testing", "customer_work"),
      galleryItem("generated-paper-insert-v1", "concept"),
      galleryItem("generated-premium-die-cut-v2", "concept"),
      galleryItem("uploaded-but-misclassified-as-concept", "concept"),
      galleryItem("generated-sticker-label-v1", "concept"),
      galleryItem("generated-brand-print-media-v1", "concept"),
      galleryItem("another-upload", "customer_work"),
    ];

    expect(selectHomeGalleryItems(items).map((item) => item.id)).toEqual([
      "generated-sticker-label-v1",
      "generated-brand-print-media-v1",
      "generated-premium-die-cut-v2",
      "generated-paper-insert-v1",
    ]);
  });
});
