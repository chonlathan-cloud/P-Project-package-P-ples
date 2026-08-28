import type { MetadataRoute } from "next";
import { serverEnv } from "@/lib/env";
const routes = [
  "",
  "/products",
  "/products/folding-carton",
  "/products/corrugated-box",
  "/products/custom-die-cut",
  "/solutions/starter",
  "/solutions/growth",
  "/solutions/scale",
  "/gallery",
  "/quote",
  "/contact",
];
export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({
    url: `${serverEnv.SITE_URL}${path}`,
    changeFrequency: path === "/gallery" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
