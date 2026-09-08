import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TermsPage, { metadata } from "./page";

describe("TermsPage", () => {
  it("keeps the draft terms out of search indexes", () => {
    expect(metadata.title).toBe("เงื่อนไขการใช้เว็บไซต์ (ฉบับรอตรวจสอบ)");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("explains the website, quote and file-rights boundaries", () => {
    render(<TermsPage />);

    expect(
      screen.getByRole("heading", {
        name: "เงื่อนไขการใช้เว็บไซต์",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("ฉบับรอตรวจสอบ")).toBeInTheDocument();
    expect(
      screen.getByText(/ยังไม่ใช่ใบเสนอราคา การรับคำสั่งซื้อ/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "ไฟล์ Artwork และสิทธิของผู้ส่ง",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "ประกาศความเป็นส่วนตัว" }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: "ส่งอีเมลสอบถามเงื่อนไข" }),
    ).toHaveAttribute("href", "mailto:Nuntha@ddboxprinting.com");
  });
});
