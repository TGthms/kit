"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { downloadBlob, bytesToBlob } from "@/lib/utils";
import { videoSpeedArgs, videoSpeedVideoOnlyArgs } from "@/lib/media/ffmpeg-args";
import { ActionBar, ToolShell, useToolHistory, useToolJob, loadFfmpeg } from "./shared";
import { isMissingAudioError } from "./video-shared";

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
        if (!isMissingAudioError(err)) throw err;
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
