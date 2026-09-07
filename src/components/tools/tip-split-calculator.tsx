"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { WalletCards } from "lucide-react";
import { notifyHistorySaved } from "@/lib/notify";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { calculateTip } from "@/lib/converter/tip";
import { ToolLimits, ToolShell, useToolHistory } from "./shared";
import { text, toolId } from "./everyday-format";

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
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
