"use client";

import { lazy, Suspense } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassBoundary } from "@/components/ui/glass-boundary";
import { useHydrated } from "@/lib/react/hydrated";
import { useLiquidGlassEnabled } from "@/lib/theme/liquid-glass";
import { useAppearanceStore } from "@/stores/appearance-store";

const StyleMenu = lazy(() => import("./liquid-glass-settings").then((module) => ({ default: module.StyleMenu })));
const StyleTransparency = lazy(() => import("./liquid-glass-settings").then((module) => ({ default: module.StyleTransparency })));

export function InterfaceStyle() {
  const t = useTranslations("settings");
  const format = useFormatter();
  const hydrated = useHydrated();
  const liquidGlass = useAppearanceStore((state) => state.liquidGlass);
  const setLiquidGlass = useAppearanceStore((state) => state.setLiquidGlass);
  const transparency = useAppearanceStore((state) => state.glassTransparency);
  const setTransparency = useAppearanceStore((state) => state.setGlassTransparency);
  const glassAvailable = useLiquidGlassEnabled();
  const title = t("navigationAppearance");
  const glass = t("liquidGlass");
  const classic = t("classicAppearance");
  const formattedTransparency = format.number(transparency / 100, { style: "percent" });
  const slider = {
    id: "kit-glass-transparency",
    min: 0,
    max: 100,
    step: 1,
    value: transparency,
    "aria-valuetext": formattedTransparency,
    "aria-describedby": glassAvailable ? undefined : "kit-glass-unavailable",
  };
  const menuPlaceholder = <div className="h-10 w-32 rounded-full bg-secondary/80" aria-hidden />;

  return (
    <Card className="border-border/40">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {hydrated ? (
          <GlassBoundary fallback={
            <fieldset className="flex flex-wrap gap-x-4 gap-y-2">
              <legend className="sr-only">{title}</legend>
              {[{ value: true, label: glass }, { value: false, label: classic }].map(({ value, label }) => (
                <label key={label} className="inline-flex items-center gap-2 text-sm">
                  <input type="radio" name="kit-interface-style" checked={value === liquidGlass} onChange={() => setLiquidGlass(value)} className="accent-primary" />
                  {label}
                </label>
              ))}
            </fieldset>
          }>
            <Suspense fallback={menuPlaceholder}>
              <StyleMenu title={title} glass={glass} classic={classic} liquidGlass={liquidGlass} onChange={setLiquidGlass} />
            </Suspense>
          </GlassBoundary>
        ) : menuPlaceholder}
        {hydrated && liquidGlass && (
          <div className="mt-4 border-t border-border/50 pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={slider.id} className="text-sm font-medium">{t("glassTransparency")}</label>
              <span aria-hidden className="text-sm tabular-nums text-muted-foreground">{formattedTransparency}</span>
            </div>
            <GlassBoundary fallback={
              <input
                {...slider}
                type="range"
                onChange={(event) => setTransparency(event.currentTarget.valueAsNumber)}
                className="block h-10 w-full cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-ring"
              />
            }>
              <Suspense fallback={<div className="h-10" aria-hidden />}>
                <StyleTransparency {...slider} onValueChange={setTransparency} />
              </Suspense>
            </GlassBoundary>
            {!glassAvailable && <p id="kit-glass-unavailable" className="type-caption text-muted-foreground">{t("glassUnavailable")}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
