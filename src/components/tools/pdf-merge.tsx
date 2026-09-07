"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { downloadBlob, bytesToBlob } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { ActionBar, DownloadResult, ToolShell, useToolHistory, useToolJob, loadPdfjs } from "./shared";
import { mergePdfs } from "@/lib/pdf/core";
import { replaceObjectUrlRecord, revokeObjectUrls } from "@/lib/files/object-url";

export function PdfMerge() {
  const t = useTranslations("tools.pdf-merge");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-merge");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const job = useToolJob();
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const thumbsGen = useRef(0);
  const thumbsRef = useRef(thumbs);

  useEffect(() => {
    thumbsRef.current = thumbs;
  }, [thumbs]);

  useEffect(
    () => () => {
      revokeObjectUrls(Object.values(thumbsRef.current));
    },
    []
  );

  const loadThumbs = async (items: FileItem[]) => {
    const gen = ++thumbsGen.current;
    setFiles(items);
    if (items.length === 0) {
      setThumbs((current) => replaceObjectUrlRecord(current, {}));
      return;
    }
    try {
      const { renderPdfThumbnail } = await loadPdfjs();
      const { runPooled } = await import("@/lib/jobs/batch");
      const rendered = await runPooled(items, 3, async (item) => {
        try {
          return { id: item.id, url: await renderPdfThumbnail(await item.file.arrayBuffer()) };
        } catch {
          return null;
        }
      });
      const next = Object.fromEntries(
        rendered
          .filter((item): item is { id: string; url: string } => Boolean(item))
          .map((item) => [item.id, item.url])
      );
      if (gen !== thumbsGen.current) {
        revokeObjectUrls(Object.values(next));
        return;
      }
      setThumbs((current) => replaceObjectUrlRecord(current, next));
    } catch {
      /* thumbnails are optional */
    }
  };

  const run = async () => {
    if (files.length < 2) {
      toast.error(t("empty"));
      return;
    }
    const ac = job.start();
    try {
      const buffers = [];
      for (let i = 0; i < files.length; i += 1) {
        if (ac.signal.aborted) throw new DOMException("Aborted", "AbortError");
        buffers.push(await files[i].file.arrayBuffer());
        job.setProgress(Math.round(((i + 1) / (files.length + 1)) * 100));
      }
      const out = await mergePdfs(buffers);
      if (ac.signal.aborted) throw new DOMException("Aborted", "AbortError");
      job.setProgress(100);
      const blob = bytesToBlob(out, "application/pdf");
      downloadBlob(blob, "merged.pdf");
      setResult({ blob, name: "merged.pdf" });
      toast.success(t("success", { count: files.length }));
      log(`${files.length} files`, "success");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        toast.error(tc("cancel"));
      } else {
        toast.error(e instanceof Error ? e.message : tc("error"));
        log("merge failed", "failed");
      }
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="pdf-merge">
      <FileDropzone accept="application/pdf" files={files} onChange={loadThumbs} reorder />
      {files.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {files.map((f) => (
            <div key={f.id} className="w-24 overflow-hidden rounded-xl border bg-card">
              {thumbs[f.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbs[f.id]} alt="" className="h-28 w-full object-cover" />
              ) : (
                <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">PDF</div>
              )}
              <p className="truncate px-1 py-1 text-[10px]">{f.file.name}</p>
            </div>
          ))}
        </div>
      )}
      {files.length > 1 ? <p className="text-xs text-muted-foreground">{tc("reorder")}</p> : null}
      {job.loading ? <Progress value={job.progress} /> : null}
      <ActionBar onRun={run} loading={job.loading} label={t("run")} disabled={files.length < 2} onCancel={job.cancel} />
      <DownloadResult file={result} />
    </ToolShell>
  );
}
