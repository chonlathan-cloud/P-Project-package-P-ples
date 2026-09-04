"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { quoteFormSchema, toLeadPayload, type QuoteFormValues } from "./schema";

type Path = QuoteFormValues["customer_path"];

const quoteSteps = ["เลือกจุดเริ่ม", "รายละเอียดงาน", "ติดต่อกลับ"] as const;

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

export function QuoteForm({
  initialPath,
  initialProductType = "",
  reference = "",
}: {
  initialPath: Path;
  initialProductType?: string;
  reference?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<QuoteFormValues>({
    ...blankForm,
    customer_path: initialPath,
    product_type: initialProductType,
    project_details: reference
      ? `สนใจประเมินงานโดยอ้างอิงจาก: ${reference}`
      : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const errorSummary = useRef<HTMLDivElement>(null);
  const stepPanel = useRef<HTMLDivElement>(null);
  const hasRendered = useRef(false);
  const idempotencyKey = useRef<string | null>(null);

  useEffect(() => {
    if (hasRendered.current) stepPanel.current?.focus();
    else hasRendered.current = true;
  }, [step]);

  function update(name: keyof QuoteFormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
    if (status === "error") setStatus("idle");
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
      <ol className="quote-steps" aria-label="ขั้นตอนขอใบเสนอราคา">
        {quoteSteps.map((label, index) => {
          const position = index + 1;
          const state =
            position < step
              ? "complete"
              : position === step
                ? "current"
                : "upcoming";
          return (
            <li
              key={label}
              className={`quote-step ${state}`}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span>{String(position).padStart(2, "0")}</span>
              <strong>{label}</strong>
              <small className="sr-only">
                {state === "complete"
                  ? "เสร็จแล้ว"
                  : state === "current"
                    ? "ขั้นตอนปัจจุบัน"
                    : "ยังไม่ถึงขั้นตอนนี้"}
              </small>
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        ขั้นตอน {step} จาก {quoteSteps.length}: {quoteSteps[step - 1]}
      </p>
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
        <div className="quote-step-panel" ref={stepPanel} tabIndex={-1}>
          <fieldset className="path-fieldset">
            <legend>เลือกจุดเริ่มที่ใกล้กับคุณที่สุด</legend>
            <div className="path-options">
              <label
                className={
                  values.customer_path === "has_specifications"
                    ? "choice selected"
                    : "choice"
                }
              >
                <span className="choice-number" aria-hidden="true">
                  01
                </span>
                <input
                  type="radio"
                  name="customer_path"
                  checked={values.customer_path === "has_specifications"}
                  onChange={() => update("customer_path", "has_specifications")}
                />
                <span className="choice-copy">
                  <strong>มีขนาดหรือกล่องเดิมแล้ว</strong>
                  <small>ฉันทราบประเภทกล่อง ขนาด หรือจำนวนโดยประมาณ</small>
                  <span className="choice-outcome">
                    ไปกรอกจำนวน ขนาด และข้อกำหนด
                  </span>
                </span>
              </label>
              <label
                className={
                  values.customer_path === "needs_guidance"
                    ? "choice selected"
                    : "choice"
                }
              >
                <span className="choice-number" aria-hidden="true">
                  02
                </span>
                <input
                  type="radio"
                  name="customer_path"
                  checked={values.customer_path === "needs_guidance"}
                  onChange={() => update("customer_path", "needs_guidance")}
                />
                <span className="choice-copy">
                  <strong>มีสินค้าแต่ยังไม่มีแบบ</strong>
                  <small>ฉันยังไม่แน่ใจเรื่องขนาด วัสดุ หรือรูปแบบกล่อง</small>
                  <span className="choice-outcome">
                    ให้ทีมช่วยจัด brief จากข้อมูลสินค้า
                  </span>
                </span>
              </label>
            </div>
          </fieldset>
        </div>
      ) : null}

      {step === 2 ? (
        <div
          className="form-fields quote-step-panel"
          ref={stepPanel}
          tabIndex={-1}
        >
          <h2>รายละเอียดงาน</h2>
          <div className="path-guidance">
            <p>ข้อมูลที่ช่วยทีมประเมิน</p>
            <strong>
              {values.customer_path === "has_specifications"
                ? "ส่งจำนวน ขนาด วัสดุ หรือข้อกำหนดเท่าที่มี"
                : "เริ่มจากประเภทสินค้า ขนาด น้ำหนัก และลักษณะการใช้งานเท่าที่ทราบ"}
            </strong>
          </div>
          <Field
            label="ประเภทสินค้า"
            name="product_type"
            placeholder="เช่น เครื่องสำอาง อาหารเสริม หรืออะไหล่"
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
                placeholder="เช่น 1000"
                value={values.quantity}
                error={errors.quantity}
                onChange={update}
                required
              />
              <Field
                label="ขนาดที่ทราบ"
                name="dimensions"
                placeholder="เช่น กว้าง 10 × ยาว 15 × สูง 5 ซม."
                value={values.dimensions}
                onChange={update}
              />
            </div>
          ) : null}
          <div className="field-row">
            <Field
              label="จังหวัดที่จัดส่ง"
              name="delivery_province"
              placeholder="เช่น สมุทรปราการ"
              value={values.delivery_province}
              onChange={update}
            />
            <Field
              label="กำหนดใช้งาน (ถ้ามี)"
              name="required_date"
              type="date"
              value={values.required_date}
              onChange={update}
            />
          </div>
          <label className="field">
            <span>
              รายละเอียดและข้อจำกัด <b aria-hidden="true">*</b>
            </span>
            <textarea
              placeholder="เช่น ต้องการกล่องใส่ขวด 30 มล. จัดส่งทางพัสดุ และต้องการคำแนะนำเรื่องวัสดุ"
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
        <div
          className="form-fields quote-step-panel"
          ref={stepPanel}
          tabIndex={-1}
        >
          <h2>ช่องทางติดต่อกลับ</h2>
          <div className="field-row">
            <Field
              label="ชื่อผู้ติดต่อ"
              name="contact_name"
              placeholder="เช่น คุณนันทา"
              value={values.contact_name}
              error={errors.contact_name}
              onChange={update}
              required
            />
            <Field
              label="บริษัทหรือแบรนด์ (ถ้ามี)"
              name="company"
              placeholder="เช่น แบรนด์ตัวอย่าง"
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
              placeholder="เช่น 0812345678"
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
              placeholder="เช่น ddboxprinting"
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
              placeholder="เช่น name@company.com"
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
            {step === 1 ? "ไปกรอกรายละเอียดงาน" : "ไปเลือกช่องทางติดต่อ"}
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
      <p className="sr-only" role="status" aria-live="polite">
        {status === "submitting" ? "กำลังส่งข้อมูล กรุณารอสักครู่" : ""}
      </p>
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
  placeholder,
}: {
  label: string;
  name: keyof QuoteFormValues;
  type?: string;
  value: string;
  error?: string;
  onChange: (name: keyof QuoteFormValues, value: string) => void;
  required?: boolean;
  placeholder?: string;
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
        placeholder={placeholder}
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
