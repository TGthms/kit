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
import {
  VIDEO_FORMATS,
  gifClipArgs,
  trimArgs,
  videoConvertArgs,
  videoExtractAudioArgs,
  videoSpeedArgs,
  videoSpeedVideoOnlyArgs,
} from "@/lib/media/ffmpeg-args";
import { runSequentialBatch, stemmedName } from "@/lib/jobs/batch";
import { ActionBar, ToolLimits, ToolShell, useToolHistory, useToolJob, loadFfmpeg } from "./shared";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function VideoConvert() {
  const t = useTranslations("tools.video-convert");
  const tc = useTranslations("common");
  const log = useToolHistory("video-convert");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [format, setFormat] = useState("mp4");
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
          const args = videoConvertArgs(input, output, format);
          const out = await runFFmpeg(input, data, output, args, report, ac.signal);
          return {
            blob: bytesToBlob(out, "application/octet-stream"),
            name: stemmedName(f.file.name, "-converted", format),
          };
        },
        { signal: ac.signal }
      );
      await downloadMany(items, `converted-video.${format}.zip`);
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
    <ToolShell toolId="video-convert">
      <ToolLimits>
        <p>{t("note")}</p>
      </ToolLimits>
      <div className="space-y-2">
        <Label>{tc("format")}</Label>
        <select className={selectClass} value={format} onChange={(e) => setFormat(e.target.value)}>
          {VIDEO_FORMATS.map((f) => (
            <option key={f} value={f}>
              {f.toUpperCase()}
            </option>
          ))}
        </select>
      </div>
      <FileDropzone accept="video/*" files={files} onChange={setFiles} />
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

export function VideoTrim() {
  const t = useTranslations("tools.video-trim");
  const tc = useTranslations("common");
  const log = useToolHistory("video-trim");
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
      const ext = files[0].file.name.split(".").pop() || "mp4";
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
    <ToolShell toolId="video-trim">
      <FileDropzone accept="video/*" multiple={false} files={files} onChange={setFiles} />
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
          <Input value={start} onChange={(e) => setStart(Number(e.target.value) || 0)} inputMode="decimal" />
        </div>
        <div className="space-y-2">
          <Label>
            {tc("end")} (s)
          </Label>
          <Input value={end} onChange={(e) => setEnd(Number(e.target.value) || 0)} inputMode="decimal" />
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

export function VideoSpeed() {
  const t = useTranslations("tools.video-speed");
  const tc = useTranslations("common");
  const log = useToolHistory("video-speed");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [speed, setSpeed] = useState(1.25);
  const [volume, setVolume] = useState(1);
  const job = useToolJob();

  const run = async () => {
    if (!files[0]) return;
    const ac = job.start();
    try {
      const data = new Uint8Array(await files[0].file.arrayBuffer());
      const ext = files[0].file.name.split(".").pop() || "mp4";
      const input = `input.${ext}`;
      const output = `processed.${ext}`;
      const { runFFmpeg } = await loadFfmpeg();
      let out: Uint8Array;
      try {
        out = await runFFmpeg(
          input,
          data,
          output,
          videoSpeedArgs(input, output, speed, volume),
          (p) => job.setProgress(Math.round(p * 100)),
          ac.signal
        );
      } catch (err) {
        if (ac.signal.aborted) throw err;
        // Silent videos have no [0:a] stream for the audio filter graph.
        out = await runFFmpeg(
          input,
          data,
          output,
          videoSpeedVideoOnlyArgs(input, output, speed),
          (p) => job.setProgress(Math.round(p * 100)),
          ac.signal
        );
      }
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
    <ToolShell toolId="video-speed">
      <FileDropzone accept="video/*" multiple={false} files={files} onChange={setFiles} />
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

export function VideoExtractAudio() {
  const t = useTranslations("tools.video-extract-audio");
  const tc = useTranslations("common");
  const log = useToolHistory("video-extract-audio");
  const [files, setFiles] = useState<FileItem[]>([]);
  const job = useToolJob();

  const run = async () => {
    if (!files[0]) return;
    const ac = job.start();
    try {
      const data = new Uint8Array(await files[0].file.arrayBuffer());
      const ext = files[0].file.name.split(".").pop() || "mp4";
      const input = `input.${ext}`;
      const output = "audio.mp3";
      const { runFFmpeg } = await loadFfmpeg();
      const out = await runFFmpeg(
        input,
        data,
        output,
        videoExtractAudioArgs(input, output),
        (p) => job.setProgress(Math.round(p * 100)),
        ac.signal
      );
      downloadBlob(bytesToBlob(out, "audio/mpeg"), output);
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
    <ToolShell toolId="video-extract-audio">
      <FileDropzone accept="video/*" multiple={false} files={files} onChange={setFiles} />
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

export function VideoGif() {
  const t = useTranslations("tools.video-gif");
  const tc = useTranslations("common");
  const log = useToolHistory("video-gif");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(3);
  const job = useToolJob();

  const run = async () => {
    if (!files[0] || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      toast.error(tc("error"));
      return;
    }
    const ac = job.start();
    try {
      const data = new Uint8Array(await files[0].file.arrayBuffer());
      const ext = files[0].file.name.split(".").pop() || "mp4";
      const input = `input.${ext}`;
      const output = "clip.gif";
      const { runFFmpeg } = await loadFfmpeg();
      const out = await runFFmpeg(
        input,
        data,
        output,
        gifClipArgs(input, output, String(start), String(end)),
        (p) => job.setProgress(Math.round(p * 100)),
        ac.signal
      );
      downloadBlob(bytesToBlob(out, "image/gif"), output);
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
    <ToolShell toolId="video-gif">
      <ToolLimits>
        <p>{t("limits")}</p>
      </ToolLimits>
      <FileDropzone accept="video/*" multiple={false} files={files} onChange={setFiles} />
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
          <Input value={start} onChange={(e) => setStart(Number(e.target.value) || 0)} inputMode="decimal" />
        </div>
        <div className="space-y-2">
          <Label>
            {tc("end")} (s)
          </Label>
          <Input value={end} onChange={(e) => setEnd(Number(e.target.value) || 0)} inputMode="decimal" />
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
