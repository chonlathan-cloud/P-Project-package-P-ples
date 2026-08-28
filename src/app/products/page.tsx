import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { products } from "@/content/products";

export const metadata: Metadata = {
  title: "ประเภทกล่อง",
  description: "สำรวจประเภทกล่องและข้อมูลที่ควรเตรียมก่อนส่งรายละเอียดงาน",
  alternates: { canonical: "/products" },
};
export default function ProductsPage() {
  return (
    <>
      <section className="page-section products-page">
        <div className="shell page-heading product-page-heading">
          <p className="eyebrow">BOX TYPES</p>
          <h1>
            เลือกกล่องจากสินค้า
            <br />
            และวิธีใช้งานจริง
          </h1>
          <p>
            เลือกประเภทกล่องเพื่อเตรียมข้อมูลเบื้องต้น ทีมจะตรวจสอบวัสดุ จำนวน
            และข้อกำหนดก่อนยืนยันการผลิต
          </p>
        </div>

        <div className="shell product-editorial-list">
          {products.map((product) => (
            <article className="product-editorial-row" key={product.slug}>
              <div className="product-editorial-media">
                <Image
                  src={product.heroImage}
                  fill
                  sizes="(max-width: 760px) 100vw, 48vw"
                  alt={product.heroAlt}
                />
                <span>ภาพจำลองเพื่ออธิบายประเภทกล่อง</span>
              </div>
              <div className="product-editorial-copy">
                <p className="product-number">{product.number}</p>
                <h2>{product.title}</h2>
                <p className="lead">{product.summary}</p>

                <div className="product-decision-columns">
                  <div>
                    <h3>งานในกลุ่มนี้</h3>
                    <ul>
                      {product.applications.map((item) => (
                        <li key={item.title}>{item.title}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3>ข้อมูลเริ่มต้น</h3>
                    <ul>
                      {product.brief.slice(0, 3).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link className="text-link" href={`/products/${product.slug}`}>
                  ดูโครงสร้างและข้อมูลที่ควรเตรียม →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="product-guidance-band">
        <div className="shell product-guidance-inner">
          <div>
            <p className="eyebrow">CHOOSE YOUR START</p>
            <h2>ยังไม่แน่ใจว่าควรเริ่มจากกล่องแบบไหน</h2>
            <p>
              เลือกแนวทางตามระยะธุรกิจ แล้วส่งข้อมูลสินค้าเท่าที่มีให้ทีมช่วยจัด
              brief
            </p>
          </div>
          <Link className="button button-yellow" href="/solutions">
            เลือกตามระยะธุรกิจ
          </Link>
        </div>
      </section>
    </>
  );
}
