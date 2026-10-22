import { expect, test, type Locator, type Page } from "./fixtures";

// SpanChart and LayerStack: the playground (client-rendered, with the optional
// enhancement) in a frame at a host's real figure width, a host article whose
// prose CSS loads after charts.css, and static HTML with JavaScript off.

const visibleRows = (chart: Locator) => chart.locator(".uipack-span__item:visible");
const col = (chart: Locator, layer: string) => chart.locator(`.uipack-span__col[data-l="${layer}"]`);
const chip = (chart: Locator, attr: string) => chart.locator(`.uipack-span__toolbar .uipack-span__chip[${attr}]`);
const at = (frame: string, hash: string, theme = "light") => `/charts?theme=${theme}&frame=${frame}#${hash}`;
// Label widths are estimated from the macOS system font, the one the hosts are
// tuned on. Other platforms fall back to wider fonts (CI's Linux runners use
// DejaVu), so there the checks below hold the floor (no touching labels, bands
// within one wrapped line) rather than the exact design targets.
const tunedFont = process.platform === "darwin";

async function noPageOverflow(page: Page, width: number) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
}

/** Smallest computed font size of any visible element that holds text inside `root`. */
async function smallestText(root: Locator) {
  return root.evaluate((el) => {
    let min = Infinity;
    for (const node of el.querySelectorAll<HTMLElement>("*")) {
      const own = [...node.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
      if (!own) continue;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      if (!rect.width || !rect.height || style.visibility === "hidden" || style.clipPath === "inset(50%)") continue;
      if (node.closest(".uipack-span__inputs, .uipack-span__sr, .uipack-stack__sr")) continue;
      min = Math.min(min, parseFloat(style.fontSize));
    }
    return min;
  });
}

const centre = (box: { x: number; width: number }) => box.x + box.width / 2;

/** Gaps between neighbouring visible column labels (their text boxes), left to right. */
async function labelGaps(chart: Locator, which: "short" | "full" | "abbr") {
  return chart.locator(`.uipack-span__col .uipack-span__${which}`).evaluateAll((els) => {
    // The text's own extent (a wrapped label's widest line), not its box.
    const boxes = els.map((e) => {
      const range = document.createRange();
      range.selectNodeContents(e);
      return range.getBoundingClientRect();
    });
    return boxes.slice(1).map((b, i) => {
      const a = boxes[i];
      const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      return overlapY > 0 ? b.left - a.right : Infinity;
    });
  });
}

/** Where the chart top and its first visible row sit in the viewport after an action. */
async function landing(page: Page, chart: Locator) {
  return chart.evaluate((el) => {
    const row = [...el.querySelectorAll(".uipack-span__item")].find((r) => r.getClientRects().length && !(r as HTMLElement).hidden)!;
    return { top: el.getBoundingClientRect().top, row: row.getBoundingClientRect().top, height: innerHeight };
  });
}

test.describe("SpanChart at a 56rem host (896px)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(at("896", "span-chart"));
  });

  test("shows the name column and short layer names, not codes", async ({ page }) => {
    const chart = page.locator("#ai-stack");
    expect((await chart.boundingBox())!.width).toBe(896);
    await expect(chart.locator(".uipack-span__corner")).toBeVisible();
    await expect(col(chart, "control").locator(".uipack-span__short")).toHaveText("Gateway");
    await expect(col(chart, "control").locator(".uipack-span__short")).toBeVisible();
    await expect(col(chart, "control").locator(".uipack-span__abbr")).toBeHidden();
    // At least 8px between neighbouring labels (6px with a wider fallback font),
    // with each layer's count under its name.
    for (const gap of await labelGaps(chart, "short")) expect(gap).toBeGreaterThanOrEqual(tunedFont ? 8 : 6);
    await expect(col(chart, "control").locator(".uipack-span__ccount")).toBeVisible();
    // Headers carry the names, so there is no row of layer chips: the corner cell says what they do.
    await expect(chart.locator(".uipack-span__panel .uipack-span__chip[data-l]")).toHaveCount(0);
    await expect(chart.locator(".uipack-span__corner .uipack-span__hint")).toHaveText("Click a column to filter", { useInnerText: true });
    await expect(chart.locator(".uipack-span__hint--toolbar")).toBeHidden();
    // The name column holds about 11 to 12 characters of a name beside its value.
    const nameRoom = await chart.locator('[data-item="nvidia"] .uipack-span__nv > b').evaluate((el) => el.parentElement!.getBoundingClientRect().width - el.nextElementSibling!.getBoundingClientRect().width);
    expect(nameRoom).toBeGreaterThanOrEqual(tunedFont ? 90 : 80);
    // The main bar sits under its column.
    const main = (await chart.locator('[data-item="nvidia"] .uipack-span__track > span > span').boundingBox())!;
    expect(Math.abs(centre(main) - centre((await col(chart, "chips").boundingBox())!))).toBeLessThan(1);
  });

  test("expands and collapses in place from the top or the foot, by click and keyboard", async ({ page }) => {
    const chart = page.locator("#ai-stack");
    const featured = await chart.locator(".uipack-span__item[data-featured]").count();
    const total = await chart.locator(".uipack-span__item").count();
    await expect(visibleRows(chart)).toHaveCount(featured);
    await expect(chart.locator(".uipack-span__top")).toContainText(`${featured} of ${total} shown`);
    const group = chart.locator('[id="ai-stack-g-chips"]');
    await expect(group.locator(".uipack-span__count--featured")).toHaveText("2 of 6");

    await chart.locator(".uipack-span__toggle--top").click();
    await expect(visibleRows(chart)).toHaveCount(total);
    await expect(group.locator(".uipack-span__count--total")).toBeVisible();
    for (const row of await chart.locator('.uipack-span__group[data-layers~="chips"]:has(#ai-stack-g-chips) .uipack-span__item').all()) {
      await expect(row).toBeVisible();
    }

    // Collapsing from the foot brings the chart top back into view.
    await chart.locator(".uipack-span__toggle--foot").scrollIntoViewIfNeeded();
    await chart.locator(".uipack-span__toggle--foot").click();
    await expect(visibleRows(chart)).toHaveCount(featured);
    expect((await chart.boundingBox())!.y).toBeGreaterThanOrEqual(-1);

    const box = chart.locator(".uipack-span__expand");
    await box.focus();
    await page.keyboard.press("Space");
    await expect(visibleRows(chart)).toHaveCount(total);
    await expect(box).toBeFocused();
    expect(await chart.locator(".uipack-span__toggle--top").evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
  });

  test("a column header or a chip filters, in sync, and shows the state in the sticky header", async ({ page }) => {
    const chart = page.locator("#ai-stack");
    await col(chart, "inference").click();
    const expected = await chart.locator('.uipack-span__item[data-layers~="inference"]').count();
    await expect(visibleRows(chart)).toHaveCount(expected);
    await expect(chart.locator('.uipack-span__group:has(#ai-stack-g-power)')).toBeHidden();
    for (const group of await chart.locator(".uipack-span__group:visible").all()) {
      expect(await group.locator(".uipack-span__item:visible").count()).toBeGreaterThan(0);
      await expect(group.locator(".uipack-span__count--live")).toHaveText(String(await group.locator(".uipack-span__item:visible").count()));
    }
    // The chosen header shows a bar, not only colour.
    expect(await col(chart, "inference").evaluate((el) => getComputedStyle(el, "::after").height)).toBe("3px");
    const now = chart.locator(".uipack-span__now-row");
    await expect(now).toBeVisible();
    await expect(now.locator('.uipack-span__now[data-l="inference"]')).toBeVisible();
    await expect(chart.locator("[data-span-status]")).toHaveText(`${expected} of 45 shown`);

    // The active "Deals" chip lays out like the others.
    await chip(chart, "data-d").click();
    expect(await chip(chart, "data-d").evaluate((el) => getComputedStyle(el).getPropertyValue("--sp-sel").trim())).toBe("1");
    const display = (sel: string) => now.locator(sel).evaluate((el) => getComputedStyle(el).display);
    expect(await display(".uipack-span__now[data-d]")).toBe(await display('.uipack-span__now[data-l="inference"]'));
    await chip(chart, "data-d").click();
    // Repeat activation clears; Escape clears.
    await col(chart, "data").click();
    await col(chart, "data").click();
    await expect(chart.locator("#ai-stack-layer-all")).toBeChecked();
    await col(chart, "evals").click();
    await page.keyboard.press("Escape");
    await expect(chart.locator("#ai-stack-layer-all")).toBeChecked();
    await expect(now).toBeHidden();
  });

  test("layer, size and deals combine; the empty state clears them all", async ({ page }) => {
    const chart = page.locator("#ai-stack");
    await chip(chart, "data-d").click();
    const deals = await chart.locator(".uipack-span__item[data-deal]").count();
    await expect(visibleRows(chart)).toHaveCount(deals);
    await chip(chart, 'data-t="small"').click();
    await expect(visibleRows(chart)).toHaveCount(await chart.locator('.uipack-span__item[data-deal][data-tier="small"]').count());
    await col(chart, "evals").click();
    const both = await chart.locator('.uipack-span__item[data-deal][data-tier="small"][data-layers~="evals"]').count();
    await expect(visibleRows(chart)).toHaveCount(both);
    for (const group of await chart.locator(".uipack-span__group:visible").all()) {
      expect(await group.locator(".uipack-span__item:visible").count()).toBeGreaterThan(0);
    }
    await col(chart, "power").click();
    await expect(visibleRows(chart)).toHaveCount(0);
    await expect(chart.locator(".uipack-span__empty")).toBeVisible();
    await chart.locator(".uipack-span__empty button").click();
    await expect(chart.locator("#ai-stack-layer-all")).toBeChecked();
    await expect(chart.locator("#ai-stack-layer-all")).toBeFocused();
    await expect(chart.locator("#ai-stack-tier-all")).toBeChecked();
    await expect(chart.locator("#ai-stack-deals")).not.toBeChecked();
    await expect(visibleRows(chart)).toHaveCount(await chart.locator(".uipack-span__item[data-featured]").count());
  });

  test("a row opens by click and keyboard and keeps its links", async ({ page }) => {
    const chart = page.locator("#ai-stack");
    const row = chart.locator('[data-item="fireworks"] details');
    await row.locator("summary").click();
    await expect(row).toHaveAttribute("open", "");
    await expect(row.getByRole("link", { name: "Website" })).toHaveAttribute("href", "https://fireworks.ai");
    await expect(row.getByRole("link", { name: "Source" })).toBeVisible();
    await row.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(row).not.toHaveAttribute("open", "");
    await page.keyboard.press("Space");
    await expect(row).toHaveAttribute("open", "");
    await expect(row.locator("summary")).toHaveAccessibleName("Fireworks AI. Main layer: Inference. Also in: Post-training. Size: $4B, Small.");
  });

  test("rows hidden in the featured view stay findable, and a match expands the list", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "hidden=until-found is Chromium-only");
    const chart = page.locator("#ai-stack");
    await expect(chart).toHaveAttribute("data-span-find", "");
    const amd = chart.locator('[data-item="amd"]');
    await expect(amd).toHaveAttribute("hidden", "until-found");
    await expect(amd).toHaveAttribute("aria-hidden", "true");
    await amd.evaluate((el) => el.dispatchEvent(new Event("beforematch", { bubbles: true })));
    await expect(chart.locator(".uipack-span__expand")).toBeChecked();
    await expect(amd).not.toHaveAttribute("hidden");
    await expect(amd).not.toHaveAttribute("aria-hidden");
    await expect(amd).toBeVisible();
  });

  test("filtering from the sticky header or collapsing from the foot lands on the chart, in every engine", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 800 });
    const chart = page.locator("#ai-stack");
    await chart.locator(".uipack-span__toggle--top").click();
    const deep = async () => {
      const box = (await chart.boundingBox())!;
      await page.mouse.wheel(0, box.y + box.height * 0.6);
      await page.waitForTimeout(150);
    };
    // A filter chosen from the stuck header, 60% down the list.
    await deep();
    await col(chart, "evals").click();
    let at = await landing(page, chart);
    expect(at.top).toBeGreaterThanOrEqual(-1);
    expect(at.row).toBeLessThan(at.height);
    // Clearing from the stuck header's Clear button.
    await chart.locator(".uipack-span__toggle--top").isVisible();
    await page.keyboard.press("Escape");
    // Collapsing from the foot of the expanded list.
    await chart.locator(".uipack-span__toggle--foot").scrollIntoViewIfNeeded();
    await chart.locator(".uipack-span__toggle--foot").click();
    at = await landing(page, chart);
    expect(at.top).toBeGreaterThanOrEqual(-1);
    expect(at.top).toBeLessThan(at.height);
    expect(at.row).toBeLessThan(at.height);
  });

  test("Space on the selected layer clears it, and group labels stick under the header", async ({ page }) => {
    const chart = page.locator("#ai-stack");
    await chart.locator("#ai-stack-layer-inference").focus();
    await page.keyboard.press("Space");
    await expect(chart.locator("#ai-stack-layer-inference")).toBeChecked();
    await page.keyboard.press("Space");
    await expect(chart.locator("#ai-stack-layer-all")).toBeChecked();

    await chart.locator(".uipack-span__toggle--top").click();
    const head = chart.locator("#ai-stack-g-pretraining");
    const group = chart.locator(".uipack-span__group:has(#ai-stack-g-pretraining)");
    const g = (await group.boundingBox())!;
    await page.evaluate((y) => scrollBy(0, y), g.y + 80);
    await page.waitForTimeout(150);
    const header = (await chart.locator(".uipack-span__header").boundingBox())!;
    const stuck = (await head.boundingBox())!;
    expect(Math.abs(stuck.y - (header.y + header.height))).toBeLessThanOrEqual(2);

    // The stuck label paints above the bars scrolling under it: with the bars
    // made hit-testable, the label wins wherever a bar overlaps it.
    const onTop = await chart.evaluate((el, box) => {
      const head = el.querySelector("#ai-stack-g-pretraining")!;
      const bars = [...el.querySelectorAll<HTMLElement>(".uipack-span__track > span")];
      bars.forEach((s) => (s.style.pointerEvents = "auto"));
      const under = bars.map((s) => s.getBoundingClientRect()).filter((r) => r.top < box.y + box.height - 1 && r.bottom > box.y + 1);
      const hits = under.map((r) => document.elementFromPoint((r.left + r.right) / 2, (Math.max(r.top, box.y) + Math.min(r.bottom, box.y + box.height)) / 2));
      return under.length > 0 && hits.every((hit) => !!hit && head.contains(hit));
    }, stuck);
    expect(onTop).toBe(true);
  });

  test("focus on All layers shows on the column-header row when the chips are hidden", async ({ page }) => {
    const chart = page.locator("#ai-stack");
    await expect(chip(chart, 'data-l="*"')).toBeHidden();
    // The first Tab stop in the header, reached by keyboard (as after Clear).
    await page.keyboard.press("Shift");
    await chart.locator("#ai-stack-layer-all").focus();
    expect(await chart.locator("#ai-stack-layer-all").evaluate((el) => el.matches(":focus-visible"))).toBe(true);
    const ring = (el: Element) => getComputedStyle(el).outlineWidth;
    expect(await chart.locator(".uipack-span__cols").evaluate(ring)).toBe("2px");
    await page.keyboard.press("ArrowRight");
    expect(await chart.locator(".uipack-span__cols").evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("none");
  });

  test("a link to a filter input opens that view", async ({ page }) => {
    await page.goto(at("896", "ai-stack-layer-control"));
    const chart = page.locator("#ai-stack");
    await expect(chart.locator("#ai-stack-layer-control")).toBeChecked();
    await expect(visibleRows(chart)).toHaveCount(await chart.locator('.uipack-span__item[data-layers~="control"]').count());
  });

  test("Find a company: name, tag or deal, any case or accent, combined with filters; Escape and Clear reset", async ({ page }) => {
    const chart = page.locator("#ai-stack");
    const field = chart.getByRole("searchbox", { name: "Find a company" });
    await expect(field).toBeVisible();
    const total = await chart.locator(".uipack-span__item").count();
    const featured = await chart.locator(".uipack-span__item[data-featured]").count();
    const matching = (q: string, layer?: string) =>
      chart.evaluate(
        (el, [q, layer]) => {
          const fold = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
          return [...el.querySelectorAll<HTMLElement>(".uipack-span__item")].filter(
            (row) =>
              (!layer || row.dataset.layers!.split(" ").includes(layer)) &&
              fold([row.querySelector(".uipack-span__nv > b")!, ...row.querySelectorAll(".uipack-span__sub > *")].map((n) => n.textContent).join(" ")).includes(fold(q!)),
          ).length;
        },
        [q, layer] as const,
      );
    await field.fill("NVÍD");
    const n = await matching("nvid");
    expect(n).toBeGreaterThan(1);
    await expect(visibleRows(chart)).toHaveCount(n);
    await expect(chart.locator("[data-span-status]")).toHaveText(`${n} of ${total} shown`);
    await expect(chart.locator("[data-span-live]")).toHaveText(`${n} of ${total} shown`);
    // A match outside the featured rows shows without expanding the list.
    await expect(chart.locator('[data-item="hugging-face"]')).toBeVisible();
    await expect(chart.locator(".uipack-span__expand")).not.toBeChecked();
    // Combined with a layer filter.
    await col(chart, "inference").click();
    await expect(visibleRows(chart)).toHaveCount(await matching("nvid", "inference"));
    await page.keyboard.press("Escape");
    await expect(field).toHaveValue("");
    await expect(chart.locator("#ai-stack-layer-all")).toBeChecked();
    await expect(visibleRows(chart)).toHaveCount(featured);
    // Escape in the field clears the search only.
    await chart.locator("#ai-stack-deals").evaluate((el: HTMLInputElement) => el.click());
    await field.fill("groq");
    await expect(visibleRows(chart)).toHaveCount(1);
    await field.press("Escape");
    await expect(field).toHaveValue("");
    await expect(chart.locator("#ai-stack-deals")).toBeChecked();
    await chart.locator("#ai-stack-deals").evaluate((el: HTMLInputElement) => el.click());
    // No match: a boxed state that names the query and clears it.
    await field.fill("zzzz");
    await expect(visibleRows(chart)).toHaveCount(0);
    const none = chart.locator(".uipack-span__nomatch");
    await expect(none).toBeVisible();
    await expect(none).toContainText("No company matches “zzzz”");
    await none.getByRole("button", { name: "Clear" }).click();
    await expect(field).toHaveValue("");
    await expect(field).toBeFocused();
    await expect(none).toBeHidden();
    await expect(visibleRows(chart)).toHaveCount(featured);
  });

  test("hovering a column, at its header or in the rows, shows its band, fainter than the chosen one", async ({ page }) => {
    const chart = page.locator("#ai-stack");
    const body = chart.locator(".uipack-span__body");
    const band = (which: "::after" | "::before") =>
      body.evaluate((el, which) => {
        const s = getComputedStyle(el, which);
        return { display: s.display, left: el.getBoundingClientRect().left + parseFloat(s.left), colour: s.backgroundColor };
      }, which);
    expect((await band("::after")).display).toBe("none");
    await col(chart, "evals").hover();
    expect((await band("::after")).display).toBe("block");
    expect(Math.abs((await band("::after")).left - (await col(chart, "evals").boundingBox())!.x)).toBeLessThanOrEqual(1.5);
    // In the rows, the column under the pointer (the enhancement measures the headers).
    const data = (await col(chart, "data").boundingBox())!;
    const row = (await chart.locator('[data-item="nvidia"]').boundingBox())!;
    await page.mouse.move(centre(data), row.y + row.height / 2);
    expect(Math.abs((await band("::after")).left - data.x)).toBeLessThanOrEqual(1.5);
    await expect(col(chart, "data")).toHaveAttribute("data-span-hover", "");
    // Over the name column, no band.
    await page.mouse.move(row.x + 40, row.y + row.height / 2);
    expect((await band("::after")).display).toBe("none");
    // A chosen column keeps its stronger band while another is hovered.
    await col(chart, "inference").click();
    await page.mouse.move(centre(data), row.y + row.height / 2);
    const chosen = await band("::before");
    const hover = await band("::after");
    expect(chosen.display).toBe("block");
    expect(hover.display).toBe("block");
    expect(chosen.colour).not.toBe(hover.colour);
  });

  test("Tab meets size, Deals, search and the columns in the order they are drawn", async ({ page, browserName }) => {
    const chart = page.locator("#ai-stack");
    const tops = await chart.evaluate((el) =>
      [".uipack-span__toolbar .uipack-span__seg", ".uipack-span__toolbar [data-d]", 'input[type="search"]', ".uipack-span__cols"].map((sel) => {
        const r = el.querySelector(sel)!.getBoundingClientRect();
        return { y: Math.round(r.top), x: Math.round(r.left) };
      }),
    );
    // Drawn: size, then Deals on the same row, then search, then the columns below.
    expect(tops[1].x).toBeGreaterThan(tops[0].x);
    expect(tops[2].x).toBeGreaterThan(tops[1].x);
    expect(tops[3].y).toBeGreaterThan(tops[2].y);
    test.skip(browserName !== "chromium", "WebKit tabs to text fields and links only, by default");
    await chart.locator("#ai-stack-tier-all").focus();
    await page.keyboard.press("Tab");
    await expect(chart.locator("#ai-stack-deals")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(chart.locator('input[type="search"]')).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(chart.locator("#ai-stack-layer-all")).toBeFocused();
    // Clicking a size box from the toolbar does not move the page.
    const y = await page.evaluate(() => scrollY);
    await chip(chart, 'data-t="large"').click();
    expect(await page.evaluate(() => scrollY)).toBe(y);
  });

  test("group squares sit on the label's line, in their column", async ({ page }) => {
    const chart = page.locator("#ai-stack");
    const head = chart.locator('[id="ai-stack-g-chips"]');
    const mark = (await head.locator(".uipack-span__mark").boundingBox())!;
    const label = (await head.locator("span").first().boundingBox())!;
    expect(Math.abs(mark.y + mark.height / 2 - (label.y + label.height / 2))).toBeLessThanOrEqual(2);
    expect(Math.abs(centre(mark) - centre((await col(chart, "chips").boundingBox())!))).toBeLessThanOrEqual(1);
  });
});

