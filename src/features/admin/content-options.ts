export const OTHER_CATEGORY_VALUE = "__other__";

export const galleryCategoryOptions = [
  "กล่องกระดาษพับ",
  "กล่องลูกฟูก / ไปรษณีย์",
  "กล่องไดคัทลูกฟูก",
  "งานพิมพ์สื่อแบรนด์",
  "ชิ้นรอง / Paper Insert",
  "สติ๊กเกอร์และฉลากสินค้า",
] as const;

export const productCategoryOptions = [
  "กล่องออฟเซ็ทและกล่องกระดาษพับ",
  "กล่องลูกฟูกและกล่องไปรษณีย์",
  "กล่องไดคัทและชิ้นรองสินค้า",
  "สติ๊กเกอร์และฉลากสินค้า",
  "งานพิมพ์สื่อแบรนด์",
] as const;

export const faqScopeOptions = [
  { value: "home", label: "หน้าแรก" },
  { value: "quote", label: "หน้าขอใบเสนอราคา" },
  { value: "products", label: "หน้ารวมสินค้า" },
  { value: "solutions", label: "หน้ารวมวิธีเริ่มงาน" },
] as const;

export const pricingBenchmarkOptions = [
  { value: "folding-carton", label: "กล่องกระดาษพับ" },
  { value: "corrugated-mailer", label: "กล่องลูกฟูก / ไปรษณีย์" },
  { value: "corrugated-die-cut", label: "กล่องไดคัทลูกฟูก" },
  { value: "sticker-label", label: "สติ๊กเกอร์และฉลากสินค้า" },
  { value: "brand-print-media", label: "งานพิมพ์สื่อแบรนด์" },
] as const;
