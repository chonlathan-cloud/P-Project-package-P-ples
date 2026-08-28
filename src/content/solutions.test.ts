import { describe, expect, it } from "vitest";
import { getSolution, solutions } from "./solutions";

describe("solution content contract", () => {
  it("keeps the three stable slugs unique and resolvable", () => {
    const slugs = solutions.map((solution) => solution.slug);

    expect(slugs).toEqual(["starter", "growth", "scale"]);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((slug) => getSolution(slug)?.slug === slug)).toBe(true);
  });

  it("provides enough distinct guidance for every path", () => {
    for (const solution of solutions) {
      expect(solution.fit.length).toBeGreaterThanOrEqual(3);
      expect(solution.inputs.length).toBeGreaterThanOrEqual(4);
      expect(solution.checks.length).toBeGreaterThanOrEqual(3);
      expect(solution.faq.length).toBeGreaterThanOrEqual(3);
      expect(solution.ctaLabel).not.toBe("เลือกเส้นทางนี้");
    }
  });
});
