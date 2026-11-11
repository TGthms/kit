import { test, expect } from "@playwright/test";
import { PDFDocument } from "@cantoo/pdf-lib";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

async function chooseFile(page: import("@playwright/test").Page, name: string, mimeType: string, buffer: Buffer) {
  await expect(page.locator('input[type="file"]').first()).toBeEnabled();
  await page.locator('input[type="file"]').first().setInputFiles({ name, mimeType, buffer });
}

test("PDF compression retains page dimensions and refuses partial documents", async ({ page }) => {
  await page.goto("en/tools/pdf-compress/");
  const input = await PDFDocument.create();
  input.addPage([100, 200]);
  await chooseFile(page, "small.pdf", "application/pdf", Buffer.from(await input.save()));
  await page.getByRole("button", { name: "Shrink", exact: true }).click();
  const result = page.getByRole("region", { name: "Result", exact: true });
  await expect(result).toBeVisible();
  const downloading = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloading;
  const output = await PDFDocument.load(await readFile((await download.path())!));
  expect(output.getPageCount()).toBe(1);
  expect(output.getPages()[0].getSize()).toEqual({ width: 100, height: 200 });
  for (let i = 1; i < 201; i++) input.addPage([100, 200]);
  await chooseFile(page, "long.pdf", "application/pdf", Buffer.from(await input.save()));
  await page.getByRole("button", { name: "Shrink", exact: true }).click();
  await expect(page.locator('main [role="alert"]')).toContainText("complete PDFs up to 200 pages");
  await expect(result).toHaveCount(0);
});

test("media engine produces a reusable, playable-format result", async ({ page }) => {
  await page.goto("en/tools/audio-convert/");
  const samples = 4410;
  const wav = Buffer.alloc(44 + samples * 2);
  wav.write("RIFF", 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(44100, 24); wav.writeUInt32LE(88200, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write("data", 36); wav.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) wav.writeInt16LE(Math.round(Math.sin(i * Math.PI * 880 / 44100) * 8000), 44 + i * 2);
  await chooseFile(page, "tone.wav", "audio/wav", wav);
  await page.locator('[data-tool="audio-convert"]').getByRole("button", { name: "Convert", exact: true }).click();
  const result = page.getByRole("region", { name: "Result", exact: true });
  await expect(result).toBeVisible({ timeout: 45000 });
  const downloading = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe("tone-converted.mp3");
  const output = await readFile((await download.path())!);
  expect(output.length).toBeGreaterThan(100);
  expect(output.subarray(0, 3).toString() === "ID3" || output[0] === 0xff).toBe(true);
});

test("document worker and formatting keep original inputs intact", async ({ page }) => {
  await page.goto("en/tools/convert-hub/");
  await page.getByRole("textbox", { name: "Input", exact: true }).fill('{"hello":"kit"}');
  await page.locator("main").getByRole("combobox").selectOption("yaml");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  const result = page.getByRole("region", { name: "Result", exact: true });
  await expect(result).toContainText("converted.yaml");
  await expect(page.getByRole("textbox", { name: "Input", exact: true })).toHaveValue('{"hello":"kit"}');
  await page.goto("en/tools/json-format/");
  const input = page.getByRole("textbox", { name: "Input", exact: true });
  await input.fill('{"id":9007199254740993}');
  await page.getByRole("button", { name: "Pretty-print", exact: true }).click();
  await expect(page.locator('main [role="alert"]')).toContainText("lose precision");
  await expect(input).toHaveValue('{"id":9007199254740993}');
});

test("representative workspaces and the saved-graph dialog pass accessibility checks", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    localStorage.setItem("kit-appearance", JSON.stringify({ state: { nightAppearance: false } }));
    localStorage.setItem("kit-theme-context", JSON.stringify({ choice: "system", system: "light" }));
  });
  for (const scheme of ["light", "dark"] as const) {
  await page.emulateMedia({ colorScheme: scheme });
  for (const route of ["en/", "en/settings/", "en/tools/image-resize/", "en/tools/json-format/", "ar/settings/"]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    const report = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(report.violations.map(issue => ({ id: issue.id, nodes: issue.nodes.map(node => node.target) }))).toEqual([]);
  }
  }
  await page.goto("en/tools/function-grapher/");
  await page.getByRole("button", { name: "Saved graphs", exact: true }).click();
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  const report = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(report.violations.map(issue => ({ id: issue.id, nodes: issue.nodes.map(node => node.target) }))).toEqual([]);
});

