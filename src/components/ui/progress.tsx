"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  const percentage = Math.max(0, Math.min(100, Math.round(value ?? 0)));
  return (
    <div className="flex items-center gap-3" data-progress-value={`${percentage}%`}>
      <ProgressPrimitive.Root
        ref={ref}
        className={cn("relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary", className)}
        value={value}
        aria-valuetext={`${percentage}%`}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className="h-full w-full flex-1 origin-left bg-primary transition-all rtl:origin-right"
          style={{ transform: `scaleX(${percentage / 100})` }}
        />
      </ProgressPrimitive.Root>
      <span className="w-10 shrink-0 text-end text-xs tabular-nums text-muted-foreground" aria-hidden="true">
        {percentage}%
      </span>
    </div>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
