import { describe, expect, it } from "vitest";
import { clientBrands, getApprovedClientBrands } from "./client-brands";

const approvedBrandNames = [
  "After You",
  "MizuMi",
  "ChaTraMue",
  "Srichand",
  "S&P",
  "Dusit Hotels & Resorts",
];

const brandsWithoutPublicationPermission = [
  "Karmakamet",
  "Plantnery",
  "SUPERMOM",
  "SAPPE",
];

describe("client brand publication boundaries", () => {
  it("publishes exactly the six owner-approved client brands", () => {
    const approvedBrands = getApprovedClientBrands();

    expect(approvedBrands.map((brand) => brand.name)).toEqual(
      approvedBrandNames,
    );
    expect(approvedBrands).toEqual(clientBrands);
    expect(
      approvedBrands.every(
        (brand) =>
          brand.approvalStatus === "approved" &&
          brand.permissionConfirmedAt === "2026-08-29" &&
          brand.logoSrc.startsWith("/images/client-brands/") &&
          brand.officialSourceUrl.startsWith("https://"),
      ),
    ).toBe(true);
  });

  it("does not publish brands without logo permission", () => {
    const publishedData = JSON.stringify(clientBrands);

    brandsWithoutPublicationPermission.forEach((brandName) => {
      expect(publishedData).not.toContain(brandName);
    });
  });

  it("keeps brand identifiers, assets, and source URLs unique", () => {
    expect(new Set(clientBrands.map((brand) => brand.id)).size).toBe(
      clientBrands.length,
    );
    expect(new Set(clientBrands.map((brand) => brand.logoSrc)).size).toBe(
      clientBrands.length,
    );
    expect(
      new Set(clientBrands.map((brand) => brand.officialSourceUrl)).size,
    ).toBe(clientBrands.length);
  });
});
