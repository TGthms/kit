"use client";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HeroButton } from "@/components/ui/hero-button";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
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
  const write = (next: SavedGraph[]) => {
    try {
      localStorage.setItem(GRAPH_LIBRARY_KEY, JSON.stringify(next));
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
    <details className="rounded-xl border bg-card px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium">
        {t("savedGraphs")}
      </summary>
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
      <Button size="sm" variant="outline" onClick={onFresh}>
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
    </details>
  );
}
