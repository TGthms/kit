"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertColor, hslToRgb, rgbToHex } from "@/lib/text/color";
import { ToolShell, useToolHistory } from "./shared";

export function ColorConvert() {
  const t = useTranslations("tools.color-convert");
  const tc = useTranslations("common");
  const log = useToolHistory("color-convert");
  const [hex, setHex] = useState("#0a84ff");
  const parsed = convertColor(hex);

  return (
    <ToolShell toolId="color-convert">
      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
        <input
          type="color"
          aria-label={t("picker")}
          className="h-12 w-16 cursor-pointer rounded-xl border bg-background"
          value={parsed?.hex ?? "#000000"}
          onChange={(e) => {
            setHex(e.target.value);
            log("pick", "success");
          }}
        />
        <div className="space-y-2">
          <Label>HEX</Label>
          <Input value={hex} onChange={(e) => setHex(e.target.value)} className="font-mono" />
        </div>
      </div>
      {parsed ? (
        <div className="grid gap-2 rounded-2xl border bg-card p-4 text-sm">
          <p>
            <strong>RGB</strong> {parsed.cssRgb}
          </p>
          <p>
            <strong>HSL</strong> {parsed.cssHsl}
          </p>
          <p>
            <strong>HSV</strong> {Math.round(parsed.hsv.h)}°, {Math.round(parsed.hsv.s)}%, {Math.round(parsed.hsv.v)}%
          </p>
          <CopyButton value={parsed.hex} label={`${tc("copy")} ${parsed.hex}`} />
        </div>
      ) : (
        <p className="text-sm text-destructive">{t("invalid")}</p>
      )}
      <p className="sr-only">
        {parsed ? rgbToHex(hslToRgb(parsed.hsl)) : ""}
      </p>
    </ToolShell>
  );
}
