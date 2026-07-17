"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ToolId } from "@/lib/tools/registry";
import { ToolHeader } from "@/components/shared/tool-header";
import { Button } from "@/components/ui/button";
import { useHistoryStore } from "@/stores/history-store";

export async function loadPdfjs() {
  return import("@/lib/pdf/pdfjs");
}

export async function loadFfmpeg() {
  return import("@/lib/media/ffmpeg");
}

export function useToolHistory(toolId: ToolId) {
  const add = useHistoryStore((s) => s.add);
  return (
    summary: string,
    status: "success" | "failed",
    options?: Record<string, unknown>
  ) => add({ toolId, summary, status, options });
}

export function ActionBar({
  onRun,
  loading,
  label,
  disabled,
}: {
  onRun: () => void;
  loading: boolean;
  label: string;
  disabled?: boolean;
}) {
  const t = useTranslations("common");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={onRun} disabled={loading || disabled} className="min-w-32">
        {loading ? t("processing") : label}
      </Button>
    </div>
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
