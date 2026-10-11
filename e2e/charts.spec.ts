import { expect, test, type Locator, type Page } from "@playwright/test";

// SpanChart and LayerStack: the playground (client-rendered, with the optional
// enhancement) in a frame at a host's real figure width, a host article whose
// prose CSS loads after charts.css, and static HTML with JavaScript off.

const visibleRows = (chart: Locator) => chart.locator(".uipack-span__item:visible");
const col = (chart: Locator, layer: string) => chart.locator(`.uipack-span__col[data-l="${layer}"]`);
const chip = (chart: Locator, attr: string) => chart.locator(`.uipack-span__panel .uipack-span__chip[${attr}]`);
const at = (frame: string, hash: string, theme = "light") => `/?theme=${theme}&frame=${frame}#${hash}`;

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

test.describe("SpanChart at a 56rem host (896px)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(at("896", "span-chart"));
  });

  test("shows the name column and short layer names, not codes", async ({ page }) => {
    const chart = page.locator("#ai-stack");
    expect((await chart.boundingBox())!.width).toBe(896);
    await expect(chart.locator(".uipack-span__corner")).toBeVisible();
    await expect(col(chart, "control").locator(".uipack-span__short")).toHaveText("Gateways");
    await expect(col(chart, "control").locator(".uipack-span__short")).toBeVisible();
    await expect(col(chart, "control").locator(".uipack-span__abbr")).toBeHidden();
    // Column labels do not overlap their neighbours.
    const boxes = await chart.locator(".uipack-span__col .uipack-span__short").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    for (let i = 1; i < boxes.length; i++) expect(boxes[i].left).toBeGreaterThanOrEqual(boxes[i - 1].right - 0.5);
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
    // The chip for the same layer shows it selected: a check mark, not only colour.
    expect(await chip(chart, 'data-l="inference"').evaluate((el) => getComputedStyle(el, "::before").width)).toBe("14px");
    expect(await col(chart, "inference").evaluate((el) => getComputedStyle(el, "::after").height)).toBe("3px");
    const now = chart.locator(".uipack-span__now-row");
    await expect(now).toBeVisible();
    await expect(now.locator('.uipack-span__now[data-l="inference"]')).toBeVisible();
    await expect(chart.locator("[data-span-status]")).toHaveText(`${expected} of 45 shown`);

    // Choosing from the chip row moves the header too.
    await chip(chart, 'data-l="data"').click();
    await expect(chart.locator("#ai-stack-layer-data")).toBeChecked();
    expect(await col(chart, "data").evaluate((el) => getComputedStyle(el, "::after").height)).toBe("3px");
    // Repeat activation clears; Escape clears.
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
    await amd.evaluate((el) => el.dispatchEvent(new Event("beforematch", { bubbles: true })));
    await expect(chart.locator(".uipack-span__expand")).toBeChecked();
    await expect(amd).not.toHaveAttribute("hidden");
    await expect(amd).toBeVisible();
  });

  test("a link to a filter input opens that view", async ({ page }) => {
    await page.goto(at("896", "ai-stack-layer-control"));
    const chart = page.locator("#ai-stack");
    await expect(chart.locator("#ai-stack-layer-control")).toBeChecked();
    await expect(visibleRows(chart)).toHaveCount(await chart.locator('.uipack-span__item[data-layers~="control"]').count());
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
        await drawer.locator("summary").tap();
        expect((await drawer.locator('.uipack-span__chip[data-l="power"]').boundingBox())!.height).toBeGreaterThanOrEqual(44);
        await drawer.locator('.uipack-span__chip[data-l="evals"]').tap();
        await expect(drawer.locator("summary")).toContainText("Evals");
        await expect(chart.locator(".uipack-span__now-row")).toBeVisible();
        await chart.locator('[data-item="hugging-face"] summary').tap();
        await noPageOverflow(page, width);
        expect(await smallestText(chart)).toBeGreaterThanOrEqual(11);
        // Codes never touch: at 320 they alternate lines.
        const codes = await chart.locator(".uipack-span__col .uipack-span__abbr").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
        for (let i = 1; i < codes.length; i++) {
          const a = codes[i - 1];
          const b = codes[i];
          const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          expect(overlapX > 0 && overlapY > 0).toBe(false);
          if (overlapY > 0) expect(b.left - a.right).toBeGreaterThanOrEqual(2);
        }
        await context.close();
      });
    }
  }
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
    expect(first).toBeLessThanOrEqual(215);
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
  test("at 896px: top layer first, equal bands, rails over exactly their layers", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(at("896", "layer-stack"));
    const stack = page.locator("#ai-stack-layers");
    const box = async (sel: string) => (await stack.locator(sel).first().boundingBox())!;
    const apps = await box("#ai-stack-layers-apps");
    const power = await box("#ai-stack-layers-power");
    const post = await box("#ai-stack-layers-post-training");
    expect(apps.y).toBeLessThan(power.y);
    const heights = await stack.locator(".uipack-stack__band").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    expect(new Set(heights).size).toBe(1);
    const evals = await box('a.uipack-stack__rail[href="#evals"]');
    expect(Math.abs(evals.y - apps.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(evals.y + evals.height - (post.y + post.height))).toBeLessThanOrEqual(1);
    expect(evals.x).toBeGreaterThan(apps.x + apps.width);
    // The rail's label sits at its top.
    const label = (await stack.locator('a.uipack-stack__rail[href="#evals"] > span').boundingBox())!;
    expect(label.y - evals.y).toBeLessThan(16);
    // Tab reaches Apps first.
    await stack.locator("summary").first().focus();
    await expect(stack.locator("summary").first()).toContainText("Apps");
  });

  test("bands open and close by click and keyboard; the zone edge survives hover", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(at("896", "layer-stack", "dark"));
    const band = page.locator("#ai-stack-layers-inference");
    const edge = () => band.evaluate((el) => getComputedStyle(el).borderLeftColor);
    const before = await edge();
    await band.locator("summary").hover();
    expect(await edge()).toBe(before);
    await band.locator("summary").click();
    await expect(band).toHaveAttribute("open", "");
    await expect(band.getByRole("link", { name: /Read the section/ })).toHaveAttribute("href", "#inference");
    await band.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(band).not.toHaveAttribute("open", "");
    const list = page.locator("#ai-stack-layers .uipack-stack__across");
    await expect(list.getByRole("link", { name: "Safety" })).toHaveAttribute("href", "#safety");
    await expect(list).toContainText("Security and safety work");
  });

  for (const width of [390, 320]) {
    test(`fits ${width}px: rails as a list, metric under the summary`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(at("full", "layer-stack"));
      const stack = page.locator("#ai-stack-layers");
      await stack.locator("#ai-stack-layers-data summary").click();
      await noPageOverflow(page, width);
      expect(await smallestText(stack)).toBeGreaterThanOrEqual(11);
      await expect(stack.locator("a.uipack-stack__rail").first()).toBeHidden();
      await expect(stack.locator(".uipack-stack__across").getByRole("link", { name: "Evals" })).toBeVisible();
      const summary = (await stack.locator("#ai-stack-layers-chips .uipack-stack__summary").boundingBox())!;
      const metric = (await stack.locator("#ai-stack-layers-chips .uipack-stack__metric").boundingBox())!;
      expect(metric.y).toBeGreaterThanOrEqual(summary.y + summary.height - 1);
    });
  }

  test.describe("static HTML with JavaScript off", () => {
    test.use({ javaScriptEnabled: false });
    test("bands open and links work", async ({ page }) => {
      await page.goto("/e2e-static/layer-stack.html");
      const band = page.locator("#ai-stack-layers-pretraining");
      await band.locator("summary").click();
      await expect(band.getByRole("link", { name: /Read the section/ })).toBeVisible();
      await expect(page.locator(".uipack-stack__across a")).toHaveCount(3);
    });
  });
});
