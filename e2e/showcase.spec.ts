import { expect, test } from "./fixtures";

test("library pages share navigation and preserve theme across routes and reloads", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/what-uipack-is?theme=dark");
  const header = page.locator(".showcase-header");
  const width = await header.evaluate((el) => el.getBoundingClientRect().width);
  const sidebar = page.getByRole("navigation", { name: "Library", exact: true });
  // Shut sections open from their heading and stay open from page to page.
  await sidebar.getByRole("button", { name: "Reference", exact: true }).click();
  await sidebar.getByRole("link", { name: "Icons and marks", exact: true }).click();
  await sidebar.getByRole("button", { name: "Build", exact: true }).click();
  await sidebar.getByRole("link", { name: "3D animations", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(sidebar.getByRole("link", { name: "3D animations", exact: true })).toHaveAttribute("aria-current", "page");
  await sidebar.getByRole("link", { name: "Architecture diagrams", exact: true }).click();
  await expect(sidebar.getByRole("link", { name: "Architecture diagrams", exact: true })).toHaveAttribute("aria-current", "page");
  expect(await header.evaluate((el) => el.getBoundingClientRect().width)).toBe(width);
  await sidebar.getByRole("link", { name: "3D animations", exact: true }).click();
  await page.getByRole("button", { name: "Light mode", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".uipack-animation-workspace")).toHaveAttribute("data-theme", "light");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  await expect(page.locator(".showcase-crumb")).toHaveText("Build");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test.describe("3D animations library", () => {
  test("a search with no match names it and offers Clear search", async ({ page }) => {
    await page.goto("/animations");
    const library = page.locator(".uipack-animation-library");
    await library.getByRole("searchbox", { name: "Search animations" }).fill("zebra");
    await expect(library.getByRole("status")).toHaveText("0 examples");
    await expect(library.getByText("Nothing matches “zebra”.")).toBeVisible();
    await library.getByRole("button", { name: "Clear search" }).click();
    await expect(library.getByRole("searchbox", { name: "Search animations" })).toHaveValue("");
    await expect(library.getByRole("navigation", { name: "Example stories" }).getByRole("button")).not.toHaveCount(0);
  });

  test("an unknown story or variant says what it shows instead", async ({ page }) => {
    await page.goto("/animations?story=bogus&variant=99");
    const note = page.locator(".showcase-title__note");
    await expect(note).toHaveText(
      "Story “bogus” not found, showing Agent session. Variant “99” not found, showing Kinetic sculptures.",
    );
    await expect(page.locator(".uipack-animation-heading h3")).toHaveText("Agent session");
    // Choosing a story rewrites the address, and the note goes.
    await page
      .getByRole("navigation", { name: "Example stories" })
      .getByRole("button", { name: /Contact inbox/ })
      .click();
    await expect(note).toHaveCount(0);
  });
});
