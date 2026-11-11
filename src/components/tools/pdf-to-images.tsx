"use client";
import { useToolJob } from "./use-tool-job";
import { FileJobResult } from "./file-job-result";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import JSZip from "jszip";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";

import { ActionBar, ToolLimits, ToolShell, useToolHistory, loadPdfjs } from "./shared";
import { Progress } from "@/components/ui/progress";

export function PdfToImages() {
  const t = useTranslations("tools.pdf-to-images");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-to-images");
  const [files, setFiles] = useState<FileItem[]>([]);
  const job = useToolJob([files]);

  const run = async () => {
    if (!files[0]) return;
    const ac = job.start();
    try {
      const { renderPdfPagesToBlobs } = await loadPdfjs();
      const raster = await renderPdfPagesToBlobs(await files[0].file.arrayBuffer(), {
        mime: "image/jpeg",
        scale: 1.6,
        signal: ac.signal,
        onProgress: (ratio) => job.report(ac, Math.round(ratio * 100)),
      });
      if (raster.truncated) {
        toast.warning(tc("pdfPageCap", { total: raster.totalPages, processed: raster.processedPages }));
      }
      const zip = new JSZip();
      raster.blobs.forEach((blob: Blob, i: number) => zip.file(`page-${String(i + 1).padStart(3, "0")}.jpg`, blob));
      if (!job.complete(ac, [{ blob: await zip.generateAsync({ type: "blob" }), name: "pdf-pages.zip" }])) return;
      toast.success(t("success", { count: raster.blobs.length }));
      log(`${raster.blobs.length} pages`, "success");
    } catch (e) {
      if (!job.fail(ac, e)) return;
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
    <ToolShell toolId="pdf-to-images">
      <ToolLimits>
        <p>{t("limits")}</p>
      </ToolLimits>
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      {job.loading && <Progress value={job.progress} aria-label={t("run")} />}
      <ActionBar
        onRun={run}
        loading={job.loading}
        label={t("run")}
        disabled={!files[0]}
        onCancel={job.cancel}
      />
      <FileJobResult job={job} />
    </ToolShell>
  );
}
