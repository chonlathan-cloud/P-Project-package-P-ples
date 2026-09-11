import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { captureAttributionIfAllowed } from "@/features/analytics/attribution";
import { writePrivacyConsent } from "@/features/analytics/consent";
import { QuoteForm } from "./quote-form";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

type CustomerPath = "has_specifications" | "needs_guidance";

function responseWithReceipt(reference = "DD-44F2F48F6E", duplicate = false) {
  return new Response(
    JSON.stringify({
      reference,
      duplicate,
      next_step: "ทีมงานจะตรวจสอบข้อมูลและติดต่อกลับผ่านช่องทางที่เลือก",
    }),
    { status: 201, headers: { "Content-Type": "application/json" } },
  );
}

function advanceToContact(path: CustomerPath, quantity = "") {
  const rendered = render(<QuoteForm initialPath={path} />);
  fireEvent.click(screen.getByRole("button", { name: "ไปกรอกรายละเอียดงาน" }));
  fireEvent.change(screen.getByLabelText(/ประเภทสินค้า/), {
    target: { value: "กล่องออฟเซ็ท" },
  });
  if (path === "has_specifications") {
    fireEvent.change(screen.getByLabelText(/จำนวนโดยประมาณ/), {
      target: { value: quantity },
    });
  }
  fireEvent.change(screen.getByLabelText(/รายละเอียดและข้อจำกัด/), {
    target: { value: "ต้องการกล่องสำหรับสินค้าใหม่จำนวนหนึ่ง" },
  });
  fireEvent.click(screen.getByRole("button", { name: "ไปเลือกช่องทางติดต่อ" }));
  return rendered.container.querySelector("form")!;
}

