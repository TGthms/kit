export type UnitCategory =
  | "length"
  | "mass"
  | "temperature"
  | "speed"
  | "duration"
  | "volume"
  | "power"
  | "energy"
  | "pressure"
  | "area"
  | "data"
  | "angle"
  | "frequency"
  | "force"
  | "fuelEconomy"
  | "acceleration"
  | "torque"
  | "electrical"
  | "typography";

const SUPER_DIGITS: Record<string, string> = { "2": "²", "3": "³", "4": "⁴" };

/** Display `m2` as `m²`, `m/s2` as `m/s²`. Currency-style codes are unchanged. */
export function formatUnitSymbol(code: string): string {
  return code.replace(/(\d+)$/u, (digit) => SUPER_DIGITS[digit] ?? digit);
}

/** Compact number for a live converter field. Keeps enough digits to round-trip a swap. */
export function formatConvertedInput(value: number): string {
  if (!Number.isFinite(value)) return "";
  return String(Number(value.toPrecision(12)));
}

export type UnitCode =
  | "mm" | "cm" | "m" | "km" | "in" | "ft" | "yd" | "mi" | "nmi"
  | "mg" | "g" | "kg" | "t" | "oz" | "lb" | "stone"
  | "C" | "F" | "K"
  | "m/s" | "km/h" | "mph" | "knot"
  | "ms" | "s" | "min" | "h" | "day" | "week"
  | "mL" | "L" | "m3" | "us-tsp" | "us-tbsp" | "us-fl-oz" | "us-cup" | "us-pt" | "us-qt" | "us-gal" | "imp-gal"
  | "W" | "kW" | "MW" | "GW" | "hp"
  | "J" | "kJ" | "MJ" | "Wh" | "kWh" | "cal" | "kcal" | "eV"
  | "Pa" | "kPa" | "MPa" | "bar" | "psi" | "atm" | "mmHg"
  | "mm2" | "cm2" | "m2" | "km2" | "in2" | "ft2" | "yd2" | "acre" | "hectare"
  | "bit" | "B" | "kB" | "MB" | "GB" | "TB" | "PB" | "KiB" | "MiB" | "GiB" | "TiB" | "PiB"
  | "deg" | "rad" | "grad" | "arcmin" | "arcsec" | "turn"
  | "Hz" | "kHz" | "MHz" | "GHz" | "rpm"
  | "N" | "kN" | "lbf" | "kgf"
  | "L/100km" | "km/L" | "mpg-us" | "mpg-imperial"
  | "m/s2" | "g0" | "ft/s2"
  | "Nm" | "kNm" | "lb-ft" | "lb-in"
  | "mV" | "V" | "kV" | "mA" | "A" | "kA" | "mOhm" | "Ohm" | "kOhm" | "MOhm"
  | "px" | "pt" | "pc" | "rem" | "em";

export type TypographyOptions = {
  rootFontSizePx?: number;
  parentFontSizePx?: number;
  dpi?: number;
};

export const CONVERSION_ASSUMPTIONS = {
  length: "International inch, foot, yard, statute mile, and nautical mile.",
  volume: "US customary liquid measures; imperial gallon is 4.54609 L.",
  power: "hp means mechanical horsepower (745.699872 W).",
  energy: "cal means thermochemical calorie (4.184 J); eV is exact elementary-charge energy.",
  pressure: "mmHg uses the conventional 133.322387415 Pa value.",
  data: "Decimal prefixes use powers of 1000; binary prefixes use powers of 1024; bit is 1/8 byte.",
  fuelEconomy: "mpg-us and mpg-imperial use US and imperial gallons respectively.",
  typography: "CSS px is based on 96 dpi; rem defaults to 16 px and em defaults to 16 px.",
} as const;

type FactorTable = Record<string, number>;

