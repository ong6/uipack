import { test, expect } from '@playwright/test';
for (const theme of ['light', 'dark']) for (const width of [390, 1440]) {
  test(`gallery editions and responsive layout ${theme} ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`/animations?story=travel&variant=0&theme=${theme}`);
    const scene = page.locator('.uipack-object');
    await page.getByRole('combobox', { name: /Studio edition/ }).selectOption('2');
    await expect(page).toHaveURL(/edition=2/);
    await expect(scene).toHaveAttribute('data-edition', '2');
    await page.getByRole('button', { name: /Paper worlds/ }).click();
    await expect(page.getByRole('combobox', { name: /Studio edition/ })).toHaveCount(0);
    await page.getByRole('button', { name: /Studio objects/ }).click();
    await expect(page.getByRole('combobox', { name: /Studio edition/ })).toHaveValue('2');
    await page.reload();
    await expect(scene).toHaveAttribute('data-edition', '2');
    await expect(scene.locator('canvas')).toHaveAttribute('data-renderer', 'webgl');
    await expect(scene.locator('canvas')).toHaveCSS('opacity', '1');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: info.outputPath('gallery.png'), fullPage: true });
    await page.getByRole('button', { name: 'Open canvas', exact: true }).click();
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(scene).toHaveAttribute('data-edition', '2');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open canvas', exact: true })).toBeFocused();
  });
}
