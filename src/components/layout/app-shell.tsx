"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import {
  Home,
  History,
  Star,
  Settings,
  Menu,
  X,
  Wrench,
} from "lucide-react";
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const tb = useTranslations("brand");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {nav.map(({ href, key, icon: Icon }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="glass sticky top-0 z-40 border-b border-border/50">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? t("closeMenu") : t("openMenu")}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Wrench className="h-4 w-4" />
              </span>
              <span className="text-[17px]">{tb("name")}</span>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <div className="hidden sm:block">
              <LocaleSwitcher />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6">
        <aside className="hidden w-52 shrink-0 md:block">
          <div className="sticky top-20 rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
            <NavLinks />
          </div>
        </aside>

        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-0 flex h-full w-72 flex-col gap-4 bg-card p-4 shadow-xl safe-pb">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{tb("name")}</span>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <NavLinks onNavigate={() => setOpen(false)} />
              <LocaleSwitcher />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 pb-8">{children}</main>
      </div>

      <SiteFooter />
    </div>
  );
}
