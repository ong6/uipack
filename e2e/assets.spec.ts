import { expect, test } from "@playwright/test";

test.describe("asset browser", () => {
  test("category filter, search and counts", async ({ page }) => {
    await page.goto("/assets");
    const status = page.getByRole("status");
    await expect(status).toHaveText(/^60 assets$/);
    await expect(page.locator(".uipack-browser__card")).toHaveCount(60);
    await page.getByRole("button", { name: /^Icons/ }).click();
    await expect(status).toHaveText("25 assets in Icons");
    await expect(page.locator(".uipack-browser__card")).toHaveCount(25);
    await page.getByRole("searchbox").fill("robot");
    await expect(status).toHaveText("1 asset in Icons");
    await page.getByRole("button", { name: /^All/ }).click();
    await page.getByRole("searchbox").fill("");
    await expect(status).toHaveText(/^60 assets$/);
    // every preview loaded
    const broken = await page.evaluate(() => [...document.querySelectorAll<HTMLImageElement>(".uipack-browser__tile img")].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
    expect(broken).toEqual([]);
  });

  test("copy writes the source to the clipboard and flashes", async ({ page, context, browserName }) => {
    test.skip(browserName === "webkit", "WebKit has no clipboard permission grant in Playwright; the flash is checked in the unit tests too");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/assets");
    const btn = page.getByRole("button", { name: "Copy lock" });
    await btn.click();
    await expect(btn).toHaveText("Copied");
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('icon="lock"');
    await expect(btn).toHaveText("Copy", { timeout: 3000 });
  });

  test("390 wide: chips row, no horizontal overflow, 44px targets", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/assets");
    await page.locator(".uipack-browser__card").first().waitFor();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const dir = await page.locator(".uipack-browser__side ul").evaluate((el) => getComputedStyle(el).flexDirection);
    expect(dir).toBe("row");
    for (const sel of [".uipack-browser__cat", ".uipack-browser__search input"]) {
      const h = await page.locator(sel).first().evaluate((el) => el.getBoundingClientRect().height);
      expect(h).toBeGreaterThanOrEqual(44);
    }
    const row = await page.locator(".uipack-browser__row").first().evaluate((el) => el.getBoundingClientRect().height);
    expect(row).toBeGreaterThanOrEqual(44);
  });

  test("keyboard: tab reaches categories, search and the first action", async ({ page, browserName }) => {
    await page.goto("/assets");
    await page.locator(".uipack-browser__card").first().waitFor();
    // WebKit only moves focus with Tab when the OS setting allows it, so it gets Option+Tab.
    const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
    await page.getByRole("button", { name: /^All/ }).focus();
    await page.keyboard.press(tab);
    await expect(page.getByRole("button", { name: /^Figures/ })).toBeFocused();
    await page.getByRole("searchbox").focus();
    await page.keyboard.press(tab);
    await expect(page.locator(".uipack-browser__action").first()).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator(".uipack-browser__action").first()).toHaveText("Copied");
  });

  test("counts and status are full opacity, action buttons are 44px", async ({ page }) => {
    await page.goto("/assets");
    await page.locator(".uipack-browser__action").first().waitFor();
    const opacities = await page.evaluate(() =>
      [...document.querySelectorAll(".uipack-browser__count, .uipack-browser__status")].map((el) => getComputedStyle(el).opacity),
    );
    expect(opacities.length).toBeGreaterThan(1);
    expect(opacities.every((o) => o === "1")).toBe(true);
    const box = await page.locator(".uipack-browser__action").first().boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});
