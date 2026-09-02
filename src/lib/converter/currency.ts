export type FrankfurterRate = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

export type CachedRateRecord = FrankfurterRate & {
  fetchedAt: number;
};

export type FrankfurterRequest = {
  base: string;
  symbols?: readonly string[];
  date?: string;
  origin?: string;
};

export const FRANKFURTER_DEFAULT_ORIGIN = "https://api.frankfurter.dev";
export const DEFAULT_RATE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

function normalizeCurrency(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) throw new RangeError("Currency codes must be three ASCII letters.");
  return normalized;
}

function validateDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new RangeError("Date must use YYYY-MM-DD format.");
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new RangeError("Date is invalid.");
  return date;
}

export function buildFrankfurterRatesUrl(request: FrankfurterRequest): string {
  const base = normalizeCurrency(request.base);
  const origin = request.origin ?? FRANKFURTER_DEFAULT_ORIGIN;
  const url = new URL(`${origin.replace(/\/$/, "")}/v2/rates${request.date ? `/${validateDate(request.date)}` : ""}`);
  url.searchParams.set("base", base);
  if (request.symbols && request.symbols.length > 0) {
    const symbols = [...new Set(request.symbols.map(normalizeCurrency))].filter((symbol) => symbol !== base);
    if (symbols.length > 0) url.searchParams.set("quotes", symbols.join(","));
  }
  return url.toString();
}

function isRate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

export function validateFrankfurterRatesResponse(payload: unknown, expectedBase?: string, expectedQuotes?: readonly string[]): FrankfurterRate[] {
  if (!Array.isArray(payload)) throw new TypeError("Frankfurter v2 response must be an array of rates.");
  const base = expectedBase ? normalizeCurrency(expectedBase) : undefined;
  const quotes = expectedQuotes ? new Set(expectedQuotes.map(normalizeCurrency)) : undefined;
  const rates = payload.flatMap((item): FrankfurterRate[] => {
    if (!item || typeof item !== "object") throw new TypeError("Invalid Frankfurter rate record.");
    const record = item as Record<string, unknown>;
    const recordBase = typeof record.base === "string" ? normalizeCurrency(record.base) : "";
    const quote = typeof record.quote === "string" ? normalizeCurrency(record.quote) : "";
    if (!isIsoDate(record.date) || !isRate(record.rate) || !recordBase || !quote) throw new TypeError("Invalid Frankfurter rate record.");
    if (base && recordBase !== base) throw new TypeError("Frankfurter response base currency does not match the request.");
    if (recordBase === quote) return [];
    if (quotes && !quotes.has(quote)) throw new TypeError("Frankfurter response contains an unexpected quote currency.");
    return [{ date: record.date, base: recordBase, quote, rate: record.rate }];
  });
  if (rates.length === 0) throw new TypeError("Frankfurter response contains no rates.");
  return rates;
}

export function createCachedRateRecords(rates: readonly FrankfurterRate[], fetchedAt = Date.now()): CachedRateRecord[] {
  if (!Number.isFinite(fetchedAt)) throw new RangeError("fetchedAt must be finite.");
  return validateFrankfurterRatesResponse([...rates]).map((rate) => ({ ...rate, fetchedAt }));
}

export function isCachedRateStale(record: CachedRateRecord, now = Date.now(), maxAgeMs = DEFAULT_RATE_MAX_AGE_MS): boolean {
  if (!Number.isFinite(record.fetchedAt) || !Number.isFinite(now) || !Number.isFinite(maxAgeMs) || maxAgeMs < 0) throw new RangeError("Staleness arguments must be finite and valid.");
  return now < record.fetchedAt || now - record.fetchedAt > maxAgeMs;
}

export function findCachedRate(rates: readonly CachedRateRecord[], base: string, quote: string): { rate: number; inverted: boolean; record: CachedRateRecord } | undefined {
  const source = normalizeCurrency(base);
  const target = normalizeCurrency(quote);
  if (source === target) return undefined;
  const direct = rates.find((record) => record.base === source && record.quote === target);
  if (direct) return { rate: direct.rate, inverted: false, record: direct };
  const inverse = rates.find((record) => record.base === target && record.quote === source);
  return inverse ? { rate: inverse.rate, inverted: true, record: inverse } : undefined;
}

export function convertCurrency(amount: number, from: string, to: string, rates: readonly CachedRateRecord[]): number {
  if (!Number.isFinite(amount)) throw new RangeError("Amount must be finite.");
  const source = normalizeCurrency(from);
  const target = normalizeCurrency(to);
  if (source === target) return amount;
  const match = findCachedRate(rates, source, target);
  if (!match) throw new RangeError(`No cached rate from ${source} to ${target}.`);
  return match.inverted ? amount / match.rate : amount * match.rate;
}

export async function fetchFrankfurterRates(request: FrankfurterRequest, fetchImpl: typeof fetch = fetch): Promise<FrankfurterRate[]> {
  const response = await fetchImpl(buildFrankfurterRatesUrl(request));
  if (!response.ok) throw new Error(`Frankfurter request failed with status ${response.status}.`);
  return validateFrankfurterRatesResponse(await response.json(), request.base, request.symbols && request.symbols.length > 0 ? request.symbols : undefined);
}
