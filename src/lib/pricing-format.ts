import type { PricingBenchmark } from "@/features/gallery/types";

export function formatBaht(satang: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: satang % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(satang / 100);
}

export function formatStartingPrice(price: PricingBenchmark): string {
  const maximum = price.starting_price_max_satang;
  return maximum && maximum !== price.starting_price_min_satang
    ? `${formatBaht(price.starting_price_min_satang)}–${formatBaht(maximum)} บาท/${price.unit}`
    : `${formatBaht(price.starting_price_min_satang)} บาท/${price.unit}`;
}

export function formatBenchmarkRange(price: PricingBenchmark): string {
  const maximum = price.benchmark_max_satang;
  const suffix = price.benchmark_open_ended ? "+" : "";
  return maximum
    ? `${formatBaht(price.benchmark_min_satang)}–${formatBaht(maximum)}${suffix} บาท/${price.unit}`
    : `เริ่ม ${formatBaht(price.benchmark_min_satang)} บาท/${price.unit}`;
}
