import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProjectImageGallery } from "./project-image-gallery";
import { galleryItemSchema } from "./types";

const images = [
  {
    id: "front",
    url: "https://example.com/front.webp",
    fallback_url: "https://example.com/front.jpg",
    width: 800,
    height: 600,
    alt: "ภาพด้านหน้าของกล่อง",
  },
  {
    id: "detail",
    url: "https://example.com/detail.webp",
    fallback_url: "https://example.com/detail.jpg",
    width: 800,
    height: 600,
    alt: "ภาพรายละเอียดลิ้นล็อกกล่อง",
  },
];

describe("ProjectImageGallery", () => {
  it("switches the main image using accessible thumbnail controls", () => {
    render(<ProjectImageGallery images={images} title="กล่องตัวอย่าง" />);
    expect(screen.getByAltText("ภาพด้านหน้าของกล่อง")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /ดูภาพที่ 2: ภาพรายละเอียดลิ้นล็อกกล่อง/,
      }),
    );

    expect(
      screen.getByAltText("ภาพรายละเอียดลิ้นล็อกกล่อง"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ดูภาพที่ 2/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("rejects gallery records with more than twelve images", () => {
    const result = galleryItemSchema.safeParse({
      id: "project",
      slug: "project",
      title: "โครงการตัวอย่าง",
      summary: "รายละเอียดโครงการตัวอย่าง",
      category: "กล่องไดคัท",
      status: "published",
      version: 1,
      images: Array.from({ length: 13 }, (_, index) => ({
        ...images[0],
        id: `image-${index}`,
      })),
      evidence_type: "concept",
      pricing_benchmark_id: null,
      customer_permission: false,
      specs: { material: null, quantity: null, application: null },
    });

    expect(result.success).toBe(false);
  });
});
