import { expect, test, type Page } from "@playwright/test";

const demo = (page: Page) => page.locator(".uipack-web-demo");
const stepOf = async (page: Page) => Number(await demo(page).getAttribute("data-step"));

test.describe("/web Landing collection", () => {
  test("DemoPlayer advances in view, holds after Pause, and Replay restarts", async ({ page }) => {
    await page.goto("/web");
    await demo(page).scrollIntoViewIfNeeded();
    await expect(demo(page)).toHaveAttribute("data-state", "playing");
    await expect.poll(() => stepOf(page), { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
    await expect.poll(() => page.getByTestId("demo-metric").textContent(), { timeout: 10_000 }).not.toBe("40");
    await demo(page).getByRole("button", { name: "Pause" }).click();
    await expect(demo(page)).toHaveAttribute("data-state", "paused");
    const held = await page.getByTestId("demo-metric").textContent();
    const heldStep = await stepOf(page);
    await page.waitForTimeout(1500);
    expect(await page.getByTestId("demo-metric").textContent()).toBe(held);
    expect(await stepOf(page)).toBe(heldStep);
    await demo(page).getByRole("button", { name: "Replay" }).click();
    expect(await stepOf(page)).toBe(0);
    await expect(page.getByTestId("demo-metric")).toHaveText("40");
    await expect(demo(page)).toHaveAttribute("data-state", "playing");
  });

  test("DemoPlayer settles on the result and step tabs work from the keyboard", async ({ page }) => {
    await page.goto("/web");
    const tab = demo(page).getByRole("button", { name: /03 Review/ });
    await tab.focus();
    await page.keyboard.press("Enter");
    await expect(tab).toHaveAttribute("aria-current", "step");
    await expect(page.getByTestId("demo-metric")).toHaveText("3", { timeout: 5_000 });
    await expect(demo(page).getByText("Q3 budget sign-off")).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(demo(page).getByRole("button", { name: /02 Act/ })).toBeFocused();
    expect(await stepOf(page)).toBe(1);
  });

  test("reduced motion shows the final state with every step listed", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/web");
    await expect(demo(page)).toHaveAttribute("data-state", "static");
    await expect(page.getByTestId("demo-metric")).toHaveText("3");
    await expect(demo(page).getByRole("list", { name: "Demo steps" }).locator(":scope > li")).toHaveCount(3);
    await expect(demo(page).getByRole("button", { name: /Pause|Replay/ })).toHaveCount(0);
    await expect(demo(page).getByRole("link", { name: "Try it yourself" })).toBeVisible();
    // Reveal text is readable without scrolling it into view.
    const quote = page.locator(".web-quote__text");
    await expect(quote).toHaveAttribute("data-state", "static");
    expect(await quote.locator(".uipack-web-reveal__unit").first().evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  });

  test("spotlight follows the mouse and keyboard focus shows it too", async ({ page, browserName }) => {
    // Safari moves Tab focus through links only with Option held.
    const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
    await page.goto("/web");
    const card = page.locator("#web-how .uipack-web-spotlight").first();
    await card.scrollIntoViewIfNeeded();
    const box = (await card.boundingBox())!;
    await page.mouse.move(box.x + 40, box.y + 30);
    await expect.poll(() => card.evaluate((el) => el.style.getPropertyValue("--spot-x"))).toBe("40px");
    const on = () => card.evaluate((el) => getComputedStyle(el).getPropertyValue("--spot-on").trim());
    expect(await on()).toBe("1");
    await page.mouse.move(0, 0);
    // A spotlight whose link has keyboard focus lights without the pointer.
    const flashy = page.locator(".web-panel .uipack-web-spotlight").first();
    await flashy.getByRole("link").focus();
    await page.keyboard.press(`Shift+${tab}`);
    await page.keyboard.press(tab);
    await expect(flashy.getByRole("link")).toBeFocused();
    expect(await flashy.evaluate((el) => getComputedStyle(el).getPropertyValue("--spot-on").trim())).toBe("1");
  });

  for (const theme of ["light", "dark"] as const) {
    test(`${theme}: no console errors and no page overflow at 390px`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(String(e)));
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/web?theme=${theme}`);
      await expect(page.locator(".uipack-web").first()).toHaveAttribute("data-theme", theme);
      await expect(page.getByRole("link", { name: "Web UI", exact: true })).toHaveAttribute("aria-current", "page");
      await expect(page.locator(".showcase-context a")).toHaveText("Landing style");
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
      // Menu folds on narrow widths and opens from the keyboard.
      const menu = page.getByRole("button", { name: "Menu" });
      await menu.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Pricing" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(menu).toBeFocused();
      for (const b of await page.locator(".uipack-web-demo button, .uipack-web-cta, .uipack-web-nav__toggle").all()) {
        if (!(await b.isVisible())) continue;
        const box = (await b.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`/web?theme=${theme}`);
      await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
      expect(errors).toEqual([]);
    });
  }

  test("Styles index lists Landing and links to Web UI", async ({ page }) => {
    await page.goto("/styles");
    const card = page.locator(".style-card", { hasText: "Landing" });
    await card.getByRole("link", { name: "Web UI building blocks" }).click();
    await expect(page).toHaveURL(/\/web\?theme=light/);
  });
});
