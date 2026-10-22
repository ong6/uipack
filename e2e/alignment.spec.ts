import { pageDefs, pagePath } from "../playground/catalog";
import { expect, test, waitForPage, type Page } from "./fixtures";

// Component-level layout rules, checked on every playground page rather than per component:
// cards that share a row share a height and an action row, controls side by side share a
// height, and a focus ring is never cut off by a scrolling or clipping box.
const PAGES = pageDefs.map(pagePath);

async function open(page: Page, path: string) {
  await page.goto(path);
  // The lazy page chunk and the fonts settle the layout being measured.
  await waitForPage(page);
}

// Rows of card-like boxes (a border or a fill, taller than 80px) in grids and wrapping flex rows.
function cardRows() {
  const visible = (el: Element) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };
  const cardish = (el: Element) => {
    const s = getComputedStyle(el);
    return (
      (parseFloat(s.borderTopWidth) > 0 || s.backgroundColor !== "rgba(0, 0, 0, 0)") && el.getBoundingClientRect().height > 80
    );
  };
  const label = (el: Element) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}`;
  const rows: { where: string; heights: number[]; actions: (number | null)[] }[] = [];
  for (const parent of document.querySelectorAll(".showcase-shell *")) {
    if (parent.closest("svg, .uipack-deck__canvas, .uipack-deck-stage")) continue;
    const s = getComputedStyle(parent);
    if (!(
      s.display.includes("grid") ||
      (s.display.includes("flex") && s.flexDirection.startsWith("row") && s.flexWrap === "wrap")
    ))
      continue;
    const byTop = new Map<number, Element[]>();
    for (const kid of [...parent.children].filter(visible)) {
      const top = Math.round(kid.getBoundingClientRect().top);
      byTop.set(top, [...(byTop.get(top) ?? []), kid]);
    }
    for (const row of byTop.values()) {
      if (row.length < 2 || !row.every(cardish)) continue;
      rows.push({
        where: `${label(parent)} > ${label(row[0])}`,
        heights: row.map((k) => Math.round(k.getBoundingClientRect().height)),
        actions: row.map((k) => {
          const last = [...k.querySelectorAll("a, button")].filter(visible).pop();
          return last ? Math.round(last.getBoundingClientRect().top) : null;
        }),
      });
    }
  }
  return rows;
}

// Buttons, selects and inputs that sit side by side in one parent.
function controlRows() {
  const out: { where: string; heights: number[] }[] = [];
  const controls = [
    ...document.querySelectorAll<HTMLElement>(
      ".showcase-shell :is(button, select, input:not([type=radio], [type=checkbox], [type=hidden]))",
    ),
  ].filter((c) => c.getClientRects().length && !c.closest("svg, .uipack-deck__canvas, .uipack-deck-stage, .uipack-web"));
  const byParent = new Map<Element, HTMLElement[]>();
  for (const c of controls) byParent.set(c.parentElement!, [...(byParent.get(c.parentElement!) ?? []), c]);
  for (const [parent, list] of byParent) {
    const rows = new Map<number, HTMLElement[]>();
    for (const c of list) {
      const r = c.getBoundingClientRect();
      const mid = Math.round(r.top + r.height / 2);
      const key = [...rows.keys()].find((k) => Math.abs(k - mid) < 6) ?? mid;
      rows.set(key, [...(rows.get(key) ?? []), c]);
    }
    for (const row of rows.values()) {
      if (row.length < 2) continue;
      out.push({
        where: `${parent.tagName.toLowerCase()}.${[...parent.classList].join(".")}: ${row.map((c) => (c.textContent || c.getAttribute("aria-label") || "").trim().slice(0, 16)).join(" | ")}`,
        heights: row.map((c) => Math.round(c.getBoundingClientRect().height)),
      });
    }
  }
  return out;
}

for (const width of [1440, 390]) {
  test.describe(`alignment at ${width}`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const path of PAGES) {
      test(`${path}: card rows share a height and an action row; side-by-side controls share a height`, async ({ page }) => {
        await open(page, path);
        for (const row of await page.evaluate(cardRows)) {
          expect(
            Math.max(...row.heights) - Math.min(...row.heights),
            `card heights in ${row.where}: ${row.heights}`,
          ).toBeLessThanOrEqual(1);
          if (row.actions.every((a) => a !== null))
            expect(new Set(row.actions).size, `action rows in ${row.where}: ${row.actions}`).toBe(1);
        }
        for (const row of await page.evaluate(controlRows)) {
          expect(
            Math.max(...row.heights) - Math.min(...row.heights),
            `control heights in ${row.where}: ${row.heights}`,
          ).toBeLessThanOrEqual(1);
        }
      });
    }
  });
}

// A focused control's ring (outline width + offset) must fit inside the nearest box that
// scrolls or clips; scroll rows give their items room with padding, or the ring is inset.
for (const [path, width] of [
  ["/animations", 390],
  ["/assets", 390],
  ["/mechanism", 390],
  ["/mechanism", 1440],
  ["/web", 390],
  ["/", 390],
  ["/docs", 1440],
  ["/presentations", 1440],
] as const) {
  test(`${path} at ${width}: focus rings are not clipped`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page, path);
    await page.keyboard.press("Tab"); // keyboard modality, so :focus-visible applies to .focus()
    // The whole frame: the header's scrolling nav rows as well as the page in <main>.
    const handles = await page
      .locator(".showcase-frame :is(a[href], button, [tabindex='0'], summary, [role=button]):visible")
      .elementHandles();
    const clipped: string[] = [];
    for (const handle of handles.slice(0, 80)) {
      const issue = await handle.evaluate((el: HTMLElement) => {
        if (el.closest("svg")) return null;
        let clip: Element | null = null;
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const s = getComputedStyle(a);
          if (/(hidden|clip|auto|scroll)/.test(s.overflowX + s.overflowY)) {
            clip = a;
            break;
          }
        }
        if (!clip) return null;
        el.focus({ preventScroll: true });
        const s = getComputedStyle(el);
        if (s.outlineStyle === "none" || document.activeElement !== el) return null;
        const reach = parseFloat(s.outlineWidth) + parseFloat(s.outlineOffset);
        const r = el.getBoundingClientRect();
        const c = clip.getBoundingClientRect();
        // Items scrolled out of a row are not on screen to clip.
        if (r.right < c.left || r.left > c.right) return null;
        const room = Math.min(r.left - c.left, c.right - r.right, r.top - c.top, c.bottom - r.bottom);
        return room < reach - 0.5 && r.left >= c.left - 0.5 && r.right <= c.right + 0.5
          ? `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} "${(el.textContent ?? "").trim().slice(0, 20)}" needs ${reach}px, has ${room.toFixed(1)}px in ${clip.tagName.toLowerCase()}.${[...clip.classList].join(".")}`
          : null;
      });
      if (issue) clipped.push(issue);
    }
    expect(clipped).toEqual([]);
  });
}

test("sections on the diagrams page are one shell gap apart", async ({ page }) => {
  await open(page, "/");
  const gaps = await page.evaluate(() => {
    const sections = [...document.querySelectorAll("[data-section]")];
    return sections
      .slice(1)
      .map((s, i) => Math.round(s.getBoundingClientRect().top - sections[i].getBoundingClientRect().bottom));
  });
  expect(new Set(gaps)).toEqual(new Set([32]));
});

test("a half-visible item in a scrolling row comes fully into view when it takes keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "/assets");
  const cats = page.locator(".uipack-browser__cat");
  for (let i = 0; i < (await cats.count()); i++) {
    await cats.nth(i).focus(); // WebKit's Tab skips buttons unless the OS setting is on
    const fits = await page.evaluate(() => {
      const el = document.activeElement!;
      const r = el.getBoundingClientRect();
      const c = el.closest("ul")!.getBoundingClientRect();
      return r.left >= c.left - 0.5 && r.right <= c.right + 0.5;
    });
    expect(fits, `category ${i}`).toBe(true);
  }
});
