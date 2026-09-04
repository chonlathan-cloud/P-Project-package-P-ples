import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { byDisplayOrder } from "@/features/content/types";
import {
  ContentApiError,
  getPublishedFaqs,
  getPublishedOffer,
  getPublishedOffers,
} from "@/lib/content-api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { content } = await getPublishedOffer(slug);
    return {
      title: content.seo.title ?? content.title,
      description: content.seo.description ?? content.summary,
      alternates: {
        canonical: content.seo.canonical_override ?? `/solutions/${slug}`,
      },
    };
  } catch (error) {
    if (error instanceof ContentApiError && error.status === 404) return {};
    return { title: "วิธีเริ่มงาน", robots: { index: false } };
  }
}

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let offerDocument: Awaited<ReturnType<typeof getPublishedOffer>>;
  try {
    offerDocument = await getPublishedOffer(slug);
  } catch (error) {
    if (error instanceof ContentApiError && error.status === 404) notFound();
    throw error;
  }
  const offer = offerDocument.content;
  const [offersResult, faqsResult] = await Promise.allSettled([
    getPublishedOffers(),
    getPublishedFaqs(),
  ]);
  const allOffers =
    offersResult.status === "fulfilled"
      ? offersResult.value.toSorted(byDisplayOrder)
      : [];
  const relatedOffers = allOffers.filter(
    (item) => item.content.slug !== offer.slug,
  );
  const offerIndex = allOffers.findIndex(
    (item) => item.content.slug === offer.slug,
  );
  const faqs =
    faqsResult.status === "fulfilled"
      ? faqsResult.value
          .filter((item) =>
            item.content.page_scopes.includes(`offer:${offer.slug}`),
          )
          .toSorted((left, right) => left.content.order - right.content.order)
      : [];

  return (
    <>
      <section className="solution-detail-hero">
        <div className="shell solution-detail-hero-grid">
          <div>
            <p className="eyebrow">
              SOLUTION GUIDE ·{" "}
              {String(Math.max(offerIndex + 1, 1)).padStart(2, "0")}
              {offer.label ? ` · ${offer.label}` : ""}
            </p>
            {offer.status_label ? (
              <p className="solution-status">{offer.status_label}</p>
            ) : null}
            <h1>{offer.title}</h1>
            <p className="lead">{offer.audience}</p>
            <Link className="button" href={offer.cta_href}>
              {offer.cta_label}
            </Link>
          </div>
          {offer.benefits.length > 0 ? (
            <div className="solution-fit-panel">
              <p className="eyebrow">เหมาะเมื่อ</p>
              <ol>
                {offer.benefits.map((item, index) => (
                  <li key={item}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{item}</strong>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      </section>

      {offer.inputs.length > 0 ? (
        <section className="section solution-input-section">
          <div className="shell solution-input-grid">
            <div>
              <p className="eyebrow">STARTING INPUTS</p>
              <h2>เริ่มส่งอะไรมาได้บ้าง</h2>
              <p>
                ส่งเท่าที่มีและระบุส่วนที่ยังไม่แน่ใจ รายการนี้เป็นจุดเริ่ม
                ไม่ใช่เงื่อนไขว่าต้องมีครบก่อนติดต่อ
              </p>
            </div>
            <ol className="solution-input-list">
              {offer.inputs.map((item, index) => (
                <li key={item}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item}</strong>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {offer.checks.length > 0 ? (
        <section className="solution-check-section">
          <div className="shell solution-check-grid">
            <div>
              <p className="eyebrow">EVALUATION START</p>
              <h2>ทีมจะเริ่มตรวจอะไร</h2>
              <p>
                การตรวจข้อมูลเบื้องต้นยังไม่ใช่การยืนยันสเปก ราคา รอบผลิต
                หรือการส่งมอบ
              </p>
            </div>
            <ol className="solution-check-list">
              {offer.checks.map((item, index) => (
                <li key={item.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
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

      {faqsResult.status === "rejected" ? (
        <section className="section shell error-state" role="status">
          <h2>ยังโหลดคำถามที่พบบ่อยไม่ได้</h2>
          <p>ส่งคำถามพร้อมข้อมูลที่มีให้ทีมช่วยตรวจสอบได้โดยตรง</p>
        </section>
      ) : faqs.length > 0 ? (
        <section className="section solution-faq-section">
          <div className="shell solution-faq-grid">
            <div>
              <p className="eyebrow">COMMON QUESTIONS</p>
              <h2>คำถามก่อนเลือกเส้นทางนี้</h2>
            </div>
            <div className="solution-faq-list">
              {faqs.map(({ content: item }) => (
                <details key={item.slug}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {relatedOffers.length > 0 ? (
        <section className="solution-related-section">
          <div className="shell solution-related-grid">
            <div>
              <p className="eyebrow">OTHER STARTING POINTS</p>
              <h2>สถานการณ์อื่นที่อาจใกล้กับงานของคุณ</h2>
            </div>
            <nav aria-label="วิธีเริ่มงานที่เกี่ยวข้อง">
              {relatedOffers.map(({ content: item }, index) => (
                <Link href={`/solutions/${item.slug}`} key={item.slug}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item.status_label ?? item.title}</strong>
                  <small>{item.title}</small>
                  <b aria-hidden="true">→</b>
                </Link>
              ))}
            </nav>
          </div>
        </section>
      ) : null}

      <section className="solution-closing-section">
        <div className="shell solution-closing-inner">
          <div>
            <p className="eyebrow">START FROM WHAT YOU HAVE</p>
            <h2>{offer.cta_label}</h2>
          </div>
          <Link className="button button-yellow" href={offer.cta_href}>
            ไปยังแบบฟอร์มและส่งข้อมูล
          </Link>
        </div>
      </section>
    </>
  );
}
