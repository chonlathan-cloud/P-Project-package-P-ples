import type { User } from "firebase/auth";
import { afterEach, describe, expect, it, vi } from "vitest";
import { adminApi, AdminApiError } from "./content-api-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("adminApi", () => {
  it("refreshes the Firebase token once after an authorization failure", async () => {
    const user = {
      getIdToken: vi
        .fn()
        .mockResolvedValueOnce("stale-token")
        .mockResolvedValueOnce("fresh-token"),
    } as unknown as User;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            detail: "invalid or expired Firebase token",
            request_id: "request-1",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      adminApi<{ ok: boolean }>(user, "/v1/admin/products"),
    ).resolves.toEqual({
      ok: true,
    });
    expect(user.getIdToken).toHaveBeenNthCalledWith(1, false);
    expect(user.getIdToken).toHaveBeenNthCalledWith(2, true);
  });

  it("returns a Thai recovery message and keeps the request reference", async () => {
    const user = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    } as unknown as User;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: "invalid or expired Firebase token",
            request_id: "request-2",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(adminApi(user, "/v1/admin/products")).rejects.toEqual(
      expect.objectContaining<Partial<AdminApiError>>({
        message:
          "เซสชันผู้ดูแลหมดอายุหรือไม่ตรงกับระบบ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่ รหัสอ้างอิง: request-2",
        status: 403,
        requestId: "request-2",
      }),
    );
  });

  it("translates the backend upload-size error and keeps the request reference", async () => {
    const user = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    } as unknown as User;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "validation_error",
            detail: "upload exceeds the configured size limit",
            request_id: "upload-request-1",
          }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(adminApi(user, "/v1/admin/media/uploads")).rejects.toEqual(
      expect.objectContaining<Partial<AdminApiError>>({
        message:
          "มีไฟล์ภาพขนาดเกิน 10 MB กรุณาลดขนาดไฟล์แล้วเลือกใหม่ รหัสอ้างอิง: upload-request-1",
        status: 422,
        requestId: "upload-request-1",
      }),
    );
  });

  it("translates request-contract errors without exposing internal field names", async () => {
    const user = {
      getIdToken: vi.fn().mockResolvedValue("token"),
    } as unknown as User;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "request_validation",
            detail: "Request data did not satisfy the API contract",
            errors: [
              {
                type: "extra_forbidden",
                location: ["body", "images", 0, "original_filename"],
              },
            ],
            request_id: "gallery-request-1",
          }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    let error: unknown;
    try {
      await adminApi(user, "/v1/admin/gallery-items", { method: "POST" });
    } catch (caught) {
      error = caught;
    }

    expect(error).toEqual(
      expect.objectContaining<Partial<AdminApiError>>({
        message:
          "ระบบไม่สามารถบันทึกข้อมูลที่ส่งมาได้ กรุณาลองใหม่ หากยังพบปัญหาให้แจ้งรหัสอ้างอิงนี้ รหัสอ้างอิง: gallery-request-1",
        status: 422,
        requestId: "gallery-request-1",
      }),
    );
    expect((error as Error).message).not.toContain("original_filename");
  });
});
