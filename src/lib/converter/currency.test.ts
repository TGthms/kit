import { describe, expect, it, vi } from "vitest";
import {
  buildFrankfurterRatesUrl,
  convertCurrency,
  createCachedRateRecords,
  fetchFrankfurterRates,
  findCachedRate,
  isCachedRateStale,
  validateFrankfurterRatesResponse,
} from "./currency";

const rates = [
  { date: "2024-01-02", base: "USD", quote: "EUR", rate: 0.9 },
  { date: "2024-01-02", base: "USD", quote: "JPY", rate: 145 },
];

describe("currency helpers", () => {
  it("builds Frankfurter v2 URLs with normalized query values", () => {
    expect(buildFrankfurterRatesUrl({ base: "usd", symbols: ["eur", "JPY", "eur"], date: "2024-01-02" })).toBe("https://api.frankfurter.dev/v2/rates/2024-01-02?base=USD&quotes=EUR%2CJPY");
    expect(() => buildFrankfurterRatesUrl({ base: "US" })).toThrow(RangeError);
  });

  it("validates and normalizes v2 response records", () => {
    expect(validateFrankfurterRatesResponse(rates, "USD", ["EUR", "JPY"])).toEqual(rates);
    expect(() => validateFrankfurterRatesResponse([{ ...rates[0], rate: 0 }])).toThrow(TypeError);
    expect(() => validateFrankfurterRatesResponse({ rates })).toThrow(TypeError);
    expect(
      validateFrankfurterRatesResponse(
        [...rates, { date: "2024-01-02", base: "USD", quote: "USD", rate: 1 }],
        "USD",
        ["EUR", "JPY"]
      )
    ).toEqual(rates);
  });

  it("creates cached records, detects stale data, and handles inverse rates", () => {
    const cached = createCachedRateRecords(rates, 1_000);
    expect(isCachedRateStale(cached[0], 1_000 + 6 * 60 * 60 * 1000)).toBe(false);
    expect(isCachedRateStale(cached[0], 1_000 + 6 * 60 * 60 * 1000 + 1)).toBe(true);
    expect(findCachedRate(cached, "EUR", "USD")?.inverted).toBe(true);
    expect(convertCurrency(10, "USD", "EUR", cached)).toBe(9);
    expect(convertCurrency(9, "EUR", "USD", cached)).toBe(10);
    expect(convertCurrency(5, "USD", "USD", cached)).toBe(5);
    expect(() => convertCurrency(5, "GBP", "USD", cached)).toThrow(RangeError);
  });

  it("uses an injectable fetch implementation without owning network side effects", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => [rates[0]],
    }) as Response);
    await expect(fetchFrankfurterRates({ base: "USD", symbols: ["EUR"] }, fetchImpl)).resolves.toEqual([rates[0]]);
    expect(fetchImpl).toHaveBeenCalledWith("https://api.frankfurter.dev/v2/rates?base=USD&quotes=EUR");

    const failedFetch = vi.fn(async () => ({ ok: false, status: 503, json: async () => [] }) as Response);
    await expect(fetchFrankfurterRates({ base: "USD" }, failedFetch)).rejects.toThrow("503");
  });
});
