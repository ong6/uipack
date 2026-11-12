import { expect, test, type Page } from "./fixtures";

// The header's mark (docs/specs/docs-site.md, "The mark"): its four cells are Start, Rules, Build
// and Check in reading order; the dot sits on the current page's section, in that section's hue.
// Reference, the Assets tab and a not-found page show the neutral mark; between sections the dot
// hops from the cell the reader left; the landing page visits the four in turn, hopping, and holds
// the neutral mark under reduced motion.

const brand = ".showcase-brand";

/** Each cell as painted: whether it is the dot (round and filled), and its fill and stroke. */
const painted = (page: Page) =>
  page.locator(`${brand} rect`).evaluateAll((rects) =>
    rects.map((rect) => {
      const style = getComputedStyle(rect);
      return {
        dot: parseFloat(style.rx) === 5 && parseFloat(style.fillOpacity) === 1,
        square: parseFloat(style.rx) === 2 && parseFloat(style.fillOpacity) === 0,
        fill: style.fill,
        stroke: style.stroke,
      };
    }),
  );

/** A role's colour as the header resolves it. */
const role = (page: Page, value: string) =>
  page.locator(brand).evaluate((el, v) => {
    const probe = document.createElement("i");
    probe.style.color = v;
    el.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  }, value);

const PAGES = [
  { path: "/what-uipack-is", section: "start", cell: 0, hue: "var(--site-hue-start)" },
  { path: "/foundations", section: "rules", cell: 1, hue: "var(--site-hue-rules)" },
  { path: "/recipes", section: "build", cell: 2, hue: "var(--site-hue-build)" },
  { path: "/grading", section: "check", cell: 3, hue: "var(--site-hue-check)" },
  // No cell of their own: the neutral mark, the dot bottom right in the ink.
  { path: "/reference/registry", section: "neutral", cell: 3, hue: "currentColor" },
  { path: "/gallery", section: "neutral", cell: 3, hue: "currentColor" },
  { path: "/no-such-page", section: "neutral", cell: 3, hue: "currentColor" },
];

for (const theme of ["light", "dark"])
  for (const { path, section, cell, hue } of PAGES)
    test(`${path} (${theme}): the dot sits on the ${section} cell in its hue`, async ({ page }) => {
      await page.goto(`${path}?theme=${theme}`);
      await expect(page.locator(brand)).toHaveAttribute("data-brand", section);
      await expect(page.locator(`${brand} rect[data-live]`)).toHaveAttribute("data-cell", String(cell));
      const ink = await role(page, "currentColor");
      const colour = await role(page, hue);
      await expect
        .poll(() => painted(page))
        .toEqual(
          [0, 1, 2, 3].map((i) =>
            i === cell
              ? { dot: true, square: false, fill: colour, stroke: colour }
              : { dot: false, square: true, fill: ink, stroke: ink },
          ),
        );
      // The squares and the name are the ink, never the docs link colour.
      expect(ink).toBe(await page.locator(".showcase-header").evaluate((el) => getComputedStyle(el).color));
      expect(await page.locator(`${brand} text`).evaluate((el) => getComputedStyle(el).fill)).toBe(ink);
    });

/** Holds the brand's animations at `ms` (or, with a fraction, that far through the hop itself). */
const seek = (page: Page, at: { ms: number } | { hop: number }) =>
  page.locator(brand).evaluate((el, at) => {
    for (const a of el.getAnimations({ subtree: true })) {
      a.pause();
      const timing = a.effect!.getComputedTiming();
      a.currentTime = "ms" in at ? at.ms : (timing.delay ?? 0) + Number(timing.duration) * at.hop;
    }
  }, at);

