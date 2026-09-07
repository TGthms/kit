"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { contrastRatio, parseHex, wcagLevel } from "@/lib/text/contrast";
import { formatNum } from "./calculator-format";
import { ToolShell, useToolHistory } from "./shared";

export function ColorContrast() {
  const t = useTranslations("tools.color-contrast");
  const log = useToolHistory("color-contrast");
  const [fg, setFg] = useState("#111111");
  const [bg, setBg] = useState("#ffffff");

  const result = useMemo(() => {
    try {
      parseHex(fg);
      parseHex(bg);
      const ratio = contrastRatio(fg, bg);
      return { ratio, level: wcagLevel(ratio) };
    } catch {
      return null;
    }
  }, [bg, fg]);

  return (
    <ToolShell toolId="color-contrast">
      <p className="text-sm text-muted-foreground">{t("limits")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Field label={t("foreground")}>
            <Input id="contrast-fg" value={fg} onChange={(e) => setFg(e.target.value)} className="font-mono" />
          </Field>
          <input
            type="color"
            aria-label={t("foreground")}
            className="h-10 w-12 cursor-pointer rounded-xl border bg-background"
            value={/^#[0-9a-fA-F]{6}$/.test(fg) ? fg : "#000000"}
            onChange={(e) => setFg(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Field label={t("background")}>
            <Input id="contrast-bg" value={bg} onChange={(e) => setBg(e.target.value)} className="font-mono" />
          </Field>
          <input
            type="color"
            aria-label={t("background")}
            className="h-10 w-12 cursor-pointer rounded-xl border bg-background"
            value={/^#[0-9a-fA-F]{6}$/.test(bg) ? bg : "#ffffff"}
            onChange={(e) => setBg(e.target.value)}
          />
        </div>
      </div>
      {result ? (
        <>
          <div
            className="rounded-2xl border p-6 text-center text-lg font-medium"
            style={{ color: fg, backgroundColor: bg }}
          >
            {t("preview")}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{t("ratio")}</p>
              <p className="mt-1 font-mono text-2xl font-semibold">{formatNum(result.ratio, 4)}:1</p>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{t("wcag")}</p>
              <p className="mt-1 text-2xl font-semibold">
                {result.level === "fail" ? t("fail") : result.level}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              log(`${formatNum(result.ratio, 3)}:${result.level}`, "success");
              toast.success(t("saved"));
            }}
          >
            {t("record")}
          </Button>
        </>
      ) : (
        <p className="text-sm text-destructive">{t("invalid")}</p>
      )}
    </ToolShell>
  );
}
