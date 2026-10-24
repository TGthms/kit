/**
 * Safari Add to Dock needs a full-bleed square, not a tile inside a tile.
 * Keep the original Kit artwork; replace only its rounded perimeter with a
 * continuous background. Browser favicons and the in-app logo stay untouched.
 * Regenerate with: node scripts/generate-install-icons.mjs
 */
import sharp from "sharp";

const destination = new URL("../public/icons/", import.meta.url);
const { data, info } = await sharp(new URL("icon-512.png", destination).pathname)
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
if (info.width !== 512 || info.height !== 512) throw new Error("Expected the 512px Kit master");

// The central artwork (including its shadow) is unchanged. Feather only the
// surrounding texture, well outside the mark, so no old rim survives.
for (let y = 0; y < 512; y++) {
  for (let x = 0; x < 512; x++) {
    const distance = Math.min(x - 64, y - 64, 447 - x, 447 - y);
    const t = Math.max(0, Math.min(1, distance / 32));
    data[(y * 512 + x) * 4 + 3] = Math.round(255 * t * t * (3 - 2 * t));
  }
}
const artwork = await sharp(data, { raw: info }).png().toBuffer();
const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <defs><linearGradient id="bg" x2="1" y2="1" gradientUnits="objectBoundingBox">
    <stop stop-color="#2c2c2d"/><stop offset="1" stop-color="#0c0c0c"/>
  </linearGradient></defs><path fill="url(#bg)" d="M0 0h512v512H0z"/>
</svg>`);
const square = await sharp(background).composite([{ input: artwork }])
  .removeAlpha().png().toBuffer();

for (const size of [512, 1024]) {
  await sharp(square).resize(size).png({ compressionLevel: 9 })
    .toFile(new URL(`icon-${size}-maskable.png`, destination).pathname);
}
