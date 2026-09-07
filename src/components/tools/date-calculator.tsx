"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, Check } from "lucide-react";
import { toast } from "sonner";
import { notifyHistorySaved } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  addBusinessDays,
  addDate,
  countBusinessDays,
  differenceBetweenDates,
  differenceInCalendarDays,
  type DateUnit,
} from "@/lib/converter/date";
import { ToolLimits, ToolShell, useToolHistory } from "./shared";
import { formatDateInput, text, toolId } from "./everyday-format";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function formatNumber(value: number, maximumFractionDigits = 8) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
}

function parseLocalDate(value: string) {
  return new Date(`${value}T12:00:00`);
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
