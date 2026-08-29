import { serverEnv } from "@/lib/env";
import {
  galleryItemSchema,
  pricingBenchmarkSchema,
  type GalleryItem,
  type PricingBenchmark,
} from "@/features/gallery/types";

async function getContent<T>(
  path: string,
  tag: string,
  parse: (payload: unknown) => T,
): Promise<T> {
  const response = await fetch(`${serverEnv.CONTENT_API_URL}${path}`, {
    next: { revalidate: 60, tags: [tag] },
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`content API returned ${response.status}`);
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
