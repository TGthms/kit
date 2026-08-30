import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;
let progressHandler: ((event: { progress: number }) => void) | null = null;

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

export function videoConvertArgs(input: string, output: string, format: string): string[] {
  if (format === "webm") return ["-i", input, "-c:v", "libvpx", "-c:a", "libvorbis", output];
  if (format === "gif") {
    return ["-i", input, "-vf", "fps=12,scale=480:-1:flags=lanczos", "-loop", "0", output];
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
    "-vf",
    "fps=12,scale=480:-1:flags=lanczos",
    "-loop",
    "0",
    output,
  ];
}

export function cancelFFmpeg() {
  if (ffmpeg) {
    try {
      ffmpeg.terminate();
    } catch {
      /* already dead */
    }
  }
  ffmpeg = null;
  loading = null;
  progressHandler = null;
}

export async function getFFmpeg(onProgress?: (ratio: number) => void): Promise<FFmpeg> {
  if (ffmpeg?.loaded) {
    if (onProgress) {
      if (progressHandler) ffmpeg.off("progress", progressHandler);
      progressHandler = ({ progress }) => onProgress(progress);
      ffmpeg.on("progress", progressHandler);
    }
    return ffmpeg;
  }
  if (loading) return loading;

  loading = (async () => {
    const instance = new FFmpeg();
    if (onProgress) {
      progressHandler = ({ progress }) => onProgress(progress);
      instance.on("progress", progressHandler);
    }
    const base = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
    await instance.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpeg = instance;
    return instance;
  })();

  try {
    return await loading;
  } finally {
    loading = null;
  }
}

export type FFmpegFileHost = {
  writeFile(name: string, data: Uint8Array): Promise<unknown>;
  exec(args: string[]): Promise<unknown>;
  readFile(name: string): Promise<Uint8Array | string>;
  deleteFile(name: string): Promise<unknown>;
};

export async function transcodeOnFFmpeg(
  ff: FFmpegFileHost,
  inputName: string,
  inputData: Uint8Array,
  outputName: string,
  args: string[]
): Promise<Uint8Array> {
  try {
    await ff.writeFile(inputName, inputData);
    await ff.exec(args);
    const data = await ff.readFile(outputName);
    return typeof data === "string" ? new TextEncoder().encode(data) : data;
  } finally {
    await ff.deleteFile(inputName).catch(() => undefined);
    await ff.deleteFile(outputName).catch(() => undefined);
  }
}

export async function runFFmpeg(
  inputName: string,
  inputData: Uint8Array,
  outputName: string,
  args: string[],
  onProgress?: (ratio: number) => void,
  signal?: AbortSignal
): Promise<Uint8Array> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const onAbort = () => cancelFFmpeg();
  signal?.addEventListener("abort", onAbort);
  try {
    const ff = await getFFmpeg(onProgress);
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    return await transcodeOnFFmpeg(ff, inputName, inputData, outputName, args);
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}
