"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { explainCron } from "@/lib/text/cron";
import { ToolShell, useToolHistory } from "./shared";

export function CronExplain() {
  const t = useTranslations("tools.cron-explain");
  const tc = useTranslations("common");
  const locale = useLocale();
  const log = useToolHistory("cron-explain");
  const [expr, setExpr] = useState("*/15 9-17 * * 1-5");
  const result = explainCron(expr, locale);

  return (
    <ToolShell toolId="cron-explain">
      <Field label={tc("input")} error={!result.ok ? tc("invalid") : undefined}>
        <Input value={expr} onChange={(e) => setExpr(e.target.value)} className="font-mono" />
      </Field>
      {result.ok ? (
        <section className="space-y-4 rounded-2xl border bg-card p-4 text-sm" aria-label={t("name")}>
          <p className="text-muted-foreground">{t("schedule")}</p>
          <dl className="grid gap-3 sm:grid-cols-2">{result.schedule.map(field => <div key={field.kind}>
            <dt className="font-medium">{t(`field${field.kind}`)} <code dir="ltr" className="ms-2 text-xs text-muted-foreground">{field.source}</code></dt>
            <dd className="mt-1 text-muted-foreground">{field.source === "*" ? tc("allCategories") : field.values.map(value => field.kind === "mon" ? new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2000, value - 1, 15))) : field.kind === "dow" ? new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2000, 0, 2 + value))) : new Intl.NumberFormat(locale).format(value)).join(" · ")}</dd>
          </div>)}</dl>
          {result.dayUnion && <p className="border-t pt-3 text-muted-foreground">{t("dayRule")}</p>}
        </section>
      ) : (
        null
      )}
      <Button
        onClick={() => {
          if (result.ok) {
            toast.success(t("success"));
            log(expr, "success");
          } else {
            toast.error(result.error);
            log("failed", "failed");
          }
        }}
      >
        {t("run")}
      </Button>
    </ToolShell>
  );
}
