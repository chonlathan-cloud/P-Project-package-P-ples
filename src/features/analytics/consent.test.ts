import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LEGACY_ANALYTICS_CONSENT_STORAGE_KEY,
  PRIVACY_CONSENT_STORAGE_KEY,
  isValidGtmId,
  quantityBand,
  readPrivacyConsent,
  trackAnalyticsEvent,
  writePrivacyConsent,
} from "./consent";

describe("analytics consent boundary", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.dataLayer = [];
  });

  it("validates GTM container IDs", () => {
    expect(isValidGtmId("GTM-MWW3HWHR")).toBe(true);
    expect(isValidGtmId("G-123456")).toBe(false);
    expect(isValidGtmId("GTM-invalid value")).toBe(false);
  });

  it("stores a versioned first-party consent record", () => {
    writePrivacyConsent("all", "2026-09-09T08:00:00.000Z");

    expect(
      JSON.parse(
        window.localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY) ?? "null",
      ),
    ).toEqual({
      version: 1,
      mode: "all",
      updatedAt: "2026-09-09T08:00:00.000Z",
    });
  });

  it("migrates the existing consent choice without asking again", () => {
    window.localStorage.setItem(LEGACY_ANALYTICS_CONSENT_STORAGE_KEY, "denied");

    expect(readPrivacyConsent()).toMatchObject({
      version: 1,
      mode: "necessary",
    });
    expect(
      window.localStorage.getItem(LEGACY_ANALYTICS_CONSENT_STORAGE_KEY),
    ).toBeNull();
    expect(
      JSON.parse(
        window.localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY) ?? "null",
      ),
    ).toMatchObject({ version: 1, mode: "necessary" });
  });

  it.each(["not-json", JSON.stringify({ version: 2, mode: "all" })])(
    "rejects an invalid or outdated consent record: %s",
    (stored) => {
      window.localStorage.setItem(PRIVACY_CONSENT_STORAGE_KEY, stored);

      expect(readPrivacyConsent()).toBeNull();
      expect(
        window.localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY),
      ).toBeNull();
    },
  );

  it("drops measurement events until all measurement is allowed", () => {
    trackAnalyticsEvent({ event: "quote_start" });
    expect(window.dataLayer).toEqual([]);

    writePrivacyConsent("necessary", "2026-09-09T08:00:00.000Z");
    window.dataLayer = [];
    trackAnalyticsEvent({ event: "quote_start" });
    expect(window.dataLayer).toEqual([]);

    writePrivacyConsent("all", "2026-09-09T08:05:00.000Z");
    window.dataLayer = [];
    trackAnalyticsEvent({ event: "quote_start" });
    expect(window.dataLayer).toEqual([{ event: "quote_start" }]);
  });

  it("creates a new allowlisted payload and strips unexpected or sensitive fields", () => {
    writePrivacyConsent("all", "2026-09-09T08:05:00.000Z");
    window.dataLayer = [];

    trackAnalyticsEvent({
      event: "quote_submit",
      customer_path: "has_specifications",
      quantity_band: "500_1000",
      email: "person@example.com",
      reference: "DD-44F2F48F6E",
      project_details: "sensitive",
    } as never);

    expect(window.dataLayer).toEqual([
      {
        event: "quote_submit",
        customer_path: "has_specifications",
        quantity_band: "500_1000",
      },
    ]);
  });

  it("drops malformed runtime events", () => {
    writePrivacyConsent("all", "2026-09-09T08:05:00.000Z");
    window.dataLayer = [];

    trackAnalyticsEvent({
      event: "quote_submit",
      customer_path: "has_specifications",
      quantity_band: "customer-entered-value",
    } as never);

    expect(window.dataLayer).toEqual([]);
  });

  it("does not throw when storage or dataLayer is unavailable", () => {
    const storageFailure = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("storage blocked");
      });
    expect(() => trackAnalyticsEvent({ event: "quote_start" })).not.toThrow();
    storageFailure.mockRestore();

    writePrivacyConsent("all", "2026-09-09T08:05:00.000Z");
    window.dataLayer = [];
    vi.spyOn(window.dataLayer, "push").mockImplementation(() => {
      throw new Error("GTM blocked");
    });
    expect(() => trackAnalyticsEvent({ event: "quote_start" })).not.toThrow();
  });

  it.each([
    [null, "unknown"],
    [0, "unknown"],
    [1.5, "unknown"],
    [1, "under_10"],
    [9, "under_10"],
    [10, "10_99"],
    [99, "10_99"],
    [100, "100_499"],
    [499, "100_499"],
    [500, "500_1000"],
    [1_000, "500_1000"],
    [1_001, "1001_3000"],
    [3_000, "1001_3000"],
    [3_001, "over_3000"],
  ])("maps quantity %s to %s", (quantity, expected) => {
    expect(quantityBand(quantity)).toBe(expected);
  });
});
