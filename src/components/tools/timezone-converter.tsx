"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Clock3, Globe2 } from "lucide-react";
import { notifyHistorySaved } from "@/lib/notify";
import { AnimatedClock } from "@/components/shared/animated-clock";
import { clockFace } from "@/components/shared/clock-face";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  convertLocalTimeZone,
  formatTimeZone,
  getTimeZoneOffsetMinutes,
  getTimeZoneParts,
} from "@/lib/converter/timezone";
import { CITIES, cityTimeZones } from "@/lib/converter/cities";
import { ToolLimits, ToolShell, useToolHistory } from "./shared";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { formatDateInput, text, toolId } from "./everyday-format";

function formatLocalDateTime(value: Date) {
  return `${formatDateInput(value)}T${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
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
