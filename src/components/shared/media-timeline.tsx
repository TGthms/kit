"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { peaksFromChannel } from "@/lib/media/peaks";
import { cn } from "@/lib/utils";

// Decoding a file into PCM allocates several times its source size and can
// freeze the tab, so decode only small inputs; anything larger keeps the
// numeric time fields and gets a visible note instead of a waveform.
const MAX_WAVEFORM_BYTES = 12 * 1024 * 1024;

type Props = {
  file: File | null;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
  startLabel: string;
  endLabel: string;
  onDuration?: (seconds: number) => void;
};

export function MediaTimeline({ file, start, end, onChange, startLabel, endLabel, onDuration }: Props) {
  const t = useTranslations("common");
  const trackRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<{ file: File; duration: number; peaks: number[] } | null>(null);
  const drag = useRef<"start" | "end" | null>(null);
  const onDurationRef = useRef(onDuration);
  useEffect(() => {
    onDurationRef.current = onDuration;
  }, [onDuration]);
  const duration = file && loaded?.file === file ? loaded.duration : 0;
  const peaks = file && loaded?.file === file ? loaded.peaks : [];

  useEffect(() => {
    drag.current = null;
    onDurationRef.current?.(0);
    if (!file) {
      return;
    }
    const url = URL.createObjectURL(file);
    const el = document.createElement(file.type.startsWith("audio/") ? "audio" : "video");
    el.preload = "metadata";
    el.src = url;
    const onMeta = () => {
      if (Number.isFinite(el.duration)) {
        setLoaded((current) => ({
          file,
          duration: el.duration,
          peaks: current?.file === file ? current.peaks : [],
        }));
        onDurationRef.current?.(el.duration);
      }
    };
    el.addEventListener("loadedmetadata", onMeta);

    let cancelled = false;
    if (file.size <= MAX_WAVEFORM_BYTES) {
      file.arrayBuffer().then(async (buf) => {
        if (cancelled) return;
        let ctx: AudioContext | null = null;
        try {
          const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          ctx = new Ctx();
          // decodeAudioData detaches its input; buf has no other reader here.
          const decoded = await ctx.decodeAudioData(buf);
          const ch = decoded.getChannelData(0);
          if (!cancelled) {
            const nextPeaks = peaksFromChannel(ch, 80);
            setLoaded((current) => ({
              file,
              duration: current?.file === file ? current.duration : 0,
              peaks: nextPeaks,
            }));
          }
        } catch {
          if (!cancelled) {
            setLoaded((current) => ({
              file,
              duration: current?.file === file ? current.duration : 0,
              peaks: [],
            }));
          }
        } finally {
          await ctx?.close().catch(() => undefined);
        }
      }).catch(() => { /* Metadata/numeric fields still work if reading fails. */ });
    }

    return () => {
      cancelled = true;
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeAttribute("src");
      el.load();
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const ratio = (value: number) => (duration > 0 ? Math.min(1, Math.max(0, value / duration)) : 0);

  const setEndpoint = (value: number, which: "start" | "end") => {
    if (duration <= 0) return;
    const gap = Math.min(0.05, duration);
    if (which === "start") onChange(Math.max(0, Math.min(value, end - gap)), end);
    else onChange(start, Math.min(duration, Math.max(value, start + gap)));
  };

  const setFromClientX = (clientX: number, which: "start" | "end") => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || duration <= 0) return;
    const t = ((clientX - rect.left) / rect.width) * duration;
    const clamped = Math.min(duration, Math.max(0, t));
    setEndpoint(clamped, which);
  };

  const onPointerDown = (which: "start" | "end") => (e: React.PointerEvent) => {
    if (e.button !== 0 || duration <= 0) return;
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
            data-haptic="off"
            role="slider"
            aria-label={label}
            aria-valuemin={key === "start" ? 0 : Math.min(duration, start + Math.min(0.05, duration))}
            aria-valuemax={key === "start" ? Math.max(0, end - Math.min(0.05, duration)) : duration}
            aria-valuenow={Math.max(0, Math.min(duration, value))}
            aria-valuetext={`${value.toFixed(2)}s`}
            disabled={duration <= 0}
            className={cn(
              "absolute top-0 z-10 h-full w-3 -translate-x-1/2 cursor-ew-resize rounded-sm bg-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            style={{ left: `${ratio(value) * 100}%` }}
            onPointerDown={onPointerDown(key)}
            onKeyDown={(event) => {
              let next = value;
              const step = event.shiftKey ? 1 : 0.05;
              if (event.key === "ArrowRight" || event.key === "ArrowUp") next += step;
              else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next -= step;
              else if (event.key === "PageUp") next += 10;
              else if (event.key === "PageDown") next -= 10;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = duration;
              else return;
              event.preventDefault();
              setEndpoint(next, key);
            }}
          />
        ))}
      </div>
      {file.size > MAX_WAVEFORM_BYTES ? (
        <p className="text-xs text-muted-foreground">{t("waveformTooLarge")}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {start.toFixed(2)}s – {end.toFixed(2)}s
        {duration ? ` / ${duration.toFixed(2)}s` : ""}
      </p>
    </div>
  );
}
