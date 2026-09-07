"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { downloadMany, extensionForMime } from "@/lib/utils";
import { parseImageMetadata } from "@/lib/image/exif";
import { stripMetadata } from "@/lib/image/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";

export function ImageMetadata() {
  const t = useTranslations("tools.image-metadata");
  const tc = useTranslations("common");
  const log = useToolHistory("image-metadata");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [tags, setTags] = useState<Array<{ tag: string; value: string }>>([]);
  const [loading, setLoading] = useState(false);

  const onFiles = async (items: FileItem[]) => {
    setFiles(items);
    if (!items[0]) {
      setTags([]);
      return;
    }
    try {
      const bytes = new Uint8Array(await items[0].file.arrayBuffer());
      setTags(parseImageMetadata(bytes));
    } catch {
      setTags([]);
    }
  };

  const run = async () => {
    if (!files.length) return;
    setLoading(true);
    try {
      const items = [];
      for (const f of files) {
        const blob = await stripMetadata(f.file);
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `-clean.${extensionForMime(blob.type, "jpg")}`,
        });
      }
      await downloadMany(items, "stripped-images.zip");
      toast.success(t("success", { count: files.length }));
      log(`${files.length}`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="image-metadata">
      <p className="text-sm text-muted-foreground">{t("note")}</p>
      <FileDropzone accept="image/*" files={files} onChange={onFiles} />
      {files[0] ? (
        tags.length ? (
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="px-3 py-2 font-medium">{t("tag")}</th>
                  <th className="px-3 py-2 font-medium">{t("value")}</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((row) => (
                  <tr key={row.tag} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2 font-medium">{row.tag}</td>
                    <td className="px-3 py-2 break-all">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noExif")}</p>
        )
      ) : null}
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} />
    </ToolShell>
  );
}
