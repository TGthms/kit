// Copies pdf.js and FFmpeg WASM runtime assets out of node_modules into
// public/vendor so they are served from our origin instead of a third-party CDN.
// Keep paths in lockstep with the installed pdfjs-dist and @ffmpeg/core versions.
//
// Run automatically via the "postinstall" and "prebuild" npm scripts.
import { copyFileSync, cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

function syncPdfjs() {
  const pdfjsRoot = join(rootDir, "node_modules/pdfjs-dist");
  const destRoot = join(rootDir, "public/vendor/pdfjs");
  if (!existsSync(pdfjsRoot)) {
    console.warn(`[sync-vendor] pdfjs-dist not found at ${pdfjsRoot}; skipping.`);
    return false;
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
    cpSync(src, join(destRoot, dir), { recursive: true });
    console.log(`[sync-vendor] Copied ${dir}/`);
  }
  return true;
}

function syncFfmpeg() {
  const coreRoot = join(rootDir, "node_modules/@ffmpeg/core/dist/umd");
  const destRoot = join(rootDir, "public/vendor/ffmpeg");
  if (!existsSync(coreRoot)) {
    console.warn(`[sync-vendor] @ffmpeg/core not found at ${coreRoot}; skipping.`);
    return false;
  }
  mkdirSync(destRoot, { recursive: true });
  for (const name of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) {
    const src = join(coreRoot, name);
    if (!existsSync(src)) {
      console.warn(`[sync-vendor] ${name} not found at ${src}; skipping.`);
      continue;
    }
    copyFileSync(src, join(destRoot, name));
    console.log(`[sync-vendor] Copied ${name}`);
  }
  return true;
}

const pdf = syncPdfjs();
const ffmpeg = syncFfmpeg();
if (!pdf && !ffmpeg) process.exit(0);
