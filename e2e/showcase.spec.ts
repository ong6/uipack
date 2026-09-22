import { expect, test } from "@playwright/test";

test("library pages share navigation and preserve theme across routes and reloads", async ({
  page,
}) => {
  await page.goto("/?theme=dark");
  const header = page.locator(".showcase-header");
  const width = await header.evaluate((el) => el.getBoundingClientRect().width);
  for (const name of ["Assets", "3D animations", "Figures"]) {
    await page
      .getByRole("navigation", { name: "Library pages" })
      .getByRole("link", { name, exact: true })
      .click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("link", { name, exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      await header.evaluate((el) => el.getBoundingClientRect().width),
    ).toBe(width);
  }
  await page.getByRole("link", { name: "3D animations", exact: true }).click();
  await page.getByRole("button", { name: "light mode", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".uipack-animation-workspace")).toHaveAttribute(
    "data-theme",
    "light",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("link", { name: "Figures", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
