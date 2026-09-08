import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ConsentManager, ConsentSettingsButton } from "./consent-manager";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "./consent";

const gtmId = "GTM-MWW3HWHR";

describe("ConsentManager", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.dataLayer = [];
    document.getElementById("ddbox-google-tag-manager")?.remove();
  });

  it("does not load GTM before the visitor grants consent", async () => {
    render(<ConsentManager gtmId={gtmId} />);

    expect(
      await screen.findByRole("heading", {
        name: "เลือกการใช้ข้อมูลบนเว็บไซต์",
      }),
    ).toBeInTheDocument();
    expect(
      document.getElementById("ddbox-google-tag-manager"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "ใช้เฉพาะที่จำเป็น" }));

    expect(window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe(
      "denied",
    );
    expect(
      document.getElementById("ddbox-google-tag-manager"),
    ).not.toBeInTheDocument();
  });

  it("loads the configured container only after consent is granted", async () => {
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
    expect(window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe(
      "granted",
    );
    expect(Array.from(window.dataLayer?.[0] as ArrayLike<unknown>)).toEqual([
      "consent",
      "default",
      {
        ad_storage: "granted",
        analytics_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      },
    ]);
  });

  it("lets a visitor reopen their saved choice from the footer", async () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "denied");
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
    fireEvent.click(screen.getByRole("button", { name: "ตั้งค่าการวัดผล" }));

    expect(
      await screen.findByRole("heading", {
        name: "เลือกการใช้ข้อมูลบนเว็บไซต์",
      }),
    ).toBeInTheDocument();
  });
});
