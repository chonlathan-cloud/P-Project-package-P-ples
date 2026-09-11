"use client";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { AdminGalleryEditor } from "@/features/gallery/admin-gallery-editor";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { LeadExportPanel } from "./lead-export-panel";
import { StructuredContentEditor } from "./structured-content-editor";
import type { ContentKind } from "./types";

type WorkspaceResource = "lead_export" | "gallery" | ContentKind;

const resources: Array<{
  id: WorkspaceResource;
  label: string;
  description: string;
}> = [
  {
    id: "lead_export",
    label: "ส่งออก Lead",
    description: "ดาวน์โหลดข้อมูลสำหรับ Excel master",
  },
  {
    id: "gallery",
    label: "ผลงาน",
    description: "ภาพผลงานที่ได้รับสิทธิ์เผยแพร่",
  },
  {
    id: "product",
    label: "สินค้าและงานพิมพ์",
    description: "ข้อมูลหน้ารวมและรายละเอียดสินค้า",
  },
  {
    id: "offer",
    label: "วิธีเริ่มงาน",
    description: "ทางเลือกสำหรับลูกค้าที่มีหรือยังไม่มีสเปก",
  },
  {
    id: "faq",
    label: "คำถามที่พบบ่อย",
    description: "คำตอบที่แสดงตามหน้าที่เกี่ยวข้อง",
  },
  {
    id: "page",
    label: "ข้อความหน้าเว็บไซต์",
    description: "ข้อความและส่วนประกอบของหน้าเว็บไซต์",
  },
];

export function AdminWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resource, setResource] = useState<WorkspaceResource>("lead_export");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      return onAuthStateChanged(getFirebaseAuth(), (currentUser) => {
        setUser(currentUser);
        setCheckingSession(false);
      });
    } catch {
      queueMicrotask(() => {
        setMessage("Firebase client configuration ยังไม่ครบ");
        setCheckingSession(false);
      });
      return undefined;
    }
  }, []);

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

  function navigate(next: WorkspaceResource) {
    if (next === resource) return;
    if (
      dirty &&
      !window.confirm(
        "มีข้อมูลที่ยังไม่บันทึก ต้องการเปลี่ยนเมนูและทิ้งการแก้ไขหรือไม่",
      )
    )
      return;
    setDirty(false);
    setResource(next);
  }

  if (checkingSession)
    return (
      <div className="admin-session-state" role="status">
        กำลังตรวจสอบ session ผู้ดูแล…
      </div>
    );

  if (!user)
    return (
      <form className="admin-login" onSubmit={login}>
        <p className="eyebrow">AUTHORIZED ACCESS</p>
        <h1>DD Box CMS</h1>
        <p>
          ไม่มี public sign-up บัญชีต้องถูกกำหนดสิทธิ์ <code>admin=true</code>{" "}
          ก่อน
        </p>
        <label className="field">
          <span>อีเมลผู้ดูแล</span>
          <input
            type="email"
            placeholder="เช่น admin@ddboxprinting.com"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>รหัสผ่าน</span>
          <input
            type="password"
            placeholder="กรอกรหัสผ่านบัญชีผู้ดูแล"
            autoComplete="current-password"
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
      <header className="admin-global-header">
        <div>
          <p className="eyebrow">DD BOX CONTENT OPERATIONS</p>
          <h1>จัดการเว็บไซต์และข้อมูล Lead</h1>
          <p className="muted">{user.email ?? "ผู้ดูแลระบบ"}</p>
        </div>
        <button
          className="button-secondary"
          type="button"
          onClick={() => signOut(getFirebaseAuth())}
        >
          ออกจากระบบ
        </button>
      </header>

      <nav className="admin-resource-nav" aria-label="งานผู้ดูแลระบบ">
        {resources.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={resource === item.id ? "page" : undefined}
            onClick={() => navigate(item.id)}
          >
            <span>{item.label}</span>
            <small>{item.description}</small>
          </button>
        ))}
      </nav>

      {resource === "lead_export" ? (
        <LeadExportPanel
          user={user}
          onReauthenticate={() => signOut(getFirebaseAuth())}
        />
      ) : resource === "gallery" ? (
        <AdminGalleryEditor
          user={user}
          onReauthenticate={() => signOut(getFirebaseAuth())}
        />
      ) : (
        <StructuredContentEditor
          key={resource}
          user={user}
          kind={resource}
          onDirtyChange={setDirty}
          onReauthenticate={() => signOut(getFirebaseAuth())}
        />
      )}
    </div>
  );
}
