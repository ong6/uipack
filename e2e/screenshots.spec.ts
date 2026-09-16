import { test } from "@playwright/test";

// Not a test: writes the README screenshots. Run with `npm run screenshots`.
for (const theme of ["light", "dark"] as const) {
  for (const [w, h] of [[1440, 1100], [390, 1400]] as const) {
    test(`shot ${theme} ${w}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`/?theme=${theme}`);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `docs/playground-${w}-${theme}.png`, fullPage: false });
    });
  }
}
