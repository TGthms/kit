import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, extname, sep } from "node:path";
const root = resolve("out");
const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};
let release = 0;
let blocked = false;
let blockedRequests = 0;
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    const path = decodeURIComponent(url.pathname);
    if (
      process.env.KIT_E2E_SERVER === "1" &&
      path === "/__test__/release" &&
      request.method === "POST"
    ) {
      release = url.searchParams.get("next") === "1" ? 1 : 0;
      blocked = url.searchParams.get("blocked") === "1";
      blockedRequests = 0;
      response.writeHead(200).end();
      return;
    }
    if (process.env.KIT_E2E_SERVER === "1" && path === "/__test__/state") {
      response
        .writeHead(200, { "content-type": "application/json" })
        .end(JSON.stringify({ blockedRequests }));
      return;
    }
    if (base && path !== base && !path.startsWith(`${base}/`)) {
      response.writeHead(404).end();
      return;
    }
    let target = resolve(root, `.${base ? path.slice(base.length) : path}`);
    if (target !== root && !target.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    if ((await stat(target)).isDirectory())
      target = resolve(target, "index.html");
    let body = await readFile(target);
    if (process.env.KIT_E2E_SERVER === "1" && release) {
      const changedPath = `${base}/en/tools/scientific-calculator/`;
      const changedTarget = resolve(
        root,
        "en/tools/scientific-calculator/index.html",
      );
      const changedBody = Buffer.concat([
        Buffer.from("<!-- browser test release -->"),
        await readFile(changedTarget),
      ]);
      if (target === changedTarget) {
        if (blocked) {
          blockedRequests++;
          response.writeHead(503).end("Interrupted test release");
          return;
        }
        body = changedBody;
      }
      if (
        ["sw.js", "sw-precache.json"].some(
          (name) => target === resolve(root, name),
        )
      ) {
        const original = JSON.parse(
          await readFile(resolve(root, "sw-precache.json"), "utf8"),
        );
        const generation = createHash("sha256")
          .update(`${original.generation}:browser-release`)
          .digest("hex")
          .slice(0, 12);
        body = Buffer.from(
          target.endsWith(".json")
            ? JSON.stringify({
                ...original,
                generation,
                integrity: {
                  ...original.integrity,
                  [changedPath]: createHash("sha256")
                    .update(changedBody)
                    .digest("hex"),
                },
              })
            : body
                .toString()
                .replace(
                  `const BUILD = "${original.generation}";`,
                  `const BUILD = "${generation}";`,
                ),
        );
      }
    }
    response.writeHead(200, {
      "content-type": types[extname(target)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404).end();
  }
});
server.listen(Number(process.env.PORT ?? 4173), "127.0.0.1");