function completeValidForm(path: CustomerPath, quantity = "") {
  const form = advanceToContact(path, quantity);
  fireEvent.change(screen.getByLabelText(/ชื่อผู้ติดต่อ/), {
    target: { value: "คุณทดสอบ" },
  });
  fireEvent.change(screen.getByLabelText(/เบอร์โทรศัพท์/), {
    target: { value: "0812345678" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  return form;
}

function quoteSubmitEvents() {
  return (window.dataLayer ?? []).filter(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "event" in item &&
      (item as { event?: unknown }).event === "quote_submit",
  );
}

describe("QuoteForm", () => {
  beforeEach(() => {
    navigation.push.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    window.localStorage.clear();
    window.dataLayer = [];
    window.history.replaceState({}, "", "/quote");
  });

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

  it("links consent to the published privacy notice before submission", () => {
    render(<QuoteForm initialPath="needs_guidance" />);

    fireEvent.click(
      screen.getByRole("button", { name: "ไปกรอกรายละเอียดงาน" }),
    );
    fireEvent.change(screen.getByLabelText(/ประเภทสินค้า/), {
      target: { value: "กล่องออฟเซ็ท" },
    });
    fireEvent.change(screen.getByLabelText(/รายละเอียดและข้อจำกัด/), {
      target: { value: "ต้องการกล่องสำหรับสินค้าใหม่" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "ไปเลือกช่องทางติดต่อ" }),
    );

    expect(
      screen.getByRole("link", { name: /อ่านประกาศความเป็นส่วนตัว/ }),
    ).toHaveAttribute("href", "/privacy");
  });

  it.each(["unset", "necessary"] as const)(
    "saves the lead without measurement when consent is %s",
    async (consentMode) => {
      if (consentMode === "necessary") {
        writePrivacyConsent("necessary", "2026-09-09T08:00:00.000Z");
      }
      window.dataLayer = [];
      fetchMock.mockResolvedValueOnce(responseWithReceipt());
      completeValidForm("needs_guidance");

      fireEvent.click(
        screen.getByRole("button", { name: "ส่งข้อมูลเพื่อให้ทีมประเมิน" }),
      );

      await waitFor(() =>
        expect(navigation.push).toHaveBeenCalledWith(
          "/thank-you?reference=DD-44F2F48F6E",
        ),
      );
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(
        JSON.parse(fetchMock.mock.calls[0][1].body as string),
      ).toMatchObject({
        measurement_consent: {
          mode: consentMode,
          version: consentMode === "unset" ? null : 1,
          updated_at:
            consentMode === "unset" ? null : "2026-09-09T08:00:00.000Z",
        },
        attribution: null,
      });
      expect(quoteSubmitEvents()).toEqual([]);
    },
  );

  it("submits a consented attribution snapshot without raw query in page fields", async () => {
    window.history.replaceState(
      {},
      "",
      "/quote?utm_source=google&utm_medium=cpc&utm_campaign=qa_attribution&gclid=TEST-GCLID",
    );
    writePrivacyConsent("all", "2026-09-10T08:05:00.000Z");
    captureAttributionIfAllowed(
      window.location.href,
      new Date("2026-09-10T08:06:00.000Z"),
    );
    fetchMock.mockResolvedValueOnce(responseWithReceipt());
    completeValidForm("needs_guidance");

    fireEvent.click(
      screen.getByRole("button", { name: "ส่งข้อมูลเพื่อให้ทีมประเมิน" }),
    );

    await waitFor(() => expect(navigation.push).toHaveBeenCalledOnce());
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(payload).toMatchObject({
      landing_page: `${window.location.origin}/quote`,
      submission_path: "/quote",
      measurement_consent: {
        mode: "all",
        version: 1,
        updated_at: "2026-09-10T08:05:00.000Z",
      },
      attribution: {
        schema_version: 1,
        model: "first_last_tagged",
        first_touch: {
          utm_campaign: "qa_attribution",
          gclid: "TEST-GCLID",
          landing_path: "/quote",
        },
        last_touch: {
          utm_campaign: "qa_attribution",
          gclid: "TEST-GCLID",
          landing_path: "/quote",
        },
      },
    });
    expect(payload.landing_page).not.toContain("?");
    expect(payload.submission_path).not.toContain("?");
  });

  it.each([
    {
      path: "has_specifications" as const,
      quantity: "500",
      quantityBand: "500_1000",
    },
    {
      path: "needs_guidance" as const,
      quantity: "",
      quantityBand: "unknown",
    },
  ])(
    "emits one allowlisted quote_submit for $path",
    async ({ path, quantity, quantityBand }) => {
      writePrivacyConsent("all", "2026-09-09T08:05:00.000Z");
      window.dataLayer = [];
      fetchMock.mockResolvedValueOnce(responseWithReceipt());
      completeValidForm(path, quantity);
      window.dataLayer = [];

      fireEvent.click(
        screen.getByRole("button", { name: "ส่งข้อมูลเพื่อให้ทีมประเมิน" }),
      );

      await waitFor(() => expect(navigation.push).toHaveBeenCalledOnce());
      expect(quoteSubmitEvents()).toEqual([
        {
          event: "quote_submit",
          customer_path: path,
          quantity_band: quantityBand,
        },
      ]);
      expect(JSON.stringify(quoteSubmitEvents())).not.toMatch(
        /คุณทดสอบ|0812345678|DD-44F2F48F6E|project_details|line\.me/,
      );
    },
  );

  it("clears a stale quantity when the customer switches to guidance", async () => {
    writePrivacyConsent("all", "2026-09-09T08:05:00.000Z");
    fetchMock.mockResolvedValueOnce(responseWithReceipt());
    const rendered = render(<QuoteForm initialPath="has_specifications" />);
    fireEvent.click(
      screen.getByRole("button", { name: "ไปกรอกรายละเอียดงาน" }),
    );
    fireEvent.change(screen.getByLabelText(/ประเภทสินค้า/), {
      target: { value: "กล่องออฟเซ็ท" },
    });
    fireEvent.change(screen.getByLabelText(/จำนวนโดยประมาณ/), {
      target: { value: "2500" },
    });
    fireEvent.change(screen.getByLabelText(/รายละเอียดและข้อจำกัด/), {
      target: { value: "ต้องการกล่องสำหรับสินค้าใหม่จำนวนหนึ่ง" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ย้อนกลับ" }));
    fireEvent.click(
      screen.getByRole("radio", { name: /มีสินค้าแต่ยังไม่มีแบบ/ }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "ไปกรอกรายละเอียดงาน" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "ไปเลือกช่องทางติดต่อ" }),
    );
    fireEvent.change(screen.getByLabelText(/ชื่อผู้ติดต่อ/), {
      target: { value: "คุณทดสอบ" },
    });
    fireEvent.change(screen.getByLabelText(/เบอร์โทรศัพท์/), {
      target: { value: "0812345678" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    window.dataLayer = [];

    fireEvent.submit(rendered.container.querySelector("form")!);

    await waitFor(() => expect(navigation.push).toHaveBeenCalledOnce());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject(
      {
        customer_path: "needs_guidance",
        quantity: null,
      },
    );
    expect(quoteSubmitEvents()).toEqual([
      {
        event: "quote_submit",
        customer_path: "needs_guidance",
        quantity_band: "unknown",
      },
    ]);
  });

  it("does not submit or measure an invalid form", () => {
    writePrivacyConsent("all", "2026-09-09T08:05:00.000Z");
    const form = advanceToContact("needs_guidance");
    window.dataLayer = [];

    fireEvent.submit(form);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(quoteSubmitEvents()).toEqual([]);
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("does not measure a failed API response", async () => {
    writePrivacyConsent("all", "2026-09-09T08:05:00.000Z");
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ request_id: "request-test-123" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }),
    );
    completeValidForm("needs_guidance");
    window.dataLayer = [];

    fireEvent.click(
      screen.getByRole("button", { name: "ส่งข้อมูลเพื่อให้ทีมประเมิน" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "request-test-123",
    );
    expect(quoteSubmitEvents()).toEqual([]);
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("uses the safe thank-you fallback for a malformed success receipt", async () => {
    writePrivacyConsent("all", "2026-09-09T08:05:00.000Z");
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ reference: "invalid", duplicate: false }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    completeValidForm("needs_guidance");
    window.dataLayer = [];

    fireEvent.click(
      screen.getByRole("button", { name: "ส่งข้อมูลเพื่อให้ทีมประเมิน" }),
    );

    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith("/thank-you"),
    );
    expect(quoteSubmitEvents()).toEqual([]);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("guards an in-flight and completed submission from duplicate requests or events", async () => {
    writePrivacyConsent("all", "2026-09-09T08:05:00.000Z");
    let resolveRequest!: (response: Response) => void;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const form = completeValidForm("has_specifications", "1000");
    window.dataLayer = [];

    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(fetchMock).toHaveBeenCalledOnce();

    await act(async () => {
      resolveRequest(responseWithReceipt());
      await Promise.resolve();
    });
    await waitFor(() => expect(navigation.push).toHaveBeenCalledOnce());
    fireEvent.submit(form);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(quoteSubmitEvents()).toHaveLength(1);
  });

  it("continues to thank-you when dataLayer.push throws", async () => {
    writePrivacyConsent("all", "2026-09-09T08:05:00.000Z");
    fetchMock.mockResolvedValueOnce(responseWithReceipt());
    completeValidForm("needs_guidance");
    window.dataLayer = [];
    vi.spyOn(window.dataLayer, "push").mockImplementation(() => {
      throw new Error("blocked by browser");
    });

    fireEvent.click(
      screen.getByRole("button", { name: "ส่งข้อมูลเพื่อให้ทีมประเมิน" }),
    );

    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith(
        "/thank-you?reference=DD-44F2F48F6E",
      ),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("checks the latest consent when the API responds and never queues the event", async () => {
    writePrivacyConsent("all", "2026-09-09T08:05:00.000Z");
    let resolveRequest!: (response: Response) => void;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      }),
    );
    completeValidForm("needs_guidance");
    window.dataLayer = [];

    fireEvent.click(
      screen.getByRole("button", { name: "ส่งข้อมูลเพื่อให้ทีมประเมิน" }),
    );
    writePrivacyConsent("necessary", "2026-09-09T08:06:00.000Z");
    await act(async () => {
      resolveRequest(responseWithReceipt());
      await Promise.resolve();
    });

    await waitFor(() => expect(navigation.push).toHaveBeenCalledOnce());
    expect(quoteSubmitEvents()).toEqual([]);

    writePrivacyConsent("all", "2026-09-09T08:07:00.000Z");
    expect(quoteSubmitEvents()).toEqual([]);
  });
});
