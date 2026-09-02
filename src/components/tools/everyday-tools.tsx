"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CalendarDays,
  Check,
  Clock3,
  Dice5,
  Globe2,
  RefreshCw,
  TimerReset,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { notifyHistorySaved } from "@/lib/notify";
import { AnimatedClock } from "@/components/shared/animated-clock";
import { clockFace } from "@/components/shared/clock-face";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
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
import { measureText } from "@/lib/converter/text-counter";
import {
  convertLocalTimeZone,
  formatTimeZone,
  getTimeZoneOffsetMinutes,
  getTimeZoneParts,
} from "@/lib/converter/timezone";
import { calculateTip } from "@/lib/converter/tip";
import {
  cryptoRandom,
  MAX_RANDOM_BATCH,
  randomBoolean,
  randomDecimals,
  randomIntegers,
  randomPassword,
  randomPick,
  randomResultSummary,
  randomUnique,
  type RecordableRandomMode,
} from "@/lib/converter/random";
import {
  createStopwatch,
  createTimer,
  durationFromHms,
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
  downloadText,
} from "@/lib/utils";
import { imagesToPdf } from "@/lib/pdf/core";
import type { ToolId } from "@/lib/tools/registry";
import { ActionBar, DownloadResult, ToolLimits, ToolShell, useToolHistory } from "./shared";
import { SearchableSelect } from "@/components/ui/searchable-select";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
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

