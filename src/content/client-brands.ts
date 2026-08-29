export type ClientBrand = Readonly<{
  id: string;
  name: string;
  logoSrc: string;
  logoAlt: string;
  logoWidth: number;
  logoHeight: number;
  officialSourceUrl: string;
  approvalStatus: "approved";
  permissionConfirmedAt: "2026-08-29";
}>;

export const clientBrands: readonly ClientBrand[] = [
  {
    id: "after-you",
    name: "After You",
    logoSrc: "/images/client-brands/after-you.png",
    logoAlt: "โลโก้ After You Dessert Café",
    logoWidth: 1141,
    logoHeight: 637,
    officialSourceUrl: "https://www.afteryoudessertcafe.com/",
    approvalStatus: "approved",
    permissionConfirmedAt: "2026-08-29",
  },
  {
    id: "mizumi",
    name: "MizuMi",
    logoSrc: "/images/client-brands/mizumi.png",
    logoAlt: "โลโก้ MizuMi",
    logoWidth: 2658,
    logoHeight: 1136,
    officialSourceUrl: "https://mizumi.com/",
    approvalStatus: "approved",
    permissionConfirmedAt: "2026-08-29",
  },
  {
    id: "chatramue",
    name: "ChaTraMue",
    logoSrc: "/images/client-brands/chatramue.png",
    logoAlt: "โลโก้ชาตรามือ ChaTraMue",
    logoWidth: 640,
    logoHeight: 477,
    officialSourceUrl: "https://www.cha-thai.com/en/",
    approvalStatus: "approved",
    permissionConfirmedAt: "2026-08-29",
  },
  {
    id: "srichand",
    name: "Srichand",
    logoSrc: "/images/client-brands/srichand.png",
    logoAlt: "โลโก้ศรีจันทร์ Srichand",
    logoWidth: 181,
    logoHeight: 40,
    officialSourceUrl: "https://srichand.com/",
    approvalStatus: "approved",
    permissionConfirmedAt: "2026-08-29",
  },
  {
    id: "s-and-p",
    name: "S&P",
    logoSrc: "/images/client-brands/s-and-p.png",
    logoAlt: "โลโก้ S&P",
    logoWidth: 369,
    logoHeight: 369,
    officialSourceUrl: "https://www.snpfood.com/en/home",
    approvalStatus: "approved",
    permissionConfirmedAt: "2026-08-29",
  },
  {
    id: "dusit-hotels-and-resorts",
    name: "Dusit Hotels & Resorts",
    logoSrc: "/images/client-brands/dusit-hotels-and-resorts.svg",
    logoAlt: "โลโก้ Dusit Hotels & Resorts",
    logoWidth: 122,
    logoHeight: 51,
    officialSourceUrl: "https://www.dusit.com/",
    approvalStatus: "approved",
    permissionConfirmedAt: "2026-08-29",
  },
];

export function getApprovedClientBrands() {
  return clientBrands.filter((brand) => brand.approvalStatus === "approved");
}
