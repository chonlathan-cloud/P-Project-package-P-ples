import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { User } from "firebase/auth";
import { describe, expect, it, vi } from "vitest";
import { StructuredContentEditor } from "./structured-content-editor";

const user = {
  getIdToken: vi.fn().mockResolvedValue("admin-token"),
} as unknown as User;

describe("StructuredContentEditor", () => {
  it("creates a typed product draft and enables publish only after save", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        requests.push({ url, init });
        if (!init?.method)
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        const content = JSON.parse(String(init.body)) as Record<
          string,
          unknown
        >;
        return new Response(
          JSON.stringify({
            id: "product-1",
            kind: "product",
            content,
            published_content: null,
            status: "draft",
            has_unpublished_changes: true,
            version: 1,
            created_at: "2026-09-04T00:00:00Z",
            updated_at: "2026-09-04T00:00:00Z",
            published_at: null,
            created_by: "admin-1",
            updated_by: "admin-1",
          }),
          { status: 201, headers: { "Content-Type": "application/json" } },
        );
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<StructuredContentEditor user={user} kind="product" />);
    await screen.findByText("ยังไม่มีข้อมูล เริ่มจากสร้างร่างแรก");

    fireEvent.change(screen.getByLabelText("ชื่อรายการ (ภาษาไทย)"), {
      target: { value: "กล่องไปรษณีย์สั่งผลิต" },
    });
    fireEvent.change(screen.getByLabelText("Slug"), {
      target: { value: "mailer-box" },
    });
    fireEvent.change(screen.getByLabelText("สรุป"), {
      target: { value: "ข้อมูลสำหรับประเมินรูปแบบกล่อง" },
    });
    fireEvent.change(screen.getByLabelText("หมวดหมู่"), {
      target: { value: "กล่องไดคัทและชิ้นรองสินค้า" },
    });
    fireEvent.change(screen.getByLabelText("วัสดุ (หนึ่งรายการต่อบรรทัด)"), {
      target: { value: "กระดาษลูกฟูก" },
    });
    fireEvent.change(
      screen.getByLabelText("ลักษณะงานที่เหมาะ (หนึ่งรายการต่อบรรทัด)"),
      { target: { value: "จัดส่งสินค้า" } },
    );

    const publish = screen.getByRole("button", {
      name: "เผยแพร่ version นี้",
    });
    expect(publish).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "บันทึกร่าง" }));

    await screen.findByText("บันทึกร่างแล้ว");
    expect(publish).toBeEnabled();
    const createRequest = requests.find(
      (request) => request.init?.method === "POST",
    );
    expect(createRequest?.url.endsWith("/v1/admin/products")).toBe(true);
    expect(new Headers(createRequest?.init?.headers).get("Authorization")).toBe(
      "Bearer admin-token",
    );
    await waitFor(() => expect(user.getIdToken).toHaveBeenCalled());
  });
});
