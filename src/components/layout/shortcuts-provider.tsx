"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export const SHORTCUT_RUN_EVENT = "kit:run";

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target instanceof HTMLElement ? target : null;
  return Boolean(
    element &&
      (element.tagName === "INPUT" ||
        element.tagName === "TEXTAREA" ||
        element.tagName === "SELECT" ||
        element.isContentEditable)
  );
}

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("shortcuts");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (isTypingTarget(e.target)) return;

      // Use unmodified, app-local keys instead of Cmd/Ctrl combinations that
      // collide with macOS, Windows, browsers, and assistive technologies.
      // Bail out whenever a modifier is held so we never shadow a native
      // browser/OS shortcut (e.g. Ctrl/Cmd+R for reload) that happens to
      // share a letter with one of ours.
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "?") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "/") {
        e.preventDefault();
        document.getElementById("kit-search")?.focus();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        window.dispatchEvent(new Event(SHORTCUT_RUN_EVENT));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kit-shortcuts-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="kit-shortcuts-title" className="text-lg font-semibold">
                {t("title")}
              </h2>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)} aria-label={t("close")}>
                ×
              </Button>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between gap-4">
                <span>{t("search")}</span>
                <kbd className="rounded bg-secondary px-2 py-0.5 text-xs">/</kbd>
              </li>
              <li className="flex justify-between gap-4">
                <span>{t("run")}</span>
                <kbd className="rounded bg-secondary px-2 py-0.5 text-xs">R</kbd>
              </li>
              <li className="flex justify-between gap-4">
                <span>{t("help")}</span>
                <kbd className="rounded bg-secondary px-2 py-0.5 text-xs">?</kbd>
              </li>
              <li className="flex justify-between gap-4">
                <span>{t("close")}</span>
                <kbd className="rounded bg-secondary px-2 py-0.5 text-xs">Esc</kbd>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
