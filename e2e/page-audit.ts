// The checks every playground page is held to, as functions a spec runs on a page it has already
// loaded: page-audit.spec.ts loads each page once per width and runs all of them, so adding a page
// to the catalog (or a check here) covers it everywhere. The catalog-derived names (groups, labels,
// h1 and tab text) are shared with nav.spec.ts.
import { libraryGroups, pageDefs, pagePath } from "../playground/catalog";
import { expect, type Page } from "./fixtures";

// The information architecture the shell must render, read from the catalog: the groups in
// order, each with the page it opens on and its pages as [label, path].
export const GROUPS = libraryGroups.map((g) => ({
  label: g.label,
  opens: pageDefs.find((p) => p.id === g.defaultPage)!.label,
  pages: pageDefs.filter((p) => p.group === g.id).map((p) => [p.label, pagePath(p)] as const),
}));
export const ALL = GROUPS.flatMap((g) => g.pages.map(([label, path]) => ({ group: g.label, label, path })));

// /web hosts a complete sample landing page: its hero is the one h1 and the shell title is plain text.
export const title = (page: Page) => page.locator(".showcase-title h1, .showcase-title .showcase-title__name");

// Sub-views (the decks) are catalog entries with a query and a title: they share one page, and the
// h1 names the page before the sub-view.
const subViewOf = (label: string) => pageDefs.find((p) => p.label === label && p.query && p.title)?.title;
export const h1Of = (label: string) => {
  const pageTitle = subViewOf(label);
  return pageTitle ? `${pageTitle} · ${label}` : label;
};
// The browser tab: the sub-view first. /web too: its sample page keeps the rest of its own head.
export const tabOf = (label: string) => {
  const pageTitle = subViewOf(label);
  return pageTitle ? `${label} · ${pageTitle} · uipack` : `${label} · uipack`;
};

export const groupsNav = (page: Page) => page.getByRole("navigation", { name: "Library groups" });
export const pagesNav = (page: Page) => page.getByRole("navigation", { name: "Library pages" });

// Heading levels in document order, ignoring hidden headings.
export async function outline(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6")]
      .filter((h) => h.getClientRects().length > 0)
      .map((h) => ({ level: Number(h.tagName[1]), text: h.textContent?.trim() ?? "" })),
  );
}

/** One h1 (the shell's, naming the page), an intro, sentence-case h2s, no skipped heading levels, a named main. */
export async function checkHeadingOutline(page: Page, label: string, path: string) {
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(title(page)).toHaveText(h1Of(label));
  await expect(page.locator(".showcase-title > p:not(.showcase-title__name)")).not.toBeEmpty();
  const headings = await outline(page);
  expect(headings.filter((h) => h.level === 1)).toHaveLength(1);
  let previous = 0;
  for (const h of headings) {
    expect(h.level, `"${h.text}" follows an h${previous}`).toBeLessThanOrEqual(previous + 1);
    previous = h.level;
  }
  // Every main is named by the page: by its h1, or on /web (whose h1 is the sample's hero) by its label.
  if (path === "/web") await expect(page.getByRole("main", { name: "Web UI" })).toBeVisible();
  else
    for (const h of headings.filter((h) => h.level === 2))
      expect(h.text, "h2 reads as a title, not a path or a counter").not.toMatch(/[/·]|^[a-z]/);
}

// The heading scale in docs/design-direction.md: one size for section headings across pages, and
// card, figure and scene titles at 18–20px / 600 below them. Sample content keeps its own scale
// (slides, the /web sample page, the docs prose), so headings inside those roots are not the page's.
const SAMPLE = ".uipack-web, .uipack-docs, .uipack-deck, .uipack-deck-stage, .composed-deck, .uipack-slide-starter";
const TITLES = ".uipack__title, .style-card h3, .uipack-animation-heading h3";

/** Section headings are `section`px (24 at desktop, 22 on phones); card and figure titles are 18–20px / 600. */
export async function checkHeadingScale(page: Page, section: number) {
  await expect(page.locator(".showcase-shell section > h2").first()).toBeVisible();
  const m = await page.evaluate(
    ({ sample, titles }) => {
      const size = (el: Element) => parseFloat(getComputedStyle(el).fontSize);
      const visible = (el: Element) => el.getClientRects().length > 0;
      const page = document.querySelector(".showcase-title h1, .showcase-title .showcase-title__name");
      const sections = [...document.querySelectorAll(".showcase-shell h2")].filter((h) => visible(h) && !h.closest(sample));
      const cards = [...document.querySelectorAll(titles)].filter(
        (h) => visible(h) && !h.closest(sample.replace(".uipack-docs, ", "")),
      );
      return {
        page: page ? size(page) : null,
        sections: [...new Set(sections.map(size))],
        titles: cards.map((t) => ({
          text: (t.textContent ?? "").trim().slice(0, 30),
          size: size(t),
          weight: getComputedStyle(t).fontWeight,
        })),
      };
    },
    { sample: SAMPLE, titles: TITLES },
  );
  expect(m.sections, "every section heading on the page has one size").toEqual([section]);
  expect(m.page ?? 0).toBeGreaterThan(section);
  for (const t of m.titles) {
    expect(t.size, `${t.text} is a card-level title`).toBeGreaterThanOrEqual(18);
    expect(t.size, `${t.text} stays below the section heading`).toBeLessThanOrEqual(20);
    expect(t.weight, `${t.text} weight`).toBe("600");
  }
}

