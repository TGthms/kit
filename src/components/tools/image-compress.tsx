"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import JSZip from "jszip";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { downloadBlob, extensionForMime } from "@/lib/utils";
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
      const zip = new JSZip();
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const blob = await compressImage(f.file, {
          quality,
          maxWidth: maxW,
          maxHeight: maxW,
          mime: compressOutputMime(f.file.type),
        });
        const name = f.file.name.replace(/\.\w+$/, "") + `-compressed.${extensionForMime(blob.type, "jpg")}`;
        zip.file(name, blob);
        if (files.length === 1) downloadBlob(blob, name);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      if (files.length > 1) {
        const z = await zip.generateAsync({ type: "blob" });
        downloadBlob(z, "compressed-images.zip");
      }
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
          <div className="space-y-2">
            <Label>
              {tc("quality")}: {Math.round(quality * 100)}%
            </Label>
            <Slider value={[quality]} min={0.1} max={1} step={0.05} onValueChange={(v) => setQuality(v[0])} />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label>{tc("maxWidth")}</Label>
          <Input type="number" value={maxW} onChange={(e) => setMaxW(Number(e.target.value) || 1920)} />
        </div>
      </div>
      {loading && <Progress value={progress} />}
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </ToolShell>
  );
}
