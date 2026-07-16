"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export function SiteFooter() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/60 bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            {t("terms")}
          </Link>
          <span className="hidden sm:inline text-border">|</span>
          <span className="text-xs">{t("copyright", { year })}</span>
        </div>
        <Button asChild variant="outline" size="sm" className="w-fit rounded-full">
          <a
            href="https://tgthms.github.io/about/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("aboutMe")}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </footer>
  );
}
