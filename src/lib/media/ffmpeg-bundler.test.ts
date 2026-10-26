import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { expect, it } from "vitest";
const require = createRequire(import.meta.url);
const loader = require("../../../scripts/ffmpeg-worker-loader.cjs") as (source: string) => string;
it("adapts only FFmpeg's optional runtime URL and preserves the default bundled worker", () => {
  const source = readFileSync("node_modules/@ffmpeg/ffmpeg/dist/esm/classes.js", "utf8");
  const output = loader(source);
  expect(output.replace("Reflect.construct(URL, [classWorkerURL, import.meta.url])", "new URL(classWorkerURL, import.meta.url)")).toBe(source);
  expect(output).toContain('new Worker(new URL("./worker.js", import.meta.url),');
  expect(() => loader("unexpected future SDK")).toThrow(/integration changed/);
});


it("preserves native URL resolution for absolute and relative custom workers", () => {
  for (const path of ["https://example.org/worker.js", "./custom.js", "/worker.js"]) {
    expect(Reflect.construct(URL, [path, "https://kit.example/assets/classes.js"]).href).toBe(new URL(path, "https://kit.example/assets/classes.js").href);
  }
});
