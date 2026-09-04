import { z } from "zod";

const seoSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  canonical_override: z.string().nullable(),
  social_image_id: z.string().nullable(),
});

const commonContentShape = {
  slug: z.string(),
  locale: z.literal("th"),
  title: z.string(),
  summary: z.string(),
  seo: seoSchema,
};

const detailItemSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const contentImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
});

export const productContentSchema = z.object({
  ...commonContentShape,
  kind: z.literal("product"),
  display_order: z.number().int().default(0),
  category: z.string(),
  overview: z.string().nullable().default(null),
  pricing_benchmark_id: z.string().nullable().default(null),
  hero_image: contentImageSchema.nullable().default(null),
  evidence_image: contentImageSchema.nullable().default(null),
  applications: z.array(detailItemSchema).default([]),
  fit: z.array(z.string()).default([]),
  brief: z.array(z.string()).default([]),
  decisions: z.array(detailItemSchema).default([]),
  materials: z.array(z.string()).default([]),
  use_cases: z.array(z.string()).default([]),
  moq_guidance: z.string().nullable(),
  lead_time_wording: z.string().nullable(),
  media_ids: z.array(z.string()),
});

export const offerContentSchema = z.object({
  ...commonContentShape,
  kind: z.literal("offer"),
  display_order: z.number().int().default(0),
  label: z.string().nullable().default(null),
  status_label: z.string().nullable().default(null),
  audience: z.string(),
  quote_path: z
    .enum(["needs_guidance", "has_specifications"])
    .default("needs_guidance"),
  inputs: z.array(z.string()).default([]),
  checks: z.array(detailItemSchema).default([]),
  moq_guidance: z.string().nullable(),
  benefits: z.array(z.string()),
  cta_label: z.string(),
  cta_href: z.string(),
  proof_reference_ids: z.array(z.string()),
});

export const faqContentSchema = z.object({
  ...commonContentShape,
  kind: z.literal("faq"),
  question: z.string(),
  answer: z.string(),
  page_scopes: z.array(z.string()),
  order: z.number().int(),
});

const pageSectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    key: z.string().nullable().default(null),
    heading: z.string(),
    paragraphs: z.array(z.string()),
    bullets: z.array(z.string()),
    items: z.array(detailItemSchema).default([]),
  }),
  z.object({
    type: z.literal("entity_list"),
    key: z.string().nullable().default(null),
    heading: z.string(),
    entity_kind: z.enum(["products", "offers", "faqs", "gallery_items"]),
    entity_ids: z.array(z.string()),
  }),
  z.object({
    type: z.literal("cta"),
    key: z.string().nullable().default(null),
    heading: z.string(),
    body: z.string(),
    label: z.string(),
    href: z.string(),
  }),
]);

export const pageContentSchema = z.object({
  ...commonContentShape,
  kind: z.literal("page"),
  sections: z.array(pageSectionSchema),
});

function publishedDocumentSchema<T extends z.ZodType>(content: T) {
  return z.object({
    id: z.string(),
    kind: z.enum(["product", "offer", "faq", "page"]),
    content,
    version: z.number().int().positive(),
    published_at: z.string(),
  });
}

export const publishedProductSchema =
  publishedDocumentSchema(productContentSchema);
export const publishedOfferSchema = publishedDocumentSchema(offerContentSchema);
export const publishedFaqSchema = publishedDocumentSchema(faqContentSchema);
export const publishedPageSchema = publishedDocumentSchema(pageContentSchema);

export type ProductContent = z.infer<typeof productContentSchema>;
export type OfferContent = z.infer<typeof offerContentSchema>;
export type FaqContent = z.infer<typeof faqContentSchema>;
export type PageContent = z.infer<typeof pageContentSchema>;
export type PageSection = z.infer<typeof pageSectionSchema>;
export type PublishedProduct = z.infer<typeof publishedProductSchema>;
export type PublishedOffer = z.infer<typeof publishedOfferSchema>;
export type PublishedFaq = z.infer<typeof publishedFaqSchema>;
export type PublishedPage = z.infer<typeof publishedPageSchema>;

export function byDisplayOrder<
  T extends { content: { display_order: number; title: string } },
>(left: T, right: T): number {
  return (
    left.content.display_order - right.content.display_order ||
    left.content.title.localeCompare(right.content.title, "th")
  );
}

export function pageSection<
  T extends PageSection["type"],
  S extends Extract<PageSection, { type: T }>,
>(page: PublishedPage, key: string, type: T): S | undefined {
  return page.content.sections.find(
    (section): section is S => section.key === key && section.type === type,
  );
}
