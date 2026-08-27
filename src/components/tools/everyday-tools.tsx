"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeftRight,
  Activity,
  BatteryCharging,
  Beaker,
  Cable,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  Database,
  Dice5,
  Dumbbell,
  Fuel,
  Gauge,
  GlassWater,
  Globe2,
  MoveUpRight,
  Orbit,
  Ruler,
  RefreshCw,
  RotateCw,
  Search,
  Scale,
  Square,
  Thermometer,
  Timer,
  TimerReset,
  Type,
  TrendingUp,
  WalletCards,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  addBusinessDays,
  addDate,
  countBusinessDays,
  differenceBetweenDates,
  differenceInCalendarDays,
  type DateUnit,
} from "@/lib/converter/date";
import {
  convertCurrency,
  createCachedRateRecords,
  DEFAULT_RATE_MAX_AGE_MS,
  fetchFrankfurterRates,
  findCachedRate,
  isCachedRateStale,
  type CachedRateRecord,
} from "@/lib/converter/currency";
import { measureText } from "@/lib/converter/text-counter";
import {
  convertLocalTimeZone,
  formatTimeZone,
  getTimeZoneOffsetMinutes,
  getTimeZoneParts,
} from "@/lib/converter/timezone";
import { calculateTip } from "@/lib/converter/tip";
import {
  convertUnit,
  type UnitCategory,
  type UnitCode,
} from "@/lib/converter/units";
import {
  randomBoolean,
  randomDecimal,
  randomInteger,
  randomPassword,
} from "@/lib/converter/random";
import {
  createStopwatch,
  createTimer,
  getStopwatchElapsed,
  getTimerRemaining,
  pauseStopwatch,
  pauseTimer,
  resetStopwatch,
  resetTimer,
  startStopwatch,
  startTimer,
  tickTimer,
  type StopwatchState,
  type TimerState,
} from "@/lib/converter/timer";
import { CITIES, cityTimeZones } from "@/lib/converter/cities";
import {
  bytesToBlob,
  downloadBlob,
} from "@/lib/utils";
import { detectImageMime, imagesToPdf } from "@/lib/pdf/core";
import type { ToolId } from "@/lib/tools/registry";
import { ActionBar, ToolLimits, ToolShell, useToolHistory } from "./shared";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const toolId = (value: string) => value as ToolId;
type TranslationFn = (key: string, values?: Record<string, string | number>) => string;

type ConverterCategory = UnitCategory | "currency";
type UnitOption = { code: UnitCode; label: string };

function text(t: ReturnType<typeof useTranslations>, key: string, fallback: string, values?: Record<string, string | number>) {
  try {
    const translate = t as unknown as TranslationFn;
    return translate(key, values) || fallback;
  } catch {
    return fallback;
  }
}

