export type ImageMime = "image/jpeg" | "image/png" | "image/webp";

export async function loadImageBitmap(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file);
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
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, width, height);
  bmp.close();
  const mime = opts.mime || (file.type as ImageMime) || "image/jpeg";
  const outType = mime === "image/png" ? "image/png" : mime === "image/webp" ? "image/webp" : "image/jpeg";
  return canvasToBlob(canvas, outType, outType === "image/png" ? undefined : opts.quality);
}

export async function resizeImage(
  file: Blob,
  opts: { width: number; height: number; lockAspect: boolean; mime?: string }
): Promise<Blob> {
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
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const type = opts.mime || file.type || "image/png";
  return canvasToBlob(canvas, type, 0.92);
}

export async function cropImage(
  file: Blob,
  region: { x: number; y: number; w: number; h: number },
  mime?: string
): Promise<Blob> {
  const bmp = await loadImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(region.w));
  canvas.height = Math.max(1, Math.round(region.h));
  canvas
    .getContext("2d")!
    .drawImage(bmp, region.x, region.y, region.w, region.h, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return canvasToBlob(canvas, mime || file.type || "image/png", 0.92);
}

export async function convertImage(file: Blob, mime: ImageMime, quality = 0.9): Promise<Blob> {
  const bmp = await loadImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0);
  bmp.close();
  return canvasToBlob(canvas, mime, mime === "image/png" ? undefined : quality);
}

export async function stripMetadata(file: Blob): Promise<Blob> {
  return convertImage(file, (file.type as ImageMime) || "image/jpeg", 0.92);
}

export async function adjustImage(
  file: Blob,
  opts: { brightness: number; contrast: number; saturation: number }
): Promise<Blob> {
  const bmp = await loadImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = `brightness(${opts.brightness}%) contrast(${opts.contrast}%) saturate(${opts.saturation}%)`;
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  return canvasToBlob(canvas, file.type || "image/png", 0.92);
}
