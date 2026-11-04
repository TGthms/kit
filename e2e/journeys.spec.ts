import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

async function route(page: import("@playwright/test").Page, path: string) {
  await page.goto(`en/${path}`);
  await expect(page.locator("main")).toBeVisible();
}
test("search, client navigation, Back, and accessible help", async ({
  page,
}) => {
  await route(page, "");
  const search = page.locator("#kit-search:visible");
  await search.fill("make PDF smaller");
  await page.evaluate(() => {
    (window as Window & { kitNavigationProbe?: boolean }).kitNavigationProbe =
      true;
  });
  await page.locator('main a[href*="pdf-compress"]').click();
  await expect(page.locator('[data-tool="pdf-compress"]:visible')).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as Window & { kitNavigationProbe?: boolean })
          .kitNavigationProbe,
    ),
  ).toBe(true);
  await page.goBack();
  await expect(page.locator("#kit-search:visible")).toBeVisible();
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
  // The host is contenteditable too, but MathLive receives native keyboard
  // events through its accessible shadow textbox. Target that actual editor.
  const editor = field.getByRole("textbox");
  await expect(editor).toBeFocused();
  await editor.press("ControlOrMeta+A");
  await editor.pressSequentially("x^2+2");
  await expect
    .poll(() =>
      field.evaluate(
        (element) => (element as HTMLElement & { value: string }).value,
      ),
    )
    .toContain("2");
  const expression = await field.evaluate(
    (element) => (element as HTMLElement & { value: string }).value,
  );
  expect(expression).not.toContain("sin");
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
    .toBe(expression);
  await page.reload();
  await expect(field).toBeVisible();
  await expect
    .poll(() =>
      field.evaluate(
        (element) => (element as HTMLElement & { value: string }).value,
      ),
    )
    .toBe(expression);
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
    .toBe(expression);
});

test("image result download and local handoff preserve the output", async ({
  page,
}) => {
  await route(page, "tools/image-convert/");
  const png = readFileSync("public/icons/icon-192.png");
  await expect(page.locator('input[type="file"]')).toBeEnabled();
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "sample.png", mimeType: "image/png", buffer: png });
  await page.locator('[data-tool="image-convert"]:visible').getByRole("combobox").selectOption("image/jpeg");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  const result = page.getByRole("region", { name: "Result", exact: true });
  await expect(result).toBeVisible();
  const download = page.waitForEvent("download");
  await result.getByRole("button", { name: "Download", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("sample.jpg");
  await result
    .getByRole("button", { name: "Images → PDF", exact: true })
    .click();
  await expect(page.locator('[data-tool="images-to-pdf"]:visible')).toBeVisible();
  await expect(page.getByText("1. sample.jpg", { exact: true })).toBeVisible();
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
