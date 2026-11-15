import { test, expect } from "./fixtures";
import { objectScenes } from "../src/objects/scene-list";
test.describe.configure({ mode: "parallel" });
// Canvas snapshots and video recording perturb the timings being measured.
const timingTest = test.extend({ trace: "off", video: "off" });
// The renders: every built subject in ink line art, both themes, both widths, within budget.
const built = ["ai", "contact", "tennis", "trading", "server", "travel", "reading"] as const;
const MAX_DRAW_CALLS = 100;
const MAX_TRIANGLES = 100_000;
/** Fill, silhouette and line programs, with and without instancing, the print and the shadow. */
const MAX_PROGRAMS = 10;

for (const kind of built)
  test(
    `${kind} in ink line art: light and dark, 390 and 1440, within budget`,
    { tag: kind === "travel" ? ["@cross-browser"] : [] },
    async ({ page }, info) => {
      test.setTimeout(90_000);
      await page.emulateMedia({ reducedMotion: "reduce" });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const costs: { theme: string; width: number; calls: number; triangles: number; programs: number; colors: string | null }[] =
        [];
      for (const theme of ["light", "dark"])
        for (const width of [390, 1440]) {
          const where = `${theme} ${width}`;
          await page.setViewportSize({ width, height: 900 });
          await page.goto(`/animations?story=${kind}&theme=${theme}`);
          const canvas = page.locator(".uipack-object canvas");
          // The first load in a fresh worker can wait on the dev server's first compile of the scene.
          await expect(canvas, where).toHaveAttribute("data-renderer", "webgl", { timeout: 15_000 });
          await expect(canvas, where).toHaveAttribute("data-phase", "rest", { timeout: 15_000 });
          await expect(canvas, where).toHaveCSS("opacity", "1", { timeout: 15_000 });
          await expect(canvas, where).toHaveAttribute("data-art-direction", "ink");
          await canvas.scrollIntoViewIfNeeded();
          expect(await page.evaluate(() => document.documentElement.scrollWidth), where).toBeLessThanOrEqual(width);
          await page.locator(".uipack-object").screenshot({ path: info.outputPath(`${kind}-${theme}-${width}.png`) });
          costs.push({
            theme,
            width,
            calls: Number(await canvas.getAttribute("data-draw-calls")),
            triangles: Number(await canvas.getAttribute("data-triangles")),
            programs: Number(await canvas.getAttribute("data-programs")),
            colors: await canvas.getAttribute("data-colors"),
          });
        }
      // Attach before asserting so a failing budget retains the measured evidence.
      await info.attach("render-cost", { body: JSON.stringify({ kind, costs }), contentType: "application/json" });
      for (const c of costs) {
        expect(c.calls, `draw calls at ${c.theme} ${c.width}`).toBeLessThan(MAX_DRAW_CALLS);
        expect(c.triangles, `triangles at ${c.theme} ${c.width}`).toBeLessThan(MAX_TRIANGLES);
        expect(c.programs, `shader programs at ${c.theme} ${c.width}`).toBeLessThanOrEqual(MAX_PROGRAMS);
      }
      // Light and dark draw in different page colours, read from the stage's roles.
      expect(costs[0].colors).not.toBe(costs[2].colors);
      expect(errors).toEqual([]);
    },
  );

test("the docs page shows every subject in the one style, one playing", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/components/objects");
  const tiles = page.locator(".object-subjects__tile");
  await expect(tiles).toHaveCount(objectScenes.length);
  const travel = page.locator('.object-subjects__tile[data-kind="travel"]');
  await travel.scrollIntoViewIfNeeded();
  await expect(travel.locator("canvas")).toHaveAttribute("data-renderer", "webgl", { timeout: 20_000 });
  await expect(travel.locator('.uipack-object[data-active="true"]')).toHaveCount(1);
  // Choosing another subject moves playback to it.
  const contact = page.locator('.object-subjects__tile[data-kind="contact"]');
  await contact.getByRole("button", { name: "Contact inbox" }).click();
  await expect(contact.locator('.uipack-object[data-active="true"]')).toHaveCount(1);
  await expect(travel.locator('.uipack-object[data-active="false"]')).toHaveCount(1);
});

timingTest("context loss keeps the labelled fallback", async ({ page }) => {
  await page.goto("/animations?story=travel");
  const canvas = page.locator(".uipack-object canvas");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl", { timeout: 20_000 });
  await canvas.dispatchEvent("webglcontextlost");
  await expect(canvas).toHaveAttribute("data-renderer", "fallback");
  await expect(page.getByRole("img", { name: "Local map illustration" })).toBeVisible();
});

// The paint budget at phone width, on the heaviest subject (the most draw calls at rest).
timingTest("mobile paint budget: server", async ({ page, browserName }, info) => {
  test.skip(browserName !== "chromium", "paint budgets are calibrated to Chromium's WebGL");
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/animations?story=server");
  const canvas = page.locator(".uipack-object canvas");
  await expect(canvas).toHaveAttribute("data-renderer", "webgl");
  await canvas.scrollIntoViewIfNeeded();
  await expect.poll(async () => Number(await canvas.getAttribute("data-frames"))).toBeGreaterThan(3);
  // Frames and elapsed time sampled together in the browser, so round trips do not distort the rate.
  const sample = await canvas.evaluate(async (element) => {
    const canvas = element as HTMLCanvasElement;
    const first = Number(canvas.dataset.frames),
      started = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const elapsed = performance.now() - started;
    const frames = Number(canvas.dataset.frames) - first;
    return { frames, elapsed, fps: (frames * 1000) / elapsed, calls: Number(canvas.dataset.drawCalls) };
  });
  await info.attach("mobile-viewport-performance", { body: JSON.stringify(sample), contentType: "application/json" });
  expect(sample.calls).toBeLessThan(MAX_DRAW_CALLS);
  // 15 a second (half the 30 cap) locally; CI's software WebGL gets 13.
  expect(sample.fps).toBeGreaterThan(process.env.CI ? 13 : 15);
  expect(sample.fps).toBeLessThan(34);
});
