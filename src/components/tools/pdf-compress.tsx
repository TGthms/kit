"use client";
import { useToolJob } from "./use-tool-job";
import { FileJobResult } from "./file-job-result";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Field } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { bytesToBlob } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { runSequentialBatch, stemmedName } from "@/lib/jobs/batch";
import { ActionBar, ToolLimits, ToolShell, useToolHistory, loadPdfjs } from "./shared";

export function PdfCompress() {
  const t = useTranslations("tools.pdf-compress");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-compress");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [quality, setQuality] = useState(0.65);
  const job = useToolJob([files, quality]);

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
              job.report(ac, Math.round(((index + pageRatio) / files.length) * 100)),
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
      if (!job.complete(ac, items)) return;
      toast.success(t("success"));
      log(`q=${quality} n=${files.length}`, "success", { quality, count: files.length });
    } catch (e) {
      const failure = e instanceof Error && e.message === "pdfFullDocumentLimit" ? new Error(tc("pdfFullDocumentLimit", { count: 200 })) : e;
      if (!job.fail(ac, failure)) return;
      if (e instanceof DOMException && e.name === "AbortError") {
        toast.error(tc("cancel"));
      } else {
        toast.error(failure instanceof Error ? failure.message : tc("error"));
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
      <Field className="space-y-2" label={<>{tc("quality")}: {Math.round(quality * 100)}%</>}>
        <Slider aria-label={tc("quality")} value={[quality]} min={0.3} max={0.95} step={0.05} onValueChange={(v) => setQuality(v[0])} />
      </Field>
      {job.loading && <Progress value={job.progress} />}
      <ActionBar
        onRun={run}
        loading={job.loading}
        label={t("run")}
        disabled={!files.length}
        onCancel={job.cancel}
      />

      <FileJobResult job={job} />
    </ToolShell>
  );
}
