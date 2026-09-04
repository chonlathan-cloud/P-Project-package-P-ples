import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublishedPage, getPublishedProducts } from "@/lib/content-api";
import ProductsPage from "./page";

vi.mock("@/lib/content-api", () => ({
  getPublishedPage: vi.fn(),
  getPublishedProducts: vi.fn(),
}));

const page = {
  id: "page-products",
  kind: "page" as const,
  version: 2,
  published_at: "2026-09-04T00:00:00Z",
  content: {
    kind: "page" as const,
    slug: "products",
    locale: "th" as const,
    title: "เลือกงานพิมพ์จากสินค้าและวิธีใช้งานจริง",
    summary: "เลือกประเภทบรรจุภัณฑ์เพื่อเตรียมข้อมูลเบื้องต้น",
    seo: {
      title: "สินค้าและงานพิมพ์",
      description: null,
      canonical_override: "/products",
      social_image_id: null,
    },
    sections: [
      {
        type: "entity_list" as const,
        key: "catalog",
        heading: "สินค้าและงานพิมพ์",
        entity_kind: "products" as const,
        entity_ids: ["folding-carton"],
      },
      {
        type: "cta" as const,
        key: "guidance",
        heading: "ยังไม่แน่ใจว่าควรเริ่มจากงานแบบไหน",
        body: "ส่งรายละเอียดสินค้าเท่าที่มีให้ทีมช่วยจัด brief",
        label: "ดูวิธีเริ่มงาน",
        href: "/solutions",
      },
    ],
  },
};

const products = [
  {
    id: "product-1",
    kind: "product" as const,
    version: 2,
    published_at: "2026-09-04T00:00:00Z",
    content: {
      kind: "product" as const,
      slug: "folding-carton",
      locale: "th" as const,
      title: "กล่องกระดาษพับ",
      summary: "เริ่มจากขนาดสินค้าและพื้นที่งานพิมพ์",
      seo: {
        title: null,
        description: null,
        canonical_override: null,
        social_image_id: null,
      },
      display_order: 10,
      category: "กล่องกระดาษพับ",
      overview: null,
      pricing_benchmark_id: null,
      hero_image: null,
      evidence_image: null,
      applications: [],
      fit: [],
      brief: ["ขนาดสินค้า", "จำนวนโดยประมาณ", "กำหนดใช้"],
      decisions: [],
      materials: [],
      use_cases: ["กล่องสินค้า"],
      moq_guidance: null,
      lead_time_wording: null,
      media_ids: [],
    },
  },
];

describe("ProductsPage CMS states", () => {
  beforeEach(() => {
    vi.mocked(getPublishedPage).mockResolvedValue(page);
    vi.mocked(getPublishedProducts).mockResolvedValue(products);
  });

  it("renders published CMS copy and one guidance action", async () => {
    render(await ProductsPage());

    expect(
      screen.getByRole("heading", {
        name: "เลือกงานพิมพ์จากสินค้าและวิธีใช้งานจริง",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "กล่องกระดาษพับ" }),
    ).toBeInTheDocument();

    const heading = screen.getByRole("heading", {
      name: "ยังไม่แน่ใจว่าควรเริ่มจากงานแบบไหน",
    });
    const section = heading.closest("section");
    expect(section).not.toBeNull();
    const guidance = within(section!);
    expect(guidance.getAllByRole("link")).toHaveLength(1);
    expect(
      guidance.getByRole("link", { name: "ดูวิธีเริ่มงาน" }),
    ).toHaveAttribute("href", "/solutions");
  });

  it("shows a safe unavailable state instead of stale static content", async () => {
    vi.mocked(getPublishedProducts).mockRejectedValueOnce(
      new Error("content API unavailable"),
    );
    render(await ProductsPage());

    expect(
      screen.getByRole("heading", { name: "ยังโหลดสินค้าและงานพิมพ์ไม่ได้" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("กล่องกระดาษพับ")).not.toBeInTheDocument();
  });
});
