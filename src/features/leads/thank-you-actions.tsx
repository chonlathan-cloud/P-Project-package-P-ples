"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { company } from "@/content/company";

type CopyState = "idle" | "copied" | "failed";

export function buildLineOaMessageHref(reference: string) {
  const message = `สวัสดี ทีม DD Box ส่งรายละเอียดขอใบเสนอราคาไว้แล้ว รหัสอ้างอิง ${reference}`;
  return `https://line.me/R/oaMessage/${encodeURIComponent(company.lineOaId)}/?${encodeURIComponent(message)}`;
}

export function ThankYouActions({ reference }: { reference?: string }) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const lineHref = reference
    ? buildLineOaMessageHref(reference)
    : company.lineOaHref;

  async function copyReference() {
    if (!reference) return;
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(reference);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <>
      {reference ? (
        <div className="confirmation-reference-group">
          <div className="reference">
            <span>รหัสอ้างอิง</span>
            <strong>{reference}</strong>
            <button
              className="button-secondary reference-copy"
              type="button"
              onClick={copyReference}
            >
              {copyState === "copied" ? "คัดลอกแล้ว" : "คัดลอกรหัส"}
            </button>
          </div>
          <p
            className="confirmation-copy-status"
            role="status"
            aria-live="polite"
          >
            {copyState === "copied"
              ? "คัดลอกรหัสอ้างอิงแล้ว"
              : copyState === "failed"
                ? "คัดลอกอัตโนมัติไม่สำเร็จ กรุณาเลือกรหัสแล้วคัดลอกด้วยตนเอง"
                : ""}
          </p>
        </div>
      ) : null}

      <section
        className="confirmation-next-step"
        aria-labelledby="confirmation-line-heading"
      >
        <div className="confirmation-next-copy">
          <p className="eyebrow">OPTIONAL NEXT STEP</p>
          <h2 id="confirmation-line-heading">
            ต้องการส่งรูปหรือคุยต่อทาง LINE?
          </h2>
          <p>
            {reference
              ? "บนมือถือกดปุ่มเพื่อเปิด LINE พร้อมข้อความที่เตรียมไว้ หรือสแกน QR แล้วส่งรหัสอ้างอิงด้านบน ทีมจะจับคู่กับรายละเอียดงานได้สะดวกขึ้น ขั้นตอนนี้ไม่บังคับ"
              : "เพิ่มเพื่อน LINE OA เพื่อส่งรูปหรือรายละเอียดเพิ่มเติม ขั้นตอนนี้ไม่บังคับ"}
          </p>
          <div className="confirmation-actions">
            <a
              className="button"
              href={lineHref}
              data-contact-context="after_quote"
            >
              {reference
                ? "เปิด LINE พร้อมรหัสอ้างอิง"
                : `เพิ่มเพื่อน LINE OA ${company.lineOaId}`}
            </a>
            <Link className="text-link" href="/">
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
        <a
          className="contact-oa-qr confirmation-qr"
          href={lineHref}
          data-contact-context="after_quote"
          aria-label={
            reference
              ? `สแกนเพื่อเปิด LINE OA และส่งรหัสอ้างอิง ${reference}`
              : `สแกนเพื่อเปิด LINE OA ${company.lineOaId}`
          }
        >
          <Image
            src="/images/line-oa-qr.webp"
            width={428}
            height={426}
            alt={`QR Code สำหรับเพิ่มเพื่อน LINE OA ${company.lineOaId}`}
          />
          <span>
            สแกนเพื่อเพิ่มเพื่อน LINE OA {company.lineOaId}
            {reference ? " แล้วส่งรหัสด้านบน" : ""}
          </span>
        </a>
      </section>
    </>
  );
}
