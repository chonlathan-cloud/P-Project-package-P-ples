import { describe, expect, it } from "vitest";
import {
  byDisplayOrder,
  pageSection,
  publishedPageSchema,
  publishedProductSchema,
} from "./types";

const seo = {
  title: null,
  description: null,
  canonical_override: null,
  social_image_id: null,
};

describe("published structured content", () => {
  it("parses rich product snapshots and supplies backward-compatible defaults", () => {
    const parsed = publishedProductSchema.parse({
      id: "product-1",
      kind: "product",
      version: 2,
      published_at: "2026-09-04T00:00:00Z",
      content: {
        kind: "product",
        slug: "folding-carton",
        locale: "th",
        title: "กล่องกระดาษพับ",
        summary: "ข้อมูลสำหรับเริ่มประเมินงาน",
        seo,
        category: "กล่องกระดาษพับ",
        materials: [],
        use_cases: [],
        moq_guidance: null,
        lead_time_wording: null,
        media_ids: [],
      },
    });

    expect(parsed.content.display_order).toBe(0);
    expect(parsed.content.applications).toEqual([]);
    expect(parsed.content.hero_image).toBeNull();
  });

  it("finds keyed page sections and sorts entities by display order", () => {
    const page = publishedPageSchema.parse({
      id: "page-1",
      kind: "page",
      version: 2,
      published_at: "2026-09-04T00:00:00Z",
      content: {
        kind: "page",
        slug: "products",
        locale: "th",
        title: "สินค้าและงานพิมพ์",
        summary: "เลือกประเภทงานจากการใช้งานจริง",
        seo,
        sections: [
          {
            type: "cta",
            key: "guidance",
            heading: "ยังไม่แน่ใจ",
            body: "ส่งข้อมูลให้ทีมช่วยแนะนำ",
            label: "เริ่มส่งข้อมูล",
            href: "/quote",
          },
        ],
      },
    });

    expect(pageSection(page, "guidance", "cta")?.href).toBe("/quote");
    const items = [
      { content: { display_order: 20, title: "สอง" } },
      { content: { display_order: 10, title: "หนึ่ง" } },
    ];
    expect(items.toSorted(byDisplayOrder)[0]?.content.title).toBe("หนึ่ง");
  });
});
