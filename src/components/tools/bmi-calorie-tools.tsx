"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { HeartPulse } from "lucide-react";
import { notifyHistorySaved } from "@/lib/notify";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ACTIVITY_LEVELS,
  CALORIE_FLOOR,
  calculateBodyStats,
  cmToMeters,
  imperialHeightToMeters,
  kgToLb,
  lbToKg,
  metersToCm,
  metersToImperialHeight,
  roundTo,
  type ActivityLevel,
  type Sex,
  type UnitSystem,
} from "@/lib/converter/bmi";
import type { ToolId } from "@/lib/tools/registry";
import { ToolLimits, ToolShell, useToolHistory } from "./shared";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const toolId = (value: string) => value as ToolId;
type TranslationFn = (key: string, values?: Record<string, string | number>) => string;

function text(t: ReturnType<typeof useTranslations>, key: string, fallback: string, values?: Record<string, string | number>) {
  try {
    const translate = t as unknown as TranslationFn;
    const result = translate(key, values);
    if (!result || result === key || result.endsWith(`.${key}`)) return fallback;
    return result;
  } catch {
    return fallback;
  }
}

const CATEGORY_FALLBACK: Record<string, string> = {
  underweight: "Underweight",
  normal: "Healthy range",
  overweight: "Overweight",
  obese1: "Obesity class I",
  obese2: "Obesity class II",
  obese3: "Obesity class III",
};

const ACTIVITY_FALLBACK: Record<ActivityLevel, { label: string; hint: string }> = {
  sedentary: { label: "Sedentary", hint: "Little or no exercise" },
  light: { label: "Light", hint: "Exercise 1–3 days a week" },
  moderate: { label: "Moderate", hint: "Exercise 3–5 days a week" },
  active: { label: "Active", hint: "Exercise 6–7 days a week" },
  veryActive: { label: "Very active", hint: "Hard exercise or a physical job" },
};

function formatMass(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}

