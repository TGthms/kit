"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FolderOpen } from "lucide-react";
import dynamic from "next/dynamic";
const ModalSurface = dynamic(() => import("@/components/ui/modal-surface").then(m => m.ModalSurface));
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HeroButton } from "@/components/ui/hero-button";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { downloadText } from "@/lib/utils";
import { useTaskScope } from "@/lib/react/task-scope";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  graphFile, parseGraphFile,
  GRAPH_LIBRARY_KEY,
  parseGraphLibrary,
  type GraphDocument,
  type SavedGraph,
} from "@/lib/workspace/math";

export function GraphLibrary({
  document,
  onLoad,
  onFresh,
  failed,
}: {
  document: GraphDocument;
  onLoad: (doc: GraphDocument) => void;
  onFresh: () => void;
  failed: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("workspace"),
    tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const task = useTaskScope();
  const [importing, setImporting] = useState(false);
  const graphsRef = useRef<SavedGraph[]>([]);
  const [graphs, setGraphs] = useState<SavedGraph[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GRAPH_LIBRARY_KEY);
      if (raw && raw.length <= 800000) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setGraphs(parseGraphLibrary(JSON.parse(raw)));
      }
    } catch {
      setError(true);
    }
  }, []);
  useLayoutEffect(() => { graphsRef.current = graphs; }, [graphs]);
  const write = (next: SavedGraph[]) => {
    try {
      localStorage.setItem(GRAPH_LIBRARY_KEY, JSON.stringify(next));
      graphsRef.current = next;
      setGraphs(next);
      setError(false);
      setStatus(tc("done"));
      return true;
    } catch {
      setError(true);
      return false;
    }
  };
  return (
    <>
      <Button size="icon" variant="ghost" className="size-9 rounded-lg" aria-label={t("savedGraphs")} title={t("savedGraphs")} onClick={() => setOpen(true)}><FolderOpen aria-hidden className="size-4" /></Button>
      {/* Unmount on close so WebKit cannot leave a focus-trapping overlay
          waiting indefinitely for an interrupted CSS exit animation. */}
      {open && <ModalSurface open={open} onOpenChange={setOpen} title={t("savedGraphs")} closeLabel={tc("close")}>
      <div className="text-sm">
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => { try { downloadText(graphFile(name, document), "kit-graph.json", "application/json"); setError(false); } catch { setError(true); } }}>{tc("download")}</Button>
        <Button size="sm" variant="outline" disabled={importing || graphs.length >= 20} onClick={() => fileInput.current?.click()}>{importing ? tc("processing") : tc("addFiles")}</Button>
        <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" aria-label={t("savedGraphs")} onChange={async event => {
          const file = event.target.files?.[0]; event.target.value = "";
          const current = task.begin();
          if (!file) return;
          setImporting(true);
          try {
            if (file.size > 40000) throw new Error("invalid");
            const imported = parseGraphFile(await file.text());
            if (!current()) return;
            if (graphsRef.current.length >= 20) throw new Error("full");
            write([...graphsRef.current, { ...imported, id: crypto.randomUUID() }]);
          } catch { if (current()) setError(true); }
          finally { if (current()) setImporting(false); }
        }} />
      </div>
      <p className="my-3 text-xs text-muted-foreground">
        {t("mathRecoveryDesc")}
      </p>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || graphs.length >= 20) return;
          if (
            write([
              ...graphs,
              {
                id: crypto.randomUUID(),
                name: name.trim(),
                document: structuredClone(document),
              },
            ])
          )
            setName("");
        }}
      >
        <Field label={t("graphName")} className="min-w-40 flex-1">
          <Input
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Button
          type="submit"
          variant="outline"
          disabled={!name.trim() || graphs.length >= 20}
        >
          {tc("save")} ({graphs.length}/20)
        </Button>
      </form>
      <ul className="my-3 divide-y">
        {graphs.map((graph) => (
          <li key={graph.id} className="flex items-center gap-2 py-2">
            <span className="min-w-0 flex-1 break-words">{graph.name}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onLoad(structuredClone(graph.document));
                setOpen(false);
                setStatus(tc("done"));
              }}
            >
              {tc("applyPreset")}
            </Button>
            <ConfirmDialog
              locale={locale}
              trigger={
                <HeroButton
                  variant="ghost"
                  aria-label={`${tc("delete")} ${graph.name}`}
                >
                  {tc("delete")}
                </HeroButton>
              }
              title={tc("delete")}
              description={graph.name}
              cancelLabel={tc("cancel")}
              confirmLabel={tc("delete")}
              onConfirm={() =>
                write(graphs.filter((entry) => entry.id !== graph.id))
              }
            />
          </li>
        ))}
      </ul>
      <Button size="sm" variant="outline" onClick={() => { onFresh(); setOpen(false); }}>
        {t("startFresh")}
      </Button>
      {(error || failed) && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {t("storageFailed")}
        </p>
      )}
      <p role="status" className="mt-2 text-xs text-muted-foreground">
        {status}
      </p>
      </div>
      </ModalSurface>}
    </>
  );
}
