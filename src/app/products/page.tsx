import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ประเภทกล่อง",
  description: "สำรวจประเภทกล่องและข้อมูลที่ควรเตรียมก่อนส่งรายละเอียดงาน",
  alternates: { canonical: "/products" },
};
const products = [
  {
    slug: "folding-carton",
    title: "กล่องกระดาษพับ",
    description:
      "เหมาะกับงานที่ต้องกำหนดโครงสร้าง ขนาด วัสดุ และงานพิมพ์ร่วมกัน",
  },
  {
    slug: "corrugated-box",
    title: "กล่องลูกฟูก",
    description: "เริ่มจากน้ำหนักสินค้า รูปแบบการขนส่ง ขนาด และจำนวนที่ต้องการ",
  },
  {
    slug: "custom-die-cut",
    title: "กล่องไดคัทตามรูปแบบ",
    description: "ใช้เมื่อสินค้าและประสบการณ์เปิดกล่องต้องการโครงสร้างเฉพาะ",
  },
];
export default function ProductsPage() {
  return (
    <section className="page-section">
      <div className="shell page-heading">
        <p className="eyebrow">BOX TYPES</p>
        <h1>
          เริ่มเลือกประเภทกล่อง
          <br />
          จากสินค้าและการใช้งาน
        </h1>
        <p>
          ข้อมูลด้านล่างช่วยจัด brief เบื้องต้น
          ไม่ใช่รายการราคาหรือการยืนยันความสามารถในการผลิต
        </p>
      </div>
      <div className="shell product-list">
        {products.map((product, index) => (
          <Link href={`/products/${product.slug}`} key={product.slug}>
            <span>0{index + 1}</span>
            <h2>{product.title}</h2>
            <p>{product.description}</p>
            <strong>ดูข้อมูลที่ควรเตรียม →</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
