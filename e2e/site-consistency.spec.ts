import { expect, test, type Page } from "./fixtures";

// One spec per type role, two radii, one section chip and one base palette on every view of the
// docs site (docs/specs/docs-site.md, "Type" and "Shape"): the landing page, a docs page, the Assets
// tab and a not-found page.

const VIEWS = [
  { name: "landing", path: "/", ready: ".landing-hero h1" },
  { name: "assets", path: "/gallery", ready: ".gallery-head h1" },
  { name: "docs", path: "/foundations/style", ready: ".uipack-docs__prose h1" },
  { name: "not found", path: "/no-such-page", ready: ".showcase-title h1" },
];

async function open(page: Page, view: (typeof VIEWS)[number], theme: string, width = 1440) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${view.path}?theme=${theme}`);
  await expect(page.locator(view.ready)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

/** A heading's type as set: size, leading and tracking (in em), weight and face. */
const type = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      const size = parseFloat(s.fontSize);
      return {
        size,
        leading: Math.round((parseFloat(s.lineHeight) / size) * 100) / 100,
        tracking: Math.round((parseFloat(s.letterSpacing) / size) * 1000) / 1000,
        weight: s.fontWeight,
        face: s.fontFamily,
      };
    });

for (const width of [1440, 390])
  test(`${width}: the page title and the section heading are one spec on a docs page, Assets and not found`, async ({ page }) => {
    await open(page, VIEWS[2], "light", width);
    const title = await type(page, ".uipack-docs__prose h1");
    const section = await type(page, ".uipack-docs__prose h2");
    expect(title).toMatchObject({ size: width === 1440 ? 52 : 36, leading: 1.15, tracking: -0.035, weight: "600" });
    expect(section).toMatchObject({ size: width === 1440 ? 26 : 23, leading: 1.15, tracking: -0.035, weight: "600" });
    // A sub-heading takes the role's tracking.
    expect((await type(page, ".uipack-docs__prose h3")).tracking).toBe(-0.01);
    await open(page, VIEWS[1], "light", width);
    expect(await type(page, ".gallery-head h1")).toEqual(title);
    expect(await type(page, ".gallery-section h2")).toEqual(section);
    // The intro under the title is the site's: 18px at the text leading, in ink-2, as a docs page's
    // first paragraph is from 1440.
    const intro = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((p) => {
          const s = getComputedStyle(p);
          return { size: s.fontSize, leading: s.lineHeight, colour: s.color };
        });
    const assetsIntro = await intro(".gallery-head p");
    expect(assetsIntro).toMatchObject({ size: "18px", leading: "28.8px" });
    await open(page, VIEWS[3], "light", width);
    expect(await type(page, ".showcase-title h1")).toEqual(title);
    expect(await intro(".showcase-title p")).toEqual(assetsIntro);
    if (width === 1440) {
      await open(page, VIEWS[2], "light", width);
      expect((await intro(".uipack-docs__prose h1 + p")).size).toBe("18px");
    }
  });

// One site width and one header (docs/specs/docs-site.md, "Layout"; owner, 2026-11-13): every
// view's content and the header's bar sit in one centred column, 1264px at most with 32px gutters
// (24px below 1024px, 16px below 720px). So (a) the header's items are at the same x on every view,
// and (b) its first and last items sit on that view's content edges (layout floor 8). The one
// difference between views: where the docs sidebar is a drawer (below 900px) a docs page's header
// starts with the menu button, on the content's edge, and its logo follows it.
const HEADER_VIEWS = [
  { name: "landing", path: "/", ready: ".landing-foot .landing-wrap", docs: false },
  { name: "docs page with a rail", path: "/agents", ready: ".uipack-docs__prose h1", docs: true },
  { name: "docs page without a rail", path: "/components/diagrams", ready: ".uipack-docs__prose h1", docs: true },
  { name: "assets", path: "/gallery", ready: ".gallery-grid", docs: false },
  { name: "not found", path: "/nope", ready: ".showcase-title h1", docs: true },
];
for (const width of [2000, 1920, 1440, 1280, 1024, 768, 390])
  test(`${width}: one header: the same edges and controls on every view, on each view's content edges`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    // Measured at rest, without the page's entrance.
    await page.emulateMedia({ reducedMotion: "reduce" });
    const gutter = width >= 1024 ? 32 : width >= 720 ? 24 : 16;
    const column = Math.min(1264, width - 2 * gutter);
    const seen: { name: string; docs: boolean; logo: number; last: number; controls: Record<string, string> }[] = [];
    for (const view of HEADER_VIEWS) {
      await page.goto(`${view.path}?theme=light`);
      await expect(page.locator(view.ready).first()).toBeAttached();
      await page.evaluate(() => document.fonts.ready);
      const g = await page.evaluate(() => {
        const rect = (s: string) => {
          const r = document.querySelector(s)?.getBoundingClientRect();
          return r && r.width > 0 ? r : null;
        };
        const frame = document.querySelector<HTMLElement>(".showcase-frame")!;
        const header = rect(".showcase-header")!;
        // The content's edges: the landing page's column, the Assets grid, or the docs layout (the
        // sidebar's rows, or the page where the sidebar is a drawer; "On this page"'s text, or the
        // page where there is no rail).
        let start: number, end: number;
        if (frame.dataset.mode === "landing") ({ left: start, right: end } = rect(".landing-wrap")!);
        else if (frame.dataset.mode === "gallery") ({ left: start, right: end } = rect(".gallery-grid")!);
        else {
          const main = rect("main.uipack-docs__article")!;
          start = (rect(".uipack-docs__sidebar .uipack-docs__navigation") ?? main).left;
          end = (rect(".uipack-docs__toc > p") ?? main).right;
        }
        const items = [...document.querySelectorAll(".showcase-brand svg, .showcase-tabs a, .showcase-header__actions > *")];
        const mids = items.map((el) => el.getBoundingClientRect()).map((r) => r.top + r.height / 2);
        const control = (s: string) => {
          const r = rect(s);
          const c = getComputedStyle(document.querySelector(s)!);
          return r
            ? `${Math.round(r.left)} ${Math.round(r.width)}x${Math.round(r.height)} r${c.borderTopLeftRadius} ${c.fontSize}`
            : "none";
        };
        return {
          menu: rect(".showcase-menu-button path")?.left ?? null,
          logo: rect(".showcase-brand svg")!.left,
          last: rect(".showcase-header__actions > :last-child")!.right,
          start,
          end,
          header: { left: header.left, width: header.width, height: header.height },
          spread: Math.max(...mids) - Math.min(...mids),
          labels: items.map((el) => el.getAttribute("aria-label") ?? el.textContent!.trim()).filter(Boolean),
          controls: {
            search: control(".showcase-header .uipack-docs-search__button"),
            theme: control(".showcase-header button.theme"),
            // A tab's weight differs when it is the current view, so its box is compared by height alone.
            tabs: `${Math.round(rect(".showcase-tabs a")!.height)} ${getComputedStyle(document.querySelector(".showcase-tabs a")!).fontSize}`,
          },
          sidebarSearch: !!rect(".uipack-docs__sidebar .uipack-docs-search__button"),
          scrollWidth: document.documentElement.scrollWidth,
        };
      });
      const at = `${view.name} at ${width}`;
      // (b) The header's content edges are this view's content edges, and the content is the site column.
      expect(g.end - g.start, `${at}: the content is the site column`).toBeCloseTo(column, 0);
      expect(g.start, `${at}: the column is centred`).toBeCloseTo((width - column) / 2, 0);
      const first = g.menu ?? g.logo;
      expect(Math.abs(first - g.start), `${at}: the header starts at ${first}, the content at ${g.start}`).toBeLessThanOrEqual(1);
      expect(Math.abs(g.last - g.end), `${at}: the header ends at ${g.last}, the content at ${g.end}`).toBeLessThanOrEqual(1);
      expect(g.menu !== null, `${at}: a menu button only where the docs sidebar is a drawer`).toBe(view.docs && width < 900);
      // The ground and rule run the window; the items share one centre line; nothing overflows.
      expect(g.header).toEqual({ left: 0, width, height: 65 });
      expect(g.spread, `${at}: one centre line`).toBeLessThanOrEqual(1);
      expect(g.scrollWidth, `${at}: no sideways scroll`).toBeLessThanOrEqual(width);
      // The same items on every view: the mark, the two tabs, search, the theme toggle.
      expect(
        g.labels.map((label) => label.replace(/(⌘K|Ctrl K)$/, "")),
        at,
      ).toEqual(["uipack", "Docs", "Assets", "Search docs", "Dark mode"]);
      expect(g.sidebarSearch, `${at}: search is the header's box`).toBe(false);
      seen.push({ name: view.name, docs: view.docs, logo: g.logo, last: g.last, controls: g.controls });
    }
    // (a) The same x on every view: the last control always; the logo wherever no menu button leads
    // the bar (every view from 900px, and the views without a drawer below it).
    for (const view of seen) {
      expect(
        Math.abs(view.last - seen[0].last),
        `${view.name}: last control at ${view.last}, landing at ${seen[0].last}`,
      ).toBeLessThanOrEqual(1);
      expect(view.controls, `${view.name}: search, the toggle and the tabs are drawn as on the landing page`).toEqual(
        seen[0].controls,
      );
      const peer = seen.find((v) => width >= 900 || v.docs === view.docs)!;
      expect(
        Math.abs(view.logo - peer.logo),
        `${view.name}: logo at ${view.logo}, ${peer.name} at ${peer.logo}`,
      ).toBeLessThanOrEqual(1);
    }
  });