/** A cell's box centre, in viewport pixels. */
const centre = (page: Page, cell: number) =>
  page.locator(`${brand} rect[data-cell="${cell}"]`).evaluate((rect) => {
    const r = rect.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

test("moving to another section hops the dot from the cell the reader left", async ({ page }) => {
  await page.goto("/foundations?theme=light");
  await expect(page.locator(brand)).toHaveAttribute("data-brand", "rules");
  await expect(page.locator(brand)).not.toHaveAttribute("data-brand-hop");
  const box = await page.locator(brand).boundingBox();
  // The next page records, from its first script, every state the mark is drawn in, and holds the
  // hop on the ground until the test has looked at it.
  await page.addInitScript(() => {
    const w = window as { __brand?: string[] };
    w.__brand = [];
    new MutationObserver(() => {
      const state = document.querySelector(".showcase-brand")?.getAttribute("data-brand");
      if (state && w.__brand!.at(-1) !== state) w.__brand!.push(state);
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-brand"] });
    addEventListener("DOMContentLoaded", () => {
      const hold = document.createElement("style");
      hold.textContent = ".showcase-header .showcase-brand { --site-mark-wait: 60s !important; }";
      document.head.append(hold);
    });
  });
  await page.goto("/recipes?theme=light");
  // Drawn as the page left (Rules, the top right cell) with a hop to Build's cell waiting.
  await expect(page.locator(brand)).toHaveAttribute("data-brand-hop", "");
  await expect(page.locator(brand)).toHaveAttribute("data-brand", "rules");
  await expect(page.locator(`${brand} rect[data-live]`)).toHaveAttribute("data-cell", "1");
  const hop = await page
    .locator(`${brand} rect[data-live]`)
    .evaluate((rect) =>
      rect.getAnimations().map((a) => [(a as CSSAnimation).animationName, a.effect!.getComputedTiming().duration]),
    );
  // Slow enough to see: the slow duration role.
  expect(hop).toEqual([
    ["showcase-brand-hop", 560],
    ["showcase-brand-lift", 560],
  ]);
  await seek(page, { hop: 0 });
  const from = await centre(page, 1);
  const to = await centre(page, 2);
  // Part-way through its flight it is between the two cells and above the straight line between them.
  await seek(page, { hop: 0.39 });
  const mid = await centre(page, 1);
  expect(mid.x).toBeLessThan(from.x - 1);
  expect(mid.x).toBeGreaterThan(to.x + 1);
  expect(mid.y).toBeLessThan(from.y + (to.y - from.y) * 0.5 - 1.5);
  // Landed on the new cell, in the new hue, and squashed for a moment (wider than tall).
  await seek(page, { hop: 0.87 });
  const landing = await page.locator(`${brand} rect[data-live]`).evaluate((rect) => {
    const r = rect.getBoundingClientRect();
    return { x: r.left + r.width / 2, wide: r.width - r.height, fill: getComputedStyle(rect).fill };
  });
  expect(Math.abs(landing.x - to.x)).toBeLessThan(0.5);
  expect(landing.wide).toBeGreaterThan(1);
  expect(landing.fill).toBe(await role(page, "var(--site-hue-build)"));
  // The hop ends: the state changes under it, the cell it left is marked to redraw, nothing has moved.
  await page.locator(brand).evaluate((el) => el.getAnimations({ subtree: true }).forEach((a) => a.finish()));
  await expect(page.locator(brand)).toHaveAttribute("data-brand", "build");
  await expect(page.locator(brand)).not.toHaveAttribute("data-brand-hop");
  await expect(page.locator(brand)).toHaveAttribute("data-brand-left", "1");
  await expect(page.locator(`${brand} rect[data-live]`)).toHaveAttribute("data-cell", "2");
  expect(await page.evaluate(() => (window as { __brand?: string[] }).__brand)).toEqual(["rules", "build"]);
  expect(
    await page
      .locator(`${brand} rect[data-cell="1"]`)
      .evaluate((r) => r.getAnimations().map((a) => (a as CSSAnimation).animationName)),
  ).toEqual(["showcase-brand-redraw"]);
  expect(await page.locator(brand).boundingBox()).toEqual(box);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("under reduced motion the dot is drawn in place", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/foundations?theme=light");
  await page.addInitScript(() => {
    const w = window as { __brand?: string[] };
    w.__brand = [];
    new MutationObserver(() => {
      const state = document.querySelector(".showcase-brand")?.getAttribute("data-brand");
      if (state && w.__brand!.at(-1) !== state) w.__brand!.push(state);
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-brand"] });
  });
  await page.goto("/recipes?theme=light");
  await expect(page.locator(brand)).toHaveAttribute("data-brand", "build");
  expect(await page.evaluate(() => (window as { __brand?: string[] }).__brand)).toEqual(["build"]);
  await expect(page.locator(brand)).not.toHaveAttribute("data-brand-hop");
  expect(await page.locator(brand).evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
});

test("on the landing page the dot visits Start, Rules, Build and Check in turn, hopping, without moving the header", async ({
  page,
}) => {
  await page.goto("/?theme=dark");
  const rects = page.locator(`${brand} rect`);
  await expect(rects).toHaveCount(4);
  // One CSS loop per cell (its look and travel, and its lift), no timers: each cell lit for its quarter.
  const loops = await rects.evaluateAll((els) =>
    els.map((el) =>
      el.getAnimations().map((a) => [(a as CSSAnimation).animationName, a.effect!.getComputedTiming().duration, a.playState]),
    ),
  );
  expect(loops).toEqual(
    [0, 1, 2, 3].map(() => [
      ["showcase-brand-turn", 8000, "running"],
      ["showcase-brand-turn-lift", 8000, "running"],
    ]),
  );
  // The landing page's own styles (its chunk) place the header; measure once they have.
  await expect(page.locator(".landing-hero")).toBeVisible();
  const box = await page.locator(brand).boundingBox();
  const hues = ["start", "rules", "build", "check"];
  for (const [turn, hue] of hues.entries()) {
    // The middle of each state's two seconds.
    await seek(page, { ms: turn * 2000 + 1000 });
    const colour = await role(page, `var(--site-hue-${hue})`);
    const ink = await role(page, "currentColor");
    expect(await painted(page), `state ${hue}`).toEqual(
      [0, 1, 2, 3].map((i) =>
        i === turn
          ? { dot: true, square: false, fill: colour, stroke: colour }
          : { dot: false, square: true, fill: ink, stroke: ink },
      ),
    );
    expect(await page.locator(brand).boundingBox()).toEqual(box);
  }
  // Between states it hops (the last 560ms of a state's 2s): leaving Start for Rules, the dot is
  // between the two cells and above them, and the header has not moved.
  await seek(page, { ms: 1000 });
  const from = await centre(page, 0);
  const to = await centre(page, 1);
  await seek(page, { ms: 1440 + 560 * 0.39 });
  const mid = await centre(page, 0);
  expect(mid.x).toBeGreaterThan(from.x + 1);
  expect(mid.x).toBeLessThan(to.x - 1);
  expect(mid.y).toBeLessThan(from.y - 1.5);
  expect(await page.locator(brand).boundingBox()).toEqual(box);
});

test("on the landing page under reduced motion the mark holds its neutral state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?theme=light");
  await expect(page.locator(brand)).toHaveAttribute("data-brand", "neutral");
  expect(await page.locator(brand).evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
  const ink = await role(page, "currentColor");
  expect(await painted(page)).toEqual(
    [0, 1, 2, 3].map((i) =>
      i === 3 ? { dot: true, square: false, fill: ink, stroke: ink } : { dot: false, square: true, fill: ink, stroke: ink },
    ),
  );
});

test("on the narrowest phones the whole mark still shows, dot included", async ({ page }) => {
  await page.setViewportSize({ width: 340, height: 700 });
  await page.goto("/foundations?theme=light");
  const link = await page.locator(brand).boundingBox();
  const dot = await page.locator(`${brand} rect[data-live]`).boundingBox();
  // The Rules dot is in the mark's right column: inside the link's clip, not cut off.
  expect(dot!.x).toBeGreaterThanOrEqual(link!.x);
  expect(dot!.x + dot!.width).toBeLessThanOrEqual(link!.x + link!.width - 8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(340);
});
