"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeftRight, Check, RefreshCw } from "lucide-react";
import { notifyHistorySaved } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { translateOr } from "@/lib/i18n/translate";
import {
  convertCurrency,
  createCachedRateRecords,
  DEFAULT_RATE_MAX_AGE_MS,
  fetchFrankfurterRates,
  findCachedRate,
  isCachedRateStale,
  type CachedRateRecord,
} from "@/lib/converter/currency";
import { convertUnit, electricalDimension, formatConvertedInput, formatUnitSymbol, UNITS_BY_CATEGORY, type UnitCategory, type UnitCode } from "@/lib/converter/units";
import type { ToolId } from "@/lib/tools/registry";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { useHydrated } from "@/lib/react/hydrated";
import { ToolLimits, ToolShell, useToolHistory } from "./shared";

type UnitOption = { code: UnitCode; label: string };

type EditedSide = "from" | "to";

function parseLiveNumber(raw: string): number | null {
  if (!raw.trim()) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

const text = translateOr;

const UNIT_CATALOG: Record<UnitCategory, UnitOption[]> = {
  length: [
    { code: "mm", label: "Millimeters (mm)" },
    { code: "cm", label: "Centimeters (cm)" },
    { code: "m", label: "Meters (m)" },
    { code: "km", label: "Kilometers (km)" },
    { code: "in", label: "Inches (in)" },
    { code: "ft", label: "Feet (ft)" },
    { code: "yd", label: "Yards (yd)" },
    { code: "mi", label: "Miles (mi)" },
    { code: "nmi", label: "Nautical miles (nmi)" },
  ],
  mass: [
    { code: "mg", label: "Milligrams (mg)" },
    { code: "g", label: "Grams (g)" },
    { code: "kg", label: "Kilograms (kg)" },
    { code: "t", label: "Metric tonnes (t)" },
    { code: "oz", label: "Ounces (oz)" },
    { code: "lb", label: "Pounds (lb)" },
    { code: "stone", label: "Stone" },
  ],
  temperature: [
    { code: "C", label: "Celsius (°C)" },
    { code: "F", label: "Fahrenheit (°F)" },
    { code: "K", label: "Kelvin (K)" },
  ],
  speed: [
    { code: "m/s", label: "Meters per second" },
    { code: "km/h", label: "Kilometers per hour" },
    { code: "mph", label: "Miles per hour" },
    { code: "knot", label: "Knots" },
  ],
  duration: [
    { code: "ms", label: "Milliseconds" },
    { code: "s", label: "Seconds" },
    { code: "min", label: "Minutes" },
    { code: "h", label: "Hours" },
    { code: "day", label: "Days" },
    { code: "week", label: "Weeks" },
  ],
  volume: [
    { code: "mL", label: "Milliliters" },
    { code: "L", label: "Liters" },
    { code: "m3", label: "Cubic meters" },
    { code: "us-tsp", label: "US teaspoons" },
    { code: "us-tbsp", label: "US tablespoons" },
    { code: "us-cup", label: "US cups" },
    { code: "us-gal", label: "US gallons" },
    { code: "imp-gal", label: "Imperial gallons" },
  ],
  power: [
    { code: "W", label: "Watts" },
    { code: "kW", label: "Kilowatts" },
    { code: "MW", label: "Megawatts" },
    { code: "hp", label: "Mechanical horsepower" },
  ],
  energy: [
    { code: "J", label: "Joules" },
    { code: "kJ", label: "Kilojoules" },
    { code: "Wh", label: "Watt-hours" },
    { code: "kWh", label: "Kilowatt-hours" },
    { code: "cal", label: "Calories" },
    { code: "kcal", label: "Kilocalories" },
    { code: "eV", label: "Electronvolts" },
  ],
  pressure: [
    { code: "Pa", label: "Pascals" },
    { code: "kPa", label: "Kilopascals" },
    { code: "bar", label: "Bar" },
    { code: "psi", label: "PSI" },
    { code: "atm", label: "Atmospheres" },
    { code: "mmHg", label: "Millimeters of mercury" },
  ],
  area: [
    { code: "mm2", label: "Square millimeters" },
    { code: "cm2", label: "Square centimeters" },
    { code: "m2", label: "Square meters" },
    { code: "km2", label: "Square kilometers" },
    { code: "ft2", label: "Square feet" },
    { code: "acre", label: "Acres" },
    { code: "hectare", label: "Hectares" },
  ],
  data: [
    { code: "bit", label: "Bits" },
    { code: "B", label: "Bytes" },
    { code: "kB", label: "Kilobytes" },
    { code: "MB", label: "Megabytes" },
    { code: "GB", label: "Gigabytes" },
    { code: "TB", label: "Terabytes" },
    { code: "KiB", label: "Kibibytes" },
    { code: "MiB", label: "Mebibytes" },
    { code: "GiB", label: "Gibibytes" },
  ],
  angle: [
    { code: "deg", label: "Degrees" },
    { code: "rad", label: "Radians" },
    { code: "grad", label: "Gradians" },
    { code: "turn", label: "Turns" },
  ],
  frequency: [
    { code: "Hz", label: "Hertz" },
    { code: "kHz", label: "Kilohertz" },
    { code: "MHz", label: "Megahertz" },
    { code: "GHz", label: "Gigahertz" },
    { code: "rpm", label: "Revolutions per minute" },
  ],
  force: [
    { code: "N", label: "Newtons" },
    { code: "kN", label: "Kilonewtons" },
    { code: "lbf", label: "Pound-force" },
    { code: "kgf", label: "Kilogram-force" },
  ],
  fuelEconomy: [
    { code: "L/100km", label: "Liters per 100 km" },
    { code: "km/L", label: "Kilometers per liter" },
    { code: "mpg-us", label: "Miles per US gallon" },
    { code: "mpg-imperial", label: "Miles per imperial gallon" },
  ],
  acceleration: [
    { code: "m/s2", label: "Meters per second squared" },
    { code: "g0", label: "Standard gravity" },
    { code: "ft/s2", label: "Feet per second squared" },
  ],
  torque: [
    { code: "Nm", label: "Newton-meters" },
    { code: "kNm", label: "Kilonewton-meters" },
    { code: "lb-ft", label: "Pound-feet" },
    { code: "lb-in", label: "Pound-inches" },
  ],
  electrical: [
    { code: "mV", label: "Millivolts" },
    { code: "V", label: "Volts" },
    { code: "kV", label: "Kilovolts" },
    { code: "mA", label: "Milliamps" },
    { code: "A", label: "Amps" },
    { code: "kA", label: "Kiloamps" },
    { code: "mOhm", label: "Milliohms" },
    { code: "Ohm", label: "Ohms" },
    { code: "kOhm", label: "Kilohms" },
    { code: "MOhm", label: "Megohms" },
  ],
  typography: [
    { code: "px", label: "Pixels" },
    { code: "pt", label: "Points" },
    { code: "pc", label: "Picas" },
    { code: "rem", label: "rem" },
    { code: "em", label: "em" },
  ],
};

const CURRENCIES = [
  ["USD", "US dollar · United States"],
  ["CAD", "Canadian dollar · Canada"],
  ["MXN", "Mexican peso · Mexico"],
  ["BRL", "Brazilian real · Brazil"],
  ["ARS", "Argentine peso · Argentina"],
  ["EUR", "Euro · Europe"],
  ["GBP", "British pound · United Kingdom"],
  ["CHF", "Swiss franc · Switzerland"],
  ["SEK", "Swedish krona · Sweden"],
  ["NOK", "Norwegian krone · Norway"],
  ["DKK", "Danish krone · Denmark"],
  ["PLN", "Polish zloty · Poland"],
  ["CZK", "Czech koruna · Czechia"],
  ["TRY", "Turkish lira · Türkiye"],
  ["JPY", "Japanese yen · Japan"],
  ["CNY", "Chinese yuan · China"],
  ["HKD", "Hong Kong dollar · Hong Kong, China"],
  ["SGD", "Singapore dollar · Singapore"],
  ["KRW", "South Korean won · South Korea"],
  ["INR", "Indian rupee · India"],
  ["THB", "Thai baht · Thailand"],
  ["IDR", "Indonesian rupiah · Indonesia"],
  ["MYR", "Malaysian ringgit · Malaysia"],
  ["PHP", "Philippine peso · Philippines"],
  ["VND", "Vietnamese dong · Vietnam"],
  ["NZD", "New Zealand dollar · New Zealand"],
  ["AED", "UAE dirham · United Arab Emirates"],
  ["SAR", "Saudi riyal · Saudi Arabia"],
  ["ILS", "Israeli new shekel · Israel"],
  ["ZAR", "South African rand · South Africa"],
  ["EGP", "Egyptian pound · Egypt"],
] as const;

const CURRENCY_MESSAGE_KEYS: Record<string, string> = {
  USD: "currencyUsd",
  CAD: "currencyCad",
  MXN: "currencyMxn",
  BRL: "currencyBrl",
  ARS: "currencyArs",
  EUR: "currencyEur",
  GBP: "currencyGbp",
  CHF: "currencyChf",
  SEK: "currencySek",
  NOK: "currencyNok",
  DKK: "currencyDkk",
  PLN: "currencyPln",
  CZK: "currencyCzk",
  TRY: "currencyTry",
  JPY: "currencyJpy",
  CNY: "currencyCny",
  HKD: "currencyHkd",
  SGD: "currencySgd",
  KRW: "currencyKrw",
  INR: "currencyInr",
  THB: "currencyThb",
  IDR: "currencyIdr",
  MYR: "currencyMyr",
  PHP: "currencyPhp",
  VND: "currencyVnd",
  NZD: "currencyNzd",
  AED: "currencyAed",
  SAR: "currencySar",
  ILS: "currencyIls",
  ZAR: "currencyZar",
  EGP: "currencyEgp",
};

const UNIT_MESSAGE_KEYS: Record<string, string> = {
  mm: "unitMm", cm: "unitCm", m: "unitM", km: "unitKm", in: "unitIn", ft: "unitFt", yd: "unitYd", mi: "unitMi", nmi: "unitNmi",
  mg: "unitMg", g: "unitG", kg: "unitKg", t: "unitT", oz: "unitOz", lb: "unitLb", stone: "unitStone",
  C: "unitC", F: "unitF", K: "unitK", "m/s": "unitM_s", "km/h": "unitKm_h", mph: "unitMph", knot: "unitKnot",
  ms: "unitMs", s: "unitS", min: "unitMin", h: "unitH", day: "unitDay", week: "unitWeek",
  mL: "unitMl", L: "unitL", m3: "unitM3", "us-tsp": "unitUsTsp", "us-tbsp": "unitUsTbsp", "us-fl-oz": "unitUsFlOz", "us-cup": "unitUsCup", "us-pt": "unitUsPt", "us-qt": "unitUsQt", "us-gal": "unitUsGal", "imp-gal": "unitImpGal",
  W: "unitW", kW: "unitKw", MW: "unitMw", GW: "unitGw", hp: "unitHp", J: "unitJ", kJ: "unitKj", MJ: "unitMj", Wh: "unitWh", kWh: "unitKwh", cal: "unitCal", kcal: "unitKcal", eV: "unitEv",
  Pa: "unitPa", kPa: "unitKpa", MPa: "unitMpa", bar: "unitBar", psi: "unitPsi", atm: "unitAtm", mmHg: "unitMmHg",
  mm2: "unitMm2", cm2: "unitCm2", m2: "unitM2", km2: "unitKm2", in2: "unitIn2", ft2: "unitFt2", yd2: "unitYd2", acre: "unitAcre", hectare: "unitHectare",
  bit: "unitBit", B: "unitB", kB: "unitKb", MB: "unitMb", GB: "unitGb", TB: "unitTb", PB: "unitPb", KiB: "unitKib", MiB: "unitMib", GiB: "unitGib", TiB: "unitTib", PiB: "unitPib",
  deg: "unitDeg", rad: "unitRad", grad: "unitGrad", arcmin: "unitArcmin", arcsec: "unitArcsec", turn: "unitTurn", Hz: "unitHz", kHz: "unitKhz", MHz: "unitMhz", GHz: "unitGhz", rpm: "unitRpm",
  N: "unitN", kN: "unitKn", lbf: "unitLbf", kgf: "unitKgf", "L/100km": "unitL_100km", "km/L": "unitKm_L", "mpg-us": "unitMpgUs", "mpg-imperial": "unitMpgImperial",
  "m/s2": "unitM_s2", g0: "unitG0", "ft/s2": "unitFt_s2", Nm: "unitNm", kNm: "unitKnm", "lb-ft": "unitLbFt", "lb-in": "unitLbIn",
  mV: "unitMv", V: "unitV", kV: "unitKv", mA: "unitMa", A: "unitA", kA: "unitKa", mOhm: "unitMOhm", Ohm: "unitOhm", kOhm: "unitKOhm", MOhm: "unitMOhmBig", px: "unitPx", pt: "unitPt", pc: "unitPc", rem: "unitRem", em: "unitEm",
};

const UNIT_FORMAT_KEYS: Partial<Record<UnitCode, string>> = {
  mm: "millimeter", cm: "centimeter", m: "meter", km: "kilometer", in: "inch", ft: "foot", yd: "yard", mi: "mile", nmi: "nautical-mile",
  mg: "milligram", g: "gram", kg: "kilogram", t: "tonne", oz: "ounce", lb: "pound", stone: "stone", C: "celsius", F: "fahrenheit", K: "kelvin",
  ms: "millisecond", s: "second", min: "minute", h: "hour", day: "day", week: "week", mL: "milliliter", L: "liter", m3: "cubic-meter",
  W: "watt", kW: "kilowatt", MW: "megawatt", hp: "horsepower", J: "joule", kJ: "kilojoule", MJ: "megajoule", Wh: "watt-hour", kWh: "kilowatt-hour", cal: "calorie", kcal: "kilocalorie",
  Pa: "pascal", kPa: "kilopascal", MPa: "megapascal", bar: "bar", psi: "psi", atm: "atmosphere", mmHg: "millimeter-of-mercury", mm2: "square-millimeter", cm2: "square-centimeter", m2: "square-meter", km2: "square-kilometer", ft2: "square-foot", acre: "acre", hectare: "hectare",
  bit: "bit", B: "byte", kB: "kilobyte", MB: "megabyte", GB: "gigabyte", TB: "terabyte", KiB: "kibibyte", MiB: "mebibyte", GiB: "gibibyte", deg: "degree", rad: "radian", grad: "gradian", turn: "revolution", Hz: "hertz", kHz: "kilohertz", MHz: "megahertz", GHz: "gigahertz", rpm: "revolutions-per-minute",
  N: "newton", kN: "kilonewton", lbf: "pound-force", kgf: "kilogram-force", "m/s2": "meter-per-square-second", g0: "standard-gravity", "ft/s2": "foot-per-square-second", Nm: "newton-meter", kNm: "kilonewton-meter", "lb-ft": "pound-foot", "lb-in": "pound-inch",
  mV: "millivolt", V: "volt", kV: "kilovolt", mA: "milliampere", A: "ampere", kA: "kiloampere", mOhm: "milliohm", Ohm: "ohm", kOhm: "kiloohm", MOhm: "megaohm", px: "pixel", pt: "point", pc: "pica", rem: "rem", em: "em",
};

function localizedUnitLabel(code: UnitCode, fallback: string, locale: string): string {
  const unit = UNIT_FORMAT_KEYS[code];
  if (!unit) return fallback;
  try {
    const parts = new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "long" }).formatToParts(1);
    return parts.find((part) => part.type === "unit")?.value ?? fallback;
  } catch {
    return fallback;
  }
}

