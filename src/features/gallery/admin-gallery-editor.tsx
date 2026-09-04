"use client";

/* eslint-disable @next/next/no-img-element -- admin preview uses an authenticated dynamic URL */

import type { User } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import {
  galleryCategoryOptions,
  OTHER_CATEGORY_VALUE,
} from "@/features/admin/content-options";
import {
  adminApi,
  requiresAdminReauthentication,
} from "@/features/admin/content-api-client";
import {
  pricingBenchmarkSchema,
  type GalleryItem,
  type PricingBenchmark,
} from "./types";
import {
  type FinalizedMediaAsset,
  toMediaRef,
  validateGalleryFiles,
} from "./gallery-upload";

const apiUrl =
  process.env.NEXT_PUBLIC_CONTENT_API_URL ?? "http://localhost:8000";

export function AdminGalleryEditor({
  user,
  onReauthenticate,
}: {
  user: User;
  onReauthenticate?: () => void;
}) {
  const [draft, setDraft] = useState<GalleryItem | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error" | "status";
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsReauthentication, setNeedsReauthentication] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryChoice, setCategoryChoice] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [benchmarks, setBenchmarks] = useState<PricingBenchmark[]>([]);
  const feedbackRef = useRef<HTMLParagraphElement>(null);

  const category =
    categoryChoice === OTHER_CATEGORY_VALUE
      ? customCategory.trim()
      : categoryChoice;

  useEffect(() => {
    let active = true;
    fetch(`${apiUrl}/v1/pricing-benchmarks`, {
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) return [];
        return pricingBenchmarkSchema.array().parse(await response.json());
      })
      .then((items) => {
        if (active) setBenchmarks(items);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    },
    [imagePreviewUrl],
  );

  useEffect(() => {
    if (feedback?.tone === "error") feedbackRef.current?.focus();
  }, [feedback]);

  async function createDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    setNeedsReauthentication(false);
    try {
      const form = new FormData(event.currentTarget);
      const files = form
        .getAll("images")
        .filter((file): file is File => file instanceof File && file.size > 0);
      const fileValidation = validateGalleryFiles(files);
      if (fileValidation) throw new Error(fileValidation);
      if (!category) throw new Error("กรุณาเลือกหรือระบุหมวดหมู่");
      const baseAlt = String(form.get("alt"));
      const images: GalleryItem["images"] = [];
      for (const [index, file] of files.entries()) {
        setFeedback({
          tone: "status",
          text: `กำลังอัปโหลดภาพ ${index + 1} จาก ${files.length}: ${file.name}`,
        });
        const uploadSession = await adminApi<{
          id: string;
          upload_url: string;
          finalize_token: string;
        }>(user, "/v1/admin/media/uploads", {
          method: "POST",
          body: JSON.stringify({
            filename: file.name,
            content_type: file.type,
            size: file.size,
            purpose: "gallery",
            alt: files.length > 1 ? `${baseAlt} มุมที่ ${index + 1}` : baseAlt,
          }),
        });
        let upload: Response;
        try {
          upload = await fetch(uploadSession.upload_url, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });
        } catch {
          throw new Error(
            `เชื่อมต่อระบบอัปโหลดไม่สำเร็จที่ภาพ ${index + 1} “${file.name}” กรุณาลองใหม่`,
          );
        }
        if (!upload.ok) {
          throw new Error(
            `อัปโหลดภาพ ${index + 1} “${file.name}” ไม่สำเร็จ กรุณาลองใหม่`,
          );
        }
        const asset = await adminApi<FinalizedMediaAsset>(
          user,
          `/v1/admin/media/uploads/${uploadSession.id}/finalize`,
          {
            method: "POST",
            headers: {
              "X-Media-Finalize-Token": uploadSession.finalize_token,
            },
          },
        );
        images.push(toMediaRef(asset));
      }
      const item = await adminApi<GalleryItem>(
        user,
        "/v1/admin/gallery-items",
        {
          method: "POST",
          body: JSON.stringify({
            slug,
            title,
            summary,
            category,
            evidence_type: String(form.get("evidence_type")),
            pricing_benchmark_id:
              String(form.get("pricing_benchmark_id")) || null,
            specs: {
              material: String(form.get("material")) || null,
              quantity: String(form.get("quantity")) || null,
              application: String(form.get("application")) || null,
            },
            customer_permission: form.get("customer_permission") === "on",
            images,
          }),
        },
      );
      setDraft(item);
      setFeedback({
        tone: "success",
        text: "บันทึกร่างแล้ว ตรวจสอบตัวอย่างก่อนเผยแพร่",
      });
    } catch (error) {
      setNeedsReauthentication(requiresAdminReauthentication(error));
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "บันทึกร่างไม่สำเร็จ",
      });
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!draft) return;
    setBusy(true);
    setFeedback(null);
    setNeedsReauthentication(false);
    try {
      const item = await adminApi<GalleryItem>(
        user,
        `/v1/admin/publish/gallery-item/${draft.id}`,
        {
          method: "POST",
          body: JSON.stringify({ expected_version: draft.version }),
        },
      );
      setDraft(item);
      setFeedback({
        tone: "success",
        text: "เผยแพร่แล้ว ระบบกำลังอัปเดตหน้าผลงาน",
      });
    } catch (error) {
      setNeedsReauthentication(requiresAdminReauthentication(error));
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "เผยแพร่ไม่สำเร็จ",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-resource" aria-labelledby="gallery-editor-title">
      <header className="admin-resource-heading">
        <div>
          <p className="eyebrow">ผลงานบนเว็บไซต์</p>
          <h2 id="gallery-editor-title">เพิ่มผลงานและตรวจสิทธิ์ภาพ</h2>
        </div>
        <p>เพิ่มภาพผลงานที่ได้รับอนุญาต จัดหมวด ตรวจตัวอย่าง แล้วจึงเผยแพร่</p>
      </header>
      {feedback ? (
        <div className="admin-feedback-stack">
          <p
            ref={feedbackRef}
            role={feedback.tone === "error" ? "alert" : "status"}
            tabIndex={feedback.tone === "error" ? -1 : undefined}
            className={
              feedback.tone === "error"
                ? "field-error admin-feedback"
                : "admin-message admin-feedback"
            }
          >
            {feedback.text}
          </p>
          {needsReauthentication ? (
            <button
              className="button-secondary"
              type="button"
              onClick={onReauthenticate}
            >
              เข้าสู่ระบบอีกครั้ง
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="admin-grid">
        <form onSubmit={createDraft} className="admin-editor">
          <Field
            name="title"
            label="ชื่อผลงาน"
            placeholder="เช่น กล่องครีมพิมพ์ออฟเซ็ทพร้อมเคลือบด้าน"
            value={title}
            onChange={setTitle}
          />
          <Field
            name="slug"
            label="Slug (อังกฤษตัวเล็กและขีดกลาง)"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="เช่น cosmetic-folding-box"
            value={slug}
            onChange={setSlug}
          />
          <label className="field">
            <span>หมวดหมู่</span>
            <select
              value={categoryChoice}
              onChange={(event) => setCategoryChoice(event.target.value)}
              required
            >
              <option value="" disabled>
                เลือกหมวดหมู่
              </option>
              {galleryCategoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value={OTHER_CATEGORY_VALUE}>
                อื่น ๆ — ระบุหมวดใหม่
              </option>
            </select>
          </label>
          {categoryChoice === OTHER_CATEGORY_VALUE ? (
            <Field
              name="custom_category"
              label="ระบุหมวดหมู่ใหม่"
              placeholder="เช่น ถุงกระดาษพิมพ์โลโก้"
              value={customCategory}
              onChange={setCustomCategory}
            />
          ) : null}
          <label className="field">
            <span>ประเภทหลักฐาน</span>
            <select name="evidence_type" defaultValue="customer_work">
              <option value="customer_work">ผลงานลูกค้าที่ได้รับอนุญาต</option>
              <option value="concept">ภาพแนะนำแนวทาง</option>
            </select>
          </label>
          <label className="field">
            <span>ราคาอ้างอิงที่เกี่ยวข้อง (ถ้ามี)</span>
            <select name="pricing_benchmark_id" defaultValue="">
              <option value="">ไม่ผูกกับราคาอ้างอิง</option>
              {benchmarks.map((benchmark) => (
                <option key={benchmark.id} value={benchmark.id}>
                  {benchmark.label}
                </option>
              ))}
            </select>
            <small>เลือกเฉพาะเมื่อผลงานนี้ใช้เงื่อนไขเดียวกับราคาอ้างอิง</small>
          </label>
          <Field
            name="material"
            label="วัสดุ (ถ้ามี)"
            placeholder="เช่น กระดาษอาร์ตการ์ด 350 แกรม"
            required={false}
          />
          <Field
            name="quantity"
            label="จำนวนอ้างอิง (ถ้ามี)"
            placeholder="เช่น 1,000 ใบ"
            required={false}
          />
          <Field
            name="application"
            label="เหมาะกับงานประเภท (ถ้ามี)"
            placeholder="เช่น เครื่องสำอาง อาหารเสริม หรือของขวัญ"
            required={false}
          />
          <label className="field">
            <span>คำอธิบาย</span>
            <textarea
              name="summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="อธิบายรูปแบบงาน วัสดุ เทคนิคพิมพ์ และจุดเด่นที่เห็นจากภาพ"
              minLength={3}
              maxLength={500}
              rows={4}
              required
            />
          </label>
          <label className="field">
            <span>ภาพ 1–12 ภาพ (JPG, PNG, WebP หรือ AVIF)</span>
            <input
              type="file"
              name="images"
              aria-describedby="gallery-images-help"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              required
              onChange={(event) => {
                const file = event.target.files?.[0];
                setImagePreviewUrl(file ? URL.createObjectURL(file) : "");
              }}
            />
            <small id="gallery-images-help">
              ไฟล์ละไม่เกิน 10 MB และควรเรียงภาพหลักเป็นภาพแรก
            </small>
          </label>
          <Field
            name="alt"
            label="คำอธิบายภาพสำหรับผู้ใช้โปรแกรมอ่านหน้าจอ"
            placeholder="เช่น กล่องครีมสีขาวพิมพ์โลโก้สีทอง มุมด้านหน้า"
          />
          <label className="consent">
            <input type="checkbox" name="customer_permission" />
            <span>ยืนยันว่ามีสิทธิ์เผยแพร่ภาพและแบรนด์ที่ปรากฏ</span>
          </label>
          <button className="button" disabled={busy}>
            {busy ? "กำลังประมวลผล…" : "อัปโหลดและบันทึกร่าง"}
          </button>
        </form>
        <aside className="admin-preview">
          <p className="eyebrow">ตัวอย่างก่อนเผยแพร่</p>
          <h2>สิ่งที่จะเห็นบนหน้าผลงาน</h2>
          {draft || title || summary || category || imagePreviewUrl ? (
            <>
              {imagePreviewUrl || draft ? (
                <div className="preview-image">
                  <img
                    src={
                      imagePreviewUrl ||
                      draft?.images[0].fallback_url ||
                      draft?.images[0].url
                    }
                    alt="ตัวอย่างภาพผลงานที่เลือก"
                  />
                </div>
              ) : null}
              <p className="eyebrow">
                {category || draft?.category || "ยังไม่ได้เลือกหมวด"}
              </p>
              <h3>{title || draft?.title || "ชื่อผลงาน"}</h3>
              <p>{summary || draft?.summary || "คำอธิบายผลงานจะแสดงตรงนี้"}</p>
              {draft ? (
                <dl>
                  <div>
                    <dt>สถานะ</dt>
                    <dd>{draft.status === "draft" ? "ร่าง" : "เผยแพร่แล้ว"}</dd>
                  </div>
                  <div>
                    <dt>Version</dt>
                    <dd>{draft.version}</dd>
                  </div>
                </dl>
              ) : (
                <p className="muted">
                  นี่คือตัวอย่างจากข้อมูลในฟอร์ม ยังไม่ได้บันทึก
                </p>
              )}
              {draft?.status === "draft" ? (
                <button className="button" onClick={publish} disabled={busy}>
                  เผยแพร่รายการนี้
                </button>
              ) : null}
            </>
          ) : (
            <p className="muted">
              เริ่มกรอกชื่อ หมวดหมู่ หรือคำอธิบาย เพื่อดูตัวอย่างได้ทันที
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  pattern,
  required = true,
  placeholder,
  value,
  onChange,
}: {
  name: string;
  label: string;
  pattern?: string;
  required?: boolean;
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        pattern={pattern}
        minLength={3}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
      />
    </label>
  );
}
