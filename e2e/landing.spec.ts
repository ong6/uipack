import { readFileSync } from "node:fs";
import { pageDefs } from "../playground/catalog";
import { GALLERY_PATH } from "../playground/gallery-index";
import { UIPACK_SPEC } from "../src/grade/spec";
import { expect, test, type Page } from "./fixtures";

// The landing page (/, playground/LandingShowcase.tsx): it renders whole at a desktop and a phone
// width in both themes without a console error or page-wide overflow, its install line copies the
// current release's command, every link it draws opens a page the site has, and its 3D tile mounts
// only on screen and falls back to a still image without WebGL. Tier 1 runs on it in tier1.spec.ts;
// the built site's CSP is checked by `npm run check:site`, which loads every route in both themes.

/** The install line the docs print (README.md's generated block). */
const installLine = /<!-- generated:install -->\s*```sh\n(.+)\n```/.exec(readFileSync("README.md", "utf8"))![1];
const paths = new Set([...pageDefs.map((p) => p.path), GALLERY_PATH]);

/** Errors the page logs: console errors, uncaught exceptions, CSP reports. */
function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

/** Brings each lazy part into view and waits for it: the layer stack and the parts' previews. */
async function mountLazyParts(page: Page) {
  const wait = { timeout: 15_000 };
  await page.locator("#built").scrollIntoViewIfNeeded();
  await expect(page.locator("#built .uipack-stack a")).toHaveCount(6, wait);
  for (const [tile, part] of [
    ["diagrams", ".uipack svg"],
    ["deck", ".uipack-deck"],
    ["charts", ".uipack-span"],
    ["article", ".landing-article"],
  ]) {
    const box = page.locator(`.landing-tile--${tile}`);
    await box.scrollIntoViewIfNeeded();
    await expect(box.locator(part).first()).toBeAttached(wait);
  }
  await page.evaluate(() => scrollTo(0, 0));
}

/** Turns WebGL off in the page, as a browser without it would report. */
const withoutWebGL = (page: Page) =>
  page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (/webgl/i.test(type)) return null;
      return (original as (...a: unknown[]) => RenderingContext | null).call(this, type, ...rest);
    } as typeof original;
  });

for (const width of [1440, 390])
  for (const theme of ["light", "dark"] as const)
    test(`renders whole at ${width} in ${theme}, without errors or overflow`, async ({ page }) => {
      test.setTimeout(60_000);
      const errors = collectErrors(page);
      // The 3D tile's live scene is covered by objects.spec.ts; here it takes its still, so this
      // spec needs no GPU.
      await withoutWebGL(page);
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/?theme=${theme}`);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("The design manager for every site that installs it.");
      await expect(page).toHaveTitle(/^UiPack, the design manager/);
      // The hero's figure is a live uipack figure, with the drawing authored for the width.
      const figure = page.locator(".landing-hero__figure .uipack");
      await expect(figure).toBeVisible();
      await expect(figure.locator(width < 720 ? "svg.uipack--narrow" : "svg.uipack--wide")).toBeVisible();
      // Every section rendered, with its live parts mounted.
      for (const id of ["jobs", "built", "parts", "around", "agents", "site-map"])
        await expect(page.locator(`#${id}`)).toBeVisible();
      await mountLazyParts(page);
      // Exactly one filled primary action in the hero; Assets is the secondary.
      await expect(page.locator(".landing-hero .landing-btn--primary")).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      // The hero figure text stays at the 11px floor at every width (the phone drawing included).
      const smallest = await figure.evaluate((el) => {
        const svg = [...el.querySelectorAll<SVGSVGElement>(".uipack__canvas > svg")].find(
          (s) => s.getBoundingClientRect().width > 0,
        )!;
        return Math.min(
          ...[...svg.querySelectorAll("text")].filter((t) => t.textContent?.trim()).map((t) => t.getBoundingClientRect().height),
        );
      });
      expect(smallest).toBeGreaterThanOrEqual(11);
      expect(errors).toEqual([]);
    });

