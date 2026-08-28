import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

const products = {
  "folding-carton": {
    title: "กล่องกระดาษพับ",
    intro:
      "จัด brief จากขนาดสินค้า น้ำหนัก การจัดวาง วัสดุ และพื้นที่สำหรับงานพิมพ์",
    fields: [
      "ขนาดสินค้าและระยะเผื่อ",
      "จำนวนโดยประมาณ",
      "วัสดุหรือผิวสัมผัสที่ต้องการ",
      "ไฟล์อาร์ตเวิร์กและกำหนดใช้งาน",
    ],
  },
  "corrugated-box": {
    title: "กล่องลูกฟูก",
    intro: "เริ่มจากภาระระหว่างขนส่ง รูปแบบบรรจุ และข้อจำกัดด้านขนาด",
    fields: [
      "น้ำหนักและจำนวนสินค้าต่อกล่อง",
      "ขนาดภายนอกหรือขนาดสินค้า",
      "วิธีขนส่งและการซ้อน",
      "จำนวนและพื้นที่จัดส่ง",
    ],
  },
  "custom-die-cut": {
    title: "กล่องไดคัทตามรูปแบบ",
    intro:
      "อธิบายวิธีใช้งาน โครงสร้างที่ต้องการ และข้อจำกัดของสินค้าให้ชัดก่อนประเมิน",
    fields: [
      "ภาพหรือสินค้าตัวอย่าง",
      "วิธีเปิด ปิด และจัดวาง",
      "ขนาดและน้ำหนักสินค้า",
      "จำนวน กำหนดใช้ และอาร์ตเวิร์ก",
    ],
  },
} as const;
export function generateStaticParams() {
  return Object.keys(products).map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = products[(await params).slug as keyof typeof products];
  return product
    ? {
        title: product.title,
        description: product.intro,
        alternates: { canonical: `/products/${(await params).slug}` },
      }
    : {};
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = products[slug as keyof typeof products];
  if (!product) notFound();
  return (
    <section className="page-section">
      <div className="shell detail-layout">
        <div>
          <p className="eyebrow">PRODUCT BRIEF</p>
          <h1>{product.title}</h1>
          <p className="lead">{product.intro}</p>
          <Link
            className="button"
            href={`/quote?path=has_specifications&product=${slug}`}
          >
            ส่งข้อมูลกล่องประเภทนี้
          </Link>
        </div>
        <aside className="brief-list">
          <h2>ข้อมูลที่ควรเตรียม</h2>
          <ol>
            {product.fields.map((field, index) => (
              <li key={field}>
                <span>0{index + 1}</span>
                {field}
              </li>
            ))}
          </ol>
          <p>
            หากยังไม่มีข้อมูลครบ ให้เลือกเส้นทาง “ต้องการคำแนะนำ” ในแบบฟอร์ม
          </p>
        </aside>
      </div>
    </section>
  );
}
