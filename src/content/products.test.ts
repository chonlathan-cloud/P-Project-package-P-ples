import { describe, expect, it } from "vitest";
import { getProduct, products } from "./products";

describe("product content contract", () => {
  it("keeps slugs unique and resolves every product", () => {
    const slugs = products.map((product) => product.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((slug) => getProduct(slug)?.slug === slug)).toBe(true);
  });

  it("provides evidence, decision guidance, and FAQ content", () => {
    for (const product of products) {
      expect(product.heroImage).toMatch(/^\/images\//);
      expect(product.evidenceImage).toMatch(/^\/images\//);
      expect(product.applications.length).toBeGreaterThanOrEqual(3);
      expect(product.fit.length).toBeGreaterThanOrEqual(3);
      expect(product.brief.length).toBeGreaterThanOrEqual(4);
      expect(product.decisions.length).toBeGreaterThanOrEqual(3);
      expect(product.faq.length).toBeGreaterThanOrEqual(3);
    }
  });
});
