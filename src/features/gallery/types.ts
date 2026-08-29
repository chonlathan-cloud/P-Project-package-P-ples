import { z } from "zod";

export const mediaRefSchema = z.object({
  id: z.string(),
  url: z.string(),
  fallback_url: z.string().nullable(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().min(3),
});

export const galleryItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  category: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  version: z.number().int().positive(),
  images: z.array(mediaRefSchema).min(1).max(12),
  evidence_type: z.enum(["customer_work", "concept"]),
  pricing_benchmark_id: z.string().nullable(),
  customer_permission: z.boolean(),
  specs: z.object({
    material: z.string().nullable(),
    quantity: z.string().nullable(),
    application: z.string().nullable(),
  }),
});

export const pricingBenchmarkSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.string(),
  starting_price_min_satang: z.number().int().nonnegative(),
  starting_price_max_satang: z.number().int().nonnegative().nullable(),
  benchmark_min_satang: z.number().int().nonnegative(),
  benchmark_max_satang: z.number().int().nonnegative().nullable(),
  benchmark_open_ended: z.boolean(),
  unit: z.enum(["ใบ", "ชิ้น"]),
  quantity_basis: z.string().nullable(),
  material: z.string(),
  disclaimer: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  version: z.number().int().positive(),
});

export type MediaRef = z.infer<typeof mediaRefSchema>;
export type GalleryItem = z.infer<typeof galleryItemSchema>;
export type PricingBenchmark = z.infer<typeof pricingBenchmarkSchema>;
