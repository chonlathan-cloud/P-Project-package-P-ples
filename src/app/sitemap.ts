import type { MetadataRoute } from "next";
import { getPublishedOffers, getPublishedProducts } from "@/lib/content-api";
import { serverEnv } from "@/lib/env";

const baseRoutes = [
  "",
  "/products",
  "/solutions",
  "/gallery",
  "/company",
  "/quote",
  "/contact",
  "/privacy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productsResult, offersResult] = await Promise.allSettled([
    getPublishedProducts(),
    getPublishedOffers(),
  ]);
  const productRoutes =
    productsResult.status === "fulfilled"
      ? productsResult.value.map(({ content }) => `/products/${content.slug}`)
      : [];
  const offerRoutes =
    offersResult.status === "fulfilled"
      ? offersResult.value.map(({ content }) => `/solutions/${content.slug}`)
      : [];

  return [...baseRoutes, ...productRoutes, ...offerRoutes].map((path) => ({
    url: `${serverEnv.SITE_URL}${path}`,
    changeFrequency: path === "/gallery" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
