import { expect, test } from "@playwright/test";

test("default glass preserves mobile navigation and persists the shared transparency", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("en/settings/");
  const style = page.getByRole("button", { name: "Interface style: Liquid Glass", exact: true });
  const classic = page.getByRole("button", { name: "Interface style: Classic", exact: true });
  const menu = page.getByRole("menu", { name: "Interface style" });
  async function chooseClassic(touch = false) {
    if (touch) await style.tap();
    else await style.press("Enter");
    await expect(menu.getByRole("menuitemradio", { name: "Liquid Glass" })).toHaveAttribute("aria-checked", "true");
    const option = menu.getByRole("menuitemradio", { name: "Classic" });
    if (touch) await option.tap();
    else await option.press("Enter");
    await expect(classic).toHaveText("Classic");
    if (!touch) await expect(classic).toBeFocused();
  }
  const transparency = page.getByRole("slider", { name: "Glass transparency" });
  const stable = page.locator(".floating-nav-face:visible");
  const glass = page.locator(".kit-liquid-tab-bar:visible");
  const tab = (name: string) => glass.getByRole("link", { name, exact: true });
  await expect(glass).toHaveAttribute("data-ready", "");
  await expect(transparency).toHaveValue("50");
  await expect(transparency.locator("..")).toHaveClass(/lg-slider/);
  await expect(style).toHaveText("Liquid Glass");
  await expect(page.getByRole("heading", { name: "Interface style" })).toHaveCSS("user-select", "none");

  const haptics = page.getByRole("radiogroup", { name: "Haptic feedback" });
  await expect(haptics).toHaveClass(/lg-segmented/);
  const selected = haptics.locator('[role="radio"][aria-checked="true"]');
  await selected.press("End");
  await expect(haptics.getByRole("radio", { name: "Off", exact: true })).toHaveAttribute("aria-checked", "true");

  await chooseClassic();
  await expect(transparency).toHaveCount(0);
  await expect(stable).toBeVisible();
  const originalSize = (await stable.boundingBox())!;
  await page.reload();
  await expect(classic).toHaveText("Classic");
  await expect(page.getByRole("combobox", { name: "Interface style", exact: true })).toHaveCount(0);
  await expect(haptics).not.toHaveClass(/lg-segmented/);

  await classic.press("Enter");
  await expect(menu.getByRole("menuitemradio", { name: "Classic" })).toHaveAttribute("aria-checked", "true");
  await menu.getByRole("menuitemradio", { name: "Liquid Glass" }).press("Enter");
  await expect(style).toBeFocused();
  await expect(glass).toHaveAttribute("data-ready", "");
  const glassSize = (await glass.boundingBox())!;
  expect(Math.abs(glassSize.width - originalSize.width)).toBeLessThan(2);
  expect(Math.abs(glassSize.height - originalSize.height)).toBeLessThan(2);
  for (const name of ["Home", "Favorites", "History", "Settings"]) {
    expect(Math.abs((await tab(name).boundingBox())!.width - glassSize.width / 4)).toBeLessThan(6);
  }

  await transparency.press("ArrowRight");
  await expect(transparency).toHaveAttribute("aria-valuetext", "51%");
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
  await chooseClassic(test.info().project.use.hasTouch);
  await expect(transparency).toHaveCount(0);
  await expect(stable).toBeVisible();
});

test("glass history alert protects destructive actions and leaves tool text editable", async ({ page }) => {
  await page.goto("en/settings/");
  const clear = page.locator(".kit-liquid-history > button");
  await expect(clear).toHaveClass(/lg-button/);
  await page.evaluate(() => {
    localStorage.setItem("kit-history", JSON.stringify({
      version: 2,
      state: {
        enabled: true,
        entries: [{ id: "example", timestamp: Date.now(), toolId: "image-convert", summary: "completed", status: "success" }],
      },
    }));
  });
  await page.reload();
  const count = () => page.evaluate(() => JSON.parse(localStorage.getItem("kit-history")!).state.entries.length);
  await clear.click();
  const alert = page.getByRole("alertdialog", { name: "Clear history" });
  await expect(alert).toBeVisible();
  const cancel = alert.getByRole("button", { name: "Cancel" });
  await expect(cancel).toBeFocused();
  await cancel.press("Escape");
  await expect(alert).toBeHidden();
  await expect(clear).toBeFocused();
  expect(await count()).toBe(1);

  await clear.click();
  const confirm = alert.getByRole("button", { name: "Clear history" });
  if (test.info().project.use.hasTouch) await confirm.tap();
  else await confirm.click();
  await expect(alert).toBeHidden();
  expect(await count()).toBe(0);

  await page.goto("en/tools/text-diff/");
  const inputs = page.locator("[data-tool]:visible textarea");
  await expect(inputs.first()).toHaveCSS("user-select", "text");
  await inputs.first().fill("old text");
  await inputs.last().fill("new text");
  await page.getByRole("button", { name: "Compare", exact: true }).click();
  const result = page.locator("[data-tool]:visible pre");
  await expect(result).toContainText("new text");
  await expect(result).toHaveCSS("user-select", "text");
});
