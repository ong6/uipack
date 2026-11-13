import { expect, test, waitForStable, type Page } from "./fixtures";
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

/** Waits until a marker's centre has stopped moving (three readings running: a busy page can hold a hop's start back), and returns it. */
async function settled(page: Page, selector: string) {
  let last = NaN;
  let calm = 0;
  await expect
    .poll(
      async () => {
        const y = await midY(page, selector);
        calm = Math.abs(y - last) < 0.5 ? calm + 1 : 0;
        last = y;
        return calm >= 3;
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
    expect(Math.max(...hop.map((p) => Math.abs(p.x - hop.at(-1)!.x)))).toBeGreaterThan(1);
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

  test("the marker lands on a picked heading whose link wraps as it turns current", async ({ page }) => {
    // The current link is bold; where a face's advances run wider (Linux) a heading can wrap to two
    // lines as it turns current, re-laying out the rail mid-glide. Forced here with letter-spacing.
    await page.goto("/foundations/style?theme=light");
    const links = page.getByRole("complementary", { name: "On this page" }).getByRole("link");
    await expect(links.first()).toBeVisible();
    await page.addStyleTag({ content: ".uipack-docs__toc-list a[aria-current] { letter-spacing: 0.25em }" });
    const pick = links.nth(1);
    const single = (await pick.boundingBox())!.height;
    await pick.click();
    await expect(pick).toHaveAttribute("aria-current", "location");
    expect((await pick.boundingBox())!.height).toBeGreaterThan(single * 1.4);
    const landed = await settled(page, railMarker);
    const mid = await pick.evaluate((a) => {
      const r = a.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    expect(Math.abs(landed - mid)).toBeLessThan(3);
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

  test("on a long jump the mark stays by its path, steps included: 7px to its right at most, less to its left", async ({
    page,
  }) => {
    // Every pose the rail's mark is drawn in, against the dotted path as it is laid out at that
    // moment (the rail re-lays out when the current link turns bold): how far the mark is from the
    // path at its own height, to the right (+) or the left (-).
    await page.addInitScript(() => {
      const w = window as { __off?: number[]; __markX?: number[]; __columns?: number[] };
      w.__off = [];
      w.__markX = [];
      w.__columns = [];
      new MutationObserver((records) => {
        for (const r of records) {
          const el = r.target as Element;
          if (!el.matches(".uipack-docs__toc .uipack-docs__marker")) continue;
          const at = el.getAttribute("transform")?.match(/translate\(([-\d.]+) ([-\d.]+)\)/);
          const d = el.parentElement?.querySelector(".uipack-docs__rail-base")?.getAttribute("d");
          if (!at || !d) continue;
          const pts = [...d.matchAll(/[ML]([-\d.]+) ([-\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
          // Where it stands on the path: a stretched or squashed mark is drawn from its foot
          // (markerTransform: 6.8px below its centre), which moves its centre a little.
          const sy = Number(el.getAttribute("transform")?.match(/scale\([-\d.]+ ([-\d.]+)\)/)?.[1] ?? 1);
          const y = Number(at[2]) - (1 - sy) * 6.8;
          let x = pts[0][0];
          for (let i = 1; i < pts.length; i++) {
            const [ax, ay] = pts[i - 1];
            const [bx, by] = pts[i];
            if (y > by && i < pts.length - 1) continue;
            x = by === ay ? bx : ax + (bx - ax) * Math.max(0, Math.min(1, (y - ay) / (by - ay)));
            break;
          }
          w.__off!.push(Number(at[1]) - x);
          w.__markX!.push(Number(at[1]));
          for (const [px] of pts) if (!w.__columns!.includes(px)) w.__columns!.push(px);
        }
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ["transform"] });
    });
    // A page whose rail steps right for sub-headings, several times.
    await page.goto("/specs/docs-site?theme=light");
    const links = page.getByRole("complementary", { name: "On this page" }).getByRole("link");
    await expect(links.first()).toBeVisible();
    expect(await page.locator('.uipack-docs__toc-list li[data-level="3"]').count()).toBeGreaterThan(1);
    await settled(page, railMarker);
    const count = await links.count();
    await page.evaluate(() => {
      const w = window as { __off?: number[]; __markX?: number[] };
      w.__off = [];
      w.__markX = [];
    });
    // The whole rail down, back up, and a jump cut short by another (its lift is carried into the next).
    for (const pick of [count - 1, 0, count - 2]) {
      await links.nth(pick).click();
      await expect(links.nth(pick)).toHaveAttribute("aria-current", "location");
      await settled(page, railMarker);
    }
    await links.nth(1).click();
    await page.waitForTimeout(140);
    await links.nth(count - 1).click();
    await settled(page, railMarker);
    const off = await page.evaluate(() => (window as { __off?: number[] }).__off!);
    expect(off.length).toBeGreaterThan(60);
    // It does leave the path (hops), a little: the sidebar's arcs, 7px to the right and 4.2px to the left.
    expect(Math.max(...off)).toBeGreaterThan(2);
    expect(Math.max(...off)).toBeLessThanOrEqual(7.05);
    expect(Math.min(...off)).toBeGreaterThanOrEqual(-4.25);
    // Across the steps it leans to the inside: never right of the sub-headings' column, so a
    // step and an arc never add up.
    const { markX, columns } = await page.evaluate(() => {
      const w = window as { __markX?: number[]; __columns?: number[] };
      return { markX: w.__markX!, columns: w.__columns! };
    });
    expect(columns.length).toBe(2);
    expect(Math.max(...markX)).toBeLessThanOrEqual(Math.max(...columns) + 0.05);
  });

  test("a picked heading is one history entry: Back returns the reader to where they were on the page, Forward to the heading", async ({
    page,
  }) => {
    const pageY = () => page.evaluate(() => Math.round(scrollY));
    const entries = () => page.evaluate(() => history.length);
    await page.goto("/foundations?theme=light");
    await expect(page.locator("main h1")).toBeVisible();
    await page.goto("/looks/diagrams?theme=light");
    const rail = page.getByRole("complementary", { name: "On this page" });
    const links = rail.getByRole("link");
    await expect(links.first()).toBeVisible();
    // The reader is a little way down the page, then picks the last heading: thousands of pixels on.
    await page.mouse.wheel(0, 300);
    await waitForStable(pageY);
    const from = await pageY();
    expect(from).toBeGreaterThan(100);
    const before = await entries();
    const pick = links.last();
    const id = (await pick.getAttribute("href"))!.slice(1);
    await pick.click();
    await expect(page).toHaveURL(new RegExp(`/looks/diagrams\\?theme=light#${id}$`));
    await expect(pick).toHaveAttribute("aria-current", "location");
    await waitForStable(pageY, { every: 200 });
    const landed = await pageY();
    expect(landed - from).toBeGreaterThan(2000);
    expect(await entries()).toBe(before + 1);

    // Back stays on the page: where the reader was, the address without the fragment, the pick let go.
    await page.goBack();
    await expect(page).toHaveURL(/\/looks\/diagrams\?theme=light$/);
    await expect.poll(pageY).toBeLessThan(from + 9);
    await waitForStable(pageY);
    expect(Math.abs((await pageY()) - from)).toBeLessThanOrEqual(8);
    await expect(pick).not.toHaveAttribute("aria-current", "location");
    // Forward goes to the heading again.
    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect.poll(pageY).toBeGreaterThan(landed - 9);
    await waitForStable(pageY);
    expect(Math.abs((await pageY()) - landed)).toBeLessThanOrEqual(8);

    // Headings passed while scrolling add nothing, nor does picking the heading the address already names.
    await page.mouse.wheel(0, -1500);
    await waitForStable(pageY);
    await expect(pick).not.toHaveAttribute("aria-current", "location");
    expect(await entries()).toBe(before + 1);
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await pick.click();
    await waitForStable(pageY, { every: 200 });
    expect(await entries()).toBe(before + 1);
    // Another heading is one more entry; two Backs and the reader is where they started, a third leaves the page.
    const other = links.nth(1);
    await other.click();
    await expect(page).toHaveURL(new RegExp(`#${(await other.getAttribute("href"))!.slice(1)}$`));
    await waitForStable(pageY, { every: 200 });
    expect(await entries()).toBe(before + 2);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await page.goBack();
    await expect(page).toHaveURL(/\/looks\/diagrams\?theme=light$/);
    await waitForStable(pageY);
    expect(Math.abs((await pageY()) - from)).toBeLessThanOrEqual(8);
    await page.goBack();
    await expect(page).toHaveURL(/\/foundations\?theme=light$/);
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
    // Wait on where it is, not on its being still: it stands still in its portal before the last hop.
    const linkOf = () =>
      current.evaluate((a) => {
        const r = a.getBoundingClientRect();
        return { mid: r.top + r.height / 2, left: r.left, text: r.left + parseFloat(getComputedStyle(a).paddingLeft) };
      });
    await expect
      .poll(async () => Math.abs((await midY(page, navMarker)) - (await linkOf()).mid), { timeout: 8000 })
      .toBeLessThan(3);
    await settled(page, navMarker);
    expect(await page.evaluate(() => (window as { __flew?: boolean }).__flew)).toBe(true);
    const link = await linkOf();
    expect(Math.abs((await midY(page, navMarker)) - link.mid)).toBeLessThan(3);
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
    // The trip was hops: it rose off the page column (to its right) and landed back on it, its
    // dotted trail behind it; it set off as the mark of the page left (Start's cell) and landed as this page's
    // (Rules: the top right cell, in the accent).
    const trip = await poses(page, "nav");
    const column = trip.at(-1)!.x;
    expect(Math.max(...trip.map((p) => Math.abs(p.x - column)))).toBeGreaterThan(1);
    expect(trip.some((p) => p.sy !== 1)).toBe(true);
    expect(trip.at(-1)!.sy).toBe(1);
    expect(trip.some((p) => p.trail)).toBe(true);
    expect([...new Set(trip.map((p) => p.live))]).toEqual(["0", "1"]);
    await expect.poll(() => dotOf(page, navMarker)).toEqual({ cell: "1", fill: colours[1] });

    // Crossing into a shut section (the pager's next page is still in Rules; search jumps to Check):
    // the section is open from the page's first frame, whatever the marker is doing.
    await page.keyboard.press("ControlOrMeta+k");
    await page.getByRole("combobox", { name: "Search the docs" }).fill("calibration anchors");
    await expect(page.getByRole("option").first()).toContainText("Calibration anchors");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/grading\/calibration\?theme=light/);
    const check = sidebar(page).getByRole("button", { name: "Check", exact: true });
    await expect(check).toHaveAttribute("aria-expanded", "true");
    // On where it is again, not on its being still: this trip stops in its portal too.
    const targetOf = () =>
      sidebar(page)
        .locator('[aria-current="page"]')
        .evaluate((a) => {
          const r = a.getBoundingClientRect();
          return r.top + r.height / 2;
        });
    await expect
      .poll(async () => Math.abs((await midY(page, navMarker)) - (await targetOf())), { timeout: 8000 })
      .toBeLessThan(3);
    const landed = await settled(page, navMarker);
    expect(Math.abs(landed - (await targetOf()))).toBeLessThan(3);
  });

  test("a long trip starts at the edge of the sidebar's visible part, and the header's mark changes on its own clock", async ({
    page,
  }) => {
    await page.goto("/recipes/landing?theme=light");
    const nav = sidebar(page);
    await settled(page, navMarker);
    // The reader opens Check and scrolls the sidebar to a page in it: the current page's link is far above, out of view.
    await nav.getByRole("button", { name: "Check", exact: true }).click();
    const link = nav.locator('a[href^="/grading/rubrics/landing"]');
    // Once the section has opened (its fold plays), so the sidebar is laid out as the next page's will be.
    await waitForStable(() => page.locator(".uipack-docs__sidebar").evaluate((el) => el.scrollHeight));
    await link.scrollIntoViewIfNeeded();
    await expect(nav.locator('[aria-current="page"]')).not.toBeInViewport();
    const far = await nav.locator('[aria-current="page"]').evaluate(
      (a, to) => {
        const target = document.querySelector(`.uipack-docs__sidebar a[href="${to}"]`)!;
        return target.getBoundingClientRect().top - a.getBoundingClientRect().top;
      },
      (await link.getAttribute("href"))!,
    );
    expect(far).toBeGreaterThan(900);
    // The next page records, from its first script: every frame of the sidebar marker's trip against
    // the sidebar's box, when its dot changes cell, and the header mark's portal (its wait, and when it changes).
    await page.addInitScript(() => {
      interface Trip {
        frames: { top: number; bottom: number; boxTop: number; boxBottom: number; y: number }[];
        navChanged?: number;
        brandWait?: number;
        brandChanged?: number;
      }
      const w = window as { __trip?: Trip };
      const trip: Trip = (w.__trip = { frames: [] });
      new MutationObserver((records) => {
        for (const r of records) {
          const el = r.target as Element;
          if (
            r.attributeName === "transform" &&
            el.matches(".uipack-docs__sidebar .uipack-docs__nav-track .uipack-docs__marker")
          ) {
            const track = el.closest("svg")!;
            if (!track.hasAttribute("data-flying") || track.hasAttribute("data-hidden")) continue;
            const box = el.closest(".uipack-docs__sidebar")!.getBoundingClientRect();
            const m = el.getBoundingClientRect();
            const y = Number(el.getAttribute("transform")?.match(/translate\([-\d.]+ ([-\d.]+)\)/)?.[1]);
            trip.frames.push({ top: m.top, bottom: m.bottom, boxTop: box.top, boxBottom: box.bottom, y });
          } else if (r.attributeName === "data-brand-hop" && el.getAttribute("data-brand-hop") === "in") {
            requestAnimationFrame(() => {
              const playing = el.querySelector("svg > g")?.getAnimations()[0];
              trip.brandWait = Number(playing?.effect?.getComputedTiming().delay);
            });
          } else if (r.attributeName === "data-brand" && r.oldValue && trip.brandChanged === undefined) {
            trip.brandChanged = performance.now();
          } else if (
            r.attributeName === "data-live" &&
            trip.frames.length &&
            trip.navChanged === undefined &&
            el.closest(".uipack-docs__sidebar .uipack-docs__marker")
          ) {
            // The dot moves to this page's cell: the sidebar's own portal, half-way.
            trip.navChanged = performance.now();
          }
        }
      }).observe(document, {
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ["transform", "data-brand-hop", "data-brand", "data-live"],
      });
    });
    await link.click();
    await expect(page).toHaveURL(/\/grading\/rubrics\/landing/);
    const track = page.locator(".uipack-docs__sidebar .uipack-docs__nav-track");
    // The trip has played out: the header's mark is Check's, and the marker has docked beside the link.
    await expect(page.locator(".showcase-brand")).toHaveAttribute("data-brand", "check");
    await expect(page.locator(".showcase-brand")).not.toHaveAttribute("data-brand-hop");
    await expect
      .poll(() => page.evaluate(() => (window as { __trip?: { frames: unknown[] } }).__trip!.frames.length))
      .toBeGreaterThan(10);
    await expect(track).not.toHaveAttribute("data-flying", { timeout: 8000 });
    const trip = await page.evaluate(
      () =>
        (
          window as {
            __trip?: {
              frames: { top: number; bottom: number; boxTop: number; boxBottom: number; y: number }[];
              navChanged?: number;
              brandWait?: number;
              brandChanged?: number;
            };
          }
        ).__trip!,
    );
    // Every frame of the trip, the first included, is inside the sidebar's box: it sets off just
    // inside the top edge (the side the old page is on), not from the old link 900px and more above.
    for (const [i, f] of trip.frames.entries()) {
      expect(f.top, `frame ${i} top`).toBeGreaterThanOrEqual(f.boxTop);
      expect(f.bottom, `frame ${i} bottom`).toBeLessThanOrEqual(f.boxBottom);
    }
    const first = trip.frames[0];
    expect(first.top - first.boxTop).toBeLessThan(40);
    // So the trip is the distance seen, not the distance between the two links.
    const travelled = trip.frames.at(-1)!.y - first.y;
    expect(travelled).toBeGreaterThan(36);
    expect(travelled).toBeLessThan(first.boxBottom - first.boxTop);
    // The header's portal waits no longer than the first paint and the entrance (--site-mark-wait),
    // though the sidebar's marker reaches its own portal later than that on a trip this long: the
    // header changes first.
    const settle = await page
      .locator(".showcase-brand")
      .evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue("--site-mark-wait")));
    expect(settle).toBe(160);
    expect(trip.brandWait).toBe(settle);
    expect(trip.brandChanged).toBeLessThan(trip.navChanged!);
    await expect.poll(() => dotOf(page, navMarker)).toMatchObject({ cell: "3" });
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
    await sidebar(page).getByRole("link", { name: "Install and use UiPack", exact: true }).click();
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

test.describe("sidebar and rail text", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  for (const theme of ["light", "dark"] as const)
    test(`${theme}: sub-pages and "On this page" read at 13px or more and 4.5:1 or more, under the pages`, async ({ page }) => {
      await page.goto(`/foundations/writing/general?theme=${theme}`);
      await expect(page.locator(".uipack-docs__toc-list a").first()).toBeVisible();
      const read = await page.evaluate(() => {
        const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
        const lum = (c: string) => {
          const [r, g, b] = rgb(c).map((v) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const ground = (el: Element | null): string => {
          for (; el; el = el.parentElement) {
            const bg = getComputedStyle(el).backgroundColor;
            if (rgb(bg)[3] !== 0 && bg !== "transparent") return bg;
          }
          return "rgb(255, 255, 255)";
        };
        const measure = (sel: string) =>
          [...document.querySelectorAll<HTMLElement>(sel)]
            .filter((a) => a.getClientRects().length && a.getAttribute("aria-current") === null)
            .map((a) => {
              const [l1, l2] = [lum(getComputedStyle(a).color), lum(ground(a))].sort((x, y) => y - x);
              return { px: parseFloat(getComputedStyle(a).fontSize), ratio: (l1 + 0.05) / (l2 + 0.05) };
            });
        return {
          pages: measure(
            ".uipack-docs__sidebar .uipack-docs__nav-section[data-open] .uipack-docs__nav-inner > div > ul > li > a",
          ),
          subs: measure(".uipack-docs__sidebar .uipack-docs__nav-sub a"),
          rail: measure(".uipack-docs__toc-list a"),
        };
      });
      for (const [name, links] of Object.entries(read)) {
        expect(links.length, name).toBeGreaterThan(2);
        for (const l of links) {
          expect(l.px, `${name} size`).toBeGreaterThanOrEqual(13);
          expect(l.ratio, `${name} contrast`).toBeGreaterThanOrEqual(4.5);
        }
      }
      // The hierarchy holds: a sub-page is smaller than a page.
      expect(Math.max(...read.subs.map((l) => l.px))).toBeLessThan(Math.min(...read.pages.map((l) => l.px)));
    });
});

/**
 * Characters on each rendered line of the page's long paragraphs and list items (a line is the
 * characters whose boxes share a vertical centre, from Range rects), each block's last line left
 * out. Runs in the page.
 */
function charactersPerLine() {
  const perLine = (el: Element) => {
    const rows = new Map<number, number>();
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let n = walk.nextNode() as Text | null; n; n = walk.nextNode() as Text | null)
      for (let i = 0; i < n.data.length; i++) {
        range.setStart(n, i);
        range.setEnd(n, i + 1);
        const r = range.getClientRects()[0];
        if (!r) continue;
        const row = Math.round(r.top + r.height / 2);
        rows.set(row, (rows.get(row) ?? 0) + 1);
      }
    return [...rows.values()].slice(0, -1);
  };
  const long = (sel: string, min: number) =>
    [...document.querySelectorAll(sel)].filter((e) => (e.textContent ?? "").length > min).flatMap(perLine);
  return { lines: long(".uipack-docs__prose > p", 150), items: long(".uipack-docs__prose > :is(ul, ol) > li", 200) };
}

test.describe("widths", () => {
  for (const width of [1440, 1920]) {
    test(`${width}: the sidebar, the column and the rail fill the site column, prose at 75–88 characters a line, tables the full column`, async ({
      page,
    }) => {
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
        const table = document.querySelector(".uipack-docs__prose .uipack-docs__table")?.getBoundingClientRect();
        return { side, main, toc, proseRight, proseWidth, table, vw: innerWidth };
      });
      // The three are one block, the site column (the window less two 32px gutters, 1600px at most),
      // centred: the sidebar's box is 232px and reaches 16px into the left margin, the page starts
      // 24px after it and takes the rest, and the rail (208px, 56px from the page) ends on the
      // column's right edge (its box reaches 5px past its text on each side: room for a focus ring).
      const column = Math.min(1600, g.vw - 64);
      const margin = (g.vw - column) / 2;
      expect(g.side.width).toBeCloseTo(232, 0);
      expect(g.side.left).toBeCloseTo(margin - 16, 0);
      expect(g.main.left - g.side.right).toBeCloseTo(24, 0);
      expect(g.main.width).toBeCloseTo(column - 216 - 24 - 56 - 208, 0);
      expect(g.toc.left + 5 - g.main.right).toBeCloseTo(56, 0);
      expect(g.toc.right - 5).toBeCloseTo(g.vw - margin, 0);
      // Prose starts on the page's left edge, with the page bar and the title.
      expect(g.proseRight - g.proseWidth).toBeCloseTo(g.main.left, 0);
      // A table takes the whole column; prose stops short of it.
      expect(g.proseWidth).toBeLessThan(g.main.width);
      expect(Math.abs(g.table!.width - g.main.width)).toBeLessThanOrEqual(1);
      // Prose runs 75–88 characters a line (the median line in range, none longer), list items
      // never longer: measured on this page and on Writing, which is mostly paragraphs.
      const lines: number[] = [];
      const items: number[] = [];
      for (const path of ["/agents", "/foundations/writing"]) {
        if (path !== "/agents") await page.goto(`${path}?theme=light`);
        await expect(page.locator(".uipack-docs__toc")).toBeVisible();
        await page.evaluate(() => document.fonts.ready.then(() => undefined));
        const counted = await page.evaluate(charactersPerLine);
        lines.push(...counted.lines);
        items.push(...counted.items);
      }
      lines.sort((a, b) => a - b);
      expect(lines.length).toBeGreaterThanOrEqual(10);
      const median = lines[Math.floor(lines.length / 2)];
      expect(median).toBeGreaterThanOrEqual(75);
      expect(median).toBeLessThanOrEqual(88);
      expect(Math.max(...lines)).toBeLessThanOrEqual(88);
      expect(Math.max(...items)).toBeLessThanOrEqual(88);
    });
  }

  // Wide drawings are not caged: on a page without a rail they take the page's width and scale with
  // it. The narrow end has one guard: a drawing never draws below its own size (below 1120px for the
  // two wider than the grid), where the 11px text floor would push sub-labels out of their boxes;
  // there it scrolls inside its canvas, never the page.
  for (const width of [1280, 1440, 2000, 2560])
    test(`${width}: a page without a rail takes the rest of the site column; its drawings scale with it and scroll in their canvas only when it is too narrow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/components/diagrams");
      await expect(page.locator("main.uipack-docs__article svg.uipack--wide").first()).toBeVisible();
      const g = await page.evaluate(() => {
        const main = document.querySelector("main.uipack-docs__article")!.getBoundingClientRect();
        const drawings = [
          ...document.querySelectorAll<SVGSVGElement>("main.uipack-docs__article .uipack__canvas > svg.uipack--wide"),
        ].map((svg) => {
          const canvas = svg.parentElement!;
          return {
            units: svg.viewBox.baseVal.width,
            drawn: svg.getBoundingClientRect().width,
            canvas: canvas.getBoundingClientRect().right,
            scrolls: canvas.scrollWidth > canvas.clientWidth + 1,
            overflow: getComputedStyle(canvas).overflowX,
          };
        });
        return { main: { width: main.width, right: main.right }, drawings, scrollWidth: document.documentElement.scrollWidth };
      });
      const page_ = Math.min(1600, width - 64) - 240;
      expect(g.main.width).toBeCloseTo(page_, 0);
      expect(g.drawings.length).toBeGreaterThan(10);
      for (const d of g.drawings) {
        expect(d.drawn).toBeGreaterThanOrEqual(Math.min(d.units, 1120) - 1);
        expect(d.canvas).toBeLessThanOrEqual(g.main.right + 1);
        if (d.scrolls) expect(d.overflow).toBe("auto");
      }
      const grid = g.drawings.filter((d) => d.units === 1120);
      expect(grid.length).toBeGreaterThan(5);
      // A 1120-unit drawing fits a page of 1120px or more (the canvas gives up its side padding
      // first): from a 1424px window nothing scrolls, and wider than 1184px the drawing grows.
      expect(g.drawings.some((d) => d.scrolls)).toBe(page_ < 1120);
      if (page_ >= 1184)
        for (const d of grid) expect(d.drawn).toBeCloseTo(page_ - 66, 0); // the canvas's 32px padding and the figure's 1px border
      else if (page_ >= 1120) for (const d of grid) expect(d.drawn).toBeCloseTo(1120, 0);
      expect(g.scrollWidth).toBeLessThanOrEqual(width);
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

// The banner's content keeps the edges of the layout under it, and the layout is the site's one
// column (docs/specs/docs-site.md, "Layout": fluid, 1600px at most, centred): the logo (below 900px the
// menu icon) starts where the sidebar's rows (the page) start, and the last control ends where "On
// this page" ends, or the page column on a page with no rail. Within 1px at every width. That these
// are the same x as on the landing page and Assets is e2e/site-consistency.spec.ts, "one header".
test.describe("the banner's edges", () => {
  for (const path of ["/agents", "/components/diagrams"])
    for (const width of [2560, 2000, 1920, 1440, 1280, 1100, 1024, 768, 390]) {
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
            sidebar: box(".uipack-docs__sidebar .uipack-docs__navigation"),
            // Search is the header's box on every view; the sidebar draws none of its own.
            sidebarSearch: box(".uipack-docs__sidebar .uipack-docs-search__button"),
            headerSearch: box(".showcase-header .uipack-docs-search__button"),
            main: box("main.uipack-docs__article")!,
            // The rail's box reaches 5px past its text on each side (room for a focus ring).
            railTitle: box(".uipack-docs__toc > p"),
            scrollWidth: document.documentElement.scrollWidth,
          };
        });
        if (width >= 900) {
          expect(g.menu, "no menu button beside a docked sidebar").toBeNull();
          expect(Math.abs(g.brand.left - g.sidebar!.left), "logo on the sidebar's rows' left edge").toBeLessThanOrEqual(1);
          // The whole layout is the site column, centred: equal margins, 1600px at most.
          const column = Math.min(1600, width - 2 * (width >= 1024 ? 32 : 24));
          expect(g.last.right - g.brand.left).toBeCloseTo(column, 0);
          expect(g.brand.left).toBeCloseTo((width - column) / 2, 0);
        } else {
          expect(g.sidebar, "the sidebar is a drawer").toBeNull();
          expect(Math.abs(g.menu!.left - g.main.left), "menu icon on the page's left edge").toBeLessThanOrEqual(1);
        }
        expect(g.sidebarSearch, "no search box in the sidebar").toBeNull();
        expect(g.headerSearch, "search in the header").not.toBeNull();
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
    // Measured at rest: the page's entrance moves the first row (not the rail) for 320ms.
    await page.emulateMedia({ reducedMotion: "reduce" });
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

test.describe("the page bar", () => {
  for (const width of [1440, 390])
    test(`${width}: location only (section, then parent page); the style labelled beside the source links`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/foundations/writing/general?theme=light");
      const location = page.locator(".showcase-context");
      await expect(location.getByRole("link")).toHaveText(["Rules", "Writing"]);
      await expect(location).not.toContainText("style");
      await expect(location.getByRole("link", { name: "Writing" })).toHaveAttribute("href", "/foundations/writing?theme=light");
      const style = page.locator(".uipack-docs__source-links").getByRole("link", { name: "Style: Technical" });
      await expect(style).toBeVisible();
      await expect(style).toHaveAttribute("href", "/styles?theme=light");
      await expect(page.getByRole("link", { name: "View as Markdown" })).toBeVisible({ visible: width > 520 });
      // A deck sub-view's parent is the Deck player; a page with no parent shows its section alone.
      await page.goto("/deck?deck=bento&theme=light");
      await expect(page.locator(".showcase-context").getByRole("link")).toHaveText(["Build", "Deck player"]);
      await page.goto("/agents?theme=light");
      await expect(page.locator(".showcase-context").getByRole("link")).toHaveText(["Start"]);
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
    // Every row in it is a 44px tap target, a page's sub-pages included (32px rows in the sidebar).
    const subPages = drawer.locator(".uipack-docs__nav-sub a:visible");
    await expect(subPages.filter({ hasText: "General writing rules" })).toBeVisible();
    const rows = await drawer
      .locator("a:visible, button:visible")
      .evaluateAll((els) => els.map((el) => ({ name: el.textContent!.trim(), height: el.getBoundingClientRect().height })));
    expect(rows.length).toBeGreaterThan(8);
    expect(rows.filter((r) => r.height < 44)).toEqual([]);
  });

  for (const width of [390, 360, 320])
    test(`the phone header at ${width}px: a 44px search button on the header's line, every control whole`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/foundations/style?theme=light");
      const header = page.locator(".showcase-header");
      const search = header.getByRole("button", { name: "Search docs" });
      await expect(search).toBeVisible();
      const boxes = await header
        .locator(".showcase-menu-button, .showcase-tabs a, .uipack-docs-search__button, button.theme")
        .evaluateAll((els) =>
          els.map((el) => {
            const r = el.getBoundingClientRect();
            return { left: r.left, right: r.right, width: r.width, height: r.height, mid: r.top + r.height / 2 };
          }),
        );
      // Menu, Docs, Assets, search, theme: in that order, none squeezed, none over another, all in the window.
      expect(boxes).toHaveLength(5);
      for (const b of boxes) {
        expect(b.height).toBeGreaterThanOrEqual(44);
        expect(b.width).toBeGreaterThanOrEqual(44);
        expect(Math.abs(b.mid - boxes[0].mid), "one centre line").toBeLessThanOrEqual(1);
      }
      for (let i = 2; i < boxes.length; i++) expect(boxes[i].left).toBeGreaterThanOrEqual(boxes[i - 1].right - 0.5);
      expect(boxes[4].right).toBeLessThanOrEqual(width);
      // The brand's mark is whole and clear of the tabs (below 390px the word gives its room up).
      const mark = await header.locator(".showcase-brand rect[data-cell]").evaluateAll((els) => ({
        left: Math.min(...els.map((el) => el.getBoundingClientRect().left)),
        right: Math.max(...els.map((el) => el.getBoundingClientRect().right)),
      }));
      expect(mark.left).toBeGreaterThanOrEqual(boxes[0].right - 0.5);
      expect(mark.right).toBeLessThanOrEqual(boxes[1].left + 0.5);
      // It opens the same dialog the drawer's box and the shortcut open.
      await search.tap();
      const dialog = page.getByRole("dialog", { name: "Search the docs" });
      await expect(dialog).toBeVisible();
      await expect(page.getByRole("combobox", { name: "Search the docs" })).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    });

  test("a wide table scrolls in a focusable box whose content fades at each edge with more beyond it", async ({ page }) => {
    await page.goto("/agents?theme=light");
    await expect(page.locator("main h1")).toBeVisible();
    const box = page.locator(".uipack-docs__prose .uipack-docs__table").first();
    await expect(box).toBeVisible();
    await box.scrollIntoViewIfNeeded();
    const look = () =>
      box.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          overflows: el.scrollWidth > el.clientWidth + 1,
          tabIndex: el.tabIndex,
          mask: s.maskImage || s.getPropertyValue("-webkit-mask-image"),
          more: el.dataset.more ?? "",
          start: parseFloat(s.getPropertyValue("--table-fade-start")) || 0,
          end: parseFloat(s.getPropertyValue("--table-fade-end")) || 0,
          left: el.scrollLeft,
          max: el.scrollWidth - el.clientWidth,
        };
      });
    const start = await look();
    expect(start.overflows).toBe(true);
    expect(start.tabIndex).toBe(0);
    expect(start.mask).toContain("linear-gradient");
    // At the start only the far edge fades: there is more table to the right, none to the left.
    expect(start.left).toBe(0);
    expect(start.start).toBe(0);
    expect(start.end).toBeGreaterThan(24);
    // The keyboard scrolls it: focused, the right arrow moves it along, and the near edge fades too.
    await box.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(async () => (await look()).start).toBeGreaterThan(24);
    // At the end the far edge clears.
    await box.evaluate((el) => (el.scrollLeft = el.scrollWidth));
    await expect.poll(async () => (await look()).end).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    // A table that fits is never marked, so it never fades.
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect.poll(async () => (await look()).overflows).toBe(false);
    await expect.poll(async () => (await look()).more).toBe("");
    expect((await look()).end).toBe(0);
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
    await expect(options.first()).toContainText("Site registry");
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
    await page
      .locator(".showcase-header")
      .getByRole("button", { name: /Search docs/ })
      .click();
    await expect(dialog).toBeVisible();
    await input.fill("registry");
    await expect(options.first()).toContainText("Site registry");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/specs\/registry\?theme=dark$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("registry", { ignoreCase: true });
  });

  // The dialog's parts style themselves: the landing page and Assets mount it outside the docs
  // layout, where a result once fell back to the browser's link (an underlined accent, no padding).
  for (const theme of ["light", "dark"] as const)
    for (const width of [1440, 390])
      test(`the dialog looks the same opened from the landing page, Assets and a docs page (${theme}, ${width}px)`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        const dialog = page.getByRole("dialog", { name: "Search the docs" });
        const input = page.getByRole("combobox", { name: "Search the docs" });
        const PARTS = {
          dialog: "dialog.uipack-docs-search",
          input: ".uipack-docs-search__bar input",
          close: ".uipack-docs-search__close",
          status: ".uipack-docs-search__status",
          group: ".uipack-docs-search__group-label",
          selected: '.uipack-docs-search__option[aria-selected="true"]',
          option: '.uipack-docs-search__option[aria-selected="false"]',
          where: ".uipack-docs-search__where",
          snippet: ".uipack-docs-search__snippet",
          keys: ".uipack-docs-search__keys",
          key: ".uipack-docs-search__keys kbd",
        };
        const look = (selectors: Record<string, string>) =>
          page.evaluate((selectors) => {
            const out: Record<string, Record<string, string>> = {};
            for (const [name, selector] of Object.entries(selectors)) {
              const s = getComputedStyle(document.querySelector(selector)!);
              out[name] = {
                color: s.color,
                background: s.backgroundColor,
                decoration: s.textDecorationLine,
                padding: s.padding,
                font: `${s.fontWeight} ${s.fontSize}/${s.lineHeight} ${s.fontFamily}`,
                border: `${s.borderTopWidth} ${s.borderTopColor} ${s.borderLeftWidth} ${s.borderLeftColor}`,
                radius: s.borderRadius,
                display: s.display,
                boxSizing: s.boxSizing,
              };
            }
            return out;
          }, selectors);
        const looks: Record<string, { results: unknown; empty: unknown; width: number }> = {};
        for (const path of ["/foundations/style", "/", "/gallery"]) {
          await page.goto(`${path}?theme=${theme}`);
          // ⌘K / Ctrl-K opens it on every view (pressed again until the page's shortcut is listening).
          await expect(async () => {
            await page.keyboard.press("ControlOrMeta+k");
            await expect(dialog).toBeVisible({ timeout: 1_000 });
          }).toPass({ timeout: 15_000 });
          await input.fill("grade");
          await expect(page.getByRole("option").nth(1)).toBeVisible({ timeout: 10_000 });
          const results = await look(PARTS);
          await input.fill("zzqqxx");
          await expect(dialog.getByRole("status")).toContainText("No results");
          const empty = await look({ status: PARTS.status });
          looks[path] = { results, empty, width: (await dialog.boundingBox())!.width };
          await page.keyboard.press("Escape");
          await expect(dialog).toBeHidden();
          // The header holds the box on every view; it opens the same dialog.
          await page.locator(".showcase-header").getByRole("button", { name: "Search docs" }).click();
          await expect(dialog).toBeVisible();
          await page.keyboard.press("Escape");
          await expect(dialog).toBeHidden();
        }
        const docs = looks["/foundations/style"];
        // A result is a row, not a link: the ink, no underline, its own padding; the selected one tinted.
        const selected = (docs.results as Record<string, Record<string, string>>).selected;
        const input_ = (docs.results as Record<string, Record<string, string>>).input;
        expect(selected.decoration).toBe("none");
        expect(selected.padding).toBe("9px 10px 9px 12px");
        expect(selected.color).toBe(input_.color);
        expect(selected.background).not.toBe("rgba(0, 0, 0, 0)");
        expect(looks["/"], "the landing page").toEqual(docs);
        expect(looks["/gallery"], "Assets").toEqual(docs);
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

// docs/specs/docs-site.md, "Theme": ?theme= wins; a bare address takes the reader's last choice,
// else the system's setting. index.html's first script sets it, before the shell renders.
test.describe("theme", () => {
  const themeOf = (page: Page) =>
    page.evaluate(() => ({
      root: document.documentElement.dataset.theme,
      roles: document.documentElement.dataset.uiTheme,
      frame: document.querySelector<HTMLElement>(".showcase-frame")?.dataset.theme,
    }));
  const all = (theme: string) => ({ root: theme, roles: theme, frame: theme });

  for (const scheme of ["dark", "light"] as const)
    test.describe(`system ${scheme}`, () => {
      test.use({ colorScheme: scheme });

      test("a bare address follows the system, and ?theme= wins over it", async ({ page }) => {
        const other = scheme === "dark" ? "light" : "dark";
        for (const path of ["/agents", "/", "/gallery"]) {
          await page.goto(path);
          await expect(page.locator(".showcase-header")).toBeVisible();
          expect(await themeOf(page), path).toEqual(all(scheme));
        }
        // The links the site writes carry the theme the page is in.
        await expect(page.getByRole("navigation", { name: "Views" }).getByRole("link", { name: "Docs" })).toHaveAttribute(
          "href",
          new RegExp(`[?&]theme=${scheme}\\b`),
        );
        await page.goto(`/agents?theme=${other}`);
        await expect(page.locator(".showcase-header")).toBeVisible();
        expect(await themeOf(page)).toEqual(all(other));
      });
    });

  test.describe("a stored choice", () => {
    test.use({ colorScheme: "light" });

    test("the toggle's choice holds on a bare address, over the system; ?theme= still wins and does not replace it", async ({
      page,
    }) => {
      await page.goto("/agents");
      await expect(page.locator(".showcase-header")).toBeVisible();
      expect(await themeOf(page)).toEqual(all("light"));
      await page.getByRole("button", { name: "Dark mode" }).click();
      await expect(page).toHaveURL(/[?&]theme=dark\b/);
      expect(await themeOf(page)).toEqual(all("dark"));
      for (const path of ["/agents", "/", "/gallery"]) {
        await page.goto(path);
        await expect(page.locator(".showcase-header")).toBeVisible();
        expect(await themeOf(page), path).toEqual(all("dark"));
      }
      await page.goto("/agents?theme=light");
      await expect(page.locator(".showcase-header")).toBeVisible();
      expect(await themeOf(page)).toEqual(all("light"));
      await page.goto("/agents");
      await expect(page.locator(".showcase-header")).toBeVisible();
      expect(await themeOf(page)).toEqual(all("dark"));
      // Toggled back, the choice is light, whatever the system says.
      await page.getByRole("button", { name: "Light mode" }).click();
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto("/gallery");
      await expect(page.locator(".showcase-header")).toBeVisible();
      expect(await themeOf(page)).toEqual(all("light"));
    });

    test("the theme is set before the page's first paint: by the document's own script, with no shell yet", async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem("uipack-theme", "dark"));
      // The page's module never arrives, so only index.html's blocking script has run.
      await page.route(/\/main\.tsx|\/assets\/.*\.js/, (route) => route.abort());
      await page.goto("/agents", { waitUntil: "domcontentloaded" });
      expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
      expect(await page.evaluate(() => document.querySelector(".showcase-frame"))).toBeNull();
    });
  });
});

test.describe("reduced motion", () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });

  test("the markers jump: no hops in the sidebar, the rail and the page land at once", async ({ page }) => {
    await watchFlight(page);
    await watchPoses(page);
    await page.goto("/agents");
    await sidebar(page).getByRole("link", { name: "Install and use UiPack", exact: true }).click();
    await expect(page).toHaveURL(/\/start\/install/);
    const current = sidebar(page).locator('[aria-current="page"]');
    await expect(current).toHaveText("Install and use UiPack");
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
