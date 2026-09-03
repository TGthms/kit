"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { downloadBlob, downloadMany, bytesToBlob } from "@/lib/utils";
import { MediaTimeline } from "@/components/shared/media-timeline";
import { AUDIO_FORMATS, audioConvertArgs, audioNormalizeArgs, audioSilenceSkipArgs, audioSpeedArgs, trimArgs } from "@/lib/media/ffmpeg-args";
import { runSequentialBatch, stemmedName } from "@/lib/jobs/batch";
import { ActionBar, ToolLimits, ToolShell, useToolHistory, useToolJob, loadFfmpeg } from "./shared";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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
      if (e instanceof DOMException && e.name === "AbortError") toast.error(tc("cancel"));
      else toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop();
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

export function AudioTrim() {
  const t = useTranslations("tools.audio-trim");
  const tc = useTranslations("common");
  const log = useToolHistory("audio-trim");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const job = useToolJob();

  const run = async () => {
    if (!files[0] || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      toast.error(tc("error"));
      return;
    }
    const ac = job.start();
    try {
      const data = new Uint8Array(await files[0].file.arrayBuffer());
      const ext = files[0].file.name.split(".").pop() || "mp3";
      const input = `input.${ext}`;
      const output = `trim.${ext}`;
      const { runFFmpeg } = await loadFfmpeg();
      const out = await runFFmpeg(
        input,
        data,
        output,
        trimArgs(input, output, start, end),
        (p) => job.setProgress(Math.round(p * 100)),
        ac.signal
      );
      downloadBlob(bytesToBlob(out, "application/octet-stream"), output);
      toast.success(t("success"));
      log("completed", "success");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") toast.error(tc("cancel"));
      else toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop();
    }
  };

  return (
    <ToolShell toolId="audio-trim">
      <FileDropzone accept="audio/*" multiple={false} files={files} onChange={setFiles} />
      <MediaTimeline
        file={files[0]?.file ?? null}
        start={start}
        end={end}
        onChange={(a, b) => {
          setStart(a);
          setEnd(b);
        }}
        startLabel={tc("start")}
        endLabel={tc("end")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            {tc("start")} (s)
          </Label>
          <Input
            value={start}
            onChange={(e) => setStart(Number(e.target.value) || 0)}
            inputMode="decimal"
          />
        </div>
        <div className="space-y-2">
          <Label>
            {tc("end")} (s)
          </Label>
          <Input
            value={end}
            onChange={(e) => setEnd(Number(e.target.value) || 0)}
            inputMode="decimal"
          />
        </div>
      </div>
      {job.loading && <Progress value={job.progress} />}
      <ActionBar
        onRun={run}
        loading={job.loading}
        label={t("run")}
        disabled={!files[0]}
        onCancel={job.cancel}
      />
    </ToolShell>
  );
}

export function AudioSpeed() {
  const t = useTranslations("tools.audio-speed");
  const tc = useTranslations("common");
  const log = useToolHistory("audio-speed");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [speed, setSpeed] = useState(1.25);
  const [volume, setVolume] = useState(1);
  const job = useToolJob();

  const run = async () => {
    if (!files[0]) return;
    const ac = job.start();
    try {
      const data = new Uint8Array(await files[0].file.arrayBuffer());
      const ext = files[0].file.name.split(".").pop() || "mp3";
      const input = `input.${ext}`;
      const output = `processed.${ext}`;
      const { runFFmpeg } = await loadFfmpeg();
      const out = await runFFmpeg(
        input,
        data,
        output,
        audioSpeedArgs(input, output, speed, volume),
        (p) => job.setProgress(Math.round(p * 100)),
        ac.signal
      );
      downloadBlob(bytesToBlob(out, "application/octet-stream"), output);
      toast.success(t("success"));
      log(`speed=${speed}`, "success");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") toast.error(tc("cancel"));
      else toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      job.stop();
    }
  };

  return (
    <ToolShell toolId="audio-speed">
      <FileDropzone accept="audio/*" multiple={false} files={files} onChange={setFiles} />
      <div className="space-y-2">
        <Label>
          {tc("speed")}: {speed.toFixed(2)}x
        </Label>
        <Slider value={[speed]} min={0.5} max={2} step={0.05} onValueChange={(v) => setSpeed(v[0])} />
      </div>
      <div className="space-y-2">
        <Label>
          {tc("volume")}: {volume.toFixed(2)}
        </Label>
        <Slider value={[volume]} min={0} max={2} step={0.05} onValueChange={(v) => setVolume(v[0])} />
      </div>
      {job.loading && <Progress value={job.progress} />}
      <ActionBar
        onRun={run}
        loading={job.loading}
        label={t("run")}
        disabled={!files[0]}
        onCancel={job.cancel}
      />
    </ToolShell>
  );
}
