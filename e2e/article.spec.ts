import { readFileSync } from "node:fs";
import { expect, test, type Browser, type Page } from "@playwright/test";

// uipack/article: the playground's host article (client-rendered, with the
// notes site's palette via ?host=notes) and static pages rendered with
// renderToStaticMarkup into a copy of the notes site's layout, with
// JavaScript off. Both engines run every test (playwright.config projects).

const WIDTHS = [390, 896, 1440] as const;
const THEMES = ["light", "dark"] as const;

async function open(browser: Browser, width: number, url: string, options: { javaScriptEnabled?: boolean; colorScheme?: "light" | "dark" } = {}) {
  const phone = width < 600;
  const context = await browser.newContext({ viewport: { width, height: phone ? 844 : 1000 }, isMobile: phone, hasTouch: phone, ...options });
  const page = await context.newPage();
  await page.goto(url);
  return { page, close: () => context.close() };
}

/**
 * Everything the layout tests assert, measured in the page. A plain function
 * (serialised by Playwright), so it also runs on pages with JavaScript off.
 */
function audit() {
  type RGBA = [number, number, number, number];
  const parse = (value: string): RGBA => {
    const rgb = /^rgba?\(([^)]+)\)$/.exec(value);
    if (rgb) {
      const p = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      return [p[0], p[1], p[2], p[3] ?? 1];
    }
    const srgb = /^color\(srgb ([^)]+)\)$/.exec(value);
    if (srgb) {
      const p = srgb[1].split(/[\s/]+/).filter(Boolean).map(Number);
      return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1];
    }
    throw new Error(`unparsed colour ${value}`);
  };
  const over = (top: RGBA, under: RGBA): RGBA => [0, 1, 2].map((i) => top[i] * top[3] + under[i] * (1 - top[3])).concat(1) as RGBA;
  // The opaque colour behind an element: its own and its ancestors' backgrounds, composited.
  const backdrop = (el: Element | null): RGBA => {
    const layers: RGBA[] = [];
    for (let node = el; node; node = node.parentElement) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      if (bg[3] > 0) layers.push(bg);
      if (bg[3] >= 1) break;
    }
    return layers.reduceRight<RGBA>((under, top) => over(top, under), [255, 255, 255, 1]);
  };
  const lum = (c: RGBA) => {
    const [r, g, b] = c.slice(0, 3).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: RGBA, b: RGBA) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const textContrast = (el: Element) => {
    const bg = backdrop(el);
    return ratio(over(parse(getComputedStyle(el).color), bg), bg);
  };
  const edgeContrast = (el: Element, side: "Top" | "Left") => {
    const outside = backdrop(el.parentElement);
    return ratio(over(parse(getComputedStyle(el)[`border${side}Color`]), outside), outside);
  };

  const parts = ".uipack-notecard, .uipack-cluster, .uipack-layerhead, .uipack-terms, .uipack-callout, .uipack-change, .uipack-links";
  const roots = [...document.querySelectorAll(parts)];

  const clusters = [...document.querySelectorAll<HTMLElement>(".uipack-cluster")].map((cluster) => {
    const box = cluster.getBoundingClientRect();
    const column = cluster.parentElement!.getBoundingClientRect();
    const grid = cluster.querySelector(".uipack-cluster__grid")!;
    const cards = [...cluster.querySelectorAll(".uipack-notecard")].map((c) => c.getBoundingClientRect());
    const rows = new Map<number, number[]>();
    for (const c of cards) rows.set(Math.round(c.top), [...(rows.get(Math.round(c.top)) ?? []), c.height]);
    return {
      id: cluster.id,
      wide: cluster.classList.contains("uipack-cluster--wide"),
      width: box.width,
      columns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
      lefts: new Set(cards.map((c) => Math.round(c.left))).size,
      cards: cards.length,
      rows: [...rows.values()],
      inside: cards.every((c) => c.left >= box.left && c.right <= box.right + 0.5 && c.bottom <= box.bottom + 0.5),
      centreOffset: box.left + box.width / 2 - (column.left + column.width / 2),
      cardWidth: cards[0].width,
    };
  });

  let minFont = Infinity;
  for (const root of roots) {
    for (const el of [root, ...root.querySelectorAll("*")]) {
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
      const rect = el.getBoundingClientRect();
      if (!own || !rect.width || el.closest(".uipack-layerhead__sr")) continue;
      minFont = Math.min(minFont, parseFloat(getComputedStyle(el).fontSize));
    }
  }

  const textSamples = [
    "uipack-notecard__kicker",
    "uipack-notecard__title",
    "uipack-notecard__desc",
    "uipack-notecard__date",
    "uipack-notecard__time",
    "uipack-notecard__go",
    "uipack-notecard__status",
    "uipack-cluster__label",
    "uipack-cluster__count",
    "uipack-cluster__note",
    "uipack-layerhead__index",
    "uipack-layerhead__zone",
    "uipack-layerhead__value",
    "uipack-layerhead__label",
    "uipack-layerhead__map",
    "uipack-terms__label",
    "uipack-terms__term",
    "uipack-callout__label",
    "uipack-callout__body",
    "uipack-change__label",
    "uipack-change__kicker",
    "uipack-links__label",
    "uipack-links__title",
    "uipack-links__domain",
  ].flatMap((name) => {
    const el = document.querySelector(`.${name}`);
    return el ? [{ name, ratio: textContrast(el) }] : [];
  });
  const edgeSamples = [
    { name: "notecard edge", el: document.querySelector("a.uipack-notecard"), side: "Top" as const },
    { name: "planned edge", el: document.querySelector(".uipack-notecard--planned"), side: "Top" as const },
    { name: "self-test rule", el: document.querySelector(".uipack-callout--selftest"), side: "Left" as const },
    { name: "note rule", el: document.querySelector(".uipack-callout--note"), side: "Left" as const },
    { name: "cluster edge", el: document.querySelector(".uipack-cluster"), side: "Top" as const },
    { name: "change rule", el: document.querySelector(".uipack-change"), side: "Left" as const },
  ].flatMap(({ name, el, side }) => (el ? [{ name, ratio: edgeContrast(el, side) }] : []));

  const targets = [...document.querySelectorAll("a.uipack-notecard, .uipack-layerhead__map, .uipack-links__link")].map((el) => {
    const r = el.getBoundingClientRect();
    return { name: el.className, width: r.width, height: r.height };
  });

  const layerHeads = [...document.querySelectorAll(".uipack-layerhead")].map((head) => {
    const rect = (sel: string) => head.querySelector(sel)?.getBoundingClientRect();
    const where = rect(".uipack-layerhead__where")!;
    const metric = rect(".uipack-layerhead__metric");
    const map = rect(".uipack-layerhead__map");
    const next = head.nextElementSibling!;
    return {
      width: head.getBoundingClientRect().width,
      metricOnLine: metric ? metric.top < where.bottom - 1 : null,
      mapOnFirstLine: map ? map.top < where.bottom - 1 && map.bottom > where.top + 1 : null,
      nextTag: next.tagName,
      gapToHeading: next.getBoundingClientRect().top - head.getBoundingClientRect().bottom,
    };
  });

  return {
    scrollWidth: document.documentElement.scrollWidth,
    clusters,
    minFont,
    textSamples,
    edgeSamples,
    targets,
    layerHeads,
  };
}
type Audit = ReturnType<typeof audit>;

