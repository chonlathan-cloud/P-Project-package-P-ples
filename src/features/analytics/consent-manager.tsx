"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { captureAttributionIfAllowed, clearAttribution } from "./attribution";
import {
  ANALYTICS_CONSENT_CHANGED_EVENT,
  DEFAULT_DENIED_CONSENT,
  GRANTED_CONSENT,
  LEGACY_ANALYTICS_CONSENT_STORAGE_KEY,
  OPEN_CONSENT_SETTINGS_EVENT,
  PRIVACY_CONSENT_STORAGE_KEY,
  analyticsLocation,
  isValidGtmId,
  readPrivacyConsent,
  trackAnalyticsEvent,
  writePrivacyConsent,
  type PrivacyConsentMode,
} from "./consent";

const configuredGtmId = process.env.NEXT_PUBLIC_GTM_ID ?? "";
const GTM_SCRIPT_ID = "ddbox-google-tag-manager";
const LINE_HOSTNAMES = new Set(["line.me", "lin.ee"]);
type ConsentSnapshot = PrivacyConsentMode | "unset" | "pending";
type ConsentState = typeof DEFAULT_DENIED_CONSENT | typeof GRANTED_CONSENT;

function pushConsentCommand(
  command: "default" | "update",
  consent: ConsentState,
) {
  window.dataLayer ??= [];
  window.gtag ??= (...commandArguments: unknown[]) => {
    window.dataLayer?.push(commandArguments);
  };
  window.gtag("consent", command, consent);
}

function ensureDefaultDeniedConsent() {
  if (window.__ddboxConsentDefaultSet) return;
  pushConsentCommand("default", DEFAULT_DENIED_CONSENT);
  window.__ddboxConsentDefaultSet = true;
}

function pushConsentLifecycleEvents(
  mode: PrivacyConsentMode,
  includeUpdatedEvent: boolean,
) {
  window.dataLayer ??= [];
  if (mode === "all") {
    window.dataLayer.push({ event: "ddbox_consent_granted" });
  }
  if (includeUpdatedEvent) {
    window.dataLayer.push({
      event: "ddbox_consent_updated",
      consent_mode: mode,
    });
  }
}

function loadGoogleTagManager(gtmId: string) {
  if (!isValidGtmId(gtmId) || document.getElementById(GTM_SCRIPT_ID)) return;

  window.dataLayer ??= [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

  const script = document.createElement("script");
  script.id = GTM_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
  document.head.append(script);
}

function applyConsentChoice(
  mode: PrivacyConsentMode,
  gtmId: string,
  includeUpdatedEvent: boolean,
) {
  ensureDefaultDeniedConsent();
  if (mode === "all") {
    pushConsentCommand("update", GRANTED_CONSENT);
    pushConsentLifecycleEvents(mode, includeUpdatedEvent);
    loadGoogleTagManager(gtmId);
    return;
  }

  pushConsentCommand("update", DEFAULT_DENIED_CONSENT);
  if (includeUpdatedEvent) pushConsentLifecycleEvents(mode, true);
}

function classifyTrackedLink(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute("href") ?? "";
  const location = analyticsLocation(anchor);
  const contactContext =
    anchor.dataset.contactContext === "after_quote" ? "after_quote" : "general";
  let url: URL | null = null;

  try {
    url = new URL(href, window.location.href);
  } catch {
    // Invalid links remain navigable but are not classified for measurement.
  }

  if (url?.protocol === "tel:") {
    trackAnalyticsEvent({
      event: "phone_click",
      location,
      contact_context: contactContext,
    });
    return;
  }
  if (
    url?.protocol === "https:" &&
    LINE_HOSTNAMES.has(url.hostname.toLowerCase())
  ) {
    trackAnalyticsEvent({
      event: "line_click",
      location,
      contact_context: contactContext,
    });
    return;
  }
  if (href === "/quote" || href.startsWith("/quote?")) {
    trackAnalyticsEvent({
      event: "primary_cta_click",
      destination: "quote",
      location,
    });
  }
}

function subscribeToConsent(onStoreChange: () => void) {
  const storageChanged = (event: StorageEvent) => {
    if (
      event.key === PRIVACY_CONSENT_STORAGE_KEY ||
      event.key === LEGACY_ANALYTICS_CONSENT_STORAGE_KEY
    ) {
      onStoreChange();
    }
  };
  window.addEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, onStoreChange);
  window.addEventListener("storage", storageChanged);
  return () => {
    window.removeEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, onStoreChange);
    window.removeEventListener("storage", storageChanged);
  };
}

