"use client";
import { mediaMime } from "@/lib/media/ffmpeg-args";
import { useToolJob } from "./use-tool-job";
import { FileJobResult } from "./file-job-result";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone, type FileItem } from "@/components/shared/file-dropzone";
import { Field } from "@/components/ui/field";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { bytesToBlob } from "@/lib/utils";
import { videoSpeedArgs, videoSpeedVideoOnlyArgs } from "@/lib/media/ffmpeg-args";
import { ActionBar, ToolShell, useToolHistory, loadFfmpeg } from "./shared";
import { isMissingAudioError } from "./video-shared";

export function VideoSpeed() {
  const t = useTranslations("tools.video-speed");
  const tc = useTranslations("common");
  const log = useToolHistory("video-speed");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [speed, setSpeed] = useState(1.25);
  const [volume, setVolume] = useState(1);
  const job = useToolJob([files, speed, volume]);

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
          (p) => job.report(ac, Math.round(p * 100)),
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
          (p) => job.report(ac, Math.round(p * 100)),
          ac.signal
        );
      }
      if (!job.complete(ac, [{ blob: bytesToBlob(out, mediaMime(ext)), name: output }])) return;
      toast.success(t("success"));
      log(`speed=${speed}`, "success");
    } catch (e) {
      if (!job.fail(ac, e)) return;
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
      <Field className="space-y-2" label={<>{tc("speed")}: {speed.toFixed(2)}x</>}>
        <Slider aria-label={tc("speed")} value={[speed]} min={0.5} max={2} step={0.05} onValueChange={(v) => setSpeed(v[0])} />
      </Field>
      <Field className="space-y-2" label={<>{tc("volume")}: {volume.toFixed(2)}</>}>
        <Slider aria-label={tc("volume")} value={[volume]} min={0} max={2} step={0.05} onValueChange={(v) => setVolume(v[0])} />
      </Field>
      {job.loading && <Progress value={job.progress} />}
      <ActionBar
        onRun={run}
        loading={job.loading}
        label={t("run")}
        disabled={!files[0]}
        onCancel={job.cancel}
      />
      <FileJobResult job={job} />
    </ToolShell>
  );
}
