"use client";

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ControlProps = { id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling" };

export function Field({
  label,
  children,
  className,
  description, error,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  error?: ReactNode;
}) {
  const generatedId = useId();
  const child = isValidElement(children) ? (children as ReactElement<ControlProps>) : null;
  const controlId = child?.props.id ?? generatedId;
  const describedBy = [child?.props["aria-describedby"], description ? `${controlId}-description` : null, error ? `${controlId}-error` : null].filter(Boolean).join(" ") || undefined;
  const control = child ? cloneElement(child, { id: controlId, "aria-describedby": describedBy, "aria-invalid": error ? true : child.props["aria-invalid"] }) : children;
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={controlId}>{label}</Label>
      {control}
      {description && <p id={`${controlId}-description`} className="text-xs text-muted-foreground">{description}</p>}
      {error && <p id={`${controlId}-error`} role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
