import { z } from "zod";

export const quoteFormSchema = z
  .object({
    customer_path: z.enum(["has_specifications", "needs_guidance"]),
    product_type: z.string().trim().min(2, "กรุณาระบุประเภทสินค้า").max(120),
    quantity: z.string().trim(),
    dimensions: z.string().trim().max(200),
    required_date: z.string().trim().max(80),
    delivery_province: z.string().trim().max(120),
    project_details: z
      .string()
      .trim()
      .min(10, "กรุณาอธิบายงานอย่างน้อย 10 ตัวอักษร")
      .max(3000),
    contact_name: z.string().trim().min(2, "กรุณาระบุชื่อผู้ติดต่อ").max(160),
    company: z.string().trim().max(160),
    phone: z.string().trim().max(30),
    line_id: z.string().trim().max(100),
    email: z.union([z.literal(""), z.email("รูปแบบอีเมลไม่ถูกต้อง")]),
    preferred_contact: z.enum(["phone", "line", "email"]),
    consent: z.literal(true, "ต้องยอมรับการใช้ข้อมูลเพื่อให้ทีมติดต่อกลับ"),
    website: z.string().max(0),
  })
  .superRefine((value, context) => {
    if (value.customer_path === "has_specifications" && !value.quantity) {
      context.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "กรุณาระบุจำนวนโดยประมาณ",
      });
    }
    const contact = {
      phone: value.phone,
      line: value.line_id,
      email: value.email,
    }[value.preferred_contact];
    if (!contact) {
      context.addIssue({
        code: "custom",
        path: [
          value.preferred_contact === "line"
            ? "line_id"
            : value.preferred_contact,
        ],
        message: "กรุณากรอกช่องทางติดต่อที่เลือก",
      });
    }
  });

export type QuoteFormValues = Omit<
  z.input<typeof quoteFormSchema>,
  "consent"
> & {
  consent: boolean;
};

export function toLeadPayload(values: QuoteFormValues) {
  const parsed = quoteFormSchema.parse(values);
  return {
    ...parsed,
    quantity: parsed.quantity ? Number.parseInt(parsed.quantity, 10) : null,
    dimensions: parsed.dimensions || null,
    required_date: parsed.required_date || null,
    delivery_province: parsed.delivery_province || null,
    company: parsed.company || null,
    phone: parsed.phone || null,
    line_id: parsed.line_id || null,
    email: parsed.email || null,
    landing_page: typeof window === "undefined" ? null : window.location.href,
  };
}
