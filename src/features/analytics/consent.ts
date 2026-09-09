export const PRIVACY_CONSENT_STORAGE_KEY = "ddbox_privacy_consent";
export const LEGACY_ANALYTICS_CONSENT_STORAGE_KEY =
  "ddbox.analytics-consent.v1";
export const PRIVACY_CONSENT_VERSION = 1;
export const OPEN_CONSENT_SETTINGS_EVENT = "ddbox:open-consent-settings";
export const ANALYTICS_CONSENT_CHANGED_EVENT =
  "ddbox:analytics-consent-changed";

export type PrivacyConsentMode = "necessary" | "all";

export type DdboxPrivacyConsent = Readonly<{
  version: typeof PRIVACY_CONSENT_VERSION;
  mode: PrivacyConsentMode;
  updatedAt: string;
}>;

let inMemoryConsent: DdboxPrivacyConsent | null = null;
let usesInMemoryFallback = false;

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
    gtag?: (...args: unknown[]) => void;
    __ddboxConsentDefaultSet?: boolean;
  }
}

export const DEFAULT_DENIED_CONSENT = Object.freeze({
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
});

export const GRANTED_CONSENT = Object.freeze({
  analytics_storage: "granted",
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
});

export const CONSENT_DEFAULT_BOOTSTRAP_SCRIPT = `
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
window.gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied'
});
window.__ddboxConsentDefaultSet = true;
`;

export function isValidGtmId(value: string): boolean {
  return /^GTM-[A-Z0-9]+$/.test(value);
}

function isPrivacyConsent(value: unknown): value is DdboxPrivacyConsent {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === PRIVACY_CONSENT_VERSION &&
    (candidate.mode === "necessary" || candidate.mode === "all") &&
    typeof candidate.updatedAt === "string" &&
    Number.isFinite(Date.parse(candidate.updatedAt))
  );
}

function createPrivacyConsent(
  mode: PrivacyConsentMode,
  updatedAt = new Date().toISOString(),
): DdboxPrivacyConsent {
  return { version: PRIVACY_CONSENT_VERSION, mode, updatedAt };
}

function migrateLegacyConsent(): DdboxPrivacyConsent | null {
  const legacy = window.localStorage.getItem(
    LEGACY_ANALYTICS_CONSENT_STORAGE_KEY,
  );
  if (legacy !== "granted" && legacy !== "denied") return null;

  const migrated = createPrivacyConsent(
    legacy === "granted" ? "all" : "necessary",
  );
  window.localStorage.setItem(
    PRIVACY_CONSENT_STORAGE_KEY,
    JSON.stringify(migrated),
  );
  window.localStorage.removeItem(LEGACY_ANALYTICS_CONSENT_STORAGE_KEY);
  inMemoryConsent = migrated;
  usesInMemoryFallback = false;
  return migrated;
}

export function readPrivacyConsent(): DdboxPrivacyConsent | null {
  try {
    const raw = window.localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY);
    if (raw === null) {
      const migrated = migrateLegacyConsent();
      if (migrated) return migrated;
      return usesInMemoryFallback ? inMemoryConsent : null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      window.localStorage.removeItem(PRIVACY_CONSENT_STORAGE_KEY);
      inMemoryConsent = null;
      usesInMemoryFallback = false;
      return null;
    }
    if (isPrivacyConsent(parsed)) {
      inMemoryConsent = parsed;
      usesInMemoryFallback = false;
      return parsed;
    }

    window.localStorage.removeItem(PRIVACY_CONSENT_STORAGE_KEY);
    inMemoryConsent = null;
    usesInMemoryFallback = false;
    return null;
  } catch {
    return inMemoryConsent;
  }
}

export function writePrivacyConsent(
  mode: PrivacyConsentMode,
  updatedAt = new Date().toISOString(),
): DdboxPrivacyConsent {
  const consent = createPrivacyConsent(mode, updatedAt);
  inMemoryConsent = consent;
  try {
    window.localStorage.setItem(
      PRIVACY_CONSENT_STORAGE_KEY,
      JSON.stringify(consent),
    );
    window.localStorage.removeItem(LEGACY_ANALYTICS_CONSENT_STORAGE_KEY);
    usesInMemoryFallback = false;
  } catch {
    usesInMemoryFallback = true;
  }
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_CHANGED_EVENT));
  return consent;
}

export function trackAnalyticsEvent(event: AnalyticsEvent): void {
  if (readPrivacyConsent()?.mode !== "all") return;
  window.dataLayer ??= [];
  window.dataLayer.push(event);
}

export function analyticsLocation(element: Element): AnalyticsLocation {
  if (element.closest(".site-header")) return "header";
  if (element.closest(".site-footer")) return "footer";
  if (element.closest(".mobile-actions")) return "mobile";
  return "content";
}
