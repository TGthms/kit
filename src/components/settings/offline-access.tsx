"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Download, HardDriveDownload, Trash2, X } from "lucide-react";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";
import { tools, type ToolCategory, type ToolId } from "@/lib/tools/registry";
import { useHydrated } from "@/lib/react/hydrated";
import { APP_VERSION } from "@/lib/version";
import {
  clearPlan,
  getPlanServerSnapshot,
  getPlanSnapshot,
  localeState,
  planStatus,
  savePlan,
  subscribePlan,
  toolSaved,
  toolSavedCount,
  type OfflineState,
} from "@/lib/pwa/offline-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const categories: ToolCategory[] = ["pdf", "image", "audio", "video", "data", "text", "developer", "converter", "everyday"];
type DownloadState = { status: "idle" | "running" | "done" | "canceled" | "error"; done: number; total: number; logs: string[] };
type ProgressMessage = { type?: string; status?: string; done?: number; total?: number; logs?: unknown; log?: unknown };
type Selection = { locales: Locale[]; tools: ToolId[]; engines: boolean };

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

async function activeWorker(): Promise<ServiceWorker | null> {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.controller ?? (await navigator.serviceWorker.ready).active;
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
  const [state, setState] = useState<OfflineState | null>(null);
  /* Read from storage through the store rather than copied into state, so the
     page always shows what is really recorded and nothing has to be loaded on
     mount. */
  const plan = useSyncExternalStore(subscribePlan, getPlanSnapshot, getPlanServerSnapshot);
  /* What the running download was asked for, so the record of it can be written
     only once it finishes. */
  const request = useRef<Selection | null>(null);
  const grouped = useMemo(() => categories.map((category) => ({ category, items: tools.filter((tool) => tool.category === category) })), []);
  const readStorage = useCallback(() => {
    if (!navigator.storage?.estimate) return;
    navigator.storage.estimate().then((estimate) => setStorage({ usage: estimate.usage ?? null, quota: estimate.quota ?? null })).catch(() => undefined);
  }, []);

  useEffect(() => { if (hydrated) readStorage(); }, [hydrated, readStorage]);

  useEffect(() => {
    if (!hydrated) return;
    activeWorker().then((worker) => worker?.postMessage({ type: "OFFLINE_STATUS" })).catch(() => undefined);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data as ProgressMessage & { state?: OfflineState } | null;
      if (!data || typeof data !== "object") return;
      if (data.type === "OFFLINE_STATE") {
        if (data.state) setState(data.state);
        readStorage();
        return;
      }
      if (data.type !== "OFFLINE_PROGRESS") return;
      const incoming = readLogs(data);
      const status = readStatus(data.status);
      setDownload((current) => ({
        status,
        done: typeof data.done === "number" ? data.done : current.done,
        total: typeof data.total === "number" ? data.total : current.total,
        logs: incoming.length ? [...current.logs, ...incoming].slice(-MAX_LOGS) : current.logs,
      }));
      if (status === "done" && request.current) {
        /* Written now rather than when the button was pressed, so a download
           that was cancelled or failed is not recorded as saved content. */
        savePlan({
          version: APP_VERSION,
          generation: state?.generation ?? "",
          locales: request.current.locales,
          tools: request.current.tools,
          engines: request.current.engines,
          at: new Date().toISOString(),
        });
      }
      if (status !== "running") readStorage();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [hydrated, readStorage, state]);

  const toggleTool = (id: ToolId) => setSelectedTools((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleCategory = (category: ToolCategory) => {
    const ids = tools.filter((tool) => tool.category === category).map((tool) => tool.id);
    setSelectedTools((current) => { const next = new Set(current); const allSelected = ids.every((id) => next.has(id)); ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id))); return next; });
  };
  const toggleLocale = (value: Locale) => setSelectedLocales((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);

  const runDownload = async (selection: Selection) => {
    if (!selection.locales.length || !selection.tools.length) return;
    const worker = await activeWorker();
    if (!worker) return;
    request.current = selection;
    setDownload({ status: "running", done: 0, total: 0, logs: [] });
    worker.postMessage({ type: "OFFLINE_DOWNLOAD", ...selection });
  };
  const downloadSelected = () => runDownload({ locales: selectedLocales, tools: [...selectedTools], engines });
  const cancelDownload = async () => (await activeWorker())?.postMessage({ type: "OFFLINE_CANCEL" });
  const remove = async (scope: { mode: "all" } | { mode: "locale"; locale: Locale } | { mode: "tool"; tool: ToolId }) => {
    const worker = await activeWorker();
    worker?.postMessage({ type: "OFFLINE_REMOVE", ...scope });
  };
  const removeAll = () => {
    if (!confirm(t("offlineRemoveConfirm"))) return;
    /* The record goes with the content: the visitor has said they no longer
       want it, so the next release must not offer to fetch it again. */
    clearPlan();
    void remove({ mode: "all" });
  };
  const updateFromPlan = () => {
    if (!plan) return;
    /* The saved selection is re-run as it was, so an update costs one tap. */
    setSelectedLocales(plan.locales);
    setSelectedTools(new Set(plan.tools));
    setEngines(plan.engines);
    void runDownload({ locales: plan.locales, tools: plan.tools, engines: plan.engines });
  };

  const progressPercent = download.total ? Math.round((download.done / download.total) * 100) : 0;
  const statusText = download.status === "done" ? t("offlineComplete") : download.status === "canceled" ? t("offlineCanceled") : download.status === "error" ? tc("error") : `${tc("progress")} · ${progressPercent}%`;
  const storageText = `${formatBytes(storage.usage, t("offlineStorageUnknown"))}${storage.quota ? ` / ${formatBytes(storage.quota, t("offlineStorageUnknown"))}` : ""}`;
  const savedToolCount = state ? tools.filter((tool) => toolSaved(state, tool.id)).length : 0;
  const planState = planStatus(plan, state, APP_VERSION);

  /** The status line for one language: ready, partway, or nothing yet. */
  const localeBadge = (value: Locale) => {
    const entry = localeState(state, value);
    if (!entry || entry.done === 0) return null;
    if (entry.ready) return <span className="text-primary">{t("offlineReady")}</span>;
    return <span>{t("offlinePartial", { done: entry.done, total: entry.total })}</span>;
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/[0.035]">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-4">
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
          </div>
          {/* What the worker actually holds, which is not the same as what is
              selected above: this is what works with the network switched off. */}
          {state ? (
            <p className="type-caption text-muted-foreground">
              {t("offlineStatus")} · {t("offlineLanguages")} {state.readyLocales}/{Object.keys(state.locales).length}
              {" · "}
              {t("offlineTools")} {savedToolCount}/{tools.length}
              {" · "}
              {t("offlineEngines")} {state.engines.done >= state.engines.total && state.engines.total > 0 ? t("offlineReady") : t("offlineNotSaved")}
            </p>
          ) : null}
          {planState === "saved" && plan ? (
            <p className="type-caption text-muted-foreground">{t("offlineStoredVersion", { version: plan.version })}</p>
          ) : null}
        </CardContent>
      </Card>

      {/* A new release replaces the cache, so what was saved is either out of
          date or gone. Either way the answer is the same saved selection, and
          the visitor decides when to spend the data. */}
      {plan && (planState === "stale" || planState === "cleared") ? (
        <Card className="border-primary/30">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <p className="type-body">
              {planState === "stale" ? t("offlineOutdated", { version: APP_VERSION }) : t("offlineCleared")}
            </p>
            <Button className="shrink-0" onClick={updateFromPlan} disabled={download.status === "running"}>
              <Download className="me-2 h-4 w-4" />{t("offlineUpdate")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/40">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><CardTitle>{t("offlineLanguages")}</CardTitle><p className="mt-1 type-caption text-muted-foreground">{t("offlineLanguagesDesc")}</p></div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedLocales([...locales])}>{tc("selectAll")}</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedLocales([])}>{tc("clear")}</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-border/50 p-3 sm:grid-cols-3">
            {locales.map((value) => {
              const badge = localeBadge(value);
              return (
                <div key={value} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary/60">
                  <label className="flex min-w-0 flex-1 items-center gap-2">
                    <input type="checkbox" checked={selectedLocales.includes(value)} onChange={() => toggleLocale(value)} />
                    <span className="truncate">{localeNames[value]}</span>
                  </label>
                  {badge ? <span className="shrink-0 type-caption text-muted-foreground">{badge}</span> : null}
                  {state?.locales[value]?.done ? (
                    <button
                      type="button"
                      className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground"
                      aria-label={`${tc("remove")} ${localeNames[value]}`}
                      onClick={() => void remove({ mode: "locale", locale: value })}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              );
            })}
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
            const savedCount = state ? items.filter((item) => toolSaved(state, item.id)).length : 0;
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
                    {savedCount ? (
                      <span className="flex items-center gap-1 type-caption text-primary">
                        <Check className="h-3.5 w-3.5" />{savedCount}
                      </span>
                    ) : null}
                  </button>
                  <Button size="sm" variant="ghost" onClick={() => toggleCategory(category)}>{allSelected ? tc("clear") : tc("selectAll")}</Button>
                </div>
                {open ? (
                  <div className="grid gap-1 border-t border-border/40 p-2 sm:grid-cols-2">
                    {items.map((tool) => {
                      const saved = toolSaved(state, tool.id);
                      const savedIn = toolSavedCount(state, tool.id);
                      const readyLanguages = state?.readyLocales ?? 0;
                      return (
                        <div key={tool.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary/60">
                          <label className="flex min-w-0 flex-1 items-start gap-2">
                            <input type="checkbox" checked={selectedTools.has(tool.id)} onChange={() => toggleTool(tool.id)} />
                            <span className="truncate">{ttools(`${tool.id}.name`)}</span>
                          </label>
                          {saved ? (
                            <span className="shrink-0 text-primary" title={t("offlineReady")}><Check className="h-3.5 w-3.5" /></span>
                          ) : savedIn && readyLanguages ? (
                            <span className="shrink-0 type-caption text-muted-foreground">{t("offlinePartial", { done: savedIn, total: readyLanguages })}</span>
                          ) : null}
                          {savedIn ? (
                            <button
                              type="button"
                              className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground"
                              aria-label={`${tc("remove")} ${ttools(`${tool.id}.name`)}`}
                              onClick={() => void remove({ mode: "tool", tool: tool.id })}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
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
            {state && (state.readyLocales > 0 || state.engines.done > 0) ? (
              <Button variant="ghost" onClick={removeAll} disabled={download.status === "running"}>
                <Trash2 className="me-2 h-4 w-4" />{t("offlineRemoveAll")}
              </Button>
            ) : null}
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