test.describe("SpanChart without size or deals", () => {
  test("the search field joins the key's row, at the right", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/e2e-static/span-chart-lean.html");
    const chart = page.locator("#lean");
    const field = chart.getByRole("searchbox", { name: "Find a harness" });
    await expect(field).toBeVisible();
    const key = (await chart.locator(".uipack-span__panel .uipack-span__key").boundingBox())!;
    const box = (await field.boundingBox())!;
    const root = (await chart.boundingBox())!;
    // Same row: the field's box overlaps the key's line, and ends at the chart's edge.
    expect(box.y).toBeLessThan(key.y + key.height);
    expect(box.y + box.height).toBeGreaterThan(key.y);
    expect(Math.abs(box.x + box.width - (root.x + root.width))).toBeLessThanOrEqual(1);
    expect(box.x).toBeGreaterThan(key.x + 100);
    await field.fill("nvidia");
    await expect(visibleRows(chart)).toHaveCount(1);
  });
});

test.describe("SpanChart key strip", () => {
  /** Distinct section tops, and whether each section's items share one line. */
  const layout = (key: Locator) =>
    key.evaluate((el) => {
      const sections = [...el.children].map((li) => ({
        top: Math.round(li.getBoundingClientRect().top),
        mids: [...li.children].map((c) => {
          const r = c.getBoundingClientRect();
          return r.top + r.height / 2;
        }),
      }));
      return {
        rows: new Set(sections.map((s) => s.top)).size,
        inline: sections.every((s) => Math.max(...s.mids) - Math.min(...s.mids) <= 2),
        used: Math.round([...el.children].reduce((w, li) => w + li.getBoundingClientRect().width, 0)),
        room: Math.round(el.getBoundingClientRect().width),
      };
    });

  for (const width of [896, 1088]) {
    test(`one row at ${width}px with the notes site's longest key words, sections never split`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/e2e-static/span-chart-stress.html");
      await page.evaluate((w) => (document.querySelector("main")!.style.maxWidth = `${w}px`), width);
      const chart = page.locator("#stress");
      expect((await chart.boundingBox())!.width).toBe(width);
      const key = chart.locator(".uipack-span__panel .uipack-span__key");
      // Unframed, like a chart legend: no box, no fill.
      expect(await key.evaluate((el) => [getComputedStyle(el).borderTopWidth, getComputedStyle(el).backgroundColor])).toEqual(["0px", "rgba(0, 0, 0, 0)"]);
      await expect(key).toContainText("market cap or valuation");
      await expect(key).toContainText("shut down");
      const r = await layout(key);
      test.info().annotations.push({ type: "key", description: `${r.used} of ${r.room}px` });
      expect(r.inline).toBe(true);
      // Elsewhere a wider fallback font may push whole sections to a second row.
      expect(r.rows).toBeLessThanOrEqual(tunedFont ? 1 : 2);
    });
  }

  test("the playground chart's key is one row at 896px", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(at("896", "span-chart"));
    const r = await layout(page.locator("#ai-stack .uipack-span__panel .uipack-span__key"));
    expect(r.inline).toBe(true);
    expect(r.rows).toBeLessThanOrEqual(tunedFont ? 1 : 2);
  });
});

