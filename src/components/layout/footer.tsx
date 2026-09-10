"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Btn2 } from "@/components/ui/btn-2";

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function SiteFooter() {
  const t = useTranslations("footer");
  const common = useTranslations("common");
  const year = new Date().getFullYear();
  const [supportOpen, setSupportOpen] = useState(false);
  const supportButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!supportOpen) return;

    closeButtonRef.current?.focus();
    const trigger = supportButtonRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSupportOpen(false);
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [supportOpen]);

  return (
    <footer className="mt-auto border-t border-border/40 bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 type-caption text-muted-foreground">
            <Link
              href="/how"
              data-pressable
              className="pressable-soft inline-flex min-h-11 items-center hover:text-foreground"
            >
              {t("how")}
            </Link>
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
            <Button asChild variant="outline" className="h-10 rounded-full px-4">
              <a href="mailto:contact.timg@icloud.com">
                {t("emailTim")}
              </a>
            </Button>
            <Btn2
              href="https://github.com/TGthms/kit"
              target="_blank"
              rel="noopener noreferrer"
              icon={<GitHubMark />}
            >
              {t("github")}
            </Btn2>
            <Button
              ref={supportButtonRef}
              variant="outline"
              className="h-10 rounded-full px-4"
              onClick={() => setSupportOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={supportOpen}
            >
              {t("supportMe")}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs leading-relaxed text-muted-foreground sm:text-left">
          {t("copyright", { year })}
        </p>
      </div>

      {supportOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSupportOpen(false);
          }}
        >
          <section
            className="anim-surface flex h-[min(86dvh,48rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border bg-card shadow-2xl sm:h-[min(88dvh,48rem)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kit-support-title"
          >
            <div className="flex items-center justify-between gap-4 border-b px-5 py-3.5 sm:px-6">
              <div>
                <h2 id="kit-support-title" className="type-title">
                  {t("supportMe")}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.rich("supportWalletNote", {
                    link: (chunks) => (
                      <a
                        href="https://ko-fi.com/tgthms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
                      >
                        {chunks}
                      </a>
                    ),
                  })}
                </p>
              </div>
              <Button
                ref={closeButtonRef}
                size="icon"
                variant="ghost"
                className="h-11 w-11 shrink-0 rounded-full text-xl"
                onClick={() => setSupportOpen(false)}
                aria-label={common("close")}
              >
                ×
              </Button>
            </div>
            <iframe
              id="kofiframe"
              src="https://ko-fi.com/tgthms/?hidefeed=true&widget=true&embed=true&preview=true"
              title="tgthms"
              className="min-h-0 w-full flex-1 border-0 bg-[#f9f9f9] p-1 dark:bg-[#1c1c1e]"
              loading="eager"
              allow="payment *"
              referrerPolicy="strict-origin-when-cross-origin"
            />
            {/*
              Ko-fi's embedded widget only ever offers card payment in practice, even
              though it requests the "payment" permission — Apple Pay / Google Pay simply
              never render inside it, embedded or not, browser or headers notwithstanding.
              Rather than keep chasing that, tell people up front and hand off wallet-pay
              users to Ko-fi's own hosted page, where those methods do work.
            */}
            <p className="shrink-0 border-t bg-muted/30 px-5 py-2.5 text-center text-xs text-muted-foreground sm:px-6">
              {t("supportSecureNote")}
            </p>
          </section>
        </div>
      ) : null}
    </footer>
  );
}
