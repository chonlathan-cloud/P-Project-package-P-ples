import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { company } from "@/content/company";
import ThankYouPage from "./page";

async function renderPage(reference?: string) {
  render(
    await ThankYouPage({
      searchParams: Promise.resolve({ reference }),
    }),
  );
}

function mockClipboard(writeText: (value: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

describe("ThankYouPage", () => {
  it("confirms submission and prepares a LINE message with the reference", async () => {
    const reference = "DD-44F2F48F6E";
    await renderPage(reference);

    expect(
      screen.getByRole("heading", { name: "ระบบรับข้อมูลแล้ว" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/ไม่จำเป็นต้องส่งซ้ำ/)).toBeInTheDocument();

    const lineLink = screen.getByRole("link", {
      name: "เปิด LINE พร้อมรหัสอ้างอิง",
    });
    expect(lineLink).toHaveAttribute("data-contact-context", "after_quote");
    const lineUrl = new URL(lineLink.getAttribute("href")!);
    expect(lineUrl.origin).toBe("https://line.me");
    expect(decodeURIComponent(lineUrl.pathname)).toContain(company.lineOaId);
    expect(decodeURIComponent(lineUrl.search.slice(1))).toContain(reference);
    expect(
      screen.getByRole("link", {
        name: `สแกนเพื่อเปิด LINE OA และส่งรหัสอ้างอิง ${reference}`,
      }),
    ).toHaveAttribute("data-contact-context", "after_quote");
  });

  it("does not create another lead event when the thank-you page is rendered", async () => {
    window.dataLayer = [];

    await renderPage("DD-44F2F48F6E");

    expect(window.dataLayer).toEqual([]);
  });

  it("copies the reference and announces success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    await renderPage("DD-44F2F48F6E");

    fireEvent.click(screen.getByRole("button", { name: "คัดลอกรหัส" }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("DD-44F2F48F6E"),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "คัดลอกรหัสอ้างอิงแล้ว",
    );
  });

  it("keeps the reference selectable when clipboard access fails", async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    await renderPage("DD-44F2F48F6E");

    fireEvent.click(screen.getByRole("button", { name: "คัดลอกรหัส" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "คัดลอกอัตโนมัติไม่สำเร็จ",
      ),
    );
    expect(screen.getByText("DD-44F2F48F6E")).toBeVisible();
  });

  it("falls back to the generic LINE OA action without a valid reference", async () => {
    await renderPage("not-a-reference");

    expect(
      screen.queryByRole("button", { name: "คัดลอกรหัส" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: `เพิ่มเพื่อน LINE OA ${company.lineOaId}`,
      }),
    ).toHaveAttribute("href", company.lineOaHref);
  });
});
