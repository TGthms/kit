"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { useLiquidGlassEnabled } from "@/lib/theme/liquid-glass";
import { GlassBoundary } from "./glass-boundary";

const LiquidSlider = React.lazy(() => import("./liquid-glass-controls").then((module) => ({ default: module.LiquidSlider })));
export type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, ...props }, ref) => {
  const enabled = useLiquidGlassEnabled();
  const fallback = (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb aria-label={props["aria-label"]} aria-labelledby={props["aria-labelledby"]} aria-describedby={props["aria-describedby"]} className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
  </SliderPrimitive.Root>
  );
  if (!enabled || ref || props.disabled || props.orientation === "vertical" || props.value?.length !== 1 || (props.min ?? 0) >= (props.max ?? 100)) return fallback;
  return <GlassBoundary fallback={fallback}><React.Suspense fallback={fallback}>
    <LiquidSlider control={{ ...props, className }} fallback={fallback} />
  </React.Suspense></GlassBoundary>;
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
