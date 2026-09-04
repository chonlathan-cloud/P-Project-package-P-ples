import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import QuotePage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("QuotePage", () => {
  it("uses packaging evidence as the visual anchor and keeps reassurance concise", async () => {
    render(await QuotePage({ searchParams: Promise.resolve({}) }));

    const visual = screen.getByRole("img", {
      name: "ภาพประกอบการวัดกล่องและเตรียมข้อมูลโครงสร้างบรรจุภัณฑ์",
    });
    expect(visual.getAttribute("src")).toContain(
      "quote-brief-workspace-v1.webp",
    );
    expect(screen.getByText("เริ่มได้แม้ยังไม่มีแบบ")).toBeInTheDocument();
    expect(
      screen.getByText("ทีมตรวจรายละเอียดก่อนเสนอราคา"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("กดส่งซ้ำจะไม่สร้างรายการซ้ำ"),
    ).not.toBeInTheDocument();
  });
});
