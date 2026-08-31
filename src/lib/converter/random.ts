export type RandomSource = () => number;

export type RandomDecimalOptions = {
  precision?: number;
  rng?: RandomSource;
};

export type PasswordOptions = {
  length?: number;
  alphabet?: string;
  rng?: RandomSource;
};

export type PassphraseOptions = {
  count?: number;
  separator?: string;
  unique?: boolean;
  rng?: RandomSource;
};

function nextRandom(rng: RandomSource): number {
  const value = rng();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("Random source must return a number in [0, 1).");
  return value;
}

function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || !Number.isFinite(value)) throw new RangeError(`${name} must be an integer.`);
}

export function randomInteger(min: number, max: number, rng: RandomSource = Math.random): number {
  assertInteger(min, "min");
  assertInteger(max, "max");
  if (min > max) throw new RangeError("min must not exceed max.");
  return min + Math.floor(nextRandom(rng) * (max - min + 1));
}

export const MAX_RANDOM_BATCH = 200;

export function cryptoRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! / 2 ** 32;
}

export type RandomIntegerBatchOptions = {
  count?: number;
  unique?: boolean;
  step?: number;
  rng?: RandomSource;
};

/** Inclusive integer range, optional step, up to MAX_RANDOM_BATCH values. */
export function randomIntegers(min: number, max: number, options: RandomIntegerBatchOptions = {}): number[] {
  const count = options.count ?? 1;
  const step = options.step ?? 1;
  const rng = options.rng ?? Math.random;
  assertInteger(count, "count");
  assertInteger(step, "step");
  if (count < 1 || count > MAX_RANDOM_BATCH) throw new RangeError(`count must be between 1 and ${MAX_RANDOM_BATCH}.`);
  if (step < 1) throw new RangeError("step must be a positive integer.");
  assertInteger(min, "min");
  assertInteger(max, "max");
  if (min > max) throw new RangeError("min must not exceed max.");
  const span = Math.floor((max - min) / step) + 1;
  if (span < 1) throw new RangeError("step is larger than the range.");
  const pick = () => min + step * randomInteger(0, span - 1, rng);
  if (!options.unique) return Array.from({ length: count }, pick);
  if (count > span) throw new RangeError("count exceeds the number of unique values in the range.");
  if (span <= 4096) {
    const domain = Array.from({ length: span }, (_, i) => min + i * step);
    return randomUnique(domain, count, rng);
  }
  const seen = new Set<number>();
  while (seen.size < count) seen.add(pick());
  return [...seen];
}

export function randomDecimals(min: number, max: number, options: RandomDecimalOptions & { count?: number } = {}): number[] {
  const count = options.count ?? 1;
  assertInteger(count, "count");
  if (count < 1 || count > MAX_RANDOM_BATCH) throw new RangeError(`count must be between 1 and ${MAX_RANDOM_BATCH}.`);
  const { count: ignoredCount, ...rest } = options;
  void ignoredCount;
  return Array.from({ length: count }, () => randomDecimal(min, max, rest));
}

export function randomDecimal(min: number, max: number, options: RandomDecimalOptions = {}): number {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) throw new RangeError("Decimal bounds must be finite and ordered.");
  if (min === max) return min;
  const rng = options.rng ?? Math.random;
  const random = nextRandom(rng);
  if (options.precision === undefined) return min + random * (max - min);
  assertInteger(options.precision, "precision");
  if (options.precision < 0 || options.precision > 15) throw new RangeError("precision must be between 0 and 15.");
  const factor = 10 ** options.precision;
  const lower = Math.ceil(min * factor - Number.EPSILON);
  const upper = Math.ceil(max * factor - Number.EPSILON) - 1;
  if (upper < lower) return min;
  return (lower + Math.floor(random * (upper - lower + 1))) / factor;
}

export function randomBoolean(rng: RandomSource = Math.random): boolean {
  return nextRandom(rng) < 0.5;
}

export function randomPick<T>(items: readonly T[], rng: RandomSource = Math.random): T {
  if (items.length === 0) throw new RangeError("Cannot pick from an empty collection.");
  return items[randomInteger(0, items.length - 1, rng)];
}

export function randomUnique<T>(items: readonly T[], count: number, rng: RandomSource = Math.random): T[] {
  assertInteger(count, "count");
  if (count < 0) throw new RangeError("count must be non-negative.");
  const unique = [...new Set(items)];
  if (count > unique.length) throw new RangeError("count exceeds the number of unique values.");
  const result = [...unique];
  for (let index = result.length - 1; index > result.length - 1 - count; index -= 1) {
    const swapIndex = randomInteger(0, index, rng);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result.slice(result.length - count);
}

export const DEFAULT_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";

export const RANDOM_HISTORY_SUMMARY_MAX = 96;
export type RecordableRandomMode = "integer" | "decimal" | "boolean" | "pick";

/** Compact history line for non-password rolls. Passwords are never included. */
export function randomResultSummary(mode: RecordableRandomMode, values: readonly string[]): string {
  const compact = values.map((value) => value.trim().replace(/\s+/gu, " ")).filter(Boolean);
  if (!compact.length) return `${mode} × 0`;
  const label = compact.length === 1 ? `${mode}: ` : `${mode} × ${compact.length}: `;
  const body = compact.join(", ");
  const full = `${label}${body}`;
  if (full.length <= RANDOM_HISTORY_SUMMARY_MAX) return full;
  const room = RANDOM_HISTORY_SUMMARY_MAX - label.length - 1;
  if (room < 1) return `${mode} × ${compact.length}`.slice(0, RANDOM_HISTORY_SUMMARY_MAX);
  return `${label}${body.slice(0, room)}…`;
}

export function randomPassword(options: PasswordOptions = {}): string {
  const length = options.length ?? 16;
  assertInteger(length, "length");
  if (length < 1) throw new RangeError("Password length must be positive.");
  const alphabet = options.alphabet ?? DEFAULT_PASSWORD_ALPHABET;
  if (alphabet.length === 0) throw new RangeError("Password alphabet must not be empty.");
  const rng = options.rng ?? Math.random;
  return Array.from({ length }, () => randomPick(Array.from(alphabet), rng)).join("");
}

export function randomPassphrase(words: readonly string[], options: PassphraseOptions = {}): string {
  const count = options.count ?? 4;
  assertInteger(count, "count");
  if (count < 1) throw new RangeError("Passphrase count must be positive.");
  const separator = options.separator ?? "-";
  const selected = options.unique ? randomUnique(words, count, options.rng ?? Math.random) : Array.from({ length: count }, () => randomPick(words, options.rng ?? Math.random));
  return selected.join(separator);
}
