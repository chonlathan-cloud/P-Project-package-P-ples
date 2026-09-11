import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { writePrivacyConsent } from "./consent";
import {
  ATTRIBUTION_STORAGE_KEY,
  ATTRIBUTION_TTL_MS,
  captureAttributionIfAllowed,
  clearAttribution,
  getAttributionForLead,
  parseAttributionTouch,
  readAttribution,
} from "./attribution";

const start = new Date("2026-09-10T07:00:00.000Z");
const day = 24 * 60 * 60 * 1_000;

function dateAfter(days: number): Date {
  return new Date(start.getTime() + days * day);
}

function taggedUrl(overrides = ""): string {
  const parameters = new URLSearchParams({
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "dd45_core_custom_box",
    utm_id: "1111111111",
    utm_content: "3333333333",
    utm_term: "รับทำกล่องออฟเซ็ท",
    adgroup_id: "2222222222",
    gclid: "CaseSensitive-GCLID_123",
  });
  if (overrides) {
    for (const [key, value] of new URLSearchParams(overrides))
      parameters.set(key, value);
  }
  return `https://www.ddboxprinting.com/products/folding-carton?${parameters.toString()}#details`;
}

describe("campaign attribution", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearAttribution();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses only the approved fields and stores a sanitized landing path", () => {
    const touch = parseAttributionTouch(taggedUrl("unknown=discard-me"), start);

    expect(touch).toEqual({
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "dd45_core_custom_box",
      utm_id: "1111111111",
      utm_content: "3333333333",
      utm_term: "รับทำกล่องออฟเซ็ท",
      adgroup_id: "2222222222",
      gclid: "CaseSensitive-GCLID_123",
      landing_path: "/products/folding-carton",
      captured_at: "2026-09-10T07:00:00.000Z",
      expires_at: new Date(start.getTime() + ATTRIBUTION_TTL_MS).toISOString(),
    });
    expect(touch).not.toHaveProperty("unknown");
  });

  it("accepts a structurally valid GCLID-only touch without inventing UTMs", () => {
    const touch = parseAttributionTouch(
      "/quote?gclid=AbC-123_case.Sensitive",
      start,
    );

    expect(touch).toMatchObject({
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      gclid: "AbC-123_case.Sensitive",
      landing_path: "/quote",
    });
  });

  it.each([
    ["/quote?utm_source=google", "an incomplete UTM pair"],
    ["/quote?utm_source=google&utm_medium=paid%20search", "an invalid token"],
    ["javascript:alert(1)?gclid=abc", "a non-HTTP URL"],
  ])("does not create attribution from %s (%s)", (url) => {
    expect(parseAttributionTouch(url, start)).toBeNull();
  });

  it("drops an unresolved optional ValueTrack field without dropping an eligible touch", () => {
    const touch = parseAttributionTouch(
      "/quote?utm_source=google&utm_medium=cpc&utm_id=%7Bcampaignid%7D",
      start,
    );

    expect(touch).toMatchObject({
      utm_source: "google",
      utm_medium: "cpc",
      utm_id: null,
    });
  });

  it("drops ambiguous repeated fields instead of guessing a value", () => {
    const touch = parseAttributionTouch(
      "/quote?utm_source=google&utm_source=bing&utm_medium=cpc&gclid=click-1&gclid=click-2",
      start,
    );

    expect(touch).toBeNull();

    const stillEligible = parseAttributionTouch(
      "/quote?utm_source=google&utm_medium=cpc&utm_campaign=one&utm_campaign=two",
      start,
    );
    expect(stillEligible).toMatchObject({
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: null,
    });
  });

  it("drops PII-looking campaign values and unsafe GCLIDs", () => {
    const touch = parseAttributionTouch(
      "/quote?utm_source=google&utm_medium=cpc&utm_campaign=person%40example.com&gclid=has%20space",
      start,
    );

    expect(touch).toMatchObject({
      utm_campaign: null,
      gclid: null,
    });
  });

  it("rejects GCLIDs above the 512-byte limit without truncating them", () => {
    const oversizedGclid = "ก".repeat(171);
    const touch = parseAttributionTouch(
      `/quote?utm_source=google&utm_medium=cpc&gclid=${encodeURIComponent(oversizedGclid)}`,
      start,
    );

    expect(new TextEncoder().encode(oversizedGclid).byteLength).toBe(513);
    expect(touch?.gclid).toBeNull();
  });

  it("does not capture or expose attribution without all measurement consent", () => {
    expect(captureAttributionIfAllowed(taggedUrl(), start)).toBeNull();
    expect(window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toBeNull();

    writePrivacyConsent("necessary", start.toISOString());
    expect(captureAttributionIfAllowed(taggedUrl(), start)).toBeNull();
    expect(getAttributionForLead(start)).toBeNull();
  });

  it("keeps first touch and replaces last touch as one complete snapshot", () => {
    writePrivacyConsent("all", start.toISOString());
    const first = captureAttributionIfAllowed(taggedUrl(), start);
    const second = captureAttributionIfAllowed(
      taggedUrl("utm_campaign=campaign_b&gclid="),
      dateAfter(1),
    );

    expect(first?.first_touch).toEqual(first?.last_touch);
    expect(second?.first_touch?.utm_campaign).toBe("dd45_core_custom_box");
    expect(second?.first_touch?.gclid).toBe("CaseSensitive-GCLID_123");
    expect(second?.last_touch).toMatchObject({
      utm_campaign: "campaign_b",
      gclid: null,
      captured_at: dateAfter(1).toISOString(),
    });
  });

  it("does not create another touch or extend TTL for the same observed click", () => {
    writePrivacyConsent("all", start.toISOString());
    const first = captureAttributionIfAllowed(taggedUrl(), start);
    const refreshed = captureAttributionIfAllowed(
      taggedUrl("utm_campaign=changed_but_same_click"),
      dateAfter(1),
    );

    expect(refreshed).toEqual(first);
    expect(refreshed?.last_touch?.captured_at).toBe(start.toISOString());
    expect(refreshed?.last_touch?.expires_at).toBe(
      new Date(start.getTime() + ATTRIBUTION_TTL_MS).toISOString(),
    );
  });

  it("keeps the stored tagged touch on a direct return", () => {
    writePrivacyConsent("all", start.toISOString());
    const captured = captureAttributionIfAllowed(taggedUrl(), start);
    const direct = captureAttributionIfAllowed(
      "https://www.ddboxprinting.com/quote",
      dateAfter(2),
    );

    expect(direct).toEqual(captured);
  });

  it("promotes the remaining last touch when the original first touch expires", () => {
    writePrivacyConsent("all", start.toISOString());
    captureAttributionIfAllowed(taggedUrl(), start);
    captureAttributionIfAllowed(
      taggedUrl("utm_campaign=campaign_b&gclid=GCLID-B"),
      dateAfter(30),
    );

    const active = readAttribution(dateAfter(91));
    expect(active?.first_touch).toEqual(active?.last_touch);
    expect(active?.last_touch?.utm_campaign).toBe("campaign_b");
  });

  it("clears attribution after every retained touch expires", () => {
    writePrivacyConsent("all", start.toISOString());
    captureAttributionIfAllowed(taggedUrl(), start);

    expect(readAttribution(dateAfter(90))).toBeNull();
    expect(window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toBeNull();
  });

  it.each([
    "not-json",
    JSON.stringify({ schema_version: 2, model: "first_last_tagged" }),
    JSON.stringify({
      schema_version: 1,
      model: "first_last_tagged",
      first_touch: { malicious: true },
      last_touch: { malicious: true },
    }),
  ])("fails closed and removes invalid stored attribution", (stored) => {
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, stored);

    expect(readAttribution(start)).toBeNull();
    expect(window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toBeNull();
  });

  it("keeps a fresh in-memory snapshot when persistent storage is unavailable", () => {
    writePrivacyConsent("all", start.toISOString());
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key === ATTRIBUTION_STORAGE_KEY) throw new Error("storage blocked");
      return originalSetItem.call(this, key, value);
    });

    const captured = captureAttributionIfAllowed(taggedUrl(), start);

    expect(captured?.last_touch?.gclid).toBe("CaseSensitive-GCLID_123");
    expect(window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toBeNull();
    expect(getAttributionForLead(start)).toEqual(captured);
  });

  it("clears both persistent and in-memory attribution", () => {
    writePrivacyConsent("all", start.toISOString());
    captureAttributionIfAllowed(taggedUrl(), start);

    clearAttribution();

    expect(window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toBeNull();
    expect(getAttributionForLead(start)).toBeNull();
  });
});
