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
      <Field label={tc("input")}>
        <Input value={expr} onChange={(e) => setExpr(e.target.value)} className="font-mono" />
      </Field>
      {result.ok ? (
        <p className="rounded-2xl border bg-card p-4 text-sm">{result.text}</p>
      ) : (
        <p className="text-sm text-destructive">{result.error}</p>
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
