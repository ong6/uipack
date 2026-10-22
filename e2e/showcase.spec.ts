import { expect, test } from "./fixtures";

test("library pages share navigation and preserve theme across routes and reloads", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/?theme=dark");
  const header = page.locator(".showcase-header");
  const width = await header.evaluate((el) => el.getBoundingClientRect().width);
  const groups = page.getByRole("navigation", { name: "Library groups" });
  const pages = page.getByRole("navigation", { name: "Library pages" });
  // Foundations opens on Styles; its second page is Icons & marks.
  await groups.getByRole("link", { name: "Foundations", exact: true }).click();
  await pages.getByRole("link", { name: "Icons & marks", exact: true }).click();
  await groups.getByRole("link", { name: "Motion & 3D", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    pages.getByRole("link", { name: "3D animations", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await groups.getByRole("link", { name: "Diagrams", exact: true }).click();
  await expect(
    pages.getByRole("link", { name: "Architecture diagrams", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  expect(
    await header.evaluate((el) => el.getBoundingClientRect().width),
  ).toBe(width);
  await groups.getByRole("link", { name: "Motion & 3D", exact: true }).click();
  await page.getByRole("button", { name: "light mode", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".uipack-animation-workspace")).toHaveAttribute(
    "data-theme",
    "light",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".showcase-menu-button")).toHaveAccessibleName(
    "Motion & 3D: 3D animations",
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
