"use client";

import { lazy, Suspense, useCallback, useEffect, useRef } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassBoundary } from "@/components/ui/glass-boundary";
import { useHydrated } from "@/lib/react/hydrated";
import { useLiquidGlassEnabled } from "@/lib/theme/liquid-glass";
import { useAppearanceStore } from "@/stores/appearance-store";

const StyleMenu = lazy(() => import("./liquid-glass-settings").then((module) => ({ default: module.StyleMenu })));

export function InterfaceStyle() {
  const t = useTranslations("settings");
  const format = useFormatter();
  const hydrated = useHydrated();
  const liquidGlass = useAppearanceStore((state) => state.liquidGlass);
  const setLiquidGlass = useAppearanceStore((state) => state.setLiquidGlass);
  const transparency = useAppearanceStore((state) => state.glassTransparency);
  const setTransparency = useAppearanceStore((state) => state.setGlassTransparency);
  const glassAvailable = useLiquidGlassEnabled();
  const select = useRef<HTMLSelectElement>(null);
  const restoreFocus = useRef(false);
  const title = t("navigationAppearance");
  const glass = t("liquidGlass");
  const classic = t("classicAppearance");
  const formattedTransparency = format.number(transparency / 100, { style: "percent" });
  const focusMenuTrigger = useCallback((trigger: HTMLButtonElement | null) => {
    if (!restoreFocus.current) return;
    restoreFocus.current = false;
    if (document.activeElement === document.body) trigger?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!liquidGlass && restoreFocus.current) {
      select.current?.focus({ preventScroll: true });
      restoreFocus.current = false;
    }
  }, [liquidGlass]);

  const standard = (
    <select
      ref={select}
      aria-label={title}
      disabled={!hydrated}
      value={!hydrated || liquidGlass ? "glass" : "classic"}
      onChange={(event) => {
        const next = event.currentTarget.value === "glass";
        restoreFocus.current = next && event.currentTarget === document.activeElement;
        setLiquidGlass(next);
      }}
      className="h-10 max-w-full rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring"
    >
      <option value="glass">{glass}</option>
      <option value="classic">{classic}</option>
    </select>
  );

  return (
    <Card className="border-border/40">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {glassAvailable ? (
          <GlassBoundary fallback={standard}>
            <Suspense fallback={standard}>
              <StyleMenu
                title={title}
                glass={glass}
                classic={classic}
                onMount={focusMenuTrigger}
                onClassic={() => {
                  restoreFocus.current = true;
                  setLiquidGlass(false);
                }}
              />
            </Suspense>
          </GlassBoundary>
        ) : standard}
        {hydrated && liquidGlass && (
          <div className="mt-4 border-t border-border/50 pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="kit-glass-transparency" className="text-sm font-medium">{t("glassTransparency")}</label>
              <span aria-hidden className="text-sm tabular-nums text-muted-foreground">{formattedTransparency}</span>
            </div>
            <input
              id="kit-glass-transparency"
              type="range"
              min={0}
              max={100}
              value={transparency}
              aria-valuetext={formattedTransparency}
              aria-describedby={glassAvailable ? undefined : "kit-glass-unavailable"}
              onChange={(event) => setTransparency(event.currentTarget.valueAsNumber)}
              className="block h-11 w-full cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-ring"
            />
            {!glassAvailable && <p id="kit-glass-unavailable" className="type-caption text-muted-foreground">{t("glassUnavailable")}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
