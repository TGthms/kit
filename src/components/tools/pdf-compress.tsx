"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { downloadMany, bytesToBlob } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { runSequentialBatch, stemmedName } from "@/lib/jobs/batch";
import { ActionBar, DownloadResult, ToolLimits, ToolShell, useToolHistory, useToolJob, loadPdfjs } from "./shared";

export function PdfCompress() {
  const t = useTranslations("tools.pdf-compress");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-compress");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [quality, setQuality] = useState(0.65);
  const job = useToolJob();
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const run = async () => {
    if (!files.length) return;
    const ac = job.start();
    try {
      const { compressPdfLossy } = await loadPdfjs();
      const items = await runSequentialBatch(
        files,
        async (f, index) => {
          const out = await compressPdfLossy(await f.file.arrayBuffer(), quality, 1.2, {
            signal: ac.signal,
            onProgress: (pageRatio) =>
              job.setProgress(Math.round(((index + pageRatio) / files.length) * 100)),
          });
          if (out.truncated) {
            toast.warning(tc("pdfPageCap", { total: out.totalPages, processed: out.processedPages }));
          }
          return {
            blob: bytesToBlob(out.bytes, "application/pdf"),
            name: stemmedName(f.file.name, "-compressed", "pdf"),
          };
        },
        { signal: ac.signal }
      );
      await downloadMany(items, "compressed-pdfs.zip");
      if (items[0]) setResult(items[0]);
      toast.success(t("success"));
      log(`q=${quality} n=${files.length}`, "success", { quality, count: files.length });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        toast.error(tc("cancel"));
      } else {
        toast.error(e instanceof Error ? e.message : tc("error"));
        log("failed", "failed");
      }
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="pdf-compress">
      <ToolLimits>
        <p>{t("note")}</p>
      </ToolLimits>
      <FileDropzone accept="application/pdf" files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>
          {tc("quality")}: {Math.round(quality * 100)}%
        </Label>
        <Slider value={[quality]} min={0.3} max={0.95} step={0.05} onValueChange={(v) => setQuality(v[0])} />
      </div>
      {job.loading && <Progress value={job.progress} />}
      <ActionBar
        onRun={run}
        loading={job.loading}
        label={t("run")}
        disabled={!files.length}
        onCancel={job.cancel}
      />
      <DownloadResult file={result} />
    </ToolShell>
  );
}
