import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GalleryGrid } from "@/components/gallery-grid";
import { getApprovedClientBrands } from "@/content/client-brands";
import { byDisplayOrder, pageSection } from "@/features/content/types";
import { selectHomeGalleryItems } from "@/features/gallery/home-selection";
import {
  getPublishedGallery,
  getPublishedOffers,
  getPublishedPage,
  getPublishedProducts,
} from "@/lib/content-api";

const capabilityClasses = [
  "capability-wide",
  "capability-tall",
  "capability-standard",
  "capability-sticker",
  "capability-media",
] as const;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const page = await getPublishedPage("home");
    return {
      title: page.content.seo.title ?? page.content.title,
      description: page.content.seo.description ?? page.content.summary,
      alternates: { canonical: page.content.seo.canonical_override ?? "/" },
    };
  } catch {
    return { title: "DD Box Printing", robots: { index: false } };
  }
}

export default async function HomePage() {
  const clientBrands = getApprovedClientBrands();
  const [pageResult, productsResult, offersResult, galleryResult] =
    await Promise.allSettled([
      getPublishedPage("home"),
      getPublishedProducts(),
      getPublishedOffers(),
      getPublishedGallery(),
    ]);

  if (pageResult.status === "rejected") {
    return (
      <section className="section shell error-state" role="status">
        <h1>ยังโหลดข้อมูลหน้าแรกไม่ได้</h1>
        <p>ลองโหลดหน้านี้อีกครั้ง หรือส่งรายละเอียดงานให้ทีมตรวจสอบได้โดยตรง</p>
        <Link className="button" href="/quote">
          ส่งรายละเอียดงาน
        </Link>
      </section>
    );
  }

  const page = pageResult.value;
  const hero = pageSection(page, "hero", "text");
  const productSection = pageSection(page, "products", "entity_list");
  const capabilitySection = pageSection(page, "capabilities", "text");
  const offerSection = pageSection(page, "offers", "entity_list");
  const processSection = pageSection(page, "process", "text");
  const closing = pageSection(page, "closing", "cta");
  const products =
    productsResult.status === "fulfilled"
      ? productsResult.value.toSorted(byDisplayOrder)
      : [];
  const offers =
    offersResult.status === "fulfilled"
      ? offersResult.value.toSorted(byDisplayOrder)
      : [];
  const gallery =
    galleryResult.status === "fulfilled"
      ? selectHomeGalleryItems(galleryResult.value)
      : [];

  return (
    <>
      <section className="storefront-hero">
        <Image
          className="hero-image"
          src="/images/generated/hero-print-production-v2.webp"
          fill
          priority
          sizes="100vw"
          alt="ภาพประกอบพื้นที่ผลิตสิ่งพิมพ์และเครื่องพิมพ์ออฟเซ็ต"
        />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="shell hero-content">
          <p className="eyebrow hero-kicker">CUSTOM PRINT &amp; PACKAGING</p>
          <h1>{hero?.heading ?? page.content.title}</h1>
          <p className="lead">{hero?.paragraphs[0] ?? page.content.summary}</p>
          <div className="hero-actions">
            <Link
              className="button button-yellow"
              href="/quote?path=has_specifications"
            >
              ส่งสเปกเพื่อขอราคา
            </Link>
            <Link
              className="button button-outline-light"
              href="/quote?path=needs_guidance"
            >
              ต้องการคำแนะนำ
            </Link>
          </div>
        </div>
      </section>

      <section className="section capabilities-section">
        <div className="shell section-heading split-heading">
          <div>
            <p className="eyebrow">OUR CAPABILITIES</p>
            <h2>{productSection?.heading ?? "สินค้าและงานพิมพ์ที่เผยแพร่"}</h2>
          </div>
          <Link className="text-link" href="/products">
            ดูสินค้าและงานพิมพ์ทั้งหมด →
          </Link>
        </div>
        {productsResult.status === "rejected" ? (
          <div className="shell error-state" role="status">
            <h2>ยังโหลดรายการสินค้าไม่ได้</h2>
            <p>
              ดูข้อมูลเพิ่มเติมอีกครั้งภายหลัง หรือส่งรายละเอียดให้ทีมช่วยแนะนำ
            </p>
          </div>
        ) : products.length > 0 ? (
          <div className="shell capability-grid">
            {products.map(({ content: product }, index) => (
              <Link
                className={`capability-card ${capabilityClasses[index] ?? "capability-standard"}`}
                href={`/products/${product.slug}`}
                key={product.slug}
              >
                {product.hero_image ? (
                  <Image
                    src={product.hero_image.src}
                    fill
                    sizes="(max-width: 760px) 100vw, 60vw"
                    alt={product.hero_image.alt}
                  />
                ) : null}
                <span className="capability-shade" aria-hidden="true" />
                <span className="capability-copy">
                  <strong>{product.title}</strong>
                  <small>{product.summary}</small>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="shell empty-state">
            <h2>ยังไม่มีสินค้าที่เผยแพร่</h2>
            <p>ส่งรายละเอียดสินค้าให้ทีมช่วยเลือกประเภทงานได้โดยตรง</p>
          </div>
        )}
      </section>

      {capabilitySection?.items.length ? (
        <section
          className="workflow-proof"
          aria-label={capabilitySection.heading}
        >
          <div className="shell proof-grid">
            {capabilitySection.items.map((item) => (
              <div key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section proof-intro">
        <div className="shell section-heading split-heading">
          <div>
            <p className="eyebrow">SELECTED WORK</p>
            <h2>ตัวอย่างภาพและแนวทางโครงสร้าง</h2>
          </div>
          <Link className="text-link" href="/gallery">
            ดูแกลเลอรีและคำอธิบาย →
          </Link>
        </div>
        <div className="shell">
          <GalleryGrid items={gallery} />
        </div>
      </section>

      <section className="section offer-section">
        <div className="shell offers-layout">
          <div className="section-heading">
            <p className="eyebrow">CHOOSE YOUR START</p>
            <h2>{offerSection?.heading ?? "วิธีเริ่มงานที่เผยแพร่"}</h2>
          </div>
          {offersResult.status === "rejected" ? (
            <div className="error-state" role="status">
              <h2>ยังโหลดวิธีเริ่มงานไม่ได้</h2>
              <p>ส่งข้อมูลที่มีให้ทีมช่วยจัด brief ได้โดยตรง</p>
            </div>
          ) : offers.length > 0 ? (
            <div className="offer-rows">
              {offers.map(({ content: offer }, index) => (
                <Link href={`/solutions/${offer.slug}`} key={offer.slug}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{offer.status_label ?? offer.title}</h3>
                  <p>{offer.title}</p>
                  <strong>ดูวิธีเริ่มงาน →</strong>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>ยังไม่มีวิธีเริ่มงานที่เผยแพร่</h2>
              <p>ส่งข้อมูลเท่าที่มีให้ทีมช่วยจัดลำดับได้โดยตรง</p>
            </div>
          )}
        </div>
      </section>

      {processSection?.items.length ? (
        <section className="section process-section">
          <div className="shell process-grid">
            <div>
              <p className="eyebrow">BRIEF TO EVALUATION</p>
              <h2>{processSection.heading}</h2>
            </div>
            <ol>
              {processSection.items.map((item, index) => (
                <li key={item.title}>
                  <span>{index + 1}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {clientBrands.length > 0 && (
        <section
          className="section client-proof-section"
          aria-labelledby="client-proof-heading"
        >
          <div className="shell client-proof-layout">
            <div className="client-proof-heading">
              <p className="eyebrow">SELECTED CLIENTS</p>
              <h2 id="client-proof-heading">แบรนด์ที่เคยร่วมงานกับ DD Box</h2>
              <p>
                ตัวอย่างแบรนด์ที่ร่วมผลิตงานบรรจุภัณฑ์
                และอนุญาตให้เผยแพร่ชื่อและโลโก้
              </p>
            </div>
            <ul className="client-logo-grid">
              {clientBrands.map((brand) => (
                <li key={brand.id}>
                  <Image
                    className={`client-logo client-logo--${brand.logoPresentation}`}
                    src={brand.logoSrc}
                    width={brand.logoWidth}
                    height={brand.logoHeight}
                    sizes="(max-width: 640px) 38vw, 160px"
                    alt={brand.logoAlt}
                  />
                  <span>{brand.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {closing ? (
        <section className="section closing-cta">
          <div className="shell closing-cta-inner">
            <p className="eyebrow">START YOUR PROJECT</p>
            <h2>{closing.heading}</h2>
            <p>{closing.body}</p>
            <Link className="button" href={closing.href}>
              {closing.label}
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}
