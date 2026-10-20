"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
import { useLiquidGlassEnabled } from "@/lib/theme/liquid-glass";
import { GlassBoundary } from "./glass-boundary";

const LiquidSwitch = React.lazy(() => import("./liquid-glass-controls").then((module) => ({ default: module.LiquidSwitch })));
export type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & { glass?: boolean };

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, glass = true, ...props }, ref) => {
  const enabled = useLiquidGlassEnabled();
  const fallback = (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5",
      "transition-colors duration-300",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      "motion-reduce:transition-none",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "switch-knob pointer-events-none block h-[22px] w-[22px] rounded-full bg-background shadow-sm ring-0",
        "data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-0 rtl:data-[state=checked]:-translate-x-[22px]"
      )}
    />
  </SwitchPrimitives.Root>
  );
  // Uncontrolled/ref-based/disabled controls retain their native contract.
  if (!enabled || !glass || ref || props.disabled || props.asChild || props.checked === undefined) return fallback;
  return <GlassBoundary fallback={fallback}><React.Suspense fallback={fallback}>
    <LiquidSwitch control={{ ...props, className }} fallback={fallback} />
  </React.Suspense></GlassBoundary>;
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
