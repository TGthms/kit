"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
const UseIn = dynamic(() => import("./use-in").then((module) => module.UseIn));
import { downloadBlob, archiveBlob, formatBytes } from "@/lib/utils";
import { useTaskScope } from "@/lib/react/task-scope";
import { HANDOFF_BYTES } from "@/lib/workspace/handoff";
export type ResultFile = { blob: Blob; name: string; originalBytes?: number };
const identities = new WeakMap<Blob, number>();
let identity = 0;
export function ResultFiles({ files }: { files: ResultFile[] }) {
  const key = JSON.stringify(
    files.map((file) => {
      if (!identities.has(file.blob)) identities.set(file.blob, ++identity);
      return [identities.get(file.blob), file.name];
    }),
  );
  return <FileResultPanel key={key} files={files} />;
}
function FileResultPanel({ files }: { files: ResultFile[] }) {
  const t = useTranslations("common");
  const operation = useTaskScope();
  const [canShare, setCanShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    try {
      // Probe capability without materializing a second copy of large outputs.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCanShare(
        !!navigator.share &&
          !!navigator.canShare?.({
            files: files.map(
              (item) =>
                new File([item.blob], item.name, { type: item.blob.type }),
            ),
          }),
      );
    } catch {
      setCanShare(false);
    }
  }, [files]);
  if (!files.length) return null;
  const total = files.reduce((sum, item) => sum + item.blob.size, 0);
  const transferable =
    files.length <= 100 &&
    total <= HANDOFF_BYTES &&
    files.every((item) => item.blob.type.startsWith("image/"));
  const download = async () => {
    if (busy) return;
    const current = operation.begin();
    setBusy(true);
    setError(false);
    try {
      if (files.length === 1) downloadBlob(files[0].blob, files[0].name);
      else {
        const archive = await archiveBlob(files);
        if (current()) downloadBlob(archive, "kit-results.zip");
      }
    } catch {
      if (current()) setError(true);
    } finally {
      if (current()) setBusy(false);
    }
  };
  return (
    <section
      aria-label={t("result")}
      className="space-y-3 rounded-2xl border border-primary/25 bg-primary/5 p-4"
    >
      <p role="status" className="text-sm font-medium">
        {t("done")} · {files.length} {t("files")}
      </p>
      <ul className="max-h-56 space-y-2 overflow-y-auto">
        {files.map((item, index) => (
          <li key={index} className="min-w-0 text-sm">
            <p className="break-words font-medium">{item.name}</p>
            <p className="text-xs tabular-nums text-muted-foreground" dir="ltr">
              {item.originalBytes !== undefined
                ? `${formatBytes(item.originalBytes)} → `
                : ""}
              {formatBytes(item.blob.size)}
              {item.originalBytes
                ? ` (${Math.round((item.blob.size / item.originalBytes - 1) * 100)}%)`
                : ""}
            </p>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => void download()}
          disabled={busy}
        >
          {busy ? t("processing") : t("download")}
        </Button>
        {canShare && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              if (busy) return;
              const current = operation.begin();
              setBusy(true);
              setError(false);
              // Keep share() in the original tap's activation window (iOS).
              try {
                void navigator
                  .share({
                    files: files.map(
                      (item) =>
                        new File([item.blob], item.name, {
                          type: item.blob.type,
                        }),
                    ),
                  })
                  .catch((reason) => {
                    if (
                      current() &&
                      !(
                        reason instanceof DOMException &&
                        reason.name === "AbortError"
                      )
                    )
                      setError(true);
                  })
                  .finally(() => {
                    if (current()) setBusy(false);
                  });
              } catch {
                if (current()) {
                  setError(true);
                  setBusy(false);
                }
              }
            }}
          >
            {t("share")}
          </Button>
        )}
      </div>
      {transferable && (
        <UseIn files={files} disabled={busy} onError={() => setError(true)} />
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {t("error")} · {t("retry")}
        </p>
      )}
    </section>
  );
}
