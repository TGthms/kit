import QRCode from "qrcode";
import jsQR from "jsqr";

export async function generateQrDataUrl(text: string, size = 256): Promise<string> {
  if (!text) throw new Error("Text is empty");
  return QRCode.toDataURL(text, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}

export function readQrFromImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number
): string | null {
  const result = jsQR(data, width, height, { inversionAttempts: "attemptBoth" });
  return result?.data ?? null;
}

/** Render a QR matrix to RGBA pixels (quiet zone included). Used by decode tests. */
export async function qrToPixels(text: string, scale = 4): Promise<{
  data: Uint8ClampedArray;
  width: number;
  height: number;
}> {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const modules = qr.modules;
  const size = modules.size;
  const quiet = 4;
  const dim = (size + quiet * 2) * scale;
  const data = new Uint8ClampedArray(dim * dim * 4);
  for (let y = 0; y < dim; y++) {
    for (let x = 0; x < dim; x++) {
      const mx = Math.floor(x / scale) - quiet;
      const my = Math.floor(y / scale) - quiet;
      const dark = mx >= 0 && my >= 0 && mx < size && my < size && modules.get(mx, my);
      const v = dark ? 0 : 255;
      const i = (y * dim + x) * 4;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return { data, width: dim, height: dim };
}
