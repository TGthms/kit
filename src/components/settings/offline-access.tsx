"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Download, HardDriveDownload, LoaderCircle, RefreshCw, ShieldCheck, Wrench, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { locales, localeNames, type Locale } from "@/lib/i18n/config";
import { tools, categories, type ToolCategory, type ToolId } from "@/lib/tools/registry";
import { APP_PAGES, APP_PAGE_IDS, type AppPageId } from "@/lib/pwa/app-pages";
import { useHydrated } from "@/lib/react/hydrated";
import { offlineDownloadWorker, applyOfflineUpdate, removeOfflineDownloads } from "@/lib/pwa/offline-worker";
import { offlineReadiness } from "@/lib/pwa/readiness";
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

type DownloadState = { status: "idle" | "running" | "done" | "canceled" | "error"; done: number; total: number; logs: string[]; phase?: "preparing" | "downloading" | "applying" };
type ProgressMessage = { type?: string; status?: string; done?: number; total?: number; logs?: unknown; log?: unknown; requestId?: string; generation?: string; version?: string; selection?: Selection; activationRequired?: boolean };
type Selection = { locales: Locale[]; tools: ToolId[]; pages: AppPageId[]; engines: boolean };
// Preparing a release can outlive this route. Share ownership so returning to
// the manager reattaches to it rather than starting a competing request.
let pendingPreparation: { id: string; selection: Selection; controller: AbortController; target: ReturnType<typeof offlineDownloadWorker> } | null = null;

/** What the removal menu has ticked at this moment. */
type RemovalSelection = { locales: Set<Locale>; tools: Set<ToolId>; engines: boolean };

