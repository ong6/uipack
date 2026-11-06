import { figureEntries } from "../playground/catalog";
import { expect, test, waitForPage, waitForStable } from "./fixtures";
import { ALL, GROUPS, currentLink, expectPageTitle, outline, sidebar, tabOf, title } from "./page-audit";

// Every page's own outline, tab title, phone header and overflow are checked in page-audit.spec.ts.
// This spec covers moving between pages: the sidebar, the phone menu, previous and next, aliases,
// sub-views and fallbacks.
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("every page is reachable from the sidebar with the right current marker", async ({ page }) => {
  test.setTimeout(180_000); // visits every page, including the 3D and web ones, in dev mode
  // 1440: /web, which hosts a whole sample site, keeps the sidebar only from there (narrower, the menu).
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?theme=dark");
  // The sidebar is the manifest: its groups in order, each page under its group.
  await expect(sidebar(page).locator(".uipack-docs__nav-section > h2")).toHaveText(GROUPS.map((g) => g.label));
  for (const { group, label, path } of ALL) {
    await sidebar(page).getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${escape(path)}${path.includes("?") ? "&" : "\\?"}theme=dark$`));
    await expectPageTitle(page, label, path);
    if (path !== "/web") await expect(page).toHaveTitle(tabOf(label));
    await expect(currentLink(page)).toHaveText(label);
    await expect(currentLink(page)).toHaveCount(1);
    // The theme survives navigation, in the document and in every sidebar and header link.
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const hrefs = await page
      .locator(".showcase-header a, .showcase-frame > .uipack-docs > .uipack-docs__grid > .uipack-docs__sidebar a")
      .evaluateAll((els) => els.map((a) => a.getAttribute("href")));
    expect(hrefs.every((h) => h!.includes("theme=dark"))).toBe(true);
    await expect(page.locator(".showcase-context")).toContainText(group);
  }
});

test("previous and next follow the sidebar's order", async ({ page }) => {
  await page.goto("/foundations/writing?theme=light");
  const pager = page.getByRole("navigation", { name: "Previous and next documentation pages" });
  await expect(pager.getByRole("link", { name: /Previous.*Style roles/ })).toHaveAttribute(
    "href",
    "/foundations/style?theme=light",
  );
  await expect(pager.getByRole("link", { name: /Next.*Layout/ })).toHaveAttribute("href", "/foundations/layout?theme=light");
  // The first page has no previous link.
  await page.goto("/start");
  await expect(
    page.getByRole("navigation", { name: "Previous and next documentation pages" }).locator('[rel="prev"]'),
  ).toHaveCount(0);
});

test("every page links its Markdown source, served as plain text, and its GitHub edit page", async ({ page, request }) => {
  for (const [path, file] of [
    ["/foundations", "docs/system/README.md"],
    ["/charts", "docs/charts.md"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("link", { name: "View as Markdown" })).toHaveAttribute("href", `/${file}`);
    await expect(page.getByRole("link", { name: "Edit on GitHub" })).toHaveAttribute(
      "href",
      `https://github.com/ong6/uipack/edit/main/${file}`,
    );
    const raw = await request.get(`/${file}`);
    expect(raw.headers()["content-type"]).toContain("text/markdown");
    expect(await raw.text()).toMatch(/^# /);
  }
});

