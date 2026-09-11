import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { User } from "firebase/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminApiError } from "./content-api-client";
import { LeadExportPanel, leadExportRange } from "./lead-export-panel";

const apiMocks = vi.hoisted(() => ({ adminDownload: vi.fn() }));

vi.mock("./content-api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./content-api-client")>();
  return { ...actual, adminDownload: apiMocks.adminDownload };
});

const user = {
  getIdToken: vi.fn().mockResolvedValue("admin-token"),
} as unknown as User;

describe("LeadExportPanel", () => {
  beforeEach(() => {
    apiMocks.adminDownload.mockReset();
  });

  it("converts an inclusive Bangkok calendar range to an exclusive UTC cutoff", () => {
    expect(leadExportRange("2026-09-01", "2026-09-02")).toEqual({
      createdFrom: "2026-08-31T17:00:00.000Z",
      createdTo: "2026-09-02T17:00:00.000Z",
    });
  });

  it("downloads one workbook and announces the result", async () => {
    let resolveDownload!: (value: {
      blob: Blob;
      filename: string;
      exportId: string;
      recordCount: number;
    }) => void;
    apiMocks.adminDownload.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveDownload = resolve;
      }),
    );
    const saveFile = vi.fn();
    const rendered = render(
      <LeadExportPanel
        user={user}
        onReauthenticate={vi.fn()}
        saveFile={saveFile}
      />,
    );
    fireEvent.change(screen.getByLabelText("วันที่เริ่ม (เวลาไทย)"), {
      target: { value: "2026-09-01" },
    });
    fireEvent.change(screen.getByLabelText("วันที่สิ้นสุด (เวลาไทย)"), {
      target: { value: "2026-09-02" },
    });

    const form = rendered.container.querySelector("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(apiMocks.adminDownload).toHaveBeenCalledOnce();
    expect(apiMocks.adminDownload.mock.calls[0][1]).toContain(
      "created_from=2026-08-31T17%3A00%3A00.000Z",
    );
    expect(apiMocks.adminDownload.mock.calls[0][1]).toContain(
      "created_to=2026-09-02T17%3A00%3A00.000Z",
    );
    resolveDownload({
      blob: new Blob(["workbook"]),
      filename: "DD_BOX_Leads_test.xlsx",
      exportId: "export-1",
      recordCount: 2,
    });

    expect(
      await screen.findByText("ดาวน์โหลด DD_BOX_Leads_test.xlsx แล้ว (2 Lead)"),
    ).toBeInTheDocument();
    expect(saveFile).toHaveBeenCalledOnce();
  });

  it("keeps the selected dates and focuses an actionable validation error", async () => {
    const rendered = render(
      <LeadExportPanel user={user} onReauthenticate={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText("วันที่เริ่ม (เวลาไทย)"), {
      target: { value: "2026-09-03" },
    });
    fireEvent.change(screen.getByLabelText("วันที่สิ้นสุด (เวลาไทย)"), {
      target: { value: "2026-09-02" },
    });

    fireEvent.submit(rendered.container.querySelector("form")!);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("วันที่เริ่มต้องไม่อยู่หลังวันที่สิ้นสุด");
    await waitFor(() => expect(alert).toHaveFocus());
    const startDate = screen.getByLabelText("วันที่เริ่ม (เวลาไทย)");
    expect(startDate).toHaveValue("2026-09-03");
    expect(startDate).toHaveAttribute("aria-invalid", "true");
    expect(startDate).toHaveAttribute(
      "aria-describedby",
      "lead-export-range-help lead-export-error",
    );
    expect(apiMocks.adminDownload).not.toHaveBeenCalled();
  });

  it("offers reauthentication when the admin session is rejected", async () => {
    const onReauthenticate = vi.fn();
    apiMocks.adminDownload.mockRejectedValueOnce(
      new AdminApiError("เซสชันผู้ดูแลหมดอายุ", 403),
    );
    render(
      <LeadExportPanel
        user={user}
        onReauthenticate={onReauthenticate}
        saveFile={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "ดาวน์โหลดไฟล์ Lead" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "เซสชันผู้ดูแลหมดอายุ",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "เข้าสู่ระบบอีกครั้ง" }),
    );
    expect(onReauthenticate).toHaveBeenCalledOnce();
  });
});
