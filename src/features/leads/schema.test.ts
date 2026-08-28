import { describe, expect, it } from "vitest";
import { quoteFormSchema, toLeadPayload } from "./schema";

const valid = {
  customer_path: "has_specifications" as const,
  product_type: "กล่องเครื่องสำอาง",
  quantity: "1000",
  dimensions: "20 x 10 x 5 ซม.",
  required_date: "",
  delivery_province: "สมุทรปราการ",
  project_details: "ต้องการประเมินกล่องสำหรับสินค้าใหม่",
  contact_name: "ผู้ติดต่อ",
  company: "",
  phone: "0812345678",
  line_id: "",
  email: "",
  preferred_contact: "phone" as const,
  consent: true as const,
  website: "",
};

describe("quote form contract", () => {
  it("transforms quantity and optional values for the API", () => {
    expect(toLeadPayload(valid)).toMatchObject({
      quantity: 1000,
      company: null,
    });
  });

  it("requires quantity for customers with specifications", () => {
    const result = quoteFormSchema.safeParse({ ...valid, quantity: "" });
    expect(result.success).toBe(false);
  });

  it("requires the selected contact channel", () => {
    const result = quoteFormSchema.safeParse({ ...valid, phone: "" });
    expect(result.success).toBe(false);
  });
});
