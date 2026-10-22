import { expect, test } from "./fixtures";

import { dist, packetCentre, pathPoint } from "./helpers";

test.describe("packet motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("#e2e-packet").waitFor();
    // The initial token is static until hydration, and offscreen SVG animation
    // may be throttled by the browser. Measure the visible, animated figure.
    await expect(page.locator("#e2e-packet animateMotion")).toHaveCount(1);
    await page.locator("svg", { has: page.locator("#e2e-packet") }).scrollIntoViewIfNeeded();
  });

  test("moves while playing", async ({ page }) => {
    const a = await packetCentre(page);
    await expect.poll(async () => dist(a, await packetCentre(page))).toBeGreaterThan(4);
  });

  test("holds still after Pause, resumes on Play", async ({ page }) => {
    const figure = page.locator("figure", { hasText: "Every part" });
    await figure.getByRole("button", { name: "Pause" }).click();
    const a = await packetCentre(page);
    // Wall clock on purpose: paused, the packet stays put as time passes.
    await page.waitForTimeout(500);
    const b = await packetCentre(page);
    expect(dist(a, b)).toBeLessThan(0.5);
    await figure.getByRole("button", { name: "Play", exact: true }).click();
    await expect.poll(async () => dist(b, await packetCentre(page))).toBeGreaterThan(4);
  });

  test("Replay restarts from the path start", async ({ page }) => {
    const figure = page.locator("figure", { hasText: "Every part" });
    const start = await pathPoint(page, 0);
    // Well into the 2s trip.
    await expect.poll(async () => dist(await packetCentre(page), start)).toBeGreaterThan(20);
    const before = await packetCentre(page);
    expect(dist(before, start)).toBeGreaterThan(20);
    await figure.getByRole("button", { name: "Replay" }).click();
    const after = await packetCentre(page);
    // 2s over ~330 units is 165 units/s; the click and the read cost up to ~120ms
    expect(dist(after, start)).toBeLessThan(28);
  });
});

test.describe("themes", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`${theme} renders every figure with no console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`/?theme=${theme}`);
      await expect(page.locator("figure.uipack")).toHaveCount(18); // one per pattern section, the drill-down included
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const bg = await page
        .locator("figure.uipack")
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bg).toBe(theme === "dark" ? "rgb(14, 21, 18)" : "rgb(255, 255, 255)");
      expect(errors).toEqual([]);
    });
  }
});