function UnitConverter({
  category,
  historyToolId,
}: {
  category: UnitCategory;
  historyToolId: ToolId;
}) {
  const t = useTranslations("tools.everyday-converter");
  const locale = useLocale();
  const log = useToolHistory(historyToolId);
  const options: UnitOption[] = useMemo(
    () =>
      UNITS_BY_CATEGORY[category].map((code) => ({
        code,
        label: UNIT_CATALOG[category].find((option) => option.code === code)?.label ?? code,
      })),
    [category]
  );
  const localizedOptions = useMemo(
    () => options.map((option) => {
      const translated = UNIT_MESSAGE_KEYS[option.code] ? text(t, UNIT_MESSAGE_KEYS[option.code], option.label) : option.label;
      return { ...option, label: translated === option.label ? localizedUnitLabel(option.code, option.label, locale) : translated };
    }),
    [locale, options, t]
  );
  const [source, setSource] = useState("1");
  const [edited, setEdited] = useState<EditedSide>("from");
  const [from, setFrom] = useState<UnitCode>(options[0].code);
  const [to, setTo] = useState<UnitCode>(options[1]?.code ?? options[0].code);
  const compatibleTo = useMemo(() => {
    if (category !== "electrical") return localizedOptions;
    const dim = electricalDimension(from);
    return localizedOptions.filter((option) => electricalDimension(option.code) === dim);
  }, [category, from, localizedOptions]);
  const toCode = compatibleTo.some((option) => option.code === to)
    ? to
    : (compatibleTo.find((option) => option.code !== from)?.code ?? to);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qFrom = params.get("from");
    const qTo = params.get("to");
    const qV = params.get("v");
    const nextFrom = qFrom && options.some((option) => option.code === qFrom) ? (qFrom as UnitCode) : null;
    const nextTo = qTo && options.some((option) => option.code === qTo) ? (qTo as UnitCode) : null;
    queueMicrotask(() => {
      if (nextFrom) setFrom(nextFrom);
      if (nextTo) setTo(nextTo);
      if (qV !== null && qV !== "") {
        setEdited("from");
        setSource(qV);
      }
    });
  }, [category, options]);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("from", from);
    url.searchParams.set("to", toCode);
    url.searchParams.set("v", source);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [from, source, toCode]);
  const [rootFontSizePx, setRootFontSizePx] = useState("16");
  const [parentFontSizePx, setParentFontSizePx] = useState("16");
  const [dpi, setDpi] = useState("96");
  const typographyOptions = useMemo(() => ({
    rootFontSizePx: Number(rootFontSizePx),
    parentFontSizePx: Number(parentFontSizePx),
    dpi: Number(dpi),
  }), [dpi, parentFontSizePx, rootFontSizePx]);
  const other = useMemo(() => {
    const value = parseLiveNumber(source);
    if (value === null) return null;
    try {
      return edited === "from"
        ? convertUnit(category, value, from, toCode, typographyOptions)
        : convertUnit(category, value, toCode, from, typographyOptions);
    } catch {
      return null;
    }
  }, [category, edited, from, source, toCode, typographyOptions]);
  const fromNumber = edited === "from" ? parseLiveNumber(source) : other;
  const toNumber = edited === "to" ? parseLiveNumber(source) : other;
  const fromText = edited === "from" ? source : (other === null ? "" : formatConvertedInput(other));
  const toText = edited === "to" ? source : (other === null ? "" : formatConvertedInput(other));
  const editFrom = (raw: string) => {
    setEdited("from");
    setSource(raw);
  };
  const editTo = (raw: string) => {
    setEdited("to");
    setSource(raw);
  };
  const swapSides = () => {
    const nextFrom = toCode;
    const nextTo = from;
    setSource(toText);
    setEdited("from");
    setFrom(nextFrom);
    setTo(nextTo);
  };
  const presets = ({
    length: [["presetMetricImperial", "m", "ft"], ["presetKilometersMiles", "km", "mi"]],
    mass: [["presetKilogramsPounds", "kg", "lb"]],
    temperature: [["presetCelsiusFahrenheit", "C", "F"], ["presetCelsiusKelvin", "C", "K"]],
    speed: [["presetKmhMph", "km/h", "mph"]],
    duration: [["presetHoursMinutes", "h", "min"]],
    volume: [["presetLitersGallons", "L", "us-gal"]],
    power: [["presetWattsHorsepower", "W", "hp"]],
    energy: [["presetKwhJoules", "kWh", "J"]],
    pressure: [["presetBarPsi", "bar", "psi"]],
    area: [["presetSquareMetersFeet", "m2", "ft2"]],
    data: [["presetGbGib", "GB", "GiB"]],
    angle: [["presetDegreesRadians", "deg", "rad"]],
    frequency: [["presetHzRpm", "Hz", "rpm"]],
    force: [["presetNewtonsPoundForce", "N", "lbf"]],
    fuelEconomy: [["presetL100kmMpg", "L/100km", "mpg-us"]],
    acceleration: [["presetMs2G", "m/s2", "g0"]],
    torque: [["presetNmLbFt", "Nm", "lb-ft"]],
    electrical: [["presetVoltsMillivolts", "V", "mV"], ["presetAmpsMilliamps", "A", "mA"], ["presetOhmsKilohms", "Ohm", "kOhm"]],
    typography: [["presetPxRem", "px", "rem"], ["presetPxPt", "px", "pt"]],
  } as Record<UnitCategory, Array<[string, UnitCode, UnitCode]>>)[category] ?? [];
  const setPreset = (nextFrom: UnitCode, nextTo: UnitCode) => {
    setFrom(nextFrom);
    setTo(nextTo);
  };
  const presetEnglishLabels: Record<string, string> = {
    presetMetricImperial: "Metric ↔ imperial",
    presetKilometersMiles: "Kilometers ↔ miles",
    presetKilogramsPounds: "Kilograms ↔ pounds",
    presetCelsiusFahrenheit: "Celsius ↔ Fahrenheit",
    presetCelsiusKelvin: "Celsius ↔ Kelvin",
    presetKmhMph: "Kilometers per hour ↔ miles per hour",
    presetHoursMinutes: "Hours ↔ minutes",
    presetLitersGallons: "Liters ↔ US gallons",
    presetWattsHorsepower: "Watts ↔ horsepower",
    presetKwhJoules: "Kilowatt-hours ↔ joules",
    presetBarPsi: "Bar ↔ PSI",
    presetSquareMetersFeet: "Square meters ↔ square feet",
    presetGbGib: "Gigabytes ↔ gibibytes",
    presetDegreesRadians: "Degrees ↔ radians",
    presetHzRpm: "Hertz ↔ RPM",
    presetNewtonsPoundForce: "Newtons ↔ pound-force",
    presetL100kmMpg: "Liters per 100 km ↔ miles per US gallon",
    presetMs2G: "Meters per second squared ↔ standard gravity",
    presetNmLbFt: "Newton-meters ↔ pound-feet",
    presetVoltsMillivolts: "Volts ↔ millivolts",
    presetAmpsMilliamps: "Amps ↔ milliamps",
    presetOhmsKilohms: "Ohms ↔ kilohms",
    presetPxRem: "Pixels ↔ rem",
    presetPxPt: "Pixels ↔ points",
  };
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="space-y-3">
          <Label htmlFor="unit-from-value">{text(t, "from", "From")}</Label>
          <Input id="unit-from-value" value={fromText} onChange={(event) => editFrom(event.target.value)} inputMode="decimal" className="text-lg" />
          <SearchableSelect
            label={text(t, "from", "From")}
            hideLabel
            value={from}
            options={localizedOptions.map((option) => ({ value: option.code, label: option.label }))}
            onChange={(value) => setFrom(value as UnitCode)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={text(t, "swapUnits", "Swap units")}
          onClick={swapSides}
          className="justify-self-center"
        >
          <ArrowLeftRight />
        </Button>
        <div className="space-y-3">
          <Label htmlFor="unit-to-value">{text(t, "to", "To")}</Label>
          <Input id="unit-to-value" value={toText} onChange={(event) => editTo(event.target.value)} inputMode="decimal" className="text-lg" />
          <SearchableSelect
            label={text(t, "to", "To")}
            hideLabel
            value={toCode}
            options={compatibleTo.map((option) => ({ value: option.code, label: option.label }))}
            onChange={(value) => setTo(value as UnitCode)}
          />
        </div>
      </div>
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">{text(t, "result", "Result")}</p>
          {fromNumber === null || toNumber === null ? (
            <p className="mt-2 text-lg font-semibold">—</p>
          ) : (
            <p className="mt-2 text-lg font-semibold tabular-nums" dir="ltr">
              <span className="inline-flex flex-wrap items-baseline gap-1.5">
                <AnimatedNumber value={fromNumber} format={{ maximumFractionDigits: 8 }} />
                <span className="text-sm font-medium text-muted-foreground">{formatUnitSymbol(from)}</span>
                <span className="text-muted-foreground">=</span>
                <AnimatedNumber value={toNumber} format={{ maximumFractionDigits: 8 }} />
                <span className="text-sm font-medium text-muted-foreground">{formatUnitSymbol(toCode)}</span>
              </span>
            </p>
          )}
        </CardContent>
      </Card>
      {category === "typography" ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{text(t, "typographyReferences", "Typography references")}</CardTitle>
            <CardDescription>{text(t, "typographyHint", "Set the root, parent, or screen reference used by rem, em, and pt.")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Input type="number" min="1" value={rootFontSizePx} onChange={(event) => setRootFontSizePx(event.target.value)} aria-label={text(t, "rootFontSize", "Root font size")} />
            <Input type="number" min="1" value={parentFontSizePx} onChange={(event) => setParentFontSizePx(event.target.value)} aria-label={text(t, "parentFontSize", "Parent font size")} />
            <Input type="number" min="1" value={dpi} onChange={(event) => setDpi(event.target.value)} aria-label={text(t, "dpi", "DPI")} />
          </CardContent>
        </Card>
      ) : null}
      {presets.length ? (
        <div className="space-y-2">
          <Label>{text(t, "presets", "Presets")}</Label>
          <div className="flex flex-wrap gap-2">
            {presets.map(([labelKey, presetFrom, presetTo]) => (
              <Button key={labelKey} type="button" size="sm" variant="outline" onClick={() => setPreset(presetFrom, presetTo)}>
                {(() => {
                  const english = presetEnglishLabels[labelKey] ?? labelKey;
                  const translated = text(t, labelKey, english);
                  if (locale === "en" || translated !== english) return translated;
                  return `${localizedUnitLabel(presetFrom, presetFrom, locale)} ↔ ${localizedUnitLabel(presetTo, presetTo, locale)}`;
                })()}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      <Button
        variant="outline"
        onClick={() => {
          log(fromNumber === null || toNumber === null ? `${fromText} ${from} → ${toCode}` : `${fromText} ${from} → ${toNumber} ${toCode}`, "success");
          notifyHistorySaved(text(t, "saved", "Conversion saved to history."), text(t, "historyOff", "History is off, so this wasn’t saved."));
        }}
      >
        <Check /> {text(t, "record", "Record conversion")}
      </Button>
    </div>
  );
}

const CURRENCY_CACHE_KEY = "kit-everyday-currency-rates-v1";

function readCurrencyCache(): CachedRateRecord[] {
  try {
    const raw = window.localStorage.getItem(CURRENCY_CACHE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((record): record is CachedRateRecord => {
      if (!record || typeof record !== "object") return false;
      const item = record as Record<string, unknown>;
      return typeof item.date === "string" && typeof item.base === "string" && typeof item.quote === "string" && typeof item.rate === "number" && typeof item.fetchedAt === "number";
    });
  } catch {
    return [];
  }
}

function writeCurrencyCache(records: CachedRateRecord[]) {
  try {
    window.localStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(records));
  } catch {
    // Quota / private mode. In-memory rates still apply for this session.
  }
}

export function CurrencyConverter({ namespace = "tools.currency-converter" }: { namespace?: "tools.currency-converter" } = {}) {
  const t = useTranslations(namespace);
  const locale = useLocale();
  const log = useToolHistory("currency-converter");
  const [source, setSource] = useState("100");
  const [edited, setEdited] = useState<EditedSide>("from");
  const [base, setBase] = useState("USD");
  const [quote, setQuote] = useState("EUR");
  const hydrated = useHydrated();
  const storedRates = hydrated ? readCurrencyCache() : [];
  const [liveRates, setLiveRates] = useState<CachedRateRecord[] | null>(null);
  const rates = liveRates ?? storedRates;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorFor, setErrorFor] = useState("");
  const pairKey = `${base}:${quote}`;
  const displayError = errorFor === pairKey ? error : "";
  const [refreshToken, setRefreshToken] = useState(0);
  const currencyOptions = useMemo(
    () => CURRENCIES.map(([value, fallback]) => {
      const country = fallback.split(" · ")[1] ?? "";
      let localizedName = text(t, CURRENCY_MESSAGE_KEYS[value] ?? "", fallback);
      let localizedCountry = country;
      try {
        localizedName = new Intl.DisplayNames([locale], { type: "currency" }).of(value) ?? localizedName;
        if (/^[A-Z]{2}/u.test(country)) localizedCountry = new Intl.DisplayNames([locale], { type: "region" }).of(country) ?? country;
      } catch {
        // Keep the catalog fallback when DisplayNames is unavailable.
      }
      return { value, label: localizedCountry ? `${localizedName} · ${localizedCountry}` : localizedName };
    }),
    [locale, t]
  );
  const match = useMemo(() => (base === quote ? null : findCachedRate(rates, base, quote)), [base, quote, rates]);
  const stale = match ? isCachedRateStale(match.record) : false;
  const other = useMemo(() => {
    const value = parseLiveNumber(source);
    if (value === null) return null;
    const from = edited === "from" ? base : quote;
    const to = edited === "from" ? quote : base;
    if (from === to) return value;
    if (!match && from !== to) return null;
    try {
      return convertCurrency(value, from, to, rates);
    } catch {
      return null;
    }
  }, [base, edited, match, quote, rates, source]);
  const fromNumber = edited === "from" ? parseLiveNumber(source) : other;
  const toNumber = edited === "to" ? parseLiveNumber(source) : other;
  const fromText = edited === "from" ? source : (other === null ? "" : formatConvertedInput(other));
  const toText = edited === "to" ? source : (other === null ? "" : formatConvertedInput(other));
  const editFrom = (raw: string) => {
    setEdited("from");
    setSource(raw);
  };
  const editTo = (raw: string) => {
    setEdited("to");
    setSource(raw);
  };
  const swapSides = () => {
    const nextBase = quote;
    const nextQuote = base;
    setSource(toText);
    setEdited("from");
    setBase(nextBase);
    setQuote(nextQuote);
  };
  const effectiveRate = match ? (match.inverted ? 1 / match.rate : match.rate) : base === quote ? 1 : null;

  const lastRefreshToken = useRef(refreshToken);

  useEffect(() => {
    let active = true;
    const cached = readCurrencyCache();
    if (base === quote) {
      return () => {
        active = false;
      };
    }
    // Skip the network round-trip when we already have a fresh cached rate
    // for this exact pair: switching between previously-viewed currencies
    // shouldn't re-hit the API every time. The explicit "Refresh rates"
    // button bumps `refreshToken`, which always forces a re-fetch even if
    // the cache looks fresh — but only on the render where it actually
    // changed, not on every later base/quote switch.
    const forced = refreshToken !== lastRefreshToken.current;
    lastRefreshToken.current = refreshToken;
    const existing = findCachedRate(cached, base, quote);
    if (!forced && existing && !isCachedRateStale(existing.record)) {
      return () => {
        active = false;
      };
    }
    void Promise.resolve().then(() => {
      if (active) setLoading(true);
    });
    fetchFrankfurterRates({ base, symbols: [quote] })
      .then((fetched) => {
        if (!active) return;
        const created = createCachedRateRecords(fetched);
        const next = [...cached.filter((record) => !created.some((item) => item.base === record.base && item.quote === record.quote)), ...created];
        setLiveRates(next);
        writeCurrencyCache(next);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Rate service unavailable");
          setErrorFor(`${base}:${quote}`);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [base, quote, refreshToken]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="space-y-3">
          <Label htmlFor="currency-from-value">{text(t, "from", "From")}</Label>
          <Input id="currency-from-value" value={fromText} onChange={(event) => editFrom(event.target.value)} inputMode="decimal" className="text-lg" />
          <SearchableSelect label={text(t, "from", "From")} hideLabel value={base} options={currencyOptions} onChange={setBase} />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={text(t, "swapCurrencies", "Swap currencies")}
          onClick={swapSides}
          className="justify-self-center"
        >
          <ArrowLeftRight />
        </Button>
        <div className="space-y-3">
          <Label htmlFor="currency-to-value">{text(t, "to", "To")}</Label>
          <Input id="currency-to-value" value={toText} onChange={(event) => editTo(event.target.value)} inputMode="decimal" className="text-lg" />
          <SearchableSelect label={text(t, "to", "To")} hideLabel value={quote} options={currencyOptions} onChange={setQuote} />
        </div>
      </div>
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">{text(t, "result", "Result")}</p>
          {fromNumber === null || toNumber === null ? (
            <p className="mt-2 text-lg font-semibold">—</p>
          ) : (
            <p className="mt-2 text-lg font-semibold tabular-nums" dir="ltr">
              <span className="inline-flex flex-wrap items-baseline gap-1.5">
                <AnimatedNumber value={fromNumber} format={{ maximumFractionDigits: 8 }} />
                <span className="text-sm font-medium text-muted-foreground">{base}</span>
                <span className="text-muted-foreground">=</span>
                <AnimatedNumber value={toNumber} format={{ maximumFractionDigits: 8 }} />
                <span className="text-sm font-medium text-muted-foreground">{quote}</span>
              </span>
            </p>
          )}
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-sm text-muted-foreground">{loading ? text(t, "loadingRate", "Loading live rate…") : text(t, "rate", "Exchange rate")}</p>
            <p className="mt-1 text-2xl font-semibold">
              {effectiveRate === null ? (
                "—"
              ) : (
                <span className="inline-flex flex-wrap items-baseline gap-1">
                  <span>1 {base} =</span>
                  <AnimatedNumber value={effectiveRate} format={{ maximumFractionDigits: 6 }} />
                  <span>{quote}</span>
                </span>
              )}
            </p>
            {match ? (
              <p className={`mt-2 text-xs ${stale ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>
                {stale ? text(t, "stale", "Cached rate is older than six hours; refresh may be needed.") : `${text(t, "asOf", "Rate date")} ${match.record.date}`}
              </p>
            ) : null}
            {displayError ? <p className="mt-2 text-xs text-destructive">{displayError}{match ? ` ${text(t, "usingCache", "Using the last cached rate.")}` : ""}</p> : null}
            {match && liveRates && !stale ? <p className="mt-1 text-xs text-muted-foreground">{text(t, "updated", "Updated just now")}</p> : null}
          </div>
          <Button variant="outline" onClick={() => setRefreshToken((value) => value + 1)} disabled={loading} className="sm:self-start">
            <RefreshCw className={loading ? "animate-spin" : ""} /> {text(t, "refresh", "Refresh")}
          </Button>
        </CardContent>
      </Card>
      <Button
        variant="outline"
        onClick={() => {
          log(fromNumber === null || toNumber === null ? `${fromText} ${base} → ${quote}` : `${fromText} ${base} → ${toNumber} ${quote}`, "success", { stale, maxAgeMs: DEFAULT_RATE_MAX_AGE_MS });
          notifyHistorySaved(text(t, "saved", "Conversion saved to history."), text(t, "historyOff", "History is off, so this wasn’t saved."));
        }}
      >
        <Check /> {text(t, "record", "Record conversion")}
      </Button>
    </div>
  );
}

export function CurrencyConverterTool() {
  const t = useTranslations("tools.currency-converter");
  return (
    <ToolShell toolId="currency-converter">
      <ToolLimits>
        <p>{text(t, "limits", "Currency rates come from Frankfurter when this tool opens or you tap Refresh, then stay in this browser cache for six hours. Amounts are not sent. Rates are daily reference data, not for trading or tax.")}</p>
      </ToolLimits>
      <CurrencyConverter namespace="tools.currency-converter" />
    </ToolShell>
  );
}

function UnitConverterTool({ toolId: id, category }: { toolId: ToolId; category: UnitCategory }) {
  return (
    <ToolShell toolId={id}>
      <UnitConverter category={category} historyToolId={id} />
    </ToolShell>
  );
}

export function LengthConverter() { return <UnitConverterTool toolId="length-converter" category="length" />; }
export function MassConverter() { return <UnitConverterTool toolId="mass-converter" category="mass" />; }
export function TemperatureConverter() { return <UnitConverterTool toolId="temperature-converter" category="temperature" />; }
export function SpeedConverter() { return <UnitConverterTool toolId="speed-converter" category="speed" />; }
export function DurationConverter() { return <UnitConverterTool toolId="duration-converter" category="duration" />; }
export function VolumeConverter() { return <UnitConverterTool toolId="volume-converter" category="volume" />; }
export function PowerConverter() { return <UnitConverterTool toolId="power-converter" category="power" />; }
export function EnergyConverter() { return <UnitConverterTool toolId="energy-converter" category="energy" />; }
export function PressureConverter() { return <UnitConverterTool toolId="pressure-converter" category="pressure" />; }
export function AreaConverter() { return <UnitConverterTool toolId="area-converter" category="area" />; }
export function DataConverter() { return <UnitConverterTool toolId="data-converter" category="data" />; }
export function AngleConverter() { return <UnitConverterTool toolId="angle-converter" category="angle" />; }
export function FrequencyConverter() { return <UnitConverterTool toolId="frequency-converter" category="frequency" />; }
export function ForceConverter() { return <UnitConverterTool toolId="force-converter" category="force" />; }
export function FuelEconomyConverter() { return <UnitConverterTool toolId="fuel-economy-converter" category="fuelEconomy" />; }
export function AccelerationConverter() { return <UnitConverterTool toolId="acceleration-converter" category="acceleration" />; }
export function TorqueConverter() { return <UnitConverterTool toolId="torque-converter" category="torque" />; }
export function ElectricalConverter() { return <UnitConverterTool toolId="electrical-converter" category="electrical" />; }
export function TypographyConverter() { return <UnitConverterTool toolId="typography-converter" category="typography" />; }
