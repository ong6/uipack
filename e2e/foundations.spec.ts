import { libraryPages } from "../playground/catalog";
import { expect, test, waitForPage } from "./fixtures";
import { expectPageTitle } from "./page-audit";

// The Rules pages link to each other, to the live pages and into the docs. Every internal
// link must land on a real page (not the shell's "Page not found"), and no guide logs an error.
const guides = libraryPages.filter((p) => p.group === "foundations" && p.path.startsWith("/foundations"));

test("every Foundations guide renders without console errors, and its internal links resolve", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(`${page.url()}: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));
  const links = new Set<string>();
  for (const guide of guides) {
    await page.goto(`${guide.path}?theme=light`);
    // The page module (and a Markdown guide's file and demos) loads after the shell.
    await waitForPage(page);
    await expectPageTitle(page, guide.label, guide.path);
    // Links inside closed disclosures are in the DOM too.
    const hrefs = await page.locator("main a[href]").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    for (const href of hrefs) {
      const url = new URL(href);
      // Pages only: a raw file ("View as Markdown", /docs/….md) is checked by the docs-manifest test.
      if (url.origin === new URL(page.url()).origin && !/\.\w+$/.test(url.pathname)) links.add(url.pathname + url.search);
    }
  }
  expect(guides.length).toBeGreaterThanOrEqual(7);
  expect(links.size).toBeGreaterThan(10);
  // Console errors are checked on the guides themselves; the pages they link to have their own specs.
  expect(errors).toEqual([]);
  const broken: string[] = [];
  for (const link of links) {
    await page.goto(link);
    await page.waitForLoadState("networkidle");
    const title = await page.locator("h1, .showcase-title__name").first().textContent();
    if (title?.trim() === "Page not found") broken.push(link);
  }
  expect(broken).toEqual([]);
});

test("the budget checker on General rules gives the linter's verdict, from the keyboard", async ({ page }) => {
  await page.goto("/foundations/writing/general?theme=light");
  await waitForPage(page);
  const demo = page.locator('.uipack-docs__block[data-block-id="budget-checker"]');
  await demo.getByRole("combobox").selectOption("label");
  const words = demo.getByRole("textbox");
  await words.fill("Validate");
  await expect(demo.getByRole("status")).toHaveText(/Fits the budget/);
  await words.fill("This service checks that each request is valid.");
  await expect(demo.getByRole("status")).toHaveText(/Over budget/);
});

test("an address into a Rules page's section lands on that heading", async ({ page }) => {
  await page.goto("/foundations/style#where-the-code-stands");
  await expect(page.locator("#where-the-code-stands")).toBeInViewport();
});

test("guides fit a phone: no page overflow at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const guide of guides) {
    await page.goto(`${guide.path}?theme=dark`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, guide.path).toBeLessThanOrEqual(0);
  }
});

test("the overview renders docs/system/README.md with the live swap demo, and the pager walks the recipes", async ({ page }) => {
  await page.goto("/foundations?theme=light");
  await waitForPage(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("The UI Pack design system");
  // The demo block sits in the page, outside the prose, and it works: swapping the writing changes the slide.
  const demo = page.locator('.uipack-docs__block[data-block-id="layer-swap"]');
  await expect(demo).toHaveAttribute("data-width", "wide");
  await expect(demo.getByRole("heading", { name: "Swap one layer at a time" })).toBeVisible();
  await demo.getByRole("radio", { name: "Review meetings" }).check();
  await expect(demo.getByText("Review decisions: 3 meetings → 1").first()).toBeVisible();
  // Links in the doc go to the site's pages for those files.
  await expect(
    page.locator("main .uipack-docs__prose").getByRole("link", { name: "Writing", exact: true }).first(),
  ).toHaveAttribute("href", "/foundations/writing?theme=light");
  await page.goto("/recipes?theme=light");
  const pager = page.getByRole("navigation", { name: "Previous and next documentation pages" });
  await expect(pager.getByRole("link", { name: /Next.*Build a landing page/ })).toHaveAttribute(
    "href",
    "/recipes/landing?theme=light",
  );
  await page.goto("/recipes/landing?theme=light");
  await expect(page.getByRole("heading", { name: "Before you ship" })).toBeVisible();
});

test("at 390px a Rules table scrolls inside its own box and the page never widens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/foundations/writing/general", "/foundations?theme=light"]) {
    await page.goto(path);
    await waitForPage(page);
    await expect(page.locator("main .uipack-docs__table").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }
});

test("the guides use no emoji as icons", async ({ page }) => {
  for (const guide of guides) {
    await page.goto(`${guide.path}?theme=light`);
    await waitForPage(page);
    const text = await page.locator("main").innerText();
    expect(text, guide.path).not.toMatch(/\p{Extended_Pictographic}️?/u);
  }
});
