import { describe, expect, it } from "vitest";
import type { PricingBenchmark } from "@/features/gallery/types";
import { formatBenchmarkRange, formatStartingPrice } from "./pricing-format";

const price: PricingBenchmark = {
  id: "sticker-label",
  label: "สติ๊กเกอร์และฉลากสินค้า",
  category: "สติ๊กเกอร์และฉลากสินค้า",
  starting_price_min_satang: 50,
  starting_price_max_satang: null,
  benchmark_min_satang: 50,
  benchmark_max_satang: 500,
  benchmark_open_ended: false,
  unit: "ชิ้น",
  quantity_basis: "ประมาณ 1,000 ดวง",
  material: "สติ๊กเกอร์กระดาษ / PP ขาว / PP ใส",
  disclaimer: "ราคาเป็นข้อมูลประมาณการเบื้องต้น",
  status: "published",
  version: 1,
};

describe("pricing format", () => {
  it("keeps sub-baht product prices visible", () => {
    expect(formatStartingPrice(price)).toBe("0.50 บาท/ชิ้น");
    expect(formatBenchmarkRange(price)).toBe("0.50–5 บาท/ชิ้น");
  });

  it("marks open-ended benchmarks", () => {
    expect(
      formatBenchmarkRange({
        ...price,
        benchmark_max_satang: 1000,
        benchmark_open_ended: true,
      }),
    ).toBe("0.50–10+ บาท/ชิ้น");
  });
});
