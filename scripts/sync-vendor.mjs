// Copies pdf.js runtime assets out of node_modules into public/vendor so they
// are served from our own origin instead of a third-party CDN. The worker
// parses untrusted user PDFs; CMaps/fonts/WASM are needed for CJK glyphs and
// JPEG2000/JBIG2 pages. Keep this in lockstep with the installed pdfjs-dist.
//
// Run automatically via the "postinstall" and "prebuild" npm scripts.
import { copyFileSync, cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const pdfjsRoot = join(rootDir, "node_modules/pdfjs-dist");
const destRoot = join(rootDir, "public/vendor/pdfjs");

if (!existsSync(pdfjsRoot)) {
  console.warn(`[sync-vendor] pdfjs-dist not found at ${pdfjsRoot}; skipping.`);
  process.exit(0);
}

mkdirSync(destRoot, { recursive: true });

const workerSrc = join(pdfjsRoot, "build/pdf.worker.min.mjs");
if (existsSync(workerSrc)) {
  copyFileSync(workerSrc, join(destRoot, "pdf.worker.min.mjs"));
  console.log("[sync-vendor] Copied pdf.worker.min.mjs");
} else {
  console.warn(`[sync-vendor] worker not found at ${workerSrc}; skipping.`);
}

for (const dir of ["cmaps", "standard_fonts", "wasm", "iccs"]) {
  const src = join(pdfjsRoot, dir);
  if (!existsSync(src)) {
    console.warn(`[sync-vendor] ${dir} not found; skipping.`);
    continue;
  }
  const dest = join(destRoot, dir);
  cpSync(src, dest, { recursive: true });
  console.log(`[sync-vendor] Copied ${dir}/`);
}
