export const PRIVACY_CONSENT_STORAGE_KEY = "ddbox_privacy_consent";
export const LEGACY_ANALYTICS_CONSENT_STORAGE_KEY =
  "ddbox.analytics-consent.v1";
export const PRIVACY_CONSENT_VERSION = 1;
export const OPEN_CONSENT_SETTINGS_EVENT = "ddbox:open-consent-settings";
export const ANALYTICS_CONSENT_CHANGED_EVENT =
  "ddbox:analytics-consent-changed";

export type PrivacyConsentMode = "necessary" | "all";
export type AnalyticsLocation = "header" | "footer" | "mobile" | "content";
export type CustomerPath = "has_specifications" | "needs_guidance";
export type ContactContext = "general" | "after_quote";
export type QuantityBand =
  | "under_10"
  | "10_99"
  | "100_499"
  | "500_1000"
  | "1001_3000"
  | "over_3000"
  | "unknown";

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
  | {
      event: "line_click";
      location: AnalyticsLocation;
      contact_context: ContactContext;
    }
  | {
      event: "phone_click";
      location: AnalyticsLocation;
      contact_context: ContactContext;
    }
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
  | {
      event: "quote_submit";
      customer_path: CustomerPath;
      quantity_band: QuantityBand;
    };

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

const ANALYTICS_LOCATIONS = ["header", "footer", "mobile", "content"] as const;
const CUSTOMER_PATHS = ["has_specifications", "needs_guidance"] as const;
const CONTACT_CONTEXTS = ["general", "after_quote"] as const;
const QUANTITY_BANDS = [
  "under_10",
  "10_99",
  "100_499",
  "500_1000",
  "1001_3000",
  "over_3000",
  "unknown",
] as const;

function isAllowedValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return (
    typeof value === "string" && (allowed as readonly string[]).includes(value)
  );
}

function allowlistedAnalyticsEvent(value: unknown): AnalyticsEvent | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;

  switch (candidate.event) {
    case "primary_cta_click":
      if (
        candidate.destination !== "quote" ||
        !isAllowedValue(candidate.location, ANALYTICS_LOCATIONS)
      )
        return null;
      return {
        event: "primary_cta_click",
        destination: "quote",
        location: candidate.location,
      };
    case "line_click":
    case "phone_click":
      if (
        !isAllowedValue(candidate.location, ANALYTICS_LOCATIONS) ||
        !isAllowedValue(candidate.contact_context, CONTACT_CONTEXTS)
      )
        return null;
      return {
        event: candidate.event,
        location: candidate.location,
        contact_context: candidate.contact_context,
      };
    case "customer_path_selected":
      if (!isAllowedValue(candidate.customer_path, CUSTOMER_PATHS)) return null;
      return {
        event: "customer_path_selected",
        customer_path: candidate.customer_path,
      };
    case "quote_step_complete":
      if (
        (candidate.step_number !== 1 && candidate.step_number !== 2) ||
        !isAllowedValue(candidate.customer_path, CUSTOMER_PATHS)
      )
        return null;
      return {
        event: "quote_step_complete",
        step_number: candidate.step_number,
        customer_path: candidate.customer_path,
      };
    case "quote_start":
      return { event: "quote_start" };
    case "quote_submit":
      if (
        !isAllowedValue(candidate.customer_path, CUSTOMER_PATHS) ||
        !isAllowedValue(candidate.quantity_band, QUANTITY_BANDS)
      )
        return null;
      return {
        event: "quote_submit",
        customer_path: candidate.customer_path,
        quantity_band: candidate.quantity_band,
      };
    default:
      return null;
  }
}

export function quantityBand(quantity: unknown): QuantityBand {
  if (
    typeof quantity !== "number" ||
    !Number.isFinite(quantity) ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  )
    return "unknown";
  if (quantity < 10) return "under_10";
  if (quantity < 100) return "10_99";
  if (quantity < 500) return "100_499";
  if (quantity <= 1_000) return "500_1000";
  if (quantity <= 3_000) return "1001_3000";
  return "over_3000";
}

export function trackAnalyticsEvent(event: AnalyticsEvent): void;
export function trackAnalyticsEvent(event: unknown): void {
  try {
    if (typeof window === "undefined") return;
    if (readPrivacyConsent()?.mode !== "all") return;
    const payload = allowlistedAnalyticsEvent(event);
    if (!payload) return;
    window.dataLayer ??= [];
    window.dataLayer.push(payload);
  } catch {
    // Measurement must never block navigation, contact actions, or lead capture.
  }
}

export function analyticsLocation(element: Element): AnalyticsLocation {
  if (element.closest(".site-header")) return "header";
  if (element.closest(".site-footer")) return "footer";
  if (element.closest(".mobile-actions")) return "mobile";
  return "content";
}