const expectedColumns = (width: number) => (width >= 859.5 ? 3 : width >= 559.5 ? 2 : 1);

function expectSoundLayout(report: Audit, width: number) {
  // No horizontal page overflow.
  expect(report.scrollWidth).toBeLessThanOrEqual(width);
  expect(report.clusters.length).toBeGreaterThan(0);
  for (const c of report.clusters) {
    // 1 column narrow, 2 from 560px, 3 from 860px of cluster width.
    expect(c.columns, `${c.width}px cluster`).toBe(expectedColumns(c.width));
    expect(c.lefts).toBe(Math.min(c.columns, c.cards));
    expect(c.inside).toBe(true);
    // Cards in a row share its height.
    for (const row of c.rows) expect(Math.max(...row) - Math.min(...row), `row heights ${row}`).toBeLessThan(0.5);
    // A wide cluster is centred on the text column.
    if (c.wide) expect(Math.abs(c.centreOffset)).toBeLessThan(1);
  }
  expect(report.minFont).toBeGreaterThanOrEqual(12);
  for (const s of report.textSamples) expect(s.ratio, `${s.name} contrast`).toBeGreaterThanOrEqual(4.5);
  for (const s of report.edgeSamples) expect(s.ratio, `${s.name} contrast`).toBeGreaterThanOrEqual(3);
  for (const t of report.targets) {
    expect(t.height, `${t.name} height`).toBeGreaterThanOrEqual(44);
    expect(t.width, `${t.name} width`).toBeGreaterThanOrEqual(44);
  }
  for (const head of report.layerHeads) {
    // One line from 560px; narrower, the metric wraps under and the map link stays on the first line.
    if (head.metricOnLine !== null) expect(head.metricOnLine).toBe(head.width >= 560);
    if (head.mapOnFirstLine !== null) expect(head.mapOnFirstLine).toBe(true);
    // The real heading follows the strip, close under it.
    expect(head.nextTag).toMatch(/^H[1-6]$/);
    expect(head.gapToHeading).toBeLessThanOrEqual(8);
  }
}

