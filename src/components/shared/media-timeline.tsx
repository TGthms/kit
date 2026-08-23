"use client";

import { useEffect, useRef, useState } from "react";
import { peaksFromChannel } from "@/lib/media/peaks";
import { cn } from "@/lib/utils";

const MAX_WAVEFORM_BYTES = 100 * 1024 * 1024;

type Props = {
  file: File | null;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
  startLabel: string;
  endLabel: string;
};

export function MediaTimeline({ file, start, end, onChange, startLabel, endLabel }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const drag = useRef<"start" | "end" | null>(null);

  useEffect(() => {
    if (!file) {
      setDuration(0);
      setPeaks([]);
      return;
    }
    const url = URL.createObjectURL(file);
    const el = document.createElement(file.type.startsWith("audio/") ? "audio" : "video");
    el.preload = "metadata";
    el.src = url;
    const onMeta = () => {
      if (Number.isFinite(el.duration)) setDuration(el.duration);
    };
    el.addEventListener("loadedmetadata", onMeta);

    let cancelled = false;
    // Decoding a large video into PCM can allocate several times the source
    // size and freeze the tab. Keep the timeline usable with numeric controls
    // and placeholder bars instead of attempting the waveform.
    if (file.size <= MAX_WAVEFORM_BYTES) {
      file.arrayBuffer().then(async (buf) => {
        let ctx: AudioContext | null = null;
        try {
          const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          ctx = new Ctx();
          const decoded = await ctx.decodeAudioData(buf.slice(0));
          const ch = decoded.getChannelData(0);
          if (!cancelled) setPeaks(peaksFromChannel(ch, 80));
        } catch {
          if (!cancelled) setPeaks([]);
        } finally {
          await ctx?.close().catch(() => undefined);
        }
      });
    } else {
      setPeaks([]);
    }

    return () => {
      cancelled = true;
      el.removeEventListener("loadedmetadata", onMeta);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const ratio = (value: number) => (duration > 0 ? Math.min(1, Math.max(0, value / duration)) : 0);

  const setFromClientX = (clientX: number, which: "start" | "end") => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || duration <= 0) return;
    const t = ((clientX - rect.left) / rect.width) * duration;
    const clamped = Math.min(duration, Math.max(0, t));
    if (which === "start") onChange(Math.min(clamped, end - 0.05), end);
    else onChange(start, Math.max(clamped, start + 0.05));
  };

  const onPointerDown = (which: "start" | "end") => (e: React.PointerEvent) => {
    drag.current = which;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setFromClientX(e.clientX, which);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setFromClientX(e.clientX, drag.current);
  };

  const onPointerUp = () => {
    drag.current = null;
  };

  if (!file) return null;

  return (
    <div className="space-y-2">
      <div
        ref={trackRef}
        className="relative h-16 touch-none overflow-hidden rounded-xl border border-border/60 bg-secondary"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="absolute inset-0 flex items-end gap-px px-1 py-1">
          {(peaks.length ? peaks : Array.from({ length: 40 }, () => 0.25)).map((p, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-primary/45"
              style={{ height: `${Math.max(8, p * 100)}%` }}
            />
          ))}
        </div>
        <div
          className="absolute inset-y-0 bg-primary/15"
          style={{
            left: `${ratio(start) * 100}%`,
            width: `${Math.max(0, ratio(end) - ratio(start)) * 100}%`,
          }}
        />
        {(
          [
            ["start", start, startLabel],
            ["end", end, endLabel],
          ] as const
        ).map(([key, value, label]) => (
          <button
            key={key}
            type="button"
            aria-label={label}
            className={cn(
              "absolute top-0 z-10 h-full w-3 -translate-x-1/2 cursor-ew-resize rounded-sm bg-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            style={{ left: `${ratio(value) * 100}%` }}
            onPointerDown={onPointerDown(key)}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {start.toFixed(2)}s – {end.toFixed(2)}s
        {duration ? ` / ${duration.toFixed(2)}s` : ""}
      </p>
    </div>
  );
}
