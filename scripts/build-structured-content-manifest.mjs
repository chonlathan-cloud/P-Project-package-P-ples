import { pathToFileURL } from "node:url";
import { products } from "../src/content/products.ts";
import { solutions } from "../src/content/solutions.ts";

const emptySeo = (title, description, canonical_override) => ({
  title,
  description,
  canonical_override,
  social_image_id: null,
});

const productContent = products.map((product, index) => ({
  kind: "product",
  slug: product.slug,
  locale: "th",
  title: product.title,
  summary: product.summary,
  seo: emptySeo(product.title, product.summary, `/products/${product.slug}`),
  display_order: (index + 1) * 10,
  category: product.title,
  overview: product.overview,
  pricing_benchmark_id: product.pricingBenchmarkId,
  hero_image: { src: product.heroImage, alt: product.heroAlt },
  evidence_image: { src: product.evidenceImage, alt: product.evidenceAlt },
  applications: product.applications,
  fit: product.fit,
  brief: product.brief,
  decisions: product.decisions,
  materials: [],
  use_cases: product.applications.map((item) => item.title),
  moq_guidance: null,
  lead_time_wording: null,
  media_ids: [],
}));

const offerContent = solutions.map((solution, index) => ({
  kind: "offer",
  slug: solution.slug,
  locale: "th",
  title: solution.title,
  summary: solution.summary,
  seo: emptySeo(
    `${solution.status}: ${solution.title}`,
    solution.summary,
    `/solutions/${solution.slug}`,
  ),
  display_order: (index + 1) * 10,
  label: solution.label,
  status_label: solution.status,
  audience: solution.overview,
  quote_path: solution.quotePath,
  inputs: solution.inputs,
  checks: solution.checks,
  moq_guidance: null,
  benefits: solution.fit,
  cta_label: solution.ctaLabel,
  cta_href: `/quote?path=${solution.quotePath}`,
  proof_reference_ids: [],
}));

const faqContent = [
  ...products.flatMap((product, productIndex) =>
    product.faq.map((faq, faqIndex) => ({
      kind: "faq",
      slug: `product-${product.slug}-${faqIndex + 1}`,
      locale: "th",
      title: faq.question,
      summary: faq.answer,
      seo: emptySeo(null, null, null),
      question: faq.question,
      answer: faq.answer,
      page_scopes: [`product:${product.slug}`],
      order: productIndex * 100 + faqIndex * 10,
    })),
  ),
  ...solutions.flatMap((solution, solutionIndex) =>
    solution.faq.map((faq, faqIndex) => ({
      kind: "faq",
      slug: `offer-${solution.slug}-${faqIndex + 1}`,
      locale: "th",
      title: faq.question,
      summary: faq.answer,
      seo: emptySeo(null, null, null),
      question: faq.question,
      answer: faq.answer,
      page_scopes: [`offer:${solution.slug}`],
      order: 1000 + solutionIndex * 100 + faqIndex * 10,
    })),
  ),
];

