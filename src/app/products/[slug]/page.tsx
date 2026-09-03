import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getProduct, products } from "@/content/products";
import type { PricingBenchmark } from "@/features/gallery/types";
import { getPublishedPricing } from "@/lib/content-api";
import {
  formatBenchmarkRange,
  formatStartingPrice,
} from "@/lib/pricing-format";

export function generateStaticParams() {
  return products.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  return product
    ? {
        title: product.title,
        description: product.summary,
        alternates: { canonical: `/products/${slug}` },
      }
    : {};
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const relatedProducts = products.filter((item) => item.slug !== product.slug);
  let price: PricingBenchmark | undefined;
  try {
    const prices = await getPublishedPricing();
    price = prices.find((item) => item.id === product.pricingBenchmarkId);
  } catch {
    price = undefined;
  }

  return (
    <>
      <section className="product-detail-hero">
        <div className="shell product-detail-hero-grid">
          <div className="product-detail-intro">
            <p className="eyebrow">PRODUCT GUIDE · {product.number}</p>
            <h1>{product.title}</h1>
            <p className="lead">{product.overview}</p>
            <div className="product-detail-actions">
              <Link
                className="button"
                href={`/quote?path=has_specifications&product=${slug}`}
              >
                ส่งสเปกงานประเภทนี้
              </Link>
              <Link
                className="text-link"
                href={`/quote?path=needs_guidance&product=${slug}`}
              >
                ยังไม่มีสเปก ให้ทีมช่วยจัด brief →
              </Link>
            </div>
          </div>
          <figure className="product-detail-hero-media">
            <Image
              src={product.heroImage}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 48vw"
              alt={product.heroAlt}
            />
            <figcaption>ภาพจำลองเพื่ออธิบายแนวทางของงาน</figcaption>
          </figure>
        </div>
      </section>

      <section className="section product-fit-section">
        <div className="shell product-fit-grid">
          <figure className="product-evidence-media">
            <Image
              src={product.evidenceImage}
              fill
              sizes="(max-width: 900px) 100vw, 52vw"
              alt={product.evidenceAlt}
            />
            <figcaption>
              ภาพจำลองเพื่ออธิบายวัสดุและโครงสร้าง ไม่ใช่ผลงานลูกค้า
            </figcaption>
          </figure>
          <div className="product-fit-copy">
            <p className="eyebrow">PRODUCT FIT</p>
            <h2>งานประเภทนี้เหมาะเมื่อ</h2>
            <ul className="product-fit-list">
              {product.fit.map((item, index) => (
                <li key={item}>
                  <span>0{index + 1}</span>
                  <p>{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {price ? (
        <section className="section product-pricing-section">
          <div className="shell product-pricing-grid">
            <div>
              <p className="eyebrow">PRICE BENCHMARK</p>
              <h2>กรอบงบประมาณก่อนส่งสเปกจริง</h2>
              <p className="product-pricing-intro">
                ใช้ตัวเลขนี้เพื่อวางแผนเบื้องต้น
                ระบบดึงข้อมูลล่าสุดจากฐานข้อมูลและไม่ถือเป็นใบเสนอราคา
              </p>
            </div>
            <div className="product-pricing-data">
              <p>ราคาเริ่มต้นโดยประมาณ</p>
              <strong>{formatStartingPrice(price)}</strong>
              <dl>
                <div>
                  <dt>ช่วงราคาอ้างอิง</dt>
                  <dd>{formatBenchmarkRange(price)}</dd>
                </div>
                {price.quantity_basis ? (
                  <div>
                    <dt>ฐานจำนวน</dt>
                    <dd>{price.quantity_basis}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>วัสดุทั่วไป</dt>
                  <dd>{price.material}</dd>
                </div>
              </dl>
              <small>{price.disclaimer}</small>
              <Link
                className="text-link"
                href={`/quote?path=has_specifications&product=${slug}`}
              >
                ส่งสเปกเพื่อประเมินราคาจริง →
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section product-application-section">
        <div className="shell product-application-grid">
          <div>
            <p className="eyebrow">APPLICATIONS</p>
            <h2>งานที่ใช้กลุ่มนี้เป็นจุดเริ่ม</h2>
            <p>
              ชื่อด้านล่างเป็นแนวทางจัด brief เบื้องต้น
              ทีมจะตรวจสอบโครงสร้างและเงื่อนไขของแต่ละงานอีกครั้ง
            </p>
          </div>
          <ol className="product-application-list">
            {product.applications.map((application, index) => (
              <li key={application.title}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{application.title}</h3>
                  <p>{application.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section product-spec-section">
        <div className="shell product-spec-grid">
          <div className="section-heading">
            <p className="eyebrow">DECISION POINTS</p>
            <h2>สิ่งที่ควรตัดสินใจร่วมกัน</h2>
            <p>
              ไม่จำเป็นต้องมีคำตอบครบก่อนเริ่ม
              ส่งข้อมูลที่มีเพื่อให้ทีมระบุสิ่งที่ต้องตรวจสอบต่อ
            </p>
          </div>
          <dl className="product-decision-list">
            {product.decisions.map((decision, index) => (
              <div key={decision.title}>
                <dt>
                  <span>0{index + 1}</span>
                  {decision.title}
                </dt>
                <dd>{decision.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section product-brief-section">
        <div className="shell product-brief-grid">
          <div>
            <p className="eyebrow">STARTING BRIEF</p>
            <h2>ข้อมูลที่ควรเตรียม</h2>
          </div>
          <ol className="brief-list product-brief-list">
            {product.brief.map((field, index) => (
              <li key={field}>
                <span>0{index + 1}</span>
                {field}
              </li>
            ))}
          </ol>
          <aside className="product-guidance-note">
            <h3>ข้อมูลยังไม่ครบก็เริ่มได้</h3>
            <p>
              ส่งภาพสินค้า ขนาด หรือกล่องเดิมเท่าที่มี
              แล้วเลือกเส้นทางต้องการคำแนะนำในแบบฟอร์ม
            </p>
            <Link
              className="text-link"
              href={`/quote?path=needs_guidance&product=${slug}`}
            >
              ให้ทีมช่วยจัดลำดับข้อมูล →
            </Link>
          </aside>
        </div>
      </section>

      <section className="section product-faq-section">
        <div className="shell product-faq-grid">
          <div>
            <p className="eyebrow">COMMON QUESTIONS</p>
            <h2>คำถามก่อนส่งรายละเอียด</h2>
          </div>
          <div className="product-faq-list">
            {product.faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="related-products">
        <div className="shell related-products-inner">
          <div>
            <p className="eyebrow">RELATED SERVICES</p>
            <h2>เปรียบเทียบกับงานประเภทอื่น</h2>
          </div>
          <nav aria-label="สินค้าและงานพิมพ์ที่เกี่ยวข้อง">
            {relatedProducts.map((item) => (
              <Link href={`/products/${item.slug}`} key={item.slug}>
                <span>{item.number}</span>
                {item.title}
                <strong aria-hidden="true">→</strong>
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section className="product-closing-cta">
        <div className="shell product-closing-inner">
          <div>
            <p className="eyebrow">START YOUR BRIEF</p>
            <h2>ส่งข้อมูลสินค้าเพื่อให้ทีมตรวจสอบงาน</h2>
          </div>
          <Link
            className="button button-yellow"
            href={`/quote?path=has_specifications&product=${slug}`}
          >
            ส่งรายละเอียดเพื่อประเมิน
          </Link>
        </div>
      </section>
    </>
  );
}
