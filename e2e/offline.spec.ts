import { test, expect, type Page } from "@playwright/test";

async function generation(page: Page): Promise<string | null> {
  return page.evaluate(
    () =>
      new Promise<string | null>((resolve) => {
        const worker = navigator.serviceWorker.controller;
        const finish = (value: string | null) => {
          clearTimeout(timer);
          navigator.serviceWorker.removeEventListener("message", message);
          resolve(value);
        };
        const message = (event: MessageEvent) => {
          if (event.source === worker && event.data?.type === "OFFLINE_STATE")
            finish(event.data.state?.generation ?? null);
        };
        const timer = setTimeout(() => finish(null), 3000);
        navigator.serviceWorker.addEventListener("message", message);
        worker?.postMessage({ type: "OFFLINE_STATUS" });
      }),
  );
}

test("cold saved math tools work offline, including after an interrupted update", async ({
  page,
  context,
  request,
}) => {
  test.setTimeout(180000);
  await request.post("http://127.0.0.1:4173/__test__/release?next=0");
  await page.goto("en/settings/offline/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await page
    .getByRole("button", { name: "Customize downloads", exact: true })
    .click();
  const tools = page
    .locator("section[data-offline-picker]")
    .filter({ has: page.getByRole("heading", { name: "Tools", exact: true }) });
  await tools.getByRole("button", { name: "Clear", exact: true }).click();
  await tools.getByRole("button", { name: "Math (4)", exact: true }).click();
  await tools.getByLabel("Scientific calculator", { exact: true }).check();
  await tools.getByLabel("Equation solver", { exact: true }).check();
  await page
    .getByLabel("Include large media engines", { exact: false })
    .uncheck();
  await page.getByRole("button", { name: "Download", exact: true }).click();
  await expect(
    page.getByText("Offline access is ready", { exact: true }),
  ).toBeVisible({ timeout: 90000 });
  await expect(
    page.getByText("Ready for offline", { exact: true }),
  ).toBeVisible();
  const originalGeneration = await generation(page);
  expect(originalGeneration).toBeTruthy();
  await context.setOffline(true);
  await page.goto("en/tools/equation-solver/");
  await expect(page.locator('[data-tool="equation-solver"]')).toBeVisible();
  await page.getByRole("button", { name: "Solve", exact: true }).click();
  await expect(page.getByText("Solutions", { exact: true })).toBeVisible();
  await context.setOffline(false);
  await page.goto("en/settings/");
  await request.post("http://127.0.0.1:4173/__test__/release?next=1");
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.getRegistration())?.update();
  });
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          !!(await navigator.serviceWorker.getRegistration())?.waiting,
      ),
    )
    .toBe(true);
  // Checking for an update must never silently activate it.
  await page
    .getByRole("button", { name: "Check for updates", exact: true })
    .click();
  await expect(
    page.getByText("A Kit update is ready.", { exact: true }).first(),
  ).toBeVisible();
  await context.setOffline(true);
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Try again", exact: true }).first(),
  ).toBeVisible({ timeout: 60000 });
  await page.goto("en/tools/scientific-calculator/");
  await expect(
    page.locator('[data-tool="scientific-calculator"]'),
  ).toBeVisible();
  await context.setOffline(false);
  await page.goto("en/settings/offline/");
  await page
    .getByRole("button", { name: "Update downloads", exact: true })
    .click();
  await expect(
    page.getByText("Ready for offline", { exact: true }),
  ).toBeVisible({ timeout: 90000 });
  await expect
    .poll(() => generation(page), { timeout: 90000 })
    .not.toBe(originalGeneration);
  await context.setOffline(true);
  await page.goto("en/tools/equation-solver/");
  await expect(page.locator('[data-tool="equation-solver"]')).toBeVisible();
});
