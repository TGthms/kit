"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { downloadMany, extensionForMime } from "@/lib/utils";
import { resizeImage } from "@/lib/image/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";

export function ImageResize() {
  const t = useTranslations("tools.image-resize");
  const tc = useTranslations("common");
  const log = useToolHistory("image-resize");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(0);
  const [lock, setLock] = useState(true);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const items = [];
      for (const f of files) {
        const blob = await resizeImage(f.file, { width, height, lockAspect: lock });
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `-resized.${extensionForMime(blob.type, "png")}`,
        });
      }
      await downloadMany(items, "resized-images.zip");
      toast.success(t("success", { count: files.length }));
      log(`${width}x${height}`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="image-resize">
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>{tc("width")}</Label>
          <Input type="number" min={0} value={width} onChange={(e) => setWidth(Number(e.target.value) || 0)} />
        </div>
        <div className="space-y-2">
          <Label>{tc("height")}</Label>
          <Input type="number" min={0} value={height} onChange={(e) => setHeight(Number(e.target.value) || 0)} />
        </div>
        <div className="flex items-end gap-2 pb-2">
          <Switch checked={lock} onCheckedChange={setLock} id="lock" />
          <Label htmlFor="lock">{t("lockAspect")}</Label>
        </div>
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </ToolShell>
  );
}
