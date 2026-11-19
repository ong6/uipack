import { expect, test, type Page } from "./fixtures";

// uipack/widgets (docs/components/widgets.md): the skinned command menu and toasts, on the docs page's
// live demo, and the docs search's modified click (built on the same command menu).

/** WCAG contrast of an element's text against the colour drawn behind it (its own, or the first ancestor's). */
const contrastOf = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
      const lum = ([r, g, b]: number[]) => {
        const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      // A translucent tint is composited over the first opaque ancestor ground.
      let ground = [255, 255, 255];
      const layers: number[][] = [];
      for (let n: Element | null = el; n; n = n.parentElement) {
        const c = rgb(getComputedStyle(n).backgroundColor);
        const a = c.length === 4 ? c[3] : 1;
        if (a === 0) continue;
        layers.unshift(c);
        if (a === 1) {
          ground = c.slice(0, 3);
          break;
        }
      }
      for (const c of layers.slice(1)) {
        const a = c[3] ?? 1;
        ground = ground.map((g, i) => g * (1 - a) + c[i] * a);
      }
      const text = rgb(getComputedStyle(el).color).slice(0, 3);
      const [hi, lo] = [lum(text), lum(ground)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    });

for (const theme of ["light", "dark"] as const)
  test(`the command menu: arrows move, Enter chooses, the selected row stays readable (${theme})`, async ({ page }) => {
    await page.goto(`/looks/widgets?theme=${theme}`);
    const menu = page.locator(".widgets-demo .uipack-command");
    await menu.scrollIntoViewIfNeeded();
    const input = menu.getByRole("combobox");
    await input.focus();
    const options = menu.getByRole("option");
    await expect(options.first()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    expect(await contrastOf(page, '.widgets-demo [cmdk-item][data-selected="true"]')).toBeGreaterThanOrEqual(4.5);
    // Typing filters; Enter chooses the selected command, which raises a toast with its name.
    await input.fill("grade");
    await expect(options).toHaveCount(1);
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: "Grade a page" })).toBeVisible();
    await expect(page.locator(".widgets-demo__note")).toHaveText("Last command: Grade a page");
  });

test("a toast appears in the skin, and Undo runs its action", async ({ page }) => {
  await page.goto("/looks/widgets?theme=light");
  await page.getByRole("button", { name: "Save draft" }).click();
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: "Draft saved" });
  await expect(toast).toBeVisible();
  await expect(page.locator("[data-sonner-toaster].uipack-toaster")).toHaveCount(1);
  expect(await contrastOf(page, "[data-sonner-toast].uipack-toast [data-title]")).toBeGreaterThanOrEqual(4.5);
  await toast.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: "Draft restored" })).toBeVisible();
});

test("the docs search: a modified click on a result leaves this page where it is", async ({ page, context }) => {
  await page.goto("/charts?theme=light");
  await expect(page.locator("main h1")).toBeVisible();
  const before = page.url();
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByRole("combobox", { name: "Search the docs" }).fill("registry");
  const first = page.getByRole("option").first();
  await expect(first).toContainText("Site registry");
  const opened = context.waitForEvent("page");
  await first.click({ modifiers: ["ControlOrMeta"] });
  const tab = await opened;
  await tab.waitForLoadState("domcontentloaded");
  expect(new URL(tab.url()).pathname).toBe("/specs/registry");
  expect(page.url()).toBe(before);
  await tab.close();
});
