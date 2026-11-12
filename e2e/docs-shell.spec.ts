import { expect, test, type Page } from "./fixtures";
import { sidebar } from "./page-audit";

// The docs shell's own behaviour (docs/specs/docs-site.md, "Navigation" and "Layout"): the
// travelling location marker in "On this page" and in the sidebar, the two marker shapes, the
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

  test("the plane glides to the heading picked, then to the heading scrolled to", async ({ page }) => {
    await page.goto("/foundations/style?theme=light");
    const rail = page.getByRole("complementary", { name: "On this page" });
    const links = rail.getByRole("link");
    await expect(links.first()).toBeVisible();
    // The plane rests on the first heading before the reader has passed one.
    await expect(page.locator(railMarker)).toHaveAttribute("data-at", /.+/);
    expect(await page.locator(`${railMarker} .uipack-docs__marker-plane`).count()).toBe(1);

    // Pick a heading: it becomes current at once and the plane lands beside it.
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

  test("flies from the page left to the one opened, opening its section, and docks beside the link", async ({ page }) => {
    await watchFlight(page);
    await page.goto("/agents?theme=light");
    const nav = sidebar(page);
    // On a fresh visit it docks beside the current page without flying.
    await expect(nav.locator('[aria-current="page"]')).toHaveText("How agents use UiPack");
    await settled(page, navMarker);
    expect(await page.evaluate(() => (window as { __flew?: boolean }).__flew)).toBe(false);

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

  test("?marker=mark swaps the plane for the square mark in both places, for the rest of the visit", async ({ page }) => {
    await page.goto("/agents?theme=dark&marker=mark");
    await expect(page.locator(`${navMarker} .uipack-docs__marker-mark`)).toHaveCount(1);
    await expect(page.locator(`${railMarker} .uipack-docs__marker-mark`)).toHaveCount(1);
    await expect(page.locator(".uipack-docs__marker-plane")).toHaveCount(0);
    await sidebar(page).getByRole("link", { name: "Install and use", exact: true }).click();
    await expect(page).toHaveURL(/\/start\/install/);
    await expect(page.locator(`${navMarker} .uipack-docs__marker-mark`)).toHaveCount(1);
    await page.goto("/start/install?marker=plane");
    await expect(page.locator(`${navMarker} .uipack-docs__marker-plane`)).toHaveCount(1);
  });
});

test.describe("widths", () => {
  for (const width of [1440, 1920]) {
    test(`${width}: the column and the rail sit together, prose at 75–88 characters a line, tables the full column`, async ({
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
        // Characters on each rendered line of the long paragraphs and list items (a line is the
        // characters whose boxes share a vertical centre), each block's last line left out.
        const perLine = (el: Element) => {
          const rows = new Map<number, number>();
          const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          const range = document.createRange();
          for (let n = walk.nextNode() as Text | null; n; n = walk.nextNode() as Text | null)
            for (let i = 0; i < n.data.length; i++) {
              range.setStart(n, i);
              range.setEnd(n, i + 1);
              const r = range.getClientRects()[0];
              if (r) rows.set(Math.round(r.top + r.height / 2), (rows.get(Math.round(r.top + r.height / 2)) ?? 0) + 1);
            }
          return [...rows.values()].slice(0, -1);
        };
        const long = (sel: string, min: number) =>
          [...document.querySelectorAll(sel)].filter((e) => (e.textContent ?? "").length > min).flatMap(perLine);
        const lines = long(".uipack-docs__prose > p", 300).sort((a, b) => a - b);
        const items = long(".uipack-docs__prose > :is(ul, ol) > li", 200);
        return { side, main, toc, proseRight, proseWidth, table, lines, items, vw: innerWidth };
      });
      // No dead gutter: the rail starts within ~a quarter of the column of the prose's right edge.
      expect(g.toc.left - g.proseRight).toBeLessThanOrEqual(220);
      expect(g.toc.left + 5 - g.main.right).toBeGreaterThanOrEqual(38);
      expect(g.toc.left + 5 - g.main.right).toBeLessThanOrEqual(58);
      expect(g.main.width).toBeLessThanOrEqual(761);
      // The pair is centred in the space right of the sidebar (the rail's box reaches 5px past its
      // text on each side: room for a focus ring).
      const leftGap = g.main.left - g.side.right;
      const rightGap = g.vw - (g.toc.right - 5);
      expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(2);
      // Prose runs 75–88 characters a line (the median line in range, none longer); list items
      // never run longer either. A table takes the whole column.
      expect(g.lines.length).toBeGreaterThan(10);
      const median = g.lines[Math.floor(g.lines.length / 2)];
      expect(median).toBeGreaterThanOrEqual(75);
      expect(median).toBeLessThanOrEqual(88);
      expect(Math.max(...g.lines)).toBeLessThanOrEqual(88);
      expect(Math.max(...g.items)).toBeLessThanOrEqual(88);
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

  test("a wide table scrolls in a focusable box that shades the edge with more table beyond it", async ({ page }) => {
    await page.goto("/agents?theme=light");
    await expect(page.locator("main h1")).toBeVisible();
    const box = page.locator(".uipack-docs__prose .uipack-docs__table").first();
    await expect(box).toBeVisible();
    await box.scrollIntoViewIfNeeded();
    const look = () =>
      box.evaluate((el) => ({
        overflows: el.scrollWidth > el.clientWidth + 1,
        tabIndex: el.tabIndex,
        attachment: getComputedStyle(el).backgroundAttachment,
        image: getComputedStyle(el).backgroundImage,
        left: el.scrollLeft,
      }));
    const start = await look();
    expect(start.overflows).toBe(true);
    expect(start.tabIndex).toBe(0);
    // Covers that ride with the content over shades fixed to the box's edges.
    expect(start.attachment).toBe("local, local, scroll, scroll");
    expect(start.image.match(/radial-gradient/g)).toHaveLength(2);
    // The keyboard scrolls it: focused, the right arrow moves it along.
    expect(start.left).toBe(0);
    await box.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(async () => (await look()).left).toBeGreaterThan(0);
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

  test("the markers jump: no flight in the sidebar, the rail and the page land at once", async ({ page }) => {
    await watchFlight(page);
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
  });
});
