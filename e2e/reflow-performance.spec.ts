import { test, expect } from "@playwright/test";

test("settings and help reflow with larger text in an RTL locale", async ({
  page,
}) => {
  await page.goto("ar/settings/");
  await page.addStyleTag({ content: "html { font-size: 20px !important; }" });
  await expect(page.locator("main")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(2);
  await page.keyboard.press("?");
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  await expect
    .poll(() =>
      modal.evaluate((element) => element.scrollWidth - element.clientWidth),
    )
    .toBeLessThanOrEqual(2);
  await page.keyboard.press("Escape");
  await expect(modal).toBeHidden();
});

test("eight curves settle and panning keeps the main thread responsive", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const expressions = [
      "\\sin(x)",
      "\\cos(x)",
      "x^2",
      "x^3",
      "\\sqrt{x}",
      "\\frac{1}{x}",
      "x",
      "x+2",
    ];
    localStorage.setItem(
      "kit-math-draft-graph",
      JSON.stringify({
        curves: expressions.map((latex, id) => ({
          id,
          name: ["f", "g", "h", "d", "p", "q", "r", "s"][id],
          color: "#2563eb",
          latex,
          hidden: false,
        })),
        view: { xMin: -10, xMax: 10, yMin: -7.5, yMax: 7.5 },
        parameters: { a: 1, b: 1, c: 1 },
        angle: "rad",
        grid: true,
      }),
    );
  });
  await page.goto("en/tools/function-grapher/");
  const graph = page.getByRole("application");
  await expect(graph.locator('path[stroke-width="2.5"]')).toHaveCount(8);
  const samples: number[] = [];
  const box = await graph.boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  for (let i = 0; i < 8; i++) {
    await page.mouse.move(
      box!.x + box!.width / 2 + i * 4,
      box!.y + box!.height / 2,
    );
    samples.push(
      await page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            const start = performance.now();
            requestAnimationFrame(() => resolve(performance.now() - start));
          }),
      ),
    );
  }
  await page.mouse.up();
  // A coarse regression guard for a blocked UI, not a real-device FPS claim.
  expect(Math.max(...samples)).toBeLessThan(1000);
  await expect(graph.locator('path[stroke-width="2.5"]')).toHaveCount(8);
  await test
    .info()
    .attach("frame-waits-ms", {
      body: JSON.stringify(samples),
      contentType: "application/json",
    });
});
