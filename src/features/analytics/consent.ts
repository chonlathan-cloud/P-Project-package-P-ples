export const ANALYTICS_CONSENT_STORAGE_KEY = "ddbox.analytics-consent.v1";
export const OPEN_CONSENT_SETTINGS_EVENT = "ddbox:open-consent-settings";
export const ANALYTICS_CONSENT_CHANGED_EVENT =
  "ddbox:analytics-consent-changed";

export type AnalyticsConsent = "granted" | "denied";
let inMemoryConsent: AnalyticsConsent | null = null;

export type AnalyticsEvent =
  | {
      event: "primary_cta_click";
      destination: "quote";
      location: AnalyticsLocation;
    }
  | { event: "line_click"; location: AnalyticsLocation }
  | { event: "phone_click"; location: AnalyticsLocation }
  | {
      event: "customer_path_selected";
      customer_path: CustomerPath;
    }
  | {
      event: "quote_step_complete";
      step_number: 1 | 2;
      customer_path: CustomerPath;
    }
  | { event: "quote_start" }
  | { event: "quote_submit"; customer_path: CustomerPath };

type AnalyticsLocation = "header" | "footer" | "mobile" | "content";
type CustomerPath = "has_specifications" | "needs_guidance";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function isValidGtmId(value: string): boolean {
  return /^GTM-[A-Z0-9]+$/.test(value);
}

export function readAnalyticsConsent(): AnalyticsConsent | null {
  try {
    const stored = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    return stored === "granted" || stored === "denied" ? stored : null;
  } catch {
    return inMemoryConsent;
  }
}

export function writeAnalyticsConsent(value: AnalyticsConsent): void {
  inMemoryConsent = value;
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, value);
  } catch {
    // The in-memory value still applies for the current page.
  }
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_CHANGED_EVENT));
}

export function trackAnalyticsEvent(event: AnalyticsEvent): void {
  if (readAnalyticsConsent() !== "granted") return;
  window.dataLayer ??= [];
  window.dataLayer.push(event);
}

export function analyticsLocation(element: Element): AnalyticsLocation {
  if (element.closest(".site-header")) return "header";
  if (element.closest(".site-footer")) return "footer";
  if (element.closest(".mobile-actions")) return "mobile";
  return "content";
}
