import { expect, test, type Locator, type Page } from "./fixtures";

// Each figure drawing is one Tab stop (roving tabindex): Tab enters at one part and the next Tab
// leaves the figure; the arrow keys, Home and End move between its parts.
const parts = (drawing: Locator) => drawing.locator('[role="button"], a[href]');
const focusedName = (page: Page) => page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent?.trim());

test.describe("figure keyboard: one Tab stop per drawing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("#e2e-node-alpha").waitFor();
    await page.locator("#drill-main").waitFor();
  });

  test("Tab moves past a whole figure in one press, and Shift+Tab comes back to the same part", async ({ page, browserName }) => {
    const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
    const figure = page.locator("figure", { hasText: "Every part" });
    const drawing = figure.locator("svg.uipack--wide");
    const count = await parts(drawing).count();
    expect(count).toBeGreaterThan(3);
    await expect(drawing.locator('[tabindex="0"]')).toHaveCount(1);
    // From the figure's last control, one Tab enters the drawing at its first part...
    await figure.getByRole("button", { name: /^(Pause|Play)$/ }).focus();
    await page.keyboard.press(tab);
    await expect(parts(drawing).first()).toBeFocused();
    // ...and the next Tab leaves the figure altogether.
    await page.keyboard.press(tab);
    expect(await page.evaluate(() => document.activeElement?.closest("figure")?.textContent?.includes("Every part"))).not.toBe(true);
    await page.keyboard.press(`Shift+${tab}`);
    await expect(parts(drawing).first()).toBeFocused();
  });

  test("arrows step through the parts in order, Home and End jump, Enter still selects", async ({ page, browserName }) => {
    const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
    const figure = page.locator("figure", { hasText: "Every part" });
    const drawing = figure.locator("svg.uipack--wide");
    const all = parts(drawing);
    const n = await all.count();
    await all.first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(all.nth(1)).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(all.nth(2)).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(all.nth(1)).toBeFocused();
    await page.keyboard.press("End");
    await expect(all.nth(n - 1)).toBeFocused();
    // At the end an arrow stays put, and the page does not scroll under it.
    const y = await page.evaluate(() => scrollY);
    await page.keyboard.press("ArrowDown");
    await expect(all.nth(n - 1)).toBeFocused();
    expect(await page.evaluate(() => scrollY)).toBe(y);
    await page.keyboard.press("Home");
    await expect(all.first()).toBeFocused();
    await page.keyboard.press("ArrowRight");
    const second = all.nth(1);
    const name = await focusedName(page);
    if ((await second.getAttribute("role")) === "button") {
      await page.keyboard.press("Enter");
      await expect(second).toHaveAttribute("aria-pressed", "true");
    }
    // The part last focused is the drawing's Tab stop now: leave and come back to it.
    await expect(drawing.locator('[tabindex="0"]')).toHaveCount(1);
    await page.keyboard.press(tab);
    await page.keyboard.press(`Shift+${tab}`);
    expect(await focusedName(page)).toBe(name);
  });

  test("every drawing on the diagrams page has exactly one Tab stop", async ({ page }) => {
    const counts = await page.locator('svg[role="group"]').evaluateAll((svgs) =>
      svgs
        .map((svg) => {
          const items = [...svg.querySelectorAll('[role="button"], a[href]')].filter((el) => el.closest('svg[role="group"]') === svg);
          return { items: items.length, stops: items.filter((el) => el.getAttribute("tabindex") !== "-1").length };
        })
        .filter((c) => c.items > 0),
    );
    expect(counts.length).toBeGreaterThan(5);
    for (const c of counts) expect(c.stops).toBe(1);
  });

  test("drill nodes rove too: arrows reach them, Enter opens, Escape returns to the same node", async ({ page }) => {
    const fig = page.locator("#drill-main");
    const settled = async () => {
      await expect(fig.locator(".uipack-drill__stage")).not.toHaveAttribute("data-flight", /.+/);
      await expect(fig.locator(".uipack-drill__layer")).toHaveCount(1);
    };
    const wide = fig.locator(".uipack-drill__layer[data-current] svg.uipack-drill__wide");
    const checks = wide.locator('[data-drill="checks"]');
    await expect(wide.locator('[tabindex="0"]')).toHaveCount(1);
    await parts(wide).first().focus();
    // Walk to the Checks drill node with the arrow keys alone.
    const n = await parts(wide).count();
    for (let i = 0; i < n && !(await checks.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press("ArrowRight");
    await expect(checks).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(fig.getByRole("heading", { name: /^Checks:/ })).toBeFocused();
    await settled();
    await expect(wide.locator('[tabindex="0"]')).toHaveCount(1);
    await page.keyboard.press("Escape");
    await settled();
    await expect(checks).toBeFocused();
    await expect(checks).toHaveAttribute("tabindex", "0");
  });
});
