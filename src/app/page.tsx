import Image from "next/image";
import Link from "next/link";
import { GalleryGrid } from "@/components/gallery-grid";
import { getApprovedClientBrands } from "@/content/client-brands";
import { solutions } from "@/content/solutions";
import type { GalleryItem } from "@/features/gallery/types";
import { getPublishedGallery } from "@/lib/content-api";

const capabilities = [
  {
    title: "กล่องออฟเซ็ทและกล่องกระดาษพับ",
    text: "จัด brief จากสินค้า ขนาด วัสดุ และพื้นที่งานพิมพ์",
    href: "/products/folding-carton",
    image: "/images/generated/cosmetic-folding-carton-v2.webp",
    alt: "ภาพจำลองกล่องกระดาษพับหลายขนาดโดยไม่มีตราสินค้า",
    className: "capability-wide",
  },
  {
    title: "กล่องลูกฟูกและกล่องไปรษณีย์",
    text: "เริ่มจากน้ำหนัก รูปแบบบรรจุ การขนส่ง และการซ้อน",
    href: "/products/corrugated-box",
    image: "/images/generated/corrugated-structure-v2.webp",
    alt: "ภาพจำลองกล่องลูกฟูกและชิ้นรองไดคัทโดยไม่มีตราสินค้า",
    className: "capability-tall",
  },
  {
    title: "กล่องไดคัทและชิ้นรองสินค้า",
    text: "กำหนดวิธีเปิด ปิด และจัดวางให้สอดคล้องกับสินค้า",
    href: "/products/custom-die-cut",
    image: "/images/generated/premium-die-cut-v2.webp",
    alt: "ภาพจำลองกล่องไดคัทพร้อมชิ้นรองและปลอกกล่อง",
    className: "capability-standard",
  },
] as const;

export default async function HomePage() {
  const clientBrands = getApprovedClientBrands();
  let gallery: GalleryItem[] = [];
  try {
    const published = await getPublishedGallery();
    gallery = published.slice(0, 4);
  } catch {
    gallery = [];
  }
  return (
    <>
      <section className="storefront-hero">
        <Image
          className="hero-image"
          src="/images/generated/hero-print-production-v2.webp"
          fill
          priority
          sizes="100vw"
          alt="ภาพจำลองพื้นที่ผลิตสิ่งพิมพ์และเครื่องพิมพ์ออฟเซ็ต"
        />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="shell hero-content">
          <p className="eyebrow hero-kicker">CUSTOM PACKAGING</p>
          <h1>
            กล่องสั่งผลิต
            <br />
            เริ่มจาก brief ที่ชัดเจน
          </h1>
          <p className="lead">
            มีสเปกพร้อมแล้ว หรือยังไม่แน่ใจว่าควรเริ่มจากกล่องแบบไหน
            ส่งข้อมูลเท่าที่มีเพื่อให้ทีมตรวจสอบงาน
          </p>
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
            <h2>เลือกประเภทกล่องจากการใช้งานจริง</h2>
          </div>
          <Link className="text-link" href="/products">
            ดูประเภทกล่องทั้งหมด →
          </Link>
        </div>
        <div className="shell capability-grid">
          {capabilities.map((item) => (
            <Link
              className={`capability-card ${item.className}`}
              href={item.href}
              key={item.href}
            >
              <Image
                src={item.image}
                fill
                sizes="(max-width: 760px) 100vw, 60vw"
                alt={item.alt}
              />
              <span className="capability-shade" aria-hidden="true" />
              <span className="capability-copy">
                <strong>{item.title}</strong>
                <small>{item.text}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="workflow-proof" aria-label="หลักการเริ่มประเมินงาน">
        <div className="shell proof-grid">
          <div>
            <strong>Offset</strong>
            <span>งานพิมพ์และกล่องกระดาษสำหรับภาคอุตสาหกรรม</span>
          </div>
          <div>
            <strong>Board</strong>
            <span>กล่องกระดาษพับ กล่องพรีเมี่ยม และกล่องจั่วปัง</span>
          </div>
          <div>
            <strong>Flute</strong>
            <span>กล่องลูกฟูก 3 ชั้น 5 ชั้น และชิ้นรองสินค้า</span>
          </div>
        </div>
      </section>

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
            <h2>งานแต่ละสถานการณ์ เริ่มเตรียมข้อมูลต่างกัน</h2>
          </div>
          <div className="offer-rows">
            {solutions.map((solution) => (
              <Link href={`/solutions/${solution.slug}`} key={solution.slug}>
                <span>{solution.number}</span>
                <h3>{solution.status}</h3>
                <p>{solution.title}</p>
                <strong>ดูวิธีเริ่มงาน →</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section process-section">
        <div className="shell process-grid">
          <div>
            <p className="eyebrow">BRIEF TO EVALUATION</p>
            <h2>
              ข้อมูลชัดขึ้น
              <br />
              ประเมินงานได้ตรงขึ้น
            </h2>
          </div>
          <ol>
            <li>
              <span>1</span>
              <div>
                <h3>เลือกจุดเริ่ม</h3>
                <p>ส่งสเปกที่มี หรืออธิบายสินค้าและข้อจำกัด</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <h3>เติมรายละเอียด</h3>
                <p>ระบุจำนวน ขนาด กำหนดใช้ และพื้นที่จัดส่งเท่าที่ทราบ</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <h3>ทีมตรวจสอบ</h3>
                <p>ข้อมูลจะถูกส่งให้ทีมงานประเมินผ่านช่องทางที่คุณเลือก</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

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
                ตัวอย่างลูกค้าที่ให้เราได้ร่วมผลิตงานบรรจุภัณฑ์
                และอนุญาตให้เผยแพร่ชื่อและโลโก้บนเว็บไซต์
              </p>
            </div>

            <ul className="client-logo-grid">
              {clientBrands.map((brand) => (
                <li key={brand.id}>
                  <Image
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

      <section className="section closing-cta">
        <div className="shell closing-cta-inner">
          <p className="eyebrow">START YOUR PROJECT</p>
          <h2>พร้อมส่งรายละเอียดกล่องของคุณหรือยัง</h2>
          <p>เริ่มจากสเปกที่มี หรือให้ระบบช่วยจัดลำดับข้อมูลที่ต้องเตรียม</p>
          <Link className="button" href="/quote">
            ส่งรายละเอียดเพื่อขอราคา
          </Link>
        </div>
      </section>
    </>
  );
}
