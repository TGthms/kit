"use client";

import { useEffect, useState, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/react/hydrated";

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
  headerRef?: Ref<HTMLElement>;
};

/**
 * Secondary screen header: large title in the page, compact "< + Name"
 * chrome on mobile once the large title has scrolled away.
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
  headerRef,
}: PageHeaderProps) {
  const [compact, setCompact] = useState(false);
  // Portal the compact overlay to <body>. It uses `position: fixed`, and an
  // ancestor (<main>, via the page-enter animation) keeps a non-`none`
  // transform after animating in, which would otherwise turn this "fixed"
  // element into something positioned relative to that ancestor instead of
  // the viewport, so it scrolls away with the page instead of staying put.
  const hydrated = useHydrated();

  useEffect(() => {
    if (!sticky || !backHref) return;
    const onScroll = () => setCompact(window.scrollY > 72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sticky, backHref]);

  const compactOverlay =
    sticky && backHref ? (
      <div
        className={cn(
          "kit-compact-header pointer-events-none fixed inset-x-0 z-40 sm:hidden",
          "top-[calc(3rem+env(safe-area-inset-top))] h-12",
          compact ? "opacity-100" : "opacity-0"
        )}
        aria-hidden={!compact}
        inert={!compact ? true : undefined}
      >
        <div className="glass chrome-edge flex h-full items-center gap-1 px-3">
          <Link
            href={backHref}
            data-pressable
            data-restore-scroll
            aria-label={backLabel}
            tabIndex={compact ? undefined : -1}
            className={cn(
              "pressable-soft inline-flex h-11 w-11 items-center justify-center rounded-full text-primary",
              compact && "pointer-events-auto"
            )}
          >
            <ChevronLeft className="h-5 w-5 stroke-[2.5] rtl:rotate-180" aria-hidden />
          </Link>
          <p className="min-w-0 truncate text-[15px] font-semibold tracking-[-0.015em]">{title}</p>
        </div>
      </div>
    ) : null;

  return (
    <>
      {compactOverlay ? (hydrated ? createPortal(compactOverlay, document.body) : compactOverlay) : null}
      <header
        ref={headerRef}
        className={cn("mb-5 sm:mb-6", className)}
      >
        {backHref ? (
          <Link
            href={backHref}
            data-pressable
            data-restore-scroll
            aria-label={backLabel}
            className={cn(
              "pressable-soft mb-1 inline-flex min-h-11 max-w-full items-center gap-0.5",
              "-ms-1.5 rounded-lg px-1.5 text-[17px] font-normal text-primary",
              "hover:opacity-80"
            )}
          >
            <ChevronLeft className="h-5 w-5 shrink-0 stroke-[2.5] rtl:rotate-180" aria-hidden />
            <span className="truncate">{backLabel}</span>
          </Link>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
    </>
  );
}