test("graph files import into the library before replacing the active workspace", async ({ page }) => {
  await page.goto("en/tools/function-grapher/");
  const field = page.locator("math-field").first();
  await expect(field).toBeVisible();
  const original = await field.evaluate(element => (element as HTMLElement & { value: string }).value);
  await page.getByRole("button", { name: "Saved graphs", exact: true }).click();
  const modal = page.getByRole("dialog");
  await modal.getByLabel("Graph name", { exact: true }).fill("Portable");
  const downloading = page.waitForEvent("download");
  await modal.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloading;
  const portable = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(portable.kind).toBe("kit-graph");
  expect(portable.name).toBe("Portable");
  portable.document.curves[0].latex = "x^2";
  await modal.locator('input[type="file"]').setInputFiles({ name: "portable.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(portable)) });
  await expect(modal.getByText("Portable", { exact: true })).toBeVisible();
  expect(await field.evaluate(element => (element as HTMLElement & { value: string }).value)).toBe(original);
  await modal.getByRole("button", { name: "Use preset", exact: true }).click();
  await expect(modal).toBeHidden();
  await expect.poll(() => field.evaluate(element => (element as HTMLElement & { value: string }).value)).toBe("x^2");
});

test.describe("appearance policy", () => {
  test.use({ timezoneId: "America/Los_Angeles" });
  test("night mode is enabled by default and can be disabled independently", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-11-12T07:00:00Z") });
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(() => {
      localStorage.setItem("kit-theme-context", JSON.stringify({ choice: "light", system: "light" }));
      localStorage.setItem("theme", "light");
    });
    await page.goto("en/settings/");
    const night = page.getByRole("switch", { name: "Night appearance", exact: true });
    await expect(night).toBeChecked();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await night.click();
    await expect(night).not.toBeChecked();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await page.getByRole("radio", { name: "Match system", exact: true }).click();
    await expect(page.getByRole("radio", { name: "Match system", exact: true })).toBeChecked();
    await night.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

test("a small offline collection includes its cold parser and PDF engine without unrelated engines", async ({ page, context, request }) => {
  test.setTimeout(180000);
  await request.post("http://127.0.0.1:4173/__test__/release?next=0");
  await page.goto("en/settings/offline/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const summary = await page.evaluate(async () => {
    const worker = navigator.serviceWorker.controller!;
    await new Promise<void>((resolve, reject) => {
      const requestId = crypto.randomUUID();
      const timer = setTimeout(() => { cleanup(); reject(new Error("Download timed out")); }, 90000);
      const cleanup = () => { clearTimeout(timer); navigator.serviceWorker.removeEventListener("message", message); };
      const message = (event: MessageEvent) => {
        if (event.source !== worker || event.data?.type !== "OFFLINE_PROGRESS" || event.data.requestId !== requestId) return;
        if (event.data.status === "complete") { cleanup(); resolve(); }
        else if (["error", "canceled"].includes(event.data.status)) { cleanup(); reject(new Error(JSON.stringify(event.data))); }
      };
      navigator.serviceWorker.addEventListener("message", message);
      worker.postMessage({ type: "OFFLINE_DOWNLOAD", requestId, locales: ["en"], tools: ["convert-hub", "pdf-compress"], pages: ["home", "settings", "offline"], engines: true });
    });
    const paths: string[] = [];
    for (const name of await caches.keys()) for (const key of await (await caches.open(name)).keys()) paths.push(new URL(key.url).pathname);
    return { documentWorker: paths.some(path => path.endsWith("/vendor/documents/worker.js")), pdf: paths.some(path => path.endsWith("/vendor/pdfjs/pdf.worker.min.mjs")), media: paths.some(path => path.endsWith("/vendor/ffmpeg/ffmpeg-core.wasm.gz")), math: paths.some(path => path.endsWith("/vendor/math/compute-engine.js")) };
  });
  expect(summary).toEqual({ documentWorker: true, pdf: true, media: false, math: false });
  await context.setOffline(true);
  await page.goto("en/tools/convert-hub/");
  await page.getByRole("textbox", { name: "Input", exact: true }).fill('{"offline":true}');
  await page.locator("main").getByRole("combobox").selectOption("yaml");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(page.getByRole("region", { name: "Result", exact: true })).toContainText("converted.yaml");
  await page.goto("en/tools/pdf-compress/");
  const doc = await PDFDocument.create(); doc.addPage([100, 200]);
  await chooseFile(page, "cold.pdf", "application/pdf", Buffer.from(await doc.save()));
  await page.getByRole("button", { name: "Shrink", exact: true }).click();
  await expect(page.getByRole("region", { name: "Result", exact: true })).toContainText("cold-compressed.pdf");
});
