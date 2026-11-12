// The Assets tab (/gallery): a mode of the one shell, a card for every registered asset, each card
// linking to the docs page that documents it, and each of those pages linking back.
import { test, expect } from "./fixtures";

for (const theme of ["light", "dark"] as const)
  for (const width of [390, 1440]) {
    test(`assets gallery renders every card, fits and stays quiet ${theme} ${width}`, async ({ page }) => {
      // 115 live previews mount as the page scrolls; on CI's software rendering the two polls below
      // can take most of their 30 s each, so the test gets room for them.
      test.setTimeout(90_000);
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/gallery?theme=${theme}`);
      await expect(page.getByRole("heading", { level: 1, name: "Assets" })).toBeVisible();
      await expect(page).toHaveTitle("Assets · UiPack");
      await expect(page.getByRole("navigation", { name: "Views" }).getByRole("link", { name: "Assets" })).toHaveAttribute(
        "aria-current",
        "true",
      );
      const cards = page.locator("[data-gallery-item]");
      expect(await cards.count()).toBeGreaterThan(100);
      // Scroll to the bottom (the page can grow as previews mount); the poll reports where it is.
      await expect
        .poll(
          async () => {
            await page.evaluate(() => scrollBy(0, 900));
            return page.evaluate(() => {
              const doc = document.documentElement;
              const bottom = scrollY + innerHeight >= doc.scrollHeight - 2;
              return bottom ? "bottom" : `at ${Math.round(scrollY + innerHeight)} of ${doc.scrollHeight}`;
            });
          },
          { timeout: 30_000, intervals: [100] },
        )
        .toBe("bottom");
      // Then every preview has mounted; the poll names any card still empty.
      await expect
        .poll(
          () =>
            page.evaluate(() =>
              [...document.querySelectorAll<HTMLElement>("[data-gallery-item]")]
                .filter((card) => !card.querySelector(".gallery-preview")?.children.length)
                .map((card) => card.dataset.galleryItem),
            ),
          { timeout: 30_000, intervals: [250] },
        )
        .toEqual([]);
      // Previews are pictures: hidden from assistive tech and out of the Tab order.
      expect(await page.locator(".gallery-preview:not([aria-hidden='true']), .gallery-preview:not([inert])").count()).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      expect(errors).toEqual([]);
    });
  }

// The banner's logo and last control sit on the grid's left and right edges, within 1px.
for (const width of [1920, 1440, 390])
  test(`the banner keeps the grid's edges at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/gallery?theme=light");
    await expect(page.getByRole("heading", { level: 1, name: "Assets" })).toBeVisible();
    const g = await page.evaluate(() => {
      const box = (s: string) => document.querySelector(s)!.getBoundingClientRect();
      const grid = box(".gallery-grid");
      return { brand: box(".showcase-brand svg").left, last: box(".showcase-header__actions > :last-child").right, grid };
    });
    expect(Math.abs(g.brand - g.grid.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(g.last - g.grid.right)).toBeLessThanOrEqual(1);
  });

test("every card links to a docs page that exists", async ({ page }) => {
  await page.goto("/gallery?theme=light");
  await expect(page.locator(".gallery-card__link").first()).toBeVisible();
  const hrefs = await page.locator(".gallery-card__link").evaluateAll((links) => links.map((a) => a.getAttribute("href")));
  expect(hrefs.every(Boolean)).toBe(true);
  const pages = [...new Set(hrefs.map((h) => h!.split("#")[0]))];
  expect(pages.length).toBeGreaterThan(8);
  for (const href of pages) {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toHaveCount(0);
  }
});

test("the filters show one category at a time and keep it in the address", async ({ page }) => {
  await page.goto("/gallery?theme=light");
  await expect(page.locator(".gallery-card").first()).toBeVisible();
  const filters = page.getByRole("group", { name: "Show" });
  await filters.getByRole("button", { name: /^Slides/ }).click();
  await expect(filters.getByRole("button", { name: /^Slides/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/type=slides/);
  await expect(page.locator(".gallery-section")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 2, name: "Slides" })).toBeVisible();
  await page.reload();
  await expect(page.locator(".gallery-section")).toHaveCount(1);
  await filters.getByRole("button", { name: /^All/ }).click();
  await expect(page).not.toHaveURL(/type=/);
  expect(await page.locator(".gallery-section").count()).toBeGreaterThan(4);
});

test("a docs page links to its assets, and the Docs tab is current there", async ({ page }) => {
  await page.goto("/components/diagrams?theme=light");
  const views = page.getByRole("navigation", { name: "Views" });
  await expect(views.getByRole("link", { name: "Docs" })).toHaveAttribute("aria-current", "true");
  await page.getByRole("link", { name: "See it in Assets" }).click();
  await expect(page).toHaveURL(/\/gallery\?theme=light#gallery-architecture/);
  await expect(page.getByRole("heading", { level: 2, name: "Architecture" })).toBeVisible();
});

test("a card is one Tab stop and opens its docs page", async ({ page }) => {
  await page.goto("/gallery?theme=light");
  await expect(page.locator(".gallery-card__link").first()).toBeVisible();
  const first = page.locator(".gallery-card__link").first();
  await first.focus();
  await expect(first).toBeFocused();
  const href = await first.getAttribute("href");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(href!.split("?")[0].replace(/\//g, "\\/")));
});

test("on a phone, a docs page keeps the two views in its header", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/components/diagrams?theme=light");
  const views = page.getByRole("navigation", { name: "Views" });
  await expect(views).toBeVisible();
  await expect(views.getByRole("link", { name: "Docs" })).toHaveAttribute("aria-current", "true");
  for (const link of await views.getByRole("link").all()) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await views.getByRole("link", { name: "Assets" }).click();
  await expect(page).toHaveURL(/\/gallery/);
  // The Assets view has no menu button, so its tabs stay in the header.
  await expect(page.locator(".showcase-tabs")).toBeVisible();
});

test("previews fill in without scrolling, so a card jumped or scrolled past is never left empty", async ({ page }) => {
  // Idle-time mounting, not the viewport, is what this covers: the page never moves.
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/gallery?theme=light#gallery-icons");
  await expect(page.locator("[data-gallery-item]").first()).toBeAttached();
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>("[data-gallery-item]")]
            .filter((card) => !card.querySelector(".gallery-preview")?.children.length)
            .map((card) => card.dataset.galleryItem),
        ),
      { timeout: 60_000, intervals: [500] },
    )
    .toEqual([]);
});
