import { expect, test } from "./fixtures";

test.describe("asset browser", () => {
  test("category filter, search and counts", async ({ page }) => {
    await page.goto("/assets");
    const status = page.getByRole("status");
    await expect(status).toHaveText(/^44 assets$/);
    await expect(page.locator(".uipack-browser__card")).toHaveCount(44);
    await page.getByRole("button", { name: /^Icons/ }).click();
    await expect(status).toHaveText("25 assets in Icons");
    await expect(page.locator(".uipack-browser__card")).toHaveCount(25);
    await page.getByRole("searchbox").fill("robot");
    await expect(status).toHaveText("1 asset in Icons");
    await page.getByRole("button", { name: /^All/ }).click();
    await page.getByRole("searchbox").fill("");
    await expect(status).toHaveText(/^44 assets$/);
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
    await expect(page.getByRole("button", { name: /^Icons/ })).toBeFocused();
    await page.getByRole("searchbox").focus();
    await page.keyboard.press(tab);
    await expect(page.locator(".uipack-browser__action").first()).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator(".uipack-browser__action").first()).toHaveText("Copied");
  });

  test("an empty search offers Clear search, which empties the field and puts focus back in it", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/assets");
    await page.locator(".uipack-browser__card").first().waitFor();
    const search = page.getByRole("searchbox");
    await search.fill("zzqqxx");
    await expect(page.getByText("Nothing matches “zzqqxx”.")).toBeVisible();
    const clear = page.getByRole("button", { name: "Clear search" });
    expect((await clear.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await clear.click();
    await expect(search).toHaveValue("");
    await expect(search).toBeFocused();
    await expect(page.locator(".uipack-browser__card").first()).toBeVisible();
    await expect(page.locator(".uipack-browser__empty")).toHaveCount(0);
  });

  test("under reduced motion the packet preview is its still; the plain canvas has an edge", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/assets?theme=dark");
    // Previews load lazily: WebKit gives an unloaded image no box, so bring the card into view first.
    await page.locator('[data-id="motion-packet"]').scrollIntoViewIfNeeded();
    const packet = page.locator('[data-id="motion-packet"] .uipack-browser__tile img:visible');
    await expect(packet).toHaveCount(1);
    await expect.poll(() => packet.evaluate((i: HTMLImageElement) => i.currentSrc)).toMatch(/dark\/motion-packet-still\.svg$/);
    await page.locator('[data-id="background-plain"]').scrollIntoViewIfNeeded();
    const edge = await page.locator('[data-id="background-plain"] .uipack-browser__tile img:visible').evaluate((i) => getComputedStyle(i).borderTopWidth);
    expect(edge).toBe("1px");
  });

  test("with a mouse, Copy shows on hover and focus only", async ({ page }) => {
    await page.goto("/assets");
    const card = page.locator(".uipack-browser__card").first();
    const action = card.locator(".uipack-browser__action");
    const hover = await page.evaluate(() => matchMedia("(hover: hover)").matches);
    test.skip(!hover, "touch screens always show the action");
    await expect(action).toHaveCSS("opacity", "0");
    await card.hover();
    await expect(action).toHaveCSS("opacity", "1");
    await page.mouse.move(0, 0);
    await action.focus();
    await expect(action).toHaveCSS("opacity", "1");
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
