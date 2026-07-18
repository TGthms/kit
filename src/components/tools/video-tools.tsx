"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { downloadBlob, bytesToBlob } from "@/lib/utils";
import { ActionBar, ToolShell, useToolHistory, loadFfmpeg } from "./shared";

const selectClass =
  "flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function VideoConvert() {
  const t = useTranslations("tools.video-convert");
  const tc = useTranslations("common");
  const log = useToolHistory("video-convert");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [format, setFormat] = useState("mp4");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    setProgress(0);
    try {
      const data = new Uint8Array(await files[0].file.arrayBuffer());
      const ext = files[0].file.name.split(".").pop() || "bin";
      const input = `input.${ext}`;
      const output = `output.${format}`;
      let args: string[];
      if (format === "webm") {
        args = ["-i", input, "-c:v", "libvpx", "-c:a", "libvorbis", output];
      } else if (format === "mp4") {
        args = ["-i", input, "-c", "copy", output];
      } else {
        args = ["-i", input, output];
      }

      const { runFFmpeg } = await loadFfmpeg();
      try {
        const out = await runFFmpeg(input, data, output, args, (p) =>
          setProgress(Math.round(p * 100))
        );
        downloadBlob(bytesToBlob(out, "application/octet-stream"), output);
      } catch {
        const out = await runFFmpeg(input, data, output, ["-i", input, output], (p) =>
          setProgress(Math.round(p * 100))
        );
        downloadBlob(bytesToBlob(out, "application/octet-stream"), output);
      }
      toast.success(t("success"));
      log(format, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="video-convert">
      <p className="type-body text-muted-foreground">{t("note")}</p>
      <div className="space-y-2">
        <Label>{tc("format")}</Label>
        <select className={selectClass} value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="mp4">MP4</option>
          <option value="webm">WEBM</option>
        </select>
      </div>
      <FileDropzone accept="video/*" multiple={false} files={files} onChange={setFiles} />
      {loading && <Progress value={progress} />}
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </ToolShell>
  );
}

export function VideoTrim() {
  const t = useTranslations("tools.video-trim");
  const tc = useTranslations("common");
  const log = useToolHistory("video-trim");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("10");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
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
        ["-ss", start, "-to", end, "-i", input, "-c", "copy", output],
        (p) => setProgress(Math.round(p * 100))
      );
      downloadBlob(bytesToBlob(out, "application/octet-stream"), output);
      toast.success(t("success"));
      log(`${start}-${end}`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="video-trim">
      <FileDropzone accept="video/*" multiple={false} files={files} onChange={setFiles} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            {tc("start")} (s)
          </Label>
          <Input value={start} onChange={(e) => setStart(e.target.value)} inputMode="decimal" />
        </div>
        <div className="space-y-2">
          <Label>
            {tc("end")} (s)
          </Label>
          <Input value={end} onChange={(e) => setEnd(e.target.value)} inputMode="decimal" />
        </div>
      </div>
      {loading && <Progress value={progress} />}
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
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
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const data = new Uint8Array(await files[0].file.arrayBuffer());
      const ext = files[0].file.name.split(".").pop() || "mp4";
      const input = `input.${ext}`;
      const output = `processed.${ext}`;
      const atempo = Math.min(2, Math.max(0.5, speed));
      const { runFFmpeg } = await loadFfmpeg();
      const out = await runFFmpeg(input, data, output, [
        "-i",
        input,
        "-filter_complex",
        `[0:v]setpts=${(1 / speed).toFixed(3)}*PTS[v];[0:a]atempo=${atempo},volume=${volume}[a]`,
        "-map",
        "[v]",
        "-map",
        "[a]",
        output,
      ]);
      downloadBlob(bytesToBlob(out, "application/octet-stream"), output);
      toast.success(t("success"));
      log(`speed=${speed}`, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
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
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </ToolShell>
  );
}

export function VideoExtractAudio() {
  const t = useTranslations("tools.video-extract-audio");
  const tc = useTranslations("common");
  const log = useToolHistory("video-extract-audio");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const data = new Uint8Array(await files[0].file.arrayBuffer());
      const ext = files[0].file.name.split(".").pop() || "mp4";
      const { runFFmpeg } = await loadFfmpeg();
      const out = await runFFmpeg(`input.${ext}`, data, "audio.mp3", [
        "-i",
        `input.${ext}`,
        "-vn",
        "-acodec",
        "libmp3lame",
        "audio.mp3",
      ]);
      downloadBlob(bytesToBlob(out, "audio/mpeg"), "audio.mp3");
      toast.success(t("success"));
      log(files[0].file.name, "success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc("error"));
      log("failed", "failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolShell toolId="video-extract-audio">
      <FileDropzone accept="video/*" multiple={false} files={files} onChange={setFiles} />
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </ToolShell>
  );
}
