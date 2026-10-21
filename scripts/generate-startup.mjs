/** Native launch images cannot animate. Match the web spinner's initial frame. */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { STARTUP_SCREENS } from "../src/lib/pwa/startup-screens.ts";

const destination = new URL("../public/startup/", import.meta.url);
await mkdir(destination, { recursive: true });
for (const { width, height, scale } of STARTUP_SCREENS) {
  const spinner = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12.5" fill="none" stroke="#007aff" stroke-opacity=".2" stroke-width="3"/><path d="M 5.161 5.161 A 12.5 12.5 0 0 1 22.839 5.161" fill="none" stroke="#007aff" stroke-width="3"/></svg>'))
    .resize(28 * scale).png().toBuffer();
  for (const orientation of ["portrait", "landscape"]) {
    for (const appearance of ["light", "dark"]) {
      const imageWidth = (orientation === "portrait" ? width : height) * scale;
      const imageHeight = (orientation === "portrait" ? height : width) * scale;
      await sharp({ create: { width: imageWidth, height: imageHeight, channels: 3,
        background: appearance === "dark" ? "#000000" : "#f5f5f7" } })
        .composite([{ input: spinner, left: Math.round((imageWidth - 28 * scale) / 2), top: Math.round((imageHeight - 28 * scale) / 2) }])
        .png({ palette: true, compressionLevel: 9 })
        .toFile(new URL(`${width}-${height}-${scale}-${orientation}-${appearance}.png`, destination).pathname);
    }
  }
}
