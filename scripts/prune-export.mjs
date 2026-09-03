/**
 * Next.js 16 static export writes extra `__next.*.txt` segment-prefetch files
 * per route. Client navigations use `{path}/index.txt` (see
 * next/dist/client/components/router-reducer/fetch-server-response.js).
 * Hover prefetch uses the `__next.*` files; a miss falls back to index.txt.
 *
 * Cloudflare Pages Free allows 20,000 files per deployment. 30 locales × ~106
 * pages × those extras exceeds the cap. This postbuild step deletes only the
 * `__next.*.txt` files and keeps HTML + index.txt.
 *
 * Cloudflare clones GitHub and runs `npm run build`; it does not upload the
 * gitignored local `out/` folder.
 */
import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const CLOUDFLARE_PAGES_FREE_FILE_LIMIT = 20_000;

export function isSegmentPrefetchFile(name) {
  return name.startsWith("__next.") && name.endsWith(".txt");
}

export function walkFiles(root) {
  const files = [];
  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile()) files.push(full);
    }
  }
  visit(root);
  return files;
}

export function pruneExportDir(root) {
  if (!existsSync(root)) {
    throw new Error(`export directory not found: ${root}`);
  }
  const before = walkFiles(root);
  let removed = 0;
  for (const file of before) {
    const name = basename(file);
    if (name === ".DS_Store" || isSegmentPrefetchFile(name)) {
      unlinkSync(file);
      removed += 1;
    }
  }
  const remaining = walkFiles(root).length;
  if (remaining > CLOUDFLARE_PAGES_FREE_FILE_LIMIT) {
    throw new Error(
      `export still has ${remaining} files after prune (Cloudflare Pages Free limit is ${CLOUDFLARE_PAGES_FREE_FILE_LIMIT})`
    );
  }
  return { removed, remaining, before: before.length };
}

const thisFile = fileURLToPath(import.meta.url);
const invoked = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (invoked) {
  const rootDir = dirname(dirname(thisFile));
  const outDir = join(rootDir, "out");
  const result = pruneExportDir(outDir);
  console.log(
    `[prune-export] removed ${result.removed} segment files; ${result.remaining} files remain (from ${result.before})`
  );
}
