import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (!idempotencyKey)
    return NextResponse.json(
      { detail: "Idempotency-Key is required" },
      { status: 400 },
    );
  const response = await fetch(`${serverEnv.CONTENT_API_URL}/v1/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "X-Request-ID": crypto.randomUUID(),
    },
    body: await request.text(),
    cache: "no-store",
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type":
        response.headers.get("Content-Type") ?? "application/json",
      "X-Request-ID": response.headers.get("X-Request-ID") ?? "unknown",
    },
  });
}
