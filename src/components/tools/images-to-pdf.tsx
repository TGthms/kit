"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Button } from "@/components/ui/button";
import { downloadBlob, bytesToBlob } from "@/lib/utils";
import { imagesToPdf, detectImageMime, type EmbeddableImage } from "@/lib/pdf/core";
import { parseImageMetadata } from "@/lib/image/exif";
import { ActionBar, DownloadResult, ToolLimits, ToolShell, useToolHistory, useToolJob } from "./shared";
import { Progress } from "@/components/ui/progress";

export function ImagesToPdf() {
  const t = useTranslations("tools.images-to-pdf");
  const tc = useTranslations("common");
  const log = useToolHistory("images-to-pdf");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [pageSize, setPageSize] = useState<"a4" | "image">("a4");
  const job = useToolJob();
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);

  const run = async () => {
    if (!files.length) return;
    const ac = job.start();
    try {
      const { convertImage } = await import("@/lib/image/core");
      const images: EmbeddableImage[] = [];
      for (let i = 0; i < files.length; i += 1) {
        if (ac.signal.aborted) throw new DOMException("Aborted", "AbortError");
        const bytes = new Uint8Array(await files[i].file.arrayBuffer());
        const mime = detectImageMime(bytes);
        // JPEG/PNG pass straight through to pdf-lib's native embedders; only
        // other formats (or oriented JPEGs, which would embed rotated) pay
        // for a canvas re-encode to PNG.
        const orientedJpeg =
          mime === "image/jpeg" &&
          parseImageMetadata(bytes).some((tag) => tag.tag === "Orientation" && tag.value !== "1");
        if (mime && !orientedJpeg) {
          images.push({ bytes, mime });
        } else {
          const png = await convertImage(files[i].file, "image/png");
          images.push({ bytes: new Uint8Array(await png.arrayBuffer()), mime: "image/png" });
        }
        job.setProgress(Math.round(((i + 1) / (files.length + 1)) * 100));
      }
      const output = await imagesToPdf(images, { pageSize, margin: 24 });
      if (ac.signal.aborted) throw new DOMException("Aborted", "AbortError");
      job.setProgress(100);
      const blob = bytesToBlob(output, "application/pdf");
      downloadBlob(blob, "images.pdf");
      setResult({ blob, name: "images.pdf" });
      toast.success(t("success", { count: files.length }));
      log(`${files.length} images`, "success");
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") {
        toast.error(tc("cancel"));
      } else {
        toast.error(reason instanceof Error ? reason.message : tc("error"));
        log("failed", "failed");
      }
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="images-to-pdf">
      <ToolLimits>
        <p>{t("limits")}</p>
      </ToolLimits>
      <FileDropzone accept="image/*" files={files} onChange={setFiles} reorder />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={pageSize === "a4" ? "default" : "outline"} onClick={() => setPageSize("a4")}>
          {t("fitA4")}
        </Button>
        <Button type="button" variant={pageSize === "image" ? "default" : "outline"} onClick={() => setPageSize("image")}>
          {t("fitImage")}
        </Button>
      </div>
      {job.loading ? <Progress value={job.progress} /> : null}
      <ActionBar onRun={run} loading={job.loading} label={t("run")} disabled={!files.length} onCancel={job.cancel} />
      <DownloadResult file={result} />
    </ToolShell>
  );
}
