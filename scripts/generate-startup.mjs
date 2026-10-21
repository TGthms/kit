/** Rebuild the iOS launch images from Kit's existing icon. Run with Node 24. */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { STARTUP_SCREENS } from "../src/lib/pwa/startup-screens.ts";

const destination = new URL("../public/startup/", import.meta.url);
await mkdir(destination, { recursive: true });
for (const { width, height, scale } of STARTUP_SCREENS) {
  const icon = await sharp(new URL("../public/icons/apple-touch-icon.png", import.meta.url).pathname)
    .resize(64 * scale).png().toBuffer();
  for (const orientation of ["portrait", "landscape"]) {
    for (const appearance of ["light", "dark"]) {
      const imageWidth = (orientation === "portrait" ? width : height) * scale;
      const imageHeight = (orientation === "portrait" ? height : width) * scale;
      await sharp({ create: { width: imageWidth, height: imageHeight, channels: 3,
        background: appearance === "dark" ? "#000000" : "#f5f5f7" } })
        .composite([{ input: icon, left: Math.round((imageWidth - 64 * scale) / 2), top: Math.round((imageHeight - 64 * scale) / 2) }])
        .png({ palette: true, compressionLevel: 9 })
        .toFile(new URL(`${width}-${height}-${scale}-${orientation}-${appearance}.png`, destination).pathname);
    }
  }
}