test("landing headings: display tracking on the headline and section heads, the role on card titles; whole-pixel sizes", async ({
  page,
}) => {
  await open(page, VIEWS[0], "light");
  expect((await type(page, ".landing-hero h1")).tracking).toBe(-0.035);
  expect((await type(page, ".landing-head h2")).tracking).toBe(-0.035);
  const small = await page.locator(".landing-job h3, .landing-band__row h3, .landing-tile__label h3").evaluateAll((els) =>
    els.map((el) => {
      const s = getComputedStyle(el);
      return [parseFloat(s.fontSize), Math.round((parseFloat(s.letterSpacing) / parseFloat(s.fontSize)) * 1000) / 1000];
    }),
  );
  expect(small.length).toBeGreaterThan(6);
  for (const [size, tracking] of small) {
    expect([15, 18]).toContain(size);
    expect(tracking).toBe(-0.01);
  }
  expect(
    await page
      .locator(".landing-band code")
      .first()
      .evaluate((el) => getComputedStyle(el).fontSize),
  ).toBe("14px");
});

test("the section chip is drawn one way in a docs page's bar and on a landing job card", async ({ page }) => {
  const chip = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          font: `${s.fontWeight} ${s.fontSize}/${s.lineHeight} ${s.fontFamily}`,
          tracking: s.letterSpacing,
          transform: s.textTransform,
          radius: s.borderTopLeftRadius,
          padding: s.padding,
          gap: s.columnGap,
          height: Math.round(el.getBoundingClientRect().height * 10) / 10,
          icon: el.querySelector("svg")?.getBoundingClientRect().width,
        };
      });
  await open(page, VIEWS[0], "light");
  const card = await chip(".landing-job__chip");
  expect(card).toMatchObject({ transform: "uppercase", radius: "0px", tracking: "0.72px" });
  await open(page, VIEWS[2], "light");
  expect(await chip(".showcase-crumb__chip")).toEqual(card);
});