test.describe("SpanChart at other widths", () => {
  test("720px stacks rows under short layer names", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(at("720", "span-chart"));
    const chart = page.locator("#ai-stack");
    await expect(col(chart, "inference").locator(".uipack-span__short")).toBeVisible();
    await expect(chart.locator(".uipack-span__corner")).toBeHidden();
    const name = (await chart.locator('[data-item="nvidia"] .uipack-span__name').boundingBox())!;
    const track = (await chart.locator('[data-item="nvidia"] .uipack-span__track').boundingBox())!;
    expect(track.y).toBeGreaterThan(name.y + name.height - 1);
  });

  for (const width of [390, 320]) {
    for (const theme of ["light", "dark"] as const) {
      test(`${width}px ${theme}: drawer, codes, readable labels, no overflow`, async ({ browser }) => {
        const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
        const page = await context.newPage();
        await page.goto(at("full", "span-chart", theme));
        const chart = page.locator("#ai-stack");
        const drawer = chart.locator(".uipack-span__drawer");
        await expect(drawer).toBeVisible();
        await expect(drawer).not.toHaveAttribute("open", "");
        await expect(chart.locator(".uipack-span__panel")).toBeHidden();
        await expect(drawer.locator("summary")).toContainText("All layers");
        // Touch targets: 44px tall headers and chips.
        expect((await col(chart, "power").boundingBox())!.height).toBeGreaterThanOrEqual(44);
        // The key and Deals sit outside the closed drawer.
        await expect(chart.locator(".uipack-span__keyline")).toBeVisible();
        await chart.locator(".uipack-span__keyline [data-d]").tap();
        await expect(chart.locator("#ai-stack-deals")).toBeChecked();
        expect((await chart.locator(".uipack-span__now[data-d]").boundingBox())!.height).toBeGreaterThanOrEqual(44);
        let land = await landing(page, chart);
        expect(land.top).toBeGreaterThanOrEqual(-1);
        expect(land.top).toBeLessThan(land.height);
        await chart.locator(".uipack-span__keyline [data-d]").tap();
        await drawer.locator("summary").tap();
        // Layer and size chips wrap inside the drawer by whole boxes: none is cut off.
        const right = (await drawer.boundingBox())!;
        for (const b of await drawer.locator(".uipack-span__chip").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().right))) {
          expect(b).toBeLessThanOrEqual(right.x + right.width);
        }
        // The drawer holds the whole key, so the key line outside it steps aside.
        await expect(drawer.locator(".uipack-span__key")).toBeVisible();
        await expect(chart.locator(".uipack-span__keyline")).toBeHidden();
        expect((await drawer.locator('.uipack-span__chip[data-l="power"]').boundingBox())!.height).toBeGreaterThanOrEqual(44);
        await drawer.locator('.uipack-span__chip[data-l="evals"]').tap();
        await expect(drawer.locator("summary")).toContainText("Evals");
        await expect(chart.locator(".uipack-span__now-row")).toBeVisible();
        // The drawer chip and the column header label the same radio.
        expect(await col(chart, "evals").evaluate((el) => getComputedStyle(el, "::after").height)).toBe("3px");
        land = await landing(page, chart);
        expect(land.top).toBeLessThan(land.height);
        await chart.locator('[data-item="hugging-face"] summary').tap();
        await noPageOverflow(page, width);
        expect(await smallestText(chart)).toBeGreaterThanOrEqual(11);
        // Codes keep 8px apart, alternating lines where columns are narrow.
        for (const gap of await labelGaps(chart, "abbr")) expect(gap).toBeGreaterThanOrEqual(8);
        // No group squares where they would need a line of their own.
        await expect(chart.locator(".uipack-span__mark").first()).toBeHidden();
        await context.close();
      });
    }
  }
});

