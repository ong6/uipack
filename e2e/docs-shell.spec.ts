import { expect, test, type Page } from "./fixtures";
import { sidebar } from "./page-audit";

// The docs shell's own behaviour (docs/specs/docs-site.md, "Navigation" and "Layout"): the
// location marker (the uipack mark, hopping) in "On this page" and in the sidebar, the plane, the
// widths at 1440 and 1920, the drawer and the contents disclosure at 390, search, and reduced
// motion. Moving between pages and the sidebar's contents are in nav.spec.ts.

/** The vertical centre of a box, in viewport pixels. */
const midY = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    });

const railMarker = ".uipack-docs__toc .uipack-docs__marker";
const navMarker = ".uipack-docs__sidebar .uipack-docs__nav-track .uipack-docs__marker";

/** Records, from the first script on each page, whether the sidebar's marker flew (data-flying was ever set). */
async function watchFlight(page: Page) {
  await page.addInitScript(() => {
    const w = window as { __flew?: boolean };
    w.__flew = false;
    new MutationObserver((records) => {
      for (const r of records)
        if (r.attributeName === "data-flying" && (r.target as Element).hasAttribute("data-flying")) w.__flew = true;
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-flying"] });
  });
}

interface Pose {
  x: number;
  y: number;
  /** Its vertical scale: under 1 while a landing squashes it. */
  sy: number;
  live: string | undefined;
  trail: boolean;
}
type Watched = { __poses?: Record<string, Pose[]> };

/**
 * Records, from the first script on each page, every pose the two markers are drawn in: where
 * (their own drawing's units), which cell is the mark's dot, and whether a trail was drawn.
 */
async function watchPoses(page: Page) {
  await page.addInitScript(() => {
    const w = window as Watched;
    w.__poses = { nav: [], rail: [] };
    new MutationObserver((records) => {
      for (const r of records) {
        const el = r.target as Element;
        if (!el.matches(".uipack-docs__marker")) continue;
        const [x, y] = (el.getAttribute("transform")?.match(/translate\(([-\d.]+) ([-\d.]+)\)/) ?? []).slice(1).map(Number);
        const where = el.closest(".uipack-docs__sidebar") ? "nav" : el.closest(".uipack-docs__toc") ? "rail" : null;
        if (!where || x === undefined) continue;
        w.__poses![where].push({
          x,
          y,
          sy: Number(el.getAttribute("transform")?.match(/scale\([-\d.]+ ([-\d.]+)\)/)?.[1] ?? 1),
          live: el.querySelector<SVGElement>("[data-live]")?.dataset.cell,
          trail: !!el.parentElement?.querySelector(".uipack-docs__nav-trail")?.getAttribute("d"),
        });
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["transform"] });
  });
}
const poses = (page: Page, where: "nav" | "rail") => page.evaluate((k) => (window as Watched).__poses![k], where);
const clearPoses = (page: Page) => page.evaluate(() => void ((window as Watched).__poses = { nav: [], rail: [] }));

/** The mark's dot as painted in a marker: its cell and its fill. */
const dotOf = (page: Page, marker: string) =>
  page
    .locator(`${marker} rect[data-live]`)
    .evaluate((r) => ({ cell: (r as SVGElement).dataset.cell, fill: getComputedStyle(r).fill }));

/** A colour value as the docs layout resolves it. */
const colourOf = (page: Page, value: string) =>
  page.locator(".uipack-docs").evaluate((el, v) => {
    const probe = document.createElement("i");
    probe.style.color = v;
    el.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  }, value);

/** Waits until a marker's centre stops moving, and returns it. */
async function settled(page: Page, selector: string) {
  let last = NaN;
  await expect
    .poll(
      async () => {
        const y = await midY(page, selector);
        const still = Math.abs(y - last) < 0.5;
        last = y;
        return still;
      },
      { intervals: [120], timeout: 8000 },
    )
    .toBe(true);
  return last;
}

test.describe("On this page", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the mark hops to the heading picked, then to the heading scrolled to", async ({ page }) => {
    await page.goto("/foundations/style?theme=light");
    const rail = page.getByRole("complementary", { name: "On this page" });
    const links = rail.getByRole("link");
    await expect(links.first()).toBeVisible();
    // The mark rests on the first heading before the reader has passed one, in the page's state:
    // a Rules page, so the dot is the top right cell in the accent.
    await expect(page.locator(railMarker)).toHaveAttribute("data-at", /.+/);
    expect(await page.locator(`${railMarker} .uipack-docs__marker-mark`).count()).toBe(1);
    expect(await dotOf(page, railMarker)).toEqual({ cell: "1", fill: await colourOf(page, "var(--ui-accent)") });

    // Pick a heading: it becomes current at once and the mark lands beside it.
    const pick = links.nth(4);
    const id = (await pick.getAttribute("href"))!.slice(1);
    await pick.click();
    await expect(pick).toHaveAttribute("aria-current", "location");
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    const landed = await settled(page, railMarker);
    const target = await pick.evaluate((a) => {
      const r = a.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    expect(Math.abs(landed - target)).toBeLessThan(3);
    await expect(page.locator(railMarker)).toHaveAttribute("data-at", id);
    // The heading itself was scrolled to just under the sticky banner.
    await expect
      .poll(() => page.locator(`[id="${id}"]`).evaluate((h) => Math.round(h.getBoundingClientRect().top)))
      .toBeLessThan(140);

    // Scroll on: the pick lets go and the marker follows the reading line to whichever heading is current.
    await page
      .locator(`[id="${(await links.nth(1).getAttribute("href"))!.slice(1)}"]`)
      .evaluate((h) => scrollTo({ top: scrollY + h.getBoundingClientRect().top - 100, behavior: "instant" }));
    const now = rail.locator('[aria-current="location"]');
    await expect(now).not.toHaveAttribute("href", `#${id}`);
    const y = await settled(page, railMarker);
    const nowMid = await now.evaluate((a) => {
      const r = a.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    expect(Math.abs(y - nowMid)).toBeLessThan(3);
  });

  test("one hop to the next heading; picked twice at once, it goes to the latest", async ({ page }) => {
    await watchPoses(page);
    await page.goto("/foundations/style?theme=dark");
    const links = page.getByRole("complementary", { name: "On this page" }).getByRole("link");
    await expect(page.locator(railMarker)).toHaveAttribute("data-at", /.+/);
    await settled(page, railMarker);
    await clearPoses(page);
    // The next heading, straight down the path: it rises off the path (to its right), comes down
    // onto it.
    await links.nth(1).click();
    await expect(links.nth(1)).toHaveAttribute("aria-current", "location");
    await settled(page, railMarker);
    const hop = await poses(page, "rail");
    expect(Math.max(...hop.map((p) => p.x)) - hop.at(-1)!.x).toBeGreaterThan(3);
    // Stretched or squashed on the way (the pose itself is unit-tested), at rest at its own size.
    expect(hop.some((p) => p.sy !== 1)).toBe(true);
    expect(hop.at(-1)!.sy).toBe(1);
    // Two picks, the second before the first hop is over: no queue, it lands on the second.
    await links.nth(3).click();
    const pick = links.nth(5);
    await pick.click();
    await expect(pick).toHaveAttribute("aria-current", "location");
    await expect(page.locator(railMarker)).toHaveAttribute("data-at", (await pick.getAttribute("href"))!.slice(1));
    // Wait on where it is, not on its being still: a busy page can hold it still mid-trip.
    await expect
      .poll(async () => {
        const target = await pick.evaluate((a) => {
          const r = a.getBoundingClientRect();
          return r.top + r.height / 2;
        });
        return Math.abs((await midY(page, railMarker)) - target);
      })
      .toBeLessThan(3);
    // And there it stays, at rest.
    const rest = await settled(page, railMarker);
    expect(
      Math.abs(rest - (await midY(page, `${railMarker} >> xpath=ancestor::aside//a[@aria-current="location"]`))),
    ).toBeLessThan(3);
  });

  test("the path steps right for a sub-heading, and the read part is drawn", async ({ page }) => {
    await page.goto("/foundations/style?theme=dark");
    const sub = page.locator('.uipack-docs__toc-list li[data-level="3"] a').first();
    await expect(sub).toBeVisible();
    await sub.click();
    await settled(page, railMarker);
    const markerX = await page.locator(railMarker).evaluate((el) => el.getBoundingClientRect().left);
    const top = page.locator('.uipack-docs__toc-list li[data-level="2"] a').first();
    await top.click();
    await settled(page, railMarker);
    const topX = await page.locator(railMarker).evaluate((el) => el.getBoundingClientRect().left);
    expect(markerX - topX).toBeGreaterThan(8);
    expect(await page.locator(".uipack-docs__rail-done").getAttribute("d")).toMatch(/^M/);
  });
});

test.describe("the sidebar's marker", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("hops from the page left to the one opened, opening its section, and docks beside the link", async ({ page }) => {
    await watchFlight(page);
    await watchPoses(page);
    await page.goto("/agents?theme=light");
    const nav = sidebar(page);
    // On a fresh visit it docks beside the current page without flying.
    await expect(nav.locator('[aria-current="page"]')).toHaveText("How agents use UiPack");
    await settled(page, navMarker);
    expect(await page.evaluate(() => (window as { __flew?: boolean }).__flew)).toBe(false);
    // The mark in the page's state: a Start page, the dot top left in the ink.
    expect(await page.locator(`${navMarker} .uipack-docs__marker-mark`).count()).toBe(1);
    expect(await dotOf(page, navMarker)).toEqual({ cell: "0", fill: await colourOf(page, "var(--ui-ink)") });

    await nav.getByRole("button", { name: "Rules", exact: true }).click();
    await nav.getByRole("link", { name: "Style contract", exact: true }).click();
    await expect(page).toHaveURL(/\/foundations\/style\?theme=light$/);
    const current = sidebar(page).locator('[aria-current="page"]');
    await expect(current).toHaveText("Style contract");
    const y = await settled(page, navMarker);
    expect(await page.evaluate(() => (window as { __flew?: boolean }).__flew)).toBe(true);
    const link = await current.evaluate((a) => {
      const r = a.getBoundingClientRect();
      return { mid: r.top + r.height / 2, left: r.left, text: r.left + parseFloat(getComputedStyle(a).paddingLeft) };
    });
    expect(Math.abs(y - link.mid)).toBeLessThan(3);
    // Docked in the link's left padding, before its text, in the section's hue (Rules: the accent).
    const box = (await page.locator(navMarker).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(link.left - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(link.text);
    const colours = await page.evaluate(() => {
      const track = document.querySelector(".uipack-docs__sidebar .uipack-docs__nav-track")!;
      const accent = document.createElement("span");
      accent.style.color = "var(--ui-accent)";
      document.body.append(accent);
      const out = [getComputedStyle(track).color, getComputedStyle(accent).color];
      accent.remove();
      return out;
    });
    await expect
      .poll(() => page.locator(".uipack-docs__sidebar .uipack-docs__nav-track").evaluate((t) => getComputedStyle(t).color))
      .toBe(colours[1]);
    // The trip was hops: it rose off the page column (to its right) and landed back on it, with no
    // trail; it set off as the mark of the page left (Start's cell) and landed as this page's
    // (Rules: the top right cell, in the accent).
    const trip = await poses(page, "nav");
    const column = trip.at(-1)!.x;
    expect(Math.max(...trip.map((p) => p.x)) - column).toBeGreaterThan(3);
    expect(trip.some((p) => p.sy !== 1)).toBe(true);
    expect(trip.at(-1)!.sy).toBe(1);
    expect(trip.some((p) => p.trail)).toBe(false);
    expect([...new Set(trip.map((p) => p.live))]).toEqual(["0", "1"]);
    await expect.poll(() => dotOf(page, navMarker)).toEqual({ cell: "1", fill: colours[1] });

    // Crossing into a shut section (the pager's next page is still in Rules; search jumps to Check):
    // the section opens as the marker arrives.
    await page.keyboard.press("ControlOrMeta+k");
    await page.getByRole("combobox", { name: "Search the docs" }).fill("calibration anchors");
    await expect(page.getByRole("option").first()).toContainText("Calibration anchors");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/grading\/calibration\?theme=light/);
    const check = sidebar(page).getByRole("button", { name: "Check", exact: true });
    await expect(check).toHaveAttribute("aria-expanded", "true");
    const landed = await settled(page, navMarker);
    const target = await sidebar(page)
      .locator('[aria-current="page"]')
      .evaluate((a) => {
        const r = a.getBoundingClientRect();
        return r.top + r.height / 2;
      });
    expect(Math.abs(landed - target)).toBeLessThan(3);
  });

  test("on a Reference page the mark is the neutral one: the dot bottom right in the ink", async ({ page }) => {
    await page.goto("/reference/registry?theme=dark");
    await settled(page, navMarker);
    expect(await dotOf(page, navMarker)).toEqual({ cell: "3", fill: await colourOf(page, "var(--ui-ink)") });
    // Three squares outlined in the ink, on a line that still reads at marker size.
    const squares = await page
      .locator(`${navMarker} rect:not([data-live])`)
      .evaluateAll((rects) => rects.map((r) => [getComputedStyle(r).stroke, parseFloat(getComputedStyle(r).strokeWidth)]));
    expect(squares).toEqual([0, 1, 2].map(() => [expect.any(String), 1.25]));
    expect(new Set(squares.map((q) => q[0]))).toEqual(new Set([await colourOf(page, "var(--ui-ink)")]));
    const box = (await page.locator(navMarker).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(13);
    expect(box.width).toBeLessThanOrEqual(16);
  });

  test("?marker=plane swaps the mark for the paper plane in both places, for the rest of the visit, and it still flies", async ({
    page,
  }) => {
    await watchFlight(page);
    await watchPoses(page);
    await page.goto("/agents?theme=dark&marker=plane");
    await expect(page.locator(`${navMarker} .uipack-docs__marker-plane`)).toHaveCount(1);
    await expect(page.locator(`${railMarker} .uipack-docs__marker-plane`)).toHaveCount(1);
    await expect(page.locator(".uipack-docs__marker-mark")).toHaveCount(0);
    await sidebar(page).getByRole("link", { name: "Install and use", exact: true }).click();
    await expect(page).toHaveURL(/\/start\/install/);
    await expect(page.locator(`${navMarker} .uipack-docs__marker-plane`)).toHaveCount(1);
    const y = await settled(page, navMarker);
    const link = await midY(page, '.uipack-docs__sidebar [aria-current="page"]');
    expect(Math.abs(y - link)).toBeLessThan(3);
    // A flight, not hops: it kept to the page column, with its dotted trail behind it.
    expect(await page.evaluate(() => (window as { __flew?: boolean }).__flew)).toBe(true);
    const trip = await poses(page, "nav");
    expect(new Set(trip.map((p) => p.x)).size).toBe(1);
    expect(trip.some((p) => p.trail)).toBe(true);
    await page.goto("/start/install?marker=mark");
    await expect(page.locator(`${navMarker} .uipack-docs__marker-mark`)).toHaveCount(1);
  });
});

test.describe("widths", () => {
  for (const width of [1440, 1920]) {
    test(`${width}: the column and the rail sit together, prose at its measure, tables the full column`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/agents?theme=light");
      const rail = page.locator(".uipack-docs__toc");
      await expect(rail).toBeVisible();
      const g = await page.evaluate(() => {
        const box = (s: string) => document.querySelector(s)!.getBoundingClientRect();
        const side = box(".uipack-docs__sidebar");
        const main = box("main.uipack-docs__article");
        const toc = box(".uipack-docs__toc");
        const paras = [...document.querySelectorAll<HTMLElement>(".uipack-docs__prose > p")];
        const proseRight = Math.max(...paras.map((p) => p.getBoundingClientRect().right));
        const proseWidth = Math.max(...paras.map((p) => p.getBoundingClientRect().width));
        const fontSize = parseFloat(getComputedStyle(paras[0]).fontSize);
        const table = document.querySelector(".uipack-docs__prose .uipack-docs__table")?.getBoundingClientRect();
        return { side, main, toc, proseRight, proseWidth, fontSize, table, vw: innerWidth };
      });
      // No dead gutter: the rail starts within ~a quarter of the column of the prose's right edge.
      expect(g.toc.left - g.proseRight).toBeLessThanOrEqual(220);
      expect(g.toc.left + 5 - g.main.right).toBeGreaterThanOrEqual(38);
      expect(g.toc.left + 5 - g.main.right).toBeLessThanOrEqual(58);
      expect(g.main.width).toBeLessThanOrEqual(881);
      // The pair is centred in the space right of the sidebar (the rail's box reaches 5px past its
      // text on each side: room for a focus ring).
      const leftGap = g.main.left - g.side.right;
      const rightGap = g.vw - (g.toc.right - 5);
      expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(2);
      // Prose stops at about 76ch; a table takes the whole column.
      expect(g.proseWidth).toBeLessThanOrEqual(g.fontSize * 0.62 * 76);
      expect(g.proseWidth).toBeLessThan(g.main.width);
      expect(Math.abs(g.table!.width - g.main.width)).toBeLessThanOrEqual(1);
    });
  }

  test("a page without a rail gives its figures a column within 1% of 1184px at 1440", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/components/diagrams");
    const w = await page.locator("main.uipack-docs__article").evaluate((el) => el.getBoundingClientRect().width);
    expect(w).toBeGreaterThanOrEqual(1172);
    expect(w).toBeLessThanOrEqual(1184);
  });

  test("between 900 and 1180 the rail folds into the disclosure; the sidebar stays", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/agents");
    await expect(sidebar(page)).toBeVisible();
    await expect(page.locator(".uipack-docs__toc")).toBeHidden();
    await expect(page.locator(".uipack-docs__contents summary")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024);
  });
});

// The banner's content keeps the edges of the layout under it: the logo (below 900px the menu
// icon) starts where the sidebar's content (the page) starts, and the last control ends where "On
// this page" ends, or the page column on a page with no rail. Within 1px at every width.
test.describe("the banner's edges", () => {
  for (const path of ["/agents", "/components/diagrams"])
    for (const width of [1920, 1440, 1100, 390]) {
      test(`${path} at ${width}: the logo and the last control sit on the layout's edges`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${path}?theme=light`);
        await expect(page.locator("main.uipack-docs__article h1")).toBeVisible();
        const g = await page.evaluate(() => {
          const box = (s: string) => {
            const r = document.querySelector(s)?.getBoundingClientRect();
            return r && r.width > 0 ? { left: r.left, right: r.right, mid: r.top + r.height / 2 } : null;
          };
          return {
            menu: box(".showcase-menu-button path"),
            brand: box(".showcase-brand svg")!,
            tab: box(".showcase-tabs a")!,
            last: box(".showcase-header__actions > :last-child")!,
            search: box(".uipack-docs__sidebar .uipack-docs-search__button"),
            main: box("main.uipack-docs__article")!,
            // The rail's box reaches 5px past its text on each side (room for a focus ring).
            railTitle: box(".uipack-docs__toc > p"),
            scrollWidth: document.documentElement.scrollWidth,
          };
        });
        if (width >= 900) {
          expect(g.menu, "no menu button beside a docked sidebar").toBeNull();
          expect(Math.abs(g.brand.left - g.search!.left), "logo on the sidebar's left edge").toBeLessThanOrEqual(1);
        } else {
          expect(g.search, "the sidebar is a drawer").toBeNull();
          expect(Math.abs(g.menu!.left - g.main.left), "menu icon on the page's left edge").toBeLessThanOrEqual(1);
        }
        const right = g.railTitle ? g.railTitle.right : g.main.right;
        expect(Math.abs(g.last.right - right), "last control on the layout's right edge").toBeLessThanOrEqual(1);
        // One centre line across the bar.
        for (const item of [g.menu, g.tab, g.last]) if (item) expect(Math.abs(item.mid - g.brand.mid)).toBeLessThanOrEqual(1);
        expect(g.scrollWidth).toBeLessThanOrEqual(width);
      });
    }

  test("the sidebar's section labels start on its page links' text edge; the rail's title on the first row's centre line", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/agents?theme=light");
    await expect(page.locator(".uipack-docs__toc")).toBeVisible();
    const g = await page.evaluate(() => {
      const nav = document.querySelector(".uipack-docs__sidebar .uipack-docs__navigation")!;
      const link = nav.querySelector<HTMLElement>(".uipack-docs__nav-section[data-open] .uipack-docs__nav-inner a")!;
      const mid = (s: string) => {
        const r = document.querySelector(s)!.getBoundingClientRect();
        return r.top + r.height / 2;
      };
      return {
        label: nav.querySelector(".uipack-docs__nav-label")!.getBoundingClientRect().left,
        linkText: link.getBoundingClientRect().left + parseFloat(getComputedStyle(link).paddingLeft),
        railTitle: mid(".uipack-docs__toc > p"),
        firstRow: mid(".showcase-context"),
      };
    });
    expect(Math.abs(g.label - g.linkText)).toBeLessThanOrEqual(1);
    expect(Math.abs(g.railTitle - g.firstRow)).toBeLessThanOrEqual(1);
  });

  test("the charts page never scrolls sideways where its frame fills the column", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto("/charts?theme=light");
    await expect(page.locator(".chart-frame").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1100);
  });
});

test.describe("390px", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("the drawer and the On this page disclosure", async ({ page }) => {
    await page.goto("/foundations/style?theme=dark");
    await expect(page.locator(".uipack-docs__sidebar")).toBeHidden();
    await expect(page.locator(".uipack-docs__toc")).toBeHidden();
    // On this page: a disclosure above the page, naming the current heading.
    const contents = page.locator(".uipack-docs__contents");
    const summary = contents.locator("summary");
    await expect(summary).toContainText("On this page");
    expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await summary.click();
    await expect(contents).toHaveAttribute("open", "");
    const link = contents.getByRole("link").nth(2);
    const id = (await link.getAttribute("href"))!.slice(1);
    const name = (await link.textContent())!;
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await link.click();
    await expect(contents).not.toHaveAttribute("open", "");
    await expect
      .poll(() => page.locator(`[id="${id}"]`).evaluate((h) => Math.round(h.getBoundingClientRect().top)))
      .toBeLessThan(140);
    await expect(summary.locator("small")).toHaveText(name);
    // The drawer: the sidebar from the left, its current page marked by the marker too.
    await page.getByRole("button", { name: "Open navigation" }).click();
    const drawer = page.getByRole("dialog", { name: "Library menu" });
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('[aria-current="page"]')).toHaveText("Style contract");
    await expect(drawer.locator(".uipack-docs__nav-track")).not.toHaveAttribute("data-hidden");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test("phone type sizes: prose 16px, h1 36px", async ({ page }) => {
    await page.goto("/agents");
    expect(
      await page
        .locator(".uipack-docs__prose > p")
        .first()
        .evaluate((p) => getComputedStyle(p).fontSize),
    ).toBe("16px");
    expect(await page.locator(".uipack-docs__prose h1").evaluate((h) => getComputedStyle(h).fontSize)).toBe("36px");
  });

  test("search from the drawer: full screen, finds a page, opens it", async ({ page }) => {
    await page.goto("/charts");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page
      .getByRole("dialog", { name: "Library menu" })
      .getByRole("button", { name: /Search docs/ })
      .click();
    const dialog = page.getByRole("dialog", { name: "Search the docs" });
    await expect(dialog).toBeVisible();
    const box = (await dialog.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(389);
    await page.getByRole("combobox", { name: "Search the docs" }).fill("smooth scrolling");
    const first = page.getByRole("option").first();
    await expect(first).toContainText("Smooth scrolling");
    await first.tap();
    await expect(page).toHaveURL(/\/reference\/web-principles\/smooth-scroll|\/reference\/web-principles\?/);
  });
});

test.describe("search", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("⌘K / Ctrl-K and the sidebar box open it; results are grouped by section, keyboard first", async ({ page }) => {
    // The index loads on first open, not with the page: nothing requests it while the page loads.
    const requested: string[] = [];
    page.on("request", (r) => new URL(r.url()).pathname === "/search-index.json" && requested.push(r.url()));
    await page.goto("/charts?theme=dark");
    await expect(page.locator("main h1")).toBeVisible();
    await page.waitForLoadState("load");
    const dialog = page.getByRole("dialog", { name: "Search the docs" });
    expect(requested).toEqual([]);
    await page.keyboard.press("ControlOrMeta+k");
    await expect(dialog).toBeVisible();
    const input = page.getByRole("combobox", { name: "Search the docs" });
    await expect(input).toBeFocused();
    await input.fill("registry");
    const options = page.getByRole("option");
    await expect(options.first()).toContainText("Registry");
    await expect(options.first()).toHaveAttribute("aria-selected", "true");
    expect(requested.length).toBe(1);
    // Grouped by section: the first group is Reference, in its hue.
    const group = dialog.getByRole("group").first();
    await expect(group).toHaveAccessibleName(/Reference/i);
    // Arrow keys move the selection; Escape closes and Enter on a result opens it.
    await page.keyboard.press("ArrowDown");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await sidebar(page)
      .locator("xpath=..")
      .getByRole("button", { name: /Search docs/ })
      .click();
    await expect(dialog).toBeVisible();
    await input.fill("registry");
    await expect(options.first()).toContainText("Registry");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/specs\/registry\?theme=dark$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("registry", { ignoreCase: true });
  });

  test("finds body text and a heading, and lands on the heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h1")).toBeVisible();
    await page.keyboard.press("ControlOrMeta+k");
    await page.getByRole("combobox", { name: "Search the docs" }).fill("drafting film");
    const first = page.getByRole("option").first();
    await expect(first).toBeVisible();
    const href = (await first.getAttribute("href"))!;
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    await expect(page.getByRole("status").filter({ hasText: "No results" })).toHaveCount(0);
  });
});

test.describe("reduced motion", () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });

  test("the markers jump: no hops in the sidebar, the rail and the page land at once", async ({ page }) => {
    await watchFlight(page);
    await watchPoses(page);
    await page.goto("/agents");
    await sidebar(page).getByRole("link", { name: "Install and use", exact: true }).click();
    await expect(page).toHaveURL(/\/start\/install/);
    const current = sidebar(page).locator('[aria-current="page"]');
    await expect(current).toHaveText("Install and use");
    const link = await current.evaluate((a) => {
      const r = a.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    await expect.poll(() => midY(page, navMarker)).toBeCloseTo(link, 0);
    expect(await page.evaluate(() => (window as { __flew?: boolean }).__flew)).toBe(false);
    // Drawn in place, as this page's mark, never off the page column.
    expect(await dotOf(page, navMarker)).toEqual({ cell: "0", fill: await colourOf(page, "var(--ui-ink)") });
    expect(new Set((await poses(page, "nav")).map((p) => p.x)).size).toBe(1);
    // A heading picked in the rail: the page and the marker are there on the next frame.
    const pick = page.getByRole("complementary", { name: "On this page" }).getByRole("link").nth(2);
    const id = (await pick.getAttribute("href"))!.slice(1);
    await pick.click();
    const at = await page.evaluate(
      (id) =>
        new Promise<number>((done) =>
          requestAnimationFrame(() => done(document.getElementById(id)!.getBoundingClientRect().top)),
        ),
      id,
    );
    expect(at).toBeLessThan(140);
    const marker = await midY(page, railMarker);
    const target = await pick.evaluate((a) => {
      const r = a.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    expect(Math.abs(marker - target)).toBeLessThan(3);
    expect(new Set((await poses(page, "rail")).map((p) => p.x)).size).toBe(1);
  });
});
