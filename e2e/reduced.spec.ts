import { expect, test } from "@playwright/test";
import { dist, packetCentre, pathPoint } from "./helpers";

// `test.use({ reducedMotion })` did not reach matchMedia in Playwright 1.61 on
// either engine here, so the emulation is explicit.
test.describe("reduced motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });
  test("renders one static token at the midpoint and hides the controls", async ({ page }) => {
    const console_: string[] = [];
    page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && console_.push(m.text()));
    await page.goto("/");
    const packet = page.locator("#e2e-packet");
    await expect(packet).toHaveAttribute("data-static", "true");
    expect(await page.locator("animateMotion").count()).toBe(0);
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
    const figure = page.locator("figure", { hasText: "Every part" });
    await expect(figure.getByRole("button")).toHaveCount(0);
    const a = await packetCentre(page);
    await page.waitForTimeout(500);
    const b = await packetCentre(page);
    expect(dist(a, b)).toBeLessThan(0.5);
    const mid = await pathPoint(page, 0.5);
    expect(dist(a, mid)).toBeLessThan(12);
    // Reduced motion starts false on both server and client and flips in an
    // effect, so hydration can never disagree about controls or SMIL.
    expect(console_.filter((m) => /hydrat|did not match/i.test(m))).toEqual([]);
  });
});

