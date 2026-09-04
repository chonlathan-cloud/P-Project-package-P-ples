import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { byDisplayOrder, pageSection } from "@/features/content/types";
import { getPublishedOffers, getPublishedPage } from "@/lib/content-api";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const page = await getPublishedPage("solutions");
    return {
      title: page.content.seo.title ?? page.content.title,
      description: page.content.seo.description ?? page.content.summary,
      alternates: {
        canonical: page.content.seo.canonical_override ?? "/solutions",
      },
    };
  } catch {
    return { title: "เลือกวิธีเริ่มงานกล่อง", robots: { index: false } };
  }
}

export default async function SolutionsPage() {
  const [offersResult, pageResult] = await Promise.allSettled([
    getPublishedOffers(),
    getPublishedPage("solutions"),
  ]);
  if (offersResult.status === "rejected" || pageResult.status === "rejected") {
    return (
      <section className="section shell error-state" role="status">
        <h1>ยังโหลดวิธีเริ่มงานไม่ได้</h1>
        <p>
          ส่งข้อมูลที่มีให้ทีมช่วยจัด brief และเลือกเส้นทางที่เหมาะได้โดยตรง
        </p>
        <Link className="button" href="/quote?path=needs_guidance">
          ส่งข้อมูลให้ทีมช่วยแนะนำ
        </Link>
      </section>
    );
  }

  const offers = offersResult.value.toSorted(byDisplayOrder);
  const page = pageResult.value;
  const paths = pageSection(page, "paths", "entity_list");
  const commonInputs = pageSection(page, "common-inputs", "text");
  const guidance = pageSection(page, "guidance", "cta");
  const orderedOffers = paths
    ? offers.toSorted((left, right) => {
        const leftIndex = paths.entity_ids.indexOf(left.content.slug);
        const rightIndex = paths.entity_ids.indexOf(right.content.slug);
        return (
          (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
            (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex) ||
          byDisplayOrder(left, right)
        );
      })
    : offers;

  return (
    <>
      <section className="solution-overview-hero">
        <div className="shell solution-overview-grid">
          <div className="solution-overview-copy">
            <p className="eyebrow">เลือกวิธีเริ่มงาน</p>
            <h1>{page.content.title}</h1>
            <p className="lead">{page.content.summary}</p>
            <Link className="text-link" href="/products">
              หากกำลังเลือกประเภทกล่อง ดูหน้า Products →
            </Link>
          </div>
          <figure className="solution-overview-media">
            <Image
              src="/images/generated/solutions-workflow-v1.webp"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
              alt="ภาพประกอบโต๊ะทำงานที่มีภาพร่าง แบบคลี่ ตัวอย่างวัสดุ และกล่องหลายระยะของการเตรียมงาน"
            />
            <figcaption>
              ภาพประกอบเพื่ออธิบายขั้นตอนเตรียมข้อมูล ไม่ใช่ผลงานลูกค้า
            </figcaption>
          </figure>
        </div>
      </section>

      <section
        className="section solution-paths-section"
        aria-labelledby="solution-paths-title"
      >
        <div className="shell solution-paths-heading">
          <p className="eyebrow">CHOOSE FROM WHAT YOU HAVE</p>
          <h2 id="solution-paths-title">
            {paths?.heading ?? "วิธีเริ่มงานที่เผยแพร่"}
          </h2>
          <p>
            ทั้งสามเส้นทางใช้เพื่อจัด brief ให้เหมาะกับความพร้อมของงาน
            ไม่ใช่แพ็กเกจราคาหรือการรับรองเงื่อนไขการผลิต
          </p>
        </div>
        {orderedOffers.length > 0 ? (
          <div className="shell solution-path-list">
            {orderedOffers.map(({ content: offer }, index) => (
              <article className="solution-path-row" key={offer.slug}>
                <span className="solution-path-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="solution-path-intro">
                  <p>{offer.status_label}</p>
                  <h3>{offer.title}</h3>
                  <p>{offer.summary}</p>
                </div>
                <div className="solution-path-column">
                  <h4>เหมาะเมื่อ</h4>
                  <ul>
                    {offer.benefits.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="solution-path-column">
                  <h4>เริ่มส่งข้อมูล</h4>
                  <ul>
                    {offer.inputs.slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <Link
                  className="solution-path-link"
                  href={`/solutions/${offer.slug}`}
                >
                  ดูวิธีเริ่มเส้นทางนี้ →
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="section shell empty-state">
            <h2>ยังไม่มีวิธีเริ่มงานที่เผยแพร่</h2>
            <p>ส่งรายละเอียดที่มีให้ทีมช่วยจัดลำดับข้อมูลได้โดยตรง</p>
          </div>
        )}
      </section>

      {commonInputs ? (
        <section className="solution-common-section">
          <div className="shell solution-common-grid">
            <div>
              <p className="eyebrow">ส่งเท่าที่มี</p>
              <h2>{commonInputs.heading}</h2>
              {commonInputs.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {guidance ? (
                <Link className="button button-yellow" href={guidance.href}>
                  {guidance.label}
                </Link>
              ) : null}
            </div>
            <ol className="solution-common-list">
              {commonInputs.bullets.map((item, index) => (
                <li key={item}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item}</strong>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}
    </>
  );
}