const FACTORS: Record<Exclude<UnitCategory, "temperature" | "fuelEconomy" | "electrical" | "typography">, FactorTable> = {
  length: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, nmi: 1852 },
  mass: { mg: 0.000001, g: 0.001, kg: 1, t: 1000, oz: 0.028349523125, lb: 0.45359237, stone: 6.35029318 },
  speed: { "m/s": 1, "km/h": 1 / 3.6, mph: 0.44704, knot: 0.5144444444444445 },
  duration: { ms: 0.001, s: 1, min: 60, h: 3600, day: 86400, week: 604800 },
  volume: { mL: 0.001, L: 1, m3: 1000, "us-tsp": 0.00492892159375, "us-tbsp": 0.01478676478125, "us-fl-oz": 0.0295735295625, "us-cup": 0.2365882365, "us-pt": 0.473176473, "us-qt": 0.946352946, "us-gal": 3.785411784, "imp-gal": 4.54609 },
  power: { W: 1, kW: 1000, MW: 1000000, GW: 1000000000, hp: 745.699872 },
  energy: { J: 1, kJ: 1000, MJ: 1000000, Wh: 3600, kWh: 3600000, cal: 4.184, kcal: 4184, eV: 1.602176634e-19 },
  pressure: { Pa: 1, kPa: 1000, MPa: 1000000, bar: 100000, psi: 6894.757293168, atm: 101325, mmHg: 133.322387415 },
  area: { mm2: 0.000001, cm2: 0.0001, m2: 1, km2: 1000000, in2: 0.00064516, ft2: 0.09290304, yd2: 0.83612736, acre: 4046.8564224, hectare: 10000 },
  data: { bit: 1 / 8, B: 1, kB: 1000, MB: 1000000, GB: 1000000000, TB: 1000000000000, PB: 1000000000000000, KiB: 1024, MiB: 1048576, GiB: 1073741824, TiB: 1099511627776, PiB: 1125899906842624 },
  angle: { deg: 1, rad: 180 / Math.PI, grad: 0.9, arcmin: 1 / 60, arcsec: 1 / 3600, turn: 360 },
  frequency: { Hz: 1, kHz: 1000, MHz: 1000000, GHz: 1000000000, rpm: 1 / 60 },
  force: { N: 1, kN: 1000, lbf: 4.4482216152605, kgf: 9.80665 },
  acceleration: { "m/s2": 1, g0: 9.80665, "ft/s2": 0.3048 },
  torque: { Nm: 1, kNm: 1000, "lb-ft": 1.3558179483314004, "lb-in": 0.1129848290276167 },
};

export type ElectricalDimension = "voltage" | "current" | "resistance";

const ELECTRICAL_FACTORS: Record<string, { dimension: ElectricalDimension; factor: number }> = {
  mV: { dimension: "voltage", factor: 0.001 }, V: { dimension: "voltage", factor: 1 }, kV: { dimension: "voltage", factor: 1000 },
  mA: { dimension: "current", factor: 0.001 }, A: { dimension: "current", factor: 1 }, kA: { dimension: "current", factor: 1000 },
  mOhm: { dimension: "resistance", factor: 0.001 }, Ohm: { dimension: "resistance", factor: 1 }, kOhm: { dimension: "resistance", factor: 1000 }, MOhm: { dimension: "resistance", factor: 1000000 },
};

function assertFinite(value: number): void {
  if (!Number.isFinite(value)) throw new RangeError("Value must be finite.");
}

function linearConvert(value: number, from: string, to: string, factors: FactorTable): number {
  assertFinite(value);
  if (!(from in factors) || !(to in factors)) throw new RangeError("Unsupported unit for category.");
  return (value * factors[from]) / factors[to];
}

function temperatureToCelsius(value: number, unit: string): number {
  assertFinite(value);
  if (unit === "C") return value;
  if (unit === "F") return (value - 32) * (5 / 9);
  if (unit === "K") return value - 273.15;
  throw new RangeError("Unsupported temperature unit.");
}

function celsiusToTemperature(value: number, unit: string): number {
  if (unit === "C") return value;
  if (unit === "F") return value * (9 / 5) + 32;
  if (unit === "K") return value + 273.15;
  throw new RangeError("Unsupported temperature unit.");
}

function fuelEconomyToKmPerLitre(value: number, unit: string): number {
  assertFinite(value);
  if (value <= 0) throw new RangeError("Fuel economy must be greater than zero.");
  if (unit === "km/L") return value;
  if (unit === "L/100km") return 100 / value;
  if (unit === "mpg-us") return value * 0.4251437075;
  if (unit === "mpg-imperial") return value * 0.3540061899;
  throw new RangeError("Unsupported fuel economy unit.");
}

function kmPerLitreToFuelEconomy(value: number, unit: string): number {
  if (unit === "km/L") return value;
  if (unit === "L/100km") return 100 / value;
  if (unit === "mpg-us") return value / 0.4251437075;
  if (unit === "mpg-imperial") return value / 0.3540061899;
  throw new RangeError("Unsupported fuel economy unit.");
}

