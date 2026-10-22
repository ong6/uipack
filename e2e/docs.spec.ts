import { expect, test } from "./fixtures";

test("docs gallery renders desktop navigation and table of contents", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/docs?theme=light");

  await expect(page.locator('[data-catalog-entry="product-docs-layout"]')).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Documentation", exact: true })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "On this page" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Overview", exact: true }).last()).toHaveAttribute("aria-current", "page");
});

test("docs gallery uses its navigation disclosure at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs?theme=dark");

  const disclosure = page.locator(".uipack-docs__mobile-navigation");
  await expect(disclosure.locator("summary")).toBeVisible();
  await expect(disclosure).not.toHaveAttribute("open", "");
  await disclosure.locator("summary").click();
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(disclosure.getByRole("link", { name: "Getting started" })).toBeVisible();
  await expect(page.locator(".uipack-docs__toc")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("at 390px Escape closes the navigation disclosure and returns focus to its summary", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs");
  const disclosure = page.locator(".uipack-docs__mobile-navigation");
  const summary = disclosure.locator("summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(disclosure).toHaveAttribute("open", "");
  // From a link inside, as well as from the summary itself.
  await disclosure.getByRole("link", { name: "Getting started" }).focus();
  await page.keyboard.press("Escape");
  await expect(disclosure).not.toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(disclosure).toHaveAttribute("open", "");
  await page.keyboard.press("Escape");
  await expect(disclosure).not.toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
});

test("the skip link never paints until focused, even inside a transformed ancestor", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs");
  const skip = page.getByRole("link", { name: "Skip to documentation content" });
  await expect(skip).toHaveCount(1);
  // A host's tab panel can transform or contain the docs (junxiong.dev/uipack does): a fixed,
  // translated link would then anchor to it and paint at the top of the page.
  await page.evaluate(() => {
    const docs = document.querySelector<HTMLElement>(".uipack-docs")!;
    docs.style.transform = "translateZ(0)";
    docs.style.contain = "layout paint";
  });
  const hidden = await skip.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return { w: r.width, h: r.height, overflow: s.overflow, clipPath: s.clipPath };
  });
  expect(hidden.w).toBeLessThanOrEqual(1);
  expect(hidden.h).toBeLessThanOrEqual(1);
  expect(hidden.overflow).toBe("hidden");
  expect(hidden.clipPath).toContain("inset(50%)");
  await skip.focus();
  const shown = await skip.boundingBox();
  expect(shown!.width).toBeGreaterThan(100);
  expect(shown!.height).toBeGreaterThan(30);
  await expect(skip).toBeInViewport();
});