// Layout floor 8 (docs/system/layout/README.md): the header's content sits on the page column's
// edges. The logo's start edge and the last control's end edge are every section's edges, at the
// archetype's three gutters (32px, 24px below 1024px, 16px on a phone), and stay there once the
// page's own chunk has loaded.
for (const width of [1920, 1440, 1024, 768, 390])
  test(`the header's content edges are the page column's at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?theme=dark");
    const header = page.locator(".showcase-header");
    const edgesOfHeader = async () => {
      const logo = (await header.locator(".showcase-brand svg").boundingBox())!;
      const last = (await header.locator(".showcase-header__actions > :last-child").boundingBox())!;
      return { start: logo.x, end: last.x + last.width, height: (await header.boundingBox())!.height };
    };
    // The header is the shell's, drawn before the page's chunk: it must already be in place.
    await expect(header.locator(".showcase-brand svg")).toBeVisible();
    const early = await edgesOfHeader();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".landing-foot .landing-wrap")).toBeAttached();
    const now = await edgesOfHeader();
    expect(now, "the header moved when the page loaded").toEqual(early);
    // The banner's ground and rule run the window's width, 64px tall plus its rule.
    const bar = (await header.boundingBox())!;
    expect(bar.x).toBe(0);
    expect(bar.width).toBe(width);
    expect(bar.height).toBe(65);
    // One column: every section's, the closing band's and the footer's, with equal gutters.
    const columns = await page.locator(".uipack-landing .landing-wrap").evaluateAll((wraps) =>
      wraps.map((el) => {
        const box = el.getBoundingClientRect();
        return { start: box.left, end: box.right };
      }),
    );
    expect(columns).toHaveLength(7);
    const column = columns[0];
    expect(column.end - column.start).toBeCloseTo(Math.min(1120, width - 2 * (width >= 1024 ? 32 : width >= 720 ? 24 : 16)), 0);
    expect(column.start).toBeCloseTo(width - column.end, 0);
    for (const other of columns) {
      expect(Math.abs(other.start - column.start)).toBeLessThanOrEqual(1);
      expect(Math.abs(other.end - column.end)).toBeLessThanOrEqual(1);
    }
    expect(Math.abs(now.start - column.start), `logo at ${now.start}, column starts at ${column.start}`).toBeLessThanOrEqual(1);
    expect(Math.abs(now.end - column.end), `last control ends at ${now.end}, column ends at ${column.end}`).toBeLessThanOrEqual(
      1,
    );
    // The header's items share one centre line.
    const centres = await header
      .locator(".showcase-brand svg, .showcase-tabs a, .showcase-header__actions > button")
      .evaluateAll((items) => items.map((el) => el.getBoundingClientRect()).map((box) => box.top + box.height / 2));
    expect(Math.max(...centres) - Math.min(...centres)).toBeLessThanOrEqual(1);
  });

test("the grader skips only the scaled pictures: each is inert and hidden, and no live part is inside one", async ({ page }) => {
  // src/grade/spec.ts ignores .landing-preview, as it does the Assets tab's previews: pictures of
  // parts graded on their own pages. The live diagram and the 3D tile stay graded.
  expect(UIPACK_SPEC.ignore).toContain(".landing-preview");
  await withoutWebGL(page);
  await page.goto("/?theme=light");
  await mountLazyParts(page);
  const pictures = page.locator(".landing-preview");
  await expect(pictures).toHaveCount(3);
  await expect(page.locator(".landing-preview:not([aria-hidden='true']), .landing-preview:not([inert])")).toHaveCount(0);
  await expect(page.locator(".landing-preview :is(.landing-live, .landing-scene, .landing-tile__link)")).toHaveCount(0);
  for (const tile of ["deck", "charts", "article"])
    await expect(page.locator(`.landing-tile--${tile} .landing-preview`)).toHaveCount(1);
});

test("Start from your job holds only the Build cards; the Rules and Check cards sit in their own section after The parts", async ({
  page,
}) => {
  await page.goto("/?theme=light");
  const sections = (list: string) =>
    page.locator(`${list} .landing-job`).evaluateAll((cards) => cards.map((card) => card.getAttribute("data-section")));
  await expect(page.locator(".landing-job")).toHaveCount(6);
  expect(await sections("#jobs")).toEqual(["build", "build", "build", "build"]);
  expect(await sections("#around")).toEqual(["rules", "check"]);
  const order = await page.locator(".uipack-landing section[id]").evaluateAll((all) => all.map((el) => el.id));
  expect(order.indexOf("around")).toBeGreaterThan(order.indexOf("parts"));
  expect(order.indexOf("around")).toBeLessThan(order.indexOf("agents"));
  // The four build cards share one row at desktop width.
  await page.setViewportSize({ width: 1440, height: 900 });
  const tops = await page
    .locator("#jobs .landing-job")
    .evaluateAll((cards) => cards.map((card) => card.getBoundingClientRect().top));
  expect(new Set(tops).size).toBe(1);
  // The head's link reaches the later section.
  await page.locator('#jobs a[href="#around"]').click();
  await expect(page.locator("#around")).toBeInViewport();
});

test("job cards: tinted by section in light; in dark a neutral card with the hue on its top rule and chip", async ({ page }) => {
  for (const theme of ["light", "dark"] as const) {
    await page.goto(`/?theme=${theme}`);
    const cards = page.locator(".landing-job");
    await expect(cards).toHaveCount(6);
    const looks = await cards.evaluateAll((all) => {
      // The raised surface and the soft line, resolved where the cards sit.
      const probe = document.createElement("span");
      probe.style.cssText = "background: var(--ui-surface-raised); border: 1px solid var(--ui-line-soft)";
      all[0].parentElement!.append(probe);
      const surface = getComputedStyle(probe).backgroundColor;
      const line = getComputedStyle(probe).borderLeftColor;
      probe.remove();
      return all.map((card) => {
        const s = getComputedStyle(card);
        const hue = getComputedStyle(card.querySelector(".site-section-icon")!).color;
        const chip = getComputedStyle(card.querySelector(".landing-job__chip")!).backgroundColor;
        return { fill: s.backgroundColor, side: s.borderLeftColor, top: s.boxShadow, hue, chip, surface, line };
      });
    });
    for (const [i, c] of looks.entries()) {
      // The top rule is the section hue either way, and the chip carries a tint of it.
      expect(c.top, `card ${i} top rule`).toContain(c.hue);
      expect(c.chip, `card ${i} chip`).not.toBe("rgba(0, 0, 0, 0)");
      if (theme === "dark") {
        expect(c.fill, `card ${i} fill`).toBe(c.surface);
        expect(c.side, `card ${i} edge`).toBe(c.line);
      } else {
        expect(c.fill, `card ${i} fill`).not.toBe(c.surface);
      }
    }
  }
});

test("the For agents band: the band fill in light; in dark a raised, ruled charcoal step, not blue", async ({ page }) => {
  for (const theme of ["light", "dark"] as const) {
    await page.goto(`/?theme=${theme}`);
    const band = page.locator(".landing-band");
    await expect(band).toBeVisible();
    const look = await band.evaluate((el) => {
      const probe = (css: string) => {
        const p = document.createElement("span");
        p.style.cssText = css;
        el.append(p);
        const v = getComputedStyle(p).backgroundColor;
        p.remove();
        return v;
      };
      const s = getComputedStyle(el);
      return {
        fill: s.backgroundColor,
        top: s.borderTopWidth,
        raised: probe("background: var(--ui-surface-raised)"),
        bandFill: probe("background: var(--ui-band-fill)"),
        page: getComputedStyle(document.body).backgroundColor,
      };
    });
    if (theme === "light") {
      expect(look.fill).toBe(look.bandFill);
    } else {
      expect(look.fill).toBe(look.raised);
      expect(look.fill).not.toBe(look.page);
      expect(look.top).toBe("1px");
      const [r, g, b] = (look.fill.match(/\d+/g) ?? []).map(Number);
      expect(b - r, "blue over red").toBeLessThan(16);
      expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(16);
    }
  }
});

for (const width of [1440, 1920])
  test(`${width}: "How it is built" is balanced: the text column runs most of the stack's height`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?theme=light");
    await page.locator("#built").scrollIntoViewIfNeeded();
    await expect(page.locator("#built .uipack-stack a")).toHaveCount(6, { timeout: 15_000 });
    const h = await page.evaluate(() => {
      const box = (s: string) => document.querySelector(s)!.getBoundingClientRect();
      return { text: box(".landing-built__text").height, stack: box(".landing-built__stack").height };
    });
    expect(h.text / h.stack).toBeGreaterThan(0.8);
    const next = page.getByRole("list", { name: "Read next" }).getByRole("link");
    await expect(next).toHaveCount(4);
    for (const link of await next.all()) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });

