import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("lead API pass-through", () => {
  it("requires an idempotency key before contacting the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const request = new NextRequest("http://localhost:3000/api/leads", {
      method: "POST",
      body: JSON.stringify({ contact_name: "TEST" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards consent and attribution without logging or transforming the payload", async () => {
    const payload = {
      contact_name: "TEST",
      landing_page: "http://localhost:3000/quote",
      submission_path: "/quote",
      measurement_consent: {
        mode: "all",
        version: 1,
        updated_at: "2026-09-10T08:05:00.000Z",
      },
      attribution: {
        schema_version: 1,
        model: "first_last_tagged",
        first_touch: { gclid: "TEST-GCLID" },
        last_touch: { gclid: "TEST-GCLID" },
      },
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ reference: "DD-44F2F48F6E", duplicate: false }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": "upstream-request-1",
          },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const request = new NextRequest("http://localhost:3000/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "stable-client-key-route-test",
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Request-ID")).toBe("upstream-request-1");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/v1/leads");
    expect(new Headers(init.headers).get("Idempotency-Key")).toBe(
      "stable-client-key-route-test",
    );
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });
});
