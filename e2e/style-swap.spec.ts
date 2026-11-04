import { expect, test, type Page } from "./fixtures";

// A style swap changes tokens and ornaments only (docs/system/README.md, "Three layers, swapped
// independently"). The same content in each style keeps the same regions in the same reading
// order, at the same horizontal positions; heights may differ where the faces' metrics differ
// (Graphical's display caps), so vertical checks compare order, not pixels.
const STYLES = ["technical", "landing", "graphical"] as const;
const TOL = 3;

type Box = { name: string; x: number; y: number; w: number; h: number; text: string };

async function boxes(page: Page, selectors: [string, string][]): Promise<Box[]> {
  return page.evaluate((list) => {
    return list.map(([name, sel]) => {
      const el = document.querySelector(sel);
      if (!el) return { name, x: NaN, y: NaN, w: NaN, h: NaN, text: "" };
      const r = el.getBoundingClientRect();
      return {
        name,
        x: Math.round(r.left),
        y: Math.round(r.top + scrollY),
        w: Math.round(r.width),
        h: Math.round(r.height),
        text: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80),
      };
    });
  }, selectors);
}

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

const WEB_REGIONS: [string, string][] = [
  ["nav", ".web-example .uipack-web-nav"],
  ["hero", ".web-example .uipack-web-hero"],
  ["hero eyebrow", ".web-example .uipack-web-hero .uipack-web-eyebrow"],
  ["hero title", "#web-hero-title"],
  ["hero subtitle", ".web-example .uipack-web-hero .uipack-web-subhead"],
  ["hero actions", ".web-example .uipack-web-hero__actions"],
  ["demo", ".web-example .uipack-web-demo"],
  ["how", "#web-how"],
  ["how cards", "#web-how .uipack-web-features"],
  ["mechanism", "#web-mechanism"],
  ["figure", "#web-mechanism figure"],
  ["proof", "#web-proof"],
  ["stats", "#web-proof .web-stats"],
  ["faq", "#web-faq"],
  ["pricing", "#web-pricing"],
  ["closing cta", "#web-pricing .uipack-web-cta"],
];

/** Shrink-to-fit regions centred on the page: their width follows the face, their axis must not move. */
const CENTRED = ["hero eyebrow", "hero title", "hero subtitle", "hero actions", "stats", "closing cta"];

for (const width of [1440, 390]) {
  test(`web: the same page in every style keeps its regions, order and columns at ${width}px`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors = watchErrors(page);
    const runs: Record<string, Box[]> = {};
    const headings: Record<string, string[]> = {};
    for (const style of STYLES) {
      await page.goto(`/web?style=${style}&layout=shared&theme=light`);
      const example = page.locator(".web-example");
      await expect(example).toHaveAttribute("data-ui-style", style);
      // Walk the page so the below-the-fold figure (loaded when near) is in place, then measure at the top.
      await page.locator("#web-mechanism").scrollIntoViewIfNeeded();
      await expect(page.locator("#web-mechanism figure")).toBeVisible({ timeout: 10_000 });
      await page.evaluate(() => scrollTo(0, 0));
      await page.evaluate(() => document.fonts.ready);
      runs[style] = await boxes(page, WEB_REGIONS);
      headings[style] = await example.locator("h1, h2, h3").allTextContents();
    }
    const base = runs.technical;
    for (const b of base) expect(b.x, `${b.name} exists`).not.toBeNaN();
    for (const style of STYLES) {
      const run = runs[style];
      // The same words, in the same reading order.
      expect(headings[style]).toEqual(headings.technical);
      // The same regions top to bottom.
      const order = (r: Box[]) => [...r].sort((a, b) => a.y - b.y || a.x - b.x).map((b) => b.name);
      expect(order(run)).toEqual(order(base));
      // The same columns: every region starts and spans the same width (font metrics change heights only).
      for (const [i, b] of run.entries()) {
        if (CENTRED.includes(b.name)) continue;
        expect(Math.abs(b.x - base[i].x), `${style} ${b.name} x`).toBeLessThanOrEqual(TOL);
        expect(Math.abs(b.w - base[i].w), `${style} ${b.name} width`).toBeLessThanOrEqual(TOL);
      }
      // Centred copy stays centred on the same axis.
      for (const name of CENTRED) {
        const a = run.find((b) => b.name === name)!;
        const t = base.find((b) => b.name === name)!;
        expect(Math.abs(a.x + a.w / 2 - (t.x + t.w / 2)), `${style} ${name} centre`).toBeLessThanOrEqual(TOL);
      }
    }
    expect(errors).toEqual([]);
  });
}

test("web: the style survives a reload and the switcher sits in the shell, not a second header", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/web?theme=light");
  await expect(page.locator(".web-example")).toHaveAttribute("data-ui-style", "technical");
  const switcher = page.locator(".showcase-context").getByRole("group", { name: "Style" });
  await switcher.getByRole("link", { name: "Graphical" }).click();
  await expect(page.locator(".web-example")).toHaveAttribute("data-ui-style", "graphical");
  await expect(page).toHaveURL(/style=graphical/);
  await page.reload();
  await expect(page.locator(".web-example")).toHaveAttribute("data-ui-style", "graphical");
  await expect(page.locator("html")).toHaveAttribute("data-ui-style", "graphical");
  await expect(switcher.getByRole("link", { name: "Graphical" })).toHaveAttribute("aria-current", "true");
  await expect(page.locator(".showcase-header")).toHaveCount(1);
  expect(errors).toEqual([]);
});

