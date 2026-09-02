import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { describe, expect, it, vi } from "vitest";
import {
  audioConvertArgs,
  audioSpeedArgs,
  gifClipArgs,
  gunzipResponse,
  transcodeOnFFmpeg,
  trimArgs,
  videoConvertArgs,
  videoExtractAudioArgs,
  videoSpeedArgs,
  videoSpeedVideoOnlyArgs,
} from "./ffmpeg";
import { mixToMono, peaksFromChannel } from "./peaks";

describe("ffmpeg core origin", () => {
  it("loads the vendored same-origin gzipped UMD core, not jsDelivr", () => {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "ffmpeg.ts"), "utf8");
    expect(src).not.toMatch(/jsdelivr/i);
    expect(src).toContain("/vendor/ffmpeg");
    expect(src).toContain("ffmpeg-core.wasm.gz");
    expect(src).toContain("DecompressionStream");
  });
});

describe("gunzipResponse", () => {
  it("inflates a gzip body", async () => {
    const raw = new Uint8Array([0, 97, 115, 109, 1, 2, 3]);
    const buffer = await gunzipResponse(new Response(gzipSync(raw)));
    expect(Array.from(new Uint8Array(buffer))).toEqual(Array.from(raw));
  });
});

describe("ffmpeg args", () => {
  it("covers extra audio and video formats", () => {
    expect(audioConvertArgs("in.wav", "out.mp3", "mp3")).toEqual(["-i", "in.wav", "-vn", "-acodec", "libmp3lame", "out.mp3"]);
    expect(audioConvertArgs("in.mp3", "out.wav", "wav")).toEqual(["-i", "in.mp3", "-vn", "out.wav"]);
    expect(audioConvertArgs("in.wav", "out.ogg", "ogg")).toContain("libvorbis");
    expect(audioConvertArgs("in.wav", "out.aac", "aac")).toEqual([
      "-i",
      "in.wav",
      "-vn",
      "-c:a",
      "aac",
      "out.aac",
    ]);
    expect(audioConvertArgs("in.wav", "out.m4a", "m4a")).toContain("aac");
    expect(audioConvertArgs("in.wav", "out.flac", "flac").includes("flac")).toBe(true);
    expect(audioConvertArgs("in.wav", "out.bin", "unknown")).toEqual(["-i", "in.wav", "-vn", "out.bin"]);
    expect(videoConvertArgs("in.mp4", "out.webm", "webm")).toEqual(["-i", "in.mp4", "-c:v", "libvpx", "-c:a", "libvorbis", "out.webm"]);
    expect(videoConvertArgs("in.mp4", "out.gif", "gif")).toContain("fps=12,scale=480:-1:flags=lanczos");
    expect(videoConvertArgs("in.webm", "out.mp4", "mp4")).toEqual([
      "-i",
      "in.webm",
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart",
      "out.mp4",
    ]);
    expect(videoConvertArgs("in.mp4", "out.mkv", "mkv")).toEqual(["-i", "in.mp4", "-c:v", "libx264", "-c:a", "aac", "out.mkv"]);
    expect(videoConvertArgs("in.mp4", "out.bin", "unknown")).toEqual(["-i", "in.mp4", "out.bin"]);
    expect(audioSpeedArgs("in.mp3", "out.mp3", 8, 1)[3]).toBe("atempo=2,volume=1");
    expect(audioSpeedArgs("in.mp3", "out.mp3", 0.1, 1)[3]).toBe("atempo=0.5,volume=1");
    expect(trimArgs("in.mp4", "out.mp4", 10, 20)).toEqual([
      "-i",
      "in.mp4",
      "-ss",
      "10",
      "-t",
      "10",
      "out.mp4",
    ]);
    expect(audioSpeedArgs("in.mp3", "out.mp3", 1.25, 1)).toEqual([
      "-i",
      "in.mp3",
      "-filter:a",
      "atempo=1.25,volume=1",
      "out.mp3",
    ]);
    expect(videoSpeedArgs("in.mp4", "out.mp4", 2, 0.5)[2]).toBe("-filter_complex");
    expect(videoSpeedVideoOnlyArgs("in.mp4", "out.mp4", 2)).toEqual([
      "-i",
      "in.mp4",
      "-filter:v",
      "setpts=0.500*PTS",
      "-an",
      "out.mp4",
    ]);
    expect(videoExtractAudioArgs("in.mp4", "audio.mp3")).toEqual([
      "-i",
      "in.mp4",
      "-vn",
      "-acodec",
      "libmp3lame",
      "audio.mp3",
    ]);
    expect(gifClipArgs("in.mp4", "out.gif", "1", "3")).toEqual([
      "-i",
      "in.mp4",
      "-ss",
      "1",
      "-t",
      "2",
      "-vf",
      "fps=12,scale=480:-1:flags=lanczos",
      "-loop",
      "0",
      "out.gif",
    ]);
  });
});

describe("transcodeOnFFmpeg cleanup", () => {
  it("deletes input and output even when exec throws", async () => {
    const deleted: string[] = [];
    const ff = {
      writeFile: vi.fn(async () => undefined),
      exec: vi.fn(async () => {
        throw new Error("bad codec");
      }),
      readFile: vi.fn(async () => new Uint8Array([1])),
      deleteFile: vi.fn(async (name: string) => {
        deleted.push(name);
      }),
    };
    await expect(transcodeOnFFmpeg(ff, "in.wav", new Uint8Array([0]), "out.mp3", ["-i", "in.wav", "out.mp3"])).rejects.toThrow(
      "bad codec"
    );
    expect(deleted).toEqual(["in.wav", "out.mp3"]);
    expect(ff.readFile).not.toHaveBeenCalled();
  });

  it("treats a non-zero exec code as failure and still deletes files", async () => {
    const deleted: string[] = [];
    const ff = {
      writeFile: vi.fn(async () => undefined),
      exec: vi.fn(async () => 1),
      readFile: vi.fn(async () => new Uint8Array([1])),
      deleteFile: vi.fn(async (name: string) => {
        deleted.push(name);
      }),
    };
    await expect(transcodeOnFFmpeg(ff, "in.wav", new Uint8Array([0]), "out.mp3", ["-i", "in.wav", "out.mp3"])).rejects.toThrow(
      /exited with code 1/
    );
    expect(deleted).toEqual(["in.wav", "out.mp3"]);
    expect(ff.readFile).not.toHaveBeenCalled();
  });

  it("returns bytes after a successful exec and still deletes files", async () => {
    const deleted: string[] = [];
    const ff = {
      writeFile: vi.fn(async () => undefined),
      exec: vi.fn(async () => 0),
      readFile: vi.fn(async () => new Uint8Array([9, 8])),
      deleteFile: vi.fn(async (name: string) => {
        deleted.push(name);
      }),
    };
    const out = await transcodeOnFFmpeg(ff, "in.wav", new Uint8Array([0]), "out.mp3", ["-i", "in.wav"]);
    expect(Array.from(out)).toEqual([9, 8]);
    expect(deleted).toEqual(["in.wav", "out.mp3"]);
  });
});

describe("waveform peaks", () => {
  it("downsamples a channel to peak magnitudes", () => {
    const samples = new Float32Array([0, 0.5, -1, 0.25, 0, 0]);
    const peaks = peaksFromChannel(samples, 3);
    expect(peaks).toHaveLength(3);
    expect(peaks[1]).toBeGreaterThan(peaks[0]);
    expect(Math.max(...peaks)).toBeLessThanOrEqual(1);
    const mono = mixToMono([new Float32Array([1, 0]), new Float32Array([-1, 0])]);
    expect(mono[0]).toBe(0);
  });
});
