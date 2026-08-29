"use client";

/* eslint-disable @next/next/no-img-element -- admin preview uses an authenticated dynamic URL */

import { signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase-client";
import type { GalleryItem } from "./types";

const apiUrl =
  process.env.NEXT_PUBLIC_CONTENT_API_URL ?? "http://localhost:8000";

export function AdminGalleryEditor() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [draft, setDraft] = useState<GalleryItem | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      setUser(
        (await signInWithEmailAndPassword(getFirebaseAuth(), email, password))
          .user,
      );
    } catch {
      setMessage(
        "เข้าสู่ระบบไม่ได้ โปรดตรวจสอบบัญชีผู้ดูแลและ Firebase configuration",
      );
    } finally {
      setBusy(false);
    }
  }

  async function createDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const files = form
        .getAll("images")
        .filter((file): file is File => file instanceof File && file.size > 0);
      if (files.length === 0) throw new Error("กรุณาเลือกภาพ");
      if (files.length > 12) throw new Error("หนึ่งผลงานเพิ่มได้สูงสุด 12 ภาพ");
      const token = await user.getIdToken();
      const authHeaders = { Authorization: `Bearer ${token}` };
      const baseAlt = String(form.get("alt"));
      const images = [];
      for (const [index, file] of files.entries()) {
        const uploadSession = await api<{
          id: string;
          upload_url: string;
          finalize_token: string;
        }>("/v1/admin/media/uploads", {
          method: "POST",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            content_type: file.type,
            size: file.size,
            purpose: "gallery",
            alt: files.length > 1 ? `${baseAlt} มุมที่ ${index + 1}` : baseAlt,
          }),
        });
        const upload = await fetch(uploadSession.upload_url, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!upload.ok) throw new Error(`อัปโหลดภาพที่ ${index + 1} ไม่สำเร็จ`);
        images.push(
          await api<GalleryItem["images"][number]>(
            `/v1/admin/media/uploads/${uploadSession.id}/finalize`,
            {
              method: "POST",
              headers: {
                ...authHeaders,
                "X-Media-Finalize-Token": uploadSession.finalize_token,
              },
            },
          ),
        );
      }
      const item = await api<GalleryItem>("/v1/admin/gallery-items", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: String(form.get("slug")),
          title: String(form.get("title")),
          summary: String(form.get("summary")),
          category: String(form.get("category")),
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
      });
      setDraft(item);
      setMessage("บันทึกร่างแล้ว ตรวจสอบ preview ก่อนเผยแพร่");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "บันทึกร่างไม่สำเร็จ",
      );
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!user || !draft) return;
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const item = await api<GalleryItem>(
        `/v1/admin/publish/gallery-item/${draft.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ expected_version: draft.version }),
        },
      );
      setDraft(item);
      setMessage("เผยแพร่แล้ว ระบบกำลัง revalidate หน้า gallery");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "เผยแพร่ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  if (!user)
    return (
      <form className="admin-login" onSubmit={login}>
        <h1>DD Box CMS</h1>
        <p>
          ไม่มี public sign-up บัญชีต้องถูกกำหนดสิทธิ์ <code>admin=true</code>{" "}
          ก่อน
        </p>
        <label className="field">
          <span>อีเมลผู้ดูแล</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>รหัสผ่าน</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {message ? (
          <p role="alert" className="field-error">
            {message}
          </p>
        ) : null}
        <button className="button" disabled={busy}>
          {busy ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
        </button>
      </form>
    );

  return (
    <div className="admin-shell">
      <header>
        <div>
          <p className="eyebrow">CONTENT WORKFLOW</p>
          <h1>เพิ่มผลงาน Gallery</h1>
        </div>
        <button
          className="button-secondary"
          onClick={() => signOut(getFirebaseAuth()).then(() => setUser(null))}
        >
          ออกจากระบบ
        </button>
      </header>
      <div className="admin-grid">
        <form onSubmit={createDraft} className="admin-editor">
          <Field name="title" label="ชื่อผลงาน" />
          <Field
            name="slug"
            label="Slug (อังกฤษตัวเล็กและขีดกลาง)"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          />
          <Field name="category" label="หมวดหมู่" />
          <label className="field">
            <span>ประเภทหลักฐาน</span>
            <select name="evidence_type" defaultValue="customer_work">
              <option value="customer_work">ผลงานลูกค้าที่ได้รับอนุญาต</option>
              <option value="concept">ภาพจำลองแนวทาง</option>
            </select>
          </label>
          <Field
            name="pricing_benchmark_id"
            label="Pricing benchmark ID (ถ้ามี)"
            required={false}
          />
          <Field name="material" label="วัสดุ (ถ้ามี)" required={false} />
          <Field
            name="quantity"
            label="จำนวนอ้างอิง (ถ้ามี)"
            required={false}
          />
          <Field
            name="application"
            label="เหมาะกับงานประเภท (ถ้ามี)"
            required={false}
          />
          <label className="field">
            <span>คำอธิบาย</span>
            <textarea
              name="summary"
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
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              required
            />
          </label>
          <Field name="alt" label="Alt text ภาษาไทย" />
          <label className="consent">
            <input type="checkbox" name="customer_permission" />
            <span>ยืนยันว่ามีสิทธิ์เผยแพร่ภาพและแบรนด์ที่ปรากฏ</span>
          </label>
          <button className="button" disabled={busy}>
            {busy ? "กำลังประมวลผล…" : "อัปโหลดและบันทึกร่าง"}
          </button>
        </form>
        <aside className="admin-preview">
          <h2>Preview</h2>
          {draft ? (
            <>
              <div className="preview-image">
                <img
                  src={draft.images[0].fallback_url ?? draft.images[0].url}
                  alt={draft.images[0].alt}
                />
              </div>
              <p className="eyebrow">{draft.category}</p>
              <h3>{draft.title}</h3>
              <p>{draft.summary}</p>
              <dl>
                <div>
                  <dt>สถานะ</dt>
                  <dd>{draft.status}</dd>
                </div>
                <div>
                  <dt>Version</dt>
                  <dd>{draft.version}</dd>
                </div>
              </dl>
              {draft.status === "draft" ? (
                <button className="button" onClick={publish} disabled={busy}>
                  เผยแพร่รายการนี้
                </button>
              ) : null}
            </>
          ) : (
            <p className="muted">Preview จะปรากฏหลังบันทึกร่าง</p>
          )}
          {message ? (
            <p role="status" className="admin-message">
              {message}
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

async function api<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, init);
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as {
      detail?: string;
      request_id?: string;
    } | null;
    throw new Error(
      `${problem?.detail ?? "API request failed"}${problem?.request_id ? ` (${problem.request_id})` : ""}`,
    );
  }
  return response.json() as Promise<T>;
}

function Field({
  name,
  label,
  pattern,
  required = true,
}: {
  name: string;
  label: string;
  pattern?: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} pattern={pattern} minLength={3} required={required} />
    </label>
  );
}
