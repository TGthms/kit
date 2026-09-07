"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { applyPercentChange, changePercent, percentOf, whatPercent } from "@/lib/converter/percentage";
import { formatNum } from "./calculator-format";
import { ToolShell, useToolHistory } from "./shared";

export function PercentageCalculator() {
  const t = useTranslations("tools.percentage-calculator");
  const log = useToolHistory("percentage-calculator");
  const [mode, setMode] = useState<"of" | "what" | "change" | "apply">("of");
  const [a, setA] = useState("20");
  const [b, setB] = useState("50");

  const result = useMemo(() => {
    try {
      const x = Number(a);
      const y = Number(b);
      if (mode === "of") return { label: t("resultOf"), value: percentOf(x, y), suffix: "" };
      if (mode === "what") return { label: t("resultWhat"), value: whatPercent(x, y), suffix: "%" };
      if (mode === "change") return { label: t("resultChange"), value: changePercent(x, y), suffix: "%" };
      return { label: t("resultApply"), value: applyPercentChange(x, y), suffix: "" };
    } catch {
      return null;
    }
  }, [a, b, mode, t]);

  return (
    <ToolShell toolId="percentage-calculator">
      <SegmentedControl
        value={mode}
        aria-label={t("mode")}
        onChange={setMode}
        options={[
          { value: "of", label: t("modeOf") },
          { value: "what", label: t("modeWhat") },
          { value: "change", label: t("modeChange") },
          { value: "apply", label: t("modeApply") },
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={mode === "of" || mode === "apply" ? t("percent") : mode === "what" ? t("part") : t("from")}>
          <Input type="number" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} />
        </Field>
        <Field label={mode === "of" ? t("whole") : mode === "what" ? t("whole") : mode === "change" ? t("to") : t("changePercent")}>
          <Input type="number" inputMode="decimal" value={b} onChange={(e) => setB(e.target.value)} />
        </Field>
      </div>
      {result ? (
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">{result.label}</p>
          <p className="mt-1 font-mono text-2xl font-semibold">
            {formatNum(result.value)}
            {result.suffix}
          </p>
          <Button
            className="mt-3"
            variant="outline"
            onClick={() => {
              log(`${mode}:${formatNum(result.value)}`, "success");
              toast.success(t("saved"));
            }}
          >
            {t("record")}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-destructive">{t("invalid")}</p>
      )}
    </ToolShell>
  );
}