test.describe("SpanChart stress rows at 896px", () => {
  for (const browserWidth of [1440]) {
    test(`long names, values and buyers never crush or cut each other (${browserWidth})`, async ({ page }) => {
      await page.setViewportSize({ width: browserWidth, height: 900 });
      await page.goto("/e2e-static/span-chart-stress.html");
      const chart = page.locator("#stress");
      expect((await chart.boundingBox())!.width).toBe(896);
      for (const id of ["bds", "gh", "hpe", "hume", "pk", "arize"]) {
        const name = (await chart.locator(`[data-item="${id}"] .uipack-span__nv > b`).boundingBox())!;
        expect(name.width).toBeGreaterThanOrEqual(70);
      }
      const value = chart.locator('[data-item="bds"] .uipack-span__nv > em');
      expect((await value.boundingBox())!.width).toBeLessThanOrEqual(72);
      for (const badge of await chart.locator(".uipack-span__item .uipack-span__badge").all()) {
        expect(await badge.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      }
      await expect(chart.locator('[data-item="pk"] .uipack-span__badge')).toHaveText("→ Palo Alto Networks");
      // Rows with and without a badge line share one height when names fit one line.
      const heights = await chart.locator('[data-item="short"], [data-item="pk"], [data-item="arize"]').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
      expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(4);
      // The full value is still read out and shown in the opened row.
      await expect(chart.locator('[data-item="bds"] summary')).toHaveAccessibleName(/Size: part of ByteDance\./);
    });
  }

  test("full labels at a wide host keep 8px apart", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(at("full", "span-chart"));
    const chart = page.locator("#ai-stack");
    await expect(col(chart, "control").locator(".uipack-span__full")).toBeVisible();
    for (const gap of await labelGaps(chart, "full")) expect(gap).toBeGreaterThanOrEqual(8);
  });
});

