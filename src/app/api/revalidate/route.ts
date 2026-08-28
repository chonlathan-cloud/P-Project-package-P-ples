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
  revalidatePath("/");
  revalidatePath("/gallery");
  return NextResponse.json({ revalidated: true });
}
