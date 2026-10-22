import { expect, test, type Page } from "@playwright/test";

// The expected information architecture, written out on purpose: a change to
// catalog.ts that moves a page must change this table too.
const GROUPS = [
  { label: "Diagrams", opens: "Architecture diagrams", pages: [["Architecture diagrams", "/"], ["Charts", "/charts"], ["Drill-down", "/drill"], ["Article parts", "/article"]] },
  { label: "Presentations", opens: "Tech talk", pages: [["Tech talk", "/deck?deck=moves"], ["Bento", "/deck?deck=bento"], ["Consulting", "/deck?deck=consulting"], ["Slide starters", "/presentations"]] },
  { label: "Motion & 3D", opens: "3D animations", pages: [["3D animations", "/animations"], ["Mechanism", "/mechanism"]] },
  { label: "Web", opens: "Web UI", pages: [["Web UI", "/web"], ["Docs layout", "/docs"]] },
  { label: "Foundations", opens: "Styles", pages: [["Styles", "/styles"], ["Icons & marks", "/assets"]] },
] as const;
const ALL = GROUPS.flatMap((g) => g.pages.map(([label, path]) => ({ group: g.label, label, path })));

// /web renders a whole landing page, including its own hero h1, inside the shell, and
// DeckShowcase still renders its own "Deck player" h1 and each slide an h1 beside the shell's. Both belong to
// other branches; drop the deck entries once DeckShowcase stops rendering an h1.
// /web hosts a complete sample landing page: its hero is the one h1 and the shell title is plain text.
const EMBEDDED_H1 = new Set<string>();
const title = (page: Page) => page.locator(".showcase-title h1, .showcase-title .showcase-title__name");

// Deck sub-views share one page title.
const h1Of = (label: string) => (["Tech talk", "Bento", "Consulting"].includes(label) ? "Deck player" : label);
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const groupsNav = (page: Page) => page.getByRole("navigation", { name: "Library groups" });
const pagesNav = (page: Page) => page.getByRole("navigation", { name: "Library pages" });

// Heading levels in document order, ignoring hidden headings.
async function outline(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6")]
      .filter((h) => h.getClientRects().length > 0)
      .map((h) => ({ level: Number(h.tagName[1]), text: h.textContent?.trim() ?? "" })),
  );
}