test.describe("Charts in a host article (prose CSS after charts.css)", () => {
  test("prose rules do not leak in, and the first company sits near the top on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/e2e-static/host.html");
    const chart = page.locator("#ai-stack");
    expect(await chart.locator(".uipack-span__rows").first().evaluate((el) => getComputedStyle(el).paddingLeft)).toBe("0px");
    const main = (await chart.locator('[data-item="nvidia"] .uipack-span__track > span > span').boundingBox())!;
    expect(Math.abs(centre(main) - centre((await col(chart, "chips").boundingBox())!))).toBeLessThan(1);
    expect(await page.locator("#ai-stack-layers .uipack-stack__summary").first().evaluate((el) => getComputedStyle(el).marginTop)).toBe("0px");
    // The hero fits a screen at the host width.
    expect((await page.locator("#ai-stack-layers").boundingBox())!.height).toBeLessThanOrEqual(760);
    await expect(page.locator("#ai-stack h3, #ai-stack h4, #ai-stack-layers h3, #ai-stack-layers h4")).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    const first = await chart.evaluate((el) => {
      const row = [...el.querySelectorAll(".uipack-span__item")].find((r) => r.getClientRects().length)!;
      return row.getBoundingClientRect().top - el.getBoundingClientRect().top;
    });
    expect(first).toBeLessThanOrEqual(280);
    await expect(chart.locator('[data-l="power"].uipack-span__col .uipack-span__abbr')).toHaveText("PWR");
  });
});