for (const width of [1440, 390])
  test(`${width}: the part pictures are crops that read, and each ends in a fade`, async ({ page }) => {
    await withoutWebGL(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?theme=light");
    await mountLazyParts(page);
    // The rendered size of the words a reader sees in each picture (inside its box), as the median
    // over its text: the deck's slide, the chart's labels and rows, the article's prose.
    const floors = { deck: 14, charts: 9.5, article: 12 };
    for (const [tile, floor] of Object.entries(floors)) {
      const box = page.locator(`.landing-tile--${tile} .landing-preview`);
      await box.scrollIntoViewIfNeeded();
      const seen = await box.evaluate((el) => {
        const frame = el.getBoundingClientRect();
        const scale = frame.width
          ? el.firstElementChild!.getBoundingClientRect().width / (el.firstElementChild as HTMLElement).offsetWidth
          : 0;
        const sizes: number[] = [];
        const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = walk.nextNode(); n; n = walk.nextNode()) {
          const parent = n.parentElement!;
          const r = parent.getBoundingClientRect();
          if (!n.textContent!.trim() || !r.width || r.top > frame.bottom - 40 || r.bottom < frame.top) continue;
          sizes.push(parseFloat(getComputedStyle(parent).fontSize) * (scale || 1));
        }
        sizes.sort((a, b) => a - b);
        return { median: sizes[Math.floor(sizes.length / 2)] ?? 0, count: sizes.length, mask: getComputedStyle(el).maskImage };
      });
      expect(seen.count, `${tile}: words in view`).toBeGreaterThan(2);
      expect(seen.median, `${tile}: median rendered text`).toBeGreaterThanOrEqual(floor);
      expect(seen.mask, `${tile}: ends in a fade`).toContain("linear-gradient");
    }
  });

