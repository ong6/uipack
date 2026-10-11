import { expect, test, type Locator, type Page } from "@playwright/test";

// SpanChart and LayerStack: the playground (client-rendered, with the optional
// enhancement) and static HTML from renderToStaticMarkup with JavaScript off.

const visibleRows = (chart: Locator) => chart.locator(".uipack-span__item:visible");
const header = (chart: Locator, layer: string) => chart.locator(`.uipack-span__col:has(input[value="${layer}"])`);
const chip = (chart: Locator, tier: string) => chart.locator(`.uipack-span__chip:has(input[value="${tier}"])`);

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
      min = Math.min(min, parseFloat(style.fontSize));
    }
    return min;
  });
}

test.describe("SpanChart in the playground", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/?theme=light#span-chart");
  });

  test("expands and collapses in place, by click and by keyboard", async ({ page }) => {
    const chart = page.locator("#ai-stack");
    const featured = await chart.locator(".uipack-span__item[data-featured]").count();
    const total = await chart.locator(".uipack-span__item").count();
    await expect(visibleRows(chart)).toHaveCount(featured);
    const toggle = chart.locator(".uipack-span__toggle");
    await expect(toggle).toHaveText(`Show all ${total} companies`, { useInnerText: true });
    const chips = chart.locator('.uipack-span__group:has(.uipack-span__group-name:text-is("Chips and memory"))');
    const featuredChips = await chips.locator(".uipack-span__item[data-featured]").count();
    await expect(chips.locator(".uipack-span__item:visible")).toHaveCount(featuredChips);

    await toggle.click();
    await expect(visibleRows(chart)).toHaveCount(total);
    await expect(toggle).toHaveText(`Show the ${featured} featured`, { useInnerText: true });
    // The extra rows appear in place, inside their own groups.
    await expect(chips.locator(".uipack-span__item:visible")).toHaveCount(await chips.locator(".uipack-span__item").count());
    for (const row of await chips.locator(".uipack-span__item").evaluateAll((rows) => rows.map((r) => r.getAttribute("data-item")))) {
      expect(["nvidia", "tsmc", "amd", "cerebras", "groq", "sk-hynix"]).toContain(row);
    }

    const box = chart.locator(".uipack-span__expand");
    await box.focus();
    await page.keyboard.press("Space");
    await expect(visibleRows(chart)).toHaveCount(featured);
    // The visually hidden checkbox shows its keyboard focus on the label.
    await expect(box).toBeFocused();
    expect(await toggle.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
  });

  test("a column header filters to every row in that layer and hides empty groups", async ({ page }) => {
    const chart = page.locator("#ai-stack");
    await header(chart, "inference").click();
    const expected = await chart.locator('.uipack-span__item[data-layers~="inference"]').count();
    await expect(visibleRows(chart)).toHaveCount(expected);
    for (const layers of await visibleRows(chart).evaluateAll((rows) => rows.map((r) => r.getAttribute("data-layers")!))) {
      expect(layers.split(" ")).toContain("inference");
    }
    await expect(chart.locator('.uipack-span__group:has(.uipack-span__group-name:text-is("Power and sites"))')).toBeHidden();
    for (const group of await chart.locator(".uipack-span__group:visible").all()) {
      expect(await group.locator(".uipack-span__item:visible").count()).toBeGreaterThan(0);
    }
    // Selected column: checked radio, bold label, and a marker bar, not colour alone.
    await expect(chart.locator('input[value="inference"]')).toBeChecked();
    const marker = await header(chart, "inference").evaluate((el) => getComputedStyle(el, "::after").height);
    expect(marker).toBe("3px");
    await expect(chart.locator(".uipack-span__corner-reset")).toBeVisible();
    await expect(chart.locator('.uipack-span__status [data-span-key="inference|*"]')).toHaveText(`${expected} of 45 in Inference`);
    await expect(chart.locator(".uipack-span__toggle")).toBeHidden();

    // The enhancement: the same header again clears; Escape clears.
    await header(chart, "inference").click();
    await expect(chart.locator("#ai-stack-layer-all")).toBeChecked();
    await header(chart, "evals").click();
    await expect(chart.locator('input[value="evals"]')).toBeChecked();
    await page.keyboard.press("Escape");
    await expect(chart.locator("#ai-stack-layer-all")).toBeChecked();
    // The corner header also resets.
    await header(chart, "data").click();
    await chart.locator(".uipack-span__corner").click();
    await expect(chart.locator("#ai-stack-layer-all")).toBeChecked();
  });

  test("the size filter combines with the layer filter", async ({ page }) => {
    const chart = page.locator("#ai-stack");
    await chip(chart, "small").click();
    await expect(chart.locator('input[value="small"]')).toBeChecked();
    const small = await chart.locator('.uipack-span__item[data-tier="small"]').count();
    await expect(visibleRows(chart)).toHaveCount(small);
    await header(chart, "inference").click();
    const both = await chart.locator('.uipack-span__item[data-tier="small"][data-layers~="inference"]').count();
    expect(both).toBeGreaterThan(0);
    await expect(visibleRows(chart)).toHaveCount(both);
    for (const group of await chart.locator(".uipack-span__group:visible").all()) {
      expect(await group.locator(".uipack-span__item:visible").count()).toBeGreaterThan(0);
    }
    // Repeat activation clears the size filter only.
    await chip(chart, "small").click();
    await expect(chart.locator("#ai-stack-tier-all")).toBeChecked();
    await expect(chart.locator('input[value="inference"]')).toBeChecked();
    // A selected chip carries a check mark, not only a colour.
    await chip(chart, "large").click();
    expect(await chip(chart, "large").evaluate((el) => getComputedStyle(el, "::before").content)).toContain("✓");
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

  for (const theme of ["light", "dark"] as const) {
    test(`fits 390px with readable labels, ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/?theme=${theme}#span-chart`);
      const chart = page.locator("#ai-stack");
      await chart.locator(".uipack-span__toggle").click();
      await chart.locator('[data-item="hugging-face"] summary').click();
      await noPageOverflow(page, 390);
      expect(await smallestText(chart)).toBeGreaterThanOrEqual(11);
      const box = (await chart.boundingBox())!;
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      // Narrow rows stack the name above a full-width bar track.
      const name = (await chart.locator('[data-item="nvidia"] .uipack-span__name').boundingBox())!;
      const track = (await chart.locator('[data-item="nvidia"] .uipack-span__track').boundingBox())!;
      expect(track.y).toBeGreaterThan(name.y + name.height - 1);
      await expect(chart.locator(".uipack-span__abbr").first()).toBeVisible();
      await expect(chart.locator(".uipack-span__key")).toBeVisible();
    });
  }
});

