import { serverEnv } from "@/lib/env";
import {
  galleryItemSchema,
  pricingBenchmarkSchema,
  type GalleryItem,
  type PricingBenchmark,
} from "@/features/gallery/types";
import {
  publishedFaqSchema,
  publishedOfferSchema,
  publishedPageSchema,
  publishedProductSchema,
  type PublishedFaq,
  type PublishedOffer,
  type PublishedPage,
  type PublishedProduct,
} from "@/features/content/types";

export class ContentApiError extends Error {
  constructor(
    public readonly status: number,
    path: string,
  ) {
    super(`content API returned ${status} for ${path}`);
  }
}

async function getContent<T>(
  path: string,
  tag: string,
  parse: (payload: unknown) => T,
): Promise<T> {
  const response = await fetch(`${serverEnv.CONTENT_API_URL}${path}`, {
    next: { revalidate: 60, tags: [tag] },
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new ContentApiError(response.status, path);
  return parse(await response.json());
}

export async function getPublishedGallery(): Promise<GalleryItem[]> {
  return getContent("/v1/gallery-items", "gallery", (payload) =>
    galleryItemSchema.array().parse(payload),
  );
}

export async function getPublishedPricing(): Promise<PricingBenchmark[]> {
  return getContent("/v1/pricing-benchmarks", "pricing", (payload) =>
    pricingBenchmarkSchema.array().parse(payload),
  );
}

export async function getPublishedProducts(): Promise<PublishedProduct[]> {
  return getContent("/v1/products", "products", (payload) =>
    publishedProductSchema.array().parse(payload),
  );
}

export async function getPublishedProduct(
  slug: string,
): Promise<PublishedProduct> {
  return getContent(
    `/v1/products/${encodeURIComponent(slug)}`,
    "products",
    (payload) => publishedProductSchema.parse(payload),
  );
}

export async function getPublishedOffers(): Promise<PublishedOffer[]> {
  return getContent("/v1/offers", "offers", (payload) =>
    publishedOfferSchema.array().parse(payload),
  );
}

export async function getPublishedOffer(slug: string): Promise<PublishedOffer> {
  return getContent(
    `/v1/offers/${encodeURIComponent(slug)}`,
    "offers",
    (payload) => publishedOfferSchema.parse(payload),
  );
}

export async function getPublishedFaqs(): Promise<PublishedFaq[]> {
  return getContent("/v1/faqs", "faqs", (payload) =>
    publishedFaqSchema.array().parse(payload),
  );
}

export async function getPublishedPage(slug: string): Promise<PublishedPage> {
  return getContent(
    `/v1/pages/${encodeURIComponent(slug)}`,
    "pages",
    (payload) => publishedPageSchema.parse(payload),
  );
}