function getConsentSnapshot(): ConsentSnapshot {
  return readPrivacyConsent()?.mode ?? "unset";
}

function getServerConsentSnapshot(): ConsentSnapshot {
  return "pending";
}

export function ConsentManager({
  gtmId = configuredGtmId,
  reloadPage = () => window.location.reload(),
}: {
  gtmId?: string;
  reloadPage?: () => void;
}) {
  const enabled = isValidGtmId(gtmId);
  const choice = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );
  const pathname = usePathname();
  const searchParameters = useSearchParams();
  const trackedLocation = `${pathname}${searchParameters.size > 0 ? `?${searchParameters.toString()}` : ""}`;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const appliedChoice = useRef<PrivacyConsentMode | null>(null);

  useEffect(() => {
    if (!enabled) return;

    ensureDefaultDeniedConsent();
    if (
      (choice === "all" || choice === "necessary") &&
      appliedChoice.current !== choice
    ) {
      applyConsentChoice(choice, gtmId, false);
      appliedChoice.current = choice;
    }
  }, [choice, enabled, gtmId]);

  useEffect(() => {
    if (!enabled || choice === "pending") return;
    if (choice === "all") {
      captureAttributionIfAllowed(trackedLocation);
      return;
    }
    clearAttribution();
  }, [choice, enabled, trackedLocation]);

  useEffect(() => {
    if (!enabled) return;

    const openSettings = () => setSettingsOpen(true);
    const trackLink = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (anchor) classifyTrackedLink(anchor);
    };

    window.addEventListener(OPEN_CONSENT_SETTINGS_EVENT, openSettings);
    document.addEventListener("click", trackLink);
    return () => {
      window.removeEventListener(OPEN_CONSENT_SETTINGS_EVENT, openSettings);
      document.removeEventListener("click", trackLink);
    };
  }, [enabled]);

  useEffect(() => {
    if (choice !== "all" || window.location.pathname !== "/quote") return;
    trackAnalyticsEvent({ event: "quote_start" });
  }, [choice]);

  if (!enabled || choice === "pending" || (!settingsOpen && choice !== "unset"))
    return null;

  function choose(nextChoice: PrivacyConsentMode) {
    const previousChoice = readPrivacyConsent()?.mode;
    if (nextChoice === "necessary") clearAttribution();
    writePrivacyConsent(nextChoice);
    setSettingsOpen(false);
    applyConsentChoice(nextChoice, gtmId, true);
    appliedChoice.current = nextChoice;
    if (nextChoice === "all") captureAttributionIfAllowed(trackedLocation);

    if (nextChoice === "necessary" && previousChoice === "all") reloadPage();
  }

  return (
    <aside
      className="tracking-consent-banner"
      aria-labelledby="tracking-consent-title"
      aria-describedby="tracking-consent-description"
    >
      <div>
        <p className="eyebrow">PRIVACY CHOICE</p>
        <h2 id="tracking-consent-title">เลือกการใช้ข้อมูลบนเว็บไซต์</h2>
        <p id="tracking-consent-description">
          เว็บไซต์ใช้เฉพาะระบบที่จำเป็นเป็นค่าเริ่มต้น
          และจะไม่เปิดใช้งานเครื่องมือวิเคราะห์การใช้งานหรือการวัดผลโฆษณา
          จนกว่าคุณจะให้ความยินยอม
        </p>
        <Link className="text-link" href="/privacy#tracking">
          อ่านรายละเอียดความเป็นส่วนตัว
        </Link>
      </div>
      <div className="tracking-consent-actions">
        <button
          className="button-secondary"
          type="button"
          onClick={() => choose("necessary")}
        >
          ใช้เฉพาะที่จำเป็น
        </button>
        <button className="button" type="button" onClick={() => choose("all")}>
          ยอมรับการวัดผลและโฆษณา
        </button>
      </div>
    </aside>
  );
}

export function ConsentSettingsButton({
  gtmId = configuredGtmId,
}: {
  gtmId?: string;
}) {
  if (!isValidGtmId(gtmId)) return null;

  return (
    <button
      className="footer-consent-control"
      type="button"
      onClick={() =>
        window.dispatchEvent(new Event(OPEN_CONSENT_SETTINGS_EVENT))
      }
    >
      ตั้งค่าความเป็นส่วนตัว
    </button>
  );
}