test("every page is reachable through both nav rows with the right current markers", async ({ page }) => {
  test.setTimeout(90_000); // visits every page, including the 3D and web ones, in dev mode
  await page.goto("/?theme=dark");
  for (const group of GROUPS) {
    await groupsNav(page).getByRole("link", { name: group.label, exact: true }).click();
    // A group opens on its default page.
    await expect(pagesNav(page).locator('[aria-current="page"]')).toHaveText(group.opens);
    await expect(groupsNav(page).locator('[aria-current="page"]')).toHaveText(group.label);
    await expect(groupsNav(page).locator('[aria-current="page"]')).toHaveCount(1);
    await expect(pagesNav(page).getByRole("link")).toHaveText(group.pages.map(([label]) => label));
    for (const [label, path] of group.pages) {
      await pagesNav(page).getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${escape(path)}${path.includes("?") ? "&" : "\\?"}theme=dark$`));
      await expect(title(page)).toHaveText(h1Of(label));
      await expect(pagesNav(page).locator('[aria-current="page"]')).toHaveText(label);
      await expect(groupsNav(page).locator('[aria-current="page"]')).toHaveText(group.label);
      // The theme survives navigation, in the document and in every nav link.
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      const hrefs = await page.locator(".showcase-header a").evaluateAll((els) => els.map((a) => a.getAttribute("href")));
      expect(hrefs.every((h) => h!.includes("theme=dark"))).toBe(true);
      await expect(page.locator(".showcase-context")).toContainText(group.label);
    }
  }
});

test("the theme toggle updates the nav links and keeps the page", async ({ page }) => {
  await page.goto("/charts?theme=light");
  await page.getByRole("button", { name: "dark mode", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(pagesNav(page).getByRole("link", { name: "Article parts" })).toHaveAttribute("href", "/article?theme=dark");
  await expect(groupsNav(page).getByRole("link", { name: "Foundations" })).toHaveAttribute("href", "/styles?theme=dark");
  await expect(pagesNav(page).locator('[aria-current="page"]')).toHaveText("Charts");
});

test("aliases /diagrams and /slides open their pages", async ({ page }) => {
  await page.goto("/diagrams?theme=dark");
  await expect(title(page)).toHaveText("Architecture diagrams");
  await expect(pagesNav(page).locator('[aria-current="page"]')).toHaveText("Architecture diagrams");
  await expect(page.locator('section[data-section="presets"]')).toBeVisible();
  await page.goto("/slides");
  await expect(title(page)).toHaveText("3D animations");
  await expect(groupsNav(page).locator('[aria-current="page"]')).toHaveText("Motion & 3D");
  await expect(pagesNav(page).locator('[aria-current="page"]')).toHaveText("3D animations");
});

test("diagrams page has its named sections and charts moved out", async ({ page }) => {
  await page.goto("/");
  const headings = (await outline(page)).filter((h) => h.level === 2).map((h) => h.text);
  expect(headings).toEqual(["Presets", "Reference figure", "Parts", "Bare figure"]);
  await expect(page.locator("#layer-stack, #span-chart")).toHaveCount(0);
  await page.goto("/charts");
  expect((await outline(page)).filter((h) => h.level === 2).map((h) => h.text)).toEqual(["Layer stack", "Span chart"]);
});

test("assets page lists no diagrams", async ({ page }) => {
  await page.goto("/assets");
  await page.locator(".uipack-browser__card").first().waitFor();
  const cats = await page.locator(".uipack-browser__cat").allTextContents();
  expect(cats.map((c) => c.replace(/\d+$/, "").trim())).toEqual(["All", "Icons", "Motion", "Backgrounds", "Marks"]);
});

test.describe("headings", () => {
  for (const { label, path } of ALL) {
    test(`${label}: one h1 (the shell's), sentence-case h2s, no skipped levels`, async ({ page }) => {
      await page.goto(path);
      if (EMBEDDED_H1.has(path)) await expect.poll(() => page.locator("h1").count()).toBeGreaterThanOrEqual(2);
      else await expect(page.locator("h1")).toHaveCount(1);
      await expect(title(page)).toHaveText(h1Of(label));
      await expect(page.locator(".showcase-title > p:not(.showcase-title__name)")).not.toBeEmpty();
      // Wait for the page body to render (lazy chunks) before reading the outline.
      await expect(page.locator(".showcase-shell > section, .showcase-shell > div:not(.showcase-title)").first()).toBeVisible();
      const headings = await outline(page);
      if (EMBEDDED_H1.has(path)) expect(headings.filter((h) => h.level === 1).length).toBeGreaterThanOrEqual(2);
      else expect(headings.filter((h) => h.level === 1)).toHaveLength(1);
      let previous = 0;
      for (const h of headings) {
        expect(h.level, `"${h.text}" follows an h${previous}`).toBeLessThanOrEqual(previous + 1);
        previous = h.level;
      }
      if (path !== "/web") {
        for (const h of headings.filter((h) => h.level === 2)) {
          expect(h.text, "h2 reads as a title, not a path or a counter").not.toMatch(/[/·]|^[a-z]/);
        }
      }
    });
  }
});

// Mobile routes the owner asked to keep clean: no page-wide overflow at 390 and 768.
const MOBILE_ROUTES = ["/", "/charts", "/assets", "/styles", "/presentations", "/animations", "/docs", "/article"];

for (const width of [390, 768]) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const route of MOBILE_ROUTES) {
      for (const theme of ["light", "dark"]) {
        test(`${route} (${theme}): no page overflow`, async ({ page }) => {
          await page.goto(`${route}?theme=${theme}`);
          await expect(title(page)).toBeVisible();
          await page.waitForTimeout(300);
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        });
      }
    }
  });
}

