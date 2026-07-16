import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

export async function getFFmpeg(onProgress?: (ratio: number) => void): Promise<FFmpeg> {
  if (ffmpeg?.loaded) return ffmpeg;
  if (loading) return loading;

  loading = (async () => {
    const instance = new FFmpeg();
    if (onProgress) {
      instance.on("progress", ({ progress }) => onProgress(progress));
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

export async function runFFmpeg(
  inputName: string,
  inputData: Uint8Array,
  outputName: string,
  args: string[],
  onProgress?: (ratio: number) => void
): Promise<Uint8Array> {
  const ff = await getFFmpeg(onProgress);
  await ff.writeFile(inputName, inputData);
  await ff.exec(args);
  const data = await ff.readFile(outputName);
  await ff.deleteFile(inputName).catch(() => undefined);
  await ff.deleteFile(outputName).catch(() => undefined);
  if (typeof data === "string") {
    return new TextEncoder().encode(data);
  }
  return data as Uint8Array;
}
