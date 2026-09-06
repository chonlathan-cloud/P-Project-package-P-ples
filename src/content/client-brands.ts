export type ClientBrand = Readonly<{
  id: string;
  name: string;
  logoSrc: string;
  logoAlt: string;
  logoWidth: number;
  logoHeight: number;
  logoPresentation: "standard" | "large" | "xlarge";
  assetProvenance: "owner-supplied";
  approvalStatus: "approved";
  permissionConfirmedAt: "2026-09-04";
}>;

export const clientBrands: readonly ClientBrand[] = [
  {
    id: "godmami",
    name: "Godmami",
    logoSrc: "/images/client-brands/godmami.png",
    logoAlt: "โลโก้ Godmami",
    logoWidth: 652,
    logoHeight: 193,
    logoPresentation: "standard",
    assetProvenance: "owner-supplied",
    approvalStatus: "approved",
    permissionConfirmedAt: "2026-09-04",
  },
  {
    id: "swarovski",
    name: "Swarovski",
    logoSrc: "/images/client-brands/swarovski.svg",
    logoAlt: "โลโก้ Swarovski",
    logoWidth: 860,
    logoHeight: 116,
    logoPresentation: "standard",
    assetProvenance: "owner-supplied",
    approvalStatus: "approved",
    permissionConfirmedAt: "2026-09-04",
  },
  {
    id: "carco",
    name: "CARCO",
    logoSrc: "/images/client-brands/carco.png",
    logoAlt: "โลโก้ CARCO",
    logoWidth: 200,
    logoHeight: 90,
    logoPresentation: "standard",
    assetProvenance: "owner-supplied",
    approvalStatus: "approved",
    permissionConfirmedAt: "2026-09-04",
  },
  {
    id: "fulfill",
    name: "Fulfill",
    logoSrc: "/images/client-brands/fulfill-v2.jpeg",
    logoAlt: "โลโก้ Fulfill",
    logoWidth: 500,
    logoHeight: 500,
    logoPresentation: "large",
    assetProvenance: "owner-supplied",
    approvalStatus: "approved",
    permissionConfirmedAt: "2026-09-04",
  },
  {
    id: "luca-eve",
    name: "Luca Eve",
    logoSrc: "/images/client-brands/luca-eve.png",
    logoAlt: "โลโก้ Luca Eve",
    logoWidth: 447,
    logoHeight: 447,
    logoPresentation: "xlarge",
    assetProvenance: "owner-supplied",
    approvalStatus: "approved",
    permissionConfirmedAt: "2026-09-04",
  },
  {
    id: "orista",
    name: "Orista",
    logoSrc: "/images/client-brands/orista.webp",
    logoAlt: "โลโก้ผลิตภัณฑ์ Orista Plus",
    logoWidth: 800,
    logoHeight: 800,
    logoPresentation: "xlarge",
    assetProvenance: "owner-supplied",
    approvalStatus: "approved",
    permissionConfirmedAt: "2026-09-04",
  },
  {
    id: "hua-hed",
    name: "หัวเห็ด",
    logoSrc: "/images/client-brands/hua-hed-v2.jpg",
    logoAlt: "โลโก้หัวเห็ด",
    logoWidth: 480,
    logoHeight: 480,
    logoPresentation: "large",
    assetProvenance: "owner-supplied",
    approvalStatus: "approved",
    permissionConfirmedAt: "2026-09-04",
  },
  {
    id: "ink-tech-chemical",
    name: "Ink Tech Chemical",
    logoSrc: "/images/client-brands/ink-tech-chemical.webp",
    logoAlt: "โลโก้ Ink Tech Chemical",
    logoWidth: 480,
    logoHeight: 160,
    logoPresentation: "standard",
    assetProvenance: "owner-supplied",
    approvalStatus: "approved",
    permissionConfirmedAt: "2026-09-04",
  },
  {
    id: "lightech",
    name: "Lightech",
    logoSrc: "/images/client-brands/lightech.png",
    logoAlt: "โลโก้ Lightech",
    logoWidth: 200,
    logoHeight: 200,
    logoPresentation: "standard",
    assetProvenance: "owner-supplied",
    approvalStatus: "approved",
    permissionConfirmedAt: "2026-09-04",
  },
];

export function getApprovedClientBrands() {
  return clientBrands.filter((brand) => brand.approvalStatus === "approved");
}
