import { z } from "zod";

const serverSchema = z.object({
  SITE_URL: z.url().default("http://localhost:3000"),
  SITE_INDEXING_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  CONTENT_API_URL: z.url().default("http://localhost:8000"),
  CONTENT_API_REVALIDATION_TOKEN: z.string().min(24).optional(),
});

export const serverEnv = serverSchema.parse({
  SITE_URL: process.env.SITE_URL,
  SITE_INDEXING_ENABLED: process.env.SITE_INDEXING_ENABLED,
  CONTENT_API_URL: process.env.CONTENT_API_URL,
  CONTENT_API_REVALIDATION_TOKEN: process.env.CONTENT_API_REVALIDATION_TOKEN,
});
