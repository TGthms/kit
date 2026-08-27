"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { LoaderCircle } from "lucide-react";
import type { ToolId } from "@/lib/tools/registry";
import { ToolHeader } from "@/components/shared/tool-header";
import { Button } from "@/components/ui/button";
import { useHistoryStore } from "@/stores/history-store";
import { SHORTCUT_RUN_EVENT } from "@/components/layout/shortcuts-provider";

export async function loadPdfjs() {
  return import("@/lib/pdf/pdfjs");
}

export async function loadFfmpeg() {
  return import("@/lib/media/ffmpeg");
}

export function useToolHistory(toolId: ToolId) {
  const add = useHistoryStore((s) => s.add);
  const enabled = useHistoryStore((s) => s.enabled);
  return (
    summary: string,
    status: "success" | "failed",
    options?: Record<string, unknown>
    ) => { if (enabled) add({ toolId, summary, status, options }); };
}

export function ActionBar({
  onRun,
  loading,
  label,
  disabled,
  onCancel,
  status,
}: {
  onRun: () => void;
  loading: boolean;
  label: string;
  disabled?: boolean;
  onCancel?: () => void;
  status?: string;
}) {
  const t = useTranslations("common");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !loading && !disabled) {
        e.preventDefault();
        onRun();
      }
    };
    const onShortcutRun = () => {
      if (!loading && !disabled) onRun();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(SHORTCUT_RUN_EVENT, onShortcutRun);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(SHORTCUT_RUN_EVENT, onShortcutRun);
    };
  }, [onRun, loading, disabled]);
  return (
    <div className="flex flex-wrap items-center gap-3" aria-busy={loading || undefined}>
      <Button
        onClick={onRun}
        disabled={loading || disabled}
        className="min-w-32"
        type="button"
      >
        {loading ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            {t("processing")}
          </>
        ) : label}
      </Button>
      {loading && onCancel ? (
        <Button type="button" variant="outline" onClick={onCancel} aria-label={t("cancel")}>
          {t("cancel")}
        </Button>
      ) : null}
      {loading ? (
        <span
          className="anim-status inline-flex items-center text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {status ?? t("processing")}
        </span>
      ) : null}
    </div>
  );
}

export function ToolLimits({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
  return (
    <details className="rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm">
      <summary className="cursor-pointer select-none font-medium text-foreground">
        {t("howItWorks")}
      </summary>
      <div className="anim-details-content mt-2 space-y-2 text-muted-foreground">{children}</div>
    </details>
  );
}

export function ToolShell({
  toolId,
  children,
}: {
  toolId: ToolId;
  children: ReactNode;
}) {
  return (
    <div>
      <ToolHeader toolId={toolId} />
      <div className="space-y-6">{children}</div>
    </div>
  );
}
