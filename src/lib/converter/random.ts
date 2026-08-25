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
