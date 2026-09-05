export const AUDIO_FORMATS = ["mp3", "wav", "ogg", "aac", "flac", "m4a"] as const;
export const VIDEO_FORMATS = ["mp4", "webm", "gif", "mov", "mkv"] as const;
export type AudioFormat = (typeof AUDIO_FORMATS)[number];
export type VideoFormat = (typeof VIDEO_FORMATS)[number];

export function audioConvertArgs(input: string, output: string, format: string): string[] {
  if (format === "mp3") return ["-i", input, "-vn", "-acodec", "libmp3lame", output];
  if (format === "wav") return ["-i", input, "-vn", output];
  if (format === "ogg") return ["-i", input, "-vn", "-acodec", "libvorbis", output];
  if (format === "aac" || format === "m4a") return ["-i", input, "-vn", "-c:a", "aac", output];
  if (format === "flac") return ["-i", input, "-vn", "-c:a", "flac", output];
  return ["-i", input, "-vn", output];
}

const GIF_PALETTE_FILTER =
  "fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse";

export function videoConvertArgs(input: string, output: string, format: string): string[] {
  if (format === "webm") return ["-i", input, "-c:v", "libvpx", "-c:a", "libvorbis", output];
  if (format === "gif") {
    return ["-i", input, "-filter_complex", GIF_PALETTE_FILTER, "-loop", "0", output];
  }
  // Stream copy only re-muxes. It can leave codecs incompatible with the
  // target container, such as VP9 copied from WebM into MP4.
  if (format === "mp4" || format === "mov") {
    return ["-i", input, "-c:v", "libx264", "-c:a", "aac", "-movflags", "+faststart", output];
  }
  if (format === "mkv") {
    return ["-i", input, "-c:v", "libx264", "-c:a", "aac", output];
  }
  return ["-i", input, output];
}

export function trimArgs(input: string, output: string, start: number, end: number): string[] {
  const duration = Math.max(0, end - start);
  // Input comes first and -t is an explicit duration, so end means end rather
  // than "duration after start". Omitting -c copy favors accurate cuts.
  return ["-i", input, "-ss", String(Math.max(0, start)), "-t", String(duration), output];
}

export function audioSpeedArgs(input: string, output: string, speed: number, volume: number): string[] {
  const atempo = Math.min(2, Math.max(0.5, speed));
  return ["-i", input, "-filter:a", `atempo=${atempo},volume=${volume}`, output];
}

export function videoSpeedArgs(input: string, output: string, speed: number, volume: number): string[] {
  const atempo = Math.min(2, Math.max(0.5, speed));
  return [
    "-i",
    input,
    "-filter_complex",
    `[0:v]setpts=${(1 / speed).toFixed(3)}*PTS[v];[0:a]atempo=${atempo},volume=${volume}[a]`,
    "-map",
    "[v]",
    "-map",
    "[a]",
    output,
  ];
}

/** Fallback for a video that has no audio stream. */
export function videoSpeedVideoOnlyArgs(input: string, output: string, speed: number): string[] {
  return ["-i", input, "-filter:v", `setpts=${(1 / speed).toFixed(3)}*PTS`, "-an", output];
}

export function videoExtractAudioArgs(input: string, output: string): string[] {
  return ["-i", input, "-vn", "-acodec", "libmp3lame", output];
}

export function gifClipArgs(input: string, output: string, start: string, end: string): string[] {
  const startSeconds = Math.max(0, Number(start) || 0);
  const duration = Math.max(0, (Number(end) || 0) - startSeconds);
  return [
    "-i",
    input,
    "-ss",
    String(startSeconds),
    "-t",
    String(duration),
    "-filter_complex",
    GIF_PALETTE_FILTER,
    "-loop",
    "0",
    output,
  ];
}

/** Two-pass EBU R128 loudness toward typical podcast loudness. */
export function audioNormalizeArgs(input: string, output: string): string[] {
  return ["-i", input, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", output];
}

/** Drop near-silent stretches so speech sits closer together. */
export function audioSilenceSkipArgs(input: string, output: string): string[] {
  return [
    "-i",
    input,
    "-af",
    "silenceremove=start_periods=1:start_silence=0.2:start_threshold=-40dB:stop_periods=-1:stop_silence=0.4:stop_threshold=-40dB",
    output,
  ];
}
