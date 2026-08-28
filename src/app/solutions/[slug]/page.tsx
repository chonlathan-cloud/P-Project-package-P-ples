import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const solutions = {
  starter: {
    label: "STARTER",
    title: "เริ่มสินค้าใหม่",
    intro:
      "สำหรับทีมที่กำลังเปลี่ยนแนวคิดสินค้าให้เป็น brief บรรจุภัณฑ์ที่ประเมินได้",
    points: [
      "เริ่มจากสินค้าและวิธีขาย",
      "จัดลำดับข้อมูลที่ยังขาด",
      "หลีกเลี่ยงการสรุปราคาก่อนสเปกชัด",
    ],
  },
  growth: {
    label: "GROWTH",
    title: "จัดระบบบรรจุภัณฑ์สำหรับแบรนด์ที่เติบโต",
    intro: "สำหรับงานที่ต้องการสเปกซ้ำได้และภาพลักษณ์สอดคล้องกันระหว่างสินค้า",
    points: [
      "จัดระเบียบขนาด วัสดุ และอาร์ตเวิร์ก",
      "เชื่อมผลงานตัวอย่างกับประเภทสินค้า",
      "เตรียมข้อมูลสำหรับการสั่งซ้ำ",
    ],
  },
  scale: {
    label: "SCALE",
    title: "วาง brief สำหรับงานผลิตต่อเนื่อง",
    intro:
      "สำหรับฝ่ายจัดซื้อหรือทีมปฏิบัติการที่ต้องประเมินข้อกำหนดและแผนการส่งมอบร่วมกัน",
    points: [
      "ระบุปริมาณและรอบความต้องการ",
      "บันทึกข้อกำหนดที่ต้องควบคุม",
      "เตรียมปลายทางและข้อจำกัดการจัดส่ง",
    ],
  },
} as const;
export function generateStaticParams() {
  return Object.keys(solutions).map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const solution = solutions[slug as keyof typeof solutions];
  return solution
    ? {
        title: solution.title,
        description: solution.intro,
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
  const solution = solutions[slug as keyof typeof solutions];
  if (!solution) notFound();
  return (
    <section className="page-section solution-page">
      <div className="shell detail-layout">
        <div>
          <p className="eyebrow">{solution.label}</p>
          <h1>{solution.title}</h1>
          <p className="lead">{solution.intro}</p>
          <Link
            className="button"
            href={
              slug === "starter"
                ? "/quote?path=needs_guidance"
                : "/quote?path=has_specifications"
            }
          >
            เลือกเส้นทางนี้
          </Link>
        </div>
        <ol className="solution-points">
          {solution.points.map((point, index) => (
            <li key={point}>
              <span>0{index + 1}</span>
              <p>{point}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
