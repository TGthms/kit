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
let loading: Promise<FFmpeg> | null = null;
let inFlight: FFmpeg | null = null;
let loadGeneration = 0;
let execLock: Promise<void> = Promise.resolve();
let progressHandler: ((event: { progress: number }) => void) | null = null;
const coreBlobUrls: string[] = [];

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

function revokeCoreBlobs() {
  for (const url of coreBlobUrls) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* already revoked */
    }
  }
  coreBlobUrls.length = 0;
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
  progressHandler = null;
  revokeCoreBlobs();
}

export async function getFFmpeg(onProgress?: (ratio: number) => void): Promise<FFmpeg> {
  if (ffmpeg?.loaded) {
    if (onProgress) {
      if (progressHandler) ffmpeg.off("progress", progressHandler);
      progressHandler = ({ progress }) => onProgress(progress);
      ffmpeg.on("progress", progressHandler);
    } else if (progressHandler) {
      ffmpeg.off("progress", progressHandler);
      progressHandler = null;
    }
    return ffmpeg;
  }
  if (loading) return loading;

  loading = (async () => {
    const generation = loadGeneration;
    const instance = new FFmpeg();
    inFlight = instance;
    if (onProgress) {
      progressHandler = ({ progress }) => onProgress(progress);
      instance.on("progress", progressHandler);
    }
    const base = `${window.location.origin}${withBasePath("/vendor/ffmpeg")}`;
    const coreURL = await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript");
    // Cloudflare Pages rejects files over 25 MiB; the uncompressed core is ~31 MiB.
    const wasmURL = await toGunzippedWasmBlobURL(`${base}/ffmpeg-core.wasm.gz`);
    coreBlobUrls.push(coreURL, wasmURL);
    await instance.load({ coreURL, wasmURL });
    if (generation !== loadGeneration) {
      terminateInstance(instance);
      throw new DOMException("Aborted", "AbortError");
    }
    ffmpeg = instance;
    inFlight = null;
    return instance;
  })();

  try {
    return await loading;
  } catch (error) {
    terminateInstance(inFlight);
    inFlight = null;
    ffmpeg = null;
    revokeCoreBlobs();
    throw error;
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
      await ff.writeFile(inputName, inputData);
      const code = await ff.exec(args);
      if (typeof code === "number" && code !== 0) {
        throw new Error(`FFmpeg exited with code ${code}`);
      }
      const data = await ff.readFile(outputName);
      return typeof data === "string" ? new TextEncoder().encode(data) : data;
    } finally {
      await ff.deleteFile(inputName).catch(() => undefined);
      await ff.deleteFile(outputName).catch(() => undefined);
    }
  });
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
    if (signal?.aborted) {
      cancelFFmpeg();
      throw new DOMException("Aborted", "AbortError");
    }
    return await transcodeOnFFmpeg(ff, inputName, inputData, outputName, args);
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}
