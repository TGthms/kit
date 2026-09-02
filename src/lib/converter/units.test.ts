import { describe, expect, it } from "vitest";
import { convertElectrical, convertTypography, convertUnit, electricalDimension, formatConvertedInput, formatUnitSymbol } from "./units";

describe("unit conversions", () => {
  it("converts common linear, temperature, and duration units", () => {
    expect(convertUnit("length", 1, "km", "m")).toBe(1000);
    expect(convertUnit("mass", 1, "lb", "kg")).toBeCloseTo(0.45359237);
    expect(convertUnit("temperature", 32, "F", "C")).toBeCloseTo(0);
    expect(convertUnit("temperature", 0, "C", "K")).toBeCloseTo(273.15);
    expect(convertUnit("duration", 2, "h", "min")).toBe(120);
  });

  it("covers physical categories and explicit US/customary assumptions", () => {
    expect(convertUnit("volume", 1, "us-gal", "L")).toBeCloseTo(3.785411784);
    expect(convertUnit("power", 1, "hp", "W")).toBeCloseTo(745.699872);
    expect(convertUnit("energy", 1, "kWh", "J")).toBe(3600000);
    expect(convertUnit("pressure", 1, "atm", "Pa")).toBe(101325);
    expect(convertUnit("area", 1, "acre", "m2")).toBeCloseTo(4046.8564224);
    expect(convertUnit("force", 1, "lbf", "N")).toBeCloseTo(4.4482216152605);
    expect(convertUnit("acceleration", 1, "g0", "m/s2")).toBeCloseTo(9.80665);
    expect(convertUnit("torque", 1, "lb-ft", "Nm")).toBeCloseTo(1.3558179483);
  });

  it("distinguishes decimal and binary data sizes", () => {
    expect(convertUnit("data", 1, "GB", "B")).toBe(1_000_000_000);
    expect(convertUnit("data", 1, "GiB", "B")).toBe(1_073_741_824);
    expect(convertUnit("data", 8, "bit", "B")).toBe(1);
  });

  it("converts angle, frequency, speed, fuel economy, and electrical quantities", () => {
    expect(convertUnit("angle", 180, "deg", "rad")).toBeCloseTo(Math.PI);
    expect(convertUnit("frequency", 120, "rpm", "Hz")).toBe(2);
    expect(convertUnit("speed", 36, "km/h", "m/s")).toBe(10);
    expect(convertUnit("fuelEconomy", 25, "mpg-us", "L/100km")).toBeCloseTo(9.408);
    expect(convertElectrical(1000, "mV", "V")).toBe(1);
    expect(convertElectrical(1, "kOhm", "Ohm")).toBe(1000);
    expect(() => convertElectrical(1, "V", "A")).toThrow(RangeError);
    expect(electricalDimension("V")).toBe("voltage");
    expect(electricalDimension("A")).toBe("current");
    expect(electricalDimension("Ohm")).toBe("resistance");
  });

  it("uses CSS typography assumptions and rejects invalid values", () => {
    expect(convertTypography(12, "pt", "px")).toBe(16);
    expect(convertTypography(2, "em", "px", { parentFontSizePx: 20 })).toBe(40);
    expect(convertUnit("typography", 1, "rem", "px")).toBe(16);
    expect(() => convertUnit("fuelEconomy", 0, "L/100km", "km/L")).toThrow(RangeError);
    expect(() => convertUnit("length", Number.NaN, "m", "ft")).toThrow(RangeError);
  });

  it("formats live converter fields so a swap can round-trip", () => {
    expect(formatConvertedInput(1)).toBe("1");
    expect(formatConvertedInput(3.280839895013123)).toBe("3.28083989501");
    expect(formatConvertedInput(Number.NaN)).toBe("");
    const feet = convertUnit("length", 1, "m", "ft");
    expect(convertUnit("length", Number(formatConvertedInput(feet)), "ft", "m")).toBeCloseTo(1, 10);
  });

  it("renders squared and cubed unit symbols", () => {
    expect(formatUnitSymbol("m2")).toBe("m²");
    expect(formatUnitSymbol("km2")).toBe("km²");
    expect(formatUnitSymbol("m3")).toBe("m³");
    expect(formatUnitSymbol("m/s2")).toBe("m/s²");
    expect(formatUnitSymbol("kg")).toBe("kg");
  });
});