function durationParts(milliseconds: number) {
  const totalCentiseconds = Math.floor(Math.max(0, milliseconds) / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  return { hours, minutes, seconds, centiseconds };
}

function formatDuration(milliseconds: number, showHours = true) {
  const { hours, minutes, seconds, centiseconds } = durationParts(milliseconds);
  return `${showHours ? `${String(hours).padStart(2, "0")}:` : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function clockParts(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return { hours, minutes, seconds };
}

function formatClock(milliseconds: number) {
  const { hours, minutes, seconds } = clockParts(milliseconds);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function TextCounter() {
  const t = useTranslations("tools.text-counter");
  const locale = useLocale();
  const log = useToolHistory(toolId("text-counter"));
  const [value, setValue] = useState("");
  const metrics = useMemo(() => measureText(value, { locale }), [locale, value]);
  const metricCards: Array<{ label: string; value: number; suffix?: string }> = [
    { label: text(t, "words", "Words"), value: metrics.words },
    { label: text(t, "characters", "Characters with spaces"), value: metrics.characters },
    { label: text(t, "noSpaces", "Characters without spaces"), value: metrics.charactersNoSpaces },
    { label: text(t, "sentences", "Sentences"), value: metrics.sentences },
    { label: text(t, "paragraphs", "Paragraphs"), value: metrics.paragraphs },
    {
      label: text(t, "readTime", "Reading time"),
      value: metrics.readingTimeSeconds < 60 ? metrics.readingTimeSeconds : Math.ceil(metrics.readingTimeSeconds / 60),
      suffix: metrics.readingTimeSeconds < 60 ? "s" : "m",
    },
  ];
  return (
    <ToolShell toolId={toolId("text-counter")}>
      <ToolLimits>
        <p>{text(t, "limits", "Counts use browser-native Unicode segmentation when available, so emoji and combined characters are handled more naturally.")}</p>
      </ToolLimits>
      <Textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder={text(t, "placeholder", "Paste or type text here to see a live reading profile.")} className="min-h-64 text-base" aria-label={text(t, "input", "Text to count")} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metricCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <AnimatedNumber
                value={card.value}
                suffix={card.suffix}
                className="mt-2 text-2xl font-semibold tracking-tight"
              />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <CopyButton value={value} />
        <Button
          variant="outline"
          onClick={() => {
            log(`${metrics.words} words, ${metrics.characters} characters`, "success");
            notifyHistorySaved(text(t, "saved", "Snapshot saved to history."), text(t, "historyOff", "History is off, so this wasn’t saved."));
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
        <p>{text(t, "limits", "Live times use the browser clock and IANA time-zone rules, including daylight-saving changes. Advanced conversion lets you compare a specific local date and time across zones.")}</p>
      </ToolLimits>
      <details className="rounded-2xl border border-border/60 bg-card px-4 py-3">
        <summary className="cursor-pointer select-none font-medium text-foreground">{text(t, "advancedConversion", "Advanced: time zone conversion")}</summary>
        <p className="mt-2 text-sm text-muted-foreground">{text(t, "advancedConversionHint", "Compare a specific local date and time across two time zones.")}</p>
        <Card className="mt-4">
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
            <Button variant="outline" disabled={!conversion} onClick={() => { if (conversion) { log(`${fromZone} → ${toZone}`, "success"); notifyHistorySaved(text(t, "saved", "Conversion saved to history."), text(t, "historyOff", "History is off, so this wasn’t saved.")); } }}>
              <Check /> {text(t, "record", "Record conversion")}
            </Button>
          </CardContent>
        </Card>
      </details>
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <p className="text-sm text-muted-foreground">{text(t, "worldClockHint", "A quick glance across common workday zones.")}</p>
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
                  <AnimatedClock
                    hours={parts.hour}
                    minutes={parts.minute}
                    seconds={parts.second}
                    trend={1}
                    label={clockFace(parts.hour, parts.minute, parts.second)}
                    className="mt-1 justify-start font-mono text-xl font-semibold tracking-tight"
                  />
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
      <Button variant="outline" disabled={!result} onClick={() => { if (result) { log(result.lines[0], "success"); notifyHistorySaved(text(t, "saved", "Calculation saved to history."), text(t, "historyOff", "History is off, so this wasn’t saved.")); } }}><Check /> {text(t, "recordCalculation", "Record calculation")}</Button>
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
      {result ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              [text(t, "subtotal", "Subtotal"), result.subtotal],
              [text(t, "tax", "Tax"), result.tax],
              [text(t, "tip", "Tip"), result.tip],
            ] as const
          ).map(([label, value]) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <AnimatedNumber
                  value={value}
                  format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                  className="mt-2 text-xl font-semibold"
                />
              </CardContent>
            </Card>
          ))}
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{text(t, "total", "Total")}</p>
              <AnimatedNumber
                value={result.total}
                format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                className="mt-2 text-xl font-semibold"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {text(t, "perPerson", `${formatMoney(result.perPerson)} each`, { value: formatMoney(result.perPerson) })}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <p className="text-sm text-destructive">{text(t, "invalid", "Enter non-negative amounts and at least one person.")}</p>
      )}
      {result ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">{text(t, "individualShares", "Individual shares")}</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {result.shares.map((share, index) => (
              <div key={`${index}-${share}`} className="rounded-xl border border-border/60 bg-card px-3 py-2 text-sm">
                <span className="text-muted-foreground">{text(t, "person", `Person ${index + 1}`, { number: index + 1 })}</span>
                <AnimatedNumber
                  value={share}
                  format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                  className="float-right font-mono font-semibold"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <Button variant="outline" disabled={!result} onClick={() => { if (result) { log(`${people} people · ${formatMoney(result.total)}`, "success"); notifyHistorySaved(text(t, "saved", "Split saved to history."), text(t, "historyOff", "History is off, so this wasn’t saved.")); } }}><WalletCards /> {text(t, "recordSplit", "Record split")}</Button>
    </ToolShell>
  );
}

export function StopwatchTimer() {
  const t = useTranslations("tools.stopwatch-timer");
  const log = useToolHistory(toolId("stopwatch-timer"));
  const [mode, setMode] = useState<"stopwatch" | "timer">("stopwatch");
  const [stopwatch, setStopwatch] = useState<StopwatchState>(() => createStopwatch());
  const [timer, setTimer] = useState<TimerState>(() => createTimer(5 * 60 * 1000));
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("5");
  const [seconds, setSeconds] = useState("0");
  const [now, setNow] = useState(() => Date.now());
  const running = mode === "stopwatch" ? stopwatch.status === "running" : timer.status === "running";
  const duration = durationFromHms(Number(hours), Number(minutes), Number(seconds));
  const fieldsLocked = mode === "timer" && timer.status !== "idle";
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (mode === "timer") setTimer((previous) => tickTimer(previous, current));
    }, 50);
    return () => window.clearInterval(interval);
  }, [mode, running]);
  if (mode === "timer" && timer.status === "idle" && timer.durationMs !== duration) {
    setTimer(createTimer(duration));
  }
  const elapsed = getStopwatchElapsed(stopwatch, now);
  const remaining = getTimerRemaining(timer, now);
  const stopwatchParts = durationParts(elapsed);
  const timerParts = clockParts(remaining);
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
      <SegmentedControl
        value={mode}
        aria-label={`${text(t, "stopwatch", "Stopwatch")} / ${text(t, "countdown", "Countdown")}`}
        onChange={(next) => setMode(next)}
        options={[
          { value: "stopwatch", label: text(t, "stopwatch", "Stopwatch"), icon: TimerReset },
          { value: "timer", label: text(t, "countdown", "Countdown"), icon: Clock3 },
        ]}
      />
      <Card className="overflow-hidden"><CardContent className="flex flex-col items-center gap-6 p-6 sm:p-10">{mode === "stopwatch" ? (
        <AnimatedClock
          hours={stopwatchParts.hours}
          minutes={stopwatchParts.minutes}
          seconds={stopwatchParts.seconds}
          fraction={String(stopwatchParts.centiseconds).padStart(2, "0")}
          label={formatDuration(elapsed)}
          trend={stopwatch.status === "running" ? 1 : 0}
          className="font-mono text-5xl font-semibold tracking-tight sm:text-7xl"
        />
      ) : (
        <AnimatedClock
          hours={timerParts.hours}
          minutes={timerParts.minutes}
          seconds={timerParts.seconds}
          label={formatClock(remaining)}
          trend={timer.status === "running" ? -1 : 0}
          className={`font-mono text-5xl font-semibold tracking-tight sm:text-7xl ${timer.status === "finished" ? "text-destructive" : ""}`}
        />
      )}{mode === "timer" ? <div className="grid w-full max-w-md grid-cols-3 gap-3"><div className="space-y-2"><Label>{text(t, "hours", "Hours")}</Label><Input type="number" min="0" inputMode="numeric" value={hours} onChange={(event) => setHours(event.target.value)} disabled={fieldsLocked} /></div><div className="space-y-2"><Label>{text(t, "minutes", "Minutes")}</Label><Input type="number" min="0" max="59" inputMode="numeric" value={minutes} onChange={(event) => setMinutes(event.target.value)} disabled={fieldsLocked} /></div><div className="space-y-2"><Label>{text(t, "seconds", "Seconds")}</Label><Input type="number" min="0" max="59" inputMode="numeric" value={seconds} onChange={(event) => setSeconds(event.target.value)} disabled={fieldsLocked} /></div></div> : null}<div className="flex flex-wrap justify-center gap-2"><Button size="lg" onClick={toggle}>{running ? text(t, "pause", "Pause") : mode === "timer" && timer.status === "finished" ? text(t, "finished", "Finished") : text(t, "start", "Start")}</Button><Button size="lg" variant="outline" onClick={reset}><RefreshCw /> {text(t, "reset", "Reset")}</Button></div></CardContent></Card>
      {mode === "stopwatch" ? <Button variant="outline" onClick={() => { log(formatDuration(elapsed), "success"); notifyHistorySaved(text(t, "saved", "Time saved to history."), text(t, "historyOff", "History is off, so this wasn’t saved.")); }}><Check /> {text(t, "recordTime", "Record time")}</Button> : null}
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
  const [step, setStep] = useState("1");
  const [count, setCount] = useState("1");
  const [unique, setUnique] = useState(false);
  const [items, setItems] = useState("red\nblue\ngreen\nyellow");
  const [length, setLength] = useState("16");
  const [values, setValues] = useState<string[]>([]);
  const [shown, setShown] = useState<number[]>([]);
  const [error, setError] = useState("");
  const roll = useRef(0);
  const batch = Math.min(MAX_RANDOM_BATCH, Math.max(1, Number(count) || 1));
  const generate = () => {
    try {
      let next: string[] = [];
      if (mode === "integer") {
        next = randomIntegers(Number(min), Number(max), { count: batch, unique, step: Number(step) || 1 }).map(String);
      } else if (mode === "decimal") {
        next = randomDecimals(Number(min), Number(max), { count: batch, precision: Number(precision) }).map(String);
      } else if (mode === "boolean") {
        next = Array.from({ length: batch }, () => String(randomBoolean()));
      } else if (mode === "pick") {
        const choices = items.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
        next = unique ? randomUnique(choices, batch) : Array.from({ length: batch }, () => randomPick(choices));
      } else {
        next = Array.from({ length: batch }, () => randomPassword({ length: Number(length), rng: cryptoRandom }));
      }
      setValues(next);
      setError("");
      const numericNext = mode === "integer" || mode === "decimal";
      const id = ++roll.current;
      if (numericNext) {
        const nums = next.map(Number);
        const reduce = nums.length > 10 || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) setShown(nums);
        else {
          setShown(nums.map(() => 0));
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              if (roll.current === id) setShown(nums);
            });
          });
        }
      } else {
        setShown([]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : text(t, "invalid", "Check the settings."));
      log(`${mode}: failed`, "failed");
    }
  };
  const joined = values.join("\n");
  const numeric = mode === "integer" || mode === "decimal";
  const numberFormat = mode === "decimal"
    ? { minimumFractionDigits: Number(precision) || 0, maximumFractionDigits: Number(precision) || 0 }
    : undefined;
  return (
    <ToolShell toolId={toolId("random-generator")}>
      <ToolLimits>
        <p>{text(t, "limits", "Everyday picks use the browser random source. Passwords use a cryptographic generator on this device. Not a substitute for a password manager.")}</p>
      </ToolLimits>
      <div className="flex flex-wrap gap-2">
        {(["integer", "decimal", "boolean", "pick", "password"] as const).map((item) => (
          <Button key={item} variant={mode === item ? "default" : "outline"} onClick={() => setMode(item)}>
            <Dice5 /> {text(t, item, item[0].toUpperCase() + item.slice(1))}
          </Button>
        ))}
      </div>
      {mode === "integer" || mode === "decimal" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{text(t, "minimum", "Minimum")}</Label>
            <Input type="number" value={min} onChange={(event) => setMin(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{text(t, "maximum", "Maximum")}</Label>
            <Input type="number" value={max} onChange={(event) => setMax(event.target.value)} />
          </div>
          {mode === "integer" ? (
            <div className="space-y-2">
              <Label>{text(t, "step", "Count by")}</Label>
              <Input type="number" min="1" value={step} onChange={(event) => setStep(event.target.value)} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{text(t, "precision", "Decimal places")}</Label>
              <Input type="number" min="0" max="15" value={precision} onChange={(event) => setPrecision(event.target.value)} />
            </div>
          )}
        </div>
      ) : null}
      {mode === "pick" ? (
        <div className="space-y-2">
          <Label>{text(t, "choices", "Choices, one per line")}</Label>
          <Textarea value={items} onChange={(event) => setItems(event.target.value)} />
        </div>
      ) : null}
      {mode === "password" ? (
        <div className="space-y-2">
          <Label>{text(t, "passwordLength", "Password length")}</Label>
          <Input type="number" min="1" max="256" value={length} onChange={(event) => setLength(event.target.value)} />
        </div>
      ) : null}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <p className="mb-3 text-sm font-medium">{text(t, "batch", "Batch")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{text(t, "count", "How many")}</Label>
            <Input type="number" min="1" max={MAX_RANDOM_BATCH} value={count} onChange={(event) => setCount(event.target.value)} />
          </div>
          {mode === "integer" || mode === "pick" ? (
            <div className="flex items-end pb-1">
              <label htmlFor="random-unique" className="flex items-center gap-2 text-sm">
                <Switch id="random-unique" checked={unique} onCheckedChange={setUnique} />
                {text(t, "unique", "No repeats")}
              </label>
            </div>
          ) : <p className="self-end text-xs text-muted-foreground">{text(t, "countHint", `Up to ${MAX_RANDOM_BATCH} at once.`, { max: MAX_RANDOM_BATCH })}</p>}
        </div>
      </div>
      <ActionBar onRun={generate} loading={false} label={batch > 1 ? `${text(t, "run", "Generate")} · ${batch}` : text(t, "run", "Generate")} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {values.length ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-4 p-5">
            {numeric && shown.length ? (
              shown.length === 1 ? (
                <AnimatedNumber
                  value={shown[0]}
                  format={numberFormat}
                  className="break-all font-mono text-4xl font-semibold tracking-tight sm:text-5xl"
                />
              ) : (
                <div className="flex max-h-72 flex-wrap content-start gap-2 overflow-auto">
                  {shown.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex h-14 min-w-[4.25rem] items-center justify-center rounded-xl border border-primary/20 bg-background px-3 font-mono text-xl font-semibold tabular-nums"
                    >
                      {shown.length > 10
                        ? (numberFormat ? item.toFixed(numberFormat.minimumFractionDigits ?? 0) : item)
                        : <AnimatedNumber value={item} format={numberFormat} />}
                    </span>
                  ))}
                </div>
              )
            ) : (
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all font-mono text-sm leading-6">{joined}</pre>
            )}
            <div className="flex flex-wrap gap-2">
              <CopyButton value={joined} size="sm" />
              {values.length > 1 ? (
                <Button variant="outline" size="sm" onClick={() => downloadText(joined, "random.txt")}>
                  {text(t, "download", "Download list")}
                </Button>
              ) : null}
              {mode !== "password" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    log(randomResultSummary(mode as RecordableRandomMode, values), "success");
                    notifyHistorySaved(text(t, "saved", "Saved to history."), text(t, "historyOff", "History is off, so this wasn’t saved."));
                  }}
                >
                  <Check /> {text(t, "record", "Record result")}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </ToolShell>
  );
}

export function EverydayImagesToPdf() {
  const t = useTranslations("tools.images-to-pdf");
  const tc = useTranslations("common");
  const log = useToolHistory(toolId("images-to-pdf"));
  const [files, setFiles] = useState<FileItem[]>([]);
  const [pageSize, setPageSize] = useState<"a4" | "image">("a4");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const { convertImage } = await import("@/lib/image/core");
      const images = [];
      for (const item of files) {
        // Decode through canvas so EXIF orientation is applied (raw JPEG
        // bytes would otherwise land sideways from many phones).
        const png = await convertImage(item.file, "image/png");
        images.push({ bytes: new Uint8Array(await png.arrayBuffer()), mime: "image/png" as const });
      }
      const output = await imagesToPdf(images, { pageSize, margin: 24 });
      const blob = bytesToBlob(output, "application/pdf");
      downloadBlob(blob, "images.pdf");
      setResult({ blob, name: "images.pdf" });
      toast.success(text(t, "success", `Built a PDF from ${files.length} images.`, { count: files.length }));
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
      <ToolLimits><p>{text(t, "limits", "Images are converted and assembled locally in this browser. Files are not uploaded. A4 fit is the default; original size keeps each page as large as the photo.")}</p></ToolLimits>
      <FileDropzone accept="image/*" files={files} onChange={setFiles} reorder />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={pageSize === "a4" ? "default" : "outline"} onClick={() => setPageSize("a4")}>
          {text(t, "fitA4", "Fit to A4")}
        </Button>
        <Button type="button" variant={pageSize === "image" ? "default" : "outline"} onClick={() => setPageSize("image")}>
          {text(t, "fitImage", "Original size")}
        </Button>
      </div>
      <ActionBar onRun={run} loading={loading} label={text(t, "run", "Create PDF")} disabled={!files.length} />
      <DownloadResult file={result} />
    </ToolShell>
  );
}
