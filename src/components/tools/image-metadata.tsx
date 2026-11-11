"use client";
import { useToolJob } from "./use-tool-job";
import { FileJobResult } from "./file-job-result";
import { useTaskScope } from "@/lib/react/task-scope";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { extensionForMime } from "@/lib/utils";
import { parseImageMetadata } from "@/lib/image/exif";
import { stripMetadata } from "@/lib/image/core";
import { ActionBar, ToolShell, useToolHistory } from "./shared";

export function ImageMetadata() {
  const t = useTranslations("tools.image-metadata");
  const tc = useTranslations("common");
  const log = useToolHistory("image-metadata");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [tags, setTags] = useState<Array<{ tag: string; value: string }>>([]);
  const job = useToolJob([files]);
  const loading = job.loading;

  const source = useTaskScope();
  const onFiles = async (items: FileItem[]) => {
    const current = source.begin();
    setFiles(items);
    if (!items[0]) {
      setTags([]);
      return;
    }
    try {
      const bytes = new Uint8Array(await items[0].file.arrayBuffer());
      if (current()) setTags(parseImageMetadata(bytes));
    } catch {
      if (current()) setTags([]);
    }
  };

  const run = async () => {
    if (!files.length) return;
    const ac = job.start();
    try {
      const items = [];
      for (const f of files) {
        if (ac.signal.aborted) return;
        const blob = await stripMetadata(f.file);
        items.push({
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `-clean.${extensionForMime(blob.type, "jpg")}`,
        });
      }
      if (!job.complete(ac, items)) return;
      toast.success(t("success", { count: files.length }));
      log(`${files.length}`, "success");
    } catch (e) {
      if (!job.fail(ac, e)) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="image-metadata" result={<FileJobResult job={job} original={files[0]?.file} />}>
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
      <ActionBar onCancel={job.cancel} onRun={run} loading={loading} label={t("run")} disabled={!files.length} />

    </ToolShell>
  );
}
