"use client";
import { useToolJob } from "./use-tool-job";
import { FileJobResult } from "./file-job-result";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import JSZip from "jszip";
import { Progress } from "@/components/ui/progress";
import { ActionBar, ToolLimits, ToolShell, useToolHistory, loadPdfjs } from "./shared";

export function PdfExtract() {
  const t = useTranslations("tools.pdf-extract");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-extract");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [mode, setMode] = useState<"text" | "images">("text");
  const [result, setResult] = useState("");
  const job = useToolJob([files, mode]);

  const run = async () => {
    if (!files[0]) return;
    const ac = job.start();
    try {
      const { extractPdfText, renderPdfPagesToBlobs } = await loadPdfjs();
      if (mode === "text") {
        const extracted = await extractPdfText(await files[0].file.arrayBuffer(), { signal: ac.signal });
        if (extracted.truncated) {
          toast.warning(tc("pdfPageCap", { total: extracted.totalPages, processed: extracted.processedPages }));
        }
        if (ac.signal.aborted) return;
        setResult(extracted.text);
        if (!job.complete(ac, [{ blob: new Blob([extracted.text], { type: "text/plain" }), name: "extract.txt" }])) return;
      } else {
        const raster = await renderPdfPagesToBlobs(await files[0].file.arrayBuffer(), {
          mime: "image/jpeg",
          scale: 1.5,
          signal: ac.signal,
          onProgress: (ratio) => job.report(ac, Math.round(ratio * 100)),
        });
        if (raster.truncated) {
          toast.warning(tc("pdfPageCap", { total: raster.totalPages, processed: raster.processedPages }));
        }
        const zip = new JSZip();
        raster.blobs.forEach((blob: Blob, i: number) => zip.file(`page-${String(i + 1).padStart(3, "0")}.jpg`, blob));
        if (!job.complete(ac, [{ blob: await zip.generateAsync({ type: "blob" }), name: "pdf-pages.zip" }])) return;
        if (ac.signal.aborted) return;
        setResult(t("imagesReady", { count: raster.blobs.length }));
      }
      toast.success(t("success"));
      log(mode, "success");
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
    <ToolShell toolId="pdf-extract">
      <ToolLimits>
        <p>{t("limits")}</p>
      </ToolLimits>
      <FileDropzone accept="application/pdf" multiple={false} files={files} onChange={setFiles} />
      <div className="flex gap-2">
        <Button variant={mode === "text" ? "default" : "outline"} onClick={() => setMode("text")}>
          {t("modeText")}
        </Button>
        <Button variant={mode === "images" ? "default" : "outline"} onClick={() => setMode("images")}>
          {t("modeImages")}
        </Button>
      </div>
      {job.loading && <Progress value={job.progress} aria-label={t("run")} />}
      {result && <Textarea aria-label={tc("output")} value={result} readOnly className="min-h-48" />}
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
