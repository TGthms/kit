export function clampMediaTimes(start: number, end: number, duration: number): { start: number; end: number } {
  const known = Number.isFinite(duration) && duration > 0;
  let s = Number.isFinite(start) ? Math.max(0, start) : 0;
  let e = Number.isFinite(end) ? end : s;
  if (known) {
    s = Math.min(s, duration);
    e = Math.min(Math.max(0, e), duration);
    if (!(e > s)) {
      if (s >= duration) {
        e = duration;
        s = Math.max(0, duration - Math.min(0.05, duration));
      } else {
        e = Math.min(duration, s + 0.05);
      }
    }
  } else if (!(e > s)) {
    e = s + 0.05;
  }
  return { start: s, end: e };
}

export function isMissingAudioError(err: unknown): boolean {
  const parts: string[] = [];
  const walk = (value: unknown, depth: number) => {
    if (value == null || depth > 3) return;
    if (typeof value === "string") {
      parts.push(value);
      return;
    }
    if (value instanceof Error) {
      parts.push(value.name, value.message);
      walk((value as Error & { cause?: unknown }).cause, depth + 1);
      return;
    }
  };
  walk(err, 0);
  return /stream map|\[0:a\]|0:a|no audio|does not contain any stream|matches no streams|stream not found|unconnected output/i.test(
    parts.join(" ")
  );
}
