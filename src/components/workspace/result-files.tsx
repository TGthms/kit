"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
const UseIn = dynamic(() => import("./use-in").then((module) => module.UseIn));
import { downloadBlob, downloadMany, formatBytes } from "@/lib/utils";
import { HANDOFF_BYTES } from "@/lib/workspace/handoff";
export type ResultFile = { blob: Blob; name: string; originalBytes?: number };
export function ResultFiles({ files }: { files: ResultFile[] }) {
  const t = useTranslations("common");
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
    setBusy(true);
    setError(false);
    try {
      if (files.length === 1) downloadBlob(files[0].blob, files[0].name);
      else await downloadMany(files, "kit-results.zip");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
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
                      !(
                        reason instanceof DOMException &&
                        reason.name === "AbortError"
                      )
                    )
                      setError(true);
                  })
                  .finally(() => setBusy(false));
              } catch {
                setError(true);
                setBusy(false);
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
