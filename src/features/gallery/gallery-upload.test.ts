import { describe, expect, it } from "vitest";
import {
  MAX_GALLERY_UPLOAD_BYTES,
  toMediaRef,
  validateGalleryFiles,
  type FinalizedMediaAsset,
} from "./gallery-upload";

function imageFile(name: string, size: number, type = "image/jpeg") {
  return new File([new Uint8Array(size)], name, { type });
}

describe("validateGalleryFiles", () => {
  it("accepts supported images at the configured size limit", () => {
    expect(
      validateGalleryFiles([imageFile("front.jpg", MAX_GALLERY_UPLOAD_BYTES)]),
    ).toBeNull();
  });

  it("reports oversized filenames in Thai before upload", () => {
    expect(
      validateGalleryFiles([
        imageFile("large.jpg", MAX_GALLERY_UPLOAD_BYTES + 1),
      ]),
    ).toBe("ไฟล์ “large.jpg” มีขนาดเกิน 10 MB กรุณาลดขนาดไฟล์แล้วเลือกใหม่");
  });

  it("rejects unsupported image types with the filename", () => {
    expect(
      validateGalleryFiles([imageFile("design.gif", 100, "image/gif")]),
    ).toBe("ไฟล์ “design.gif” ไม่ใช่ JPG, PNG, WebP หรือ AVIF");
  });
});

describe("toMediaRef", () => {
  it("removes finalize-only fields before creating a gallery item", () => {
    const asset: FinalizedMediaAsset = {
      id: "media-1",
      original_filename: "front.jpg",
      content_type: "image/jpeg",
      width: 1200,
      height: 800,
      checksum_sha256: "checksum",
      url: "https://media.example/front.avif",
      fallback_url: "https://media.example/front.webp",
      alt: "กล่องตัวอย่างมุมด้านหน้า",
      created_at: "2026-09-04T08:00:00Z",
    };

    expect(toMediaRef(asset)).toEqual({
      id: "media-1",
      url: "https://media.example/front.avif",
      fallback_url: "https://media.example/front.webp",
      width: 1200,
      height: 800,
      alt: "กล่องตัวอย่างมุมด้านหน้า",
    });
    expect(toMediaRef(asset)).not.toHaveProperty("original_filename");
  });
});
