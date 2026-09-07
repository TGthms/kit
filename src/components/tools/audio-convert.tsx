"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { downloadMany, bytesToBlob } from "@/lib/utils";
import { AUDIO_FORMATS, audioConvertArgs, audioNormalizeArgs, audioSilenceSkipArgs } from "@/lib/media/ffmpeg-args";
import { runSequentialBatch, stemmedName } from "@/lib/jobs/batch";
import { ActionBar, ToolLimits, ToolShell, useToolHistory, useToolJob, loadFfmpeg } from "./shared";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function AudioConvert() {
  const t = useTranslations("tools.audio-convert");
  const tc = useTranslations("common");
  const log = useToolHistory("audio-convert");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [format, setFormat] = useState("mp3");
  const [operation, setOperation] = useState<"convert" | "normalize" | "silence">("convert");
  const job = useToolJob();

  const run = async () => {
    if (!files.length) return;
    const ac = job.start();
    try {
      const { runFFmpeg } = await loadFfmpeg();
      const items = await runSequentialBatch(
        files,
        async (f, index) => {
          const data = new Uint8Array(await f.file.arrayBuffer());
          const ext = f.file.name.split(".").pop() || "bin";
          const input = `input-${index}.${ext}`;
          const output = `output-${index}.${format}`;
          const report = (p: number) =>
            job.setProgress(Math.round(((index + p) / files.length) * 100));
          const args =
            operation === "normalize"
              ? audioNormalizeArgs(input, output)
              : operation === "silence"
                ? audioSilenceSkipArgs(input, output)
                : audioConvertArgs(input, output, format);
          const out = await runFFmpeg(input, data, output, args, report, ac.signal);
          return {
            blob: bytesToBlob(out, "application/octet-stream"),
            name: stemmedName(f.file.name, "-converted", format),
          };
        },
        { signal: ac.signal }
      );
      await downloadMany(items, `converted-audio.${format}.zip`);
      toast.success(t("success"));
      log(`${format} n=${files.length}`, "success");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        toast.error(tc("cancel"));
      } else {
        toast.error(e instanceof Error ? e.message : tc("error"));
        log("failed", "failed");
      }
    } finally {
      job.stop(ac);
    }
  };

  return (
    <ToolShell toolId="audio-convert">
      <ToolLimits>
        <p>{t("note")}</p>
      </ToolLimits>
      <div className="space-y-2">
        <Label>{t("operation")}</Label>
        <select className={selectClass} value={operation} onChange={(e) => setOperation(e.target.value as typeof operation)}>
          <option value="convert">{t("convert")}</option>
          <option value="normalize">{t("normalize")}</option>
          <option value="silence">{t("skipSilence")}</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>{tc("format")}</Label>
        <select className={selectClass} value={format} onChange={(e) => setFormat(e.target.value)} disabled={operation !== "convert"}>
          {AUDIO_FORMATS.map((f) => (
            <option key={f} value={f}>
              {f.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      <FileDropzone accept="audio/*" files={files} onChange={setFiles} />
      {job.loading && <Progress value={job.progress} />}
      <ActionBar
        onRun={run}
        loading={job.loading}
        label={t("run")}
        disabled={!files.length}
        onCancel={job.cancel}
      />
    </ToolShell>
  );
}
