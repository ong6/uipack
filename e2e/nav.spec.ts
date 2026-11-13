import { figureEntries } from "../playground/catalog";
import { expect, test, waitForPage, waitForStable, type Locator, type Page } from "./fixtures";
import { ALL, SECTIONS, currentLink, expectPageTitle, outline, sidebar, tabOf, title } from "./page-audit";

// Every page's own outline, tab title, phone header and overflow are checked in page-audit.spec.ts.
// This spec covers moving between pages: the sidebar, the phone drawer, previous and next, aliases,
// sub-views and fallbacks. The sidebar's marker, search and widths are in docs-shell.spec.ts.
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("every page is reachable from the sidebar with the right current marker", async ({ page }) => {
  test.setTimeout(180_000); // visits every page, including the 3D and web ones, in dev mode
  // 1440: /web, which hosts a whole sample site, keeps the sidebar only from there (narrower, the menu).
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/what-uipack-is?theme=dark");
  // The sidebar is the manifest: its five sections in order, each page under its section.
  await expect(sidebar(page).locator(".uipack-docs__nav-label")).toHaveText(SECTIONS.map((s) => s.label));
  for (const { section, label, path } of ALL) {
    // A section the reader has not opened yet is opened first; open ones stay open from page to page.
    const heading = sidebar(page).getByRole("button", { name: section, exact: true });
    if ((await heading.getAttribute("aria-expanded")) === "false") await heading.click();
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
    await expect(page.locator(".showcase-crumb")).toHaveText(section);
  }
});

