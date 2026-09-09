import { beforeEach, describe, expect, it } from "vitest";
import {
  LEGACY_ANALYTICS_CONSENT_STORAGE_KEY,
  PRIVACY_CONSENT_STORAGE_KEY,
  isValidGtmId,
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
    window.localStorage.setItem(
      LEGACY_ANALYTICS_CONSENT_STORAGE_KEY,
      "denied",
    );

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
});
