import { libraryPages } from "../playground/catalog";
import { expect, test } from "./fixtures";

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
    await expect(page.locator("h1, .showcase-title__name").first()).toHaveText(guide.label);
    // The page module loads after the shell; wait for its first section.
    await expect(page.locator("main > section h2").first()).toBeVisible();
    // Links inside closed disclosures are in the DOM too.
    const hrefs = await page.locator("main a[href]").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    for (const href of hrefs) {
      const url = new URL(href);
      if (url.origin === new URL(page.url()).origin) links.add(url.pathname + url.search);
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
