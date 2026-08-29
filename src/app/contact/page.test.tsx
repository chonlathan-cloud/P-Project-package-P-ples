import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { company } from "@/content/company";
import ContactPage from "./page";

describe("ContactPage", () => {
  it("exposes verified direct-contact actions and one quote path", () => {
    render(<ContactPage />);

    for (const link of screen.getAllByRole("link", {
      name: `เพิ่มเพื่อน LINE OA ${company.lineOaId}`,
    })) {
      expect(link).toHaveAttribute("href", company.lineOaHref);
    }
    expect(
      screen.getByRole("link", { name: new RegExp(company.lineSaleId) }),
    ).toHaveAttribute("href", company.lineSaleHref);
    expect(
      screen.getByRole("link", { name: /DD Box Printing/ }),
    ).toHaveAttribute("href", company.facebookHref);
    expect(
      screen.getByRole("link", { name: `โทร ${company.phoneDisplay}` }),
    ).toHaveAttribute("href", `tel:${company.phoneHref}`);
    expect(
      screen.getByRole("link", { name: "เปิดแบบฟอร์มส่งรายละเอียดงาน" }),
    ).toHaveAttribute("href", "/quote");
    expect(screen.getAllByRole("link", { name: /แบบฟอร์ม/ })).toHaveLength(1);
  });

  it("renders the approved LINE OA QR code", () => {
    render(<ContactPage />);

    const qr = screen.getByRole("img", {
      name: `QR Code สำหรับเพิ่มเพื่อน LINE OA ${company.lineOaId}`,
    });
    expect(qr.getAttribute("src")).toContain("line-oa-qr.webp");
  });

  it("keeps internal provenance and implementation details out of public copy", () => {
    const { container } = render(<ContactPage />);

    expect(container).not.toHaveTextContent("ป้องกันการสร้างรายการซ้ำ");
    expect(container).not.toHaveTextContent("ตรวจสอบจากเว็บไซต์เดิม");
  });

  it("labels the generated hero as a development illustration", () => {
    render(<ContactPage />);

    const hero = screen.getByRole("img", {
      name: "ภาพจำลองมือสองคนกำลังตรวจตัวอย่างกล่อง แบบคลี่ และวัสดุกระดาษร่วมกัน",
    });

    expect(hero.getAttribute("src")).toContain("contact-consultation-v1.webp");
    expect(screen.getByText(/ภาพจำลองสำหรับ development/)).toBeInTheDocument();
  });
});