test("corners: square on the landing page, Assets and the header; one small radius for a docs page's own furniture", async ({
  page,
}) => {
  /** Every corner radius painted outside a demo, preview or drawing (a circle is a mark, not a corner). */
  const radii = () =>
    page.evaluate(() => {
      const found = new Set<string>();
      for (const el of document.body.querySelectorAll("*")) {
        if (
          el.closest(".showcase-demo, .gallery-preview, .landing-tile__canvas, .landing-hero__figure, .landing-built__stack, svg")
        )
          continue;
        if (!el.getClientRects().length) continue;
        const s = getComputedStyle(el);
        const painted = s.backgroundColor !== "rgba(0, 0, 0, 0)" || parseFloat(s.borderTopWidth) > 0 || s.overflow !== "visible";
        if (painted && s.borderTopLeftRadius !== "0px" && s.borderTopLeftRadius !== "50%") found.add(s.borderTopLeftRadius);
      }
      return [...found].sort();
    });
  await open(page, VIEWS[0], "light");
  expect(await radii(), "landing").toEqual([]);
  await open(page, VIEWS[1], "light");
  await expect(page.locator(".gallery-card").first()).toBeVisible();
  expect(await radii(), "assets").toEqual([]);
  await open(page, VIEWS[2], "light");
  const small = await page
    .locator(".showcase-frame")
    .evaluate((el) => getComputedStyle(el).getPropertyValue("--show-radius").trim());
  expect(await radii(), "docs").toEqual([small]);
  // The header's controls are square on a docs page too.
  expect(await page.locator(".showcase-header button.theme").evaluate((b) => getComputedStyle(b).borderTopLeftRadius)).toBe(
    "0px",
  );
});

