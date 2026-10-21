/** The `/` route only hands off to a locale. Its exported entry needs no
 * framework runtime: keep its real SSR content/metadata and two tiny scripts. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export function standaloneEntry(html) {
  if (!html.includes('id="kit-locale-entry"') || !html.includes('id="kit-entry-style"')) {
    throw new Error("The root entry is missing its independent boot script or styles");
  }
  const entry = html
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script>/giu, (tag, attributes) =>
      /\bid="(?:kit-document-boot|kit-locale-entry)"/u.test(attributes) || /\btype="application\/ld\+json"/u.test(attributes) ? tag : "")
    .replace(/<link\b[^>]*\bhref="[^"<>]*\/_next\/[^"<>]*"[^>]*>/giu, "");
  if (/<script\b[^>]*\bsrc=/iu.test(entry) || /<link\b[^>]*rel="stylesheet"/iu.test(entry)) {
    throw new Error("The root entry must not wait for an external script or stylesheet");
  }
  return entry;
}

/** Preserve the host's global security headers on the worker-created entry. */
export function entryHeaders(source) {
  const headers = {};
  let global = false;
  for (const line of source.split(/\r?\n/u)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/u.test(line)) { global = line.trim() === "/*"; continue; }
    const match = line.match(/^\s+([\w-]+):\s*(.*)$/u);
    if (global && match) headers[match[1]] = match[2];
  }
  return headers;
}

export function prepareStartupEntry(outDir) {
  const file = join(outDir, "index.html");
  const original = readFileSync(file, "utf8");
  const entry = standaloneEntry(original);
  const workerFile = join(outDir, "sw.js");
  const worker = readFileSync(workerFile, "utf8");
  if (!/^const ENTRY_HTML = .*;$/mu.test(worker)) throw new Error("Worker has no entry slot");
  const headers = entryHeaders(readFileSync(join(outDir, "_headers"), "utf8"));
  const literal = JSON.stringify(entry).replace(/\u2028/gu, "\\u2028").replace(/\u2029/gu, "\\u2029");
  writeFileSync(file, entry);
  writeFileSync(workerFile, worker
    .replace(/^const ENTRY_HTML = .*;$/mu, () => `const ENTRY_HTML = ${literal};`)
    .replace(/^const ENTRY_HEADERS = .*;$/mu, () => `const ENTRY_HEADERS = ${JSON.stringify(headers)};`));
  return { before: Buffer.byteLength(original), after: Buffer.byteLength(entry) };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const result = prepareStartupEntry(join(dirname(dirname(fileURLToPath(import.meta.url))), "out"));
  console.log(`[startup-entry] standalone root ${result.after} bytes (was ${result.before}); embedded in worker`);
}
