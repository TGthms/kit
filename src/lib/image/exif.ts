export type ExifTag = { tag: string; value: string };

const JPEG_TAGS: Record<number, string> = {
  0x010f: "Make",
  0x0110: "Model",
  0x0112: "Orientation",
  0x011a: "XResolution",
  0x011b: "YResolution",
  0x0128: "ResolutionUnit",
  0x0131: "Software",
  0x0132: "DateTime",
  0x0100: "ImageWidth",
  0x0101: "ImageHeight",
  0x829a: "ExposureTime",
  0x829d: "FNumber",
  0x8827: "ISO",
  0x9003: "DateTimeOriginal",
  0x9004: "DateTimeDigitized",
  0x920a: "FocalLength",
  0xa002: "ExifImageWidth",
  0xa003: "ExifImageHeight",
};

const GPS_TAGS: Record<number, string> = {
  0x0001: "GPSLatitudeRef",
  0x0002: "GPSLatitude",
  0x0003: "GPSLongitudeRef",
  0x0004: "GPSLongitude",
  0x0005: "GPSAltitudeRef",
  0x0006: "GPSAltitude",
};

function readAscii(view: DataView, offset: number, length: number): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    const c = view.getUint8(offset + i);
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s.trim();
}

function formatValue(
  view: DataView,
  little: boolean,
  type: number,
  count: number,
  valueOffset: number
): string {
  const sizeOf: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 9: 4, 10: 8 };
  const unit = sizeOf[type] ?? 1;
  const byteLen = unit * count;
  const dataOffset = byteLen <= 4 ? valueOffset : view.getUint32(valueOffset, little);

  if (type === 2) return readAscii(view, dataOffset, count);

  const nums: number[] = [];
  for (let i = 0; i < Math.min(count, 8); i++) {
    const o = dataOffset + i * unit;
    if (o + unit > view.byteLength) break;
    if (type === 3) nums.push(view.getUint16(o, little));
    else if (type === 4) nums.push(view.getUint32(o, little));
    else if (type === 5) {
      const n = view.getUint32(o, little);
      const d = view.getUint32(o + 4, little);
      nums.push(d ? n / d : n);
    } else if (type === 9) nums.push(view.getInt32(o, little));
    else if (type === 10) {
      const n = view.getInt32(o, little);
      const d = view.getInt32(o + 4, little);
      nums.push(d ? n / d : n);
    } else if (type === 1) nums.push(view.getUint8(o));
  }
  return nums.map((n) => (Number.isInteger(n) ? String(n) : n.toFixed(4).replace(/0+$/, "").replace(/\.$/, ""))).join(", ");
}

function parseIfd(
  view: DataView,
  tiffStart: number,
  ifdOffset: number,
  little: boolean,
  names: Record<number, string>
): { tags: ExifTag[]; next: number; pointers: Record<string, number> } {
  const tags: ExifTag[] = [];
  const pointers: Record<string, number> = {};
  if (tiffStart + ifdOffset + 2 > view.byteLength) return { tags, next: 0, pointers };
  const count = view.getUint16(tiffStart + ifdOffset, little);
  for (let i = 0; i < count; i++) {
    const entry = tiffStart + ifdOffset + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;
    const tag = view.getUint16(entry, little);
    const type = view.getUint16(entry + 2, little);
    const num = view.getUint32(entry + 4, little);
    if (tag === 0x8769 || tag === 0x8825) {
      pointers[tag === 0x8769 ? "exif" : "gps"] = view.getUint32(entry + 8, little);
      continue;
    }
    const name = names[tag];
    if (!name) continue;
    tags.push({ tag: name, value: formatValue(view, little, type, num, entry + 8) });
  }
  const nextOff = tiffStart + ifdOffset + 2 + count * 12;
  const next = nextOff + 4 <= view.byteLength ? view.getUint32(nextOff, little) : 0;
  return { tags, next, pointers };
}

function parseTiffExif(bytes: Uint8Array, start: number, length: number): ExifTag[] {
  const end = Math.min(bytes.length, start + length);
  const view = new DataView(bytes.buffer, bytes.byteOffset + start, end - start);
  if (view.byteLength < 8) return [];
  const b0 = view.getUint8(0);
  const b1 = view.getUint8(1);
  const little = b0 === 0x49 && b1 === 0x49;
  const big = b0 === 0x4d && b1 === 0x4d;
  if (!little && !big) return [];
  if (view.getUint16(2, little) !== 0x002a) return [];
  const ifd0 = view.getUint32(4, little);
  const first = parseIfd(view, 0, ifd0, little, JPEG_TAGS);
  const out = [...first.tags];
  if (first.pointers.exif) {
    out.push(...parseIfd(view, 0, first.pointers.exif, little, JPEG_TAGS).tags);
  }
  if (first.pointers.gps) {
    out.push(...parseIfd(view, 0, first.pointers.gps, little, GPS_TAGS).tags);
  }
  return out;
}

function parseJpegExif(bytes: Uint8Array): ExifTag[] {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return [];
  let i = 2;
  while (i + 4 < bytes.length) {
    if (bytes[i] !== 0xff) break;
    const marker = bytes[i + 1];
    const size = (bytes[i + 2] << 8) | bytes[i + 3];
    if (marker === 0xda) break;
    if (marker === 0xe1 && size >= 8) {
      const payload = i + 4;
      const header = String.fromCharCode(
        bytes[payload],
        bytes[payload + 1],
        bytes[payload + 2],
        bytes[payload + 3]
      );
      if (header === "Exif") {
        return parseTiffExif(bytes, payload + 6, size - 8);
      }
    }
    i += 2 + size;
  }
  return [];
}

function parsePngText(bytes: Uint8Array): ExifTag[] {
  const tags: ExifTag[] = [];
  if (bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return tags;
  let i = 8;
  while (i + 12 <= bytes.length) {
    const len = (bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3];
    const type = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7]);
    const dataStart = i + 8;
    const dataEnd = dataStart + len;
    if (dataEnd + 4 > bytes.length) break;
    if (type === "tEXt" || type === "iTXt") {
      const slice = bytes.subarray(dataStart, dataEnd);
      const nul = slice.indexOf(0);
      if (nul > 0) {
        const key = new TextDecoder().decode(slice.subarray(0, nul));
        let valueBytes = slice.subarray(nul + 1);
        if (type === "iTXt") {
          // compression flag, method, language, translated key, then text
          if (valueBytes.length > 2) {
            let rest = 2;
            const skipNul = () => {
              const z = valueBytes.indexOf(0, rest);
              rest = z < 0 ? valueBytes.length : z + 1;
            };
            skipNul();
            skipNul();
            valueBytes = valueBytes.subarray(rest);
          }
        }
        const value = new TextDecoder().decode(valueBytes).replace(/\0/g, "").trim();
        if (key && value) tags.push({ tag: key, value });
      }
    }
    if (type === "eXIf") {
      tags.push(...parseTiffExif(bytes, dataStart, len));
    }
    i = dataEnd + 4;
  }
  return tags;
}

/** Parse EXIF / text metadata from a JPEG or PNG. Returns [] when none. */
export function parseImageMetadata(bytes: Uint8Array): ExifTag[] {
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) return parseJpegExif(bytes);
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50) return parsePngText(bytes);
  return [];
}