for (const theme of ["light", "dark"])
  test(`${theme}: the header, the base text, the muted text and the ground are the same colours on every view`, async ({
    page,
  }) => {
    const seen: Record<string, unknown> = {};
    for (const view of VIEWS) {
      await open(page, view, theme);
      seen[view.name] = await page.evaluate(() => {
        const colour = (selector: string, property: "color" | "backgroundColor" = "color") =>
          getComputedStyle(document.querySelector(selector)!)[property];
        const role = (value: string) => {
          const probe = document.createElement("i");
          probe.style.color = value;
          document.querySelector("main")!.append(probe);
          const c = getComputedStyle(probe).color;
          probe.remove();
          return c;
        };
        return {
          header: colour(".showcase-header"),
          brand: colour(".showcase-brand"),
          main: colour("main"),
          title: colour("main h1"),
          ink: role("var(--ui-ink)"),
          muted: role("var(--ui-ink-2)"),
          faint: role("var(--ui-ink-3)"),
          rule: role("var(--ui-line)"),
          accent: role("var(--ui-accent)"),
          ground: colour(".showcase-header", "backgroundColor"),
          page: colour("body", "backgroundColor"),
          surface: role("var(--ui-surface)"),
          raised: role("var(--ui-surface-raised)"),
        };
      });
    }
    const docs = seen.docs as Record<string, string>;
    for (const view of VIEWS) expect(seen[view.name], view.name).toEqual(docs);
    // Text is the one ink, and in dark it is the site's neutral ink on charcoal, never Technical's blue-tinted pair.
    expect(docs.header).toBe(docs.ink);
    expect(docs.main).toBe(docs.ink);
    expect(docs.title).toBe(docs.ink);
    if (theme === "dark")
      for (const value of [docs.ink, docs.muted, docs.ground]) {
        const [r, g, b] = value.match(/[\d.]+/g)!.map(Number);
        expect(Math.max(r, g, b) - Math.min(r, g, b), value).toBeLessThan(16);
      }
  });

// The parts the site does not set type for: a live demo, a preview, a drawing (the package's own).
const LIVE =
  ".showcase-demo, .gallery-preview, .landing-tile__canvas, .landing-hero__figure, .landing-built__stack, svg, .uipack-docs__block[data-block]";