test("the hero's page is real output: the /web sample's brand, headline, action and results", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?theme=light");
  const wide = page.locator(".landing-hero__figure svg.uipack--wide");
  await expect(wide).toBeVisible();
  const words = (await wide.locator("text").allTextContents()).map((t) => t.trim());
  for (const expected of ["Tidy", "Forty emails in.", "Three that need you.", "Start free", "37 handled", "3 need you"])
    expect(words, expected).toContain(expected);
  // The product's figure inside it is drawn with uipack's own nodes and connectors.
  expect(await wide.locator('[data-uipack="node"]').count()).toBeGreaterThanOrEqual(1 + 4 + 3);
});

test("the copy button copies the current release's install command", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard permissions are Chromium's");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/?theme=light");
  await expect(page.locator(".landing-install__cmd")).toHaveText(installLine);
  const copy = page.locator(".landing-install__copy");
  await expect(copy).toHaveAccessibleName("Copy the install command");
  await copy.click();
  await expect(copy).toHaveAttribute("data-state", "copied");
  await expect(copy).toHaveAccessibleName("Copied the install command");
  await expect(page.getByRole("status").filter({ hasText: "Install command copied" })).toHaveCount(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(installLine);
});

test("every link on the page opens a page the site has", async ({ page }) => {
  test.setTimeout(90_000);
  await withoutWebGL(page);
  await page.goto("/?theme=dark");
  await mountLazyParts(page);
  const hrefs = await page
    .locator(".uipack-landing a[href]")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href")!).filter((h) => h.startsWith("/")));
  const internal = [...new Set(hrefs)];
  // The job cards, the layer bands, the tiles, the buttons and the site map, all to known routes
  // (or files the site serves), each carrying the theme.
  for (const href of internal) {
    const url = new URL(href, "http://x");
    if (/\.(md|txt)$/.test(url.pathname)) continue;
    expect(paths, href).toContain(url.pathname);
    expect(url.searchParams.get("theme"), href).toBe("dark");
  }
  expect(internal.length).toBeGreaterThan(40);
  // The served files: llms.txt and the Markdown the band names.
  for (const file of ["/llms.txt", "/docs/agents/README.md"]) expect((await page.request.get(file)).ok(), file).toBe(true);
  // Each job card opens its page.
  const cards = page.locator(".landing-job");
  await expect(cards).toHaveCount(6);
  const first = await cards.first().getAttribute("href");
  await cards.first().click();
  await expect(page).toHaveURL(new RegExp(`${first!.replace(/[?]/g, "\\?")}$`));
  await expect(page.locator("main h1")).toBeVisible();
});