function formatNumber(value: number, maximumFractionDigits = 8) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLocalDateTime(value: Date) {
  return `${formatDateInput(value)}T${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
}

function parseLocalDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function formatDuration(milliseconds: number, showHours = true) {
  const totalCentiseconds = Math.floor(Math.max(0, milliseconds) / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  return `${showHours ? `${String(hours).padStart(2, "0")}:` : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function formatClock(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

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

const UNIT_CATEGORY_INFO: Array<{ id: UnitCategory; key: string; icon: LucideIcon }> = [
  { id: "length", key: "Length", icon: Ruler },
  { id: "mass", key: "Mass", icon: Scale },
  { id: "temperature", key: "Temperature", icon: Thermometer },
  { id: "speed", key: "Speed", icon: Gauge },
  { id: "duration", key: "Duration", icon: Timer },
  { id: "volume", key: "Volume", icon: GlassWater },
  { id: "power", key: "Power", icon: Zap },
  { id: "energy", key: "Energy", icon: BatteryCharging },
  { id: "pressure", key: "Pressure", icon: Beaker },
  { id: "area", key: "Area", icon: Square },
  { id: "data", key: "Data", icon: Database },
  { id: "angle", key: "Angle", icon: RotateCw },
  { id: "frequency", key: "Frequency", icon: Activity },
  { id: "force", key: "Force", icon: Dumbbell },
  { id: "fuelEconomy", key: "FuelEconomy", icon: Fuel },
  { id: "acceleration", key: "Acceleration", icon: MoveUpRight },
  { id: "torque", key: "Torque", icon: Orbit },
  { id: "electrical", key: "Electrical", icon: Cable },
  { id: "typography", key: "Typography", icon: Type },
];

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

function SearchableSelect({
  label,
  value,
  options,
  onChange,
  searchable = options.length > 4,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  searchable?: boolean;
}) {
  const t = useTranslations("tools.everyday-converter");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    const matches = options.filter((option) => `${option.value} ${option.label}`.toLowerCase().includes(normalized));
    const selected = options.find((option) => option.value === value);
    return selected && !matches.some((option) => option.value === selected.value) ? [selected, ...matches] : matches;
  }, [options, query, value]);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {searchable ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={text(t, "search", "Search")}
            className="pl-9"
            aria-label={text(t, "searchAria", `${label} search`, { label })}
            type="search"
          />
        </div>
      ) : null}
      <select className={selectClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {filtered.map((option) => (
          <option key={option.value} value={option.value}>
            {option.value} — {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ConverterLanding({ onSelect }: { onSelect: (category: ConverterCategory) => void }) {
  const t = useTranslations("tools.everyday-converter");
  const cards: Array<{ id: ConverterCategory; label: string; description: string; icon: LucideIcon }> = [
    { id: "currency", label: text(t, "currency", "Currency"), description: text(t, "categoryCurrencyDescription", "Live exchange rates with a local cache"), icon: TrendingUp },
    ...UNIT_CATEGORY_INFO.map((item) => ({
      id: item.id,
      label: text(t, `category${item.key}`, item.key === "FuelEconomy" ? "Fuel economy" : item.key),
      description: text(t, `category${item.key}Description`, "Local unit conversion"),
      icon: item.icon,
    })),
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            className="group rounded-2xl border border-border/60 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <card.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
              </span>
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="font-semibold">{card.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
          </button>
        ))}
      </div>
      <ToolLimits>
        <p>{text(t, "limits", "Unit conversions run locally. Currency rates come from Frankfurter, then remain available from this browser cache for six hours.")}</p>
      </ToolLimits>
    </div>
  );
}

function UnitConverter({ category, onBack }: { category: UnitCategory; onBack: () => void }) {
  const t = useTranslations("tools.everyday-converter");
  const log = useToolHistory(toolId("everyday-converter"));
  const options = UNIT_CATALOG[category];
  const localizedOptions = useMemo(
    () => options.map((option) => ({ ...option, label: UNIT_MESSAGE_KEYS[option.code] ? text(t, UNIT_MESSAGE_KEYS[option.code], option.label) : option.label })),
    [options, t]
  );
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState<UnitCode>(options[0].code);
  const [to, setTo] = useState<UnitCode>(options[1]?.code ?? options[0].code);
  const [rootFontSizePx, setRootFontSizePx] = useState("16");
  const [parentFontSizePx, setParentFontSizePx] = useState("16");
  const [dpi, setDpi] = useState("96");
  const result = useMemo(() => {
    const value = Number(amount);
    if (!Number.isFinite(value)) return null;
    try {
      return convertUnit(category, value, from, to, {
        rootFontSizePx: Number(rootFontSizePx),
        parentFontSizePx: Number(parentFontSizePx),
        dpi: Number(dpi),
      });
    } catch {
      return null;
    }
  }, [amount, category, dpi, from, parentFontSizePx, rootFontSizePx, to]);
  const presets = ({
    length: [["Metric ↔ imperial", "m", "ft"], ["Kilometers ↔ miles", "km", "mi"]],
    mass: [["Kilograms ↔ pounds", "kg", "lb"]],
    temperature: [["Celsius ↔ Fahrenheit", "C", "F"], ["Celsius ↔ Kelvin", "C", "K"]],
    speed: [["km/h ↔ mph", "km/h", "mph"]],
    duration: [["Hours ↔ minutes", "h", "min"]],
    volume: [["Liters ↔ US gallons", "L", "us-gal"]],
    power: [["Watts ↔ horsepower", "W", "hp"]],
    energy: [["kWh ↔ joules", "kWh", "J"]],
    pressure: [["Bar ↔ PSI", "bar", "psi"]],
    area: [["Square meters ↔ square feet", "m2", "ft2"]],
    data: [["GB ↔ GiB", "GB", "GiB"]],
    angle: [["Degrees ↔ radians", "deg", "rad"]],
    frequency: [["Hz ↔ RPM", "Hz", "rpm"]],
    force: [["Newtons ↔ pound-force", "N", "lbf"]],
    fuelEconomy: [["L/100km ↔ mpg", "L/100km", "mpg-us"]],
    acceleration: [["m/s² ↔ g", "m/s2", "g0"]],
    torque: [["Nm ↔ lb-ft", "Nm", "lb-ft"]],
    electrical: [["Volts ↔ millivolts", "V", "mV"], ["Amps ↔ milliamps", "A", "mA"], ["Ohms ↔ kilohms", "Ohm", "kOhm"]],
    typography: [["px ↔ rem", "px", "rem"], ["px ↔ pt", "px", "pt"]],
  } as Record<UnitCategory, Array<[string, UnitCode, UnitCode]>>)[category] ?? [];
  const setPreset = (nextFrom: UnitCode, nextTo: UnitCode) => {
    setFrom(nextFrom);
    setTo(nextTo);
  };
  return (
    <div className="space-y-5">
      {onBack ? (
        <Button variant="ghost" onClick={onBack} className="-ml-2">
          ← {text(t, "back", "All categories")}
        </Button>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
        <div className="space-y-2">
          <Label>{text(t, "amount", "Amount")}</Label>
          <Input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" className="text-lg" />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={text(t, "swapUnits", "Swap units")}
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          className="justify-self-center"
        >
          <ArrowLeftRight />
        </Button>
        <div className="space-y-2">
          <Label>{text(t, "result", "Result")}</Label>
          <div className="flex h-10 items-center rounded-xl border border-primary/30 bg-primary/5 px-3 text-lg font-semibold">
            {result === null ? "—" : formatNumber(result)}
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SearchableSelect
          label={text(t, "from", "From")}
          value={from}
          options={localizedOptions.map((option) => ({ value: option.code, label: option.label }))}
          onChange={(value) => setFrom(value as UnitCode)}
        />
        <SearchableSelect
          label={text(t, "to", "To")}
          value={to}
          options={localizedOptions.map((option) => ({ value: option.code, label: option.label }))}
          onChange={(value) => setTo(value as UnitCode)}
        />
      </div>
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
            {presets.map(([label, presetFrom, presetTo]) => (
              <Button key={label} type="button" size="sm" variant="outline" onClick={() => setPreset(presetFrom, presetTo)}>
                {label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      <Button
        variant="outline"
        onClick={() => {
          log(`${amount} ${from} → ${to}`, "success");
          toast.success(text(t, "saved", "Conversion saved to history."));
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

export function CurrencyConverter({ onBack, namespace = "tools.everyday-converter" }: { onBack?: () => void; namespace?: "tools.everyday-converter" | "tools.currency-converter" } = {}) {
  const t = useTranslations(namespace);
  const locale = useLocale();
  const toolIdValue = namespace === "tools.currency-converter" ? "currency-converter" : "everyday-converter";
  const log = useToolHistory(toolId(toolIdValue));
  const [amount, setAmount] = useState("100");
  const [base, setBase] = useState("USD");
  const [quote, setQuote] = useState("EUR");
  const [rates, setRates] = useState<CachedRateRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
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
  const output = useMemo(() => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || !match) return base === quote && Number.isFinite(numericAmount) ? numericAmount : null;
    try {
      return convertCurrency(numericAmount, base, quote, rates);
    } catch {
      return null;
    }
  }, [amount, base, match, quote, rates]);
  const effectiveRate = match ? (match.inverted ? 1 / match.rate : match.rate) : base === quote ? 1 : null;

  useEffect(() => {
    let active = true;
    const cached = readCurrencyCache();
    setRates(cached);
    setError("");
    if (base === quote) {
      setLoading(false);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    fetchFrankfurterRates({ base, symbols: [quote] })
      .then((fetched) => {
        if (!active) return;
        const created = createCachedRateRecords(fetched);
        const next = [...cached.filter((record) => !created.some((item) => item.base === record.base && item.quote === record.quote)), ...created];
        setRates(next);
        setUpdatedAt(Date.now());
        window.localStorage.setItem(CURRENCY_CACHE_KEY, JSON.stringify(next));
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Rate service unavailable");
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
      {onBack ? (
        <Button variant="ghost" onClick={onBack} className="-ml-2">
          ← {text(t, "back", "All categories")}
        </Button>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
        <div className="space-y-2">
          <Label>{text(t, "amount", "Amount")}</Label>
          <Input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" className="text-lg" />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={text(t, "swapCurrencies", "Swap currencies")}
          onClick={() => {
            setBase(quote);
            setQuote(base);
          }}
          className="justify-self-center"
        >
          <ArrowLeftRight />
        </Button>
        <div className="space-y-2">
          <Label>{text(t, "result", "Result")}</Label>
          <div className="flex h-10 items-center rounded-xl border border-primary/30 bg-primary/5 px-3 text-lg font-semibold">
            {output === null ? "—" : `${formatNumber(output)} ${quote}`}
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SearchableSelect label={text(t, "from", "From")} value={base} options={currencyOptions} onChange={setBase} />
        <SearchableSelect label={text(t, "to", "To")} value={quote} options={currencyOptions} onChange={setQuote} />
      </div>
      <Card className="overflow-hidden">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-sm text-muted-foreground">{loading ? text(t, "loadingRate", "Loading live rate…") : text(t, "rate", "Exchange rate")}</p>
            <p className="mt-1 text-2xl font-semibold">{effectiveRate === null ? "—" : `1 ${base} = ${formatNumber(effectiveRate, 6)} ${quote}`}</p>
            {match ? (
              <p className={`mt-2 text-xs ${stale ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>
                {stale ? text(t, "stale", "Cached rate is older than six hours; refresh may be needed.") : `${text(t, "asOf", "Rate date")} ${match.record.date}`}
              </p>
            ) : null}
            {error ? <p className="mt-2 text-xs text-destructive">{error}{match ? ` ${text(t, "usingCache", "Using the last cached rate.")}` : ""}</p> : null}
            {updatedAt ? <p className="mt-1 text-xs text-muted-foreground">{text(t, "updated", "Updated just now")} · {locale}</p> : null}
          </div>
          <Button variant="outline" onClick={() => setRefreshToken((value) => value + 1)} disabled={loading} className="sm:self-start">
            <RefreshCw className={loading ? "animate-spin" : ""} /> {text(t, "refresh", "Refresh")}
          </Button>
        </CardContent>
      </Card>
      <Button
        variant="outline"
        onClick={() => {
          log(`${amount} ${base} → ${quote}`, "success", { stale, maxAgeMs: DEFAULT_RATE_MAX_AGE_MS });
          toast.success(text(t, "saved", "Conversion saved to history."));
        }}
      >
        <Check /> {text(t, "record", "Record conversion")}
      </Button>
    </div>
  );
}

export function CurrencyConverterTool() {
  return (
    <ToolShell toolId={toolId("currency-converter")}>
      <CurrencyConverter namespace="tools.currency-converter" />
    </ToolShell>
  );
}

export function EverydayConverter() {
  const [category, setCategory] = useState<ConverterCategory | null>(null);
  return (
    <ToolShell toolId={toolId("everyday-converter")}>
      {category === null ? <ConverterLanding onSelect={setCategory} /> : category === "currency" ? <CurrencyConverter onBack={() => setCategory(null)} /> : <UnitConverter category={category} onBack={() => setCategory(null)} />}
    </ToolShell>
  );
}

export function TextCounter() {
  const t = useTranslations("tools.text-counter");
  const tc = useTranslations("common");
  const locale = useLocale();
  const log = useToolHistory(toolId("text-counter"));
  const [value, setValue] = useState("");
  const metrics = useMemo(() => measureText(value, { locale }), [locale, value]);
  const metricCards = [
    [text(t, "words", "Words"), metrics.words],
    [text(t, "characters", "Characters with spaces"), metrics.characters],
    [text(t, "noSpaces", "Characters without spaces"), metrics.charactersNoSpaces],
    [text(t, "sentences", "Sentences"), metrics.sentences],
    [text(t, "paragraphs", "Paragraphs"), metrics.paragraphs],
    [text(t, "readTime", "Reading time"), metrics.readingTimeSeconds < 60 ? `${metrics.readingTimeSeconds}s` : `${Math.ceil(metrics.readingTimeSeconds / 60)}m`],
  ] as const;
  return (
    <ToolShell toolId={toolId("text-counter")}>
      <ToolLimits>
        <p>{text(t, "limits", "Counts use browser-native Unicode segmentation when available, so emoji and combined characters are handled more naturally.")}</p>
      </ToolLimits>
      <Textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder={text(t, "placeholder", "Paste or type text here to see a live reading profile.")} className="min-h-64 text-base" aria-label={text(t, "input", "Text to count")} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metricCards.map(([label, metric]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{metric}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast.success(text(tc, "copied", "Copied to clipboard"));
          }}
        >
          <Copy /> {text(tc, "copy", "Copy")}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            log(`${metrics.words} words, ${metrics.characters} characters`, "success");
            toast.success(text(t, "saved", "Snapshot saved to history."));
          }}
        >
          <Check /> {text(t, "record", "Record snapshot")}
        </Button>
      </div>
    </ToolShell>
  );
}

export function TimezoneConverter() {
  const t = useTranslations("tools.timezone-converter");
  const locale = useLocale();
  const log = useToolHistory(toolId("timezone-converter"));
  const [localDateTime, setLocalDateTime] = useState(() => formatLocalDateTime(new Date()));
  const [fromZone, setFromZone] = useState("America/Los_Angeles");
  const [toZone, setToZone] = useState("Europe/London");
  const [now, setNow] = useState(() => Date.now());
  const conversion = useMemo(() => {
    try {
      return convertLocalTimeZone(localDateTime, fromZone, toZone, locale);
    } catch {
      return null;
    }
  }, [fromZone, locale, localDateTime, toZone]);
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  const zoneOptions = useMemo(() => {
    const values = cityTimeZones();
    return values.map((value) => ({ value, label: value.replaceAll("_", " ") }));
  }, []);
  const partLabel = (part: { year: number; month: number; day: number; hour: number; minute: number; second: number }) =>
    `${String(part.year).padStart(4, "0")}-${String(part.month).padStart(2, "0")}-${String(part.day).padStart(2, "0")} ${String(part.hour).padStart(2, "0")}:${String(part.minute).padStart(2, "0")}:${String(part.second).padStart(2, "0")}`;
  return (
    <ToolShell toolId={toolId("timezone-converter")}>
      <ToolLimits>
        <p>{text(t, "limits", "Enter a wall-clock time in the source city. Conversion uses IANA time-zone rules, including daylight-saving changes.")}</p>
      </ToolLimits>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2"><Globe2 className="h-5 w-5 text-primary" /> {text(t, "convert", "Convert a date and time")}</CardTitle>
          <CardDescription>{text(t, "convertHint", "Choose a source zone and a destination zone.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 md:items-end">
            <div className="space-y-2">
              <Label>{text(t, "localTime", "Local date and time")}</Label>
              <Input type="datetime-local" value={localDateTime} onChange={(event) => setLocalDateTime(event.target.value)} />
            </div>
            <SearchableSelect label={text(t, "from", "From time zone")} value={fromZone} options={zoneOptions} onChange={setFromZone} />
            <SearchableSelect label={text(t, "to", "To time zone")} value={toZone} options={zoneOptions} onChange={setToZone} />
          </div>
          {conversion ? (
            <div className="grid gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:grid-cols-2">
              <div><p className="text-xs text-muted-foreground">{fromZone}</p><p className="mt-1 font-mono text-lg">{partLabel(conversion.from)}</p></div>
              <div><p className="text-xs text-muted-foreground">{toZone}</p><p className="mt-1 font-mono text-lg">{partLabel(conversion.to)}</p></div>
            </div>
          ) : <p className="text-sm text-destructive">{text(t, "invalid", "Enter a valid local date and time.")}</p>}
          <Button variant="outline" disabled={!conversion} onClick={() => { if (conversion) { log(`${fromZone} → ${toZone}`, "success"); toast.success(text(t, "saved", "Conversion saved to history.")); } }}>
            <Check /> {text(t, "record", "Record conversion")}
          </Button>
        </CardContent>
      </Card>
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div><h2 className="text-lg font-semibold">{text(t, "worldClock", "World clock")}</h2><p className="text-sm text-muted-foreground">{text(t, "worldClockHint", "A quick glance across common workday zones.")}</p></div>
          <Clock3 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CITIES.map((city) => {
            const parts = getTimeZoneParts(now, city.zone, locale);
            const offset = getTimeZoneOffsetMinutes(now, city.zone);
            const sign = offset >= 0 ? "+" : "−";
            const absOffset = Math.abs(offset);
            return (
              <Card key={city.zone}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between"><span className="rounded-lg bg-secondary px-2 py-1 text-xs font-semibold">{city.emoji}</span><span className="text-xs text-muted-foreground">UTC {sign}{Math.floor(absOffset / 60)}:{String(absOffset % 60).padStart(2, "0")}</span></div>
                  <p className="mt-3 font-medium">{text(t, city.key, city.name)}</p>
                  <p className="mt-1 font-mono text-xl font-semibold">{String(parts.hour).padStart(2, "0")}:{String(parts.minute).padStart(2, "0")}:{String(parts.second).padStart(2, "0")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatTimeZone(now, city.zone, { dateStyle: "medium", locale })}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </ToolShell>
  );
}

export function DateCalculator() {
  const t = useTranslations("tools.date-calculator");
  const locale = useLocale();
  const log = useToolHistory(toolId("date-calculator"));
  const [mode, setMode] = useState<"difference" | "add" | "business">("difference");
  const [start, setStart] = useState(() => formatDateInput(new Date()));
  const [end, setEnd] = useState(() => formatDateInput(addDate(new Date(), 30, "days")));
  const [amount, setAmount] = useState("30");
  const [unit, setUnit] = useState<DateUnit>("days");
  const [inclusive, setInclusive] = useState(false);
  const [holidays, setHolidays] = useState("");
  const result = useMemo(() => {
    try {
      const startDate = parseLocalDate(start);
      const endDate = parseLocalDate(end);
      if (mode === "difference") {
        const diff = differenceBetweenDates(startDate, endDate, false);
        return { title: text(t, "elapsedTime", "Elapsed time"), lines: [text(t, "daysResult", `${formatNumber(diff.days, 3)} days`, { value: formatNumber(diff.days, 3) }), text(t, "hoursResult", `${formatNumber(diff.hours, 2)} hours`, { value: formatNumber(diff.hours, 2) }), text(t, "minutesResult", `${formatNumber(diff.minutes, 0)} minutes`, { value: formatNumber(diff.minutes, 0) })] };
      }
      if (mode === "add") {
        const next = addDate(startDate, Number(amount), unit);
        return { title: text(t, "resultDate", "Result date"), lines: [formatDateInput(next), next.toLocaleDateString(locale, { dateStyle: "full" })] };
      }
      const holidayList = holidays.split(",").map((item) => item.trim()).filter(Boolean);
      const business = countBusinessDays(startDate, endDate, { inclusive, holidays: holidayList });
      const calendar = differenceInCalendarDays(startDate, endDate, false);
      return { title: text(t, "businessDays", "Business days"), lines: [text(t, "businessDaysResult", `${business} business days`, { value: business }), text(t, "calendarDaysResult", `${calendar} calendar days`, { value: calendar }), holidayList.length ? text(t, "holidayExclusions", `${holidayList.length} holiday exclusions`, { count: holidayList.length }) : text(t, "noHolidayExclusions", "No holiday exclusions")] };
    } catch {
      return null;
    }
  }, [amount, end, holidays, inclusive, locale, mode, start, t, unit]);
  const addBusiness = () => {
    try {
      const next = addBusinessDays(parseLocalDate(start), Number(amount), holidays.split(",").map((item) => item.trim()).filter(Boolean));
      setEnd(formatDateInput(next));
      toast.success(text(t, "updated", "Date updated."));
    } catch {
      toast.error(text(t, "invalid", "Check the date and amount."));
    }
  };
  return (
    <ToolShell toolId={toolId("date-calculator")}>
      <ToolLimits><p>{text(t, "limits", "Calendar operations use local browser dates. Month and year additions clamp to the last valid day of the target month.")}</p></ToolLimits>
      <div className="flex flex-wrap gap-2">
        {(["difference", "add", "business"] as const).map((item) => (
          <Button key={item} variant={mode === item ? "default" : "outline"} onClick={() => setMode(item)}>
            {item === "difference" ? text(t, "difference", "Difference") : item === "add" ? text(t, "add", "Add to date") : text(t, "business", "Business days")}
          </Button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>{mode === "add" ? text(t, "startDate", "Start date") : text(t, "start", "Start")}</Label><Input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></div>
        {mode === "add" ? <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>{text(t, "amount", "Amount")}</Label><Input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} /></div><div className="space-y-2"><Label>{text(t, "unit", "Unit")}</Label><select className={selectClass} value={unit} onChange={(event) => setUnit(event.target.value as DateUnit)}><option value="days">{text(t, "days", "Days")}</option><option value="weeks">{text(t, "weeks", "Weeks")}</option><option value="months">{text(t, "months", "Months")}</option><option value="years">{text(t, "years", "Years")}</option><option value="hours">{text(t, "hours", "Hours")}</option><option value="minutes">{text(t, "minutes", "Minutes")}</option></select></div></div> : <div className="space-y-2"><Label>{text(t, "endDate", "End date")}</Label><Input type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></div>}
      </div>
      {mode === "business" ? <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-4"><div className="flex items-center gap-3"><Switch checked={inclusive} onCheckedChange={setInclusive} id="inclusive" /><Label htmlFor="inclusive">{text(t, "includeEndpoints", "Include endpoints")}</Label></div><div className="space-y-2"><Label>{text(t, "holidays", "Holidays (comma-separated YYYY-MM-DD)")}</Label><Input value={holidays} onChange={(event) => setHolidays(event.target.value)} placeholder={text(t, "holidaysPlaceholder", "2026-12-25, 2027-01-01")} /></div><Button variant="outline" onClick={addBusiness}><CalendarDays /> {text(t, "addBusinessDays", "Add business days to end")}</Button></div> : null}
      {result ? <Card><CardHeader className="pb-3"><CardTitle>{result.title}</CardTitle></CardHeader><CardContent className="space-y-2">{result.lines.map((line) => <p key={line} className="font-mono text-lg">{line}</p>)}</CardContent></Card> : <p className="text-sm text-destructive">{text(t, "invalid", "Check the date and amount.")}</p>}
      <Button variant="outline" disabled={!result} onClick={() => { if (result) { log(result.lines[0], "success"); toast.success(text(t, "saved", "Calculation saved to history.")); } }}><Check /> Record calculation</Button>
    </ToolShell>
  );
}

export function TipSplitCalculator() {
  const t = useTranslations("tools.tip-split-calculator");
  const log = useToolHistory(toolId("tip-split-calculator"));
  const [subtotal, setSubtotal] = useState("80");
  const [tipPercent, setTipPercent] = useState("18");
  const [taxPercent, setTaxPercent] = useState("0");
  const [people, setPeople] = useState("2");
  const [splitRemainder, setSplitRemainder] = useState(true);
  const result = useMemo(() => {
    try {
      return calculateTip({ subtotal: Number(subtotal), tipPercent: Number(tipPercent), taxPercent: Number(taxPercent), people: Number(people), splitRemainder });
    } catch {
      return null;
    }
  }, [people, splitRemainder, subtotal, taxPercent, tipPercent]);
  return (
    <ToolShell toolId={toolId("tip-split-calculator")}>
      <ToolLimits><p>{text(t, "limits", "Tip and tax are calculated from the subtotal. Rounded shares distribute any remainder to the first people so the split adds back to the total.")}</p></ToolLimits>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[ [text(t, "subtotal", "Subtotal"), subtotal, setSubtotal], [text(t, "tipPercent", "Tip %"), tipPercent, setTipPercent], [text(t, "taxPercent", "Tax %"), taxPercent, setTaxPercent], [text(t, "people", "People"), people, setPeople] ].map(([label, value, setValue]) => <div key={label as string} className="space-y-2"><Label>{label as string}</Label><Input type="number" min="0" step="any" value={value as string} onChange={(event) => (setValue as (value: string) => void)(event.target.value)} /></div>)}
      </div>
      <div className="flex items-center gap-3"><Switch checked={splitRemainder} onCheckedChange={setSplitRemainder} id="split-remainder" /><Label htmlFor="split-remainder">{text(t, "distributeRoundingRemainder", "Distribute rounding remainder")}</Label></div>
      {result ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{text(t, "subtotal", "Subtotal")}</p><p className="mt-2 text-xl font-semibold">{formatMoney(result.subtotal)}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{text(t, "tax", "Tax")}</p><p className="mt-2 text-xl font-semibold">{formatMoney(result.tax)}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{text(t, "tip", "Tip")}</p><p className="mt-2 text-xl font-semibold">{formatMoney(result.tip)}</p></CardContent></Card><Card className="border-primary/40 bg-primary/5"><CardContent className="p-4"><p className="text-xs text-muted-foreground">{text(t, "total", "Total")}</p><p className="mt-2 text-xl font-semibold">{formatMoney(result.total)}</p><p className="mt-1 text-xs text-muted-foreground">{text(t, "perPerson", `${formatMoney(result.perPerson)} each`, { value: formatMoney(result.perPerson) })}</p></CardContent></Card></div> : <p className="text-sm text-destructive">{text(t, "invalid", "Enter non-negative amounts and at least one person.")}</p>}
      {result ? <div className="space-y-2"><h2 className="text-sm font-semibold">{text(t, "individualShares", "Individual shares")}</h2><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{result.shares.map((share, index) => <div key={`${index}-${share}`} className="rounded-xl border border-border/60 bg-card px-3 py-2 text-sm"><span className="text-muted-foreground">{text(t, "person", `Person ${index + 1}`, { number: index + 1 })}</span><span className="float-right font-mono font-semibold">{formatMoney(share)}</span></div>)}</div></div> : null}
      <Button variant="outline" disabled={!result} onClick={() => { if (result) { log(`${people} people · ${formatMoney(result.total)}`, "success"); toast.success(text(t, "saved", "Split saved to history.")); } }}><WalletCards /> Record split</Button>
    </ToolShell>
  );
}

export function StopwatchTimer() {
  const t = useTranslations("tools.stopwatch-timer");
  const log = useToolHistory(toolId("stopwatch-timer"));
  const [mode, setMode] = useState<"stopwatch" | "timer">("stopwatch");
  const [stopwatch, setStopwatch] = useState<StopwatchState>(() => createStopwatch());
  const [timer, setTimer] = useState<TimerState>(() => createTimer(5 * 60 * 1000));
  const [minutes, setMinutes] = useState("5");
  const [seconds, setSeconds] = useState("0");
  const [now, setNow] = useState(() => Date.now());
  const running = mode === "stopwatch" ? stopwatch.status === "running" : timer.status === "running";
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (mode === "timer") setTimer((previous) => tickTimer(previous, current));
    }, 50);
    return () => window.clearInterval(interval);
  }, [mode, running]);
  const elapsed = getStopwatchElapsed(stopwatch, now);
  const remaining = getTimerRemaining(timer, now);
  const duration = Math.max(0, Number(minutes) * 60 * 1000 + Number(seconds) * 1000);
  const toggle = () => {
    const current = Date.now();
    if (mode === "stopwatch") setStopwatch((previous) => previous.status === "running" ? pauseStopwatch(previous, current) : startStopwatch(previous, current));
    else setTimer((previous) => previous.status === "idle" ? startTimer(createTimer(duration), current) : previous.status === "running" ? pauseTimer(previous, current) : startTimer(previous, current));
  };
  const reset = () => {
    if (mode === "stopwatch") setStopwatch(resetStopwatch());
    else setTimer(resetTimer(duration));
    setNow(Date.now());
  };
  return (
    <ToolShell toolId={toolId("stopwatch-timer")}>
      <div className="flex flex-wrap gap-2"><Button variant={mode === "stopwatch" ? "default" : "outline"} onClick={() => setMode("stopwatch")}><TimerReset /> {text(t, "stopwatch", "Stopwatch")}</Button><Button variant={mode === "timer" ? "default" : "outline"} onClick={() => setMode("timer")}><Clock3 /> {text(t, "countdown", "Countdown")}</Button></div>
      <Card className="overflow-hidden"><CardContent className="flex flex-col items-center gap-6 p-6 sm:p-10"><div className={`font-mono text-5xl font-semibold tracking-tight sm:text-7xl ${mode === "timer" && timer.status === "finished" ? "text-destructive" : ""}`}>{mode === "stopwatch" ? formatDuration(elapsed) : formatClock(remaining)}</div>{mode === "timer" ? <div className="grid w-full max-w-sm grid-cols-2 gap-3"><div className="space-y-2"><Label>{text(t, "minutes", "Minutes")}</Label><Input type="number" min="0" value={minutes} onChange={(event) => setMinutes(event.target.value)} disabled={running} /></div><div className="space-y-2"><Label>{text(t, "seconds", "Seconds")}</Label><Input type="number" min="0" max="59" value={seconds} onChange={(event) => setSeconds(event.target.value)} disabled={running} /></div></div> : null}<div className="flex flex-wrap justify-center gap-2"><Button size="lg" onClick={toggle}>{running ? text(t, "pause", "Pause") : mode === "timer" && timer.status === "finished" ? text(t, "finished", "Finished") : text(t, "start", "Start")}</Button><Button size="lg" variant="outline" onClick={reset}><RefreshCw /> {text(t, "reset", "Reset")}</Button></div></CardContent></Card>
      <Button variant="outline" onClick={() => { log(mode === "stopwatch" ? formatDuration(elapsed) : formatClock(remaining), "success"); toast.success(text(t, "saved", "Time saved to history.")); }}><Check /> {text(t, "recordTime", "Record time")}</Button>
    </ToolShell>
  );
}

export function RandomGenerator() {
  const t = useTranslations("tools.random-generator");
  const log = useToolHistory(toolId("random-generator"));
  const [mode, setMode] = useState<"integer" | "decimal" | "boolean" | "pick" | "password">("integer");
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [precision, setPrecision] = useState("2");
  const [items, setItems] = useState("red\nblue\ngreen\nyellow");
  const [length, setLength] = useState("16");
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState("");
  const output = history[0] ?? "";
  const generate = () => {
    try {
      let value: string;
      if (mode === "integer") value = String(randomInteger(Number(min), Number(max)));
      else if (mode === "decimal") value = String(randomDecimal(Number(min), Number(max), { precision: Number(precision) }));
      else if (mode === "boolean") value = String(randomBoolean());
      else if (mode === "pick") {
        const choices = items.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
        value = choices[randomInteger(0, choices.length - 1)];
      } else value = randomPassword({ length: Number(length) });
      setHistory((previous) => [value, ...previous].slice(0, 10));
      setError("");
      log(`${mode}: ${value}`, "success");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text(t, "invalid", "Check the settings."));
      log(`${mode}: failed`, "failed");
    }
  };
  return (
    <ToolShell toolId={toolId("random-generator")}>
      <ToolLimits><p>{text(t, "limits", "Randomness uses the browser's Math.random source. Results are for everyday choices, not cryptographic secrets.")}</p></ToolLimits>
      <div className="flex flex-wrap gap-2">{(["integer", "decimal", "boolean", "pick", "password"] as const).map((item) => <Button key={item} variant={mode === item ? "default" : "outline"} onClick={() => setMode(item)}><Dice5 /> {text(t, item, item[0].toUpperCase() + item.slice(1))}</Button>)}</div>
      {mode === "integer" || mode === "decimal" ? <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>{text(t, "minimum", "Minimum")}</Label><Input type="number" value={min} onChange={(event) => setMin(event.target.value)} /></div><div className="space-y-2"><Label>{text(t, "maximum", "Maximum")}</Label><Input type="number" value={max} onChange={(event) => setMax(event.target.value)} /></div>{mode === "decimal" ? <div className="space-y-2 sm:col-span-2"><Label>{text(t, "precision", "Precision")}</Label><Input type="number" min="0" max="15" value={precision} onChange={(event) => setPrecision(event.target.value)} /></div> : null}</div> : null}
      {mode === "pick" ? <div className="space-y-2"><Label>{text(t, "choices", "Choices, one per line")}</Label><Textarea value={items} onChange={(event) => setItems(event.target.value)} /></div> : null}
      {mode === "password" ? <div className="space-y-2"><Label>{text(t, "passwordLength", "Password length")}</Label><Input type="number" min="1" max="256" value={length} onChange={(event) => setLength(event.target.value)} /></div> : null}
      <ActionBar onRun={generate} loading={false} label={text(t, "run", "Generate")} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {output ? <Card className="border-primary/30 bg-primary/5"><CardContent className="flex items-center justify-between gap-4 p-5"><span className="break-all font-mono text-xl font-semibold">{output}</span><Button size="icon" variant="outline" aria-label={text(t, "copyResult", "Copy result")} onClick={() => { navigator.clipboard.writeText(output); toast.success(text(t, "copy", "Copied")); }}><Copy /></Button></CardContent></Card> : null}
      {history.length > 1 ? <div className="space-y-2"><h2 className="text-sm font-semibold">{text(t, "recentResults", "Recent results")}</h2><div className="space-y-2">{history.slice(1).map((item, index) => <div key={`${item}-${index}`} className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2 font-mono text-sm"><span className="break-all">{item}</span><Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(item); toast.success(text(t, "copy", "Copied")); }}>{text(t, "copy", "Copy")}</Button></div>)}</div></div> : null}
    </ToolShell>
  );
}

export function EverydayImagesToPdf() {
  const t = useTranslations("tools.images-to-pdf");
  const tc = useTranslations("common");
  const log = useToolHistory(toolId("images-to-pdf"));
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const images = [];
      for (const item of files) {
        let bytes = new Uint8Array(await item.file.arrayBuffer());
        let mime = detectImageMime(bytes);
        if (!mime) {
          const { convertImage } = await import("@/lib/image/core");
          const png = await convertImage(item.file, "image/png");
          bytes = new Uint8Array(await png.arrayBuffer());
          mime = "image/png";
        }
        images.push({ bytes, mime });
      }
      const output = await imagesToPdf(images);
      downloadBlob(bytesToBlob(output, "application/pdf"), "images.pdf");
      toast.success(text(t, "success", `Built a PDF from ${files.length} image(s).`, { count: files.length }));
      log(`${files.length} images`, "success");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : text(tc, "error", "Something went wrong"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <ToolShell toolId={toolId("images-to-pdf")}>
      <ToolLimits><p>{text(t, "limits", "Images are converted and assembled locally in this browser. Files are not uploaded.")}</p></ToolLimits>
      <FileDropzone accept="image/*" files={files} onChange={setFiles} reorder />
      <ActionBar onRun={run} loading={loading} label={text(t, "run", "Create PDF")} disabled={!files.length} />
    </ToolShell>
  );
}