function typographyToPx(value: number, unit: string, options: TypographyOptions): number {
  assertFinite(value);
  const dpi = options.dpi ?? 96;
  const root = options.rootFontSizePx ?? 16;
  const parent = options.parentFontSizePx ?? 16;
  if (dpi <= 0 || root <= 0 || parent <= 0) throw new RangeError("Typography reference sizes must be greater than zero.");
  if (unit === "px") return value;
  if (unit === "pt") return value * dpi / 72;
  if (unit === "pc") return value * dpi / 6;
  if (unit === "rem") return value * root;
  if (unit === "em") return value * parent;
  throw new RangeError("Unsupported typography unit.");
}

export function convertTypography(value: number, from: "px" | "pt" | "pc" | "rem" | "em", to: "px" | "pt" | "pc" | "rem" | "em", options: TypographyOptions = {}): number {
  const px = typographyToPx(value, from, options);
  const dpi = options.dpi ?? 96;
  const root = options.rootFontSizePx ?? 16;
  const parent = options.parentFontSizePx ?? 16;
  if (to === "px") return px;
  if (to === "pt") return px * 72 / dpi;
  if (to === "pc") return px * 6 / dpi;
  if (to === "rem") return px / root;
  if (to === "em") return px / parent;
  throw new RangeError("Unsupported typography unit.");
}

export function electricalDimension(code: string): ElectricalDimension | undefined {
  return ELECTRICAL_FACTORS[code]?.dimension;
}

export const UNITS_BY_CATEGORY: Record<UnitCategory, readonly UnitCode[]> = {
  length: ["mm", "cm", "m", "km", "in", "ft", "yd", "mi", "nmi"],
  mass: ["mg", "g", "kg", "t", "oz", "lb", "stone"],
  temperature: ["C", "F", "K"],
  speed: ["m/s", "km/h", "mph", "knot"],
  duration: ["ms", "s", "min", "h", "day", "week"],
  volume: ["mL", "L", "m3", "us-tsp", "us-tbsp", "us-cup", "us-gal", "imp-gal"],
  power: ["W", "kW", "MW", "hp"],
  energy: ["J", "kJ", "Wh", "kWh", "cal", "kcal", "eV"],
  pressure: ["Pa", "kPa", "bar", "psi", "atm", "mmHg"],
  area: ["mm2", "cm2", "m2", "km2", "ft2", "acre", "hectare"],
  data: ["bit", "B", "kB", "MB", "GB", "TB", "KiB", "MiB", "GiB"],
  angle: ["deg", "rad", "grad", "turn"],
  frequency: ["Hz", "kHz", "MHz", "GHz", "rpm"],
  force: ["N", "kN", "lbf", "kgf"],
  fuelEconomy: ["L/100km", "km/L", "mpg-us", "mpg-imperial"],
  acceleration: ["m/s2", "g0", "ft/s2"],
  torque: ["Nm", "kNm", "lb-ft", "lb-in"],
  electrical: ["mV", "V", "kV", "mA", "A", "kA", "mOhm", "Ohm", "kOhm", "MOhm"],
  typography: ["px", "pt", "pc", "rem", "em"],
};

export function convertElectrical(value: number, from: keyof typeof ELECTRICAL_FACTORS, to: keyof typeof ELECTRICAL_FACTORS): number {
  assertFinite(value);
  const source = ELECTRICAL_FACTORS[from];
  const target = ELECTRICAL_FACTORS[to];
  if (!source || !target || source.dimension !== target.dimension) throw new RangeError("Electrical units must measure the same quantity.");
  return value * source.factor / target.factor;
}

export function convertUnit(category: UnitCategory, value: number, from: UnitCode, to: UnitCode, options: TypographyOptions = {}): number {
  if (category === "temperature") return celsiusToTemperature(temperatureToCelsius(value, from), to);
  if (category === "fuelEconomy") return kmPerLitreToFuelEconomy(fuelEconomyToKmPerLitre(value, from), to);
  if (category === "electrical") return convertElectrical(value, from as keyof typeof ELECTRICAL_FACTORS, to as keyof typeof ELECTRICAL_FACTORS);
  if (category === "typography") return convertTypography(value, from as "px" | "pt" | "pc" | "rem" | "em", to as "px" | "pt" | "pc" | "rem" | "em", options);
  return linearConvert(value, from, to, FACTORS[category]);
}
