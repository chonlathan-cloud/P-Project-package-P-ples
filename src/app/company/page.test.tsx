import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CompanyPage from "./page";

describe("CompanyPage closing paths", () => {
  it("keeps the two customer paths distinct and actionable", () => {
    render(<CompanyPage />);

    const heading = screen.getByRole("heading", {
      name: "เริ่มจากข้อมูลที่คุณมี",
    });
    const section = heading.closest("section");

    expect(section).not.toBeNull();

    const closing = within(section!);
    expect(
      closing.getByRole("link", { name: "ส่งสเปกเพื่อประเมินงาน" }),
    ).toHaveAttribute("href", "/quote?path=has_specifications");

    const guidanceLink = closing.getByRole("link", {
      name: "ส่งข้อมูลสินค้าให้ทีมแนะนำ",
    });
    expect(guidanceLink).toHaveAttribute("href", "/quote?path=needs_guidance");
    expect(guidanceLink).toHaveClass("button-secondary");
    expect(guidanceLink).not.toHaveClass("button");
    expect(guidanceLink).not.toHaveClass("button-outline-light");
  });
});
