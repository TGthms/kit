// Copies pdf.js and FFmpeg WASM runtime assets out of node_modules into
// public/vendor so they are served from our origin instead of a third-party CDN.
// Keep paths in lockstep with the installed pdfjs-dist and @ffmpeg/core versions.
//
// FFmpeg's core WASM is ~31 MiB uncompressed. Cloudflare Pages rejects files
// over 25 MiB, so we ship gzip (~10 MiB) and decompress in the browser.
//
// Run automatically via the "postinstall" and "prebuild" npm scripts.
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

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

  const jsSrc = join(coreRoot, "ffmpeg-core.js");
  if (existsSync(jsSrc)) {
    copyFileSync(jsSrc, join(destRoot, "ffmpeg-core.js"));
    console.log("[sync-vendor] Copied ffmpeg-core.js");
  } else {
    console.warn(`[sync-vendor] ffmpeg-core.js not found at ${jsSrc}; skipping.`);
  }

  const wasmSrc = join(coreRoot, "ffmpeg-core.wasm");
  if (existsSync(wasmSrc)) {
    const gzPath = join(destRoot, "ffmpeg-core.wasm.gz");
    const gz = gzipSync(readFileSync(wasmSrc), { level: 9 });
    const maxBytes = 24 * 1024 * 1024;
    if (gz.byteLength > maxBytes) {
      throw new Error(
        `[sync-vendor] ffmpeg-core.wasm.gz is ${(gz.byteLength / (1024 * 1024)).toFixed(1)} MiB; Cloudflare Pages limit is 25 MiB.`
      );
    }
    writeFileSync(gzPath, gz);
    console.log(`[sync-vendor] Wrote ffmpeg-core.wasm.gz (${(gz.byteLength / (1024 * 1024)).toFixed(1)} MiB)`);
  } else {
    console.warn(`[sync-vendor] ffmpeg-core.wasm not found at ${wasmSrc}; skipping.`);
  }

  const leftover = join(destRoot, "ffmpeg-core.wasm");
  if (existsSync(leftover)) {
    unlinkSync(leftover);
    console.log("[sync-vendor] Removed uncompressed ffmpeg-core.wasm");
  }
  return true;
}

const pdf = syncPdfjs();
const ffmpeg = syncFfmpeg();
if (!pdf && !ffmpeg) process.exit(0);