const DECK_REGIONS: [string, string][] = [
  ["stage", ".uipack-deck-stage"],
  ["eyebrow", ".uipack-deck-stage .uipack-deck-eyebrow"],
  ["headline", ".uipack-deck-stage :is(.uipack-deck-heading, .uipack-deck-title)"],
  ["footer", ".uipack-deck-stage .uipack-deck-footer"],
];

test("deck: the same slides in every style keep the region map and the reading order", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = watchErrors(page);
  const runs: Record<string, Box[][]> = {};
  for (const style of STYLES) {
    runs[style] = [];
    for (const slide of [1, 2, 3, 4]) {
      await page.goto(`/deck?deck=moves&slide=${slide}&style=${style}&theme=light`);
      await expect(page.locator(".uipack-deck").first()).toHaveAttribute("data-ui-style", style);
      await page.evaluate(() => document.fonts.ready);
      runs[style].push(await boxes(page, DECK_REGIONS));
    }
  }
  for (const style of STYLES)
    for (const [s, slide] of runs[style].entries()) {
      const base = runs.technical[s];
      for (const [i, b] of slide.entries()) {
        // A region present in one style is present in all, with the same words.
        expect(Number.isNaN(b.x), `${style} slide ${s + 1} ${b.name}`).toBe(Number.isNaN(base[i].x));
        if (Number.isNaN(b.x)) continue;
        expect(b.text, `${style} slide ${s + 1} ${b.name} words`).toBe(base[i].text);
        // The eyebrow, the headline's start and the footer stay put: the region map is the layout's.
        expect(Math.abs(b.x - base[i].x), `${style} slide ${s + 1} ${b.name} x`).toBeLessThanOrEqual(TOL);
        if (b.name !== "headline")
          expect(Math.abs(b.y - base[i].y), `${style} slide ${s + 1} ${b.name} y`).toBeLessThanOrEqual(TOL);
      }
    }
  expect(errors).toEqual([]);
});

test("a Section with its own uiStyle repaints inside another style's page", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/web?style=technical&theme=light");
  const own = page.locator("#web-nested-technical");
  const nested = page.locator("#web-nested-graphical");
  await expect(nested).toHaveAttribute("data-ui-style", "graphical");
  const look = (section: typeof own) =>
    section.evaluate((el) => {
      const cta = el.querySelector(".uipack-web-cta")!;
      const heading = el.querySelector(".uipack-web-heading")!;
      return {
        cta: getComputedStyle(cta).backgroundColor,
        radius: getComputedStyle(cta).borderTopLeftRadius,
        face: getComputedStyle(heading).fontFamily,
        ground: getComputedStyle(el).backgroundColor,
      };
    });
  const a = await look(own);
  const b = await look(nested);
  expect(a.cta).toBe("rgb(32, 95, 73)"); // Technical forest
  expect(b.cta).toBe("rgb(242, 74, 0)"); // Graphical signal orange
  expect(b.radius).toBe("0px");
  expect(b.face).toMatch(/^"?Anton/);
  expect(a.face).not.toMatch(/Anton/);
  expect(b.ground).toBe("rgb(241, 238, 230)"); // bone paper
  expect(errors).toEqual([]);
});

test("Technical's own layout: a figure in the hero, start-aligned heads, steps as numbered rows", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = watchErrors(page);
  await page.goto("/web?style=technical&theme=light");
  const example = page.locator(".web-example");
  await expect(example).toHaveAttribute("data-ui-layout", "style");
  const hero = page.locator(".web-example .uipack-web-hero");
  // The finished state shows without scrolling: the hero's figure renders once the page has loaded.
  await expect(hero.locator("figure.uipack")).toBeVisible({ timeout: 10_000 });
  await expect(hero.locator(".uipack-web-demo")).toHaveCount(0);
  expect(await hero.evaluate((el) => getComputedStyle(el).textAlign)).toBe("start");
  const head = page.locator("#web-pricing .uipack-web-section__head");
  expect(await head.evaluate((el) => getComputedStyle(el).textAlign)).toBe("start");
  // Steps: one column of rows, each the full width of the list.
  const list = await page.locator("#web-how .uipack-web-features").boundingBox();
  for (const row of await page.locator("#web-how .uipack-web-features > li").all())
    expect(Math.abs((await row.boundingBox())!.width - list!.width)).toBeLessThanOrEqual(1);
  // Landing keeps its centred demo hero.
  await page.goto("/web?style=landing&theme=light");
  await expect(page.locator(".web-example .uipack-web-hero .uipack-web-demo")).toBeVisible();
  expect(errors).toEqual([]);
});

test("the shell stays Technical whatever style the page shows", async ({ page }) => {
  for (const style of STYLES) {
    await page.goto(`/web?style=${style}&theme=light`);
    await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
    const shell = await page.evaluate(() => ({
      body: getComputedStyle(document.body).backgroundColor,
      link: getComputedStyle(document.querySelector(".showcase-groups a[aria-current]")!).color,
    }));
    expect(shell.body, style).toBe("rgb(246, 245, 241)");
    expect(shell.link, style).toBe("rgb(32, 95, 73)");
  }
});
