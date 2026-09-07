"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { missingSide, parseRatio, ratioFromSize } from "@/lib/converter/aspect-ratio";
import { formatNum } from "./calculator-format";
import { ToolShell, useToolHistory } from "./shared";

export function AspectRatioTool() {
  const t = useTranslations("tools.aspect-ratio");
  const log = useToolHistory("aspect-ratio");
  const [mode, setMode] = useState<"fromSize" | "missing">("fromSize");
  const [width, setWidth] = useState("1920");
  const [height, setHeight] = useState("1080");
  const [ratioText, setRatioText] = useState("16:9");
  const [known, setKnown] = useState<"width" | "height">("width");
  const [knownValue, setKnownValue] = useState("1920");

  const fromSize = useMemo(() => {
    try {
      return ratioFromSize(Number(width), Number(height));
    } catch {
      return null;
    }
  }, [height, width]);

  const missing = useMemo(() => {
    try {
      const ratio = parseRatio(ratioText);
      return missingSide({
        ratioW: ratio.w,
        ratioH: ratio.h,
        ...(known === "width" ? { width: Number(knownValue) } : { height: Number(knownValue) }),
      });
    } catch {
      return null;
    }
  }, [known, knownValue, ratioText]);

  return (
    <ToolShell toolId="aspect-ratio">
      <SegmentedControl
        value={mode}
        aria-label={t("mode")}
        onChange={setMode}
        options={[
          { value: "fromSize", label: t("modeFromSize") },
          { value: "missing", label: t("modeMissing") },
        ]}
      />
      {mode === "fromSize" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("width")}>
              <Input type="number" min="0" step="any" value={width} onChange={(e) => setWidth(e.target.value)} />
            </Field>
            <Field label={t("height")}>
              <Input type="number" min="0" step="any" value={height} onChange={(e) => setHeight(e.target.value)} />
            </Field>
          </div>
          {fromSize ? (
            <div className="rounded-2xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{t("ratio")}</p>
              <p className="mt-1 font-mono text-2xl font-semibold">
                {fromSize.w}:{fromSize.h}
              </p>
              <Button
                className="mt-3"
                variant="outline"
                onClick={() => {
                  log(`${fromSize.w}:${fromSize.h}`, "success");
                  toast.success(t("saved"));
                }}
              >
                {t("record")}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-destructive">{t("invalid")}</p>
          )}
        </>
      ) : (
        <>
          <Field label={t("ratioInput")}>
            <Input value={ratioText} onChange={(e) => setRatioText(e.target.value)} placeholder="16:9" className="font-mono" />
          </Field>
          <SegmentedControl
            value={known}
            aria-label={t("knownSide")}
            onChange={setKnown}
            options={[
              { value: "width", label: t("width") },
              { value: "height", label: t("height") },
            ]}
          />
          <Field label={known === "width" ? t("width") : t("height")}>
            <Input type="number" min="0" step="any" value={knownValue} onChange={(e) => setKnownValue(e.target.value)} />
          </Field>
          {missing ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{t("width")}</p>
                <p className="mt-1 font-mono text-xl font-semibold">{formatNum(missing.width)}</p>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{t("height")}</p>
                <p className="mt-1 font-mono text-xl font-semibold">{formatNum(missing.height)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-destructive">{t("invalid")}</p>
          )}
        </>
      )}
    </ToolShell>
  );
}
