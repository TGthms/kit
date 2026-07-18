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

export function AudioConvert() {
  const t = useTranslations("tools.audio-convert");
  const tc = useTranslations("common");
  const log = useToolHistory("audio-convert");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [format, setFormat] = useState("mp3");
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
      if (format === "mp3") args = ["-i", input, "-vn", "-acodec", "libmp3lame", output];
      else if (format === "wav") args = ["-i", input, "-vn", output];
      else if (format === "ogg") args = ["-i", input, "-vn", "-acodec", "libvorbis", output];
      else args = ["-i", input, "-vn", output];

      const { runFFmpeg } = await loadFfmpeg();
      try {
        const out = await runFFmpeg(input, data, output, args, (p) =>
          setProgress(Math.round(p * 100))
        );
        downloadBlob(bytesToBlob(out, "application/octet-stream"), output);
      } catch {
        const out = await runFFmpeg(input, data, output, ["-i", input, "-vn", output], (p) =>
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
    <ToolShell toolId="audio-convert">
      <p className="type-body text-muted-foreground">{t("note")}</p>
      <div className="space-y-2">
        <Label>{tc("format")}</Label>
        <select className={selectClass} value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="mp3">MP3</option>
          <option value="wav">WAV</option>
          <option value="ogg">OGG</option>
        </select>
      </div>
      <FileDropzone accept="audio/*" multiple={false} files={files} onChange={setFiles} />
      {loading && <Progress value={progress} />}
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </ToolShell>
  );
}

export function AudioTrim() {
  const t = useTranslations("tools.audio-trim");
  const tc = useTranslations("common");
  const log = useToolHistory("audio-trim");
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
      const ext = files[0].file.name.split(".").pop() || "mp3";
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
    <ToolShell toolId="audio-trim">
      <FileDropzone accept="audio/*" multiple={false} files={files} onChange={setFiles} />
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

export function AudioSpeed() {
  const t = useTranslations("tools.audio-speed");
  const tc = useTranslations("common");
  const log = useToolHistory("audio-speed");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [speed, setSpeed] = useState(1.25);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!files[0]) return;
    setLoading(true);
    try {
      const data = new Uint8Array(await files[0].file.arrayBuffer());
      const ext = files[0].file.name.split(".").pop() || "mp3";
      const input = `input.${ext}`;
      const output = `processed.${ext}`;
      const atempo = Math.min(2, Math.max(0.5, speed));
      const { runFFmpeg } = await loadFfmpeg();
      const out = await runFFmpeg(input, data, output, [
        "-i",
        input,
        "-filter:a",
        `atempo=${atempo},volume=${volume}`,
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
      <ActionBar onRun={run} loading={loading} label={t("run")} disabled={!files[0]} />
    </ToolShell>
  );
}
