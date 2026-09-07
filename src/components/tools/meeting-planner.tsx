"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { overlapWindows } from "@/lib/converter/meeting";
import { cityTimeZones } from "@/lib/converter/cities";
import { todayIso } from "./calculator-format";
import { ToolShell, useToolHistory } from "./shared";

export function MeetingPlanner() {
  const t = useTranslations("tools.meeting-planner");
  const log = useToolHistory("meeting-planner");
  const zoneOptions = useMemo(
    () => cityTimeZones().map((value) => ({ value, label: value.replaceAll("_", " ") })),
    []
  );
  const [date, setDate] = useState(todayIso);
  const [zones, setZones] = useState<string[]>(["America/Los_Angeles", "Europe/London"]);
  const [workStart, setWorkStart] = useState("9");
  const [workEnd, setWorkEnd] = useState("17");
  const [utcStart, setUtcStart] = useState("0");
  const [utcEnd, setUtcEnd] = useState("23");

  const windows = useMemo(() => {
    try {
      return overlapWindows({
        zones,
        date,
        startHour: Number(utcStart),
        endHour: Number(utcEnd),
        workStart: Number(workStart),
        workEnd: Number(workEnd),
      });
    } catch {
      return null;
    }
  }, [date, utcEnd, utcStart, workEnd, workStart, zones]);

  const setZoneAt = (index: number, value: string) => {
    setZones((prev) => prev.map((z, i) => (i === index ? value : z)));
  };

  return (
    <ToolShell toolId="meeting-planner">
      <p className="text-sm text-muted-foreground">{t("limits")}</p>
      <Field label={t("date")}>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <div className="space-y-3">
        {zones.map((zone, index) => (
          <div key={`${index}-${zone}`} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <SearchableSelect
                label={t("zone", { number: index + 1 })}
                value={zone}
                options={zoneOptions}
                onChange={(value) => setZoneAt(index, value)}
              />
            </div>
            {zones.length > 2 ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t("removeZone")}
                onClick={() => setZones((prev) => prev.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setZones((prev) => [...prev, "Asia/Tokyo"])} disabled={zones.length >= 6}>
          <Plus className="h-4 w-4" /> {t("addZone")}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t("workStart")}>
          <Input type="number" min={0} max={23} value={workStart} onChange={(e) => setWorkStart(e.target.value)} />
        </Field>
        <Field label={t("workEnd")}>
          <Input type="number" min={1} max={24} value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} />
        </Field>
        <Field label={t("utcStart")}>
          <Input type="number" min={0} max={23} value={utcStart} onChange={(e) => setUtcStart(e.target.value)} />
        </Field>
        <Field label={t("utcEnd")}>
          <Input type="number" min={0} max={23} value={utcEnd} onChange={(e) => setUtcEnd(e.target.value)} />
        </Field>
      </div>
      {windows === null ? (
        <p className="text-sm text-destructive">{t("invalid")}</p>
      ) : windows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("none")}</p>
      ) : (
        <ul className="space-y-2">
          {windows.map((w) => (
            <li key={w.utcIso} className="rounded-2xl border bg-card p-3 text-sm">
              <p className="font-medium">
                {t("utcHour", { hour: String(w.utcHour).padStart(2, "0") })}
              </p>
              <p className="mt-1 text-muted-foreground">
                {zones.map((z) => `${z.split("/").pop()?.replaceAll("_", " ")} ${String(w.localHours[z]).padStart(2, "0")}:00`).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}
      <Button
        variant="outline"
        disabled={!windows || windows.length === 0}
        onClick={() => {
          if (!windows?.length) return;
          log(`${windows.length} windows`, "success");
          toast.success(t("saved"));
        }}
      >
        {t("record")}
      </Button>
    </ToolShell>
  );
}