test("leading is the site's four ratios on every view, never normal; mono caps labels share one tracking", async ({ page }) => {
  test.setTimeout(90_000);
  for (const view of VIEWS) {
    await open(page, view, "light");
    // The landing page's sections draw as they near the viewport.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
        scrollTo(0, y);
        await new Promise((done) => setTimeout(done, 60));
      }
      scrollTo(0, 0);
    });
    const seen = await page.evaluate((live) => {
      const leading = new Map<string, string>();
      const tracking = new Map<string, string>();
      for (const el of document.body.querySelectorAll("*")) {
        if (el.closest(live) || !el.getClientRects().length) continue;
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())) continue;
        const s = getComputedStyle(el);
        const size = parseFloat(s.fontSize);
        const name = `${el.tagName.toLowerCase()}.${el.className}`;
        const ratio = s.lineHeight === "normal" ? "normal" : String(Math.round((parseFloat(s.lineHeight) / size) * 100) / 100);
        if (!leading.has(ratio)) leading.set(ratio, name);
        // A label is words: a count beside one (the sidebar's "23") is not tracked.
        if (s.textTransform === "uppercase" && /mono/i.test(s.fontFamily) && /[a-z]/i.test(el.textContent!)) {
          const em = String(Math.round((parseFloat(s.letterSpacing) / size) * 1000) / 1000);
          if (!tracking.has(em)) tracking.set(em, name);
        }
      }
      return { leading: Object.fromEntries(leading), tracking: Object.fromEntries(tracking) };
    }, LIVE);
    // 1 is a key cap (the search box's ⌘K): a one-line box.
    for (const [ratio, where] of Object.entries(seen.leading))
      expect(["1", "1.15", "1.3", "1.6", "1.78"], `${view.name}: ${where} is set at ${ratio}`).toContain(ratio);
    for (const [em, where] of Object.entries(seen.tracking)) expect(em, `${view.name}: ${where}`).toBe("0.06");
  }
});

test("a not-found page draws the site map as the landing footer does, under a title placed as the Assets title is", async ({
  page,
}) => {
  const drawn = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          font: `${s.fontWeight} ${s.fontSize}/${s.lineHeight} ${s.fontFamily}`,
          tracking: s.letterSpacing,
          transform: s.textTransform,
          colour: s.color,
          underline: s.textDecorationLine,
          icon: el.querySelector("svg") ? getComputedStyle(el.querySelector("svg")!).color : null,
        };
      });
  const title = (h1: string, intro: string) =>
    page.evaluate(
      ([a, b]) => {
        const head = document.querySelector(a)!.getBoundingClientRect();
        return {
          top: Math.round(head.top + scrollY),
          gap: Math.round(document.querySelector(b)!.getBoundingClientRect().top - head.bottom),
        };
      },
      [h1, intro],
    );
  // Titles are measured at rest, without the page's entrance.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, VIEWS[0], "dark");
  await page.locator(".landing-foot").scrollIntoViewIfNeeded();
  const footer = { head: await drawn(".landing-map__head"), link: await drawn(".landing-map__group a") };
  expect(footer.head).toMatchObject({ transform: "uppercase", tracking: "0.72px" });
  expect(footer.link.underline).toBe("none");
  await open(page, VIEWS[1], "dark");
  const assets = await title(".gallery-head h1", ".gallery-head p");
  await open(page, VIEWS[3], "dark");
  expect({ head: await drawn(".landing-map__head"), link: await drawn(".landing-map__group a") }).toEqual(footer);
  await expect(page.locator(".landing-map__section > h2")).toHaveText(["Start", "Rules", "Build", "Check", "Reference"]);
  // Every page is listed, sub-pages too.
  expect(await page.locator(".landing-map a").count()).toBeGreaterThan(70);
  expect(await title(".showcase-title h1", ".showcase-title p")).toEqual(assets);
  // No tab is the current view: the address names neither.
  await expect(page.locator(".showcase-tabs a[aria-current]")).toHaveCount(0);
  // A docs page's title has its page bar above it, and the same gap under it.
  await open(page, VIEWS[2], "dark");
  expect((await title(".uipack-docs__prose h1", ".uipack-docs__prose h1 + p")).gap).toBe(assets.gap);
});

