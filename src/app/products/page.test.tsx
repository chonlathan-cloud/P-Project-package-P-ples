import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProductsPage from "./page";

describe("ProductsPage guidance", () => {
  it("keeps one clear route for customers who need help choosing a service", () => {
    render(<ProductsPage />);

    const heading = screen.getByRole("heading", {
      name: "ยังไม่แน่ใจว่าควรเริ่มจากงานแบบไหน",
    });
    const section = heading.closest("section");

    expect(section).not.toBeNull();

    const guidance = within(section!);
    expect(guidance.getAllByRole("link")).toHaveLength(1);
    expect(
      guidance.getByRole("link", { name: "ดูวิธีเริ่มงาน" }),
    ).toHaveAttribute("href", "/solutions");
  });
});
