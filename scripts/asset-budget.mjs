import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
export function measureRoute(root, route) {
  const html = readFileSync(resolve(root, route, "index.html"), "utf8");
  const assets = new Set(
    [...html.matchAll(/(?:src|href)="([^"<>]+\.(?:js|css)(?:\?[^"<>]*)?)"/g)]
      .map((match) => match[1])
      .filter((url) => url.includes("/_next/static/")),
  );
  let gzip = 0;
  for (const asset of assets) {
    const path = asset.slice(asset.indexOf("/_next/static/") + 1).split("?")[0];
    gzip += gzipSync(readFileSync(resolve(root, path))).length;
  }
  if (!assets.size) throw new Error(`No production assets found: ${route}`);
  return { gzip, assets: assets.size };
}
export function checkBudgets(root, budgets) {
  return Object.entries(budgets).map(([route, limit]) => {
    const measured = measureRoute(root, route);
    if (measured.gzip > limit)
      throw new Error(`${route}: ${measured.gzip} gzip bytes exceeds ${limit}`);
    return { route, ...measured, limit };
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const budgets = JSON.parse(
    readFileSync(
      new URL("../performance-budgets.json", import.meta.url),
      "utf8",
    ),
  );
  const result = checkBudgets(resolve("out"), budgets.routes);
  if (process.argv.includes("--record"))
    writeFileSync(
      "/tmp/kit-asset-measurements.json",
      JSON.stringify(result, null, 2),
    );
  console.log(JSON.stringify(result, null, 2));
  if (!existsSync("out/sw.js"))
    throw new Error("Run against the production export");
}
