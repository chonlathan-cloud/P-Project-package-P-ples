import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
  const expected = serverEnv.CONTENT_API_REVALIDATION_TOKEN;
  const supplied = request.headers
    .get("Authorization")
    ?.replace(/^Bearer\s+/, "");
  if (!expected || supplied !== expected)
    return NextResponse.json({ detail: "forbidden" }, { status: 403 });
  const payload = (await request.json().catch(() => null)) as {
    tags?: unknown;
  } | null;
  const tags = Array.isArray(payload?.tags)
    ? payload.tags.filter((tag): tag is string => typeof tag === "string")
    : [];
  const allowed = new Set(["gallery", "products", "offers", "faqs", "pages"]);
  if (tags.length === 0 || tags.some((tag) => !allowed.has(tag)))
    return NextResponse.json(
      { detail: "invalid revalidation tags" },
      { status: 422 },
    );

  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  if (tags.includes("gallery")) revalidatePath("/gallery");
  if (tags.includes("products")) {
    revalidatePath("/products");
    revalidatePath("/products/[slug]", "page");
  }
  if (tags.includes("offers")) {
    revalidatePath("/solutions");
    revalidatePath("/solutions/[slug]", "page");
  }
  if (tags.includes("faqs")) {
    revalidatePath("/products/[slug]", "page");
    revalidatePath("/solutions/[slug]", "page");
  }
  if (tags.includes("pages")) {
    revalidatePath("/products");
    revalidatePath("/solutions");
    revalidatePath("/company");
    revalidatePath("/contact");
  }
  return NextResponse.json({ revalidated: tags });
}
