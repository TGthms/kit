"use client";

import { type ReactNode } from "react";
import { useTheme } from "next-themes";
import { GlassContent, GlassScene, GlassSlider, GlassSwitch } from "@glass-sdk/liquid-glass";
import "@glass-sdk/liquid-glass/styles.css";
import type { SwitchProps } from "./switch";
import type { SliderProps } from "./slider";
import { useGlassHealth } from "@/lib/theme/glass-health";

/** Refraction stays within the control's own track and neutral local backdrop. */
function ControlScene({ children, fallback, slider = false }: { children: ReactNode; fallback: ReactNode; slider?: boolean }) {
  const { resolvedTheme } = useTheme();
  const { failed, onDiagnostic } = useGlassHealth();
  if (failed) return fallback;
  return <GlassScene
    className={slider ? "kit-sdk-control kit-sdk-slider-scene" : "kit-sdk-control kit-sdk-switch-scene"}
    appearance={resolvedTheme === "dark" ? "dark" : "light"}
    material="clear"
    maxSurfaces={2}
    onDiagnostic={onDiagnostic}
  >
    <GlassContent aria-hidden className="kit-sdk-control-backdrop" />
    {children}
  </GlassScene>;
}

export function LiquidSwitch({ control, fallback }: { control: SwitchProps; fallback: ReactNode }) {
  const { resolvedTheme } = useTheme();
  return <ControlScene fallback={fallback}>
    <GlassSwitch
      className="kit-sdk-switch"
      id={control.id}
      checked={control.checked}
      defaultChecked={control.defaultChecked}
      onCheckedChange={(checked) => control.onCheckedChange?.(checked)}
      name={control.name}
      value={control.value === undefined ? undefined : String(control.value)}
      required={control.required}
      aria-label={control["aria-label"]}
      aria-labelledby={control["aria-labelledby"]}
      aria-describedby={control["aria-describedby"]}
      refraction={4}
      tint={resolvedTheme === "dark" ? "#0a84ff" : "#0071e3"}
    />
  </ControlScene>;
}

export function LiquidSlider({ control, fallback }: { control: SliderProps; fallback: ReactNode }) {
  const { resolvedTheme } = useTheme();
  return <ControlScene slider fallback={fallback}>
    <GlassSlider
      className="kit-sdk-slider"
      id={control.id}
      value={control.value?.[0]}
      defaultValue={control.defaultValue?.[0]}
      min={control.min ?? 0}
      max={control.max ?? 100}
      step={control.step ?? 1}
      name={control.name}
      onValueChange={(value) => control.onValueChange?.([value])}
      onValueCommitted={(value) => control.onValueCommit?.([value])}
      aria-label={control["aria-label"]}
      aria-labelledby={control["aria-labelledby"]}
      thumbProps={{ "aria-describedby": control["aria-describedby"] }}
      refraction={3}
      tint={resolvedTheme === "dark" ? "#0a84ff" : "#0071e3"}
    />
  </ControlScene>;
}
