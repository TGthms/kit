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
  // Kit intentionally does not claim open documents. A fresh navigation,
  // matching the next installed-app launch, attaches the activated worker.
  await page.reload();
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
  // Fail a genuinely changed saved document *during* worker installation.
  // Kit stages saved selections before a worker becomes waiting/available.
  await request.post("http://127.0.0.1:4173/__test__/release?next=1&blocked=1");
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.getRegistration())
      ?.update()
      .catch(() => undefined);
  });
  await expect
    .poll(
      async () =>
        (
          await (
            await request.get("http://127.0.0.1:4173/__test__/state")
          ).json()
        ).blockedRequests,
      { timeout: 60000 },
    )
    .toBeGreaterThan(0);
  await expect
    .poll(
      () =>
        page.evaluate(
          async () =>
            !!(await navigator.serviceWorker.getRegistration())?.installing,
        ),
      { timeout: 60000 },
    )
    .toBe(false);
  expect(await generation(page)).toBe(originalGeneration);
  await context.setOffline(true);
  await page.goto("en/tools/scientific-calculator/");
  await expect(
    page.locator('[data-tool="scientific-calculator"]'),
  ).toBeVisible();
  await context.setOffline(false);
  await page.goto("en/settings/");
  await request.post("http://127.0.0.1:4173/__test__/release?next=1&blocked=0");
  await page
    .getByRole("button", { name: "Check for updates", exact: true })
    .click();
  await expect
    .poll(
      () =>
        page.evaluate(
          async () =>
            !!(await navigator.serviceWorker.getRegistration())?.waiting,
        ),
      { timeout: 60000 },
    )
    .toBe(true);
  // A prepared update stays explicit and can apply from its verified cache.
  expect(await generation(page)).toBe(originalGeneration);
  await context.setOffline(true);
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect
    .poll(
      async () => {
        const current = await generation(page);
        return !!current && current !== originalGeneration;
      },
      { timeout: 90000 },
    )
    .toBe(true);
  await page.goto("en/tools/equation-solver/");
  await expect(page.locator('[data-tool="equation-solver"]')).toBeVisible();
});
