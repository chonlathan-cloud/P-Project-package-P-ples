import { describe, expect, it } from "vitest";
import { clientBrands, getApprovedClientBrands } from "./client-brands";

const approvedBrandNames = [
  "Godmami",
  "Swarovski",
  "CARCO",
  "Fulfill",
  "Luca Eve",
  "Orista",
  "หัวเห็ด",
  "Ink Tech Chemical",
  "Lightech",
];

const brandsWithoutCurrentPublicationApproval = [
  "After You",
  "MizuMi",
  "ChaTraMue",
  "Srichand",
  "S&P",
  "Dusit Hotels & Resorts",
  "Karmakamet",
  "Plantnery",
  "SUPERMOM",
  "SAPPE",
];

describe("client brand publication boundaries", () => {
  it("publishes exactly the nine owner-supplied and approved client brands", () => {
    const approvedBrands = getApprovedClientBrands();

    expect(approvedBrands.map((brand) => brand.name)).toEqual(
      approvedBrandNames,
    );
    expect(approvedBrands).toEqual(clientBrands);
    expect(
      approvedBrands.every(
        (brand) =>
          brand.approvalStatus === "approved" &&
          brand.permissionConfirmedAt === "2026-09-04" &&
          brand.assetProvenance === "owner-supplied" &&
          ["standard", "large", "xlarge"].includes(brand.logoPresentation) &&
          brand.logoSrc.startsWith("/images/client-brands/") &&
          brand.logoAlt.length > 0,
      ),
    ).toBe(true);
  });

  it("does not publish brands outside the current owner-approved set", () => {
    const publishedData = JSON.stringify(clientBrands);

    brandsWithoutCurrentPublicationApproval.forEach((brandName) => {
      expect(publishedData).not.toContain(brandName);
    });
  });

  it("keeps brand identifiers and assets unique", () => {
    expect(new Set(clientBrands.map((brand) => brand.id)).size).toBe(
      clientBrands.length,
    );
    expect(new Set(clientBrands.map((brand) => brand.logoSrc)).size).toBe(
      clientBrands.length,
    );
  });

  it("uses the owner-confirmed replacement artwork for Fulfill and Hua Hed", () => {
    expect(clientBrands.find((brand) => brand.id === "fulfill")).toMatchObject({
      logoSrc: "/images/client-brands/fulfill-v2.jpeg",
      logoWidth: 500,
      logoHeight: 500,
      logoPresentation: "large",
    });
    expect(clientBrands.find((brand) => brand.id === "hua-hed")).toMatchObject({
      logoSrc: "/images/client-brands/hua-hed-v2.jpg",
      logoWidth: 480,
      logoHeight: 480,
      logoPresentation: "large",
    });
  });
});
