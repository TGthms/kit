"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Download, HardDriveDownload, X } from "lucide-react";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";
import { tools, type ToolCategory, type ToolId } from "@/lib/tools/registry";
import { useHydrated } from "@/lib/react/hydrated";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const categories: ToolCategory[] = ["pdf", "image", "audio", "video", "data", "text", "developer", "converter", "everyday"];
type DownloadState = { status: "idle" | "running" | "done" | "canceled" | "error"; done: number; total: number; logs: string[] };
type ProgressMessage = { type?: string; status?: string; done?: number; total?: number; logs?: unknown; log?: unknown };

const MAX_LOGS = 40;

function formatBytes(value: number | null, unknown: string): string {
  if (!value || !Number.isFinite(value)) return unknown;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

/** Accepts the batched `logs` array, or a single `log` string. */
function readLogs(message: ProgressMessage): string[] {
  if (Array.isArray(message.logs)) return message.logs.filter((line): line is string => typeof line === "string");
  if (typeof message.log === "string") return [message.log];
  return [];
}

function readStatus(status: unknown): DownloadState["status"] {
  if (status === "complete") return "done";
  if (status === "canceled") return "canceled";
  if (status === "error") return "error";
  return "running";
}

export function OfflineAccess() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const tcat = useTranslations("categories");
  const ttools = useTranslations("tools");
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const [selectedLocales, setSelectedLocales] = useState<Locale[]>([locale]);
  const [selectedTools, setSelectedTools] = useState<Set<ToolId>>(new Set(tools.map((tool) => tool.id)));
  const [engines, setEngines] = useState(true);
  const [openCategories, setOpenCategories] = useState<Set<ToolCategory>>(new Set(["pdf", "image"]));
  const [storage, setStorage] = useState<{ usage: number | null; quota: number | null }>({ usage: null, quota: null });
  const [download, setDownload] = useState<DownloadState>({ status: "idle", done: 0, total: 0, logs: [] });
  const grouped = useMemo(() => categories.map((category) => ({ category, items: tools.filter((tool) => tool.category === category) })), []);
  const readStorage = useCallback(() => {
    if (!navigator.storage?.estimate) return;
    navigator.storage.estimate().then((estimate) => setStorage({ usage: estimate.usage ?? null, quota: estimate.quota ?? null })).catch(() => undefined);
  }, []);

  useEffect(() => { if (hydrated) readStorage(); }, [hydrated, readStorage]);
  useEffect(() => {
    if (!hydrated || !("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data as ProgressMessage | null;
      if (!data || typeof data !== "object" || data.type !== "OFFLINE_PROGRESS") return;
      const incoming = readLogs(data);
      const status = readStatus(data.status);
      setDownload((current) => ({
        status,
        done: typeof data.done === "number" ? data.done : current.done,
        total: typeof data.total === "number" ? data.total : current.total,
        logs: incoming.length ? [...current.logs, ...incoming].slice(-MAX_LOGS) : current.logs,
      }));
      if (status !== "running") readStorage();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [hydrated, readStorage]);

  const toggleTool = (id: ToolId) => setSelectedTools((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleCategory = (category: ToolCategory) => {
    const ids = tools.filter((tool) => tool.category === category).map((tool) => tool.id);
    setSelectedTools((current) => { const next = new Set(current); const allSelected = ids.every((id) => next.has(id)); ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id))); return next; });
  };
  const downloadSelected = async () => {
    if (!selectedLocales.length || !selectedTools.size || !("serviceWorker" in navigator)) return;
    const worker = (await navigator.serviceWorker.ready).active;
    if (!worker) return;
    setDownload({ status: "running", done: 0, total: 0, logs: [] });
    worker.postMessage({ type: "OFFLINE_DOWNLOAD", locales: selectedLocales, tools: [...selectedTools], engines });
  };
  const cancelDownload = async () => {
    const worker = navigator.serviceWorker.controller ?? (await navigator.serviceWorker.ready).active;
    worker?.postMessage({ type: "OFFLINE_CANCEL" });
  };
  const toggleLocale = (value: Locale) => setSelectedLocales((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const progressPercent = download.total ? Math.round((download.done / download.total) * 100) : 0;
  const statusText = download.status === "done" ? t("offlineComplete") : download.status === "canceled" ? t("offlineCanceled") : download.status === "error" ? tc("error") : `${tc("progress")} · ${progressPercent}%`;
  const storageText = `${formatBytes(storage.usage, t("offlineStorageUnknown"))}${storage.quota ? ` / ${formatBytes(storage.quota, t("offlineStorageUnknown"))}` : ""}`;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/[0.035]">
        <CardContent className="flex items-center gap-4 p-5 sm:p-6">
          <span aria-hidden className="rounded-xl bg-primary/12 p-2.5 text-primary"><HardDriveDownload className="h-5 w-5" /></span>
          <dl className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="min-w-0">
              <dt className="type-caption text-muted-foreground">{t("offlineLanguages")}</dt>
              <dd className="font-semibold tabular-nums">{selectedLocales.length}</dd>
            </div>
            <div className="min-w-0">
              <dt className="type-caption text-muted-foreground">{t("offlineTools")}</dt>
              <dd className="font-semibold tabular-nums">{selectedTools.size}</dd>
            </div>
            <div className="min-w-0">
              <dt className="type-caption text-muted-foreground">{t("offlineStorage")}</dt>
              <dd className="truncate font-semibold tabular-nums">{storageText}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardHeader><CardTitle>{t("offlineLanguages")}</CardTitle><p className="type-caption text-muted-foreground">{t("offlineLanguagesDesc")}</p></CardHeader>
        <CardContent>
          <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-border/50 p-3 sm:grid-cols-3">
            {locales.map((value) => (
              <label key={value} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary/60">
                <input type="checkbox" checked={selectedLocales.includes(value)} onChange={() => toggleLocale(value)} />
                {localeNames[value]}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><CardTitle>{t("offlineTools")}</CardTitle><p className="mt-1 type-caption text-muted-foreground">{t("offlineToolsDesc")}</p></div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedTools(new Set(tools.map((tool) => tool.id)))}>{tc("selectAll")}</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedTools(new Set())}>{tc("clear")}</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {grouped.map(({ category, items }) => {
            const allSelected = items.every((item) => selectedTools.has(item.id));
            const open = openCategories.has(category);
            return (
              <div key={category} className="overflow-hidden rounded-xl border border-border/50">
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <button
                    type="button"
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 items-center gap-2 text-start font-medium"
                    onClick={() => setOpenCategories((current) => { const next = new Set(current); if (next.has(category)) next.delete(category); else next.add(category); return next; })}
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-0" : "-rotate-90"}`} />
                    <span>{tcat(category)}</span>
                    <span className="type-caption text-muted-foreground">{items.length}</span>
                  </button>
                  <Button size="sm" variant="ghost" onClick={() => toggleCategory(category)}>{allSelected ? tc("clear") : tc("selectAll")}</Button>
                </div>
                {open ? (
                  <div className="grid gap-1 border-t border-border/40 p-2 sm:grid-cols-2">
                    {items.map((tool) => (
                      <label key={tool.id} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary/60">
                        <input type="checkbox" checked={selectedTools.has(tool.id)} onChange={() => toggleTool(tool.id)} />
                        <span>{ttools(`${tool.id}.name`)}</span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <label className="flex items-start gap-2 rounded-xl border border-border/50 p-3 text-sm">
            <input type="checkbox" checked={engines} onChange={(event) => setEngines(event.target.checked)} />
            <span><span className="font-medium">{t("offlineEngines")}</span><span className="mt-0.5 block type-caption text-muted-foreground">{t("offlineEnginesDesc")}</span></span>
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button onClick={downloadSelected} disabled={!selectedLocales.length || !selectedTools.size || download.status === "running"}>
              <Download className="me-2 h-4 w-4" />{tc("download")}
            </Button>
          </div>
          {download.status !== "idle" ? (
            <div className="space-y-3 rounded-xl border border-border/50 p-3" aria-live="polite">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{statusText}</p>
                {download.status === "running" ? <Button size="sm" variant="ghost" onClick={cancelDownload}><X className="me-1 h-4 w-4" />{tc("cancel")}</Button> : null}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${download.total ? progressPercent : 4}%` }} />
              </div>
              <div className="h-24 overflow-y-auto rounded-lg bg-background p-2 font-mono text-[11px] text-muted-foreground">
                {download.logs.map((line, index) => <div key={`${line}-${index}`}>{line}</div>)}
              </div>
            </div>
          ) : null}
          <p className="type-caption text-muted-foreground">{t("offlineBackgroundNote")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
