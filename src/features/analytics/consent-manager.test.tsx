import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConsentManager, ConsentSettingsButton } from "./consent-manager";
import { PRIVACY_CONSENT_STORAGE_KEY, writePrivacyConsent } from "./consent";

const gtmId = "GTM-MWW3HWHR";

function storedConsent() {
  return JSON.parse(
    window.localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY) ?? "null",
  );
}

function consentCommands() {
  return (window.dataLayer ?? [])
    .filter((item): item is ArrayLike<unknown> => {
      return (
        typeof item === "object" &&
        item !== null &&
        "length" in item &&
        Array.from(item as ArrayLike<unknown>)[0] === "consent"
      );
    })
    .map((item) => Array.from(item));
}

describe("ConsentManager", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.dataLayer = [];
    delete window.gtag;
    delete window.__ddboxConsentDefaultSet;
    document.getElementById("ddbox-google-tag-manager")?.remove();
  });

  it("keeps GTM blocked and persists necessary-only across refresh", async () => {
    const firstRender = render(<ConsentManager gtmId={gtmId} />);

    expect(
      await screen.findByRole("heading", {
        name: "เลือกการใช้ข้อมูลบนเว็บไซต์",
      }),
    ).toBeInTheDocument();
    expect(
      document.getElementById("ddbox-google-tag-manager"),
    ).not.toBeInTheDocument();
    expect(consentCommands()[0]).toEqual([
      "consent",
      "default",
      {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      },
    ]);

    fireEvent.click(screen.getByRole("button", { name: "ใช้เฉพาะที่จำเป็น" }));

    expect(storedConsent()).toMatchObject({ version: 1, mode: "necessary" });
    expect(
      document.getElementById("ddbox-google-tag-manager"),
    ).not.toBeInTheDocument();
    expect(window.dataLayer).toContainEqual({
      event: "ddbox_consent_updated",
      consent_mode: "necessary",
    });

    firstRender.unmount();
    render(<ConsentManager gtmId={gtmId} />);

    expect(
      screen.queryByRole("heading", {
        name: "เลือกการใช้ข้อมูลบนเว็บไซต์",
      }),
    ).not.toBeInTheDocument();
    expect(
      document.getElementById("ddbox-google-tag-manager"),
    ).not.toBeInTheDocument();
  });

  it("updates all four consent types, emits lifecycle events and then loads GTM", async () => {
    render(<ConsentManager gtmId={gtmId} />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "ยอมรับการวัดผลและโฆษณา",
      }),
    );

    await waitFor(() =>
      expect(
        document.getElementById("ddbox-google-tag-manager"),
      ).toHaveAttribute(
        "src",
        `https://www.googletagmanager.com/gtm.js?id=${gtmId}`,
      ),
    );
    expect(storedConsent()).toMatchObject({ version: 1, mode: "all" });
    expect(consentCommands()[0]).toEqual([
      "consent",
      "default",
      {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      },
    ]);
    expect(consentCommands()[1]).toEqual([
      "consent",
      "update",
      {
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      },
    ]);
    expect(consentCommands()).toHaveLength(2);
    expect(window.dataLayer).toContainEqual({
      event: "ddbox_consent_granted",
    });
    expect(window.dataLayer).toContainEqual({
      event: "ddbox_consent_updated",
      consent_mode: "all",
    });
  });

  it("restores an all choice and grants consent before loading GTM", async () => {
    writePrivacyConsent("all", "2026-09-09T08:05:00.000Z");
    window.dataLayer = [];

    render(<ConsentManager gtmId={gtmId} />);

    await waitFor(() =>
      expect(
        document.getElementById("ddbox-google-tag-manager"),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("heading", {
        name: "เลือกการใช้ข้อมูลบนเว็บไซต์",
      }),
    ).not.toBeInTheDocument();
    expect(consentCommands().map((command) => command[1])).toEqual([
      "default",
      "update",
    ]);
    expect(window.dataLayer).toContainEqual({
      event: "ddbox_consent_granted",
    });
  });

  it("lets a visitor reopen their saved choice from the footer", async () => {
    writePrivacyConsent("necessary", "2026-09-09T08:00:00.000Z");
    render(
      <>
        <ConsentSettingsButton gtmId={gtmId} />
        <ConsentManager gtmId={gtmId} />
      </>,
    );

    expect(
      screen.queryByRole("heading", {
        name: "เลือกการใช้ข้อมูลบนเว็บไซต์",
      }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "ตั้งค่าความเป็นส่วนตัว" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "เลือกการใช้ข้อมูลบนเว็บไซต์",
      }),
    ).toBeInTheDocument();
  });

  it("revokes measurement, persists necessary-only and reloads the page", async () => {
    const reloadPage = vi.fn();
    writePrivacyConsent("all", "2026-09-09T08:05:00.000Z");
    window.dataLayer = [];
    render(
      <>
        <ConsentSettingsButton gtmId={gtmId} />
        <ConsentManager gtmId={gtmId} reloadPage={reloadPage} />
      </>,
    );
    await waitFor(() =>
      expect(
        document.getElementById("ddbox-google-tag-manager"),
      ).toBeInTheDocument(),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "ตั้งค่าความเป็นส่วนตัว" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "ใช้เฉพาะที่จำเป็น" }),
    );

    expect(storedConsent()).toMatchObject({ version: 1, mode: "necessary" });
    expect(consentCommands().at(-1)?.[2]).toEqual({
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    expect(reloadPage).toHaveBeenCalledOnce();
  });

  it("classifies only allowlisted LINE hosts and includes contact context", async () => {
    writePrivacyConsent("all", "2026-09-09T08:05:00.000Z");
    window.dataLayer = [];
    render(
      <>
        <ConsentManager gtmId={gtmId} />
        <div className="site-footer">
          <a
            href="https://lin.ee/example"
            onClick={(event) => event.preventDefault()}
          >
            LINE ทั่วไป
          </a>
        </div>
        <a
          href="https://line.me/R/oaMessage/example"
          data-contact-context="after_quote"
          onClick={(event) => event.preventDefault()}
        >
          LINE หลังส่งฟอร์ม
        </a>
        <a
          href="https://line.me.attacker.example/path"
          onClick={(event) => event.preventDefault()}
        >
          ลิงก์ที่ไม่ใช่ LINE
        </a>
        <div className="mobile-actions">
          <a
            href="tel:0846789714"
            data-contact-context="after_quote"
            onClick={(event) => event.preventDefault()}
          >
            โทรหลังส่งฟอร์ม
          </a>
        </div>
      </>,
    );
    await waitFor(() =>
      expect(
        document.getElementById("ddbox-google-tag-manager"),
      ).toBeInTheDocument(),
    );
    window.dataLayer = [];

    fireEvent.click(screen.getByRole("link", { name: "LINE ทั่วไป" }));
    fireEvent.click(screen.getByRole("link", { name: "LINE หลังส่งฟอร์ม" }));
    fireEvent.click(screen.getByRole("link", { name: "ลิงก์ที่ไม่ใช่ LINE" }));
    fireEvent.click(screen.getByRole("link", { name: "โทรหลังส่งฟอร์ม" }));

    expect(window.dataLayer).toEqual([
      {
        event: "line_click",
        location: "footer",
        contact_context: "general",
      },
      {
        event: "line_click",
        location: "content",
        contact_context: "after_quote",
      },
      {
        event: "phone_click",
        location: "mobile",
        contact_context: "after_quote",
      },
    ]);
  });

  it("keeps contact links functional without measurement consent", () => {
    writePrivacyConsent("necessary", "2026-09-09T08:00:00.000Z");
    window.dataLayer = [];
    render(
      <>
        <ConsentManager gtmId={gtmId} />
        <a href="tel:0846789714" onClick={(event) => event.preventDefault()}>
          โทรหาเรา
        </a>
        <a
          href="https://line.me/R/ti/p/example"
          onClick={(event) => event.preventDefault()}
        >
          เปิด LINE
        </a>
      </>,
    );
    window.dataLayer = [];

    fireEvent.click(screen.getByRole("link", { name: "โทรหาเรา" }));
    fireEvent.click(screen.getByRole("link", { name: "เปิด LINE" }));

    expect(window.dataLayer).toEqual([]);
    expect(screen.getByRole("link", { name: "โทรหาเรา" })).toHaveAttribute(
      "href",
      "tel:0846789714",
    );
    expect(screen.getByRole("link", { name: "เปิด LINE" })).toHaveAttribute(
      "href",
      "https://line.me/R/ti/p/example",
    );
  });
});
