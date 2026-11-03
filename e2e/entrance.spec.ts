import { expect, test } from "./fixtures";

test.use({ entrance: true });

test.describe("figure entrance", () => {
  test("a figure below the fold waits, rises in when scrolled to, then settles", { tag: "@cross-browser" }, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const first = page.locator("figure.uipack").first().locator(".uipack__canvas");
    const late = page.locator("figure.uipack", { hasText: "Annotated curve" }).locator(".uipack__canvas");
    await late.waitFor({ state: "attached" });
    // On screen at load: never hidden.
    await expect(first).not.toHaveAttribute("data-enter", "wait");
    await expect(late).toHaveAttribute("data-enter", "wait");
    await late.scrollIntoViewIfNeeded();
    await expect(late).not.toHaveAttribute("data-enter", "wait");
    // Settled: the attribute and the numbering are gone, every part fully shown.
    await expect(late).not.toHaveAttribute("data-enter", /.*/, { timeout: 4000 });
    const opacities = await late
      .locator(":scope > svg.uipack--wide > *")
      .evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
    expect(opacities.every((o) => o === "1")).toBe(true);
  });

  test("reduced motion shows every figure at once", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await page.locator("figure.uipack").last().waitFor({ state: "attached" });
    await expect(page.locator(".uipack__canvas[data-enter]")).toHaveCount(0);
    await context.close();
  });
});
