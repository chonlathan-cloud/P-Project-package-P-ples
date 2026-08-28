import { describe, expect, it } from "vitest";
import { company } from "./company";

describe("company profile contract", () => {
  it("keeps approved operational facts internally consistent", () => {
    const machines = Object.values(company.profile.machineBreakdown).reduce(
      (total, count) => total + count,
      0,
    );

    expect(machines).toBe(company.profile.machineCount);
    expect(company.profile.capacity.minPerDay).toBeLessThan(
      company.profile.capacity.maxPerDay,
    );
    expect(company.profile.capacity.qualification.length).toBeGreaterThan(0);
  });

  it("provides stable legal and location information", () => {
    expect(company.legalName).toContain("ดีดี บ็อกซ์ ปริ้นติ้ง");
    expect(company.profile.foundedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(company.address).toContain("สมุทรปราการ");
    expect(company.mapHref).toMatch(/^https:\/\/www\.google\.com\/maps\//);
  });
});
