import { libraryPages } from "../playground/catalog";
import { expect, test, waitForPage } from "./fixtures";
import { expectPageTitle } from "./page-audit";

// The Foundations guides link to each other, to the live pages and into the docs. Every internal
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

test("a guide's per-medium tabs work from the keyboard, and the full spec opens", async ({ page }) => {
  await page.goto("/foundations/style?theme=light");
  const tabs = page.getByRole("tablist", { name: "Style by medium" });
  const first = tabs.getByRole("tab").first();
  await first.focus();
  await page.keyboard.press("ArrowRight");
  const second = tabs.getByRole("tab").nth(1);
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toBeVisible();
  const spec = page.locator("details.fdn-spec");
  await expect(spec).not.toHaveAttribute("open");
  await spec.locator("summary").click();
  await expect(spec).toHaveAttribute("open");
});

test("an address into the full spec opens it at that heading", async ({ page }) => {
  await page.goto("/foundations/style#where-the-code-stands");
  await expect(page.locator("details.fdn-spec")).toHaveAttribute("open");
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

test("the overview renders docs/system/README.md with the live swap demo, and the pager walks the guides", async ({ page }) => {
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
  await page.goto("/foundations/recipes?theme=light");
  const pager = page.getByRole("navigation", { name: "Previous and next documentation pages" });
  await expect(pager.getByRole("link", { name: /Next.*Do and don't/ })).toHaveAttribute(
    "href",
    "/foundations/do-and-dont?theme=light",
  );
  await expect(page.getByRole("heading", { name: "Before you ship" })).toBeVisible();
});

test("at 390px a guide table stacks into rows that keep every column readable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/foundations/writing?theme=light");
  const table = page.getByRole("region", { name: "Slot budgets" });
  const row = table.locator("tbody tr").first();
  // Every cell sits inside the viewport, under its column name.
  for (const cell of await row.locator("th, td").all()) {
    const box = (await cell.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }
  await expect(row.locator("td").nth(1)).toHaveAttribute("data-label", "Budget");
  // A Markdown page's tables scroll inside their own box; the page never widens.
  await page.goto("/foundations?theme=light");
  await waitForPage(page);
  await expect(page.locator("main .uipack-docs__table").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("the guides use no emoji as icons", async ({ page }) => {
  for (const guide of guides) {
    await page.goto(`${guide.path}?theme=light`);
    await waitForPage(page);
    const text = await page.locator("main").innerText();
    expect(text, guide.path).not.toMatch(/\p{Extended_Pictographic}️?/u);
  }
});