test("dark: the landing page has one gold, on the hero's button and the band's", async ({ page }) => {
  await open(page, VIEWS[0], "dark");
  const fill = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
  const accent = await page.locator(".uipack-landing").evaluate((el) => {
    const probe = document.createElement("i");
    probe.style.color = "var(--ui-accent)";
    el.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  });
  expect(await fill(".landing-btn--primary")).toBe(accent);
  expect(await fill(".landing-btn--band")).toBe(accent);
});

for (const view of [
  {
    name: "Assets",
    path: "/gallery",
    tile: '[data-gallery-item="asset-background-dots"] .gallery-preview',
    all: ".gallery-card--tile",
  },
  {
    name: "Icons & marks",
    path: "/assets",
    tile: '.uipack-browser__card[data-id="background-dots"] .uipack-browser__tile',
    all: ".uipack-browser__card",
  },
])
  test(`dark: no still on ${view.name} has a blue ground; the canvas backgrounds sit on the site's surface`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${view.path}?theme=dark`);
    const tile = page.locator(view.tile);
    await tile.scrollIntoViewIfNeeded();
    await expect(tile.locator("img").last()).toBeAttached();
    // Each tile's still loads as it nears the viewport: bring every one in.
    for (const card of await page.locator(view.all).all()) await card.scrollIntoViewIfNeeded();
    const found = await page.evaluate(async () => {
      const blue = (r: number, g: number, b: number) => b - Math.max(r, g) >= 12 && b >= 40;
      const grounds: string[] = [];
      let stills = 0;
      for (const img of document.querySelectorAll<HTMLImageElement>("main img")) {
        const s = getComputedStyle(img);
        if (!img.getClientRects().length || s.visibility === "hidden") continue;
        await Promise.race([img.decode().catch(() => undefined), new Promise((done) => setTimeout(done, 1500))]);
        if (!img.naturalWidth) continue;
        stills += 1;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 48;
        const context = canvas.getContext("2d")!;
        context.drawImage(img, 0, 0, 48, 48);
        const data = context.getImageData(0, 0, 48, 48).data;
        let opaque = 0;
        let bluish = 0;
        for (let i = 0; i < data.length; i += 4)
          if (data[i + 3] > 200) {
            opaque += 1;
            if (blue(data[i], data[i + 1], data[i + 2])) bluish += 1;
          }
        // A ground covers most of the still; a mark (a cyan request token) does not.
        if (opaque / (48 * 48) > 0.6 && bluish / opaque > 0.5) grounds.push(img.currentSrc);
      }
      return { stills, grounds };
    });
    expect(found.stills).toBeGreaterThan(30);
    expect(found.grounds).toEqual([]);
    // The three background tiles: the still is covered by the site's own drawing, on its surface.
    const surface = await page.locator(".showcase-frame").evaluate((el) => {
      const probe = document.createElement("i");
      probe.style.color = "var(--ui-surface)";
      el.append(probe);
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return colour;
    });
    expect(await tile.evaluate((el) => getComputedStyle(el, "::after").backgroundColor)).toBe(surface);
    expect(await tile.evaluate((el) => getComputedStyle(el, "::after").backgroundImage)).toContain("radial-gradient");
    expect(
      await tile.evaluate((el) =>
        [...el.querySelectorAll("img")]
          .filter((i) => getComputedStyle(i).display !== "none")
          .map((i) => getComputedStyle(i).visibility),
      ),
    ).toEqual(["hidden"]);
  });

test("a figure's controls take the site's corner: the small radius in a docs demo, square in an Assets card", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/diagrams?theme=light");
  const control = page.locator(".uipack__ctl").first();
  await control.scrollIntoViewIfNeeded();
  expect(await control.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe(
    await page.locator(".showcase-frame").evaluate((el) => getComputedStyle(el).getPropertyValue("--show-radius").trim()),
  );
  await page.goto("/gallery?theme=light");
  const inCard = page.locator(".gallery-card .uipack__ctl").first();
  await expect(inCard).toBeAttached();
  expect(await inCard.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe("0px");
});
