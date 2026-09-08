import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PrivacyPage, { metadata } from "./page";

describe("PrivacyPage", () => {
  it("publishes the approved notice metadata without a page-level noindex", () => {
    expect(metadata.title).toBe("ประกาศความเป็นส่วนตัว");
    expect(metadata.robots).toBeUndefined();
    expect(metadata.alternates).toEqual({ canonical: "/privacy" });
  });

  it("states the effective date, retention and consent-gated tracking configuration", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole("heading", { name: "ประกาศความเป็นส่วนตัว", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("8 กันยายน 2569")).toBeInTheDocument();
    expect(
      screen.getByText(/ไม่เกิน 24 เดือนนับจากการติดต่อล่าสุด/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Google Analytics 4 หรือ Google Ads conversion tag/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Basic Consent Mode/)).toBeInTheDocument();
    expect(screen.getByText(/จะไม่ถูกโหลดก่อนที่คุณจะกด/)).toBeInTheDocument();
    expect(screen.getByText(/ไม่รวมชื่อ เบอร์โทรศัพท์/)).toBeInTheDocument();
    expect(
      screen.getByText(/Google Cloud สำหรับโฮสต์ระบบ/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "ส่งอีเมลเรื่องข้อมูลส่วนบุคคล" }),
    ).toHaveAttribute("href", "mailto:Nuntha@ddboxprinting.com");
  });
});
