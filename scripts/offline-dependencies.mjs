/** Derive cold tool dependencies from the production export, including lazy
 * imports. Turbopack's dispatch module enumerates every tool but loads only the
 * requested branch. Follow those branches separately; fail a production build
 * if that boundary cannot be identified instead of guessing missing assets. */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const chunkPattern = /["']((?:\/?_next\/)?static\/chunks\/[^"']+\.(?:js|css))["']/gu;
const references = source => [...source.matchAll(chunkPattern)].map(match => `/_next/${match[1].replace(/^\/?_next\//u, "")}`);
export function offlineDependencies(outDir, manifest, basePath = "") {
  const prefix = basePath.replace(/\/$/u, "");
  const local = url => prefix && url.startsWith(prefix) ? url.slice(prefix.length) : url;
  const sources = new Map(manifest.core.filter(url => /\.(?:js|css)$/u.test(url)).map(url => [local(url), readFileSync(join(outDir, local(url)), "utf8")]));
  const bootstrap = new Map(), branches = new Map(), modules = new Map();
  const toolIds = new Set((manifest.toolsByLocale.en || []).map(url => url.split("/").filter(Boolean).at(-1)));
  // Public world-clock is implemented by the timezone-converter registry entry.
  const publicId = id => id === "timezone-converter" ? "world-clock" : id;
  for (const [path, source] of sources) {
    if (!path.endsWith(".js")) continue;
    const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const spans = [];
    const visit = node => {
      if (ts.isArrayLiteralExpression(node)) {
        node.elements.forEach((element, i) => {
          const next = node.elements[i + 1];
          if (ts.isNumericLiteral(element) && next && ts.isArrowFunction(next)) {
            const text = next.getText(file);
            if (/\.v\(/u.test(text)) { bootstrap.set(element.text, references(text)); spans.push({ id: element.text, start: next.getStart(file), end: next.end }); }
          }
        });
      }
      if (ts.isPropertyAssignment(node) && (ts.isStringLiteral(node.name) || ts.isIdentifier(node.name)) && toolIds.has(publicId(node.name.text))) {
        const calls = [];
        const find = child => {
          if (ts.isCallExpression(child) && ts.isPropertyAccessExpression(child.expression) && child.expression.name.text === "A" && child.arguments[0] && ts.isNumericLiteral(child.arguments[0])) calls.push(child.arguments[0].text);
          ts.forEachChild(child, find);
        };
        find(node.initializer);
        if (calls.length === 1) branches.set(publicId(node.name.text), calls[0]);
      }
      ts.forEachChild(node, visit);
    };
    visit(file);
    modules.set(path, spans);
  }
  if (toolIds.size < 50) return {}; // Small fixtures/exports retain the complete core contract.
  if (branches.size !== toolIds.size || [...branches.values()].some(id => !bootstrap.has(id))) throw new Error(`Could not identify cold tool dependencies: ${[...toolIds].filter(id => !branches.has(id)).join(", ")}; unresolved bootstraps ${[...branches].filter(([, id]) => !bootstrap.has(id)).map(([tool]) => tool).join(", ")}`);
  const branchIds = new Set(branches.values());
  const safeReferences = new Map();
  for (const [path, source] of sources) {
    let text = source;
    for (const span of (modules.get(path) || []).filter(span => branchIds.has(span.id)).sort((a, b) => b.start - a.start)) text = text.slice(0, span.start) + text.slice(span.end);
    safeReferences.set(path, references(text));
  }
  const closure = initial => {
    const held = new Set(), queue = [...initial];
    while (queue.length) {
      const path = queue.pop();
      if (held.has(path)) continue;
      if (!existsSync(join(outDir, path))) throw new Error(`Missing offline dependency ${path}`);
      held.add(path);
      for (const child of safeReferences.get(path) || []) queue.push(child);
    }
    return [...held].map(path => `${prefix}${path}`).sort();
  };
  const htmlAssets = new Set();
  for (const url of [...(manifest.chromeByLocale.en || []), ...(manifest.toolsByLocale.en || [])]) {
    const html = readFileSync(join(outDir, local(url), "index.html"), "utf8");
    for (const match of html.matchAll(/(?:src|href)="([^"<>]+\.(?:js|css)(?:\?[^"<>]*)?)"/gu)) {
      const path = local(match[1].split("?")[0]);
      if (path.startsWith("/_next/static/")) htmlAssets.add(path);
    }
  }
  const baseline = closure(htmlAssets);
  const mathRuntime = manifest.core.filter(url => /\/vendor\/math\/|\/math-worker\.js$/u.test(url));
  const mathIds = new Set(["scientific-calculator", "function-grapher", "fraction-calculator", "equation-solver"]);
  const toolRuntime = Object.fromEntries([...branches].map(([id, branch]) => [id, [...new Set([...closure(bootstrap.get(branch)), ...(mathIds.has(id) ? mathRuntime : []), ...(id === "convert-hub" && existsSync(join(outDir, "vendor/documents/worker.js")) ? [`${prefix}/vendor/documents/worker.js`] : [])])].sort()]));
  const core = [...new Set([...baseline, ...manifest.core.filter(url => !/\/_next\/static\/|\/vendor\/math\/|\/math-worker\.js$/u.test(url))])].sort();
  return { core, runtime: core.filter(url => /\.(?:js|css|woff2?)$/u.test(url)), toolRuntime,
    engineGroups: { pdf: manifest.engines.filter(url => url.includes("/vendor/pdfjs/")), media: manifest.engines.filter(url => url.includes("/vendor/ffmpeg/")) } };
}
