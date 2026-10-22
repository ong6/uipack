import { figureEntries, libraryGroups, pageDefs, pagePath } from "../playground/catalog";
import { expect, test, type Page } from "./fixtures";

// The information architecture the shell must render, read from the catalog: the groups in
// order, each with the page it opens on and its pages as [label, path].
const GROUPS = libraryGroups.map((g) => ({
  label: g.label,
  opens: pageDefs.find((p) => p.id === g.defaultPage)!.label,
  pages: pageDefs.filter((p) => p.group === g.id).map((p) => [p.label, pagePath(p)] as const),
}));
const ALL = GROUPS.flatMap((g) => g.pages.map(([label, path]) => ({ group: g.label, label, path })));

// /web hosts a complete sample landing page: its hero is the one h1 and the shell title is plain text.
const title = (page: Page) => page.locator(".showcase-title h1, .showcase-title .showcase-title__name");

// Deck sub-views share one page, named before the sub-view.
const isDeck = (label: string) => ["Tech talk", "Bento", "Consulting"].includes(label);
const h1Of = (label: string) => (isDeck(label) ? `Deck player · ${label}` : label);
// The browser tab: the sub-view first. /web too: its sample page keeps the rest of its own head.
const tabOf = (label: string) => (isDeck(label) ? `${label} · Deck player · uipack` : `${label} · uipack`);
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
      if (path !== "/web") await expect(page).toHaveTitle(tabOf(label));
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

test("aliases /diagrams, /drill and /slides open their pages", async ({ page }) => {
  await page.goto("/diagrams?theme=dark");
  await expect(title(page)).toHaveText("Architecture diagrams");
  await expect(pagesNav(page).locator('[aria-current="page"]')).toHaveText("Architecture diagrams");
  await expect(page.locator('section[data-section="pipeline"]')).toBeVisible();
  // /drill is the diagrams page opened at its drill-down section.
  await page.goto("/drill?theme=dark");
  await expect(title(page)).toHaveText("Architecture diagrams");
  await expect(pagesNav(page).locator('[aria-current="page"]')).toHaveText("Architecture diagrams");
  await expect(page.locator('section[data-section="drill-figure"]')).toBeInViewport();
  await page.goto("/slides");
  await expect(title(page)).toHaveText("3D animations");
  await expect(groupsNav(page).locator('[aria-current="page"]')).toHaveText("Motion & 3D");
  await expect(pagesNav(page).locator('[aria-current="page"]')).toHaveText("3D animations");
});