test.describe("SpanChart as static HTML with JavaScript off", () => {
  test.use({ javaScriptEnabled: false });

  test("expands, filters by layer, size and deals, clears, and opens rows", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/e2e-static/span-chart.html");
    const chart = page.locator("#ai-stack");
    const featured = await chart.locator(".uipack-span__item[data-featured]").count();
    await expect(visibleRows(chart)).toHaveCount(featured);
    await chart.locator(".uipack-span__toggle--top").click();
    await expect(visibleRows(chart)).toHaveCount(45);
    await chart.locator(".uipack-span__toggle--foot").click();
    await expect(visibleRows(chart)).toHaveCount(featured);

    await col(chart, "chips").click();
    await expect(visibleRows(chart)).toHaveCount(await chart.locator('.uipack-span__item[data-layers~="chips"]').count());
    await chip(chart, 'data-t="large"').click();
    await expect(visibleRows(chart)).toHaveCount(await chart.locator('.uipack-span__item[data-tier="large"][data-layers~="chips"]').count());
    await chip(chart, "data-d").click();
    await expect(visibleRows(chart)).toHaveCount(await chart.locator('.uipack-span__item[data-deal][data-tier="large"][data-layers~="chips"]').count());
    // The sticky header's reset button needs no script.
    await chart.locator(".uipack-span__now-row button").click();
    await expect(visibleRows(chart)).toHaveCount(featured);
    await expect(chart.locator(".uipack-span__now-row")).toBeHidden();

    const row = chart.locator('[data-item="openrouter"] details');
    await row.locator("summary").click();
    await expect(row.getByRole("link", { name: "Source" })).toHaveAttribute("href", "https://openrouter.ai/docs");
    // The search field needs the enhancement; without it, find-in-page reaches every row.
    await expect(chart.locator(".uipack-span__find")).toBeHidden();
    await expect(chart.locator(".uipack-span__nomatch")).toBeHidden();
  });

  test("stays usable with 160 rows at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/e2e-static/span-chart-160.html");
    const chart = page.locator("#stress");
    await chart.locator(".uipack-span__toggle--top").click();
    await expect(visibleRows(chart)).toHaveCount(160);
    await col(chart, "evals").click();
    await expect(visibleRows(chart)).toHaveCount(await chart.locator('.uipack-span__item[data-layers~="evals"]').count());
    await noPageOverflow(page, 390);
    expect(await smallestText(chart)).toBeGreaterThanOrEqual(11);
  });
});

