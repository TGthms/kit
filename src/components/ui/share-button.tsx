"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notifyError } from "@/lib/notify";
import { cn } from "@/lib/utils";

const COPIED_MS = 1400;

export function ShareButton({
  title,
  text,
  url,
  className,
}: {
  title: string;
  text: string;
  url: string;
  className?: string;
}) {
  const t = useTranslations("common");
  const idle = t("share");
  const done = t("copied");
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      notifyError(t("error"));
    }
  };

  const share = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copy();
  };

  const widthAnchor = idle.length >= done.length ? idle : done;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={share}
      className={cn("h-10 w-full rounded-full sm:w-fit", copied && "copy-btn-copied", className)}
    >
      <span className="copy-icon" aria-hidden>
        <Share2 className="ic-copy" />
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
