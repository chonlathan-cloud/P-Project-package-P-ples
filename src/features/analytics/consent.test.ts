import { beforeEach, describe, expect, it } from "vitest";
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  isValidGtmId,
  trackAnalyticsEvent,
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

  it("drops measurement events until analytics consent is granted", () => {
    trackAnalyticsEvent({ event: "quote_start" });
    expect(window.dataLayer).toEqual([]);

    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "granted");
    trackAnalyticsEvent({ event: "quote_start" });
    expect(window.dataLayer).toEqual([{ event: "quote_start" }]);
  });
});
