"use client";
import { ResultFiles, type ResultFile } from "@/components/workspace/result-files";
import { useHandoff } from "@/lib/workspace/use-handoff";
import { throwIfAborted } from "@/lib/jobs/abort";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Field } from "@/components/ui/field";
import { extensionForMime } from "@/lib/utils";
import { convertImage, type ImageMime } from "@/lib/image/core";
import { ActionBar, ToolShell, useToolHistory, useToolJob } from "./shared";

export function ImageConvert() {
  const t = useTranslations("tools.image-convert");
  const tc = useTranslations("common");
  const log = useToolHistory("image-convert");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [mime, setMime] = useState<ImageMime>("image/webp");
  useHandoff("image-convert", setFiles);
  const job = useToolJob();
  const loading = job.loading;
  const [results, setResults] = useState<ResultFile[]>([]);

  const run = async () => {
    if (!files.length) return;
    const ac = job.start();
    setResults([]);
    try {
      const items: ResultFile[] = [];
      for (const f of files) {
        throwIfAborted(ac.signal);
        const blob = await convertImage(f.file, mime);
        throwIfAborted(ac.signal);
        items.push({
          originalBytes: f.file.size,
          blob,
          name: f.file.name.replace(/\.\w+$/, "") + `.${extensionForMime(blob.type, "webp")}`,
        });
      }
      setResults(items);
      toast.success(t("success", { count: files.length }));
      log(mime, "success");
    } catch (e) {
      if (ac.signal.aborted) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="image-convert">
      <FileDropzone accept="image/*" files={files} onChange={(next) => { job.cancel(); setFiles(next); setResults([]); }} />
      <Field className="space-y-2" label={tc("format")}>
        <select
          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-base"
          value={mime}
          onChange={(e) => { job.cancel(); setMime(e.target.value as ImageMime); setResults([]); }}
        >
          <option value="image/jpeg">JPEG</option>
          <option value="image/png">PNG</option>
          <option value="image/webp">WEBP</option>
        </select>
      </Field>
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} onCancel={job.cancel} />
      <ResultFiles files={results} />
    </ToolShell>
  );
}
