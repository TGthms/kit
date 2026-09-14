"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Download, HardDriveDownload, LoaderCircle, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
/** What the removal menu has ticked at this moment. */
type RemovalSelection = { locales: Set<Locale>; tools: Set<ToolId>; engines: boolean };

const MAX_LOGS = 40;
const MANAGE_ID = "kit-offline-manage";
const EMPTY_REMOVAL: RemovalSelection = { locales: new Set(), tools: new Set(), engines: false };
/** How long to wait for the worker before the page speaks for itself. */
const STATUS_WAIT_MS = 10_000;

/** A figure that has not been measured yet. */
function Waiting({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <LoaderCircle aria-hidden className="h-3.5 w-3.5 shrink-0 animate-spin" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** One figure on the status card, waiting in place of a value not yet read. */
function Figure({ label, value, waiting }: { label: string; value: string | null; waiting: string }) {
  return (
    <div className="min-w-0">
      <dt className="type-caption text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value ?? <Waiting label={waiting} />}</dd>
    </div>
  );
}

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

/** A tick marking something that works with the network off. */
function ReadyTick({ label }: { label: string }) {
  return (
    <span className="shrink-0 text-primary">
      <Check aria-hidden className="h-3.5 w-3.5" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function OfflineAccess() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const tcat = useTranslations("categories");
  const ttools = useTranslations("tools");
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  /* Not every browser can report storage usage; where it cannot, there is
     nothing to wait for. */
  const canEstimateStorage = typeof navigator !== "undefined" && Boolean(navigator.storage?.estimate);
  const [selectedLocales, setSelectedLocales] = useState<Locale[]>([locale]);
  const [selectedTools, setSelectedTools] = useState<Set<ToolId>>(new Set(tools.map((tool) => tool.id)));
  const [engines, setEngines] = useState(true);
  const [openCategories, setOpenCategories] = useState<Set<ToolCategory>>(new Set(["pdf", "image"]));
  const [storage, setStorage] = useState<{ usage: number | null; quota: number | null }>({ usage: null, quota: null });
  const [download, setDownload] = useState<DownloadState>({ status: "idle", done: 0, total: 0, logs: [] });
  const [state, setState] = useState<OfflineState | null>(null);
  /* Whether each figure has been measured. Until then the page shows a spinner
     rather than a number it has not been told yet. */
  const [reportLoaded, setReportLoaded] = useState(false);
  const [storageRead, setStorageRead] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [removal, setRemoval] = useState<RemovalSelection>(EMPTY_REMOVAL);
  /* Read from storage through the store rather than copied into state, so the
     page always shows what is really recorded and nothing has to be loaded on
     mount. */
  const plan = useSyncExternalStore(subscribePlan, getPlanSnapshot, getPlanServerSnapshot);
  /* What the running download was asked for, so the record of it can be written
     only once it finishes. */
  const request = useRef<Selection | null>(null);
  const grouped = useMemo(() => categories.map((category) => ({ category, items: tools.filter((tool) => tool.category === category) })), []);
  const readStorage = useCallback(() => {
    navigator.storage?.estimate()
      .then((estimate) => setStorage({ usage: estimate.usage ?? null, quota: estimate.quota ?? null }))
      .catch(() => undefined)
      .finally(() => setStorageRead(true));
  }, []);

  /* What is on the device, expressed as things that can be removed. Only what is
     really saved is listed: this describes the device rather than the app, so it
     stays short however much the app offers. */
  const savedLocaleList = useMemo(() => locales.filter((value) => (localeState(state, value)?.done ?? 0) > 0), [state]);
  const savedToolList = useMemo(() => tools.filter((tool) => toolSavedCount(state, tool.id) > 0), [state]);
  const enginesSaved = Boolean(state && state.engines.total > 0 && state.engines.done >= state.engines.total);
  const savedCount = savedLocaleList.length + savedToolList.length + (enginesSaved ? 1 : 0);

  /* A ticked item that has gone since is neither counted nor sent, so the button
     never promises to remove something that is no longer there. */
  const removalLocales = savedLocaleList.filter((value) => removal.locales.has(value));
  const removalTools = savedToolList.filter((tool) => removal.tools.has(tool.id));
  const removalEngines = removal.engines && enginesSaved;
  const removalCount = removalLocales.length + removalTools.length + (removalEngines ? 1 : 0);

  /* The figures below all describe the device, and each has its own source: the
     worker's report, or the storage estimate. A figure shows a wait until its
     own source has answered, so a number on screen is always one that was read. */
  const waitingForReport = !hydrated || !reportLoaded;
  const waitingForStorage = !hydrated || (canEstimateStorage && !storageRead);

  useEffect(() => {
    if (hydrated && canEstimateStorage) readStorage();
  }, [hydrated, canEstimateStorage, readStorage]);

  useEffect(() => {
    if (!hydrated) return;
    activeWorker().then((worker) => worker?.postMessage({ type: "OFFLINE_STATUS" })).catch(() => undefined);
    const giveUp = window.setTimeout(() => setReportLoaded(true), STATUS_WAIT_MS);
    return () => window.clearTimeout(giveUp);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data as ProgressMessage & { state?: OfflineState | null } | null;
      if (!data || typeof data !== "object") return;
      if (data.type === "OFFLINE_STATE") {
        /* A report has arrived. It may carry nothing — the worker says so when
           it cannot read its own resource list — and that is still an answer. */
        setReportLoaded(true);
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
     that was canceled or failed is not recorded as saved content. */
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
  const updateFromPlan = () => {
    if (!plan) return;
    /* The saved selection is re-run as it was, so an update costs one tap. */
    setSelectedLocales(plan.locales);
    setSelectedTools(new Set(plan.tools));
    setEngines(plan.engines);
    void runDownload({ locales: plan.locales, tools: plan.tools, engines: plan.engines });
  };

  const toggleRemoveLocale = (value: Locale) => setRemoval((current) => {
    const next = new Set(current.locales);
    if (next.has(value)) next.delete(value); else next.add(value);
    return { ...current, locales: next };
  });
  const toggleRemoveTool = (id: ToolId) => setRemoval((current) => {
    const next = new Set(current.tools);
    if (next.has(id)) next.delete(id); else next.add(id);
    return { ...current, tools: next };
  });
  const selectAllSaved = () => setRemoval({
    locales: new Set(savedLocaleList),
    tools: new Set(savedToolList.map((tool) => tool.id)),
    engines: enginesSaved,
  });
  const removeSelected = async () => {
    if (!removalCount) return;
    const worker = await activeWorker();
    if (!worker) return;
    /* If everything saved is going, the record of it goes too: the visitor has
       said they no longer want it, and the next release must not offer to fetch
       it again. */
    if (removalCount === savedCount) clearPlan();
    worker.postMessage({
      type: "OFFLINE_REMOVE",
      locales: removalLocales,
      tools: removalTools.map((tool) => tool.id),
      engines: removalEngines,
    });
    setRemoval(EMPTY_REMOVAL);
  };
  const removeAll = async () => {
    if (!confirm(t("offlineRemoveConfirm"))) return;
    const worker = await activeWorker();
    if (!worker) return;
    clearPlan();
    setRemoval(EMPTY_REMOVAL);
    worker.postMessage({ type: "OFFLINE_REMOVE", all: true });
  };

  const progressPercent = download.total ? Math.round((download.done / download.total) * 100) : 0;
  const statusText = download.status === "done" ? t("offlineComplete") : download.status === "canceled" ? t("offlineCanceled") : download.status === "error" ? tc("error") : `${tc("progress")} · ${progressPercent}%`;
  const storageText = `${formatBytes(storage.usage, t("offlineStorageUnknown"))}${storage.quota ? ` / ${formatBytes(storage.quota, t("offlineStorageUnknown"))}` : ""}`;
  const availableTools = state ? tools.filter((tool) => toolSaved(state, tool.id)).length : 0;
  const planState = planStatus(plan, state, APP_VERSION);
  /* Null is what tells <Figure> to show a wait instead of a value. */
  const languagesValue = waitingForReport
    ? null
    : `${state?.readyLocales ?? 0} / ${state ? Object.keys(state.locales).length : locales.length}`;
  const toolsValue = waitingForReport ? null : `${availableTools} / ${tools.length}`;
  const enginesValue = waitingForReport ? null : enginesSaved ? t("offlineReady") : t("offlineNotSaved");
  const storageValue = waitingForStorage ? null : storageText;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/[0.035]">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span aria-hidden className="rounded-xl bg-primary/12 p-2.5 text-primary"><HardDriveDownload className="h-5 w-5" /></span>
            {/* Every figure describes this device: the same thing the pickers
                tick and the menu lists, so the numbers here and the rows below
                them agree. */}
            <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
              <Figure label={t("offlineLanguages")} value={languagesValue} waiting={tc("loading")} />
              <Figure label={t("offlineTools")} value={toolsValue} waiting={tc("loading")} />
              <Figure label={t("offlineEnginesLabel")} value={enginesValue} waiting={tc("loading")} />
              <Figure label={t("offlineStorage")} value={storageValue} waiting={tc("loading")} />
            </dl>
          </div>
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

      {/* Choosing what to download. What is saved is reported on its own, in the
          Manage downloads menu below, so each row holds a single control. */}
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
          <div className="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto rounded-xl border border-border/50 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {locales.map((value) => {
              const ready = Boolean(localeState(state, value)?.ready);
              return (
                <label key={value} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary/60">
                  <input type="checkbox" checked={selectedLocales.includes(value)} onChange={() => toggleLocale(value)} />
                  <span className="min-w-0 flex-1 truncate">{localeNames[value]}</span>
                  {ready ? <ReadyTick label={t("offlineReady")} /> : null}
                </label>
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
            const readyCount = state ? items.filter((item) => toolSaved(state, item.id)).length : 0;
            return (
              <div key={category} className="overflow-hidden rounded-xl border border-border/50">
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <button
                    type="button"
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 items-center gap-2 text-start font-medium"
                    onClick={() => setOpenCategories((current) => { const next = new Set(current); if (next.has(category)) next.delete(category); else next.add(category); return next; })}
                  >
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-0" : "-rotate-90"}`} />
                    <span className="truncate">{tcat(category)}</span>
                    <span className="type-caption text-muted-foreground">{items.length}</span>
                    {readyCount ? (
                      <span className="flex shrink-0 items-center gap-1 type-caption text-primary">
                        <Check className="h-3.5 w-3.5" />{readyCount}
                      </span>
                    ) : null}
                  </button>
                  <Button size="sm" variant="ghost" className="shrink-0" onClick={() => toggleCategory(category)}>{allSelected ? tc("clear") : tc("selectAll")}</Button>
                </div>
                {open ? (
                  <div className="grid gap-1 border-t border-border/40 p-2 sm:grid-cols-2">
                    {items.map((tool) => (
                      <label key={tool.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary/60">
                        <input type="checkbox" checked={selectedTools.has(tool.id)} onChange={() => toggleTool(tool.id)} />
                        <span className="min-w-0 flex-1 truncate">{ttools(`${tool.id}.name`)}</span>
                        {toolSaved(state, tool.id) ? <ReadyTick label={t("offlineReady")} /> : null}
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
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={downloadSelected} disabled={!selectedLocales.length || !selectedTools.size || download.status === "running"}>
              <Download className="me-2 h-4 w-4" />{tc("download")}
            </Button>
            {download.status === "running" ? (
              <Button variant="ghost" onClick={cancelDownload}><X className="me-2 h-4 w-4" />{tc("cancel")}</Button>
            ) : null}
          </div>
          {download.status !== "idle" ? (
            <div className="space-y-3 rounded-xl border border-border/50 p-3" aria-live="polite">
              <p className="font-medium">{statusText}</p>
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

      {/* Removing is a separate job from choosing, so it has its own menu, closed
          until asked for. It lists the device rather than the catalog: only
          what is really saved appears, each entry can be picked out on its own,
          and one control takes all of it. With nothing saved there is nothing to
          manage, so the card is a plain note rather than a disclosure. */}
      <Card className="border-border/40">
        {waitingForReport ? (
          /* The worker has not answered, so the page states nothing about the
             device and shows a wait in its place. */
          <div className="p-5">
            <p className="text-base font-semibold leading-snug tracking-[-0.01em]">{t("offlineManage")}</p>
            <p className="mt-1 flex items-center gap-2 type-caption text-muted-foreground">
              <LoaderCircle aria-hidden className="h-3.5 w-3.5 animate-spin" />
              {tc("loading")}
            </p>
          </div>
        ) : savedCount ? (
          <button
            type="button"
            aria-expanded={manageOpen}
            aria-controls={MANAGE_ID}
            onClick={() => setManageOpen((open) => !open)}
            className="flex w-full items-start justify-between gap-3 p-5 text-start"
          >
            <span className="min-w-0">
              <span className="block text-base font-semibold leading-snug tracking-[-0.01em]">{t("offlineManage")}</span>
              <span className="mt-1 block type-caption text-muted-foreground">{t("offlineManageDesc")}</span>
            </span>
            <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform", manageOpen ? "rotate-0" : "-rotate-90")} />
          </button>
        ) : (
          <div className="p-5">
            <p className="text-base font-semibold leading-snug tracking-[-0.01em]">{t("offlineManage")}</p>
            <p className="mt-1 type-caption text-muted-foreground">{t("offlineNothingSaved")}</p>
          </div>
        )}
        {manageOpen && savedCount ? (
          <CardContent id={MANAGE_ID} className="space-y-5">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button size="sm" variant="outline" onClick={selectAllSaved}>{tc("selectAll")}</Button>
              <Button size="sm" variant="ghost" onClick={() => setRemoval(EMPTY_REMOVAL)} disabled={!removalCount}>{tc("clear")}</Button>
            </div>

            {savedLocaleList.length ? (
              <section className="space-y-1">
                <h4 className="type-caption font-medium uppercase tracking-wide text-muted-foreground">
                  {t("offlineLanguages")} · {savedLocaleList.length}
                </h4>
                <div className="overflow-hidden rounded-xl border border-border/50">
                  {savedLocaleList.map((value) => {
                    const entry = localeState(state, value);
                    return (
                      <label key={value} className="flex items-center gap-2 border-b border-border/40 px-3 py-2 text-sm last:border-b-0 hover:bg-secondary/60">
                        <input type="checkbox" checked={removal.locales.has(value)} onChange={() => toggleRemoveLocale(value)} />
                        <span className="min-w-0 flex-1 truncate">{localeNames[value]}</span>
                        <span className="shrink-0 type-caption text-muted-foreground">
                          {entry?.ready ? t("offlineReady") : t("offlinePartial", { done: entry?.done ?? 0, total: entry?.total ?? 0 })}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {savedToolList.length ? (
              <section className="space-y-1">
                <h4 className="type-caption font-medium uppercase tracking-wide text-muted-foreground">
                  {t("offlineTools")} · {savedToolList.length}
                </h4>
                <div className="overflow-hidden rounded-xl border border-border/50">
                  {savedToolList.map((tool) => (
                    <label key={tool.id} className="flex items-center gap-2 border-b border-border/40 px-3 py-2 text-sm last:border-b-0 hover:bg-secondary/60">
                      <input type="checkbox" checked={removal.tools.has(tool.id)} onChange={() => toggleRemoveTool(tool.id)} />
                      <span className="min-w-0 flex-1 truncate">{ttools(`${tool.id}.name`)}</span>
                      {/* Out of the languages this device has anything saved
                          for, which is never zero for a row that is listed. */}
                      <span className="shrink-0 type-caption text-muted-foreground">
                        <span className="sr-only">{t("offlineLanguages")} </span>
                        {toolSavedCount(state, tool.id)}/{savedLocaleList.length}
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ) : null}

            {enginesSaved ? (
              <section className="space-y-1">
                <h4 className="type-caption font-medium uppercase tracking-wide text-muted-foreground">{t("offlineEnginesLabel")}</h4>
                <label className="flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 text-sm hover:bg-secondary/60">
                  <input type="checkbox" checked={removal.engines} onChange={(event) => setRemoval((current) => ({ ...current, engines: event.target.checked }))} />
                  <span className="min-w-0 flex-1 truncate">{t("offlineEngines")}</span>
                </label>
              </section>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="destructive" onClick={() => void removeSelected()} disabled={!removalCount || download.status === "running"}>
                <Trash2 className="me-2 h-4 w-4" />{t("offlineRemoveSelected")}
                {removalCount ? (
                  <span className="ms-1 rounded-full bg-destructive-foreground/20 px-2 py-0.5 text-xs tabular-nums">
                    {removalCount}
                  </span>
                ) : null}
              </Button>
              <Button variant="ghost" onClick={() => void removeAll()} disabled={download.status === "running"}>
                {t("offlineRemoveAll")}
              </Button>
            </div>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
