import type { MediaRef } from "./types";

export const MAX_GALLERY_UPLOAD_BYTES = 10 * 1024 * 1024;

const supportedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export type FinalizedMediaAsset = MediaRef & {
  original_filename: string;
  content_type: string;
  checksum_sha256: string;
  created_at: string;
};

export function validateGalleryFiles(files: File[]): string | null {
  if (files.length === 0) return "กรุณาเลือกภาพ";
  if (files.length > 12) return "หนึ่งผลงานเพิ่มได้สูงสุด 12 ภาพ";

  const unsupported = files.filter(
    (file) => !supportedImageTypes.has(file.type),
  );
  if (unsupported.length > 0) {
    return `ไฟล์ ${formatFileNames(unsupported)} ไม่ใช่ JPG, PNG, WebP หรือ AVIF`;
  }

  const oversized = files.filter(
    (file) => file.size > MAX_GALLERY_UPLOAD_BYTES,
  );
  if (oversized.length > 0) {
    return `ไฟล์ ${formatFileNames(oversized)} มีขนาดเกิน 10 MB กรุณาลดขนาดไฟล์แล้วเลือกใหม่`;
  }

  return null;
}

export function toMediaRef(asset: FinalizedMediaAsset): MediaRef {
  return {
    id: asset.id,
    url: asset.url,
    fallback_url: asset.fallback_url,
    width: asset.width,
    height: asset.height,
    alt: asset.alt,
  };
}

function formatFileNames(files: File[]): string {
  return files.map((file) => `“${file.name}”`).join(", ");
}
