"use client";

import type { User } from "firebase/auth";
import { useMemo, useRef, useState } from "react";
import {
  adminDownload,
  requiresAdminReauthentication,
} from "./content-api-client";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

function calendarDateParts(value: string): [number, number, number] | null {
  if (!DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const normalized = new Date(Date.UTC(year, month - 1, day));
  if (normalized.toISOString().slice(0, 10) !== value) return null;
  return [year, month, day];
}

function shiftCalendarDate(value: string, days: number): string {
  const parts = calendarDateParts(value);
  if (!parts) throw new Error("รูปแบบวันที่ไม่ถูกต้อง");
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days))
    .toISOString()
    .slice(0, 10);
}

function bangkokCalendarDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

export function leadExportRange(
  startDate: string,
  endDate: string,
): { createdFrom: string; createdTo: string } {
  if (!calendarDateParts(startDate) || !calendarDateParts(endDate))
    throw new Error("กรุณาระบุวันที่ให้ครบ");
  if (startDate > endDate)
    throw new Error("วันที่เริ่มต้องไม่อยู่หลังวันที่สิ้นสุด");
  return {
    createdFrom: new Date(`${startDate}T00:00:00+07:00`).toISOString(),
    createdTo: new Date(
      `${shiftCalendarDate(endDate, 1)}T00:00:00+07:00`,
    ).toISOString(),
  };
}

function saveWorkbook(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

export function LeadExportPanel({
  user,
  onReauthenticate,
  saveFile = saveWorkbook,
}: {
  user: User;
  onReauthenticate: () => void;
  saveFile?: (blob: Blob, filename: string) => void;
}) {
  const defaults = useMemo(() => {
    const endDate = bangkokCalendarDate(new Date());
    return { startDate: shiftCalendarDate(endDate, -6), endDate };
  }, []);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rangeInvalid, setRangeInvalid] = useState(false);
  const [message, setMessage] = useState("");
  const [needsReauthentication, setNeedsReauthentication] = useState(false);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const downloadInFlight = useRef(false);

  async function exportLeads(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (downloadInFlight.current) return;
    setError("");
    setRangeInvalid(false);
    setMessage("");
    setNeedsReauthentication(false);

    let range: ReturnType<typeof leadExportRange>;
    try {
      range = leadExportRange(startDate, endDate);
    } catch (validationError) {
      setRangeInvalid(true);
      setError(
        validationError instanceof Error
          ? validationError.message
          : "ช่วงวันที่ไม่ถูกต้อง",
      );
      queueMicrotask(() => errorMessage.current?.focus());
      return;
    }

    downloadInFlight.current = true;
    setBusy(true);
    try {
      const parameters = new URLSearchParams({
        created_from: range.createdFrom,
        created_to: range.createdTo,
      });
      const download = await adminDownload(
        user,
        `/v1/admin/leads/export?${parameters.toString()}`,
      );
      saveFile(download.blob, download.filename);
      setMessage(
        download.recordCount === null
          ? `ดาวน์โหลด ${download.filename} แล้ว`
          : `ดาวน์โหลด ${download.filename} แล้ว (${download.recordCount} Lead)`,
      );
    } catch (requestError) {
      setNeedsReauthentication(requiresAdminReauthentication(requestError));
      setError(
        requestError instanceof Error
          ? requestError.message
          : "ดาวน์โหลดไฟล์ Lead ไม่สำเร็จ กรุณาลองใหม่",
      );
      queueMicrotask(() => errorMessage.current?.focus());
    } finally {
      downloadInFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <section className="admin-resource" aria-labelledby="lead-export-title">
      <header className="admin-resource-heading">
        <div>
          <p className="eyebrow">LEAD SNAPSHOT</p>
          <h2 id="lead-export-title">ส่งออก Lead เข้า Excel</h2>
        </div>
        <p>
          ดาวน์โหลดข้อมูลตามช่วงวันที่เพื่อเพิ่มเข้า master workbook
          โดยไม่เปลี่ยนสถานะงานที่ฝ่ายขายบันทึกไว้
        </p>
      </header>

      <form className="admin-lead-export" onSubmit={exportLeads} noValidate>
        <div className="admin-export-field-row">
          <label className="field">
            <span>วันที่เริ่ม (เวลาไทย)</span>
            <input
              type="date"
              value={startDate}
              max={endDate}
              aria-invalid={rangeInvalid}
              aria-describedby={
                rangeInvalid
                  ? "lead-export-range-help lead-export-error"
                  : "lead-export-range-help"
              }
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>วันที่สิ้นสุด (เวลาไทย)</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              aria-invalid={rangeInvalid}
              aria-describedby={
                rangeInvalid
                  ? "lead-export-range-help lead-export-error"
                  : "lead-export-range-help"
              }
              onChange={(event) => setEndDate(event.target.value)}
              required
            />
          </label>
        </div>
        <p id="lead-export-range-help" className="muted admin-export-note">
          ระบบรวม Lead ถึงเวลา 23:59:59 ของวันที่สิ้นสุด และไฟล์ไม่มี raw GCLID
        </p>
        {error ? (
          <div className="admin-feedback-stack">
            <p
              className="field-error admin-feedback"
              id="lead-export-error"
              ref={errorMessage}
              tabIndex={-1}
              role="alert"
            >
              {error}
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
        {message ? (
          <p className="admin-message admin-feedback" role="status">
            {message}
          </p>
        ) : null}
        <button className="button" type="submit" disabled={busy}>
          {busy ? "กำลังสร้างไฟล์…" : "ดาวน์โหลดไฟล์ Lead"}
        </button>
        <p className="sr-only" role="status" aria-live="polite">
          {busy ? "กำลังสร้างไฟล์ Lead กรุณารอสักครู่" : ""}
        </p>
      </form>
    </section>
  );
}