test("the old home page keeps its own address, linked from the landing page and first in the docs", async ({ page }) => {
  await page.goto("/?theme=light");
  const docs = page.locator(".landing-hero").getByRole("link", { name: /Read the docs/ });
  await expect(docs).toHaveAttribute("href", "/what-uipack-is?theme=light");
  await expect(page.locator(".showcase-tabs").getByRole("link", { name: "Docs" })).toHaveAttribute(
    "href",
    "/what-uipack-is?theme=light",
  );
  await docs.click();
  await expect(page.locator("main h1")).toHaveAccessibleName("What UiPack is");
  await expect(page.getByRole("link", { name: "View as Markdown" })).toHaveAttribute("href", "/docs/README.md");
});

test("the 3D tile mounts only once it is on screen", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?theme=light");
  const scene = page.locator(".landing-scene");
  await expect(scene).toHaveAttribute("data-scene", /waiting|still/);
  // Below the fold, nothing of the scene has loaded: no player, no canvas.
  await expect(scene.locator(".uipack-object-scene, canvas")).toHaveCount(0);
});

test("without WebGL, the 3D tile shows a still of the scene", async ({ page }) => {
  await withoutWebGL(page);
  await page.goto("/?theme=dark");
  const scene = page.locator(".landing-scene");
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-scene", "still");
  const still = scene.locator("img");
  await expect(still).toHaveAttribute("src", /studio-dark/);
  await expect.poll(() => still.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
  await expect(scene.locator("canvas")).toHaveCount(0);
});

test("under reduced motion, the 3D tile shows its still and the hero figure holds still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?theme=light");
  await expect(page.locator(".landing-hero__figure svg.uipack--wide animate")).toHaveCount(0);
  await expect(page.locator(".landing-hero__figure svg.uipack--wide animateMotion")).toHaveCount(0);
  const scene = page.locator(".landing-scene");
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-scene", "still");
});

test("the docs search opens from ⌘K / Ctrl-K and from the landing page's header", async ({ page }) => {
  await page.goto("/?theme=light");
  const dialog = page.locator("dialog.uipack-docs-search");
  // The landing page's own chunk has rendered (the header is up before it).
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.keyboard.press("ControlOrMeta+k");
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await page.keyboard.type("spec template");
  await expect(dialog.getByRole("option").first()).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.locator(".showcase-header .uipack-docs-search__button").click();
  await expect(dialog).toBeVisible({ timeout: 10_000 });
});

test("the site map is the docs' five sections, Start first with What UiPack is at its top", async ({ page }) => {
  await page.goto("/?theme=light");
  const map = page.locator("#site-map");
  await expect(map.locator(".landing-map__section > h3")).toHaveText(["Start", "Rules", "Build", "Check", "Reference"]);
  await expect(map.locator('.landing-map__section[data-section="start"] a').first()).toHaveText("What UiPack is");
});

test("a docs page opened from the landing page docks its sidebar marker in place", async ({ page }) => {
  // A docs page remembers itself for the next page's marker to fly from; the landing page, with no
  // sidebar, clears that, so the page opened from it starts without a trip from an older page.
  await page.goto("/agents?theme=light");
  await page.locator("main h1").waitFor();
  await page.goto("/?theme=light");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("uipack-docs-nav"))).toBeNull();
  await page.locator(".landing-job").first().click();
  await expect(page.locator(".uipack-docs__sidebar a[aria-current='page']")).toBeVisible();
});