test("diagrams page has its named sections and charts moved out", async ({ page }) => {
  await page.goto("/");
  // The page's sections load after the shell (a lazy chunk).
  await page.locator("[data-section]").first().waitFor();
  const headings = (await outline(page)).filter((h) => h.level === 2).map((h) => h.text);
  // One section per pattern, simplest first, titled from figureEntries in catalog.ts.
  expect(headings).toEqual(figureEntries.map((e) => e.title));
  // Every section but the bare figure holds one numbered figure, numbered in page order.
  const numbers = await page.locator("[data-section] .uipack__eyebrow").allTextContents();
  const found = numbers.map((t) => t.match(/Figure (\d+)/)?.[1]).filter(Boolean).map(Number);
  expect(found).toEqual(found.map((_, i) => i + 1));
  expect(found).toHaveLength(headings.length - 1);
  await expect(page.locator("#layer-stack, #span-chart")).toHaveCount(0);
  await page.goto("/charts");
  await page.locator("#span-chart").waitFor();
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
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(title(page)).toHaveText(h1Of(label));
      await expect(page.locator(".showcase-title > p:not(.showcase-title__name)")).not.toBeEmpty();
      // Wait for the page body to render (lazy chunks) before reading the outline.
      await expect(page.locator(".showcase-shell > section, .showcase-shell > div:not(.showcase-title)").first()).toBeVisible();
      const headings = await outline(page);
      expect(headings.filter((h) => h.level === 1)).toHaveLength(1);
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
          // The lazily loaded page body and the fonts decide the width, not a fixed delay.
          await expect(page.locator(".showcase-shell > section, .showcase-shell > div:not(.showcase-title)").first()).toBeVisible();
          await page.evaluate(() => document.fonts.ready);
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
      // The menu button shows the page name whole, with its group small above it.
      const button = page.locator(".showcase-menu-button");
      await expect(button.locator(".showcase-menu-button__page")).toHaveText(label);
      await expect(button.locator(".showcase-menu-button__group")).toHaveText(ALL.find((p) => p.label === label)!.group);
      expect(await button.locator(".showcase-menu-button__page").evaluate((el) => {
        const b = el.closest("button")!.getBoundingClientRect();
        return el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().right <= b.right;
      })).toBe(true);
    });
  }

  test("the menu button names where you are, lists every page, navigates and keeps the theme", async ({ page }) => {
    await page.goto("/charts?theme=dark");
    const button = page.locator(".showcase-menu-button");
    await expect(button).toHaveAccessibleName("Diagrams: Charts");
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
    // The links are a navigation landmark, the phone's only one while the header's navs are hidden.
    await expect(sheet.getByRole("navigation", { name: "All library pages" }).getByRole("link")).toHaveCount(ALL.length);
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
    await expect(page.locator(".showcase-menu-button")).toHaveAccessibleName("Foundations: Icons & marks");
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

  test("Tab and Shift+Tab cycle the menu's own controls, never the dialog box or the page", async ({ page, browserName }) => {
    const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
    await page.goto("/charts");
    const sheet = page.getByRole("dialog", { name: "Library menu" });
    await page.locator(".showcase-menu-button").click();
    await expect(sheet).toBeVisible();
    const close = sheet.getByRole("button", { name: "Close" });
    await expect(close).toBeFocused();
    const stops = await sheet.locator("a[href], button").count();
    // One full lap and a step more: every stop is a link or Close inside the menu, and the lap ends on Close.
    for (let i = 0; i < stops; i++) {
      await page.keyboard.press(tab);
      expect(await page.evaluate(() => document.activeElement?.closest("dialog") !== null && /^(A|BUTTON)$/.test(document.activeElement!.tagName))).toBe(true);
    }
    await expect(close).toBeFocused();
    await page.keyboard.press(`Shift+${tab}`);
    await expect(sheet.getByRole("link").last()).toBeFocused();
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
    await expect(page.locator(".showcase-menu-button")).toHaveAccessibleName("Presentations: Consulting");
    await page.locator(".showcase-menu-button").click();
    const sheet = page.getByRole("dialog", { name: "Library menu" });
    await expect(sheet.locator(".showcase-menu__sub")).toHaveText("Deck player");
    await expect(sheet.locator('[aria-current="page"]')).toHaveText("Consulting");
    const pad = async (name: string) =>
      sheet.getByRole("link", { name, exact: true }).evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft));
    expect(await pad("Bento")).toBeGreaterThan(await pad("Slide starters"));
    await sheet.getByRole("link", { name: "Bento", exact: true }).click();
    await expect(page).toHaveURL(/\/deck\?deck=bento&theme=light$/);
    await expect(page.locator(".showcase-menu-button")).toHaveAccessibleName("Presentations: Bento");
  });
});

test("each page names itself in the browser tab, deck sub-views included", async ({ page }) => {
  for (const { label, path } of ALL) {
    await page.goto(path);
    await expect(page).toHaveTitle(tabOf(label));
  }
  // The deck sub-views tell their tabs apart.
  await page.goto("/deck?deck=bento");
  await expect(page).toHaveTitle("Bento · Deck player · uipack");
});

test.describe("desktop deck sub-views", () => {
  test.use({ viewport: { width: 1280, height: 900 } });
  test("sit together under a Deck player label, ended by a divider, and the h1 names the sub-view", async ({ page }) => {
    await page.goto("/deck?deck=bento");
    const run = pagesNav(page).getByRole("group", { name: "Deck player" });
    await expect(run).toBeVisible();
    await expect(run.getByRole("link")).toHaveText(["Tech talk", "Bento", "Consulting"]);
    await expect(run.getByRole("link", { name: "Bento" })).toHaveAttribute("aria-current", "page");
    // Slide starters is a page of its own, outside the run.
    await expect(pagesNav(page).getByRole("link", { name: "Slide starters" })).toBeVisible();
    await expect(run.getByRole("link", { name: "Slide starters" })).toHaveCount(0);
    // The label sits before the first sub-view on the same row.
    const label = (await run.locator(".showcase-pages__label").boundingBox())!;
    const first = (await run.getByRole("link").first().boundingBox())!;
    expect(label.x + label.width).toBeLessThanOrEqual(first.x + 1);
    expect(Math.abs(label.y + label.height / 2 - (first.y + first.height / 2))).toBeLessThan(2);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Deck player · Bento");
  });
});

