import { test } from "@playwright/test";

// Not a test: writes the README and docs screenshots. Run with `npm run screenshots`.
const PRESETS = ["serviceMap", "agentLoop", "ragPipeline", "skillLifecycle", "syncLoop", "beforeAfter", "pipeline"];

for (const theme of ["light", "dark"] as const) {
  for (const [w, h] of [[1440, 1100], [390, 1400]] as const) {
    test(`shot ${theme} ${w}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`/?theme=${theme}`);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `docs/playground-${w}-${theme}.png`, fullPage: false });
      await page.goto(`/assets?theme=${theme}`);
      await page.waitForTimeout(800);
      await page.screenshot({ path: `docs/assets-${w}-${theme}.png`, fullPage: false });
    });
  }
  test(`shot presets ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto(`/?theme=${theme}`);
    await page.waitForTimeout(600);
    await page.locator("section").first().locator("figure").screenshot({ path: `docs/habitat-${theme}.png` });
    await page.locator("section").nth(1).locator("figure").screenshot({ path: `docs/parts-${theme}.png` });
    for (const name of PRESETS) {
      await page.locator(`section[data-preset="${name}"] figure`).screenshot({ path: `docs/presets/${name}-${theme}.png` });
    }
  });
}
