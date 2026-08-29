// Copies the pdf.js worker out of node_modules into public/vendor so it is
// served from our own origin instead of being fetched from a third-party CDN
// at runtime. This file processes untrusted, user-supplied PDFs, so keeping
// it self-hosted (and version-locked to whatever pdfjs-dist we actually
// installed) matters more than it does for a typical static asset.
//
// Run automatically via the "postinstall" and "prebuild" npm scripts so the
// vendored copy can never silently drift from package.json's pdfjs-dist.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

const src = join(rootDir, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const destDir = join(rootDir, "public/vendor/pdfjs");
const dest = join(destDir, "pdf.worker.min.mjs");

if (!existsSync(src)) {
  console.warn(`[sync-vendor] pdfjs-dist worker not found at ${src}; skipping.`);
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`[sync-vendor] Copied pdf.worker.min.mjs -> ${dest}`);
