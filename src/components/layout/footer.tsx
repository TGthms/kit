"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function SiteFooter() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/40 bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 type-caption text-muted-foreground">
            <Link
              href="/privacy"
              data-pressable
              className="pressable-soft inline-flex min-h-11 items-center hover:text-foreground"
            >
              {t("privacy")}
            </Link>
            <Link
              href="/terms"
              data-pressable
              className="pressable-soft inline-flex min-h-11 items-center hover:text-foreground"
            >
              {t("terms")}
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="h-10 rounded-full px-4">
              <a
                href="https://tgthms.github.io/about/"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("aboutMe")}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-10 rounded-full px-4">
              <a
                href="https://github.com/TGthms/kit"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubMark className="h-3.5 w-3.5" />
                {t("github")}
              </a>
            </Button>
          </div>
        </div>

        <p className="text-center text-xs leading-relaxed text-muted-foreground sm:text-left">
          {t("copyright", { year })}
        </p>
      </div>
    </footer>
  );
}
