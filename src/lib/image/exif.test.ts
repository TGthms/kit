import { describe, expect, it } from "vitest";
import { parseImageMetadata } from "./exif";

function u16(n: number, little = true): number[] {
  return little ? [n & 0xff, (n >> 8) & 0xff] : [(n >> 8) & 0xff, n & 0xff];
}
function u32(n: number, little = true): number[] {
  return little
    ? [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]
    : [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** Minimal JPEG + APP1 Exif with Make and DateTime. */
function jpegWithExif(): Uint8Array {
  const datetime = "2020:01:02 03:04:05\0";
  const dtBytes = [...datetime].map((c) => c.charCodeAt(0));
  // TIFF: II, 42, IFD0@8, 2 entries, next=0, then DateTime string at offset 38
  const tiff: number[] = [
    0x49, 0x49,
    ...u16(0x002a),
    ...u32(8),
    ...u16(2),
    // Make ASCII "Kit\0" inline
    ...u16(0x010f),
    ...u16(2),
    ...u32(4),
    0x4b, 0x69, 0x74, 0x00,
    // DateTime ASCII, count 20, offset 38
    ...u16(0x0132),
    ...u16(2),
    ...u32(20),
    ...u32(38),
    ...u32(0),
    ...dtBytes,
  ];
  const exifHeader = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
  const payload = [...exifHeader, ...tiff];
  const app1Len = payload.length + 2;
  return Uint8Array.from([
    0xff, 0xd8,
    0xff, 0xe1,
    (app1Len >> 8) & 0xff,
    app1Len & 0xff,
    ...payload,
    0xff, 0xd9,
  ]);
}

describe("parseImageMetadata", () => {
  it("reads JPEG EXIF Make and DateTime (view, not strip)", () => {
    const tags = parseImageMetadata(jpegWithExif());
    const map = Object.fromEntries(tags.map((t) => [t.tag, t.value]));
    expect(map.Make).toBe("Kit");
    expect(map.DateTime).toBe("2020:01:02 03:04:05");
  });

  it("reads PNG tEXt chunks", () => {
    // 1x1 PNG plus tEXt Software=Kit
    const png = Uint8Array.from(
      atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="),
      (c) => c.charCodeAt(0)
    );
    const keyword = "Software";
    const value = "Kit";
    const data = new TextEncoder().encode(`${keyword}\0${value}`);
    const type = [0x74, 0x45, 0x58, 0x74]; // tEXt
    const len = [
      (data.length >> 24) & 0xff,
      (data.length >> 16) & 0xff,
      (data.length >> 8) & 0xff,
      data.length & 0xff,
    ];
    // CRC is not validated by the parser
    const chunk = Uint8Array.from([...len, ...type, ...data, 0, 0, 0, 0]);
    // insert before IEND (last 12 bytes)
    const merged = new Uint8Array(png.length + chunk.length);
    merged.set(png.subarray(0, png.length - 12));
    merged.set(chunk, png.length - 12);
    merged.set(png.subarray(png.length - 12), png.length - 12 + chunk.length);
    const tags = parseImageMetadata(merged);
    expect(tags.some((t) => t.tag === "Software" && t.value === "Kit")).toBe(true);
  });

  it("returns empty for unknown bytes", () => {
    expect(parseImageMetadata(new Uint8Array([1, 2, 3, 4]))).toEqual([]);
  });
});
