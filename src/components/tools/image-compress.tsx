"use client";
import { ResultFiles, type ResultFile } from "@/components/workspace/result-files";
import { useHandoff } from "@/lib/workspace/use-handoff";
import { throwIfAborted } from "@/lib/jobs/abort";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { extensionForMime } from "@/lib/utils";
import { compressImage, compressOutputMime } from "@/lib/image/core";
import { ActionBar, ToolShell, useToolHistory, useToolJob } from "./shared";

export function ImageCompress() {
  const t = useTranslations("tools.image-compress");
  const tc = useTranslations("common");
  const log = useToolHistory("image-compress");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [quality, setQuality] = useState(0.75);
  const [maxW, setMaxW] = useState(1920);
  useHandoff("image-compress", setFiles);
  const job = useToolJob();
  const loading = job.loading;
  const [results, setResults] = useState<ResultFile[]>([]);
  const [progress, setProgress] = useState(0);

  const qualityApplies =
    files.length === 0 || files.some((item) => compressOutputMime(item.file.type) !== "image/png");

  const run = async () => {
    if (!files.length) return;
    const ac = job.start();
    setResults([]);
    setProgress(0);
    try {
      const results: ResultFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        throwIfAborted(ac.signal);
        const blob = await compressImage(f.file, {
          quality,
          maxWidth: maxW,
          maxHeight: maxW,
          mime: compressOutputMime(f.file.type),
        });
        const name = f.file.name.replace(/\.\w+$/, "") + `-compressed.${extensionForMime(blob.type, "jpg")}`;
        throwIfAborted(ac.signal);
        results.push({ name, blob, originalBytes: f.file.size, requestedMime: compressOutputMime(f.file.type) });
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      setResults(results);
      toast.success(t("success", { count: files.length }));
      log(`${files.length} images`, "success", { quality, maxW });
    } catch (e) {
      if (ac.signal.aborted) return;
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="image-compress">
      <FileDropzone accept="image/*" files={files} onChange={(next) => { job.cancel(); setFiles(next); setResults([]); }} />
      <div className="grid gap-4 sm:grid-cols-2">
        {qualityApplies ? (
          <Field className="space-y-2" label={<>{tc("quality")}: {Math.round(quality * 100)}%</>}>
            <Slider aria-label={tc("quality")} value={[quality]} min={0.1} max={1} step={0.05} onValueChange={(v) => { job.cancel(); setQuality(v[0]); setResults([]); }} />
          </Field>
        ) : null}
        <Field className="space-y-2" label={tc("maxWidth")}>
          <Input type="number" value={maxW} onChange={(e) => { job.cancel(); setMaxW(Number(e.target.value) || 1920); setResults([]); }} />
        </Field>
      </div>
      {loading && <Progress value={progress} />}
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files.length} onCancel={job.cancel} />
      <ResultFiles files={results} />
    </ToolShell>
  );
}
