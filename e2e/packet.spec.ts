import { expect, test } from "@playwright/test";

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
    await page.waitForTimeout(500);
    const b = await packetCentre(page);
    expect(dist(a, b)).toBeGreaterThan(4);
  });

  test("holds still after Pause, resumes on Play", async ({ page }) => {
    const figure = page.locator("figure", { hasText: "Every part" });
    await figure.getByRole("button", { name: "Pause" }).click();
    const a = await packetCentre(page);
    await page.waitForTimeout(500);
    const b = await packetCentre(page);
    expect(dist(a, b)).toBeLessThan(0.5);
    await figure.getByRole("button", { name: "Play", exact: true }).click();
    await page.waitForTimeout(500);
    const c = await packetCentre(page);
    expect(dist(b, c)).toBeGreaterThan(4);
  });

  test("Replay restarts from the path start", async ({ page }) => {
    const figure = page.locator("figure", { hasText: "Every part" });
    await page.waitForTimeout(900); // well into the 2s trip
    const before = await packetCentre(page);
    const start = await pathPoint(page, 0);
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
      await expect(page.locator("figure.uipack")).toHaveCount(10); // Habitat, parts, seven presets, bare
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const bg = await page.locator("figure.uipack").first().evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bg).toBe(theme === "dark" ? "rgb(14, 21, 18)" : "rgb(255, 255, 255)");
      expect(errors).toEqual([]);
    });
  }
});
