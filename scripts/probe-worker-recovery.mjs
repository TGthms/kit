/** Short, synthetic reproduction using Kit's unmodified worker source. Runs in
 * CI only: no Next build, personal files, persistent user profile or telemetry. */
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { resolve } from "node:path";
const require = createRequire(resolve(process.env.KIT_PROBE_PACKAGE_ROOT, "package.json"));
const { chromium, webkit } = require("@playwright/test");
const browserName = process.env.KIT_PROBE_BROWSER || "webkit";
const browser = await ({ chromium, webkit })[browserName].launch();
const source = readFileSync("public/sw.js", "utf8");
const sha = (body) => createHash("sha256").update(body).digest("hex");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(fn, predicate, timeout = 15000) {
  const start = Date.now(); let value;
  do { value = await fn(); if (predicate(value)) return value; await sleep(50); } while (Date.now() - start < timeout);
  throw new Error(`Timed out: ${JSON.stringify(value)}`);
}
async function run(size, interrupted) {
  const count = size === "large" ? 300 : 3;
  const script = "/_next/static/probe-0.js";
  const html = `<!doctype html><meta charset="utf-8"><title>Synthetic Kit probe</title><h1>Kit probe</h1><script src="${script}"></script>`;
  const files = new Map([["/", [html, "text/html"]]]);
  for (const page of ["/en/", "/en/settings/", "/en/settings/offline/", "/en/tools/pdf-merge/"]) {
    files.set(page, [html, "text/html"]); files.set(`${page}index.txt`, ["synthetic flight", "text/plain"]);
  }
  for (let i = 0; i < count; i++) files.set(`/_next/static/probe-${i}.js`, [`void 0;/*${String(i).padEnd(40000, "x")}*/`, "text/javascript"]);
  const selected = { locales: ["en"], tools: ["pdf-merge"], pages: ["home", "settings", "offline"], engines: false };
  let release = 1, blocked = false, blockedRequests = 0;
  function manifest() {
    const bodies = [...files].map(([path, [body]]) => [path, path === "/en/tools/pdf-merge/" && release === 2 ? `<!-- new release -->${body}` : body]);
    return { generation: (release === 1 ? "a" : "b").repeat(12), version: `probe-${release}`, core: ["/", ...[...files.keys()].filter((path) => path.endsWith(".js"))], engines: [],
      chromeByLocale: { en: ["/en/", "/en/settings/", "/en/settings/offline/"] },
      toolsByLocale: { en: ["/en/tools/pdf-merge/"] },
      rscByLocale: { en: [...files.keys()].filter((path) => path.endsWith(".txt")) },
      pagesByLocale: { en: { home: ["/en/"], settings: ["/en/settings/"], offline: ["/en/settings/offline/"] } }, extrasByLocale: {},
      integrity: Object.fromEntries(bodies.map(([path, body]) => [path, sha(body)])) };
  }
  const server = createServer((request, response) => {
    const path = new URL(request.url, "http://localhost").pathname;
    response.setHeader("Cache-Control", "no-store");
    if (path === "/sw.js") { response.writeHead(200, { "Content-Type": "text/javascript" }).end(source.replace("__KIT_BUILD__", (release === 1 ? "a" : "b").repeat(12))); return; }
    if (path === "/sw-precache.json") { response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(manifest())); return; }
    const file = files.get(path);
    if (!file) { response.writeHead(404).end(); return; }
    if (release === 2 && path === "/en/tools/pdf-merge/" && blocked) { blockedRequests++; response.writeHead(503).end("Synthetic interrupted release"); return; }
    const body = release === 2 && path === "/en/tools/pdf-merge/" ? `<!-- new release -->${file[0]}` : file[0];
    response.writeHead(200, { "Content-Type": file[1] }); response.end(request.method === "HEAD" ? undefined : body);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const result = { browser: browserName, size, interrupted, passed: false };
  try {
    await page.goto(`${origin}/en/`);
    await page.evaluate(async () => {
      window.probeErrors = []; window.probeMessages = [];
      navigator.serviceWorker.addEventListener("message", (event) => { window.probeMessages.push(event.data); if (event.data?.type === "OFFLINE_INSTALL_ERROR") window.probeErrors.push(event.data.error); });
      await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }); await navigator.serviceWorker.ready;
    });
    await page.reload();
    await until(() => page.evaluate(() => !!navigator.serviceWorker.controller), Boolean);
    const initial = await page.evaluate(async (selection) => {
      return new Promise((resolve, reject) => {
        const worker = navigator.serviceWorker.controller;
        const timer = setTimeout(() => { navigator.serviceWorker.removeEventListener("message", handler); reject(new Error("Download timed out")); }, 30000);
        const handler = (event) => {
          if (event.source !== worker || event.data?.type !== "OFFLINE_PROGRESS" || event.data.requestId !== "initial") return;
          if (["complete", "error", "canceled"].includes(event.data.status)) { clearTimeout(timer); navigator.serviceWorker.removeEventListener("message", handler); resolve(event.data); }
        };
        navigator.serviceWorker.addEventListener("message", handler);
        worker.postMessage({ type: "OFFLINE_DOWNLOAD", requestId: "initial", ...selection });
      });
    }, selected);
    if (initial.status !== "complete") throw new Error(`Initial download: ${JSON.stringify(initial)}`);
    await page.evaluate(() => {
      window.probeErrors = [];
      navigator.serviceWorker.addEventListener("message", (event) => { if (event.data?.type === "OFFLINE_INSTALL_ERROR") window.probeErrors.push(event.data.error); });
    });
    release = 2;
    if (interrupted) {
      blocked = true;
      await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration()).update().catch(() => {}); });
      await until(async () => blockedRequests, (value) => value > 0);
      await until(() => page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()).installing), (value) => !value);
      blocked = false;
    }
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration()).update(); });
    await until(() => page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return { waiting: !!registration.waiting, installing: registration.installing?.state ?? null, errors: window.probeErrors };
    }), (value) => value.waiting, 20000);
    result.passed = true;
  } catch (error) { result.error = error.message; }
  finally {
    result.caches = await page.evaluate(async () => Promise.all((await caches.keys()).map(async (name) => {
      const cache = await caches.open(name); const keys = await cache.keys();
      const first = keys[0] && await cache.match(keys[0]);
      return { name, count: keys.length, first: keys[0]?.url, writer: first?.headers.get("X-Kit-Cached-By") };
    }))).catch((error) => [{ error: error.message }]);
    result.errors = await page.evaluate(() => window.probeErrors).catch(() => []);
    await context.close(); await new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); });
  }
  console.log(JSON.stringify(result)); return result;
}
const results = [];
try { for (const size of ["small", "large"]) for (const interrupted of [false, true]) results.push(await run(size, interrupted)); }
finally { await browser.close(); }
writeFileSync("worker-probe-results.json", JSON.stringify({ version: require("@playwright/test/package.json").version, results }, null, 2));
if (results.some((result) => !result.passed)) process.exitCode = 1;
