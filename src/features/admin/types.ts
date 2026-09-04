export type ContentKind = "product" | "offer" | "faq" | "page";
export const contentResource: Record<ContentKind, string> = {
  product: "products",
  offer: "offers",
  faq: "faqs",
  page: "pages",
};
export type ContentStatus = "draft" | "published" | "archived";

export type SeoFields = {
  title: string | null;
  description: string | null;
  canonical_override: string | null;
  social_image_id: string | null;
};

export type CommonContent = {
  kind: ContentKind;
  slug: string;
  locale: "th";
  title: string;
  summary: string;
  seo: SeoFields;
};

export type ContentDetailItem = {
  title: string;
  description: string;
};

export type ContentImage = {
  src: string;
  alt: string;
};

export type ProductContent = CommonContent & {
  kind: "product";
  display_order: number;
  category: string;
  overview: string | null;
  pricing_benchmark_id: string | null;
  hero_image: ContentImage | null;
  evidence_image: ContentImage | null;
  applications: ContentDetailItem[];
  fit: string[];
  brief: string[];
  decisions: ContentDetailItem[];
  materials: string[];
  use_cases: string[];
  moq_guidance: string | null;
  lead_time_wording: string | null;
  media_ids: string[];
};

export type OfferContent = CommonContent & {
  kind: "offer";
  display_order: number;
  label: string | null;
  status_label: string | null;
  audience: string;
  quote_path: "needs_guidance" | "has_specifications";
  inputs: string[];
  checks: ContentDetailItem[];
  moq_guidance: string | null;
  benefits: string[];
  cta_label: string;
  cta_href: string;
  proof_reference_ids: string[];
};

export type FaqContent = CommonContent & {
  kind: "faq";
  question: string;
  answer: string;
  page_scopes: string[];
  order: number;
};

export type TextPageSection = {
  type: "text";
  key: string | null;
  heading: string;
  paragraphs: string[];
  bullets: string[];
  items: ContentDetailItem[];
};

export type EntityListPageSection = {
  type: "entity_list";
  key: string | null;
  heading: string;
  entity_kind: "products" | "offers" | "faqs" | "gallery_items";
  entity_ids: string[];
};

export type CtaPageSection = {
  type: "cta";
  key: string | null;
  heading: string;
  body: string;
  label: string;
  href: string;
};

export type PageSection =
  | TextPageSection
  | EntityListPageSection
  | CtaPageSection;

export type PageContent = CommonContent & {
  kind: "page";
  sections: PageSection[];
};

export type StructuredContent =
  | ProductContent
  | OfferContent
  | FaqContent
  | PageContent;

export type ContentDocument = {
  id: string;
  kind: ContentKind;
  content: StructuredContent;
  published_content: StructuredContent | null;
  status: ContentStatus;
  has_unpublished_changes: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  created_by: string;
  updated_by: string;
};

const emptySeo: SeoFields = {
  title: null,
  description: null,
  canonical_override: null,
  social_image_id: null,
};

const common = (kind: ContentKind): CommonContent => ({
  kind,
  slug: "",
  locale: "th",
  title: "",
  summary: "",
  seo: { ...emptySeo },
});

export function emptyContent(kind: ContentKind): StructuredContent {
  if (kind === "product")
    return {
      ...common(kind),
      kind,
      display_order: 0,
      category: "",
      overview: null,
      pricing_benchmark_id: null,
      hero_image: null,
      evidence_image: null,
      applications: [],
      fit: [],
      brief: [],
      decisions: [],
      materials: [],
      use_cases: [],
      moq_guidance: null,
      lead_time_wording: null,
      media_ids: [],
    };
  if (kind === "offer")
    return {
      ...common(kind),
      kind,
      display_order: 0,
      label: null,
      status_label: null,
      audience: "",
      quote_path: "needs_guidance",
      inputs: [],
      checks: [],
      moq_guidance: null,
      benefits: [],
      cta_label: "ส่งรายละเอียดให้ทีมประเมิน",
      cta_href: "/quote",
      proof_reference_ids: [],
    };
  if (kind === "faq")
    return {
      ...common(kind),
      kind,
      question: "",
      answer: "",
      page_scopes: [],
      order: 0,
    };
  return {
    ...common(kind),
    kind,
    sections: [
      {
        type: "text",
        key: null,
        heading: "",
        paragraphs: [""],
        bullets: [],
        items: [],
      },
    ],
  };
}

export function lines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}
