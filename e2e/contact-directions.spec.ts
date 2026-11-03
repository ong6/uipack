import { test, expect } from "./fixtures";
// One test per contact style: both widths and themes in one page, then reduced motion and the
// WebGL fallback.
for (const [variant, style] of [
  [3, "cartoon"],
  [4, "kinetic"],
] as const) {
  test(`contact ${style}: 390 and 1440, light and dark, reduced motion and WebGL fallback`, async ({ page }, info) => {
    test.setTimeout(60_000);
    const canvas = page.locator(".uipack-object canvas");
    for (const width of [390, 1440])
      for (const theme of ["light", "dark"]) {
        const where = `${width} ${theme}`;
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/animations?story=contact&variant=${variant}&theme=${theme}`);
        await expect(canvas, where).toHaveAttribute("data-renderer", "webgl", { timeout: 15_000 });
        await expect(canvas, where).toHaveAttribute("data-art-direction", style);
        await expect(canvas, where).toHaveCSS("opacity", "1", { timeout: 15_000 });
        await page.getByRole("button", { name: "Pause motion", exact: true }).click();
        await expect(page.getByRole("button", { name: "Resume motion", exact: true })).toBeVisible();
        const frames = await canvas.getAttribute("data-frames");
        // Wall clock on purpose: paused paints nothing as time passes.
        await page.waitForTimeout(180);
        expect(await canvas.getAttribute("data-frames"), `${where}: paused paints nothing`).toBe(frames);
        await page.screenshot({ path: info.outputPath(`contact-${width}-${theme}.png`) });
        expect(await page.evaluate(() => document.documentElement.scrollWidth), where).toBe(width);
        await page.getByRole("button", { name: "Resume motion", exact: true }).click();
        await expect.poll(() => canvas.getAttribute("data-frames"), { message: `${where}: resumes` }).not.toBe(frames);
        await page.getByRole("button", { name: "Studio objects", exact: true }).click();
        await expect(page.getByRole("combobox", { name: /Inbox edition/ })).toBeVisible();
      }

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/animations?story=contact&variant=${variant}`);
    await expect(canvas).toHaveAttribute("data-renderer", "webgl");
    await expect(page.getByRole("button", { name: "Pause motion", exact: true })).toHaveCount(0);
    const frames = await canvas.getAttribute("data-frames");
    // Wall clock on purpose: a still scene paints nothing as time passes.
    await page.waitForTimeout(200);
    expect(await canvas.getAttribute("data-frames")).toBe(frames);
    await canvas.dispatchEvent("webglcontextlost");
    await expect(canvas).toHaveAttribute("data-renderer", "fallback");
    await expect(page.locator('.uipack-object [role="img"]')).toHaveAttribute("aria-label", "Contact inbox illustration");
  });
}
