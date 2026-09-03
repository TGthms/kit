export type LoanPaymentInput = {
  principal: number;
  annualRatePercent: number;
  years: number;
};

export type CompoundInput = {
  principal: number;
  annualRatePercent: number;
  years: number;
  compoundsPerYear?: number;
};

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be a finite number.`);
}

function assertNonNegative(value: number, name: string): void {
  assertFinite(value, name);
  if (value < 0) throw new RangeError(`${name} must be non-negative.`);
}

function assertPositive(value: number, name: string): void {
  assertFinite(value, name);
  if (value <= 0) throw new RangeError(`${name} must be positive.`);
}

/** Standard amortization monthly payment (PMT). Zero annual rate → principal / (years * 12). */
export function monthlyPayment({ principal, annualRatePercent, years }: LoanPaymentInput): number {
  assertNonNegative(principal, "principal");
  assertNonNegative(annualRatePercent, "annualRatePercent");
  assertPositive(years, "years");
  const months = years * 12;
  if (annualRatePercent === 0) return principal / months;
  const monthlyRate = annualRatePercent / 100 / 12;
  const factor = (1 + monthlyRate) ** months;
  return (principal * monthlyRate * factor) / (factor - 1);
}

/** Total amount paid over the loan term. */
export function amortizationTotal(payment: number, years: number): number {
  assertNonNegative(payment, "payment");
  assertPositive(years, "years");
  return payment * years * 12;
}

/** Compound interest future value. */
export function compoundAmount({ principal, annualRatePercent, years, compoundsPerYear = 12 }: CompoundInput): number {
  assertNonNegative(principal, "principal");
  assertNonNegative(annualRatePercent, "annualRatePercent");
  assertNonNegative(years, "years");
  assertPositive(compoundsPerYear, "compoundsPerYear");
  const rate = annualRatePercent / 100;
  return principal * (1 + rate / compoundsPerYear) ** (compoundsPerYear * years);
}
