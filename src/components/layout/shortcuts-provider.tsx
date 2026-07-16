"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("shortcuts");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (e.key === "?" && !typing) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && !typing) {
        e.preventDefault();
        document.getElementById("kit-search")?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "," && !typing) {
        e.preventDefault();
        router.push("/settings");
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "h" && !typing) {
        e.preventDefault();
        router.push("/");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <>
      {children}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t("title")}</h2>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                ×
              </Button>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between gap-4">
                <span>{t("search")}</span>
                <kbd className="rounded bg-secondary px-2 py-0.5 text-xs">⌘/Ctrl K</kbd>
              </li>
              <li className="flex justify-between gap-4">
                <span>{t("settings")}</span>
                <kbd className="rounded bg-secondary px-2 py-0.5 text-xs">⌘/Ctrl ,</kbd>
              </li>
              <li className="flex justify-between gap-4">
                <span>{t("home")}</span>
                <kbd className="rounded bg-secondary px-2 py-0.5 text-xs">⌘/Ctrl H</kbd>
              </li>
              <li className="flex justify-between gap-4">
                <span>{t("help")}</span>
                <kbd className="rounded bg-secondary px-2 py-0.5 text-xs">?</kbd>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