test.describe("SpanChart as static HTML with JavaScript off", () => {
  test.use({ javaScriptEnabled: false });

  test("expands, filters by layer and size, and opens rows", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/e2e-static/span-chart.html");
    const chart = page.locator("#ai-stack");
    const featured = await chart.locator(".uipack-span__item[data-featured]").count();
    await expect(visibleRows(chart)).toHaveCount(featured);
    await chart.locator(".uipack-span__toggle").click();
    await expect(visibleRows(chart)).toHaveCount(45);
    await chart.locator(".uipack-span__toggle").click();
    await expect(visibleRows(chart)).toHaveCount(featured);

    await header(chart, "chips").click();
    const inChips = await chart.locator('.uipack-span__item[data-layers~="chips"]').count();
    await expect(visibleRows(chart)).toHaveCount(inChips);
    await chip(chart, "large").click();
    await expect(visibleRows(chart)).toHaveCount(await chart.locator('.uipack-span__item[data-tier="large"][data-layers~="chips"]').count());
    await chart.locator(".uipack-span__corner").click();
    await chart.locator(".uipack-span__chip").first().click();
    await expect(visibleRows(chart)).toHaveCount(featured);

    const row = chart.locator('[data-item="openrouter"] details');
    await row.locator("summary").click();
    await expect(row.getByRole("link", { name: "Source" })).toHaveAttribute("href", "https://openrouter.ai/docs");
  });

  test("stays usable with 160 rows at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/e2e-static/span-chart-160.html");
    const chart = page.locator("#stress");
    await chart.locator(".uipack-span__toggle").click();
    await expect(visibleRows(chart)).toHaveCount(160);
    await header(chart, "evals").click();
    await expect(visibleRows(chart)).toHaveCount(await chart.locator('.uipack-span__item[data-layers~="evals"]').count());
    await noPageOverflow(page, 390);
    expect(await smallestText(chart)).toBeGreaterThanOrEqual(11);
  });
});

test.describe("LayerStack", () => {
  test("draws the first layer at the bottom and rails over exactly their layers", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/?theme=light#layer-stack");
    const stack = page.locator("#ai-stack-layers");
    const box = async (sel: string) => (await stack.locator(sel).first().boundingBox())!;
    const apps = await box("#ai-stack-layers-apps");
    const power = await box("#ai-stack-layers-power");
    const post = await box("#ai-stack-layers-post-training");
    expect(apps.y).toBeLessThan(power.y);
    const evals = await box('a.uipack-stack__rail[href="#evals"]');
    expect(Math.abs(evals.y - apps.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(evals.y + evals.height - (post.y + post.height))).toBeLessThanOrEqual(1);
    expect(evals.x).toBeGreaterThan(apps.x + apps.width);
    const bracket = await box(".uipack-stack__bracket");
    expect(bracket.x + bracket.width).toBeLessThanOrEqual(power.x + 1);
  });

  test("bands open and close by click and keyboard, with links kept as links", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/?theme=dark#layer-stack");
    const band = page.locator("#ai-stack-layers-inference");
    await band.locator("summary").click();
    await expect(band).toHaveAttribute("open", "");
    await expect(band.getByRole("link", { name: /Read the section/ })).toHaveAttribute("href", "#inference");
    await band.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(band).not.toHaveAttribute("open", "");
    const rail = page.locator('a.uipack-stack__rail[href="#safety"]');
    await rail.focus();
    await expect(rail.locator(".uipack-stack__rail-tip")).toBeVisible();
    expect(await rail.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
  });

  for (const theme of ["light", "dark"] as const) {
    test(`fits 390px with chips for rails, ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/?theme=${theme}#layer-stack`);
      const stack = page.locator("#ai-stack-layers");
      await stack.locator("#ai-stack-layers-data summary").click();
      await noPageOverflow(page, 390);
      expect(await smallestText(stack)).toBeGreaterThanOrEqual(11);
      const rail = (await stack.locator('a.uipack-stack__rail[href="#evals"]').boundingBox())!;
      expect(rail.height).toBeLessThanOrEqual(40);
      await expect(stack.locator('a.uipack-stack__rail[href="#evals"]')).toContainText("layers 7–10");
      const power = (await stack.locator("#ai-stack-layers-power").boundingBox())!;
      expect(rail.y).toBeGreaterThan(power.y + power.height);
      // The metric moves under the summary.
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
      await expect(page.locator("a.uipack-stack__rail")).toHaveCount(3);
    });
  });
});
