"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  /** When set, shows an iOS-style back control (always visible, sticky on mobile). */
  backHref?: string;
  backLabel: string;
  trailing?: ReactNode;
  below?: ReactNode;
  className?: string;
  sticky?: boolean;
  /** Collapse to an iOS-style back affordance on small screens after scrolling. */
  compactOnScroll?: boolean;
};

/**
 * Secondary screen header: clear back affordance + large title.
 */
export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  trailing,
  below,
  className,
  sticky = true,
  compactOnScroll = false,
}: PageHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const compact = compactOnScroll && isScrolled;

  useEffect(() => {
    if (!compactOnScroll) return;
    const onScroll = () => setIsScrolled(window.scrollY > 72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [compactOnScroll]);

  return (
    <header
      className={cn(
        "mb-5 sm:mb-6",
        sticky &&
          [
            "sticky z-40 -mx-4 border-b border-border/40 px-4 py-2.5",
            "top-[calc(3rem+env(safe-area-inset-top))] sm:top-[calc(3.5rem+env(safe-area-inset-top))]",
            "bg-background/90 backdrop-blur-xl",
            compact && "max-sm:py-1.5",
            "sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none",
          ].join(" "),
        className
      )}
    >
      {backHref ? (
        <Link
          href={backHref}
          data-pressable
          aria-label={backLabel}
          className={cn(
            "pressable-soft mb-1 inline-flex min-h-11 max-w-full items-center gap-0.5",
            "-ml-1.5 rounded-lg px-1.5 text-[17px] font-normal text-primary",
            "hover:opacity-80 active:opacity-60",
            compact && "max-sm:mb-0 max-sm:h-9 max-sm:min-h-9 max-sm:w-9 max-sm:justify-center max-sm:rounded-full max-sm:bg-primary/10 max-sm:px-0"
          )}
        >
          <ChevronLeft className="h-5 w-5 shrink-0 stroke-[2.5]" aria-hidden />
          <span className={cn("truncate", compact && "max-sm:sr-only")}>{backLabel}</span>
        </Link>
      ) : null}

      <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", compact && "max-sm:hidden")}>
        <div className="min-w-0 space-y-1.5">
          <h1 className="type-display text-[1.625rem] sm:text-[2rem]">{title}</h1>
          {subtitle ? (
            <p className="type-body max-w-2xl text-muted-foreground">{subtitle}</p>
          ) : null}
          {below}
        </div>
        {trailing ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{trailing}</div>
        ) : null}
      </div>
    </header>
  );
}