test("the theme toggle updates the sidebar links and keeps the page", async ({ page }) => {
  await page.goto("/charts?theme=light");
  await page.getByRole("button", { name: "dark mode", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(sidebar(page).getByRole("link", { name: "Article parts" })).toHaveAttribute("href", "/article?theme=dark");
  await expect(sidebar(page).getByRole("link", { name: "Overview" })).toHaveAttribute("href", "/foundations?theme=dark");
  await expect(currentLink(page)).toHaveText("Charts");
});

test("aliases /diagrams, /drill and /slides open their pages", async ({ page }) => {
  await page.goto("/diagrams?theme=dark");
  await expect(title(page)).toHaveText("Architecture diagrams");
  await expect(currentLink(page)).toHaveText("Architecture diagrams");
  await expect(page.locator('section[data-section="pipeline"]')).toBeVisible();
  // /drill is the diagrams page opened at its drill-down section.
  await page.goto("/drill?theme=dark");
  await expect(title(page)).toHaveText("Architecture diagrams");
  await expect(currentLink(page)).toHaveText("Architecture diagrams");
  await expect(page.locator('section[data-section="drill-figure"]')).toBeInViewport();
  await page.goto("/slides");
  await expect(title(page)).toHaveText("3D animations");
  await expect(currentLink(page)).toHaveText("3D animations");
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
  const found = numbers
    .map((t) => t.match(/Figure (\d+)/)?.[1])
    .filter(Boolean)
    .map(Number);
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

test.describe("390px header and menu", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the menu button names where you are, lists every page, navigates and keeps the theme", async ({ page }) => {
    await page.goto("/charts?theme=dark");
    const button = page.locator(".showcase-menu-button");
    await expect(button).toHaveAccessibleName("Components: Charts");
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
    await expect(page.locator(".showcase-menu-button")).toHaveAccessibleName("Reference: Icons & marks");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("Escape and Close both close the menu and return focus to the button", { tag: "@cross-browser" }, async ({ page }) => {
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

  test(
    "Tab and Shift+Tab cycle the menu's own controls, never the dialog box or the page",
    { tag: "@cross-browser" },
    async ({ page, browserName }) => {
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
        expect(
          await page.evaluate(
            () => document.activeElement?.closest("dialog") !== null && /^(A|BUTTON)$/.test(document.activeElement!.tagName),
          ),
        ).toBe(true);
      }
      await expect(close).toBeFocused();
      await page.keyboard.press(`Shift+${tab}`);
      await expect(sheet.getByRole("link").last()).toBeFocused();
    },
  );

  test("the open menu locks the page's scroll and gives it back on close", { tag: "@cross-browser" }, async ({ page }) => {
    await page.goto("/charts");
    await expect(page.locator(".showcase-loading")).toHaveCount(0);
    await page.evaluate(() => scrollTo(0, 400));
    const overflow = () => page.evaluate(() => getComputedStyle(document.documentElement).overflow);
    const before = await overflow();
    // Opened where the page is (a pointer click would scroll the button into view first).
    await page.locator(".showcase-menu-button").evaluate((b: HTMLButtonElement) => b.click());
    await expect(page.getByRole("dialog", { name: "Library menu" })).toBeVisible();
    expect(await overflow()).toBe("hidden");
    const at = await page.evaluate(() => scrollY);
    expect(at).toBeGreaterThan(0);
    await page.mouse.move(195, 600);
    await page.mouse.wheel(0, 600);
    // A wheel or swipe over the sheet does not move the page behind it.
    await page.waitForTimeout(200); // watching that nothing moves needs time to pass
    expect(await page.evaluate(() => scrollY)).toBe(at);
    await page.keyboard.press("Escape");
    await expect.poll(overflow).toBe(before);
    await page.mouse.move(195, 600);
    await page.mouse.wheel(0, 300);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  });

  test("the theme icon button has a name and flips the theme", async ({ page }) => {
    await page.goto("/?theme=light");
    await page.getByRole("button", { name: "dark mode", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "light mode", exact: true })).toBeVisible();
  });
});

test("/web keeps the menu below 1440px, so its sample site gets a desktop width", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/web");
  await expect(sidebar(page)).toBeHidden();
  await expect(page.locator(".showcase-menu-button")).toBeVisible();
  expect(await page.locator(".web-example").evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(1024);
  await page.setViewportSize({ width: 1440, height: 800 });
  await expect(sidebar(page)).toBeVisible();
  expect(await page.locator(".web-example").evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThanOrEqual(1024);
});

test.describe("the sidebar from 900px, the menu below", () => {
  test("768px uses the menu button and hides the sidebar; 1024px shows the sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto("/charts");
    await expect(sidebar(page)).toBeHidden();
    await expect(page.locator(".showcase-menu-button")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(sidebar(page)).toBeVisible();
    await expect(page.locator(".showcase-menu-button")).toBeHidden();
    const heights = await sidebar(page)
      .getByRole("link")
      .evaluateAll((els) => els.map((a) => a.getBoundingClientRect().height));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(32);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024);
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
    await expect(currentLink(page)).toHaveText(current);
    await expect(currentLink(page)).toHaveCount(1);
  }
  await page.goto("/deck?deck=bento");
  await expect(sidebar(page).getByRole("link", { name: "Consulting" })).toHaveAttribute(
    "href",
    "/deck?deck=consulting&theme=light",
  );
});

test.describe("deck sub-views in the 390px menu", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("they sit indented under a Deck player label and the current one is marked", async ({ page }) => {
    await page.goto("/deck?deck=consulting");
    await expect(page.locator(".showcase-menu-button")).toHaveAccessibleName("Components: Consulting");
    await page.locator(".showcase-menu-button").click();
    const sheet = page.getByRole("dialog", { name: "Library menu" });
    await expect(sheet.getByRole("group", { name: "Components" }).locator(".showcase-menu__sub")).toHaveText("Deck player");
    await expect(sheet.locator('[aria-current="page"]')).toHaveText("Consulting");
    const pad = async (name: string) =>
      sheet.getByRole("link", { name, exact: true }).evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft));
    expect(await pad("Bento")).toBeGreaterThan(await pad("Slide starters"));
    await sheet.getByRole("link", { name: "Bento", exact: true }).click();
    await expect(page).toHaveURL(/\/deck\?deck=bento&theme=light$/);
    await expect(page.locator(".showcase-menu-button")).toHaveAccessibleName("Components: Bento");
  });
});

test.describe("desktop sidebar groups", () => {
  test.use({ viewport: { width: 1280, height: 900 } });
  test("Foundations lists the seven guides the pager walks, nothing else", async ({ page }) => {
    await page.goto("/foundations/writing");
    const foundations = sidebar(page).locator(".uipack-docs__nav-section", {
      has: page.getByRole("heading", { name: "Foundations" }),
    });
    await expect(foundations.getByRole("link")).toHaveText([
      "Overview",
      "Style roles",
      "Writing",
      "Layout",
      "Mix and match",
      "Recipes",
      "Do and don't",
    ]);
  });

  test("deck sub-views sit indented under Deck player, and the h1 names the sub-view", async ({ page }) => {
    await page.goto("/deck?deck=bento");
    const run = sidebar(page).getByRole("list", { name: "Deck player" });
    await expect(run).toBeVisible();
    await expect(run.getByRole("link")).toHaveText(["Tech talk", "Bento", "Consulting"]);
    await expect(run.getByRole("link", { name: "Bento" })).toHaveAttribute("aria-current", "page");
    // Slide starters is a page of its own, outside the run.
    await expect(sidebar(page).getByRole("link", { name: "Slide starters" })).toBeVisible();
    await expect(run.getByRole("link", { name: "Slide starters" })).toHaveCount(0);
    // The sub-views' text starts past their page's, so they read as its views.
    const textLeft = (a: HTMLElement | SVGElement) =>
      a.getBoundingClientRect().left + parseFloat(getComputedStyle(a).paddingLeft);
    const parent = await sidebar(page).getByRole("link", { name: "Deck player", exact: true }).evaluate(textLeft);
    expect(await run.getByRole("link").first().evaluate(textLeft)).toBeGreaterThan(parent);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Deck player · Bento");
  });
});

test.describe("landmarks and skip link", () => {
  for (const width of [1280, 390]) {
    test(
      `${width}px: banner outside main, a skip link first that lands in main`,
      { tag: "@cross-browser" },
      async ({ page, browserName }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/charts");
        // Tab order is only final once the lazy page has rendered its controls into main.
        await waitForPage(page);
        // One banner (the shell header) and one main; the navs sit in the banner, not in main.
        await expect(page.getByRole("banner")).toHaveCount(1);
        await expect(page.getByRole("main")).toHaveCount(1);
        await expect(page.locator("main header, main nav.uipack-docs__navigation")).toHaveCount(0);
        await expect(page.locator("main h1")).toHaveText("Charts");
        // The skip link is hidden (a clipped 1px box) until it takes focus, as the first Tab stop.
        const skip = page.getByRole("link", { name: "Skip to documentation content" });
        expect((await skip.boundingBox())!.width).toBeLessThanOrEqual(1);
        const firstFocusable = await page.evaluate(
          () =>
            document.querySelector<HTMLElement>(
              "a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex='-1'])",
            )?.textContent,
        );
        expect(firstFocusable).toBe("Skip to documentation content");
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
      },
    );
  }
});

test("an unknown address says so and links to every page", async ({ page }) => {
  await page.goto("/nope?theme=dark");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  await expect(page).toHaveTitle("Page not found · uipack");
  // Not the diagrams page in disguise.
  await expect(page.locator('section[data-section="pipeline"]')).toHaveCount(0);
  await expect(currentLink(page)).toHaveCount(0);
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
  await expect(page.getByRole("status").filter({ hasText: "not found" })).toHaveText(
    "Deck “bogus” not found, showing Tech talk.",
  );
  await expect(title(page)).toHaveText("Deck player · Tech talk");
  await page.goto("/deck?deck=bento");
  await expect(page.locator(".showcase-title__note")).toHaveCount(0);
  await page.goto("/deck");
  await expect(page.locator(".showcase-title__note")).toHaveCount(0);
});

test.describe("a #fragment link opens its target once the lazy page has rendered", () => {
  for (const [width, height] of [
    [1280, 800],
    [390, 844],
  ] as const) {
    test(`${width}px: /web#web-pricing lands on the pricing section, focused, as the sample's own Pricing link does`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/web#web-pricing");
      const pricing = page.locator("#web-pricing");
      await expect(pricing).toBeFocused();
      const heading = pricing.getByRole("heading", { level: 2 });
      await expect(heading).toBeInViewport();
      // It stays put while the faces and images above it settle.
      await waitForStable(() => heading.evaluate((h) => Math.round(h.getBoundingClientRect().top)));
      const landed = await heading.evaluate((h) => Math.round(h.getBoundingClientRect().top));
      expect(landed).toBeGreaterThan(0);
      expect(landed).toBeLessThan(height / 2);
    });
  }

  test("every page benefits: /#decision-tree and /article#callout", async ({ page }) => {
    for (const [path, id] of [
      ["/#decision-tree", "decision-tree"],
      ["/article#callout", "callout"],
    ]) {
      await page.goto(path);
      const target = page.locator(`#${id}`);
      await expect(target).toBeFocused();
      await waitForStable(() => target.evaluate((el) => Math.round(el.getBoundingClientRect().top)));
      expect(await target.evaluate((el) => el.getBoundingClientRect().top)).toBeLessThan(200);
      expect(await target.evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThan(-1);
      // The tabindex that let it take focus goes when focus moves on.
      await page.keyboard.press("Tab");
      await expect(target).not.toHaveAttribute("tabindex");
    }
  });
});

test("a bad deck view or slide is said in a note, not ignored", async ({ page }) => {
  await page.goto("/deck?view=bogus");
  await expect(page.locator(".showcase-title__note")).toHaveText("View “bogus” not found, showing the present view.");
  await expect(page.getByRole("region", { name: "Deck player example" })).toBeVisible();
  await page.goto("/deck?slide=nope");
  await expect(page.locator(".showcase-title__note")).toHaveText("Slide “nope” not found, showing slide 1.");
  for (const ok of ["/deck?view=read", "/deck?view=present&slide=fix"]) {
    await page.goto(ok);
    await expect(page.getByRole("region", { name: "Deck player example" })).toBeVisible();
    await expect(page.locator(".showcase-title__note")).toHaveCount(0);
  }
});

test("the deck's print page and speaker window name themselves: tab title and one h1", async ({ page }) => {
  for (const [path, name] of [
    ["/deck?view=print", "Print view"],
    ["/deck?presenter=1", "Speaker view"],
    ["/deck?deck=bento&presenter=1", "Speaker view"],
  ] as const) {
    await page.goto(path);
    const deckName = path.includes("bento") ? "Bento" : "Tech talk";
    await expect(page).toHaveTitle(`${name} · ${deckName} · Deck player · uipack`);
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(`${deckName} deck, ${name.toLowerCase()}`);
  }
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
  await expect(currentLink(page)).toHaveText("Docs layout");
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
