import type { MetadataRoute } from "next";
import { serverEnv } from "@/lib/env";

export function buildRobots(indexingEnabled: boolean): MetadataRoute.Robots {
  if (!indexingEnabled) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/thank-you", "/terms"],
    },
    sitemap: `${serverEnv.SITE_URL}/sitemap.xml`,
  };
}

export default function robots(): MetadataRoute.Robots {
  return buildRobots(serverEnv.SITE_INDEXING_ENABLED);
}
