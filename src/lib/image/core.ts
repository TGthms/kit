function get2dContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create a 2D canvas context");
  return ctx;
}

export const MAX_IMAGE_CANVAS_EDGE = 8192;
export const MAX_IMAGE_CANVAS_PIXELS = 16_777_216;

export function clampImageSize(width: number, height: number): { width: number; height: number } {
  if (!(width > 0) || !(height > 0)) return { width: 1, height: 1 };
  const edgeScale = MAX_IMAGE_CANVAS_EDGE / Math.max(width, height);
  const pixelScale = Math.sqrt(MAX_IMAGE_CANVAS_PIXELS / (width * height));
  const scale = Math.min(1, edgeScale, pixelScale);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export type ImageMime = "image/jpeg" | "image/png" | "image/webp";

/** PNG/GIF stills stay lossless PNG; WebP stays WebP; everything else is JPEG. */
export function compressOutputMime(type: string): ImageMime {
  const normalized = type.toLowerCase().split(";", 1)[0];
  if (normalized === "image/png" || normalized === "image/gif") return "image/png";
  if (normalized === "image/webp") return "image/webp";
  return "image/jpeg";
}

export async function loadImageBitmap(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return createImageBitmap(file);
  }
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  type: string,
  quality?: number
): Promise<Blob> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      type,
      quality
    );
  });
}

export async function compressImage(
  file: Blob,
  opts: { quality: number; maxWidth: number; maxHeight: number; mime?: ImageMime }
): Promise<Blob> {
  const bmp = await loadImageBitmap(file);
  let { width, height } = bmp;
  const scale = Math.min(1, opts.maxWidth / width, opts.maxHeight / height);
  const clamped = clampImageSize(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));
  width = clamped.width;
  height = clamped.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = get2dContext(canvas);
  ctx.drawImage(bmp, 0, 0, width, height);
  bmp.close();
  const outType = compressOutputMime(opts.mime || file.type || "image/jpeg");
  return canvasToBlob(canvas, outType, outType === "image/png" ? undefined : opts.quality);
}

/**
 * `width`/`height` of 0 mean "not specified, derive from the other
 * dimension / original size" (the UI defaults the height field to 0 so
 * "lock aspect ratio" can drive it). Anything else non-positive or
 * non-finite is an actual bad input — e.g. a stray "-" typed into the
 * number field — and should be rejected with a clear error rather than
 * silently clamped down to a 1x1 output image.
 */
export async function resizeImage(
  file: Blob,
  opts: { width: number; height: number; lockAspect: boolean; mime?: string }
): Promise<Blob> {
  for (const [label, value] of [
    ["Width", opts.width],
    ["Height", opts.height],
  ] as const) {
    if (value !== 0 && (!Number.isFinite(value) || value < 0)) {
      throw new Error(`${label} must be a positive number.`);
    }
  }
  const bmp = await loadImageBitmap(file);
  let w = opts.width || bmp.width;
  let h = opts.height || bmp.height;
  if (opts.lockAspect) {
    const r = bmp.width / bmp.height;
    if (opts.width && !opts.height) h = Math.round(w / r);
    else if (opts.height && !opts.width) w = Math.round(h * r);
    else {
      const s = Math.min(w / bmp.width, h / bmp.height);
      w = Math.round(bmp.width * s);
      h = Math.round(bmp.height * s);
    }
  }
  const canvas = document.createElement("canvas");
  const size = clampImageSize(Math.max(1, w), Math.max(1, h));
  canvas.width = size.width;
  canvas.height = size.height;
  get2dContext(canvas).drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const type = opts.mime || file.type || "image/png";
  return canvasToBlob(canvas, type, 0.92);
}