test.describe("LayerStack", () => {
  test("at 896px: one-line linked bands in dashed zones, bracket rails over exactly their layers, no frame", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(at("896", "layer-stack"));
    const stack = page.locator("#ai-stack-layers");
    expect((await stack.boundingBox())!.width).toBe(896);
    // No outer frame: the figure sits on the page like the site's diagrams.
    expect(await stack.evaluate((el) => [getComputedStyle(el).borderTopWidth, getComputedStyle(el).backgroundColor])).toEqual(["0px", "rgba(0, 0, 0, 0)"]);
    const box = async (sel: string) => (await stack.locator(sel).first().boundingBox())!;
    const apps = await box("#ai-stack-layers-apps");
    const power = await box("#ai-stack-layers-power");
    expect(apps.y).toBeLessThan(power.y);
    // Every band is one link to its section, read top-down.
    const bands = stack.locator(".uipack-stack__band");
    await expect(stack.locator("a.uipack-stack__band")).toHaveCount(10);
    await expect(bands.first()).toHaveAttribute("href", "#apps");
    await expect(stack.locator("details, summary")).toHaveCount(0);
    // Index, title, constraint and "Go to section ↓" share one line, so every band is as tall.
    const heights = await bands.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    if (tunedFont) {
      expect(new Set(heights).size).toBe(1);
      for (const text of await stack.locator(".uipack-stack__text").all()) expect((await text.boundingBox())!.height).toBeLessThanOrEqual(22);
    } else expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(24);
    // "↓" alone at rest; its words show on hover, in space kept for them.
    // The arrow is CSS content, so it is not text a label-in-name check compares with the link's name.
    expect(await stack.locator(".uipack-stack__go").first().evaluate((el) => getComputedStyle(el, "::before").content)).toBe('"↓"');
    const words = stack.locator("#ai-stack-layers-apps .uipack-stack__go-text");
    expect(await words.evaluate((el) => getComputedStyle(el).opacity)).toBe("0");
    const before = await bands.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    await stack.locator("#ai-stack-layers-apps").hover();
    await expect.poll(() => words.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    expect(await bands.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))).toEqual(before);
    await page.mouse.move(0, 0);
    for (const text of await stack.locator(".uipack-stack__text").all()) {
      expect(await text.evaluate((el) => el.scrollWidth <= el.clientWidth + 1 && getComputedStyle(el).textOverflow !== "ellipsis")).toBe(true);
    }
    // Zones are dashed boxes around their own bands.
    const zones = await stack.locator(".uipack-stack__box").evaluateAll((els) =>
      els.map((e) => ({ style: getComputedStyle(e).borderTopStyle, r: e.getBoundingClientRect().toJSON() as DOMRect })),
    );
    expect(zones.map((z) => z.style)).toEqual(["dashed", "dashed", "dashed"]);
    const post = await box("#ai-stack-layers-post-training");
    expect(post.y).toBeGreaterThan(zones[1].r.top);
    expect(post.y + post.height).toBeLessThan(zones[1].r.bottom);
    // Rails: each line runs from its top band's top edge to its bottom band's bottom edge.
    const rails: [string, string, string][] = [
      ["gateways", "apps", "inference"],
      ["evals", "apps", "post-training"],
      ["safety", "apps", "power"],
    ];
    for (const [rail, top, bottom] of rails) {
      const r = await box(`a.uipack-stack__rail[href="#${rail}"]`);
      const t = await box(`#ai-stack-layers-${top}`);
      const b = await box(`#ai-stack-layers-${bottom}`);
      expect(Math.abs(r.y - t.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(r.y + r.height - (b.y + b.height))).toBeLessThanOrEqual(1);
      expect(r.x).toBeGreaterThan(zones[0].r.right);
    }
    // Rail labels read horizontally at the top of the line, uncut; nothing is rotated.
    for (const label of await stack.locator(".uipack-stack__rail-label").all()) {
      expect(await label.evaluate((el) => [getComputedStyle(el).writingMode, getComputedStyle(el).transform])).toEqual(["horizontal-tb", "none"]);
      // One line of words, the link's arrow under it.
      const [words, arrow] = await label.evaluate((el) => {
        const range = document.createRange();
        range.selectNodeContents(el.firstChild!);
        return [range.getBoundingClientRect().toJSON(), el.querySelector(".uipack-stack__arrow")!.getBoundingClientRect().toJSON()] as DOMRect[];
      });
      expect(words.height).toBeLessThanOrEqual(17);
      expect(arrow.top).toBeGreaterThanOrEqual(words.bottom - 1);
      expect(await label.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    }
    await expect(stack.locator('a.uipack-stack__rail[href="#gateways"]')).toHaveAccessibleName("Gateways and observability, layers 8–10");
    await expect(stack.locator('a.uipack-stack__rail[href="#gateways"] .uipack-stack__rail-label')).toHaveText("Gateways");
    await expect(stack.locator(".uipack-stack__across")).toBeHidden();
  });

  test("a band marks hover and focus like a chosen node and links to its section", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(at("896", "layer-stack", "dark"));
    const band = page.locator("#ai-stack-layers-inference");
    const look = () => band.evaluate((el) => [getComputedStyle(el).borderTopColor, getComputedStyle(el.querySelector("b")!).color]);
    const rest = await look();
    await band.hover();
    const hovered = await look();
    expect(hovered[0]).not.toBe(rest[0]);
    expect(hovered[1]).toBe(hovered[0]);
    await page.mouse.move(0, 0);
    await page.keyboard.press("Shift");
    await band.focus();
    expect(await band.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
    expect(await look()).toEqual(hovered);
    await expect(band).toHaveAccessibleName("Layer 08 Inference. Every request costs compute; price per token sets the margin. Go to section");
    await expect.poll(() => band.locator(".uipack-stack__go-text").evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    await band.click();
    await expect(page).toHaveURL(/#inference$/);
  });

  for (const width of [390, 320]) {
    test(`fits ${width}px: one-line bands with an arrow, rails as a list of nodes`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      await page.goto(at("full", "layer-stack"));
      const stack = page.locator("#ai-stack-layers");
      // Index, name and arrow on one 44px line; the constraint is still read out.
      for (const h of await stack.locator(".uipack-stack__band").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))) {
        expect(h).toBeGreaterThanOrEqual(44);
        expect(h).toBeLessThanOrEqual(46);
      }
      await expect(stack.locator(".uipack-stack__summary").first()).toHaveCSS("position", "absolute");
      await expect(stack.locator("#ai-stack-layers-apps")).toHaveAccessibleName(/Distribution and workflow fit matter more than the model/);
      await expect(stack.locator(".uipack-stack__go-text").first()).toBeHidden();
      await expect(stack.locator(".uipack-stack__go").first()).toBeVisible();
      expect(await stack.locator(".uipack-stack__go").first().evaluate((el) => getComputedStyle(el, "::before").content)).toBe('"↓"');
      // Zone notes on their own line, so no dot is stranded.
      const head = stack.locator(".uipack-stack__zone-head").first();
      const note = (await head.locator(".uipack-stack__note").boundingBox())!;
      expect(note.y).toBeGreaterThan((await head.locator("span").first().boundingBox())!.y);
      expect(await head.locator(".uipack-stack__note").evaluate((el) => getComputedStyle(el, "::before").content)).toBe("none");
      await expect(stack.locator("a.uipack-stack__rail").first()).toBeHidden();
      const nodes = stack.locator(".uipack-stack__across a.uipack-stack__node");
      await expect(nodes).toHaveCount(3);
      await expect(nodes.filter({ hasText: "Evals" })).toBeVisible();
      expect(await nodes.first().locator(".uipack-stack__arrow").evaluate((el) => getComputedStyle(el, "::before").content)).toBe('"↓"');
      for (const h of await nodes.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))) expect(h).toBeGreaterThanOrEqual(44);
      await noPageOverflow(page, width);
      expect(await smallestText(stack)).toBeGreaterThanOrEqual(11);
      await context.close();
    });
  }

  test.describe("static HTML with JavaScript off", () => {
    test.use({ javaScriptEnabled: false });
    test("bands and rails are plain links", async ({ page }) => {
      await page.goto("/e2e-static/layer-stack.html");
      await page.locator("#ai-stack-layers-pretraining").click();
      await expect(page).toHaveURL(/#pretraining$/);
      await page.locator('a.uipack-stack__rail[href="#evals"]').click();
      await expect(page).toHaveURL(/#evals$/);
      await expect(page.locator(".uipack-stack__across a")).toHaveCount(3);
    });
  });
});