test.describe("Article parts in the playground (notes palette)", () => {
  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      test(`${width}px ${theme}: no overflow, columns, equal rows, contrast, targets`, async ({ browser }) => {
        const { page, close } = await open(browser, width, `/article?theme=${theme}&host=notes`);
        await page.locator('[data-catalog-entry="layer-section"] .uipack-cluster').first().waitFor();
        const report = await page.evaluate(audit);
        expectSoundLayout(report, width);
        // The playground's text column is 40rem wherever the viewport allows it.
        const first = report.clusters[0];
        if (width >= 896) {
          expect(first.width).toBe(640);
          expect(first.columns).toBe(2);
        }
        if (width === 1440) {
          const wide = report.clusters.find((c) => c.wide)!;
          expect(wide.width).toBe(896);
          expect(wide.columns).toBe(3);
        }
        await close();
      });
    }
  }

  test("uipack defaults (no host tokens) hold up in both themes", async ({ browser }) => {
    for (const theme of THEMES) {
      const { page, close } = await open(browser, 1440, `/article?theme=${theme}`);
      await page.locator(".uipack-cluster").first().waitFor();
      expectSoundLayout(await page.evaluate(audit), 1440);
      // The Technical fallbacks switch with data-theme.
      const fill = await page.locator("a.uipack-notecard").first().evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(fill).toBe(theme === "light" ? "rgb(244, 246, 244)" : "rgb(27, 42, 36)");
      await close();
    }
  });
});