function BmiScale({ bmi, label }: { bmi: number; label: string }) {
  const min = 15;
  const max = 40;
  const pct = Math.min(100, Math.max(0, ((bmi - min) / (max - min)) * 100));
  return (
    <div className="relative pt-1" dir="ltr" role="img" aria-label={label}>
      <div className="flex h-2 overflow-hidden rounded-full">
        <div className="w-[14%] bg-sky-500/70" />
        <div className="w-[26%] bg-emerald-500/70" />
        <div className="w-[20%] bg-amber-500/70" />
        <div className="w-[20%] bg-orange-500/70" />
        <div className="w-[20%] bg-rose-500/70" />
      </div>
      <div
        className="absolute top-0 h-4 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

export function BmiCalorieCalculator() {
  const t = useTranslations("tools.bmi-calorie-calculator");
  const locale = useLocale();
  const log = useToolHistory(toolId("bmi-calorie-calculator"));
  const [system, setSystem] = useState<UnitSystem>("metric");
  const [cm, setCm] = useState("170");
  const [feet, setFeet] = useState("5");
  const [inches, setInches] = useState("7");
  const [kg, setKg] = useState("70");
  const [lb, setLb] = useState("154");
  const [age, setAge] = useState("30");
  const [sex, setSex] = useState<Sex>("female");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");

  const switchSystem = (next: UnitSystem) => {
    if (next === system) return;
    try {
      if (next === "imperial") {
        const heightM = cmToMeters(Number(cm));
        const imperial = metersToImperialHeight(heightM);
        setFeet(String(imperial.feet));
        setInches(String(imperial.inches));
        setLb(String(roundTo(kgToLb(Number(kg)), 1)));
      } else {
        setCm(String(roundTo(metersToCm(imperialHeightToMeters(Number(feet), Number(inches))), 1)));
        setKg(String(roundTo(lbToKg(Number(lb)), 1)));
      }
    } catch {
      // Keep the fields the user already typed; only the unit labels change.
    }
    setSystem(next);
  };

  const result = useMemo(() => {
    try {
      const heightM = system === "metric" ? cmToMeters(Number(cm)) : imperialHeightToMeters(Number(feet), Number(inches));
      const weightKg = system === "metric" ? Number(kg) : lbToKg(Number(lb));
      return calculateBodyStats({
        heightM,
        weightKg,
        ageYears: Number(age),
        sex,
        activity,
      });
    } catch {
      return null;
    }
  }, [activity, age, cm, feet, inches, kg, lb, sex, system]);

  const massUnit = system === "metric" ? text(t, "kg", "kg") : text(t, "lb", "lb");
  const categoryLabel = result ? text(t, result.category, CATEGORY_FALLBACK[result.category]) : "";
  const healthyMin = result
    ? formatMass(system === "metric" ? result.healthyWeightKg.min : kgToLb(result.healthyWeightKg.min), locale)
    : "";
  const healthyMax = result
    ? formatMass(system === "metric" ? result.healthyWeightKg.max : kgToLb(result.healthyWeightKg.max), locale)
    : "";

  return (
    <ToolShell toolId={toolId("bmi-calorie-calculator")}>
      <p className="text-sm text-muted-foreground">
        {text(t, "disclaimer", "Not medical advice. Adult BMI cutoffs and an adult calorie formula.")}
      </p>
      <ToolLimits>
        <p>{text(t, "limits", "BMI uses adult WHO cutoffs. Under 18 is allowed but marked, because child BMI is usually read against growth charts. Calories use the Mifflin-St Jeor equation, which is an adult formula. Results stay on this device and are not medical advice.")}</p>
      </ToolLimits>
      <div className="flex flex-wrap gap-2">
        <Button variant={system === "metric" ? "default" : "outline"} onClick={() => switchSystem("metric")}>
          {text(t, "metric", "Metric")}
        </Button>
        <Button variant={system === "imperial" ? "default" : "outline"} onClick={() => switchSystem("imperial")}>
          {text(t, "imperial", "US / imperial")}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {system === "metric" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="bmi-cm">{text(t, "height", "Height")} ({text(t, "cm", "cm")})</Label>
              <Input id="bmi-cm" type="number" min="50" max="250" step="0.1" inputMode="decimal" value={cm} onChange={(event) => setCm(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bmi-kg">{text(t, "weight", "Weight")} ({text(t, "kg", "kg")})</Label>
              <Input id="bmi-kg" type="number" min="10" max="400" step="0.1" inputMode="decimal" value={kg} onChange={(event) => setKg(event.target.value)} />
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="bmi-ft">{text(t, "height", "Height")} ({text(t, "ft", "ft")})</Label>
                <Input id="bmi-ft" type="number" min="0" max="8" step="1" inputMode="numeric" value={feet} onChange={(event) => setFeet(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bmi-in">{text(t, "in", "in")}</Label>
                <Input id="bmi-in" type="number" min="0" max="72" step="0.1" inputMode="decimal" value={inches} onChange={(event) => setInches(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bmi-lb">{text(t, "weight", "Weight")} ({text(t, "lb", "lb")})</Label>
              <Input id="bmi-lb" type="number" min="22" max="880" step="0.1" inputMode="decimal" value={lb} onChange={(event) => setLb(event.target.value)} />
            </div>
          </>
        )}
        <div className="space-y-2">
          <Label htmlFor="bmi-age">{text(t, "age", "Age")} ({text(t, "years", "years")})</Label>
          <Input id="bmi-age" type="number" min="2" max="120" step="1" inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{text(t, "sex", "Sex")}</Label>
          <div className="flex gap-2">
            {(["female", "male"] as const).map((value) => (
              <Button key={value} type="button" className="flex-1" variant={sex === value ? "default" : "outline"} aria-pressed={sex === value} onClick={() => setSex(value)}>
                {value === "female" ? text(t, "female", "Female") : text(t, "male", "Male")}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bmi-activity">{text(t, "activity", "Activity")}</Label>
          <select id="bmi-activity" className={selectClass} value={activity} onChange={(event) => setActivity(event.target.value as ActivityLevel)}>
            {ACTIVITY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {text(t, level, ACTIVITY_FALLBACK[level].label)} — {text(t, `${level}Hint`, ACTIVITY_FALLBACK[level].hint)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {result ? (
        <div className="space-y-4" aria-live="polite">
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="space-y-3 p-5">
              <p className="text-xs text-muted-foreground">{text(t, "bmi", "BMI")}</p>
              <div className="flex flex-wrap items-baseline gap-3">
                <AnimatedNumber value={result.bmi} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} className="text-4xl font-semibold tracking-tight sm:text-5xl" />
                <p className="text-sm font-medium">{categoryLabel}</p>
                {result.minor ? <Badge variant="outline">{text(t, "minorBadge", "Under 18")}</Badge> : null}
              </div>
              <BmiScale bmi={result.bmi} label={`${text(t, "bmi", "BMI")} ${result.bmi}, ${categoryLabel}${result.minor ? `, ${text(t, "minorBadge", "Under 18")}` : ""}`} />
              {result.minor ? (
                <p className="text-xs text-muted-foreground">
                  {text(t, "minorNote", "Adult BMI cutoffs and the Mifflin-St Jeor calorie formula. Child BMI is usually read against growth charts.")}
                </p>
              ) : null}
            </CardContent>
          </Card>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{text(t, "healthyWeight", "Healthy weight for this height")}</p>
                <p className="mt-2 text-lg font-semibold tabular-nums">
                  {text(t, "healthyWeightValue", `${healthyMin}–${healthyMax} ${massUnit}`, { min: healthyMin, max: healthyMax, unit: massUnit })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{text(t, "bmr", "BMR")}</p>
                <AnimatedNumber value={result.bmr} className="mt-2 text-xl font-semibold" suffix={` ${text(t, "kcal", "kcal")}`} />
                <p className="mt-1 text-xs text-muted-foreground">{text(t, "bmrHint", "Calories at rest")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{text(t, "tdee", "Daily need")}</p>
                <AnimatedNumber value={result.tdee} className="mt-2 text-xl font-semibold" suffix={` ${text(t, "kcal", "kcal")}`} />
                <p className="mt-1 text-xs text-muted-foreground">{text(t, "tdeeHint", "To maintain this weight")}</p>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">{text(t, "goals", "Calorie targets")}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{text(t, "lose", "Lose")}</p>
                  <AnimatedNumber value={result.calories.lose} className="mt-2 text-xl font-semibold" suffix={` ${text(t, "kcal", "kcal")}`} />
                  <p className="mt-1 text-xs text-muted-foreground">{text(t, "loseHint", "About 0.5 kg (1 lb) a week")}</p>
                </CardContent>
              </Card>
              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{text(t, "maintain", "Maintain")}</p>
                  <AnimatedNumber value={result.calories.maintain} className="mt-2 text-xl font-semibold" suffix={` ${text(t, "kcal", "kcal")}`} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{text(t, "gain", "Gain")}</p>
                  <AnimatedNumber value={result.calories.gain} className="mt-2 text-xl font-semibold" suffix={` ${text(t, "kcal", "kcal")}`} />
                  <p className="mt-1 text-xs text-muted-foreground">{text(t, "gainHint", "About 0.5 kg (1 lb) a week")}</p>
                </CardContent>
              </Card>
            </div>
            {result.calories.loseFloored ? (
              <p className="text-xs text-muted-foreground">
                {text(t, "floorNote", "The loss target is floored at {value} kcal so the number stays in a commonly used adult range.", { value: CALORIE_FLOOR })}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-sm text-destructive">{text(t, "invalid", "Enter a realistic height, weight, and age.")}</p>
      )}
      <Button
        variant="outline"
        disabled={!result}
        onClick={() => {
          if (!result) return;
          log(`BMI ${result.bmi} · ${result.tdee} kcal`, "success");
          notifyHistorySaved(text(t, "saved", "Saved to history."), text(t, "historyOff", "History is off, so this wasn’t saved."));
        }}
      >
        <HeartPulse /> {text(t, "record", "Record calculation")}
      </Button>
    </ToolShell>
  );
}
