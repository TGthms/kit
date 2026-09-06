import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { withBasePath } from "@/lib/base-path";

export {
  AUDIO_FORMATS,
  VIDEO_FORMATS,
  audioConvertArgs,
  audioNormalizeArgs,
  audioSilenceSkipArgs,
  audioSpeedArgs,
  gifClipArgs,
  trimArgs,
  videoConvertArgs,
  videoExtractAudioArgs,
  videoSpeedArgs,
  videoSpeedVideoOnlyArgs,
} from "./ffmpeg-args";
export type { AudioFormat, VideoFormat } from "./ffmpeg-args";

let ffmpeg: FFmpeg | null = null;
let inFlight: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;
let loadGeneration = 0;
let execLock: Promise<void> = Promise.resolve();
let loadedCoreUrls: string[] = [];
/** The run whose AbortSignal may tear the shared instance down. */
let activeSignal: AbortSignal | null = null;

// FFmpeg 0.12 only reports diagnostics through "log" events (exec resolves
// with a bare exit code), so every line is kept in a ring buffer and the tail
// is attached to failures. Without it every error is just "exited with code 1".
const logLines: string[] = [];
const LOG_LINE_CAP = 60;
const LOG_TAIL_LINES = 6;

/** Decompress a gzip Response body (vendored FFmpeg WASM). */
export async function gunzipResponse(source: Response): Promise<ArrayBuffer> {
  if (!source.ok) throw new Error(`Failed to load FFmpeg core (${source.status})`);
  if (!source.body) throw new Error("FFmpeg core was empty");
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot decompress the media engine.");
  }
  return new Response(source.body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
}

async function toGunzippedWasmBlobURL(url: string): Promise<string> {
  const buffer = await gunzipResponse(await fetch(url));
  return URL.createObjectURL(new Blob([buffer], { type: "application/wasm" }));
}

function revokeUrls(urls: string[]) {
  for (const url of urls) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* already revoked */
    }
  }
}

function pushLogLine(message: string) {
  logLines.push(message);
  if (logLines.length > LOG_LINE_CAP) {
    logLines.splice(0, logLines.length - LOG_LINE_CAP);
  }
}

function recentLogTail(): string {
  const tail = logLines.slice(-LOG_TAIL_LINES).join("\n");
  return tail ? `\n${tail}` : "";
}

function terminateInstance(instance: FFmpeg | null) {
  if (!instance) return;
  try {
    instance.terminate();
  } catch {
    /* already dead */
  }
}

export function cancelFFmpeg() {
  loadGeneration += 1;
  terminateInstance(ffmpeg ?? inFlight);
  ffmpeg = null;
  inFlight = null;
  loading = null;
  revokeUrls(loadedCoreUrls);
  loadedCoreUrls = [];
  logLines.length = 0;
}

function startLoad(): Promise<FFmpeg> {
  const generation = loadGeneration;
  const urls: string[] = [];
  const instance = new FFmpeg();
  instance.on("log", ({ message }) => pushLogLine(String(message)));
  inFlight = instance;
  const promise = (async () => {
    const base = `${window.location.origin}${withBasePath("/vendor/ffmpeg")}`;
    const coreURL = await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript");
    urls.push(coreURL);
    // Cloudflare Pages rejects files over 25 MiB; the uncompressed core is ~31 MiB.
    const wasmURL = await toGunzippedWasmBlobURL(`${base}/ffmpeg-core.wasm.gz`);
    urls.push(wasmURL);
    await instance.load({ coreURL, wasmURL });
    if (generation !== loadGeneration) {
      // Superseded by a cancel while this load was in flight: tear down only
      // this attempt and leave any newer load alone.
      terminateInstance(instance);
      revokeUrls(urls);
      throw new DOMException("Aborted", "AbortError");
    }
    ffmpeg = instance;
    loadedCoreUrls = urls;
    inFlight = null;
    return instance;
  })();
  // Cleanup touches only this load's own state; a later caller may already
  // have replaced `loading`/`inFlight` with a newer attempt.
  promise.then(
    () => {
      if (loading === promise) loading = null;
    },
    () => {
      if (inFlight === instance) inFlight = null;
      if (loading === promise) loading = null;
      revokeUrls(urls);
    }
  );
  return promise;
}

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg?.loaded) return ffmpeg;
  if (!loading) loading = startLoad();
  return loading;
}

export type FFmpegFileHost = {
  writeFile(name: string, data: Uint8Array): Promise<unknown>;
  exec(args: string[]): Promise<unknown>;
  readFile(name: string): Promise<Uint8Array | string>;
  deleteFile(name: string): Promise<unknown>;
};

async function withExecLock<T>(fn: () => Promise<T>): Promise<T> {
  let release = () => undefined as void;
  const previous = execLock;
  execLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await fn();
  } finally {
    release();
  }
}

export async function transcodeOnFFmpeg(
  ff: FFmpegFileHost,
  inputName: string,
  inputData: Uint8Array,
  outputName: string,
  args: string[]
): Promise<Uint8Array> {
  return withExecLock(async () => {
    try {
      logLines.length = 0;
      await ff.writeFile(inputName, inputData);
      const code = await ff.exec(args);
      if (typeof code === "number" && code !== 0) {
        throw new Error(`FFmpeg exited with code ${code}${recentLogTail()}`);
      }
      const data = await ff.readFile(outputName);
      return typeof data === "string" ? new TextEncoder().encode(data) : data;
    } finally {
      await ff.deleteFile(inputName).catch(() => undefined);
      await ff.deleteFile(outputName).catch(() => undefined);
    }
  });
}

function abortError(): DOMException {
  return new DOMException("Aborted", "AbortError");
}

function isDeadInstanceError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  // ERROR_TERMINATED / ERROR_NOT_LOADED from @ffmpeg/ffmpeg: the shared
  // worker is gone (terminated by a cancel), so a retry needs a fresh load.
  return message.includes("called FFmpeg.terminate()") || message.includes("ffmpeg is not loaded");
}

export async function runFFmpeg(
  inputName: string,
  inputData: Uint8Array,
  outputName: string,
  args: string[],
  onProgress?: (ratio: number) => void,
  signal?: AbortSignal
): Promise<Uint8Array> {
  if (signal?.aborted) throw abortError();
  const onAbort = () => {
    // Only the owning run may terminate the shared instance; a queued run's
    // cancel must not kill another job's in-flight exec.
    if (activeSignal === signal) cancelFFmpeg();
  };
  signal?.addEventListener("abort", onAbort);
  activeSignal = signal ?? null;
  const onProg = onProgress
    ? (event: { progress: number }) => onProgress(event.progress)
    : null;
  try {
    let ff = await getFFmpeg();
    if (signal?.aborted) throw abortError();
    for (let attempt = 0; ; attempt += 1) {
      if (onProg) ff.on("progress", onProg);
      try {
        const output = await transcodeOnFFmpeg(ff, inputName, inputData, outputName, args);
        // A cancel that lands after exec resolved must still surface as a
        // cancel, not a successful download.
        if (signal?.aborted) throw abortError();
        return output;
      } catch (error) {
        // Intentional cancels always win over the underlying rejection
        // (terminate rejects exec with a plain internal error).
        if (signal?.aborted) throw abortError();
        if (attempt === 0 && isDeadInstanceError(error)) {
          ff = await getFFmpeg();
          if (signal?.aborted) throw abortError();
          continue;
        }
        throw error;
      } finally {
        if (onProg) ff.off("progress", onProg);
      }
    }
  } finally {
    signal?.removeEventListener("abort", onAbort);
    if (activeSignal === signal) activeSignal = null;
  }
}
