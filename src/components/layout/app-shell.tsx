"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { Home, History, Star, Settings, Menu, X, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { SiteFooter } from "./footer";
import { LocaleSwitcher } from "./locale-switcher";

const nav = [
  { href: "/", key: "home", icon: Home },
  { href: "/favorites", key: "favorites", icon: Star },
  { href: "/history", key: "history", icon: History },
  { href: "/settings", key: "settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const tb = useTranslations("brand");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const NavLinks = ({
    onNavigate,
    compact = false,
  }: {
    onNavigate?: () => void;
    compact?: boolean;
  }) => (
    <nav className={cn("flex", compact ? "flex-row justify-around gap-0" : "flex-col gap-1")}>
      {nav.map(({ href, key, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            data-pressable
            className={cn(
              "nav-item flex items-center font-medium pressable-soft",
              compact
                ? "min-h-12 min-w-0 flex-1 flex-col justify-center gap-0.5 px-1 py-1.5 text-[10px] sm:text-[11px]"
                : "gap-3 rounded-xl px-3 py-2.5 text-sm",
              active
                ? compact
                  ? "text-primary"
                  : "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
              !compact && !active && "hover:bg-secondary/80"
            )}
          >
            <Icon
              className={cn(
                compact ? "h-5 w-5" : "h-4 w-4",
                active && compact && "stroke-[2.25]"
              )}
            />
            <span className={cn(compact && "max-w-full truncate")}>{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      {/* Translucent chrome — content scrolls underneath */}
      <header className="glass chrome-edge sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? t("closeMenu") : t("openMenu")}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link
              href="/"
              data-pressable
              className="pressable-soft flex min-w-0 items-center gap-2 font-semibold tracking-[-0.015em]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Wrench className="h-4 w-4" />
              </span>
              <span className="truncate text-[17px] leading-none">{tb("name")}</span>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <div className="hidden min-[480px]:block">
              <LocaleSwitcher />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        {/* Heavier material for structural sidebar */}
        <aside className="hidden w-52 shrink-0 md:block">
          <div className="glass-heavy sticky top-[4.75rem] rounded-2xl border border-border/40 p-3 surface-float">
            <NavLinks />
          </div>
        </aside>

        {/* Drawer: enter/exit same axis (left); scrim dims for focus */}
        {open && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
            <div
              className="anim-scrim absolute inset-0 bg-[var(--scrim)]"
              onClick={() => setOpen(false)}
            />
            <div className="anim-sheet-left glass-heavy absolute left-0 top-0 flex h-full w-[min(18rem,88vw)] flex-col gap-4 border-r border-border/40 p-4 pt-[max(1rem,env(safe-area-inset-top))] surface-float-lg safe-pb">
              <div className="flex items-center justify-between">
                <span className="font-semibold tracking-[-0.015em]">{tb("name")}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  aria-label={t("closeMenu")}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <NavLinks onNavigate={() => setOpen(false)} />
              <div className="mt-auto space-y-3 border-t border-border/50 pt-4 min-[480px]:hidden">
                <LocaleSwitcher />
              </div>
            </div>
          </div>
        )}

        <main className="anim-surface min-w-0 flex-1 pb-4 md:pb-8">{children}</main>
      </div>

      <div className="pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
        <SiteFooter />
      </div>

      <nav
        className="glass chrome-edge fixed inset-x-0 bottom-0 z-40 md:hidden safe-pb"
        aria-label={t("home")}
      >
        <NavLinks compact />
      </nav>
    </div>
  );
}
