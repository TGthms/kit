"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { downloadMany, extensionForMime } from "@/lib/utils";
import { compressImage, compressOutputMime } from "@/lib/image/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";

export function ImageCompress() {
  const t = useTranslations("tools.image-compress");
  const tc = useTranslations("common");
  const log = useToolHistory("image-compress");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [quality, setQuality] = useState(0.75);
  const [maxW, setMaxW] = useState(1920);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const qualityApplies =
    files.length === 0 || files.some((item) => compressOutputMime(item.file.type) !== "image/png");

  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    setProgress(0);
    try {
      const results: Array<{ name: string; blob: Blob }> = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const blob = await compressImage(f.file, {
          quality,
          maxWidth: maxW,
          maxHeight: maxW,
          mime: compressOutputMime(f.file.type),
        });
        const name = f.file.name.replace(/\.\w+$/, "") + `-compressed.${extensionForMime(blob.type, "jpg")}`;
        results.push({ name, blob });
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      await downloadMany(results, "compressed-images.zip");
      toast.success(t("success", { count: files.length }));
      log(`${files.length} images`, "success", { quality, maxW });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="image-compress">
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      <div className="grid gap-4 sm:grid-cols-2">
        {qualityApplies ? (
          <Field className="space-y-2" label={<>{tc("quality")}: {Math.round(quality * 100)}%</>}>
            <Slider aria-label={tc("quality")} value={[quality]} min={0.1} max={1} step={0.05} onValueChange={(v) => setQuality(v[0])} />
          </Field>
        ) : null}
        <Field className="space-y-2" label={tc("maxWidth")}>
          <Input type="number" value={maxW} onChange={(e) => setMaxW(Number(e.target.value) || 1920)} />
        </Field>
      </div>
      {loading && <Progress value={progress} />}
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </ToolShell>
  );
}
