import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuoteForm } from "./quote-form";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

describe("QuoteForm", () => {
  it("discloses all three steps and uses outcome-based actions", () => {
    render(<QuoteForm initialPath="needs_guidance" />);

    const progress = screen.getByRole("list", {
      name: "ขั้นตอนขอใบเสนอราคา",
    });
    expect(progress).toHaveTextContent("เลือกจุดเริ่ม");
    expect(progress).toHaveTextContent("รายละเอียดงาน");
    expect(progress).toHaveTextContent("ติดต่อกลับ");
    expect(
      screen.getByRole("button", { name: "ไปกรอกรายละเอียดงาน" }),
    ).toBeInTheDocument();
  });

  it("shows guidance for the selected customer path and preserves deep-link context", () => {
    render(
      <QuoteForm
        initialPath="has_specifications"
        initialProductType="กล่องไดคัทลูกฟูก"
        reference="ตัวอย่างกล่องพร้อมชิ้นรอง"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "ไปกรอกรายละเอียดงาน" }),
    );

    expect(
      screen.getByText("ส่งจำนวน ขนาด วัสดุ หรือข้อกำหนดเท่าที่มี"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/ประเภทสินค้า/)).toHaveValue(
      "กล่องไดคัทลูกฟูก",
    );
    expect(screen.getByLabelText(/รายละเอียดและข้อจำกัด/)).toHaveValue(
      "สนใจประเมินงานโดยอ้างอิงจาก: ตัวอย่างกล่องพร้อมชิ้นรอง",
    );
    expect(
      screen.getByRole("button", { name: "ไปเลือกช่องทางติดต่อ" }),
    ).toBeInTheDocument();
  });

  it("switches to the guidance path without exposing quantity as required", () => {
    render(<QuoteForm initialPath="has_specifications" />);

    fireEvent.click(
      screen.getByRole("radio", {
        name: /มีสินค้าแต่ยังไม่มีแบบ/,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "ไปกรอกรายละเอียดงาน" }),
    );

    expect(
      screen.getByText(
        "เริ่มจากประเภทสินค้า ขนาด น้ำหนัก และลักษณะการใช้งานเท่าที่ทราบ",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/จำนวนโดยประมาณ/)).not.toBeInTheDocument();
  });
});
