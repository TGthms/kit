import { describe, expect, it } from "vitest";
import {
  audioConvertArgs,
  audioSpeedArgs,
  gifClipArgs,
  trimArgs,
  videoConvertArgs,
  videoExtractAudioArgs,
  videoSpeedArgs,
  videoSpeedVideoOnlyArgs,
} from "./ffmpeg";
import { mixToMono, peaksFromChannel } from "./peaks";

describe("ffmpeg args", () => {
  it("covers extra audio and video formats", () => {
    expect(audioConvertArgs("in.wav", "out.aac", "aac")).toEqual([
      "-i",
      "in.wav",
      "-vn",
      "-c:a",
      "aac",
      "out.aac",
    ]);
    expect(audioConvertArgs("in.wav", "out.flac", "flac").includes("flac")).toBe(true);
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
