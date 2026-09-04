"use client";

import type { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { adminApi, requiresAdminReauthentication } from "./content-api-client";
import {
  faqScopeOptions,
  OTHER_CATEGORY_VALUE,
  pricingBenchmarkOptions,
  productCategoryOptions,
} from "./content-options";
import {
  contentResource,
  emptyContent,
  lines,
  optional,
  type ContentDetailItem,
  type ContentDocument,
  type ContentKind,
  type PageSection,
  type StructuredContent,
} from "./types";

const labels: Record<
  ContentKind,
  { title: string; singular: string; description: string }
> = {
  product: {
    title: "สินค้าและงานพิมพ์",
    singular: "สินค้า",
    description:
      "ควบคุมข้อมูลในหน้ารวมสินค้า หน้ารายละเอียดสินค้า และข้อมูล SEO",
  },
  offer: {
    title: "วิธีเริ่มงาน",
    singular: "วิธีเริ่มงาน",
    description:
      "กำหนดทางเลือกสำหรับลูกค้าที่มีสเปกแล้วหรือต้องการให้ทีมช่วยจัด brief",
  },
  faq: {
    title: "คำถามที่พบบ่อย",
    singular: "คำถาม",
    description: "เก็บคำตอบกลางและเลือกหน้าที่ควรนำคำตอบนั้นไปแสดง",
  },
  page: {
    title: "ข้อความหน้าเว็บไซต์",
    singular: "ชุดข้อความ",
    description:
      "จัดลำดับข้อความ รายการอ้างอิง และปุ่มของหน้าเว็บไซต์ ไม่ใช่ page builder อิสระ",
  },
};

const statusLabels = {
  draft: "ร่าง",
  published: "เผยแพร่แล้ว",
  archived: "เก็บถาวร",
};

export function StructuredContentEditor({
  user,
  kind,
  onDirtyChange,
  onReauthenticate,
}: {
  user: User;
  kind: ContentKind;
  onDirtyChange?: (dirty: boolean) => void;
  onReauthenticate?: () => void;
}) {
  const [documents, setDocuments] = useState<ContentDocument[]>([]);
  const [selected, setSelected] = useState<ContentDocument | null>(null);
  const [draft, setDraft] = useState<StructuredContent>(() =>
    emptyContent(kind),
  );
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [needsReauthentication, setNeedsReauthentication] = useState(false);

  useEffect(() => {
    const preventClose = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", preventClose);
    return () => window.removeEventListener("beforeunload", preventClose);
  }, [dirty]);

  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    let active = true;
    adminApi<ContentDocument[]>(user, `/v1/admin/${contentResource[kind]}`)
      .then((items) => {
        if (active) setDocuments(items);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setNeedsReauthentication(requiresAdminReauthentication(requestError));
          setError(
            requestError instanceof Error
              ? requestError.message
              : "โหลดรายการไม่สำเร็จ",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [kind, user]);

  function canLeaveDraft() {
    return (
      !dirty ||
      window.confirm("มีข้อมูลที่ยังไม่บันทึก ต้องการออกจากรายการนี้หรือไม่")
    );
  }

  function choose(document: ContentDocument) {
    if (!canLeaveDraft()) return;
    setSelected(document);
    setDraft(structuredClone(document.content));
    setDirty(false);
    setMessage("");
    setError("");
    setNeedsReauthentication(false);
  }

  function startNew() {
    if (!canLeaveDraft()) return;
    setSelected(null);
    setDraft(emptyContent(kind));
    setDirty(false);
    setMessage("");
    setError("");
    setNeedsReauthentication(false);
  }

  function replaceDraft(next: StructuredContent) {
    setDraft(next);
    setDirty(true);
  }

  function updateCommon(field: "slug" | "title" | "summary", value: string) {
    replaceDraft({ ...draft, [field]: value } as StructuredContent);
  }

  function updateSeo(field: keyof StructuredContent["seo"], value: string) {
    replaceDraft({
      ...draft,
      seo: { ...draft.seo, [field]: optional(value) },
    } as StructuredContent);
  }

  function acceptDocument(document: ContentDocument, success: string) {
    setDocuments((current) => {
      const remaining = current.filter((item) => item.id !== document.id);
      return [document, ...remaining];
    });
    setSelected(document);
    setDraft(structuredClone(document.content));
    setDirty(false);
    setMessage(success);
    setError("");
    setNeedsReauthentication(false);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const document = selected
        ? await adminApi<ContentDocument>(
            user,
            `/v1/admin/${contentResource[kind]}/${selected.id}`,
            {
              method: "PUT",
              body: JSON.stringify({
                expected_version: selected.version,
                content: draft,
              }),
            },
          )
        : await adminApi<ContentDocument>(
            user,
            `/v1/admin/${contentResource[kind]}`,
            {
              method: "POST",
              body: JSON.stringify(draft),
            },
          );
      acceptDocument(document, "บันทึกร่างแล้ว");
    } catch (requestError) {
      setNeedsReauthentication(requiresAdminReauthentication(requestError));
      setError(
        requestError instanceof Error
          ? requestError.message
          : "บันทึกร่างไม่สำเร็จ",
      );
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(action: "publish" | "archive") {
    if (!selected || dirty) return;
    setBusy(true);
    setError("");
    setNeedsReauthentication(false);
    setMessage("");
    try {
      const document = await adminApi<ContentDocument>(
        user,
        `/v1/admin/${action}/${kind}/${selected.id}`,
        {
          method: "POST",
          body: JSON.stringify({ expected_version: selected.version }),
        },
      );
      acceptDocument(
        document,
        action === "publish"
          ? "เผยแพร่แล้ว ระบบกำลัง revalidate หน้าเว็บไซต์"
          : "เก็บรายการออกจากหน้าเว็บไซต์แล้ว",
      );
    } catch (requestError) {
      setNeedsReauthentication(requiresAdminReauthentication(requestError));
      setError(
        requestError instanceof Error
          ? requestError.message
          : "เปลี่ยนสถานะไม่สำเร็จ",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-resource" aria-labelledby="content-editor-title">
      <header className="admin-resource-heading">
        <div>
          <p className="eyebrow">เนื้อหาเว็บไซต์แบบมีโครงสร้าง</p>
          <h2 id="content-editor-title">จัดการ{labels[kind].title}</h2>
        </div>
        <p>
          {labels[kind].description} บันทึกร่างและตรวจข้อมูลก่อนเผยแพร่ทุกครั้ง
        </p>
      </header>

      <div className="admin-work-grid">
        <aside
          className="admin-master"
          aria-label={`รายการ${labels[kind].title}`}
        >
          <button className="button" type="button" onClick={startNew}>
            เพิ่ม{labels[kind].singular}ใหม่
          </button>
          {loading ? <p className="muted">กำลังโหลดรายการ…</p> : null}
          {!loading && documents.length === 0 ? (
            <p className="admin-empty">ยังไม่มีข้อมูล เริ่มจากสร้างร่างแรก</p>
          ) : null}
          <div className="admin-record-list">
            {documents.map((document) => (
              <button
                key={document.id}
                type="button"
                className={selected?.id === document.id ? "is-current" : ""}
                onClick={() => choose(document)}
                aria-current={selected?.id === document.id ? "true" : undefined}
              >
                <span>{document.content.title}</span>
                <small>
                  {statusLabels[document.status]} · v{document.version}
                  {document.has_unpublished_changes ? " · มีร่างใหม่" : ""}
                </small>
              </button>
            ))}
          </div>
        </aside>

        <form className="admin-editor admin-structured-editor" onSubmit={save}>
          <div className="admin-editor-summary">
            <div>
              <strong>
                {selected ? `แก้ไข v${selected.version}` : "ร่างใหม่"}
              </strong>
              <span>
                {selected ? statusLabels[selected.status] : "ยังไม่บันทึก"}
              </span>
            </div>
            {dirty ? <b>มีการแก้ไขที่ยังไม่บันทึก</b> : null}
          </div>

          <CommonFields
            content={draft}
            onCommonChange={updateCommon}
            onSeoChange={updateSeo}
            slugLocked={Boolean(selected?.published_at)}
          />
          <ResourceFields content={draft} onChange={replaceDraft} />

          {error ? (
            <div className="admin-feedback-stack">
              <p className="field-error admin-feedback" role="alert">
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

          <div className="admin-editor-actions">
            <button className="button" disabled={busy || !dirty}>
              {busy
                ? "กำลังบันทึก…"
                : selected
                  ? "บันทึกการแก้ไข"
                  : "บันทึกร่าง"}
            </button>
            <button
              className="button-secondary"
              type="button"
              disabled={busy || !selected || dirty}
              onClick={() => changeStatus("publish")}
            >
              เผยแพร่ version นี้
            </button>
            <button
              className="admin-archive-action"
              type="button"
              disabled={
                busy || !selected || dirty || selected.status === "archived"
              }
              onClick={() => changeStatus("archive")}
            >
              เก็บถาวร
            </button>
          </div>
          {selected && dirty ? (
            <p className="admin-action-hint">
              บันทึกการแก้ไขก่อนจึงจะเผยแพร่ได้
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}

function CommonFields({
  content,
  onCommonChange,
  onSeoChange,
  slugLocked,
}: {
  content: StructuredContent;
  onCommonChange: (field: "slug" | "title" | "summary", value: string) => void;
  onSeoChange: (field: keyof StructuredContent["seo"], value: string) => void;
  slugLocked: boolean;
}) {
  return (
    <>
      <div className="admin-field-row">
        <ControlledField
          label="ชื่อรายการ (ภาษาไทย)"
          placeholder="เช่น กล่องไปรษณีย์สั่งผลิต"
          value={content.title}
          minLength={3}
          maxLength={160}
          onChange={(value) => onCommonChange("title", value)}
        />
        <ControlledField
          label="Slug"
          placeholder="เช่น corrugated-mailer"
          value={content.slug}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          minLength={2}
          maxLength={120}
          disabled={slugLocked}
          hint={slugLocked ? "Slug ถูกล็อกหลังเผยแพร่ครั้งแรก" : undefined}
          onChange={(value) => onCommonChange("slug", value)}
        />
      </div>
      <ControlledTextarea
        label="สรุป"
        placeholder="สรุปสิ่งที่ลูกค้าจะได้รับหรือข้อมูลสำคัญของรายการนี้"
        value={content.summary}
        rows={3}
        minLength={3}
        maxLength={500}
        onChange={(value) => onCommonChange("summary", value)}
      />
      <details className="admin-seo-fields">
        <summary>SEO และ social sharing</summary>
        <div className="admin-field-row">
          <ControlledField
            label="SEO title (ถ้ามี)"
            placeholder="เช่น กล่องไปรษณีย์สั่งผลิต | DD Box"
            value={content.seo.title ?? ""}
            required={false}
            maxLength={70}
            onChange={(value) => onSeoChange("title", value)}
          />
          <ControlledField
            label="Social image ID (ถ้ามี)"
            placeholder="เช่น media-social-products"
            value={content.seo.social_image_id ?? ""}
            required={false}
            maxLength={128}
            onChange={(value) => onSeoChange("social_image_id", value)}
          />
        </div>
        <ControlledTextarea
          label="Meta description (ถ้ามี)"
          placeholder="สรุปเนื้อหาหน้านี้สำหรับผลการค้นหา ไม่เกินประมาณ 160 ตัวอักษร"
          value={content.seo.description ?? ""}
          required={false}
          rows={2}
          maxLength={170}
          onChange={(value) => onSeoChange("description", value)}
        />
        <ControlledField
          label="Canonical override (ใช้เฉพาะเมื่อจำเป็น)"
          placeholder="เช่น https://www.ddboxprinting.com/products/corrugated-mailer"
          value={content.seo.canonical_override ?? ""}
          required={false}
          maxLength={2048}
          onChange={(value) => onSeoChange("canonical_override", value)}
        />
      </details>
    </>
  );
}

function ResourceFields({
  content,
  onChange,
}: {
  content: StructuredContent;
  onChange: (next: StructuredContent) => void;
}) {
  if (content.kind === "product")
    return (
      <>
        <div className="admin-field-row">
          <CategoryField
            value={content.category}
            onChange={(category) => onChange({ ...content, category })}
          />
          <ControlledField
            label="ลำดับแสดงผล"
            type="number"
            value={String(content.display_order)}
            min={0}
            max={10000}
            onChange={(value) =>
              onChange({
                ...content,
                display_order: Number.parseInt(value || "0", 10),
              })
            }
          />
        </div>
        <ControlledTextarea
          label="คำอธิบายหน้า Product"
          placeholder="อธิบายรูปแบบงาน จุดเด่น และข้อมูลที่ช่วยลูกค้าตัดสินใจ"
          value={content.overview ?? ""}
          required={false}
          rows={4}
          maxLength={1000}
          onChange={(value) =>
            onChange({ ...content, overview: optional(value) })
          }
        />
        <label className="field">
          <span>ราคาอ้างอิงที่เกี่ยวข้อง (ถ้ามี)</span>
          <select
            value={content.pricing_benchmark_id ?? ""}
            onChange={(event) =>
              onChange({
                ...content,
                pricing_benchmark_id: optional(event.target.value),
              })
            }
          >
            <option value="">ไม่ผูกกับราคาอ้างอิง</option>
            {pricingBenchmarkOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <ContentImageFields
          label="ภาพ Hero"
          image={content.hero_image}
          onChange={(hero_image) => onChange({ ...content, hero_image })}
        />
        <ContentImageFields
          label="ภาพอธิบายโครงสร้าง"
          image={content.evidence_image}
          onChange={(evidence_image) =>
            onChange({ ...content, evidence_image })
          }
        />
        <DetailListField
          label="ตัวอย่างงานในกลุ่มนี้"
          values={content.applications}
          onChange={(applications) => onChange({ ...content, applications })}
        />
        <ListField
          label="เหมาะเมื่อ (หนึ่งรายการต่อบรรทัด)"
          values={content.fit}
          required={false}
          onChange={(fit) => onChange({ ...content, fit })}
        />
        <ListField
          label="ข้อมูลที่ควรเตรียม (หนึ่งรายการต่อบรรทัด)"
          values={content.brief}
          required={false}
          onChange={(brief) => onChange({ ...content, brief })}
        />
        <DetailListField
          label="สิ่งที่ควรตัดสินใจร่วมกัน"
          values={content.decisions}
          onChange={(decisions) => onChange({ ...content, decisions })}
        />
        <ListField
          label="วัสดุ (หนึ่งรายการต่อบรรทัด)"
          values={content.materials}
          required={false}
          onChange={(materials) => onChange({ ...content, materials })}
        />
        <ListField
          label="ลักษณะงานที่เหมาะ (หนึ่งรายการต่อบรรทัด)"
          values={content.use_cases}
          required={false}
          onChange={(use_cases) => onChange({ ...content, use_cases })}
        />
        <ControlledTextarea
          label="คำอธิบาย MOQ แบบมีเงื่อนไข (ถ้ามี)"
          placeholder="เช่น จำนวนเริ่มต้นขึ้นอยู่กับขนาด วัสดุ และรูปแบบงานพิมพ์"
          value={content.moq_guidance ?? ""}
          required={false}
          rows={2}
          maxLength={300}
          onChange={(value) =>
            onChange({ ...content, moq_guidance: optional(value) })
          }
        />
        <ControlledTextarea
          label="ข้อความระยะเวลาดำเนินงาน (ถ้ามี)"
          placeholder="เช่น ระยะเวลาดำเนินงานประเมินหลังยืนยันแบบและรายละเอียดการผลิต"
          value={content.lead_time_wording ?? ""}
          required={false}
          rows={2}
          maxLength={300}
          onChange={(value) =>
            onChange({ ...content, lead_time_wording: optional(value) })
          }
        />
        <ListField
          label="Media asset IDs (หนึ่งรายการต่อบรรทัด)"
          values={content.media_ids}
          required={false}
          onChange={(media_ids) => onChange({ ...content, media_ids })}
        />
      </>
    );

  if (content.kind === "offer")
    return (
      <>
        <div className="admin-field-row">
          <ControlledField
            label="ลำดับแสดงผล"
            type="number"
            value={String(content.display_order)}
            min={0}
            max={10000}
            onChange={(value) =>
              onChange({
                ...content,
                display_order: Number.parseInt(value || "0", 10),
              })
            }
          />
          <ControlledField
            label="Label ภาษาอังกฤษ (ถ้ามี)"
            value={content.label ?? ""}
            required={false}
            maxLength={80}
            onChange={(value) =>
              onChange({ ...content, label: optional(value) })
            }
          />
        </div>
        <ControlledField
          label="สถานะงานที่ใช้เป็นหัวข้อ"
          placeholder="เช่น เริ่มต้นจากข้อมูลเท่าที่มี"
          value={content.status_label ?? ""}
          required={false}
          maxLength={80}
          onChange={(value) =>
            onChange({ ...content, status_label: optional(value) })
          }
        />
        <ControlledTextarea
          label="เหมาะกับใคร"
          placeholder="อธิบายลักษณะลูกค้าหรือสถานการณ์ที่เหมาะกับวิธีเริ่มงานนี้"
          value={content.audience}
          rows={3}
          minLength={3}
          maxLength={500}
          onChange={(audience) => onChange({ ...content, audience })}
        />
        <label className="field">
          <span>เส้นทางแบบฟอร์ม</span>
          <select
            value={content.quote_path}
            onChange={(event) =>
              onChange({
                ...content,
                quote_path: event.target.value as typeof content.quote_path,
              })
            }
          >
            <option value="needs_guidance">ต้องการคำแนะนำ</option>
            <option value="has_specifications">มีสเปกแล้ว</option>
          </select>
        </label>
        <ControlledTextarea
          label="คำอธิบาย MOQ แบบมีเงื่อนไข (ถ้ามี)"
          placeholder="เช่น จำนวนเริ่มต้นขึ้นอยู่กับโครงสร้างและวิธีผลิต"
          value={content.moq_guidance ?? ""}
          required={false}
          rows={2}
          maxLength={300}
          onChange={(value) =>
            onChange({ ...content, moq_guidance: optional(value) })
          }
        />
        <ListField
          label="ประโยชน์หลัก (หนึ่งรายการต่อบรรทัด)"
          values={content.benefits}
          onChange={(benefits) => onChange({ ...content, benefits })}
        />
        <ListField
          label="ข้อมูลที่เริ่มส่งได้ (หนึ่งรายการต่อบรรทัด)"
          values={content.inputs}
          required={false}
          onChange={(inputs) => onChange({ ...content, inputs })}
        />
        <DetailListField
          label="สิ่งที่ทีมจะเริ่มตรวจ"
          values={content.checks}
          onChange={(checks) => onChange({ ...content, checks })}
        />
        <div className="admin-field-row">
          <ControlledField
            label="ข้อความปุ่ม"
            placeholder="เช่น ส่งรายละเอียดให้ทีมประเมิน"
            value={content.cta_label}
            minLength={3}
            maxLength={80}
            onChange={(cta_label) => onChange({ ...content, cta_label })}
          />
          <ControlledField
            label="ลิงก์ปุ่มภายในเว็บไซต์"
            placeholder="เช่น /quote?path=needs_guidance"
            value={content.cta_href}
            pattern="/[a-z0-9/_-]*(?:\?[a-z0-9_=&-]+)?"
            maxLength={500}
            onChange={(cta_href) => onChange({ ...content, cta_href })}
          />
        </div>
        <ListField
          label="Proof reference IDs (หนึ่งรายการต่อบรรทัด)"
          values={content.proof_reference_ids}
          required={false}
          onChange={(proof_reference_ids) =>
            onChange({ ...content, proof_reference_ids })
          }
        />
      </>
    );

  if (content.kind === "faq")
    return (
      <>
        <ControlledTextarea
          label="คำถาม"
          placeholder="เช่น สามารถเริ่มประเมินงานได้อย่างไร"
          value={content.question}
          rows={2}
          minLength={5}
          maxLength={300}
          onChange={(question) => onChange({ ...content, question })}
        />
        <ControlledTextarea
          label="คำตอบ"
          placeholder="ตอบให้ชัดเจน กระชับ และไม่ระบุราคา ระยะเวลา หรือข้อเท็จจริงที่ยังไม่ได้ยืนยัน"
          value={content.answer}
          rows={6}
          minLength={10}
          maxLength={3000}
          onChange={(answer) => onChange({ ...content, answer })}
        />
        <div className="admin-field-row">
          <FaqScopeField
            values={content.page_scopes}
            onChange={(page_scopes) => onChange({ ...content, page_scopes })}
          />
          <ControlledField
            label="ลำดับ"
            type="number"
            value={String(content.order)}
            min={0}
            max={10000}
            onChange={(value) =>
              onChange({ ...content, order: Number.parseInt(value || "0", 10) })
            }
          />
        </div>
      </>
    );

  return <PageSections content={content} onChange={onChange} />;
}

function CategoryField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const known = productCategoryOptions.some((option) => option === value);
  const customSelected =
    value === OTHER_CATEGORY_VALUE || Boolean(value && !known);

  return (
    <div className="admin-choice-field">
      <label className="field">
        <span>หมวดหมู่</span>
        <select
          value={customSelected ? OTHER_CATEGORY_VALUE : value}
          required
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="" disabled>
            เลือกหมวดหมู่สินค้า
          </option>
          {productCategoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value={OTHER_CATEGORY_VALUE}>อื่น ๆ — ระบุหมวดใหม่</option>
        </select>
      </label>
      {customSelected ? (
        <ControlledField
          label="ระบุหมวดหมู่ใหม่"
          value={value === OTHER_CATEGORY_VALUE ? "" : value}
          placeholder="เช่น ถุงกระดาษและบรรจุภัณฑ์เสริม"
          minLength={2}
          maxLength={80}
          onChange={onChange}
        />
      ) : null}
    </div>
  );
}

function FaqScopeField({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const presetValues = new Set<string>(
    faqScopeOptions.map((option) => option.value),
  );
  const customValues = values.filter((value) => !presetValues.has(value));

  function toggle(value: string, checked: boolean) {
    const nextPreset = faqScopeOptions
      .map((option) => option.value)
      .filter((option) =>
        option === value ? checked : values.includes(option),
      );
    onChange([...nextPreset, ...customValues]);
  }

  return (
    <fieldset className="admin-scope-field">
      <legend>ใช้คำตอบนี้ในหน้าใด</legend>
      <p>เลือกหน้าหลัก หรือลง scope เฉพาะรายการด้านล่าง</p>
      {faqScopeOptions.map((option) => (
        <label className="consent" key={option.value}>
          <input
            type="checkbox"
            checked={values.includes(option.value)}
            onChange={(event) => toggle(option.value, event.target.checked)}
          />
          <span>{option.label}</span>
        </label>
      ))}
      <ControlledTextarea
        label="Scope เฉพาะรายการ (ถ้ามี หนึ่งรายการต่อบรรทัด)"
        value={customValues.join("\n")}
        placeholder={"เช่น product:folding-carton\nหรือ offer:starter"}
        rows={3}
        required={values.length === 0}
        onChange={(value) => {
          const selectedPreset = faqScopeOptions
            .map((option) => option.value)
            .filter((option) => values.includes(option));
          onChange([...selectedPreset, ...lines(value)]);
        }}
      />
    </fieldset>
  );
}

function PageSections({
  content,
  onChange,
}: {
  content: Extract<StructuredContent, { kind: "page" }>;
  onChange: (next: StructuredContent) => void;
}) {
  function update(index: number, section: PageSection) {
    onChange({
      ...content,
      sections: content.sections.map((current, itemIndex) =>
        itemIndex === index ? section : current,
      ),
    });
  }

  function changeType(index: number, type: PageSection["type"]) {
    const heading = content.sections[index]?.heading ?? "";
    const key = content.sections[index]?.key ?? null;
    const section: PageSection =
      type === "text"
        ? { type, key, heading, paragraphs: [""], bullets: [], items: [] }
        : type === "entity_list"
          ? { type, key, heading, entity_kind: "products", entity_ids: [] }
          : { type, key, heading, body: "", label: "", href: "/quote" };
    update(index, section);
  }

  function addSection() {
    onChange({
      ...content,
      sections: [
        ...content.sections,
        {
          type: "text",
          key: null,
          heading: "",
          paragraphs: [""],
          bullets: [],
          items: [],
        },
      ],
    });
  }

  function removeSection(index: number) {
    if (content.sections.length === 1) return;
    onChange({
      ...content,
      sections: content.sections.filter((_, itemIndex) => itemIndex !== index),
    });
  }

  return (
    <fieldset className="admin-section-editor">
      <legend>Sections ที่อนุญาต</legend>
      {content.sections.map((section, index) => (
        <div className="admin-page-section" key={`${section.type}-${index}`}>
          <div className="admin-section-toolbar">
            <strong>Section {index + 1}</strong>
            <label>
              <span className="sr-only">ประเภท Section {index + 1}</span>
              <select
                value={section.type}
                onChange={(event) =>
                  changeType(index, event.target.value as PageSection["type"])
                }
              >
                <option value="text">ข้อความ</option>
                <option value="entity_list">รายการข้อมูลอ้างอิง</option>
                <option value="cta">คำเชิญให้ดำเนินการ</option>
              </select>
            </label>
            <button
              type="button"
              className="admin-text-action"
              disabled={content.sections.length === 1}
              onClick={() => removeSection(index)}
            >
              ลบ section
            </button>
          </div>
          <ControlledField
            label="Section key (ใช้ผูกกับตำแหน่งหน้า)"
            value={section.key ?? ""}
            required={false}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            maxLength={80}
            onChange={(value) =>
              update(index, { ...section, key: optional(value) })
            }
          />
          <ControlledField
            label="หัวข้อ"
            value={section.heading}
            minLength={3}
            maxLength={160}
            onChange={(heading) => update(index, { ...section, heading })}
          />
          {section.type === "text" ? (
            <>
              <ListField
                label="ย่อหน้า (หนึ่งย่อหน้าต่อบรรทัด)"
                values={section.paragraphs}
                onChange={(paragraphs) =>
                  update(index, { ...section, paragraphs })
                }
              />
              <ListField
                label="Bullet (ถ้ามี หนึ่งรายการต่อบรรทัด)"
                values={section.bullets}
                required={false}
                onChange={(bullets) => update(index, { ...section, bullets })}
              />
              <DetailListField
                label="รายการหัวข้อพร้อมคำอธิบาย (ถ้ามี)"
                values={section.items}
                onChange={(items) => update(index, { ...section, items })}
              />
            </>
          ) : null}
          {section.type === "entity_list" ? (
            <>
              <label className="field">
                <span>ชนิดข้อมูลอ้างอิง</span>
                <select
                  value={section.entity_kind}
                  onChange={(event) =>
                    update(index, {
                      ...section,
                      entity_kind: event.target
                        .value as typeof section.entity_kind,
                    })
                  }
                >
                  <option value="products">สินค้า</option>
                  <option value="offers">ข้อเสนอ</option>
                  <option value="faqs">คำถามที่พบบ่อย</option>
                  <option value="gallery_items">ผลงาน Gallery</option>
                </select>
              </label>
              <ListField
                label="Entity IDs (หนึ่งรายการต่อบรรทัด)"
                values={section.entity_ids}
                onChange={(entity_ids) =>
                  update(index, { ...section, entity_ids })
                }
              />
            </>
          ) : null}
          {section.type === "cta" ? (
            <>
              <ControlledTextarea
                label="ข้อความประกอบ"
                value={section.body}
                rows={3}
                minLength={3}
                maxLength={500}
                onChange={(body) => update(index, { ...section, body })}
              />
              <div className="admin-field-row">
                <ControlledField
                  label="ข้อความปุ่ม"
                  value={section.label}
                  minLength={3}
                  maxLength={80}
                  onChange={(label) => update(index, { ...section, label })}
                />
                <ControlledField
                  label="ลิงก์ภายในเว็บไซต์"
                  value={section.href}
                  pattern="/[a-z0-9/_-]*(?:\?[a-z0-9_=&-]+)?"
                  maxLength={500}
                  onChange={(href) => update(index, { ...section, href })}
                />
              </div>
            </>
          ) : null}
        </div>
      ))}
      <button className="button-secondary" type="button" onClick={addSection}>
        เพิ่ม section
      </button>
    </fieldset>
  );
}

function ContentImageFields({
  label,
  image,
  onChange,
}: {
  label: string;
  image: { src: string; alt: string } | null;
  onChange: (image: { src: string; alt: string } | null) => void;
}) {
  const required = Boolean(image?.src || image?.alt);
  function update(field: "src" | "alt", value: string) {
    const next = {
      src: image?.src ?? "",
      alt: image?.alt ?? "",
      [field]: value,
    };
    onChange(next.src || next.alt ? next : null);
  }
  return (
    <fieldset className="admin-section-editor">
      <legend>{label}</legend>
      <div className="admin-field-row">
        <ControlledField
          label="Path ใน /images"
          placeholder="เช่น /images/products/corrugated-mailer.webp"
          value={image?.src ?? ""}
          required={required}
          pattern="/images/[a-zA-Z0-9/_.-]+"
          maxLength={500}
          onChange={(value) => update("src", value)}
        />
        <ControlledField
          label="Alt text ภาษาไทย"
          placeholder="เช่น กล่องลูกฟูกสีน้ำตาลเปิดฝาเห็นชิ้นรองด้านใน"
          value={image?.alt ?? ""}
          required={required}
          maxLength={300}
          onChange={(value) => update("alt", value)}
        />
      </div>
    </fieldset>
  );
}

function DetailListField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: ContentDetailItem[];
  onChange: (values: ContentDetailItem[]) => void;
}) {
  function update(
    index: number,
    field: keyof ContentDetailItem,
    value: string,
  ) {
    onChange(
      values.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }
  return (
    <fieldset className="admin-section-editor">
      <legend>{label}</legend>
      {values.map((item, index) => (
        <div className="admin-page-section" key={`${label}-${index}`}>
          <div className="admin-field-row">
            <ControlledField
              label={`หัวข้อ ${index + 1}`}
              placeholder="เช่น เหมาะกับการจัดส่งสินค้า"
              value={item.title}
              minLength={3}
              maxLength={160}
              onChange={(value) => update(index, "title", value)}
            />
            <button
              className="admin-text-action"
              type="button"
              onClick={() =>
                onChange(values.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              ลบรายการ
            </button>
          </div>
          <ControlledTextarea
            label={`คำอธิบาย ${index + 1}`}
            placeholder="อธิบายข้อมูลของหัวข้อนี้ให้ลูกค้าเข้าใจได้โดยไม่ต้องเดา"
            value={item.description}
            rows={3}
            minLength={3}
            maxLength={1000}
            onChange={(value) => update(index, "description", value)}
          />
        </div>
      ))}
      <button
        className="button-secondary"
        type="button"
        onClick={() => onChange([...values, { title: "", description: "" }])}
      >
        เพิ่มรายการ
      </button>
    </fieldset>
  );
}

function ListField({
  label,
  values,
  onChange,
  required = true,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
}) {
  return (
    <ControlledTextarea
      label={label}
      value={values.join("\n")}
      placeholder={"พิมพ์หนึ่งรายการต่อบรรทัด\nเช่น รายการแรก\nรายการถัดไป"}
      rows={4}
      required={required}
      onChange={(value) => onChange(lines(value))}
    />
  );
}

function ControlledField({
  label,
  value,
  onChange,
  hint,
  type = "text",
  required = true,
  ...inputProps
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  type?: string;
  required?: boolean;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
>) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        {...inputProps}
        type={type}
        value={value}
        placeholder={
          inputProps.placeholder ??
          (type === "number" ? "เช่น 1" : "กรอกข้อมูลตามหัวข้อ")
        }
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function ControlledTextarea({
  label,
  value,
  onChange,
  required = true,
  ...textareaProps
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
} & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange"
>) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        {...textareaProps}
        value={value}
        placeholder={textareaProps.placeholder ?? "กรอกรายละเอียดตามหัวข้อ"}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