test.describe("390px header and menu", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const { label, path } of ALL) {
    test(`${label}: compact header, 44px controls`, async ({ page }) => {
      await page.goto(path);
      await expect(title(page)).toHaveText(h1Of(label));
      const header = await page.locator(".showcase-header").boundingBox();
      expect(header!.height).toBeLessThanOrEqual(64);
      // The two desktop rows are not shown.
      await expect(groupsNav(page)).toBeHidden();
      await expect(pagesNav(page)).toBeHidden();
      for (const b of [page.locator(".showcase-menu-button"), page.locator("button.theme")]) {
        const box = (await b.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    });
  }

  test("the menu button names where you are, lists every page, navigates and keeps the theme", async ({ page }) => {
    await page.goto("/charts?theme=dark");
    const button = page.locator(".showcase-menu-button");
    await expect(button).toHaveAccessibleName("Diagrams · Charts");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await button.click();
    const sheet = page.getByRole("dialog", { name: "Library menu" });
    await expect(sheet).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    // Focus moved into the sheet.
    expect(await sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    // Every group heading and every page is listed, in order, with 48px rows.
    await expect(sheet.locator(".showcase-menu__group > p")).toHaveText(GROUPS.map((g) => g.label));
    await expect(sheet.getByRole("link")).toHaveText(ALL.map((p) => p.label));
    const heights = await sheet.getByRole("link").evaluateAll((els) => els.map((a) => a.getBoundingClientRect().height));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(48);
    // The current page is marked for assistive tech and visibly, beyond colour.
    const current = sheet.locator('[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText("Charts");
    expect(await current.evaluate((el) => getComputedStyle(el, "::after").content)).toContain("Current");
    const hrefs = await sheet.getByRole("link").evaluateAll((els) => els.map((a) => a.getAttribute("href")));
    expect(hrefs.every((h) => h!.endsWith("theme=dark"))).toBe(true);
    await sheet.getByRole("link", { name: "Icons & marks" }).click();
    await expect(page).toHaveURL(/\/assets\?theme=dark$/);
    await expect(title(page)).toHaveText("Icons & marks");
    await expect(page.locator(".showcase-menu-button")).toHaveAccessibleName("Foundations · Icons & marks");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("Escape and Close both close the menu and return focus to the button", async ({ page }) => {
    await page.goto("/");
    const button = page.locator(".showcase-menu-button");
    const sheet = page.getByRole("dialog", { name: "Library menu" });
    await button.click();
    await expect(sheet).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await button.click();
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(sheet).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("the theme icon button has a name and flips the theme", async ({ page }) => {
    await page.goto("/?theme=light");
    await page.getByRole("button", { name: "dark mode", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "light mode", exact: true })).toBeVisible();
  });
});

test.describe("tablet and desktop keep the two rows", () => {
  test.use({ viewport: { width: 768, height: 900 } });
  test("768px shows both rows and no menu button", async ({ page }) => {
    await page.goto("/charts");
    await expect(groupsNav(page)).toBeVisible();
    await expect(pagesNav(page)).toBeVisible();
    await expect(page.locator(".showcase-menu-button")).toBeHidden();
    const heights = await page.locator(".showcase-groups a, .showcase-pages a").evaluateAll((els) => els.map((a) => a.getBoundingClientRect().height));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
  });
});

test("deck sub-views: aria-current follows the deck query, defaulting to the first", async ({ page }) => {
  for (const [url, current] of [
    ["/deck", "Tech talk"],
    ["/deck?deck=moves", "Tech talk"],
    ["/deck?deck=bento&theme=dark", "Bento"],
    ["/deck?deck=consulting", "Consulting"],
    ["/deck?deck=unknown", "Tech talk"],
    ["/presentations", "Slide starters"],
  ] as const) {
    await page.goto(url);
    await expect(pagesNav(page).locator('[aria-current="page"]')).toHaveText(current);
    await expect(pagesNav(page).locator('[aria-current="page"]')).toHaveCount(1);
    await expect(groupsNav(page).locator('[aria-current="page"]')).toHaveText("Presentations");
  }
  await page.goto("/deck?deck=bento");
  await expect(pagesNav(page).getByRole("link", { name: "Consulting" })).toHaveAttribute("href", "/deck?deck=consulting&theme=light");
});

test.describe("deck sub-views in the 390px menu", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("they sit indented under a Deck player label and the current one is marked", async ({ page }) => {
    await page.goto("/deck?deck=consulting");
    await expect(page.locator(".showcase-menu-button")).toHaveAccessibleName("Presentations · Consulting");
    await page.locator(".showcase-menu-button").click();
    const sheet = page.getByRole("dialog", { name: "Library menu" });
    await expect(sheet.locator(".showcase-menu__sub")).toHaveText("Deck player");
    await expect(sheet.locator('[aria-current="page"]')).toHaveText("Consulting");
    const pad = async (name: string) =>
      sheet.getByRole("link", { name, exact: true }).evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft));
    expect(await pad("Bento")).toBeGreaterThan(await pad("Slide starters"));
    await sheet.getByRole("link", { name: "Bento", exact: true }).click();
    await expect(page).toHaveURL(/\/deck\?deck=bento&theme=light$/);
    await expect(page.locator(".showcase-menu-button")).toHaveAccessibleName("Presentations · Bento");
  });
});
