import { test, expect } from "@playwright/test";

async function route(page: import("@playwright/test").Page, path: string) {
  await page.goto(`en/${path}`);
  await expect(page.locator("main")).toBeVisible();
}
test("search, client navigation, Back, and accessible help", async ({
  page,
}) => {
  await route(page, "");
  const search = page.locator("#kit-search");
  await search.fill("make PDF smaller");
  await page.locator('main a[href*="pdf-compress"]').click();
  await expect(page.locator('[data-tool="pdf-compress"]')).toBeVisible();
  await page.goBack();
  await expect(page.locator("#kit-search")).toBeVisible();
  await search.blur();
  await page.keyboard.press("?");
  const help = page.getByRole("dialog");
  await expect(help).toBeVisible();
  await page.keyboard.press("Tab");
  await expect
    .poll(() =>
      help.evaluate((element) => element.contains(document.activeElement)),
    )
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(help).toBeHidden();
});

test("graph edits survive navigation and reload; saved graph stays separate", async ({
  page,
}) => {
  await route(page, "tools/function-grapher/");
  const field = page.locator("math-field").first();
  await expect(field).toBeVisible();
  await field.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("x^2+2");
  await expect
    .poll(() =>
      field.evaluate(
        (element) => (element as HTMLElement & { value: string }).value,
      ),
    )
    .toContain("2");
  // Dispatch pagehide to exercise the same synchronous flush as a cold close.
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  const before = await page.evaluate(() =>
    localStorage.getItem("kit-math-draft-graph"),
  );
  expect(before).toContain("2");
  await route(page, "settings/");
  await page.goBack();
  await expect
    .poll(() =>
      field.evaluate(
        (element) => (element as HTMLElement & { value: string }).value,
      ),
    )
    .toContain("2");
  await page.reload();
  await expect(field).toBeVisible();
  await expect
    .poll(() =>
      field.evaluate(
        (element) => (element as HTMLElement & { value: string }).value,
      ),
    )
    .toContain("2");
  await page.getByText("Saved graphs", { exact: true }).click();
  await page.getByLabel("Graph name", { exact: true }).fill("Parabola");
  await page.getByRole("button", { name: "Save (0/20)", exact: true }).click();
  await expect(page.getByText("Parabola", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Start fresh", exact: true }).click();
  await expect
    .poll(() =>
      field.evaluate(
        (element) => (element as HTMLElement & { value: string }).value,
      ),
    )
    .toContain("sin");
  await page.getByRole("button", { name: "Use preset", exact: true }).click();
  await expect
    .poll(() =>
      field.evaluate(
        (element) => (element as HTMLElement & { value: string }).value,
      ),
    )
    .toContain("2");
});

test("image result download and local handoff preserve the output", async ({
  page,
}) => {
  await route(page, "tools/image-convert/");
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5ZkAAAAASUVORK5CYII=",
    "base64",
  );
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "sample.png", mimeType: "image/png", buffer: png });
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  const result = page.getByRole("region", { name: "Result", exact: true });
  await expect(result).toBeVisible();
  const download = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("sample.webp");
  await result
    .getByRole("button", { name: "Images → PDF", exact: true })
    .click();
  await expect(page.locator('[data-tool="images-to-pdf"]')).toBeVisible();
  await expect(page.getByText("sample.webp", { exact: true })).toBeVisible();
});

test("settings export is valid and diagnostic review excludes user input", async ({
  page,
}) => {
  await route(page, "settings/");
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export preferences", exact: true })
    .click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe("kit-preferences.json");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  const report = page.getByRole("textbox", {
    name: "Diagnostics",
    exact: true,
  });
  await expect(report).toBeVisible();
  const value = JSON.parse(await report.inputValue());
  expect(value.appVersion).toBeTruthy();
  expect(value).not.toHaveProperty("url");
  expect(value).not.toHaveProperty("inputs");
});