test.describe("Article parts: links, focus and hover", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/article?theme=light&host=notes");
  });

  test("cards, link rows and the map link are real links; a planned card is not", async ({ page }) => {
    const section = page.locator('[data-catalog-entry="layer-section"]');
    const card = section.getByRole("link", { name: /Prefill and decode want different machines/ });
    await expect(card).toHaveAttribute("href", "https://notes.junxiong.dev/prefill-vs-decode");
    await expect(card).toHaveClass("uipack-notecard");
    // The clamped description is still in the link's name.
    await expect(section.getByRole("link", { name: /Which one you care about decides what hardware to buy\./ })).toHaveCount(1);
    // Clamped to three lines on screen (whether this text overflows depends on the
    // platform's fonts, so check the clamp itself), while the full text stays in the DOM.
    const quant = section.locator('a.uipack-notecard[href$="quantization-what-it-costs"] .uipack-notecard__desc');
    expect(await quant.evaluate((el) => getComputedStyle(el).webkitLineClamp)).toBe("3");
    expect(await quant.evaluate((el) => el.clientHeight <= 3 * parseFloat(getComputedStyle(el).lineHeight) + 1)).toBe(true);
    await expect(section.getByRole("link", { name: /need separate budgets\./ })).toHaveCount(1);

    await expect(section.getByRole("link", { name: "The PagedAttention paper arxiv.org" })).toHaveAttribute("href", "https://arxiv.org/abs/2309.06180");
    const terms = section.locator(".uipack-terms").first();
    await expect(terms.getByRole("listitem")).toHaveCount(8);
    await expect(terms.getByRole("link")).toHaveCount(0);
    // The heading stays in the outline; the strip has none of its own.
    await expect(section.getByRole("heading", { level: 3, name: "Inference" })).toBeVisible();
    await expect(section.locator(".uipack-layerhead").getByRole("heading")).toHaveCount(0);

    const planned = page.locator(".uipack-notecard--planned").first();
    await expect(planned).toContainText("Coming next");
    expect(await planned.evaluate((el) => el.tagName)).toBe("DIV");
    await expect(planned.getByRole("link")).toHaveCount(0);
    expect(await planned.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("dashed");

    // Activating links navigates: the map link to the diagram anchor, a card to its article.
    await section.getByRole("link", { name: "Map" }).first().click();
    await expect(page).toHaveURL(/#layer-section$/);
    await page.route("https://notes.junxiong.dev/**", (route) => route.fulfill({ contentType: "text/html", body: "<title>note</title>" }));
    await card.click();
    await expect(page).toHaveURL("https://notes.junxiong.dev/prefill-vs-decode");
  });

  test("keyboard focus shows an accent ring and accent title on cards, rows and the map link", async ({ page, browserName }) => {
    const tab = browserName === "webkit" ? "Alt+Tab" : "Tab";
    const accent = await page.locator(".article-host").evaluate((el) => getComputedStyle(el).getPropertyValue("--fig-accent").trim());
    expect(accent).toBe("#0f7a55");
    const rgb = "rgb(15, 122, 85)";
    const focused = () =>
      page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const s = getComputedStyle(el);
        const title = el.querySelector(".uipack-notecard__title, .uipack-links__title");
        return {
          cls: el.className,
          visible: el.matches(":focus-visible"),
          outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`,
          border: s.borderTopColor,
          title: title ? getComputedStyle(title).color : null,
          color: s.color,
        };
      });

    // Tab from the link before each part, in reading order.
    const section = page.locator('[data-catalog-entry="layer-section"]');
    // Colours ease in over 160ms, so read the settled state.
    const settled = async () => {
      let last = "";
      await expect.poll(async () => {
        const now = JSON.stringify(await focused());
        const same = now === last;
        last = now;
        return same;
      }, { intervals: [100, 100, 100, 250] }).toBe(true);
      return JSON.parse(last) as Awaited<ReturnType<typeof focused>>;
    };
    const tabFrom = async (locator: ReturnType<Page["locator"]>) => {
      await locator.focus();
      await page.keyboard.press(tab);
      await page.waitForTimeout(200);
      return settled();
    };

    // The host bar's last link, then the first strip's map link.
    let state = await tabFrom(page.locator(".article-bar a").last());
    expect(state.cls).toBe("uipack-layerhead__map");
    expect(state.visible).toBe(true);
    expect(state.outline).toBe(`solid 2px ${rgb}`);
    expect(state.color).toBe(rgb);

    // The last link in What changed, then the first Go deeper row: ring and accent title.
    state = await tabFrom(section.locator(".uipack-change").first().locator(".uipack-change__body a").last());
    expect(state.cls).toBe("uipack-links__link");
    expect(state.visible).toBe(true);
    expect(state.outline).toBe(`solid 2px ${rgb}`);
    expect(state.title).toBe(rgb);

    // The last Go deeper row, then the first card: ring, accent edge and accent title.
    state = await tabFrom(section.locator(".uipack-links").first().locator(".uipack-links__link").last());
    expect(state.cls).toBe("uipack-notecard");
    expect(state.visible).toBe(true);
    expect(state.outline).toBe(`solid 2px ${rgb}`);
    expect(state.border).toBe(rgb);
    expect(state.title).toBe(rgb);
    // Tab moves card to card in reading order.
    await page.keyboard.press(tab);
    expect((await page.evaluate(() => (document.activeElement as HTMLAnchorElement).href)).endsWith("quantization-what-it-costs")).toBe(true);
  });

  test("hover gives a card an accent edge and title; reduced motion drops the transitions", async ({ page }) => {
    const card = page.locator('[data-catalog-entry="layer-section"] a.uipack-notecard').first();
    const before = await card.evaluate((el) => getComputedStyle(el).borderTopColor);
    await card.hover();
    await expect.poll(() => card.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe("rgb(15, 122, 85)");
    await expect.poll(() => card.locator(".uipack-notecard__title").evaluate((el) => getComputedStyle(el).color)).toBe("rgb(15, 122, 85)");
    expect(before).not.toBe("rgb(15, 122, 85)");
    expect(await card.evaluate((el) => getComputedStyle(el).transitionDuration)).not.toBe("0s");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.mouse.move(0, 0);
    expect(await card.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0s");
    await card.hover();
    expect(await card.locator(".uipack-notecard__go").evaluate((el) => getComputedStyle(el).transform)).toBe("none");
  });
});

test.describe("Article parts as static HTML in the notes site, JavaScript off", () => {
  test.use({ javaScriptEnabled: false });

  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      test(`${width}px ${theme}: layout, palette and host CSS`, async ({ browser }) => {
        const { page, close } = await open(browser, width, "/e2e-static/article-notes.html", { javaScriptEnabled: false, colorScheme: theme });
        const report = await page.evaluate(audit);
        expectSoundLayout(report, width);
        // The site's text column is 44rem less 2.5rem of padding.
        const column = Math.min(664, width - 40);
        expect(report.clusters[0].width).toBe(column);
        expect(report.clusters.find((c) => c.wide)!.width).toBe(Math.min(896, width - 40));

        // The site's palette reaches the parts through --uipack-*.
        const card = page.locator("a.uipack-notecard").first();
        expect(await card.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(theme === "light" ? "rgb(246, 242, 234)" : "rgb(27, 25, 23)");
        // Labels follow --uipack-label-font (sans here); numbers stay mono.
        const family = (sel: string) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).fontFamily);
        expect(await family(".uipack-cluster__label")).toMatch(/^ui-sans-serif/);
        expect(await family(".uipack-notecard__date")).toMatch(/^ui-monospace/);
        expect(await family(".uipack-layerhead__index")).toMatch(/^ui-monospace/);

        // Host prose rules load after article.css and still do not reach in.
        expect(await page.locator(".uipack-cluster__grid").first().evaluate((el) => getComputedStyle(el).paddingLeft)).toBe("0px");
        expect(await page.locator(".uipack-cluster__item").first().evaluate((el) => getComputedStyle(el).marginTop)).toBe("0px");
        expect(await page.locator(".uipack-terms__label").first().evaluate((el) => getComputedStyle(el).marginTop)).toBe("0px");
        expect(await page.locator(".uipack-links__link").first().evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe("none");
        const text = theme === "light" ? "rgb(20, 17, 13)" : "rgb(236, 231, 222)";
        expect(await page.locator(".uipack-notecard__title").first().evaluate((el) => getComputedStyle(el).color)).toBe(text);
        // Links inside the owner's content keep the site's link colour.
        const link = theme === "light" ? "rgb(154, 52, 18)" : "rgb(240, 133, 79)";
        expect(await page.locator(".uipack-change__body a").first().evaluate((el) => getComputedStyle(el).color)).toBe(link);
        await close();
      });
    }
  }

  for (const width of [1440, 390]) {
    test(`${width}px: only links are boxes, and the labelled parts read as one block`, async ({ browser }) => {
      for (const theme of THEMES) {
        const { page, close } = await open(browser, width, "/e2e-static/article-notes.html", { javaScriptEnabled: false, colorScheme: theme });
        const accent = theme === "light" ? "rgb(15, 122, 85)" : "rgb(25, 158, 112)";
        const style = (sel: string, pseudo?: string) =>
          page.locator(sel).first().evaluate((el, p) => {
            const s = getComputedStyle(el, p);
            return {
              bg: s.backgroundColor,
              top: s.borderTopWidth,
              right: s.borderRightWidth,
              bottom: s.borderBottomWidth,
              left: s.borderLeftWidth,
              leftColor: s.borderLeftColor,
              display: s.display,
              font: `${s.fontWeight} ${s.fontSize}`,
              family: s.fontFamily,
              transform: s.textTransform,
              tracking: s.letterSpacing,
              content: s.content,
              color: s.color,
            };
          }, pseudo);

        // Learn: plain text at 15px, each term whole on one line, a centred dot after each but the last, no chips.
        const term = await style(".uipack-terms__term");
        expect(term.display).toBe("inline-block");
        expect(term.font).toBe("400 15px");
        expect([term.top, term.left, term.bg]).toEqual(["0px", "0px", "rgba(0, 0, 0, 0)"]);
        expect((await style(".uipack-terms__term", "::before")).content).toBe("none");
        expect((await style(".uipack-terms__term:not(:last-child)", "::after")).content).toMatch(/^"·"/);
        expect((await style(".uipack-terms__term:last-child", "::after")).content).toBe("none");

        // Self-test: no fill, no box, a 3px accent rule, the marker label, the question at sans 600 16px.
        const callout = await style(".uipack-callout--selftest");
        expect(callout.bg).toBe("rgba(0, 0, 0, 0)");
        expect([callout.top, callout.right, callout.bottom]).toEqual(["0px", "0px", "0px"]);
        expect(callout.left).toBe("3px");
        expect(callout.leftColor).toBe(accent);
        expect((await style(".uipack-callout--selftest .uipack-callout__label", "::before")).bg).toBe(accent);
        const question = await style(".uipack-callout--selftest .uipack-callout__body");
        expect(question.font).toBe("600 16px");
        expect(question.family).toMatch(/^ui-sans-serif/);

        // What changed: a thinner ink rule (not the accent), and a quieter body: 0.94em at 85% ink.
        const change = await style(".uipack-change");
        expect(parseFloat(change.left)).toBeLessThan(2);
        expect(change.leftColor).not.toBe(accent);
        expect(change.bg).toBe("rgba(0, 0, 0, 0)");
        const host = parseFloat(await page.locator(".prose > p").first().evaluate((el) => getComputedStyle(el).fontSize));
        const body = await style(".uipack-change__body");
        expect(parseFloat(body.font.split(" ")[1])).toBeCloseTo(host * 0.94, 1);
        expect(body.color).toMatch(/ \/ 0\.85\)$|, 0\.85\)$/);

        // The strip: the zone stays an uppercase label, the metric label is sentence case.
        const zone = await style(".uipack-layerhead__zone");
        expect(zone.transform).toBe("uppercase");
        const label = await style(".uipack-layerhead__label");
        expect(label.transform).toBe("none");
        expect(label.font).toBe("400 13px");
        expect(["normal", "0px"]).toContain(label.tracking);

        // Only cards (links) keep the filled node box.
        const filled = await page.evaluate(() =>
          [...document.querySelectorAll(".uipack-terms, .uipack-terms *, .uipack-callout, .uipack-callout *, .uipack-change, .uipack-links, .uipack-layerhead")].filter(
            (el) => getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)",
          ).length,
        );
        expect(filled).toBe(0);

        // Rhythm: 0.9rem between consecutive parts, 1.5rem above the first and below the last.
        const gaps = await page.evaluate(() => {
          const terms = document.querySelector(".uipack-terms")!;
          const run = [terms, terms.nextElementSibling!, terms.nextElementSibling!.nextElementSibling!, terms.nextElementSibling!.nextElementSibling!.nextElementSibling!];
          const box = (el: Element) => el.getBoundingClientRect();
          return {
            names: run.map((el) => el.classList[0]),
            between: run.slice(1).map((el, i) => box(el).top - box(run[i]).bottom),
            before: box(terms).top - box(terms.previousElementSibling!).bottom,
            after: box(run[3].nextElementSibling!).top - box(run[3]).bottom,
          };
        });
        expect(gaps.names).toEqual(["uipack-terms", "uipack-change", "uipack-callout", "uipack-links"]);
        for (const gap of gaps.between) expect(gap).toBeCloseTo(14.4, 0);
        expect(gaps.before).toBeCloseTo(24, 0);
        expect(gaps.after).toBeCloseTo(24, 0);
        await close();
      }
    });
  }

  test("links are plain anchors and the static page needs no script", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/e2e-static/article-notes.html");
    // The dev server injects its client into served HTML; the page itself has no script.
    expect(readFileSync("playground/e2e-static/article-notes.html", "utf8")).not.toMatch(/<script|<style[^>]*>[^<]*@import/);
    const cards = page.locator("a.uipack-notecard");
    expect(await cards.count()).toBe(11);
    for (const href of await cards.evaluateAll((els) => els.map((el) => el.getAttribute("href")))) expect(href).toMatch(/^https:\/\/notes\.junxiong\.dev\//);
    await expect(page.getByRole("link", { name: /Prefill and decode want different machines/ })).toHaveCount(2);
    await expect(page.locator(".uipack-notecard--planned").getByRole("link")).toHaveCount(0);
    // The map link works without script.
    await page.getByRole("link", { name: "Map" }).first().click();
    await expect(page).toHaveURL(/#ai-stack-layers$/);
    await expect(page.getByRole("link", { name: "long-tasks paper" })).toHaveAttribute("href", "https://arxiv.org/abs/2503.14499");
  });

  test("with no host tokens, the Technical fallbacks follow the OS theme", async ({ browser }) => {
    for (const theme of THEMES) {
      const { page, close } = await open(browser, 896, "/e2e-static/article-defaults.html", { javaScriptEnabled: false, colorScheme: theme });
      expectSoundLayout(await page.evaluate(audit), 896);
      expect(await page.locator("a.uipack-notecard").first().evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(theme === "light" ? "rgb(244, 246, 244)" : "rgb(27, 42, 36)");
      await close();
    }
  });
});
