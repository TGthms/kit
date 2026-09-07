"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { amortizationTotal, compoundAmount, monthlyPayment } from "@/lib/converter/loan";
import { formatMoney } from "./calculator-format";
import { ToolShell, useToolHistory } from "./shared";

export function LoanCalculator() {
  const t = useTranslations("tools.loan-calculator");
  const log = useToolHistory("loan-calculator");
  const [mode, setMode] = useState<"loan" | "compound">("loan");
  const [principal, setPrincipal] = useState("250000");
  const [rate, setRate] = useState("5.5");
  const [years, setYears] = useState("30");
  const [compounds, setCompounds] = useState("12");

  const result = useMemo(() => {
    try {
      const p = Number(principal);
      const r = Number(rate);
      const y = Number(years);
      if (mode === "loan") {
        const payment = monthlyPayment({ principal: p, annualRatePercent: r, years: y });
        const total = amortizationTotal(payment, y);
        return { payment, total, interest: total - p, future: null as number | null };
      }
      const future = compoundAmount({
        principal: p,
        annualRatePercent: r,
        years: y,
        compoundsPerYear: Number(compounds) || 12,
      });
      return { payment: null as number | null, total: null as number | null, interest: future - p, future };
    } catch {
      return null;
    }
  }, [compounds, mode, principal, rate, years]);

  return (
    <ToolShell toolId="loan-calculator">
      <p className="text-sm text-muted-foreground">{t("limits")}</p>
      <SegmentedControl
        value={mode}
        aria-label={t("mode")}
        onChange={setMode}
        options={[
          { value: "loan", label: t("modeLoan") },
          { value: "compound", label: t("modeCompound") },
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("principal")}>
          <Input type="number" min="0" step="any" inputMode="decimal" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
        </Field>
        <Field label={t("rate")}>
          <Input type="number" min="0" step="any" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <Field label={t("years")}>
          <Input type="number" min="0" step="any" inputMode="decimal" value={years} onChange={(e) => setYears(e.target.value)} />
        </Field>
        {mode === "compound" ? (
          <Field label={t("compounds")}>
            <Input type="number" min="1" step="1" inputMode="numeric" value={compounds} onChange={(e) => setCompounds(e.target.value)} />
          </Field>
        ) : null}
      </div>
      {result ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {mode === "loan" ? (
            <>
              <div className="rounded-2xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{t("monthly")}</p>
                <p className="mt-1 font-mono text-xl font-semibold">{formatMoney(result.payment!)}</p>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{t("totalPaid")}</p>
                <p className="mt-1 font-mono text-xl font-semibold">{formatMoney(result.total!)}</p>
              </div>
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-xs text-muted-foreground">{t("interest")}</p>
                <p className="mt-1 font-mono text-xl font-semibold">{formatMoney(result.interest)}</p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:col-span-2">
                <p className="text-xs text-muted-foreground">{t("futureValue")}</p>
                <p className="mt-1 font-mono text-xl font-semibold">{formatMoney(result.future!)}</p>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{t("interest")}</p>
                <p className="mt-1 font-mono text-xl font-semibold">{formatMoney(result.interest)}</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-destructive">{t("invalid")}</p>
      )}
      <Button
        variant="outline"
        disabled={!result}
        onClick={() => {
          if (!result) return;
          log(mode === "loan" ? formatMoney(result.payment!) : formatMoney(result.future!), "success");
          toast.success(t("saved"));
        }}
      >
        {t("record")}
      </Button>
    </ToolShell>
  );
}
