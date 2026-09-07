"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Label } from "@/components/ui/label";
import { downloadMany, extensionForMime } from "@/lib/utils";
import { rotateImage, flipImage } from "@/lib/image/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";
import { selectClass } from "./image-extra-shared";

export function ImageRotate() {
  const t = useTranslations("tools.image-rotate");
  const tc = useTranslations("common");
  const log = useToolHistory("image-rotate");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [op, setOp] = useState<"90" | "180" | "270" | "h" | "v">("90");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const items: Array<{ blob: Blob; name: string }> = [];
      for (const f of files) {
        const blob =
          op === "h" || op === "v"
            ? await flipImage(f.file, op)
            : await rotateImage(f.file, Number(op) as 90 | 180 | 270);
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `-rotated.${extensionForMime(blob.type, "png")}`,
        });
      }
      await downloadMany(items, "rotated-images.zip");
      toast.success(t("success", { count: files.length }));
      log(op, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="image-rotate">
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>{t("operation")}</Label>
        <select className={selectClass} value={op} onChange={(e) => setOp(e.target.value as typeof op)}>
          <option value="90">{t("rot90")}</option>
          <option value="180">{t("rot180")}</option>
          <option value="270">{t("rot270")}</option>
          <option value="h">{t("flipH")}</option>
          <option value="v">{t("flipV")}</option>
        </select>
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </ToolShell>
  );
}
