import { expect, test } from "@playwright/test";

test("docs gallery renders desktop navigation and table of contents", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/docs?theme=light");

  await expect(page.locator('[data-catalog-entry="product-docs-layout"]')).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Documentation" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "On this page" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Overview" }).last()).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("docs gallery uses its navigation disclosure at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs?theme=dark");

  const disclosure = page.locator(".uipack-docs__mobile-navigation");
  await expect(disclosure.locator("summary")).toBeVisible();
  await expect(disclosure).not.toHaveAttribute("open", "");
  await disclosure.locator("summary").click();
  await expect(disclosure).toHaveAttribute("open", "");
  await expect(
    disclosure.getByRole("link", { name: "Getting started" }),
  ).toBeVisible();
  await expect(page.locator('.uipack-docs__toc')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
