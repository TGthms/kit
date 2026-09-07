"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Label } from "@/components/ui/label";
import { downloadMany, extensionForMime } from "@/lib/utils";
import { convertImage, type ImageMime } from "@/lib/image/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";

export function ImageConvert() {
  const t = useTranslations("tools.image-convert");
  const tc = useTranslations("common");
  const log = useToolHistory("image-convert");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [mime, setMime] = useState<ImageMime>("image/webp");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const items = [];
      for (const f of files) {
        const blob = await convertImage(f.file, mime);
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `.${extensionForMime(blob.type, "webp")}`,
        });
      }
      await downloadMany(items, "converted-images.zip");
      toast.success(t("success", { count: files.length }));
      log(mime, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="image-convert">
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>{tc("format")}</Label>
        <select
          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-base"
          value={mime}
          onChange={(e) => setMime(e.target.value as ImageMime)}
        >
          <option value="image/jpeg">JPEG</option>
          <option value="image/png">PNG</option>
          <option value="image/webp">WEBP</option>
        </select>
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </ToolShell>
  );
}
