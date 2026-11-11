import { readFileSync } from "node:fs";
import vm from "node:vm";
import { expect, it } from "vitest";

function protocol() {
  const source = readFileSync("public/sw.js", "utf8");
  return vm.runInNewContext(source + "\n({ selectedOfflineUrls, selectedEngineUrls })", { URL, self: { location: { origin: "https://kit.test" }, registration: { scope: "https://kit.test/" }, addEventListener() {} } });
}
it("downloads only a selected tool's code and the required engine family", async () => {
  const worker = protocol();
  const manifest = { core: ["/app.js"], engines: ["/pdf.js", "/media.wasm"], engineGroups: { pdf: ["/pdf.js"], media: ["/media.wasm"] },
    toolRuntime: { "pdf-merge": ["/merge.js"], "function-grapher": ["/math-worker.js", "/math.js"] },
    toolsByLocale: { en: ["/en/tools/pdf-merge/", "/en/tools/function-grapher/"] }, pagesByLocale: { en: {} } };
  const pdf = await worker.selectedOfflineUrls({ locales: ["en"], tools: ["pdf-merge"], pages: [], engines: true }, manifest);
  expect(pdf).toEqual(expect.arrayContaining(["/app.js", "/merge.js", "/pdf.js", "/en/tools/pdf-merge/", "/en/tools/pdf-merge/index.txt"]));
  expect(pdf).not.toContain("/media.wasm");
  expect(pdf).not.toContain("/math.js");
  const graph = await worker.selectedOfflineUrls({ locales: ["en"], tools: ["function-grapher"], pages: [], engines: false }, manifest);
  expect(graph).toContain("/math-worker.js");
  expect(graph).not.toContain("/pdf.js");
  expect(graph).not.toContain("/merge.js");
});
it("preserves older manifests' complete engine contract during upgrades", () => {
  expect(protocol().selectedEngineUrls({ engines: true, tools: ["pdf-merge"] }, { engines: ["/engine"] })).toEqual(["/engine"]);
});