/**
 * Component-level layout rules: cards that share a row share a height and an action row, and
 * controls side by side share a height.
 */
export async function checkAlignment(page: Page) {
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

/**
 * Paired examples: wrappers side by side in a row (a "don't" and a "do" figure, each a caption over
 * a box) whose boxes sit at the same place in each wrapper. The boxes share a height, so a short
 * example never leaves its box shorter than its partner's. 2px of slack for fonts that differ on CI.
 */
export async function checkPairedBoxes(page: Page) {
  for (const row of await page.evaluate(pairedBoxRows))
    expect(
      Math.max(...row.heights) - Math.min(...row.heights),
      `paired boxes in ${row.where}: ${row.heights}`,
    ).toBeLessThanOrEqual(2);
}

function pairedBoxRows() {
  const visible = (el: Element) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };
  const boxed = (el: Element) => {
    const s = getComputedStyle(el);
    return parseFloat(s.borderTopWidth) > 0 || s.backgroundColor !== "rgba(0, 0, 0, 0)";
  };
  const label = (el: Element) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}`;
  const rows: { where: string; heights: number[] }[] = [];
  for (const parent of document.querySelectorAll(".showcase-shell *")) {
    if (parent.closest("svg, canvas, .uipack-deck__canvas, .uipack-deck-canvas, .uipack-deck-stage, .uipack-slide-labels"))
      continue;
    const s = getComputedStyle(parent);
    if (!(s.display.includes("grid") || (s.display.includes("flex") && s.flexDirection.startsWith("row")))) continue;
    const byTop = new Map<number, Element[]>();
    for (const kid of [...parent.children].filter(visible)) {
      const top = Math.round(kid.getBoundingClientRect().top);
      byTop.set(top, [...(byTop.get(top) ?? []), kid]);
    }
    for (const row of byTop.values()) {
      const n = row[0].children.length;
      if (row.length < 2 || n < 2 || row.some(boxed) || row.some((k) => k.children.length !== n)) continue;
      for (let i = 0; i < n; i++) {
        const boxes = row.map((k) => k.children[i]);
        if (!boxes.every((b) => visible(b) && boxed(b) && b.tagName.toLowerCase() !== "svg")) continue;
        const heights = boxes.map((b) => Math.round(b.getBoundingClientRect().height));
        if (Math.max(...heights) < 40) continue;
        rows.push({ where: `${label(parent)} > ${label(boxes[0])}`, heights });
      }
    }
  }
  return rows;
}

/**
 * No heading ends on a line of its own one short word: page, section and card headings and figure
 * titles balance their lines (`text-wrap: balance`). Sample content (slides, the /web page, docs
 * prose) keeps its own rules. A last line under a third of the line above it is an orphan; balanced
 * lines are near-equal, so other fonts do not trip it.
 */
export async function checkHeadingOrphans(page: Page) {
  const orphans = await page.evaluate((sample) => {
    const out: string[] = [];
    for (const h of document.querySelectorAll<HTMLElement>(".showcase-shell :is(h1, h2, h3, h4, .uipack__title)")) {
      if (!h.getClientRects().length || h.closest(sample) || h.closest("svg")) continue;
      const words: { text: string; top: number; left: number; right: number; height: number }[] = [];
      const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        for (const m of (node.textContent ?? "").matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(node, m.index!);
          range.setEnd(node, m.index! + m[0].length);
          const r = [...range.getClientRects()].find((x) => x.width > 0);
          if (r) words.push({ text: m[0], top: r.top, left: r.left, right: r.right, height: r.height });
        }
      }
      if (words.length < 3) continue;
      const last = words[words.length - 1];
      const before = words[words.length - 2];
      if (last.top < before.top + before.height / 2) continue; // the last word shares a line
      const above = words.filter((w) => Math.abs(w.top - before.top) < before.height / 2);
      const aboveWidth = Math.max(...above.map((w) => w.right)) - Math.min(...above.map((w) => w.left));
      if (last.right - last.left < aboveWidth / 3) out.push(`"${(h.textContent ?? "").trim()}" ends on "${last.text}" alone`);
    }
    return out;
  }, SAMPLE);
  expect(orphans, "no heading leaves one word on its last line").toEqual([]);
}

// Buttons, selects and inputs that sit side by side in one parent.
function controlRows() {
  const out: { where: string; heights: number[] }[] = [];
  const controls = [
    ...document.querySelectorAll<HTMLElement>(
      ".showcase-shell :is(button, select, input:not([type=radio], [type=checkbox], [type=hidden]))",
    ),
    // Scene labels float over a 3D scene at their parts' projected places, sized to their own words:
    // two that land at one height are not a row of controls.
  ].filter(
    (c) =>
      c.getClientRects().length && !c.closest("svg, .uipack-deck__canvas, .uipack-deck-stage, .uipack-web, .uipack-slide-labels"),
  );
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

/**
 * Form controls do not inherit the page's font: a button, select or text field without a font rule
 * falls back to the browser's own (Arial in Chromium). Every one, shown or not (a phone menu, a
 * closed dialog), names a face from its style. Check boxes and radios carry no text. Scrolls the
 * page (lazy sections mount as they scroll into view) and returns to the top.
 */
export async function checkControlFaces(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 800) await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.evaluate(() => window.scrollTo(0, 0));
  const fallback = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("button, select, textarea, input")]
      .filter((el) => !(el instanceof HTMLInputElement && ["checkbox", "radio", "hidden", "range", "color"].includes(el.type)))
      .map((el) => ({ el, face: getComputedStyle(el).fontFamily }))
      .filter(({ face }) => /^\s*"?(arial|helvetica|times|serif|sans-serif|-webkit-)/i.test(face))
      .map(
        ({ el, face }) =>
          `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}": ${face}`,
      ),
  );
  expect(fallback, "no button, select or text field falls back to the browser's default face").toEqual([]);
}

