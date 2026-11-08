"use client";

import { Slider as GlassSlider, Switch as GlassSwitch, type SwitchProps } from "@onlymoein/liquidglass";
import { useGlassMaterial } from "@/lib/theme/liquid-glass";
import { cn } from "@/lib/utils";
import type { SliderProps } from "./slider";

export function LiquidSwitch({ control }: { control: SwitchProps }) {
  const material = useGlassMaterial();
  return <GlassSwitch
    {...control}
    {...material}
    style={{ ...control.style, ...material.style }}
    className={cn("kit-liquid-control", control.className)}
  />;
}

export function LiquidSlider({ control }: { control: SliderProps }) {
  const material = useGlassMaterial();
  return <div {...material} className={cn("kit-liquid-control w-full", control.className)} style={{ ...control.style, ...material.style }}>
    <GlassSlider
      id={control.id}
      value={control.value?.[0]}
      min={control.min}
      max={control.max}
      step={control.step}
      name={control.name}
      onValueChange={(value) => control.onValueChange?.([value])}
      aria-label={control["aria-label"]}
      aria-labelledby={control["aria-labelledby"]}
      aria-describedby={control["aria-describedby"]}
      aria-valuetext={control["aria-valuetext"]}
    />
  </div>;
}
