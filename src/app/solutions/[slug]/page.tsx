import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSolution, solutions } from "@/content/solutions";

export function generateStaticParams() {
  return solutions.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const solution = getSolution(slug);

  return solution
    ? {
        title: `${solution.status}: ${solution.title}`,
        description: solution.summary,
        alternates: { canonical: `/solutions/${slug}` },
      }
    : {};
}

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const solution = getSolution(slug);
  if (!solution) notFound();

  const relatedSolutions = solutions.filter(
    (item) => item.slug !== solution.slug,
  );
  const quoteHref = `/quote?path=${solution.quotePath}`;

  return (
    <>
      <section className="solution-detail-hero">
        <div className="shell solution-detail-hero-grid">
          <div>
            <p className="eyebrow">
              SOLUTION GUIDE · {solution.number} · {solution.label}
            </p>
            <p className="solution-status">{solution.status}</p>
            <h1>{solution.title}</h1>
            <p className="lead">{solution.overview}</p>
            <Link className="button" href={quoteHref}>
              {solution.ctaLabel}
            </Link>
          </div>
          <div className="solution-fit-panel">
            <p className="eyebrow">เหมาะเมื่อ</p>
            <ol>
              {solution.fit.map((item, index) => (
                <li key={item}>
                  <span>0{index + 1}</span>
                  <strong>{item}</strong>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

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
            {solution.inputs.map((item, index) => (
              <li key={item}>
                <span>0{index + 1}</span>
                <strong>{item}</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>

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
            {solution.checks.map((item, index) => (
              <li key={item.title}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section solution-faq-section">
        <div className="shell solution-faq-grid">
          <div>
            <p className="eyebrow">COMMON QUESTIONS</p>
            <h2>คำถามก่อนเลือกเส้นทางนี้</h2>
          </div>
          <div className="solution-faq-list">
            {solution.faq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="solution-related-section">
        <div className="shell solution-related-grid">
          <div>
            <p className="eyebrow">OTHER STARTING POINTS</p>
            <h2>สถานการณ์อื่นที่อาจใกล้กับงานของคุณ</h2>
          </div>
          <nav aria-label="วิธีเริ่มงานที่เกี่ยวข้อง">
            {relatedSolutions.map((item) => (
              <Link href={`/solutions/${item.slug}`} key={item.slug}>
                <span>{item.number}</span>
                <strong>{item.status}</strong>
                <small>{item.title}</small>
                <b aria-hidden="true">→</b>
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section className="solution-closing-section">
        <div className="shell solution-closing-inner">
          <div>
            <p className="eyebrow">START FROM WHAT YOU HAVE</p>
            <h2>{solution.ctaLabel}</h2>
          </div>
          <Link className="button button-yellow" href={quoteHref}>
            ไปยังแบบฟอร์มและส่งข้อมูล
          </Link>
        </div>
      </section>
    </>
  );
}
