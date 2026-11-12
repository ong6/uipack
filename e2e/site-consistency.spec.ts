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
    // The intro under the title has the body leading.
    expect(await page.locator(".gallery-head p").evaluate((p) => getComputedStyle(p).lineHeight)).toBe("25.6px");
    await open(page, VIEWS[3], "light", width);
    expect(await type(page, ".showcase-title h1")).toEqual(title);
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
