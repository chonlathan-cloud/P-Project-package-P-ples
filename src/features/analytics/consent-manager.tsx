"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ANALYTICS_CONSENT_CHANGED_EVENT,
  ANALYTICS_CONSENT_STORAGE_KEY,
  OPEN_CONSENT_SETTINGS_EVENT,
  analyticsLocation,
  isValidGtmId,
  readAnalyticsConsent,
  trackAnalyticsEvent,
  writeAnalyticsConsent,
  type AnalyticsConsent,
} from "./consent";

const configuredGtmId = process.env.NEXT_PUBLIC_GTM_ID ?? "";
const GTM_SCRIPT_ID = "ddbox-google-tag-manager";
type ConsentSnapshot = AnalyticsConsent | "unset" | "pending";

const grantedConsent = {
  ad_storage: "granted",
  analytics_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
};

const deniedConsent = {
  ad_storage: "denied",
  analytics_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
};

function pushConsentCommand(
  command: "default" | "update",
  consent: typeof grantedConsent | typeof deniedConsent,
) {
  window.dataLayer ??= [];
  function gtag(...commandArguments: unknown[]) {
    window.dataLayer?.push(commandArguments);
  }
  gtag("consent", command, consent);
}

function loadGoogleTagManager(gtmId: string) {
  if (!isValidGtmId(gtmId) || document.getElementById(GTM_SCRIPT_ID)) return;

  window.dataLayer ??= [];
  pushConsentCommand("default", grantedConsent);
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

  const script = document.createElement("script");
  script.id = GTM_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
  document.head.append(script);
}

function classifyTrackedLink(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute("href") ?? "";
  const location = analyticsLocation(anchor);

  if (href.startsWith("tel:")) {
    trackAnalyticsEvent({ event: "phone_click", location });
    return;
  }
  if (href.includes("line.me") || href.includes("lin.ee")) {
    trackAnalyticsEvent({ event: "line_click", location });
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
    if (event.key === ANALYTICS_CONSENT_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, onStoreChange);
  window.addEventListener("storage", storageChanged);
  return () => {
    window.removeEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, onStoreChange);
    window.removeEventListener("storage", storageChanged);
  };
}

function getConsentSnapshot(): ConsentSnapshot {
  return readAnalyticsConsent() ?? "unset";
}

function getServerConsentSnapshot(): ConsentSnapshot {
  return "pending";
}

export function ConsentManager({
  gtmId = configuredGtmId,
}: {
  gtmId?: string;
}) {
  const enabled = isValidGtmId(gtmId);
  const choice = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    if (choice === "granted") loadGoogleTagManager(gtmId);

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
  }, [choice, enabled, gtmId]);

  useEffect(() => {
    if (choice !== "granted" || window.location.pathname !== "/quote") return;
    trackAnalyticsEvent({ event: "quote_start" });
  }, [choice]);

  if (!enabled || choice === "pending" || (!settingsOpen && choice !== "unset"))
    return null;

  function choose(nextChoice: AnalyticsConsent) {
    const previousChoice = readAnalyticsConsent();
    writeAnalyticsConsent(nextChoice);
    setSettingsOpen(false);

    if (nextChoice === "granted") {
      loadGoogleTagManager(gtmId);
      return;
    }

    if (previousChoice === "granted" && window.dataLayer) {
      pushConsentCommand("update", deniedConsent);
      window.location.reload();
    }
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
          เว็บไซต์ใช้เฉพาะระบบที่จำเป็นเป็นค่าเริ่มต้น และจะโหลด Google Tag
          Manager เพื่อวัดผลการใช้งานและโฆษณาเมื่อคุณยอมรับเท่านั้น
        </p>
        <Link className="text-link" href="/privacy#tracking">
          อ่านรายละเอียดความเป็นส่วนตัว
        </Link>
      </div>
      <div className="tracking-consent-actions">
        <button
          className="button-secondary"
          type="button"
          onClick={() => choose("denied")}
        >
          ใช้เฉพาะที่จำเป็น
        </button>
        <button
          className="button"
          type="button"
          onClick={() => choose("granted")}
        >
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
      ตั้งค่าการวัดผล
    </button>
  );
}