const MAX_LOGS = 40;
const MANAGE_ID = "kit-offline-manage";
const CUSTOMIZE_ID = "kit-offline-customize";
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
  if (value === null || value < 0 || !Number.isFinite(value)) return unknown;
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
  return navigator.serviceWorker.controller ?? (await navigator.serviceWorker.getRegistration())?.active ?? null;
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
  /* The app's own pages are named in several namespaces, so they are read from
     the root rather than copied into this one. */
  const tr = useTranslations();
  const locale = useLocale() as Locale;
  const hydrated = useHydrated();
  const plan = useSyncExternalStore(subscribePlan, getPlanSnapshot, getPlanServerSnapshot);
  /* Not every browser can report storage usage; where it cannot, there is
     nothing to wait for. */
  const canEstimateStorage = typeof navigator !== "undefined" && Boolean(navigator.storage?.estimate);
  const [draft, setDraft] = useState<Selection | null>(null);
  const initialSelection: Selection = plan ? { locales: [...new Set([locale, ...plan.locales])], tools: plan.tools, pages: plan.pages, engines: plan.engines }
    : { locales: [locale], tools: tools.map((tool) => tool.id), pages: [...APP_PAGE_IDS], engines: true };
  const chosen = draft ?? initialSelection;
  const selectedLocales = chosen.locales;
  const selectedTools = useMemo(() => new Set(chosen.tools), [chosen.tools]);
  const selectedPages = chosen.pages;
  const engines = chosen.engines;
  const setSelectedLocales = (next: Locale[] | ((current: Locale[]) => Locale[])) => setDraft((current) => {
    const base = current ?? initialSelection;
    return { ...base, locales: typeof next === "function" ? next(base.locales) : next };
  });
  const setSelectedTools = (next: Set<ToolId> | ((current: Set<ToolId>) => Set<ToolId>)) => setDraft((current) => {
    const base = current ?? initialSelection;
    return { ...base, tools: [...(typeof next === "function" ? next(new Set(base.tools)) : next)] };
  });
  const setSelectedPages = (next: AppPageId[] | ((current: AppPageId[]) => AppPageId[])) => setDraft((current) => {
    const base = current ?? initialSelection;
    return { ...base, pages: typeof next === "function" ? next(base.pages) : next };
  });
  const setEngines = (value: boolean) => setDraft((current) => ({ ...(current ?? initialSelection), engines: value }));
  /* Every category starts closed: nine open lists would bury the rest of the
     page, and the choice is usually made per category rather than wholesale. */
  const [openCategories, setOpenCategories] = useState<Set<ToolCategory>>(new Set());
  const [storage, setStorage] = useState<{ usage: number | null; quota: number | null }>({ usage: null, quota: null });
  const [download, setDownload] = useState<DownloadState>({ status: "idle", done: 0, total: 0, logs: [] });
  const [state, setState] = useState<OfflineState | null>(null);
  /* Whether each figure has been measured. Until then the page shows a spinner
     rather than a number it has not been told yet. */
  const [reportLoaded, setReportLoaded] = useState(false);
  const [reportError, setReportError] = useState(false);
  const [removing, setRemoving] = useState(false);
  const reportWorker = useRef<ServiceWorker | null>(null);
  const activeState = useRef<OfflineState | null>(null);
  const [retrySelection, setRetrySelection] = useState<Selection | null>(null);
  const reportReceived = useRef(false);
  const verificationFailed = useRef(false);
  const waitingWorker = useRef<ServiceWorker | null>(null);
  const preparation = useRef<AbortController | null>(null);
  const recoveredJob = useRef<string | null>(null);
  const [storageRead, setStorageRead] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const verificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [removal, setRemoval] = useState<RemovalSelection>(EMPTY_REMOVAL);
  /* What the running download was asked for, so the record of it can be written
     only once it finishes. */
  const request = useRef<Selection | null>(null);
  const job = useRef<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const downloadTarget = useRef<{ worker: ServiceWorker; waiting: boolean; id: string; apply: boolean } | null>(null);
  const grouped = useMemo(() => categories.map((category) => ({ category, items: tools.filter((tool) => tool.category === category) })), []);
  const readStorage = useCallback(() => {
    void Promise.resolve().then(() => navigator.storage?.estimate?.())
      .then((estimate) => {
        if (estimate) setStorage({ usage: estimate.usage ?? null, quota: estimate.quota ?? null });
      })
      .catch(() => undefined)
      .finally(() => setStorageRead(true));
  }, []);

  /* What is on the device, expressed as things that can be removed. Only what is
     really saved is listed: this describes the device rather than the app, so it
     stays short however much the app offers. */
  const savedLocaleList = useMemo(() => locales.filter((value) => {
    const entry = localeState(state, value);
    return entry?.removable ?? (entry?.done ?? 0) > 0;
  }), [state]);
  const savedToolList = useMemo(() => tools.filter((tool) => toolSavedCount(state, tool.id) > 0), [state]);
  const enginesSaved = Boolean(state && state.engines.total > 0 && state.engines.done >= state.engines.total);
  const enginesStored = Boolean(state && state.engines.done > 0);
  const savedCount = savedLocaleList.length + savedToolList.length + (enginesStored ? 1 : 0);

  /* A ticked item that has gone since is neither counted nor sent, so the button
     never promises to remove something that is no longer there. */
  const removalLocales = savedLocaleList.filter((value) => removal.locales.has(value));
  const removalTools = savedToolList.filter((tool) => removal.tools.has(tool.id));
  const removalEngines = removal.engines && enginesStored;
  const removalCount = removalLocales.length + removalTools.length + (removalEngines ? 1 : 0);

  /* The figures below all describe the device, and each has its own source: the
     worker's report, or the storage estimate. A figure shows a wait until its
     own source has answered, so a number on screen is always one that was read. */
  const waitingForReport = !hydrated || !reportLoaded;
  const waitingForStorage = !hydrated || (canEstimateStorage && !storageRead);

  useEffect(() => {
    if (hydrated && canEstimateStorage) readStorage();
  }, [hydrated, canEstimateStorage, readStorage]);

  const refreshStatus = useCallback(() => {
    void activeWorker().then((worker) => {
      const target = downloadTarget.current;
      if (target?.worker.state === "redundant") {
        request.current = null; downloadTarget.current = null; job.current = null;
        setDownload((current) => ({ ...current, status: "error", logs: ["A newer update replaced this download. Retry to continue."] }));
      }
      reportWorker.current = worker;
      if (worker) worker.postMessage({ type: "OFFLINE_STATUS" });
      else if (!("serviceWorker" in navigator)) { setReportLoaded(true); setReportError(true); }
    }).catch(() => { setReportLoaded(true); setReportError(true); });
    if ("serviceWorker" in navigator) void navigator.serviceWorker.getRegistration().then((registration) => {
      waitingWorker.current = registration?.waiting ?? null;
      registration?.waiting?.postMessage({ type: "OFFLINE_STATUS" });
    }).catch(() => undefined);
  }, []);

  const checkStatus = useCallback(() => {
    setChecking(true);
    setReportError(false);
    if (verificationTimer.current) clearTimeout(verificationTimer.current);
    verificationTimer.current = setTimeout(() => { verificationFailed.current = true; setChecking(false); setReportError(true); }, 45_000);
    void activeWorker().then((worker) => worker?.postMessage({ type: "OFFLINE_VERIFY", locale, selection: plan })).catch(() => {
      verificationFailed.current = true; setChecking(false); setReportError(true);
    });
  }, [locale, plan]);

  useEffect(() => {
    if (!hydrated) return;
    refreshStatus();
    let disposed = false;
    void navigator.serviceWorker?.ready.then(() => { if (!disposed) { refreshStatus(); checkStatus(); } }).catch(() => undefined);
    const giveUp = window.setTimeout(() => {
      setReportLoaded(true);
      if (!reportReceived.current) { setReportError(true); setChecking(false); }
    }, STATUS_WAIT_MS);
    const visible = () => { if (document.visibilityState === "visible") { refreshStatus(); checkStatus(); } };
    document.addEventListener("visibilitychange", visible);
    navigator.serviceWorker?.addEventListener("controllerchange", refreshStatus);
    // Polling also recovers progress after leaving this route or iOS suspending
    // its worker. It never guesses that an unanswered job is complete.
    const poll = window.setInterval(refreshStatus, 10_000);
    return () => {
      disposed = true;
      window.clearTimeout(giveUp); window.clearInterval(poll);
      if (verificationTimer.current) clearTimeout(verificationTimer.current);
      document.removeEventListener("visibilitychange", visible);
      navigator.serviceWorker?.removeEventListener("controllerchange", refreshStatus);
    };
  }, [hydrated, refreshStatus, checkStatus]);

  useEffect(() => {
    if (!hydrated || !("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data as ProgressMessage & { state?: OfflineState | null; error?: string; verified?: boolean } | null;
      if (!data || typeof data !== "object") return;
      if (data.type === "OFFLINE_STATE") {
        const runningWorker = navigator.serviceWorker.controller ?? reportWorker.current;
        const fromActive = event.source === runningWorker;
        const current = data.state;
        if (!fromActive && event.source !== waitingWorker.current && event.source !== downloadTarget.current?.worker) return;
        if (fromActive) {
          if (data.verified || data.error) {
            verificationFailed.current = Boolean(data.error);
            setChecking(false);
            if (verificationTimer.current) clearTimeout(verificationTimer.current);
          }
          reportReceived.current = true;
          setReportLoaded(true);
          setReportError(verificationFailed.current || !current || Boolean(data.error));
          setState(current ?? null);
          activeState.current = current ?? null;
          if (current && "plan" in current) {
            if (current.plan) {
              savePlan(current.plan);
            }
          }
          readStorage();
        }
        // Only the active report describes usable downloads. A waiting report
        // is useful solely to reattach to that worker's ongoing download.
        const priorJob = current?.job;
        if (!priorJob || !event.source) return;
        if (downloadTarget.current?.id === priorJob.requestId && downloadTarget.current.worker === event.source) {
          if (priorJob.status === "interrupted") {
            request.current = null; downloadTarget.current = null; job.current = null;
            setDownload({ status: "error", done: priorJob.done, total: priorJob.total, logs: priorJob.logs || [] });
          } else onMessage({ source: event.source, data: { type: "OFFLINE_PROGRESS", ...priorJob } } as MessageEvent);
          return;
        }
        if (request.current || recoveredJob.current === priorJob.requestId || (!fromActive && priorJob.status !== "running")) return;
        recoveredJob.current = priorJob.requestId;
        if (priorJob.status === "complete") return;
        if (priorJob.selection) setRetrySelection(priorJob.selection);
        setDownload({ status: priorJob.status === "interrupted" ? "error" : readStatus(priorJob.status),
          done: priorJob.done, total: priorJob.total, logs: priorJob.logs || [] });
        if (priorJob.status === "running" && priorJob.selection) {
          request.current = priorJob.selection; job.current = priorJob.requestId;
          downloadTarget.current = { worker: event.source as ServiceWorker, waiting: !fromActive, id: priorJob.requestId, apply: false };
        }
        return;
      }
      if (data.type !== "OFFLINE_PROGRESS") return;
      const target = downloadTarget.current;
      if (!target || data.requestId !== target.id || event.source !== target.worker) return;
      const incoming = readLogs(data);
      const status = readStatus(data.status);
      if (status !== "running") recoveredJob.current = target.id;
      const requiresActivation = target.waiting || Boolean(data.activationRequired);
      const applying = status === "done" && requiresActivation && target.apply;
      setDownload((current) => ({
        status: applying ? "running" : status, phase: applying ? "applying" : "downloading",
        done: typeof data.done === "number" ? data.done : current.done,
        total: typeof data.total === "number" ? data.total : current.total,
        logs: incoming.length ? [...current.logs, ...incoming].slice(-MAX_LOGS) : current.logs,
      }));
      const selection = data.selection ?? request.current;
      const record = () => {
        if (!selection) return;
        savePlan({ version: data.version ?? APP_VERSION, generation: data.generation ?? activeState.current?.generation ?? "",
          ...selection, at: new Date().toISOString() });
      };
      if (status === "done" && !requiresActivation) { verificationFailed.current = false; if (verificationTimer.current) clearTimeout(verificationTimer.current); setChecking(false); setReportError(false); record(); refreshStatus(); }
      if (applying) {
        // Clear ownership before awaiting activation so a repeated terminal
        // report cannot apply the same update twice.
        request.current = null; downloadTarget.current = null; job.current = null;
        void applyOfflineUpdate(target.worker, target.id).then(() => { record(); window.location.reload(); }).catch((error: unknown) => {
          setDownload((current) => ({ ...current, status: "error", logs: [...current.logs, error instanceof Error ? error.message : "Update failed"].slice(-MAX_LOGS) }));
        });
      } else if (status !== "running") {
        request.current = null; downloadTarget.current = null; job.current = null;
        readStorage();
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [hydrated, readStorage, refreshStatus]);

  useEffect(() => {
    if (!hydrated || !("serviceWorker" in navigator)) return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;
    const changed = () => { if (!disposed && registration) setUpdateAvailable(Boolean(registration.waiting)); };
    const found = () => {
      installing?.removeEventListener("statechange", changed);
      installing = registration?.installing ?? null;
      installing?.addEventListener("statechange", changed);
      changed();
    };
    void navigator.serviceWorker.getRegistration().then((value) => {
      if (disposed || !value) return;
      registration = value;
      registration.addEventListener("updatefound", found);
      found();
      if (navigator.onLine !== false) void registration.update().catch(() => undefined);
    }).catch(() => undefined);
    return () => {
      disposed = true;
      registration?.removeEventListener("updatefound", found);
      installing?.removeEventListener("statechange", changed);
    };
  }, [hydrated]);

  useEffect(() => {
    const pending = pendingPreparation;
    if (!pending || pending.controller.signal.aborted) return;
    let disposed = false;
    void Promise.resolve().then(() => {
      if (disposed) return;
      request.current = pending.selection; job.current = pending.id;
      preparation.current = pending.controller; setRetrySelection(pending.selection);
      setDownload({ status: "running", phase: "preparing", done: 0, total: 0, logs: [] });
      void pending.target.then((target) => {
        if (!disposed && job.current === pending.id) downloadTarget.current = { ...target, id: pending.id, apply: false };
      }).catch((error: unknown) => {
        if (disposed || job.current !== pending.id) return;
        request.current = null; job.current = null;
        setDownload({ status: "error", done: 0, total: 0, logs: [error instanceof Error ? error.message : "Download interrupted"] });
      });
    });
    return () => { disposed = true; };
  }, []);

  const toggleTool = (id: ToolId) => setSelectedTools((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleCategory = (category: ToolCategory) => {
    const ids = tools.filter((tool) => tool.category === category).map((tool) => tool.id);
    setSelectedTools((current) => { const next = new Set(current); const allSelected = ids.every((id) => next.has(id)); ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id))); return next; });
  };
  const toggleLocale = (value: Locale) => setSelectedLocales((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const togglePage = (id: AppPageId) => setSelectedPages((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const runDownload = async (selection: Selection) => {
    /* Something has to be asked for. A download of the app's own pages alone is
       a legitimate small one, so tools are not required. */
    if (!selection.locales.length || (!selection.tools.length && !selection.pages.length)) return;
    if (request.current) return;
    const id = crypto.randomUUID();
    job.current = id;
    const chosen: Selection = { ...selection, locales: [...new Set([locale, ...selection.locales])], pages: [...new Set<AppPageId>([...selection.pages, "home", "settings", "offline"])] };
    request.current = chosen;
    setRetrySelection(chosen);
    const controller = new AbortController();
    preparation.current = controller;
    setDownload({ status: "running", phase: "preparing", done: 0, total: 0, logs: [] });
    try {
      const targetPromise = offlineDownloadWorker(controller.signal, download.status === "error");
      pendingPreparation = { id, selection: chosen, controller, target: targetPromise };
      const target = await targetPromise;
      if (job.current !== id || controller.signal.aborted) return;
      downloadTarget.current = { ...target, id, apply: true };
      // Keep the install entry and offline settings usable after activation,
      // even when the chosen selection contains only tools.
      target.worker.postMessage({ type: "OFFLINE_DOWNLOAD", requestId: id, ...chosen });
      if (pendingPreparation?.id === id) pendingPreparation = null;
      void navigator.storage?.persist?.().catch(() => undefined);
    } catch (error) {
      if (pendingPreparation?.id === id) pendingPreparation = null;
      if (job.current !== id) return;
      job.current = null;
      request.current = null;
      downloadTarget.current = null;
      setDownload({ status: "error", done: 0, total: 0, logs: [error instanceof Error ? error.message : "Download failed"] });
    }
  };
  const downloadSelected = () => runDownload({ locales: selectedLocales, tools: [...selectedTools], pages: selectedPages, engines });
  const cancelDownload = () => {
    preparation.current?.abort();
    if (pendingPreparation?.controller === preparation.current) pendingPreparation = null;
    const target = downloadTarget.current;
    if (target) {
      try { target.worker.postMessage({ type: "OFFLINE_CANCEL", requestId: target.id }); }
      catch {
        job.current = null; request.current = null; downloadTarget.current = null;
        setDownload((current) => ({ ...current, status: "canceled" }));
      }
    } else { job.current = null; request.current = null; setDownload((current) => ({ ...current, status: "canceled" })); }
  };
  const updateFromPlan = () => {
    if (!plan) return;
    /* The saved selection is re-run as it was, so an update costs one tap. */
    setSelectedLocales(plan.locales);
    setSelectedTools(new Set(plan.tools));
    setSelectedPages(plan.pages);
    setEngines(plan.engines);
    void runDownload({ locales: plan.locales, tools: plan.tools, pages: plan.pages, engines: plan.engines });
  };

  const repairDownloads = () => {
    const saved = state?.plan ?? plan;
    if (saved) void runDownload({ locales: saved.locales, tools: saved.tools, pages: saved.pages, engines: saved.engines || offlineReadiness(state, locale, plan).needsEngines });
    else void runDownload({ locales: [locale], tools: [...selectedTools], pages: selectedPages, engines });
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
    engines: enginesStored,
  });
  const removeSelected = async () => {
    if (!removalCount) return;
    setRemoving(true);
    try {
      const worker = await activeWorker();
      if (!worker) throw new Error("Offline access is not ready. Reconnect and retry.");
      const updated = await removeOfflineDownloads(worker, { locales: removalLocales, tools: removalTools.map((tool) => tool.id), engines: removalEngines });
      if (updated) setState(updated);
      /* If everything saved is going, the record of it goes too: the visitor has
         said they no longer want it, and the next release must not offer to fetch
         it again. */
      if (removalCount === savedCount) clearPlan();
      else if (plan) savePlan({ ...plan,
        locales: plan.locales.filter((value) => !removalLocales.includes(value)),
        tools: plan.tools.filter((value) => !removalTools.some((tool) => tool.id === value)),
        engines: plan.engines && !removalEngines,
        at: new Date().toISOString(),
      });
      setRemoval(EMPTY_REMOVAL);
      refreshStatus();
    } catch (error) {
      setDownload({ status: "error", done: 0, total: 0, logs: [error instanceof Error ? error.message : "Removal failed"] });
    } finally { setRemoving(false); }
  };
  const removeAll = async () => {
    if (!confirm(t("offlineRemoveConfirm"))) return;
    setRemoving(true);
    try {
      const worker = await activeWorker();
      if (!worker) throw new Error("Offline access is not ready. Reconnect and retry.");
      const updated = await removeOfflineDownloads(worker, { all: true });
      if (updated) setState(updated);
      clearPlan(); setDraft(null); setRemoval(EMPTY_REMOVAL);
      setDownload({ status: "idle", done: 0, total: 0, logs: [] }); refreshStatus();
    } catch (error) {
      setDownload({ status: "error", done: 0, total: 0, logs: [error instanceof Error ? error.message : "Removal failed"] });
    } finally { setRemoving(false); }
  };

  const progressPercent = download.total ? Math.round((download.done / download.total) * 100) : 0;
  const statusText = download.status === "done" ? t("offlineComplete") : download.status === "canceled" ? t("offlineCanceled") : download.status === "error" ? tc("error") : download.phase === "preparing" ? t("offlinePreparing") : download.phase === "applying" ? t("offlineApplying") : download.total ? `${tc("progress")} · ${progressPercent}%` : tc("loading");
  const storageText = formatBytes(storage.usage, t("offlineStorageUnknown"));
  const planState = planStatus(plan, state, APP_VERSION);
  const newerRelease = updateAvailable || Boolean(state?.pendingUpdate);
  const readiness = offlineReadiness(state, locale, plan);
  const busy = download.status === "running" || removing;
  const needsRepair = readiness.repair || (reportError && Boolean(plan)) || planState === "cleared" || planState === "incomplete";
  const summaryWaiting = waitingForReport || checking;
  const selectionEmpty = !selectedLocales.length || (!selectedTools.size && !selectedPages.length);
  // Updating/repairing preserves the saved collection by default. Once the
  // visitor edits it, their visible choices are the request, including when a
  // new release is waiting. Do not silently replace those edits with the plan.
  const primaryAction = draft ? downloadSelected
    : newerRelease || planState === "stale" ? (plan ? updateFromPlan : () => void runDownload({ locales: [locale], tools: [], pages: ["home", "settings", "offline"], engines: false }))
    : needsRepair ? repairDownloads : downloadSelected;
  const primaryDisabled = busy || (summaryWaiting && !newerRelease) || (selectionEmpty && (Boolean(draft) || (!newerRelease && !needsRepair)));
  const statusTitle = summaryWaiting ? t("offlineChecking") : reportError ? t("offlineUnavailable") : needsRepair ? t("offlineRepairTitle") : readiness.ready ? t("offlineReadyTitle") : t("offlineSetupTitle");
  const languageNames = readiness.languages.map((id) => localeNames[id as Locale] || id);
  const languagesValue = reportError ? "—" : waitingForReport ? null : languageNames.length ? languageNames.slice(0, 2).join(", ") + (languageNames.length > 2 ? ` +${languageNames.length - 2}` : "") : t("offlineNotSaved");
  const toolsValue = reportError ? "—" : waitingForReport ? null : String(readiness.usable.size);
  const enginesValue = reportError ? "—" : waitingForReport ? null : enginesSaved ? t("offlineReady") : enginesStored ? t("offlinePartial", { done: state?.engines.done ?? 0, total: state?.engines.total ?? 0 }) : t("offlineNotSaved");
  const storageValue = waitingForStorage ? null : storageText;
  const availableCategories = grouped.map(({ category, items }) => ({ category, count: items.filter((tool) => readiness.usable.has(tool.id)).length })).filter((item) => item.count);

  return (
    <div className="space-y-6">
      <Card className="border-border/40">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex items-start gap-3" role="status" aria-live="polite">
            <span aria-hidden className={cn("rounded-xl p-2.5", readiness.ready && !needsRepair && !summaryWaiting && !reportError ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-secondary text-muted-foreground")}>
              {summaryWaiting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : needsRepair ? <Wrench className="h-5 w-5" /> : readiness.ready && !reportError ? <ShieldCheck className="h-5 w-5" /> : <HardDriveDownload className="h-5 w-5" />}
            </span>
            <div className="min-w-0 space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">{statusTitle}</h2>
              {!summaryWaiting && !reportError ? <p className="type-body text-muted-foreground">{needsRepair ? t("offlineRepair") : readiness.ready ? t("offlineSummary", { count: readiness.usable.size, language: localeNames[locale] }) : t("offlineAccessDesc")}</p> : null}
            </div>
          </div>
          {!summaryWaiting && !reportError ? <div className="space-y-3 border-t border-border/50 pt-4">
            {readiness.pages.length ? <p className="type-caption text-muted-foreground">{t("offlinePages")}: {APP_PAGES.filter((page) => readiness.pages.includes(page.id)).map((page) => tr(page.label)).join(" · ")}</p> : null}
            {availableCategories.length ? <div className="flex flex-wrap gap-2">{availableCategories.map(({ category, count }) => <span key={category} className="rounded-lg bg-secondary px-2.5 py-1 text-xs text-muted-foreground">{tcat(category)} <span className="ms-1 tabular-nums text-foreground">{count}</span></span>)}</div> : null}
            {readiness.conditionalCurrency ? <p className="type-caption text-muted-foreground">{t("offlineRatesNote")}</p> : null}
          </div> : null}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border/50 pt-4 sm:grid-cols-4">
            <Figure label={t("offlineLanguages")} value={languagesValue} waiting={tc("loading")} />
            <Figure label={t("offlineTools")} value={toolsValue} waiting={tc("loading")} />
            <Figure label={t("offlineEnginesLabel")} value={enginesValue} waiting={tc("loading")} />
            <Figure label={t("offlineStorage")} value={storageValue} waiting={tc("loading")} />
          </dl>
          {newerRelease || planState === "stale" ? <p className="rounded-xl bg-primary/5 px-3 py-2 text-sm text-primary">{newerRelease ? t("offlineUpdateAvailable") : t("offlineOutdated", { version: APP_VERSION })}</p> : null}
          <div className="flex flex-wrap items-center gap-2">
            {newerRelease || planState === "stale" || needsRepair || !readiness.ready || customizeOpen || draft ? <Button onClick={primaryAction} disabled={primaryDisabled}>
              {needsRepair && !newerRelease ? <Wrench className="me-2 h-4 w-4" /> : <Download className="me-2 h-4 w-4" />}
              {newerRelease || planState === "stale" ? t("reviewUpdate") : needsRepair ? t("offlineRepairAction") : tc("download")}
            </Button> : null}
            <Button variant="outline" onClick={checkStatus} disabled={busy || checking}><RefreshCw className={cn("me-2 h-4 w-4", checking && "animate-spin")} />{reportError ? tc("retry") : t("offlineCheck")}</Button>
            {(download.status === "error" || download.status === "canceled") && retrySelection ? <Button variant="ghost" onClick={() => void runDownload(retrySelection)} disabled={busy}>{tc("retry")}</Button> : null}
            {download.status === "running" ? <Button variant="ghost" onClick={cancelDownload} disabled={download.phase === "applying"}><X className="me-2 h-4 w-4" />{tc("cancel")}</Button> : null}
          </div>
          {download.status !== "idle" ? <div className="space-y-3 rounded-xl bg-secondary/50 p-4" aria-live="polite">
            <p className="font-medium">{statusText}</p>
            {download.total > 0 && download.status === "running" && download.phase !== "applying" ? <p className="type-caption text-muted-foreground">{t("offlinePartial", { done: download.done, total: download.total })}</p> : null}
            {download.status === "running" ? <div className="h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label={tc("progress")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={download.total ? progressPercent : undefined}>
              <div className={cn("h-full rounded-full bg-primary transition-[width]", !download.total && "motion-safe:animate-pulse")} style={{ width: `${download.total ? progressPercent : 100}%` }} />
            </div> : null}
            {download.status === "error" ? <p className="text-sm text-muted-foreground">{download.logs.at(-1)}</p> : null}
            <details className="text-xs text-muted-foreground" aria-live="off"><summary className="cursor-pointer">{t("offlineLog")}</summary><div className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap font-mono">{download.logs.map((line, index) => <div key={`${line}-${index}`}>{line}</div>)}</div></details>
          </div> : null}
          <p className="type-caption text-muted-foreground">{download.status === "running" ? t("offlineBackgroundNote") : planState === "saved" && plan ? t("offlineStoredVersion", { version: plan.version }) : t("offlineBackgroundNote")}</p>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <button type="button" aria-expanded={customizeOpen} aria-controls={CUSTOMIZE_ID} onClick={() => setCustomizeOpen((open) => !open)} className="flex w-full items-center justify-between gap-4 p-5 text-start">
          <span><span className="block font-semibold">{t("offlineCustomize")}</span><span className="mt-1 block type-caption text-muted-foreground">{selectedLocales.map((id) => localeNames[id]).join(", ") || t("offlineNotSaved")} · {selectedTools.size} {t("offlineTools")}</span></span>
          <ChevronDown aria-hidden className={cn("h-4 w-4 shrink-0 transition-transform", customizeOpen && "rotate-180")} />
        </button>
        {customizeOpen ? <div id={CUSTOMIZE_ID} className="divide-y divide-border/50 border-t border-border/50">
      {/* Choosing what to download. What is saved is reported on its own, in the
          Manage downloads menu below, so each row holds a single control. */}
      <section data-offline-picker>
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
      </section>

      {/* The app's own pages. They are what makes the app usable with the
          network off — down to the page that manages all of this — so they are
          offered like anything else that can be downloaded, one row each, and
          every one of them is ticked to begin with. */}
      <section data-offline-picker>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><CardTitle>{t("offlinePages")}</CardTitle><p className="mt-1 type-caption text-muted-foreground">{t("offlinePagesDesc")}</p></div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedPages([...APP_PAGE_IDS])}>{tc("selectAll")}</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedPages([])}>{tc("clear")}</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-1 rounded-xl border border-border/50 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {APP_PAGES.map((page) => (
              <label key={page.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary/60">
                <input type="checkbox" checked={selectedPages.includes(page.id)} onChange={() => togglePage(page.id)} />
                <span className="min-w-0 flex-1 truncate">{tr(page.label)}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </section>

      <section data-offline-picker>
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
                    aria-label={`${tcat(category)} (${items.length})`}
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
      </section>

          <div className="p-5">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={engines} onChange={(event) => setEngines(event.target.checked)} className="mt-1" />
              <span><span className="font-medium">{t("offlineEngines")}</span><span className="mt-0.5 block type-caption text-muted-foreground">{t("offlineEnginesDesc")}</span></span>
            </label>
          </div>
        </div> : null}
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
        ) : reportError ? <p className="p-5 text-sm text-muted-foreground">{t("offlineUnavailable")}</p> : savedCount ? (
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

            {enginesStored ? (
              <section className="space-y-1">
                <h4 className="type-caption font-medium uppercase tracking-wide text-muted-foreground">{t("offlineEnginesLabel")}</h4>
                <label className="flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 text-sm hover:bg-secondary/60">
                  <input type="checkbox" checked={removal.engines} onChange={(event) => setRemoval((current) => ({ ...current, engines: event.target.checked }))} />
                  <span className="min-w-0 flex-1 truncate">{t("offlineEngines")}</span>
                </label>
              </section>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="destructive" onClick={() => void removeSelected()} disabled={!removalCount || download.status === "running" || removing}>
                <Trash2 className="me-2 h-4 w-4" />{t("offlineRemoveSelected")}
                {removalCount ? (
                  <span className="ms-1 rounded-full bg-destructive-foreground/20 px-2 py-0.5 text-xs tabular-nums">
                    {removalCount}
                  </span>
                ) : null}
              </Button>
              <Button variant="ghost" onClick={() => void removeAll()} disabled={download.status === "running" || removing}>
                {t("offlineRemoveAll")}
              </Button>
            </div>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
