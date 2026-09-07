"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertBase } from "@/lib/text/base";
import { ToolShell } from "./shared";

export function NumberBase() {
  const t = useTranslations("tools.number-base");
  const [input, setInput] = useState("255");
  const [from, setFrom] = useState(10);
  const [to, setTo] = useState(16);
  const result = convertBase(input, from, to);

  return (
    <ToolShell toolId="number-base">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-3">
          <Label>{t("value")}</Label>
          <Input value={input} onChange={(e) => setInput(e.target.value)} className="font-mono" />
        </div>
        <div className="space-y-2">
          <Label>{t("from")}</Label>
          <Input type="number" min={2} max={36} value={from} onChange={(e) => setFrom(Number(e.target.value) || 10)} />
        </div>
        <div className="space-y-2">
          <Label>{t("to")}</Label>
          <Input type="number" min={2} max={36} value={to} onChange={(e) => setTo(Number(e.target.value) || 16)} />
        </div>
      </div>
      {result.ok ? (
        <div className="rounded-2xl border bg-card p-4 font-mono text-sm">
          <p>{result.value}</p>
          <p className="mt-1 text-muted-foreground">dec {result.decimal}</p>
        </div>
      ) : (
        <p className="text-sm text-destructive">{result.error}</p>
      )}
    </ToolShell>
  );
}
