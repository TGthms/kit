"use client";

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ControlProps = { id?: string };

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const generatedId = useId();
  const child = isValidElement(children) ? (children as ReactElement<ControlProps>) : null;
  const controlId = child?.props.id ?? generatedId;
  const control = child ? cloneElement(child, { id: controlId }) : children;
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={controlId}>{label}</Label>
      {control}
    </div>
  );
}