const pageContent = [
  {
    kind: "page",
    slug: "home",
    locale: "th",
    title: "งานพิมพ์และกล่องสั่งผลิต เริ่มจาก brief ที่ชัดเจน",
    summary:
      "มีสเปกพร้อมแล้ว หรือยังไม่แน่ใจว่าควรเริ่มจากงานแบบไหน ส่งข้อมูลเท่าที่มีเพื่อให้ทีมตรวจสอบงาน",
    seo: emptySeo(
      "DD Box Printing | งานพิมพ์และกล่องสั่งผลิต",
      "ส่งสเปกงานพิมพ์หรือข้อมูลสินค้าเพื่อให้ทีม DD Box ตรวจสอบและช่วยจัด brief ก่อนประเมินงาน",
      "/",
    ),
    sections: [
      {
        type: "text",
        key: "hero",
        heading: "งานพิมพ์และกล่องสั่งผลิต เริ่มจาก brief ที่ชัดเจน",
        paragraphs: [
          "มีสเปกพร้อมแล้ว หรือยังไม่แน่ใจว่าควรเริ่มจากงานแบบไหน ส่งข้อมูลเท่าที่มีเพื่อให้ทีมตรวจสอบงาน",
        ],
        bullets: [],
        items: [],
      },
      {
        type: "entity_list",
        key: "products",
        heading: "เลือกงานพิมพ์จากการใช้งานจริง",
        entity_kind: "products",
        entity_ids: products.map((product) => product.slug),
      },
      {
        type: "text",
        key: "capabilities",
        heading: "ขอบเขตงานที่ใช้เริ่มจัด brief",
        paragraphs: [
          "เลือกจากโครงสร้าง วัสดุ และวิธีใช้งานที่ใกล้กับสินค้าของคุณ",
        ],
        bullets: [],
        items: [
          {
            title: "Offset",
            description: "งานพิมพ์และกล่องกระดาษสำหรับภาคอุตสาหกรรม",
          },
          {
            title: "Board",
            description: "กล่องกระดาษพับ กล่องพรีเมี่ยม และกล่องจั่วปัง",
          },
          {
            title: "Flute",
            description: "กล่องลูกฟูก 3 ชั้น 5 ชั้น และชิ้นรองสินค้า",
          },
        ],
      },
      {
        type: "entity_list",
        key: "offers",
        heading: "งานแต่ละสถานการณ์ เริ่มเตรียมข้อมูลต่างกัน",
        entity_kind: "offers",
        entity_ids: solutions.map((solution) => solution.slug),
      },
      {
        type: "text",
        key: "process",
        heading: "ข้อมูลชัดขึ้น ประเมินงานได้ตรงขึ้น",
        paragraphs: [
          "เริ่มจากข้อมูลที่มี แล้วค่อยเติมส่วนที่ต้องตรวจสอบร่วมกัน",
        ],
        bullets: [],
        items: [
          {
            title: "เลือกจุดเริ่ม",
            description: "ส่งสเปกที่มี หรืออธิบายสินค้าและข้อจำกัด",
          },
          {
            title: "เติมรายละเอียด",
            description: "ระบุจำนวน ขนาด กำหนดใช้ และพื้นที่จัดส่งเท่าที่ทราบ",
          },
          {
            title: "ทีมตรวจสอบ",
            description: "ข้อมูลจะถูกส่งให้ทีมงานประเมินผ่านช่องทางที่คุณเลือก",
          },
        ],
      },
      {
        type: "cta",
        key: "closing",
        heading: "พร้อมส่งรายละเอียดกล่องของคุณหรือยัง",
        body: "เริ่มจากสเปกที่มี หรือให้ระบบช่วยจัดลำดับข้อมูลที่ต้องเตรียม",
        label: "ส่งรายละเอียดเพื่อขอราคา",
        href: "/quote",
      },
    ],
  },
  {
    kind: "page",
    slug: "products",
    locale: "th",
    title: "เลือกงานพิมพ์จากสินค้าและวิธีใช้งานจริง",
    summary:
      "เลือกประเภทบรรจุภัณฑ์หรือสื่อสิ่งพิมพ์เพื่อเตรียมข้อมูลเบื้องต้น ทีมจะตรวจสอบวัสดุ จำนวน และข้อกำหนดก่อนยืนยันการผลิต",
    seo: emptySeo(
      "สินค้าและงานพิมพ์",
      "สำรวจบรรจุภัณฑ์ สติ๊กเกอร์ ฉลาก และสื่อสิ่งพิมพ์ พร้อมข้อมูลที่ควรเตรียมก่อนส่งรายละเอียดงาน",
      "/products",
    ),
    sections: [
      {
        type: "entity_list",
        key: "catalog",
        heading: "สินค้าและงานพิมพ์",
        entity_kind: "products",
        entity_ids: products.map((product) => product.slug),
      },
      {
        type: "cta",
        key: "guidance",
        heading: "ยังไม่แน่ใจว่าควรเริ่มจากงานแบบไหน",
        body: "เลือกวิธีเริ่มจากข้อมูลที่มีอยู่ตอนนี้ แล้วส่งรายละเอียดสินค้าเท่าที่มีให้ทีมช่วยจัด brief",
        label: "ดูวิธีเริ่มงาน",
        href: "/solutions",
      },
    ],
  },
  {
    kind: "page",
    slug: "solutions",
    locale: "th",
    title: "งานกล่องของคุณอยู่ในสถานการณ์ไหน",
    summary:
      "หน้า Products ช่วยเลือกประเภทกล่อง ส่วนหน้านี้ช่วยเลือกวิธีเตรียมข้อมูล เลือกจากสิ่งที่คุณมีอยู่ตอนนี้ ไม่จำเป็นต้องรอให้สเปกครบ",
    seo: emptySeo(
      "เลือกวิธีเริ่มงานกล่อง",
      "เลือกวิธีเตรียมข้อมูลบรรจุภัณฑ์จากสถานการณ์ของงาน ตั้งแต่ยังไม่มีสเปกจนถึงงานที่มีข้อกำหนดต่อเนื่อง",
      "/solutions",
    ),
    sections: [
      {
        type: "entity_list",
        key: "paths",
        heading: "เลือกจากข้อมูลที่มีอยู่ตอนนี้",
        entity_kind: "offers",
        entity_ids: solutions.map((solution) => solution.slug),
      },
      {
        type: "text",
        key: "common-inputs",
        heading: "ข้อมูลพื้นฐานที่ใช้ได้ทุกเส้นทาง",
        paragraphs: [
          "ไม่จำเป็นต้องมีครบทุกข้อ ทีมจะตรวจสอบข้อมูลที่ส่งมาและระบุสิ่งที่ต้องถามเพิ่มก่อนประเมินงาน",
        ],
        bullets: [
          "ภาพหรือขนาดสินค้า",
          "จำนวนโดยประมาณ",
          "วิธีบรรจุและใช้งาน",
          "กำหนดใช้และข้อมูลจัดส่งเท่าที่มี",
        ],
        items: [],
      },
      {
        type: "cta",
        key: "guidance",
        heading: "ส่งข้อมูลเท่าที่มีให้ทีมช่วยจัด brief",
        body: "เริ่มจากสินค้า ภาพอ้างอิง หรือข้อกำหนดที่มีอยู่ตอนนี้",
        label: "ยังไม่แน่ใจ ให้ทีมช่วยจัด brief",
        href: "/quote?path=needs_guidance",
      },
    ],
  },
];

export const structuredContentManifest = [
  ...productContent,
  ...offerContent,
  ...faqContent,
  ...pageContent,
];

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.stdout.write(JSON.stringify(structuredContentManifest, null, 2));
}
