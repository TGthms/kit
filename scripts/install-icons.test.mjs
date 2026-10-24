// @vitest-environment node
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const publicDir = new URL("../public/", import.meta.url);

describe("installed app icons", () => {
  it("offers opaque, square maskable icons through 1024px for Add to Dock", async () => {
    const manifest = JSON.parse(await readFile(new URL("manifest.webmanifest", publicDir), "utf8"));
    const icons = manifest.icons.filter((icon) => icon.purpose === "maskable");
    expect(icons.map((icon) => icon.sizes)).toEqual(["512x512", "1024x1024"]);
    for (const icon of icons) {
      const file = new URL(icon.src, publicDir);
      const metadata = await sharp(file.pathname).metadata();
      expect(icon.sizes).toBe(`${metadata.width}x${metadata.height}`);
      expect((await sharp(file.pathname).stats()).isOpaque).toBe(true);
    }
  });

  it("preserves the original mark at full scale without a second rounded tile", async () => {
    const icon = new URL("icons/icon-512-maskable.png", publicDir).pathname;
    const master = new URL("icons/icon-512.png", publicDir).pathname;
    const mark = { left: 128, top: 100, width: 264, height: 304 };
    expect(await sharp(icon).extract(mark).removeAlpha().raw().toBuffer())
      .toEqual(await sharp(master).extract(mark).removeAlpha().raw().toBuffer());

    // A system mask must encounter only background near the square's perimeter,
    // with neither transparent corners nor the old baked-in light border.
    const { data, info } = await sharp(icon).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        if (x >= 96 && x < 416 && y >= 96 && y < 416) continue;
        const offset = (y * 512 + x) * info.channels;
        if (Math.max(...data.subarray(offset, offset + 3)) > 50) {
          throw new Error(`Inset frame or light border at ${x},${y}`);
        }
      }
    }
  });
});
