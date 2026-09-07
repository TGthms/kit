"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { downloadMany, bytesToBlob } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { runSequentialBatch, stemmedName } from "@/lib/jobs/batch";
import { ActionBar, ToolShell, useToolHistory, useToolJob } from "./shared";
import { watermarkPdf } from "@/lib/pdf/core";

export function PdfWatermark() {
  const t = useTranslations("tools.pdf-watermark");
  const tc = useTranslations("common");
  const log = useToolHistory("pdf-watermark");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [text, setText] = useState("CONFIDENTIAL");
  const [position, setPosition] = useState<"header" | "footer" | "center">("center");
  const [opacity, setOpacity] = useState(0.25);
  const job = useToolJob();

  const run = async () => {
    if (!files.length) return;
    const ac = job.start();
    try {
      const items = await runSequentialBatch(
        files,
        async (f) => {
          const out = await watermarkPdf(await f.file.arrayBuffer(), text, position, opacity);
          return {
            blob: bytesToBlob(out, "application/pdf"),
            name: stemmedName(f.file.name, "-watermarked", "pdf"),
          };
        },
        { signal: ac.signal, onProgress: (r) => job.setProgress(Math.round(r * 100)) }
      );
      await downloadMany(items, "watermarked-pdfs.zip");
      toast.success(t("success"));
      log(`n=${files.length}`, "success");
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
    <ToolShell toolId="pdf-watermark">
      <FileDropzone accept="application/pdf" files={files} onChange={setFiles} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("text")}</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("position")}</Label>
          <select
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-base"
            value={position}
            onChange={(e) => setPosition(e.target.value as typeof position)}
          >
            <option value="center">{t("center")}</option>
            <option value="header">{t("header")}</option>
            <option value="footer">{t("footer")}</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>
          {t("opacity")}: {Math.round(opacity * 100)}%
        </Label>
        <Slider value={[opacity]} min={0.05} max={0.8} step={0.05} onValueChange={(v) => setOpacity(v[0])} />
      </div>
      {job.loading && <Progress value={job.progress} />}
      <ActionBar
        onRun={run}
        loading={job.loading}
        label={t("run")}
        disabled={!files.length || !text}
        onCancel={job.cancel}
      />
    </ToolShell>
  );
}
