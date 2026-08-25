export type TipOptions = {
  subtotal: number;
  tipPercent: number;
  taxPercent?: number;
  people?: number;
  roundTo?: number | null;
  splitRemainder?: boolean;
};

export type TipResult = {
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  perPerson: number;
  shares: number[];
};

function assertNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be non-negative and finite.`);
}

export function roundMoney(value: number, decimals = 2): number {
  if (!Number.isFinite(value) || !Number.isInteger(decimals) || decimals < 0 || decimals > 8) throw new RangeError("Money value and decimals must be valid.");
  const factor = 10 ** decimals;
  return Math.floor(value * factor + 0.5) / factor;
}

export function calculateTip(options: TipOptions): TipResult {
  const { subtotal, tipPercent, taxPercent = 0, people = 1, roundTo = 2, splitRemainder = true } = options;
  assertNonNegative(subtotal, "subtotal");
  assertNonNegative(tipPercent, "tipPercent");
  assertNonNegative(taxPercent, "taxPercent");
  if (!Number.isInteger(people) || people < 1) throw new RangeError("people must be a positive integer.");
  if (roundTo !== null && (!Number.isInteger(roundTo) || roundTo < 0 || roundTo > 8)) throw new RangeError("roundTo must be null or an integer from 0 to 8.");
  const round = (value: number) => roundTo === null ? value : roundMoney(value, roundTo);
  const tax = round(subtotal * taxPercent / 100);
  const tip = round(subtotal * tipPercent / 100);
  const roundedSubtotal = round(subtotal);
  const total = round(roundedSubtotal + tax + tip);
  const equalShare = round(total / people);
  const shares = new Array<number>(people).fill(equalShare);
  if (roundTo !== null && splitRemainder) {
    const factor = 10 ** roundTo;
    let remaining = Math.round(total * factor);
    const base = Math.floor(remaining / people);
    remaining -= base * people;
    for (let index = 0; index < people; index += 1) shares[index] = (base + (index < remaining ? 1 : 0)) / factor;
  }
  return { subtotal: roundedSubtotal, tax, tip, total, perPerson: equalShare, shares };
}