/**
 * Visible text uses the style's faces only: the first family of every element with its own text
 * matches the first family of the computed --ui-font-text, --ui-font-display or --ui-font-label (IBM
 * Plex Sans and Plex Mono in Technical), so an undefined host variable or a hard-coded system stack
 * fails here instead of quietly rendering in system-ui. Skips screen-reader-only text, the ?host=notes
 * stand-in (which copies another site's faces on purpose) and 3D canvases (no DOM text). Run after a
 * check that scrolls the page, so lazy sections have mounted.
 */
export async function checkTextFaces(page: Page) {
  const offenders = await page.evaluate(() => {
    const first = (stack: string) => stack.split(",")[0].trim().replace(/^["']|["']$/g, "");
    const root = getComputedStyle(document.body);
    const faces = new Set(
      ["--ui-font-text", "--ui-font-display", "--ui-font-label"]
        .map((v) => first(root.getPropertyValue(v)))
        .filter(Boolean),
    );
    const hidden = (el: Element) => {
      for (let e: Element | null = el; e; e = e.parentElement) {
        const s = getComputedStyle(e);
        if (s.clipPath === "inset(50%)" || s.clip === "rect(0px, 0px, 0px, 0px)") return true;
      }
      return false;
    };
    return [...document.querySelectorAll("body *")]
      .filter((el) => [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim()))
      .filter((el) => !el.closest("script, style, noscript, template, [data-host='notes']"))
      .filter((el) => {
        const s = getComputedStyle(el);
        return el.getClientRects().length > 0 && s.visibility !== "hidden" && s.opacity !== "0" && !hidden(el);
      })
      .map((el) => ({ el, face: first(getComputedStyle(el).fontFamily) }))
      .filter(({ face }) => !faces.has(face))
      .map(({ el, face }) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} "${(el.textContent ?? "").trim().slice(0, 30)}": ${face}`)
      .slice(0, 20);
  });
  expect(offenders, "visible text uses only the style's faces (no system fallback stacks)").toEqual([]);
}

/** The 390px header: compact, desktop nav rows hidden, 44px menu and theme buttons, the menu button naming the page whole. */
export async function checkCompactHeader(page: Page, label: string) {
  await expect(title(page)).toHaveText(h1Of(label));
  const header = await page.locator(".showcase-header").boundingBox();
  expect(header!.height).toBeLessThanOrEqual(64);
  // The two desktop rows are not shown.
  await expect(groupsNav(page)).toBeHidden();
  await expect(pagesNav(page)).toBeHidden();
  for (const b of [page.locator(".showcase-menu-button"), page.locator("button.theme")]) {
    const box = (await b.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }
  // The menu button shows the page name whole, with its group small above it.
  const button = page.locator(".showcase-menu-button");
  await expect(button.locator(".showcase-menu-button__page")).toHaveText(label);
  await expect(button.locator(".showcase-menu-button__group")).toHaveText(ALL.find((p) => p.label === label)!.group);
  expect(
    await button.locator(".showcase-menu-button__page").evaluate((el) => {
      const b = el.closest("button")!.getBoundingClientRect();
      return el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().right <= b.right;
    }),
  ).toBe(true);
}

/** No page-wide horizontal overflow at the current viewport width. */
export async function checkNoOverflow(page: Page, width: number, where: string) {
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth), `page overflow: ${where}`).toBeLessThanOrEqual(width);
}

/**
 * A focused control's ring (outline width + offset) must fit inside the nearest box that scrolls or
 * clips; scroll rows give their items room with padding, or the ring is inset. Covers the whole
 * frame: the header's scrolling nav rows as well as the page in <main>.
 */
export async function checkFocusRingsNotClipped(page: Page) {
  await page.keyboard.press("Tab"); // keyboard modality, so :focus-visible applies to .focus()
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
  expect(clipped, "focus rings are not clipped").toEqual([]);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}
