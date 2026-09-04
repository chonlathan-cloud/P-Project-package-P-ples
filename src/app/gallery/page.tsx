import type { Metadata } from "next";
import Link from "next/link";
import { ProjectImageGallery } from "@/features/gallery/project-image-gallery";
import type { GalleryItem, PricingBenchmark } from "@/features/gallery/types";
import { getPublishedGallery, getPublishedPricing } from "@/lib/content-api";
import {
  formatBenchmarkRange,
  formatStartingPrice,
} from "@/lib/pricing-format";

export const metadata: Metadata = {
  title: "ผลงานและราคาเริ่มต้นงานพิมพ์และบรรจุภัณฑ์",
  description:
    "ดูแนวทางรูปแบบ วัสดุ และราคาเริ่มต้นโดยประมาณของงานพิมพ์และบรรจุภัณฑ์",
  alternates: { canonical: "/gallery" },
};

function Project({
  item,
  price,
  index,
}: {
  item: GalleryItem;
  price?: PricingBenchmark;
  index: number;
}) {
  return (
    <article className="portfolio-project">
      <ProjectImageGallery images={item.images} title={item.title} />
      <div className="project-copy">
        <div className="project-index" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </div>
        <p className="project-kicker">
          {item.evidence_type === "concept"
            ? "ภาพแนะนำ"
            : "ผลงานที่ได้รับอนุญาต"}
          <span aria-hidden="true"> / </span>
          {item.category}
        </p>
        <h3>{item.title}</h3>
        <p className="project-summary">{item.summary}</p>
        <dl className="project-specs">
          {item.specs.material ? (
            <div>
              <dt>วัสดุ</dt>
              <dd>{item.specs.material}</dd>
            </div>
          ) : null}
          {item.specs.quantity ? (
            <div>
              <dt>จำนวนอ้างอิง</dt>
              <dd>{item.specs.quantity}</dd>
            </div>
          ) : null}
          {item.specs.application ? (
            <div>
              <dt>เหมาะกับ</dt>
              <dd>{item.specs.application}</dd>
            </div>
          ) : null}
        </dl>
        {price ? (
          <div className="project-price">
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
            </dl>
            <small>{price.disclaimer}</small>
          </div>
        ) : null}
        <Link
          className="button project-cta"
          href={{
            pathname: "/quote",
            query: {
              path: "has_specifications",
              product_type: item.category,
              reference: item.title,
            },
          }}
        >
          ส่งสเปกงานลักษณะนี้
        </Link>
      </div>
    </article>
  );
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const selectedCategory = (await searchParams).category;
  let items: GalleryItem[] = [];
  let prices: PricingBenchmark[] = [];
  let unavailable = false;

  try {
    [items, prices] = await Promise.all([
      getPublishedGallery(),
      getPublishedPricing(),
    ]);
  } catch {
    unavailable = true;
  }

  const categories = [...new Set(items.map((item) => item.category))];
  const recommendedItems = items.filter(
    (item) => item.evidence_type === "concept",
  );
  const visibleItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : recommendedItems;
  const priceById = new Map(prices.map((price) => [price.id, price]));
  const customerWork = visibleItems.filter(
    (item) => item.evidence_type === "customer_work",
  );
  const concepts = visibleItems.filter(
    (item) => item.evidence_type === "concept",
  );

  return (
    <main className="gallery-page">
      <section className="gallery-hero">
        <div className="shell gallery-hero-layout">
          <div>
            <p className="eyebrow">PRINT &amp; PACKAGING REFERENCES</p>
            <h1>ดูงานจริง เข้าใจรูปแบบ และเห็นกรอบงบก่อนเริ่มคุย</h1>
          </div>
          <div className="gallery-hero-copy">
            <p>
              รวมผลงานที่ได้รับอนุญาตและภาพแนะนำเพื่อช่วยเลือกประเภทงาน
              แต่ละรายการแสดงวัสดุ รูปแบบ และมุมรายละเอียด
              และราคาเริ่มต้นจากฐานข้อมูลล่าสุด
            </p>
            <p className="gallery-price-caution">
              ราคาเป็นเพียงข้อมูลประมาณการ ไม่ใช่ใบเสนอราคา
            </p>
          </div>
        </div>
      </section>

      {!unavailable && categories.length > 0 ? (
        <nav className="gallery-filters shell" aria-label="กรองประเภทผลงาน">
          <Link
            aria-current={!selectedCategory ? "page" : undefined}
            href="/gallery"
          >
            ภาพแนะนำทั้งหมด <span>{recommendedItems.length}</span>
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              aria-current={selectedCategory === category ? "page" : undefined}
              href={{ pathname: "/gallery", query: { category } }}
            >
              {category}{" "}
              <span>
                {items.filter((item) => item.category === category).length}
              </span>
            </Link>
          ))}
        </nav>
      ) : null}

      {unavailable ? (
        <section className="section shell error-state" role="status">
          <p className="eyebrow">TEMPORARILY UNAVAILABLE</p>
          <h2>ยังโหลดข้อมูลผลงานไม่ได้</h2>
          <p>
            ระบบไม่แสดงข้อมูลสำรองที่อาจล้าสมัย กรุณาลองใหม่หรือติดต่อทีมโดยตรง
          </p>
          <Link className="button" href="/contact">
            ติดต่อทีม DD Box
          </Link>
        </section>
      ) : visibleItems.length === 0 ? (
        <section className="section shell empty-state">
          <h2>ยังไม่มีผลงานในหมวดนี้</h2>
          <p>
            เลือกดูทั้งหมด หรือส่งข้อมูลสินค้าให้ทีมช่วยแนะนำรูปแบบที่เหมาะสม
          </p>
          <Link className="button" href="/gallery">
            ดูผลงานทั้งหมด
          </Link>
        </section>
      ) : (
        <>
          {concepts.length > 0 ? (
            <section
              className="portfolio-section shell"
              aria-labelledby="concept-heading"
            >
              <header className="portfolio-heading concept-heading">
                <div>
                  <p className="eyebrow">FORMAT &amp; BUDGET GUIDE</p>
                  <h2 id="concept-heading">ตัวอย่างรูปแบบและงบประมาณ</h2>
                </div>
                <p>
                  ภาพในส่วนนี้ใช้ประกอบเพื่อแนะนำรูปแบบเท่านั้น
                  ไม่ใช่ผลงานของลูกค้าหรือสินค้าที่ผลิตจริง
                </p>
              </header>
              {concepts.map((item, index) => (
                <Project
                  key={item.id}
                  item={item}
                  index={index}
                  price={
                    item.pricing_benchmark_id
                      ? priceById.get(item.pricing_benchmark_id)
                      : undefined
                  }
                />
              ))}
            </section>
          ) : null}

          {customerWork.length > 0 ? (
            <section
              className="portfolio-section shell"
              aria-labelledby="real-work-heading"
            >
              <header className="portfolio-heading">
                <p className="eyebrow">APPROVED CUSTOMER WORK</p>
                <h2 id="real-work-heading">ผลงานที่ได้รับอนุญาต</h2>
              </header>
              {customerWork.map((item, index) => (
                <Project
                  key={item.id}
                  item={item}
                  index={index}
                  price={
                    item.pricing_benchmark_id
                      ? priceById.get(item.pricing_benchmark_id)
                      : undefined
                  }
                />
              ))}
            </section>
          ) : null}
        </>
      )}

      <section className="section gallery-closing">
        <div className="shell gallery-closing-inner">
          <div>
            <p className="eyebrow">YOUR PRODUCT, YOUR SPEC</p>
            <h2>มีสินค้าแล้ว แต่ยังไม่แน่ใจว่าจะเริ่มจากงานแบบไหน?</h2>
          </div>
          <Link
            className="button button-yellow"
            href="/quote?path=needs_guidance"
          >
            ส่งข้อมูลสินค้าให้ทีมแนะนำ
          </Link>
        </div>
      </section>
    </main>
  );
}
