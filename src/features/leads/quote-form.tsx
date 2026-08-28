"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { quoteFormSchema, toLeadPayload, type QuoteFormValues } from "./schema";

type Path = QuoteFormValues["customer_path"];

const blankForm: QuoteFormValues = {
  customer_path: "needs_guidance",
  product_type: "",
  quantity: "",
  dimensions: "",
  required_date: "",
  delivery_province: "",
  project_details: "",
  contact_name: "",
  company: "",
  phone: "",
  line_id: "",
  email: "",
  preferred_contact: "phone",
  consent: false,
  website: "",
};

export function QuoteForm({ initialPath }: { initialPath: Path }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<QuoteFormValues>({
    ...blankForm,
    customer_path: initialPath,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const errorSummary = useRef<HTMLDivElement>(null);
  const idempotencyKey = useRef<string | null>(null);

  function update(name: keyof QuoteFormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function advance() {
    if (step === 1) {
      setStep(2);
      return;
    }
    const required = ["product_type", "project_details"] as const;
    const nextErrors: Record<string, string> = {};
    for (const field of required)
      if (!values[field].trim()) nextErrors[field] = "กรุณากรอกข้อมูลนี้";
    if (values.customer_path === "has_specifications" && !values.quantity)
      nextErrors.quantity = "กรุณาระบุจำนวนโดยประมาณ";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      queueMicrotask(() => errorSummary.current?.focus());
      return;
    }
    setStep(3);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = quoteFormSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues)
        nextErrors[String(issue.path[0])] ??= issue.message;
      setErrors(nextErrors);
      queueMicrotask(() => errorSummary.current?.focus());
      return;
    }
    setStatus("submitting");
    if (!idempotencyKey.current)
      idempotencyKey.current = `${crypto.randomUUID()}-${Date.now()}`;
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify(toLeadPayload(values)),
      });
      if (!response.ok) {
        const problem = (await response.json().catch(() => null)) as {
          request_id?: string;
        } | null;
        throw new Error(problem?.request_id ?? "unknown");
      }
      const receipt = (await response.json()) as { reference: string };
      router.push(
        `/thank-you?reference=${encodeURIComponent(receipt.reference)}`,
      );
    } catch (error) {
      setStatus("error");
      setErrors({
        form: `ยังส่งข้อมูลไม่ได้ กรุณาลองใหม่ (รหัสคำขอ ${error instanceof Error ? error.message : "unknown"})`,
      });
      queueMicrotask(() => errorSummary.current?.focus());
    }
  }

  return (
    <form className="quote-form" onSubmit={submit} noValidate>
      <div className="form-progress" aria-label={`ขั้นตอน ${step} จาก 3`}>
        <span style={{ width: `${step * 33.333}%` }} />
      </div>
      <p className="step-label">ขั้นตอน {step} / 3</p>
      {Object.keys(errors).length > 0 ? (
        <div
          className="error-summary"
          ref={errorSummary}
          tabIndex={-1}
          role="alert"
        >
          <strong>กรุณาตรวจสอบข้อมูล</strong>
          <ul>
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {step === 1 ? (
        <fieldset className="path-fieldset">
          <legend>คุณต้องการเริ่มจากแบบไหน</legend>
          <label
            className={
              values.customer_path === "has_specifications"
                ? "choice selected"
                : "choice"
            }
          >
            <input
              type="radio"
              name="customer_path"
              checked={values.customer_path === "has_specifications"}
              onChange={() => update("customer_path", "has_specifications")}
            />
            <span>
              <strong>มีสเปกงานแล้ว</strong>
              <small>ฉันทราบประเภทกล่อง ขนาด หรือจำนวนโดยประมาณ</small>
            </span>
          </label>
          <label
            className={
              values.customer_path === "needs_guidance"
                ? "choice selected"
                : "choice"
            }
          >
            <input
              type="radio"
              name="customer_path"
              checked={values.customer_path === "needs_guidance"}
              onChange={() => update("customer_path", "needs_guidance")}
            />
            <span>
              <strong>ต้องการคำแนะนำ</strong>
              <small>ฉันมีสินค้า แต่ยังไม่แน่ใจเรื่องรูปแบบกล่อง</small>
            </span>
          </label>
        </fieldset>
      ) : null}

      {step === 2 ? (
        <div className="form-fields">
          <h2>รายละเอียดงาน</h2>
          <Field
            label="ประเภทสินค้า"
            name="product_type"
            value={values.product_type}
            error={errors.product_type}
            onChange={update}
            required
          />
          {values.customer_path === "has_specifications" ? (
            <div className="field-row">
              <Field
                label="จำนวนโดยประมาณ"
                name="quantity"
                type="number"
                value={values.quantity}
                error={errors.quantity}
                onChange={update}
                required
              />
              <Field
                label="ขนาดที่ทราบ"
                name="dimensions"
                value={values.dimensions}
                onChange={update}
              />
            </div>
          ) : null}
          <div className="field-row">
            <Field
              label="จังหวัดที่จัดส่ง"
              name="delivery_province"
              value={values.delivery_province}
              onChange={update}
            />
            <Field
              label="กำหนดใช้งาน (ถ้ามี)"
              name="required_date"
              value={values.required_date}
              onChange={update}
            />
          </div>
          <label className="field">
            <span>
              รายละเอียดและข้อจำกัด <b aria-hidden="true">*</b>
            </span>
            <textarea
              value={values.project_details}
              aria-invalid={Boolean(errors.project_details)}
              aria-describedby={
                errors.project_details ? "project_details-error" : undefined
              }
              onChange={(event) =>
                update("project_details", event.target.value)
              }
              rows={6}
            />
            {errors.project_details ? (
              <small id="project_details-error" className="field-error">
                {errors.project_details}
              </small>
            ) : null}
          </label>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="form-fields">
          <h2>ช่องทางติดต่อกลับ</h2>
          <div className="field-row">
            <Field
              label="ชื่อผู้ติดต่อ"
              name="contact_name"
              value={values.contact_name}
              error={errors.contact_name}
              onChange={update}
              required
            />
            <Field
              label="บริษัทหรือแบรนด์ (ถ้ามี)"
              name="company"
              value={values.company}
              onChange={update}
            />
          </div>
          <label className="field">
            <span>ช่องทางที่สะดวก</span>
            <select
              value={values.preferred_contact}
              onChange={(event) =>
                update("preferred_contact", event.target.value)
              }
            >
              <option value="phone">โทรศัพท์</option>
              <option value="line">LINE</option>
              <option value="email">อีเมล</option>
            </select>
          </label>
          {values.preferred_contact === "phone" ? (
            <Field
              label="เบอร์โทรศัพท์"
              name="phone"
              type="tel"
              value={values.phone}
              error={errors.phone}
              onChange={update}
              required
            />
          ) : null}
          {values.preferred_contact === "line" ? (
            <Field
              label="LINE ID"
              name="line_id"
              value={values.line_id}
              error={errors.line_id}
              onChange={update}
              required
            />
          ) : null}
          {values.preferred_contact === "email" ? (
            <Field
              label="อีเมล"
              name="email"
              type="email"
              value={values.email}
              error={errors.email}
              onChange={update}
              required
            />
          ) : null}
          <label className="honeypot" aria-hidden="true">
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={values.website}
              onChange={(event) => update("website", event.target.value)}
            />
          </label>
          <label className="consent">
            <input
              type="checkbox"
              checked={values.consent}
              onChange={(event) => update("consent", event.target.checked)}
            />
            <span>
              ยินยอมให้ใช้ข้อมูลนี้เพื่อตรวจสอบงานและติดต่อกลับ{" "}
              <b aria-hidden="true">*</b>
            </span>
          </label>
          {errors.consent ? (
            <small className="field-error">{errors.consent}</small>
          ) : null}
        </div>
      ) : null}

      <div className="form-actions">
        {step > 1 ? (
          <button
            type="button"
            className="button-secondary"
            onClick={() => setStep(step - 1)}
          >
            ย้อนกลับ
          </button>
        ) : null}
        {step < 3 ? (
          <button type="button" className="button" onClick={advance}>
            ดำเนินการต่อ
          </button>
        ) : (
          <button
            className="button"
            type="submit"
            disabled={status === "submitting"}
          >
            {status === "submitting"
              ? "กำลังส่งข้อมูล…"
              : "ส่งข้อมูลเพื่อให้ทีมประเมิน"}
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  error,
  onChange,
  required = false,
}: {
  label: string;
  name: keyof QuoteFormValues;
  type?: string;
  value: string;
  error?: string;
  onChange: (name: keyof QuoteFormValues, value: string) => void;
  required?: boolean;
}) {
  const errorId = `${name}-error`;
  return (
    <label className="field">
      <span>
        {label} {required ? <b aria-hidden="true">*</b> : null}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        required={required}
        min={type === "number" ? 1 : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(name, event.target.value)}
      />
      {error ? (
        <small id={errorId} className="field-error">
          {error}
        </small>
      ) : null}
    </label>
  );
}
