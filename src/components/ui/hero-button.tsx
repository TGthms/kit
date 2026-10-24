"use client";

import { Button as HeroButtonPrimitive, type ButtonRootProps } from "@heroui/react/button";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/react/hydrated";
import "./hero-controls.css";

/** Opt-in adapter while the existing Button contract is migrated separately.
 * Use onPress for activation (including keyboard/touch cancellation), refs and
 * native form props from React Aria. No global change to current tool buttons. */
export function HeroButton({ className, variant = "primary", isDisabled, ...props }: Omit<ButtonRootProps, "className"> & { className?: string }) {
  const hydrated = useHydrated();
  return <HeroButtonPrimitive
    variant={variant}
    isDisabled={!hydrated || isDisabled}
    data-haptic-important={variant === "primary" || variant === "danger" ? "" : undefined}
    className={cn("kit-hero kit-hero-button", className)}
    {...props}
  />;
}