test("previous and next follow the sidebar's order", async ({ page }) => {
  await page.goto("/foundations/writing?theme=light");
  const pager = page.getByRole("navigation", { name: "Previous and next documentation pages" });
  await expect(pager.getByRole("link", { name: /Previous.*Style contract/ })).toHaveAttribute(
    "href",
    "/foundations/style?theme=light",
  );
  await expect(pager.getByRole("link", { name: /Next.*General writing rules/ })).toHaveAttribute(
    "href",
    "/foundations/writing/general?theme=light",
  );
  // The first page has no previous link.
  await page.goto("/what-uipack-is");
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
  await page.getByRole("button", { name: "Dark mode", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(sidebar(page).getByRole("link", { name: "Article parts" })).toHaveAttribute("href", "/article?theme=dark");
  await sidebar(page).getByRole("button", { name: "Rules", exact: true }).click();
  await expect(sidebar(page).getByRole("link", { name: "Core rules", exact: true })).toHaveAttribute(
    "href",
    "/foundations?theme=dark",
  );
  await expect(currentLink(page)).toHaveText("Charts");
});

test("aliases /diagrams, /drill and /slides open their pages", async ({ page }) => {
  await page.goto("/diagrams?theme=dark");
  await expectPageTitle(page, "Architecture diagrams", "/components/diagrams");
  await expect(currentLink(page)).toHaveText("Architecture diagrams");
  await expect(page.locator('section[data-section="pipeline"]')).toBeVisible();
  // /drill is the diagrams page opened at its drill-down section.
  await page.goto("/drill?theme=dark");
  await expectPageTitle(page, "Architecture diagrams", "/components/diagrams");
  await expect(currentLink(page)).toHaveText("Architecture diagrams");
  await expect(page.locator('section[data-section="drill-figure"]')).toBeInViewport();
  await page.goto("/slides");
  await expectPageTitle(page, "3D animations", "/animations");
  await expect(currentLink(page)).toHaveText("3D animations");
  // "/" is the landing page now; an old link into the catalogue's sections moves to its page, and
  // one into the "What UiPack is" page (which was "/" before the landing page) moves to that page.
  await page.goto("/#pipeline");
  await expect(page).toHaveURL(/\/components\/diagrams#pipeline$/);
  await expect(page.locator('section[data-section="pipeline"]')).toBeVisible();
  await page.goto("/#install");
  await expect(page).toHaveURL(/\/what-uipack-is#install$/);
  await expectPageTitle(page, "What UiPack is", "/what-uipack-is");
  await page.goto("/start");
  await expectPageTitle(page, "What UiPack is", "/what-uipack-is");
});

test("diagrams page has its named sections and charts moved out", async ({ page }) => {
  await page.goto("/components/diagrams");
  // The page's sections load after the shell (a lazy chunk).
  await page.locator("[data-section]").first().waitFor();
  const headings = await page.locator("[data-section] > h2").allTextContents();
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
  await expect(page.locator("#layer-stack")).toHaveCount(1);
  const heads = (await outline(page)).filter((h) => h.level === 2).map((h) => h.text);
  expect(heads.map((h) => h.replace(/\s*#$/, ""))).toEqual(expect.arrayContaining(["SpanChart", "LayerStack"]));
});

test("assets page lists no diagrams", async ({ page }) => {
  await page.goto("/assets");
  await page.locator(".uipack-browser__card").first().waitFor();
  const cats = await page.locator(".uipack-browser__cat").allTextContents();
  expect(cats.map((c) => c.replace(/\d+$/, "").trim())).toEqual(["All", "Icons", "Motion", "Backgrounds", "Marks"]);
});

test.describe("390px header and drawer", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the menu button opens the sidebar as a drawer: every section, the current page marked, navigates and keeps the theme", async ({
    page,
  }) => {
    await page.goto("/charts?theme=dark");
    const button = page.getByRole("button", { name: "Open navigation" });
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await button.click();
    const drawer = page.getByRole("dialog", { name: "Library menu" });
    await expect(drawer).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    // Focus moved into the drawer, which slides in from the left edge.
    expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await expect.poll(() => drawer.evaluate((el) => Math.round(el.getBoundingClientRect().left))).toBe(0);
    // Its sections are the sidebar's, the current one open; rows are 44px tap targets.
    await expect(drawer.locator(".uipack-docs__nav-label")).toHaveText(SECTIONS.map((s) => s.label));
    await expect(drawer.getByRole("button", { name: "Build", exact: true })).toHaveAttribute("aria-expanded", "true");
    const heights = await drawer
      .locator(".uipack-docs__nav-heading button, .uipack-docs__navigation > section[data-open] a")
      .evaluateAll((els) => els.filter((a) => a.getClientRects().length).map((a) => a.getBoundingClientRect().height));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
    const current = drawer.locator('[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText("Charts");
    // The current page is marked beyond colour: weight and a tinted row.
    expect(await current.evaluate((el) => getComputedStyle(el).fontWeight)).toBe("600");
    const hrefs = await drawer.getByRole("link").evaluateAll((els) => els.map((a) => a.getAttribute("href")));
    expect(hrefs.every((h) => h!.includes("theme=dark"))).toBe(true);
    await drawer.getByRole("button", { name: "Reference", exact: true }).click();
    await drawer.getByRole("link", { name: "Icons and marks" }).click();
    await expect(page).toHaveURL(/\/assets\?theme=dark$/);
    await expectPageTitle(page, "Icons and marks", "/assets");
    await expect(page.locator(".showcase-crumb")).toHaveText("Reference");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test(
    "Escape, the close button and the scrim close the drawer and return focus to the button",
    { tag: "@cross-browser" },
    async ({ page }) => {
      await page.goto("/components/diagrams");
      const button = page.getByRole("button", { name: "Open navigation" });
      const drawer = page.getByRole("dialog", { name: "Library menu" });
      await button.click();
      await expect(drawer).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(drawer).toBeHidden();
      await expect(button).toBeFocused();
      await expect(button).toHaveAttribute("aria-expanded", "false");
      await button.click();
      await drawer.getByRole("button", { name: "Close navigation" }).click();
      await expect(drawer).toBeHidden();
      await expect(button).toBeFocused();
      await button.click();
      await expect(drawer).toBeVisible();
      await page.mouse.click(380, 400);
      await expect(drawer).toBeHidden();
    },
  );

  test(
    "Tab and Shift+Tab cycle the drawer's own controls, never the dialog box or the page",
    { tag: "@cross-browser" },
    async ({ page, browserName }) => {
      const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
      await page.goto("/charts");
      const drawer = page.getByRole("dialog", { name: "Library menu" });
      await page.getByRole("button", { name: "Open navigation" }).click();
      await expect(drawer).toBeVisible();
      const stops = await drawer
        .locator("a[href], button")
        .evaluateAll((els) => els.filter((el) => el.getClientRects().length && !el.closest("[inert]")).length);
      for (let i = 0; i < stops + 1; i++) {
        await page.keyboard.press(tab);
        expect(
          await page.evaluate(
            () => document.activeElement?.closest("dialog") !== null && /^(A|BUTTON)$/.test(document.activeElement!.tagName),
          ),
        ).toBe(true);
      }
      await page.keyboard.press(`Shift+${tab}`);
      expect(await page.evaluate(() => document.activeElement?.closest("dialog") !== null)).toBe(true);
    },
  );

  test("the open drawer locks the page's scroll and gives it back on close", { tag: "@cross-browser" }, async ({ page }) => {
    await page.goto("/charts");
    await expect(page.locator(".showcase-loading")).toHaveCount(0);
    await page.evaluate(() => scrollTo(0, 400));
    const overflow = () => page.evaluate(() => getComputedStyle(document.documentElement).overflow);
    const before = await overflow();
    await page.getByRole("button", { name: "Open navigation" }).evaluate((b: HTMLButtonElement) => b.click());
    await expect(page.getByRole("dialog", { name: "Library menu" })).toBeVisible();
    expect(await overflow()).toBe("hidden");
    const at = await page.evaluate(() => scrollY);
    expect(at).toBeGreaterThan(0);
    await page.keyboard.press("Escape");
    await expect.poll(overflow).toBe(before);
    await page.mouse.move(195, 600);
    await page.mouse.wheel(0, 300);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(at - 1);
  });

  test("the theme icon button has a name and flips the theme", async ({ page }) => {
    await page.goto("/?theme=light");
    await page.getByRole("button", { name: "Dark mode", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("button", { name: "Light mode", exact: true })).toBeVisible();
  });
});

test("/web keeps the menu below 1440px, so its sample site gets a desktop width", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/web");
  await expect(sidebar(page)).toBeHidden();
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
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
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(sidebar(page)).toBeVisible();
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeHidden();
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

test.describe("deck sub-views in the 390px drawer", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("they hang under Deck player on its tree line and the current one is marked", async ({ page }) => {
    await page.goto("/deck?deck=consulting");
    await page.getByRole("button", { name: "Open navigation" }).click();
    const drawer = page.getByRole("dialog", { name: "Library menu" });
    const run = drawer.getByRole("list", { name: "Deck player" });
    await expect(run.getByRole("link")).toHaveText(["Tech talk", "Bento", "Consulting"]);
    await expect(drawer.locator('[aria-current="page"]')).toHaveText("Consulting");
    const pad = async (name: string) =>
      drawer.getByRole("link", { name, exact: true }).evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft));
    expect(await pad("Bento")).toBeGreaterThan(await pad("Slide starters"));
    await drawer.getByRole("link", { name: "Bento", exact: true }).click();
    await expect(page).toHaveURL(/\/deck\?deck=bento&theme=light$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Deck player · Bento");
  });
});

test.describe("desktop sidebar groups", () => {
  test.use({ viewport: { width: 1280, height: 900 } });
  test("Rules lists the guides the pager walks, nothing else", async ({ page }) => {
    await page.goto("/foundations/writing");
    const rules = sidebar(page).locator('.uipack-docs__nav-section[data-nav-section="rules"]');
    // The manifest's Rules section (the core rules, then the site specs under their caption),
    // sub-pages indented under Writing and Layout.
    await expect(rules.getByRole("link")).toHaveText(ALL.filter((p) => p.section === "Rules").map((p) => p.label));
    await expect(rules.locator(".uipack-docs__nav-caption")).toHaveText(["Site specs"]);
    await expect(sidebar(page).getByRole("list", { name: "Writing" }).getByRole("link")).toHaveText([
      "General writing rules",
      "Talks and slides",
      "Read-alone documents",
      "Web and landing copy",
      "Figure labels and captions",
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
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName("Deck player · Bento");
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
        await expectPageTitle(page, "Charts", "/charts");
        // The skip link is hidden (a clipped 1px box) until it takes focus, as the first Tab stop.
        const skip = page.getByRole("link", { name: "Skip to content" });
        expect((await skip.boundingBox())!.width).toBeLessThanOrEqual(1);
        const firstFocusable = await page.evaluate(
          () =>
            document.querySelector<HTMLElement>(
              "a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex='-1'])",
            )?.textContent,
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
      },
    );
  }
});

test("an unknown address says so and links to every page", async ({ page }) => {
  await page.goto("/nope?theme=dark");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  await expect(page).toHaveTitle("Page not found · UiPack");
  // Not the diagrams page in disguise.
  await expect(page.locator('section[data-section="pipeline"]')).toHaveCount(0);
  await expect(currentLink(page)).toHaveCount(0);
  const links = page.getByRole("main").getByRole("link");
  await expect(links).toHaveCount(ALL.length);
  const hrefs = await links.evaluateAll((els) => els.map((a) => a.getAttribute("href")));
  expect(hrefs.every((h) => h!.endsWith("theme=dark"))).toBe(true);
  await page.getByRole("main").getByRole("link", { name: "Charts" }).click();
  await expect(page).toHaveURL(/\/charts\?theme=dark$/);
  await expectPageTitle(page, "Charts", "/charts");
});

test("an unknown deck shows a visible note and the default deck", async ({ page }) => {
  await page.goto("/deck?deck=bogus");
  await expect(page.getByRole("status").filter({ hasText: "not found" })).toHaveText(
    "Deck “bogus” not found, showing Tech talk.",
  );
  await expect(title(page)).toHaveAccessibleName("Deck player · Tech talk");
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

  test("every page benefits: /components/diagrams#decision-tree and /article#callout", async ({ page }) => {
    for (const [path, id] of [
      ["/components/diagrams#decision-tree", "decision-tree"],
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
    await expect(page).toHaveTitle(`${name} · ${deckName} · Deck player · UiPack`);
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(`${deckName} deck, ${name.toLowerCase()}`);
  }
});

test("while a page's chunk loads, the shell stays and a status line says what is loading", async ({ page }) => {
  // Hold the page module until the shell has been checked. Dev serves it as /MarkdownShowcase.tsx; a build as a hashed chunk.
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(/\/(assets\/)?MarkdownShowcase[-.][^/]*$/, async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/docs?theme=dark");
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(currentLink(page)).toHaveText("Docs layout");
  const status = page.getByRole("main").getByRole("status");
  await expect(status).toHaveText("Loading Docs layout…");
  // The page eases in (a short fade and rise): measure once that entrance is over.
  const entered = () =>
    page.getByRole("main").evaluate((main) => Promise.all(main.getAnimations().map((a) => a.finished.catch(() => null))));
  await entered();
  const context = await page.locator(".showcase-context").boundingBox();
  release();
  await expect(status).toHaveCount(0);
  await expectPageTitle(page, "Docs layout", "/docs");
  await expect(page.locator('section[data-route="docs"]')).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
  // The page fills in below the context row; nothing above it moves.
  await entered();
  expect(await page.locator(".showcase-context").boundingBox()).toEqual(context);
});

// Every page is a full load whose content mounts after the browser has tried to restore the scroll
// position, so the site keeps and restores it itself (playground/scroll-memory.ts).
test.describe("Back returns the reader to where they were", () => {
  const pageY = (page: Page) => page.evaluate(() => Math.round(window.scrollY));
  const topOf = (link: Locator) => link.evaluate((a) => Math.round(a.getBoundingClientRect().top));
  /** Scrolls as a reader does, a wheel turn at a time, until `link` is in the upper part of the window. */
  async function wheelTo(page: Page, link: Locator) {
    for (let turn = 0; turn < 60 && (await link.evaluate((a) => a.getBoundingClientRect().top > innerHeight * 0.6)); turn++) {
      const before = await pageY(page);
      await page.mouse.wheel(0, 400);
      await expect.poll(() => pageY(page)).not.toBe(before);
    }
    await waitForStable(() => pageY(page));
  }
  /** Follows `link` with a click of its own, and returns the scroll position and the link's place as the page was left. */
  const follow = (link: Locator) =>
    link.evaluate((a) => {
      const left = { y: Math.round(scrollY), top: Math.round(a.getBoundingClientRect().top) };
      (a as HTMLElement).click();
      return left;
    });
  /** Back, then the page is where it was left: the scroll position within 8px, `link` in the same place. */
  async function backTo(page: Page, link: Locator, left: { y: number; top: number }) {
    await page.goBack();
    await expect.poll(() => pageY(page), { timeout: 10_000 }).toBeGreaterThan(left.y - 8);
    await waitForStable(() => pageY(page));
    expect(Math.abs((await pageY(page)) - left.y)).toBeLessThanOrEqual(8);
    // The same place, once what is above it has mounted (a docs page's demos arrive after its text).
    await expect.poll(async () => Math.abs((await topOf(link)) - left.top)).toBeLessThanOrEqual(8);
    expect(Math.abs((await pageY(page)) - left.y)).toBeLessThanOrEqual(8);
  }

  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ] as const) {
    test(`${width}px: from a docs page to the landing page, scrolled deep past its lazy parts`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/?theme=light");
      await expect(page.locator(".landing-hero")).toBeVisible();
      // The Check card ("Grade and verify work") in "Rules and checks", after The parts.
      const link = page.locator('a.landing-job[data-section="check"]').first();
      await wheelTo(page, link);
      const left = await follow(link);
      expect(left.y).toBeGreaterThan(2000);
      await expect(page).toHaveURL(/\/grading\?theme=light$/);
      await waitForPage(page);
      // A page opened by a link starts at its top.
      expect(await pageY(page)).toBe(0);
      await backTo(page, link, left);
    });
  }

  test("to the Assets tab: the filter and the place in it", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/gallery?type=slides&theme=light");
    await expect(page.locator(".gallery-card").first()).toBeVisible();
    // A card in the grid's third row or lower.
    const link = page.locator(".gallery-card__link").nth(8);
    await wheelTo(page, link);
    const left = await follow(link);
    expect(left.y).toBeGreaterThan(400);
    await expect(page).not.toHaveURL(/\/gallery/);
    await waitForPage(page);
    await backTo(page, link, left);
    await expect(page).toHaveURL(/\/gallery\?type=slides/);
    await expect(page.getByRole("group", { name: "Show" }).getByRole("button", { name: /^Slides/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator(".gallery-section")).toHaveCount(1);
  });

  test("to a docs page, whose Markdown and demos mount after the load; the reader's place wins over the address's #fragment", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/foundations/style?theme=light#motion");
    await expect(page.locator("#motion")).toBeInViewport();
    // The page as the reader leaves it: every demo in.
    await waitForPage(page);
    const next = page.getByRole("navigation", { name: "Previous and next documentation pages" }).getByRole("link").last();
    // The reader takes over from the #fragment (a wheel turn), then goes to the foot of the page.
    await page.mouse.wheel(0, 200);
    await next.evaluate((a) => a.scrollIntoView({ block: "center", behavior: "instant" }));
    await waitForStable(() => pageY(page));
    const left = await follow(next);
    expect(left.y).toBeGreaterThan(3000);
    await expect(page).not.toHaveURL(/\/foundations\/style\?/);
    await waitForPage(page);
    expect(await pageY(page)).toBe(0);
    await backTo(page, next, left);
    await expect(page).toHaveURL(/\/foundations\/style\?theme=light#motion$/);
  });

  test("a page opened afresh is untouched: a link starts at the top, a #fragment lands on its heading", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/?theme=light");
    await expect(page.locator(".landing-hero")).toBeVisible();
    const link = page.locator('a.landing-job[data-section="check"]').first();
    await wheelTo(page, link);
    expect((await follow(link)).y).toBeGreaterThan(2000);
    await expect(page).toHaveURL(/\/grading\?theme=light$/);
    await waitForPage(page);
    // The landing page again, by its link this time, not Back: its top, though a place in it is kept.
    await page.locator(".showcase-brand").click();
    await expect(page.locator(".landing-hero")).toBeVisible();
    await expect(link).toBeAttached();
    await waitForStable(() => pageY(page));
    expect(await pageY(page)).toBe(0);
    // A fresh load with a #fragment lands on its heading, and "On this page" marks it.
    await page.goto("/foundations/style?theme=light#motion");
    const heading = page.locator("#motion");
    await expect(heading).toBeInViewport();
    await waitForPage(page);
    await waitForStable(() => heading.evaluate((h) => Math.round(h.getBoundingClientRect().top)));
    const top = await heading.evaluate((h) => h.getBoundingClientRect().top);
    expect(top).toBeGreaterThan(-1);
    expect(top).toBeLessThan(200);
    await expect(page.getByRole("complementary", { name: "On this page" }).locator('[aria-current="location"]')).toHaveAttribute(
      "href",
      "#motion",
    );
  });
});
