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
  { path: "/reference/releases", section: "neutral", cell: 3, hue: "currentColor" },
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
    // The mark's animations and the ring's (a pseudo-element's are the document's).
    for (const a of document.getAnimations().filter((a) => el.contains((a.effect as KeyframeEffect).target))) {
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

test("moving to another section changes the mark in a portal: into the ring as the page left, out as this page's", async ({
  page,
}) => {
  await page.goto("/foundations?theme=light");
  await expect(page.locator(brand)).toHaveAttribute("data-brand", "rules");
  await expect(page.locator(brand)).not.toHaveAttribute("data-brand-hop");
  const box = await page.locator(brand).boundingBox();
  // The next page records, from its first script, every state the mark is drawn in, and holds the
  // portal shut until the test has looked at it.
  await page.addInitScript(() => {
    const w = window as { __brand?: string[] };
    w.__brand = [];
    new MutationObserver(() => {
      const state = document.querySelector(".showcase-brand")?.getAttribute("data-brand");
      if (state && w.__brand!.at(-1) !== state) w.__brand!.push(state);
    }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-brand"] });
    addEventListener("DOMContentLoaded", () => {
      const hold = document.createElement("style");
      hold.textContent =
        ".showcase-header .showcase-brand { --site-mark-wait: 60s !important; --brand-hop-wait: 60s !important; }";
      document.head.append(hold);
    });
  });
  await page.goto("/recipes?theme=light");
  // Drawn as the page left (Rules, the top right cell) with the portal's first half waiting.
  await expect(page.locator(brand)).toHaveAttribute("data-brand-hop", "in");
  await expect(page.locator(brand)).toHaveAttribute("data-brand", "rules");
  await expect(page.locator(`${brand} rect[data-live]`)).toHaveAttribute("data-cell", "1");
  const mark = page.locator(`${brand} svg > g`);
  const playing = () =>
    mark.evaluate((g) =>
      g.getAnimations().map((a) => [(a as CSSAnimation).animationName, a.effect!.getComputedTiming().duration]),
    );
  // Each half takes the base duration role.
  expect(await playing()).toEqual([["showcase-brand-portal-in", 320]]);
  const size = () => mark.evaluate((g) => g.getBoundingClientRect().width);
  await seek(page, { hop: 0 });
  const full = await size();
  // The ring is the new section's hue, open over the mark as the mark goes into it.
  const ring = await page.locator(brand).evaluate((el) => {
    const s = getComputedStyle(el, "::before");
    return { colour: s.borderTopColor, scale: s.scale };
  });
  expect(ring.colour).toBe(await role(page, "var(--site-hue-build)"));
  await seek(page, { hop: 0.8 });
  expect(await size()).toBeLessThan(full * 0.7);
  expect(Number(await page.locator(brand).evaluate((el) => getComputedStyle(el, "::before").scale))).toBeGreaterThan(1);
  // The first half ends with the mark out of sight: the state changes there, and the second half
  // brings it back out as this page's mark (Build, the bottom left cell, in its hue).
  await page.locator(brand).evaluate((el) => el.getAnimations({ subtree: true }).forEach((a) => a.finish()));
  await expect(page.locator(brand)).toHaveAttribute("data-brand", "build");
  await expect(page.locator(`${brand} rect[data-live]`)).toHaveAttribute("data-cell", "2");
  expect(await page.locator(`${brand} rect[data-live]`).evaluate((r) => getComputedStyle(r).fill)).toBe(
    await role(page, "var(--site-hue-build)"),
  );
  // Then it is over: at its own size, nothing moved, the portal gone.
  await expect(page.locator(brand)).not.toHaveAttribute("data-brand-hop");
  await expect.poll(size).toBeCloseTo(full, 0);
  expect(await page.evaluate(() => (window as { __brand?: string[] }).__brand)).toEqual(["rules", "build"]);
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

test("on the landing page the mark rests as the default logo, then the dot visits Start, Rules, Build and Check in turn, hopping, without moving the header", async ({
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
  // The bottom right cell has its own: it is Check's and the default logo's.
  expect(loops).toEqual(
    [0, 1, 2, 3].map((i) => [
      [i === 3 ? "showcase-brand-turn-home" : "showcase-brand-turn", 14000, "running"],
      [i === 3 ? "showcase-brand-turn-home-lift" : "showcase-brand-turn-lift", 14000, "running"],
    ]),
  );
  // The landing page's own styles (its chunk) place the header; measure once they have.
  await expect(page.locator(".landing-hero")).toBeVisible();
  const box = await page.locator(brand).boundingBox();
  // The loop opens on the default logo, from its first frame (0ms: the page enters the loop 0.4s
  // into the 6s rest, after the bottom right cell has turned from Check's hue to the ink), and holds
  // it, still, for five seconds, until the hop to Start (at 5040ms); the end of the loop (13950ms)
  // is the same logo, resting again.
  const still = () =>
    page.locator(`${brand} rect`).evaluateAll((rects) =>
      rects.map((rect) => {
        const s = getComputedStyle(rect);
        const r = rect.getBoundingClientRect();
        return [s.translate, s.transform, s.strokeDashoffset, s.strokeOpacity, Math.round(r.x * 100), Math.round(r.y * 100)].join(
          " ",
        );
      }),
    );
  await seek(page, { ms: 0 });
  const atRest = await still();
  for (const ms of [0, 400, 2500, 5000, 13950]) {
    await seek(page, { ms });
    const ink = await role(page, "currentColor");
    expect(await painted(page), `default logo at ${ms}ms`).toEqual(
      [0, 1, 2, 3].map((i) =>
        i === 3 ? { dot: true, square: false, fill: ink, stroke: ink } : { dot: false, square: true, fill: ink, stroke: ink },
      ),
    );
    // Still: nothing has moved or is redrawing, from the first frame to the last before the hop.
    expect(await still(), `still at ${ms}ms`).toEqual(atRest);
  }
  // On every later pass the rest is the same five seconds: from the turn to the ink (320ms into
  // the rest, 13920ms on the first pass) to the hop out (5.44s into it).
  for (const ms of [13920, 13600 + 5440 - 10]) {
    await seek(page, { ms });
    expect(await still(), `still at ${ms}ms`).toEqual(atRest);
  }
  expect(13600 + 5440 - 13920).toBeGreaterThanOrEqual(5000);
  const hues = ["start", "rules", "build", "check"];
  for (const [turn, hue] of hues.entries()) {
    // The middle of each state's two seconds, after the rest (5.6s on the first pass).
    await seek(page, { ms: 5600 + turn * 2000 + 1000 });
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
  await seek(page, { ms: 6600 });
  const from = await centre(page, 0);
  const to = await centre(page, 1);
  await seek(page, { ms: 7040 + 560 * 0.39 });
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
