import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { byDisplayOrder, pageSection } from "@/features/content/types";
import { getPublishedPage, getPublishedProducts } from "@/lib/content-api";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const page = await getPublishedPage("products");
    return {
      title: page.content.seo.title ?? page.content.title,
      description: page.content.seo.description ?? page.content.summary,
      alternates: {
        canonical: page.content.seo.canonical_override ?? "/products",
      },
    };
  } catch {
    return { title: "สินค้าและงานพิมพ์", robots: { index: false } };
  }
}

export default async function ProductsPage() {
  const [productsResult, pageResult] = await Promise.allSettled([
    getPublishedProducts(),
    getPublishedPage("products"),
  ]);

  if (
    productsResult.status === "rejected" ||
    pageResult.status === "rejected"
  ) {
    return (
      <section className="section shell error-state" role="status">
        <h1>ยังโหลดสินค้าและงานพิมพ์ไม่ได้</h1>
        <p>
          ลองโหลดหน้านี้อีกครั้ง หรือส่งข้อมูลสินค้าให้ทีมช่วยจัด brief ได้เลย
        </p>
        <Link className="button" href="/quote?path=needs_guidance">
          ส่งข้อมูลให้ทีมช่วยแนะนำ
        </Link>
      </section>
    );
  }

  const products = productsResult.value.toSorted(byDisplayOrder);
  const page = pageResult.value;
  const catalog = pageSection(page, "catalog", "entity_list");
  const guidance = pageSection(page, "guidance", "cta");
  const orderedProducts = catalog
    ? products.toSorted((left, right) => {
        const leftIndex = catalog.entity_ids.indexOf(left.content.slug);
        const rightIndex = catalog.entity_ids.indexOf(right.content.slug);
        return (
          (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
            (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex) ||
          byDisplayOrder(left, right)
        );
      })
    : products;

  return (
    <>
      <section className="page-section products-page">
        <div className="shell page-heading product-page-heading">
          <p className="eyebrow">PRINT &amp; PACKAGING</p>
          <h1>{page.content.title}</h1>
          <p>{page.content.summary}</p>
        </div>

        {orderedProducts.length > 0 ? (
          <div className="shell product-editorial-list">
            {orderedProducts.map(({ content: product }, index) => (
              <article className="product-editorial-row" key={product.slug}>
                <div className="product-editorial-media">
                  {product.hero_image ? (
                    <Image
                      src={product.hero_image.src}
                      fill
                      sizes="(max-width: 760px) 100vw, 48vw"
                      alt={product.hero_image.alt}
                    />
                  ) : (
                    <span className="product-media-empty">
                      ยังไม่มีภาพที่เผยแพร่
                    </span>
                  )}
                  {product.hero_image ? (
                    <span>ภาพประกอบเพื่ออธิบายประเภทงาน</span>
                  ) : null}
                </div>
                <div className="product-editorial-copy">
                  <p className="product-number">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2>{product.title}</h2>
                  <p className="lead">{product.summary}</p>

                  <div className="product-decision-columns">
                    <div>
                      <h3>งานในกลุ่มนี้</h3>
                      <ul>
                        {(product.applications.length > 0
                          ? product.applications.map((item) => item.title)
                          : product.use_cases
                        ).map((item) => (
                          <li key={item}>{item}</li>
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

                  <Link
                    className="text-link"
                    href={`/products/${product.slug}`}
                  >
                    ดูรายละเอียดและข้อมูลที่ควรเตรียม →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="section shell empty-state">
            <h2>ยังไม่มีสินค้าที่เผยแพร่</h2>
            <p>ส่งรายละเอียดสินค้าให้ทีมช่วยเลือกประเภทงานได้โดยตรง</p>
            <Link className="button" href="/quote?path=needs_guidance">
              ส่งข้อมูลให้ทีมช่วยแนะนำ
            </Link>
          </div>
        )}
      </section>

      {guidance ? (
        <section className="product-guidance-band">
          <div className="shell product-guidance-inner">
            <div>
              <p className="eyebrow">CHOOSE YOUR START</p>
              <h2>{guidance.heading}</h2>
              <p>{guidance.body}</p>
            </div>
            <Link className="button button-yellow" href={guidance.href}>
              {guidance.label}
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}
