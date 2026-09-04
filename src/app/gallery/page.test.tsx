import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GalleryItem } from "@/features/gallery/types";
import { getPublishedGallery, getPublishedPricing } from "@/lib/content-api";
import GalleryPage from "./page";

vi.mock("@/lib/content-api", () => ({
  getPublishedGallery: vi.fn(),
  getPublishedPricing: vi.fn(),
}));

function galleryItem({
  id,
  title,
  category,
  evidenceType,
}: {
  id: string;
  title: string;
  category: string;
  evidenceType: GalleryItem["evidence_type"];
}): GalleryItem {
  return {
    id,
    slug: id,
    title,
    summary: `${title} สำหรับทดสอบ`,
    category,
    evidence_type: evidenceType,
    status: "published",
    version: 2,
    pricing_benchmark_id: null,
    customer_permission: evidenceType === "customer_work",
    specs: { material: null, quantity: null, application: null },
    images: [
      {
        id: `${id}-image`,
        url: `https://media.example/${id}.webp`,
        fallback_url: null,
        width: 1200,
        height: 800,
        alt: title,
      },
    ],
  };
}

const items = [
  galleryItem({
    id: "customer-folding-box",
    title: "ผลงานจริงกล่องกระดาษพับ",
    category: "กล่องกระดาษพับ",
    evidenceType: "customer_work",
  }),
  galleryItem({
    id: "concept-label",
    title: "ภาพแนะนำฉลากสินค้า",
    category: "สติ๊กเกอร์และฉลากสินค้า",
    evidenceType: "concept",
  }),
  galleryItem({
    id: "concept-folding-box",
    title: "ภาพแนะนำกล่องกระดาษพับ",
    category: "กล่องกระดาษพับ",
    evidenceType: "concept",
  }),
  galleryItem({
    id: "concept-mailer-box",
    title: "ภาพแนะนำกล่องไปรษณีย์",
    category: "กล่องลูกฟูก / ไปรษณีย์",
    evidenceType: "concept",
  }),
];

describe("GalleryPage filters", () => {
  beforeEach(() => {
    vi.mocked(getPublishedGallery).mockResolvedValue(items);
    vi.mocked(getPublishedPricing).mockResolvedValue([]);
  });

  it("shows only concept images in the default recommended-images view", async () => {
    render(await GalleryPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("link", { name: "ภาพแนะนำทั้งหมด 3" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("heading", { name: "ภาพแนะนำฉลากสินค้า" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "ภาพแนะนำกล่องกระดาษพับ" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "ผลงานจริงกล่องกระดาษพับ" }),
    ).not.toBeInTheDocument();
  });

  it("shows concept images before admin customer work in a category", async () => {
    render(
      await GalleryPage({
        searchParams: Promise.resolve({ category: "กล่องกระดาษพับ" }),
      }),
    );

    const projectHeadings = screen.getAllByRole("heading", { level: 3 });
    expect(projectHeadings.map((heading) => heading.textContent)).toEqual([
      "ภาพแนะนำกล่องกระดาษพับ",
      "ผลงานจริงกล่องกระดาษพับ",
    ]);
    expect(
      screen.getByRole("link", { name: "กล่องกระดาษพับ 2" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "ภาพแนะนำทั้งหมด 3" }),
    ).not.toHaveAttribute("aria-current");
  });
});