test.describe("landmarks and skip link", () => {
  for (const width of [1280, 390]) {
    test(`${width}px: banner outside main, a skip link first that lands in main`, async ({ page, browserName }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/charts");
      // One banner (the shell header) and one main; the navs sit in the banner, not in main.
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.locator("main header, main nav.showcase-groups, main nav.showcase-pages")).toHaveCount(0);
      await expect(page.locator("main h1")).toHaveText("Charts");
      // The skip link is hidden until it takes focus, as the first Tab stop.
      const skip = page.getByRole("link", { name: "Skip to content" });
      expect((await skip.boundingBox())!.y + (await skip.boundingBox())!.height).toBeLessThanOrEqual(0);
      const firstFocusable = await page.evaluate(
        () => document.querySelector<HTMLElement>("a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex='-1'])")?.textContent,
      );
      expect(firstFocusable).toBe("Skip to content");
      // WebKit's default Tab reaches text fields only, so there the link takes focus directly.
      if (browserName === "webkit") await skip.focus();
      else await page.keyboard.press("Tab");
      await expect(skip).toBeFocused();
      const box = (await skip.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.height).toBeGreaterThanOrEqual(44);
      await page.keyboard.press("Enter");
      await expect(page.getByRole("main")).toBeFocused();
      // The next Tab continues from inside main, past the header.
      if (browserName === "webkit") return;
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest("main"))).toBe(true);
    });
  }
});

test("an unknown address says so and links to every page", async ({ page }) => {
  await page.goto("/nope?theme=dark");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  await expect(page).toHaveTitle("Page not found · uipack");
  // Not the diagrams page in disguise.
  await expect(page.locator('section[data-section="pipeline"]')).toHaveCount(0);
  await expect(groupsNav(page).locator('[aria-current="page"]')).toHaveCount(0);
  const links = page.getByRole("main").getByRole("link");
  await expect(links).toHaveCount(ALL.length);
  const hrefs = await links.evaluateAll((els) => els.map((a) => a.getAttribute("href")));
  expect(hrefs.every((h) => h!.endsWith("theme=dark"))).toBe(true);
  await page.getByRole("main").getByRole("link", { name: "Charts" }).click();
  await expect(page).toHaveURL(/\/charts\?theme=dark$/);
  await expect(title(page)).toHaveText("Charts");
});

test("an unknown deck shows a visible note and the default deck", async ({ page }) => {
  await page.goto("/deck?deck=bogus");
  await expect(page.getByRole("status").filter({ hasText: "not found" })).toHaveText("Deck “bogus” not found, showing Tech talk.");
  await expect(title(page)).toHaveText("Deck player · Tech talk");
  await page.goto("/deck?deck=bento");
  await expect(page.locator(".showcase-title__note")).toHaveCount(0);
  await page.goto("/deck");
  await expect(page.locator(".showcase-title__note")).toHaveCount(0);
});

test("while a page's chunk loads, the shell stays and a status line says what is loading", async ({ page }) => {
  // Hold the page module until the shell has been checked. Dev serves it as /DocsShowcase.tsx; a build as a hashed chunk.
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(/\/(assets\/)?DocsShowcase[-.][^/]*$/, async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/docs?theme=dark");
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(groupsNav(page).locator('[aria-current="page"]')).toHaveText("Web");
  await expect(pagesNav(page).locator('[aria-current="page"]')).toHaveText("Docs layout");
  await expect(title(page)).toHaveText("Docs layout");
  const status = page.getByRole("main").getByRole("status");
  await expect(status).toHaveText("Loading Docs layout…");
  const titleBox = await title(page).boundingBox();
  release();
  await expect(status).toHaveCount(0);
  await expect(page.locator('section[data-route="docs"]')).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
  // The page fills in below the intro; nothing above it moves.
  expect(await title(page).boundingBox()).toEqual(titleBox);
});
