import { beforeEach, describe, expect, it } from "vitest";
import { captureAttributionIfAllowed } from "@/features/analytics/attribution";
import { writePrivacyConsent } from "@/features/analytics/consent";
import { quoteFormSchema, toLeadPayload } from "./schema";

const valid = {
  customer_path: "has_specifications" as const,
  product_type: "กล่องเครื่องสำอาง",
  quantity: "1000",
  dimensions: "20 x 10 x 5 ซม.",
  required_date: "",
  delivery_province: "สมุทรปราการ",
  project_details: "ต้องการประเมินกล่องสำหรับสินค้าใหม่",
  contact_name: "ผู้ติดต่อ",
  company: "",
  phone: "0812345678",
  line_id: "",
  email: "",
  preferred_contact: "phone" as const,
  consent: true as const,
  website: "",
};

describe("quote form contract", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/quote");
  });

  it("transforms quantity and optional values for the API", () => {
    expect(toLeadPayload(valid)).toMatchObject({
      quantity: 1000,
      company: null,
      landing_page: `${window.location.origin}/quote`,
      submission_path: "/quote",
      measurement_consent: {
        mode: "unset",
        version: null,
        updated_at: null,
      },
      attribution: null,
    });
  });

  it("attaches an eligible attribution snapshot only with all consent", () => {
    window.history.replaceState(
      {},
      "",
      "/quote?utm_source=google&utm_medium=cpc&utm_campaign=campaign_a&gclid=TEST-GCLID",
    );
    writePrivacyConsent("all", "2026-09-10T08:05:00.000Z");
    captureAttributionIfAllowed(
      window.location.href,
      new Date("2026-09-10T08:06:00.000Z"),
    );

    const payload = toLeadPayload(valid);

    expect(payload.landing_page).toBe(`${window.location.origin}/quote`);
    expect(payload.landing_page).not.toContain("?");
    expect(payload.submission_path).toBe("/quote");
    expect(payload.measurement_consent).toEqual({
      mode: "all",
      version: 1,
      updated_at: "2026-09-10T08:05:00.000Z",
    });
    expect(payload.attribution?.first_touch?.utm_campaign).toBe("campaign_a");
    expect(payload.attribution?.last_touch?.gclid).toBe("TEST-GCLID");
  });

  it("does not attach stored attribution after consent becomes necessary-only", () => {
    window.history.replaceState(
      {},
      "",
      "/quote?utm_source=google&utm_medium=cpc&utm_campaign=campaign_a",
    );
    writePrivacyConsent("all", "2026-09-10T08:05:00.000Z");
    captureAttributionIfAllowed(
      window.location.href,
      new Date("2026-09-10T08:06:00.000Z"),
    );
    writePrivacyConsent("necessary", "2026-09-10T08:07:00.000Z");

    expect(toLeadPayload(valid)).toMatchObject({
      measurement_consent: {
        mode: "necessary",
        version: 1,
        updated_at: "2026-09-10T08:07:00.000Z",
      },
      attribution: null,
    });
  });

  it("requires quantity for customers with specifications", () => {
    const result = quoteFormSchema.safeParse({ ...valid, quantity: "" });
    expect(result.success).toBe(false);
  });

  it("requires the selected contact channel", () => {
    const result = quoteFormSchema.safeParse({ ...valid, phone: "" });
    expect(result.success).toBe(false);
  });
});
