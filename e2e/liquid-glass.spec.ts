import { expect, test } from "@playwright/test";

test("experimental glass preserves mobile navigation and persists the shared transparency", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("en/settings/");
  const toggle = page.getByRole("switch", { name: "Liquid Glass", exact: true });
  const transparency = page.getByRole("slider", { name: "Glass transparency" });
  const stable = page.locator(".floating-nav-face:visible");
  const glass = page.locator(".kit-liquid-tab-bar:visible");
  const tab = (name: string) => glass.getByRole("link", { name, exact: true });
  await expect(stable).toBeVisible();
  await expect(transparency).toHaveCount(0);
  await expect(page.locator("#liquidglass-styles")).toHaveCount(0);
  const originalSize = (await stable.boundingBox())!;

  await toggle.click();
  await expect(glass).toHaveAttribute("data-ready", "");
  await expect(transparency).toHaveValue("50");
  const glassSize = (await glass.boundingBox())!;
  expect(Math.abs(glassSize.width - originalSize.width)).toBeLessThan(2);
  expect(Math.abs(glassSize.height - originalSize.height)).toBeLessThan(2);
  for (const name of ["Home", "Favorites", "History", "Settings"]) {
    expect(Math.abs((await tab(name).boundingBox())!.width - glassSize.width / 4)).toBeLessThan(6);
  }

  await transparency.press("ArrowRight");
  await expect(glass.locator(".lg-tab-bar-glass")).toHaveCSS("--lg-transparency", "0.51");
  const greetings = page.getByRole("switch", { name: "Date-specific greetings" });
  await expect(greetings).toHaveClass(/lg-switch/);
  await expect(greetings.locator(".lg-switch-thumb")).toHaveCSS("--lg-transparency", "0.51");
  const checked = await greetings.getAttribute("aria-checked");
  await greetings.click();
  await expect(greetings).toHaveAttribute("aria-checked", checked === "true" ? "false" : "true");

  // A native tap generates the SDK's synthetic click and a subsequent browser
  // click. Kit's document capture listeners must see only one valid route intent.
  await page.evaluate(() => {
    document.addEventListener("click", (event) => {
      if (!event.defaultPrevented && event.target instanceof Element && event.target.closest(".lg-tab")) {
        document.documentElement.dataset.glassClicks = String(Number(document.documentElement.dataset.glassClicks ?? 0) + 1);
      }
    }, true);
  });
  if (test.info().project.use.hasTouch) await tab("Favorites").tap();
  else await tab("Favorites").click();
  await expect(page).toHaveURL(/\/en\/favorites\/$/);
  await expect(page.locator("html")).toHaveAttribute("data-glass-clicks", "1");
  await page.goBack();
  await expect(tab("Settings")).toHaveAttribute("aria-current", "page");
  await expect(transparency).toHaveValue("51");

  const from = (await tab("Settings").boundingBox())!;
  const to = (await tab("Home").boundingBox())!;
  await transparency.press("ArrowRight");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  // A refit is due 200 ms after the setting changes. A held gesture must
  // survive that deadline before it continues to the release destination.
  await page.waitForTimeout(250);
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(tab("Home")).toHaveAttribute("aria-current", "page");

  await page.goto("en/tools/image-compress/");
  const quality = page.getByRole("slider", { name: "Quality", exact: true });
  await expect(quality).toHaveAttribute("type", "range");
  await expect(quality.locator("..").locator(".lg-slider-thumb")).toHaveCSS("--lg-transparency", "0.52");
  await quality.focus();
  const before = Number(await quality.inputValue());
  await quality.press("ArrowLeft");
  expect(Number(await quality.inputValue())).toBeLessThan(before);

  // Reload the settings as a controlled document before going offline.
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.goto("en/settings/");
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(transparency).toHaveValue("52");
  await expect(glass).toHaveAttribute("data-ready", "");
  if (test.info().project.use.hasTouch) await tab("Favorites").tap();
  else await tab("Favorites").click();
  await expect(page).toHaveURL(/\/en\/favorites\/$/);
  await page.goBack();
  await expect(transparency).toHaveValue("52");
  await toggle.click();
  await expect(transparency).toHaveCount(0);
  await expect(stable).toBeVisible();
});
