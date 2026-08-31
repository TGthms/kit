"use client";

import { useEffect, useState, type ReactNode, type Ref } from "react";
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

  useEffect(() => {
    if (!sticky || !backHref) return;
    const onScroll = () => setCompact(window.scrollY > 72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sticky, backHref]);

  return (
    <>
      {sticky && backHref && compact ? (
        <div
          className="sticky z-40 -mx-4 mb-3 flex h-12 items-center gap-1 border-b border-border/40 bg-background px-3 top-[calc(3rem+env(safe-area-inset-top))] sm:hidden"
        >
          <Link
            href={backHref}
            data-pressable
            data-restore-scroll
            aria-label={backLabel}
            className="pressable-soft inline-flex h-11 w-11 items-center justify-center rounded-full text-primary"
          >
            <ChevronLeft className="h-5 w-5 stroke-[2.5]" aria-hidden />
          </Link>
          <p className="min-w-0 truncate text-[15px] font-semibold tracking-[-0.015em]">{title}</p>
        </div>
      ) : null}
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
              "-ml-1.5 rounded-lg px-1.5 text-[17px] font-normal text-primary",
              "hover:opacity-80"
            )}
          >
            <ChevronLeft className="h-5 w-5 shrink-0 stroke-[2.5]" aria-hidden />
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
