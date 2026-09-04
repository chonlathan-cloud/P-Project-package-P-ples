import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { User } from "firebase/auth";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminGalleryEditor } from "./admin-gallery-editor";

const user = {
  getIdToken: vi.fn().mockResolvedValue("admin-token"),
} as unknown as User;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AdminGalleryEditor", () => {
  it("offers controlled categories with an other option and previews draft input", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    render(<AdminGalleryEditor user={user} />);

    const category = screen.getByLabelText("หมวดหมู่");
    expect(
      within(category).getByRole("option", { name: "กล่องกระดาษพับ" }),
    ).toBeInTheDocument();
    expect(
      within(category).getByRole("option", { name: "อื่น ๆ — ระบุหมวดใหม่" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("ชื่อผลงาน"), {
      target: { value: "กล่องครีมตัวอย่าง" },
    });
    fireEvent.change(category, { target: { value: "กล่องกระดาษพับ" } });

    const preview = screen.getByRole("complementary");
    expect(
      within(preview).getByRole("heading", { name: "กล่องครีมตัวอย่าง" }),
    ).toBeInTheDocument();
    expect(within(preview).getByText("กล่องกระดาษพับ")).toBeInTheDocument();
    expect(
      within(preview).getByText(
        "นี่คือตัวอย่างจากข้อมูลในฟอร์ม ยังไม่ได้บันทึก",
      ),
    ).toBeInTheDocument();
  });

  it("sends only public media-reference fields when creating the draft", async () => {
    const createObjectUrl = vi.fn().mockReturnValue("blob:preview");
    const revokeObjectUrl = vi.fn();
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: createObjectUrl },
      revokeObjectURL: { configurable: true, value: revokeObjectUrl },
    });

    const mediaRef = {
      id: "media-1",
      url: "https://media.example/front.avif",
      fallback_url: "https://media.example/front.webp",
      width: 1200,
      height: 800,
      alt: "กล่องครีมตัวอย่างมุมด้านหน้า",
    };
    const finalizedAsset = {
      ...mediaRef,
      original_filename: "front.jpg",
      content_type: "image/jpeg",
      checksum_sha256: "checksum",
      created_at: "2026-09-04T08:00:00Z",
    };
    const selectedFile = new File(["image"], "front.jpg", {
      type: "image/jpeg",
    });
    const NativeFormData = FormData;
    class TestFormData extends NativeFormData {
      override getAll(name: string): FormDataEntryValue[] {
        if (name === "images") return [selectedFile];
        return super.getAll(name);
      }
    }
    vi.stubGlobal("FormData", TestFormData);

    const uploadUrl = "https://storage.example/upload";
    const fetchMock = vi.fn(
      async (...request: [RequestInfo | URL, RequestInit?]) => {
        const [input] = request;
        const url = String(input);
        if (url.endsWith("/v1/pricing-benchmarks")) {
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (url.endsWith("/v1/admin/media/uploads")) {
          return new Response(
            JSON.stringify({
              id: "upload-1",
              upload_url: uploadUrl,
              finalize_token: "finalize-token",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        if (url === uploadUrl) return new Response(null, { status: 200 });
        if (url.endsWith("/v1/admin/media/uploads/upload-1/finalize")) {
          return new Response(JSON.stringify(finalizedAsset), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (url.endsWith("/v1/admin/gallery-items")) {
          return new Response(
            JSON.stringify({
              id: "gallery-1",
              slug: "sample-box",
              title: "กล่องครีมตัวอย่าง",
              summary: "กล่องครีมตัวอย่างสำหรับทดสอบระบบ",
              category: "กล่องกระดาษพับ",
              status: "draft",
              version: 1,
              images: [mediaRef],
              evidence_type: "customer_work",
              pricing_benchmark_id: null,
              customer_permission: true,
              specs: { material: null, quantity: null, application: null },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        throw new Error(`Unexpected request: ${url}`);
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminGalleryEditor user={user} />);
    fireEvent.change(screen.getByLabelText("ชื่อผลงาน"), {
      target: { value: "กล่องครีมตัวอย่าง" },
    });
    fireEvent.change(screen.getByLabelText("Slug (อังกฤษตัวเล็กและขีดกลาง)"), {
      target: { value: "sample-box" },
    });
    fireEvent.change(screen.getByLabelText("หมวดหมู่"), {
      target: { value: "กล่องกระดาษพับ" },
    });
    fireEvent.change(screen.getByLabelText("คำอธิบาย"), {
      target: { value: "กล่องครีมตัวอย่างสำหรับทดสอบระบบ" },
    });
    fireEvent.change(
      screen.getByLabelText("คำอธิบายภาพสำหรับผู้ใช้โปรแกรมอ่านหน้าจอ"),
      { target: { value: "กล่องครีมตัวอย่างมุมด้านหน้า" } },
    );
    fireEvent.click(
      screen.getByLabelText("ยืนยันว่ามีสิทธิ์เผยแพร่ภาพและแบรนด์ที่ปรากฏ"),
    );
    fireEvent.change(screen.getByLabelText(/ภาพ 1–12 ภาพ/), {
      target: {
        files: [selectedFile],
      },
    });
    const submitButton = screen.getByRole("button", {
      name: "อัปโหลดและบันทึกร่าง",
    });
    fireEvent.submit(submitButton.closest("form")!);

    await screen.findByText("บันทึกร่างแล้ว ตรวจสอบตัวอย่างก่อนเผยแพร่");
    const galleryCall = fetchMock.mock.calls.find(([input]) =>
      String(input).endsWith("/v1/admin/gallery-items"),
    );
    expect(galleryCall).toBeDefined();
    const request = galleryCall?.[1] as RequestInit;
    const body = JSON.parse(String(request.body));
    expect(body.images).toEqual([mediaRef]);
    expect(body.images[0]).not.toHaveProperty("original_filename");
    expect(body.images[0]).not.toHaveProperty("content_type");

    await waitFor(() => expect(createObjectUrl).toHaveBeenCalledOnce());
  });

  it("rejects an oversized file before upload and focuses the Thai error", async () => {
    const selectedFile = new File(["image"], "too-large.jpg", {
      type: "image/jpeg",
    });
    Object.defineProperty(selectedFile, "size", {
      value: 10 * 1024 * 1024 + 1,
    });
    const NativeFormData = FormData;
    class TestFormData extends NativeFormData {
      override getAll(name: string): FormDataEntryValue[] {
        if (name === "images") return [selectedFile];
        return super.getAll(name);
      }
    }
    vi.stubGlobal("FormData", TestFormData);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminGalleryEditor user={user} />);
    const submitButton = screen.getByRole("button", {
      name: "อัปโหลดและบันทึกร่าง",
    });
    fireEvent.submit(submitButton.closest("form")!);

    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent(
      "ไฟล์ “too-large.jpg” มีขนาดเกิน 10 MB กรุณาลดขนาดไฟล์แล้วเลือกใหม่",
    );
    await waitFor(() => expect(error).toHaveFocus());
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