export async function cropImage(
  file: Blob,
  region: { x: number; y: number; w: number; h: number },
  mime?: string
): Promise<Blob> {
  if (!Number.isFinite(region.w) || !Number.isFinite(region.h) || region.w <= 0 || region.h <= 0) {
    throw new Error("Crop width and height must be positive numbers.");
  }
  const bmp = await loadImageBitmap(file);
  // Clamp the source rectangle to the bitmap's bounds: an out-of-range
  // region (e.g. from a crop handle dragged past the image edge) would
  // otherwise silently draw a blank/transparent area instead of failing
  // loudly or clipping sensibly.
  const sx = Math.max(0, Math.min(region.x, bmp.width));
  const sy = Math.max(0, Math.min(region.y, bmp.height));
  const sw = Math.max(0, Math.min(region.w, bmp.width - sx));
  const sh = Math.max(0, Math.min(region.h, bmp.height - sy));
  if (sw <= 0 || sh <= 0) {
    bmp.close();
    throw new Error("Crop region is outside the image.");
  }
  const canvas = document.createElement("canvas");
  const size = clampImageSize(Math.max(1, Math.round(sw)), Math.max(1, Math.round(sh)));
  canvas.width = size.width;
  canvas.height = size.height;
  get2dContext(canvas).drawImage(bmp, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return canvasToBlob(canvas, mime || file.type || "image/png", 0.92);
}

export async function convertImage(file: Blob, mime: ImageMime, quality = 0.9): Promise<Blob> {
  const bmp = await loadImageBitmap(file);
  const canvas = document.createElement("canvas");
  const size = clampImageSize(bmp.width, bmp.height);
  canvas.width = size.width;
  canvas.height = size.height;
  get2dContext(canvas).drawImage(bmp, 0, 0, size.width, size.height);
  bmp.close();
  return canvasToBlob(canvas, mime, mime === "image/png" ? undefined : quality);
}

/**
 * Re-encoding via canvas is what actually strips EXIF/XMP metadata (canvas
 * never preserves it), but it necessarily re-compresses the pixels too —
 * there's no lossless "just delete the metadata bytes" path available from
 * the browser canvas API. We default to PNG (lossless) rather than JPEG
 * when the source `file.type` is empty/unrecognized (which can happen for
 * files from some clipboard/drag sources) specifically so we never silently
 * convert an unknown-type image with transparency into a lossy JPEG and
 * drop its alpha channel.
 */
export async function stripMetadata(file: Blob): Promise<Blob> {
  const mime: ImageMime =
    file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp"
      ? file.type
      : "image/png";
  return convertImage(file, mime, 0.92);
}

export async function adjustImage(
  file: Blob,
  opts: { brightness: number; contrast: number; saturation: number }
): Promise<Blob> {
  const bmp = await loadImageBitmap(file);
  const canvas = document.createElement("canvas");
  const size = clampImageSize(bmp.width, bmp.height);
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = get2dContext(canvas);
  ctx.filter = `brightness(${opts.brightness}%) contrast(${opts.contrast}%) saturate(${opts.saturation}%)`;
  ctx.drawImage(bmp, 0, 0, size.width, size.height);
  bmp.close();
  return canvasToBlob(canvas, file.type || "image/png", 0.92);
}

async function bitmapToBuffer(file: Blob) {
  const bmp = await loadImageBitmap(file);
  const canvas = document.createElement("canvas");
  const size = clampImageSize(bmp.width, bmp.height);
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = get2dContext(canvas);
  ctx.drawImage(bmp, 0, 0, size.width, size.height);
  bmp.close();
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { canvas, ctx, imageData };
}

function bufferToCanvas(buf: { data: Uint8ClampedArray; width: number; height: number }) {
  const canvas = document.createElement("canvas");
  canvas.width = buf.width;
  canvas.height = buf.height;
  const ctx = get2dContext(canvas);
  const copy = new Uint8ClampedArray(buf.data.length);
  copy.set(buf.data);
  ctx.putImageData(new ImageData(copy, buf.width, buf.height), 0, 0);
  return canvas;
}

export async function rotateImage(file: Blob, degrees: 90 | 180 | 270, mime?: string): Promise<Blob> {
  const { rotatePixels } = await import("./transform");
  const { imageData } = await bitmapToBuffer(file);
  const next = rotatePixels(
    { data: imageData.data, width: imageData.width, height: imageData.height },
    degrees
  );
  return canvasToBlob(bufferToCanvas(next), mime || file.type || "image/png", 0.92);
}

export async function flipImage(file: Blob, axis: "h" | "v", mime?: string): Promise<Blob> {
  const { flipPixels } = await import("./transform");
  const { imageData } = await bitmapToBuffer(file);
  const next = flipPixels(
    { data: imageData.data, width: imageData.width, height: imageData.height },
    axis
  );
  return canvasToBlob(bufferToCanvas(next), mime || file.type || "image/png", 0.92);
}

export async function filterImage(
  file: Blob,
  filter: "grayscale" | "sepia" | "invert",
  mime?: string
): Promise<Blob> {
  const { applyFilterPixels } = await import("./transform");
  const { imageData } = await bitmapToBuffer(file);
  const next = applyFilterPixels(
    { data: imageData.data, width: imageData.width, height: imageData.height },
    filter
  );
  return canvasToBlob(bufferToCanvas(next), mime || file.type || "image/png", 0.92);
}

export async function watermarkImage(
  file: Blob,
  opts: {
    text: string;
    position?: "center" | "bottom-right" | "bottom-left" | "top-right";
    opacity?: number;
  }
): Promise<Blob> {
  const bmp = await loadImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = get2dContext(canvas);
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  const size = Math.max(14, Math.round(Math.min(canvas.width, canvas.height) * 0.045));
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.fillStyle = `rgba(255,255,255,${opts.opacity ?? 0.7})`;
  ctx.strokeStyle = `rgba(0,0,0,${(opts.opacity ?? 0.7) * 0.55})`;
  ctx.lineWidth = Math.max(1, size / 12);
  const text = opts.text;
  const tw = ctx.measureText(text).width;
  const pad = size;
  let x = (canvas.width - tw) / 2;
  let y = canvas.height / 2;
  const pos = opts.position ?? "bottom-right";
  if (pos === "bottom-right") {
    x = canvas.width - tw - pad;
    y = canvas.height - pad;
  } else if (pos === "bottom-left") {
    x = pad;
    y = canvas.height - pad;
  } else if (pos === "top-right") {
    x = canvas.width - tw - pad;
    y = pad + size;
  }
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  return canvasToBlob(canvas, file.type || "image/png", 0.92);
}

export async function exportFavicons(
  file: Blob,
  sizes: readonly number[] = [16, 32, 48, 180, 192, 512]
): Promise<Array<{ name: string; blob: Blob }>> {
  const bmp = await loadImageBitmap(file);
  const out: Array<{ name: string; blob: Blob }> = [];
  for (const size of sizes) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = get2dContext(canvas);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bmp, 0, 0, size, size);
    out.push({ name: `icon-${size}.png`, blob: await canvasToBlob(canvas, "image/png") });
  }
  bmp.close();
  return out;
}
