"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Label } from "@/components/ui/label";
import { downloadMany, extensionForMime } from "@/lib/utils";
import { filterImage } from "@/lib/image/core";
import type { FilterName } from "@/lib/image/transform";
import { ActionBar, ToolShell, useToolHistory } from "./shared";
import { selectClass } from "./image-extra-shared";

export function ImageFilters() {
  const t = useTranslations("tools.image-filters");
  const tc = useTranslations("common");
  const log = useToolHistory("image-filters");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filter, setFilter] = useState<Exclude<FilterName, "none">>("grayscale");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const items: Array<{ blob: Blob; name: string }> = [];
      for (const f of files) {
        const blob = await filterImage(f.file, filter);
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `-${filter}.${extensionForMime(blob.type, "png")}`,
        });
      }
      await downloadMany(items, "filtered-images.zip");
      toast.success(t("success", { count: files.length }));
      log(filter, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="image-filters">
      <FileDropzone accept="image/*" files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>{t("filter")}</Label>
        <select
          className={selectClass}
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="grayscale">{t("grayscale")}</option>
          <option value="sepia">{t("sepia")}</option>
          <option value="invert">{t("invert")}</option>
        </select>
      </div>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </ToolShell>
  );
}
