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
