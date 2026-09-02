"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { notifyError } from "@/lib/notify";
import { cn } from "@/lib/utils";

const COPIED_MS = 1400;

export function CopyButton({
  value,
  label,
  copiedLabel,
  className,
  disabled,
  variant = "outline",
  size,
  ...props
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
} & Omit<ButtonProps, "onClick" | "children">) {
  const t = useTranslations("common");
  const idle = label ?? t("copy");
  const done = copiedLabel ?? t("copied");
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      notifyError(t("error"));
    }
  };

  const widthAnchor = idle.length >= done.length ? idle : done;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled || !value}
      onClick={copy}
      className={cn(copied && "copy-btn-copied", className)}
      {...props}
    >
      <span className="copy-icon" aria-hidden>
        <Copy className="ic-copy" />
        <Check className="ic-check" />
      </span>
      <span className="inline-grid justify-items-start">
        <span className="invisible col-start-1 row-start-1" aria-hidden>
          {widthAnchor}
        </span>
        <span className="col-start-1 row-start-1" aria-live="polite">
          {copied ? done : idle}
        </span>
      </span>
    </Button>
  );
}
