import { expect, test, type Page } from "./fixtures";

const deck = (page: Page) => page.getByRole("region", { name: "Deck player example" });
const settled = async (page: Page) => {
  await expect(deck(page)).not.toHaveAttribute("data-transitioning", "");
  await expect(page.locator(".uipack-deck-layer")).toHaveCount(1);
};
const ids = ["summary", "situation", "sites", "options", "recommendation", "plan", "ask", "appendix"];

/** Layout checks on the slide on screen, in canvas pixels (layout sizes ignore the stage scale). */
const inspect = (page: Page) =>
  page.evaluate(() => {
    const layer = document.querySelector<HTMLElement>(".uipack-deck-layer:not([aria-hidden])")!;
    const slide = layer.querySelector<HTMLElement>(".uipack-cx-slide")!;
    const title = slide.querySelector<HTMLElement>(".uipack-cx-title")!;
    const lineHeight = parseFloat(getComputedStyle(title).lineHeight);
    const small: string[] = [];
    for (const el of Array.from(slide.querySelectorAll<HTMLElement | SVGElement>("*"))) {
      const ownText = Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
      // SVG <title> is a tooltip, not drawn text.
      if (!ownText || el.tagName.toLowerCase() === "title") continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < 20) small.push(`${el.tagName} ${size}px "${el.textContent!.trim().slice(0, 30)}"`);
    }
    const overflowing = Array.from(slide.querySelectorAll<HTMLElement>(".uipack-cx-panel__inner, .uipack-cx-sowhat"))
      .filter((p) => p.scrollHeight > p.clientHeight + 1 || p.scrollWidth > p.clientWidth + 1)
      .map((p) => p.textContent!.trim().slice(0, 40));
    return {
      id: layer.dataset.slide,
      titleLines: Math.round(title.offsetHeight / lineHeight),
      small,
      overflowing,
      slideOverflow: slide.scrollHeight > slide.clientHeight + 1,
      sticker: slide.querySelector(".uipack-cx-sticker")?.textContent,
    };
  });

for (const theme of ["light", "dark"] as const) {
  test(`consulting deck (${theme}): every slide fits, reads at 20px+, and steps through with no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && !m.text().includes("favicon") && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/deck?deck=consulting&view=present&theme=${theme}`);
    await deck(page).focus();
    for (const [i, id] of ids.entries()) {
      if (i > 0) {
        await page.keyboard.press("ArrowRight");
        await expect(deck(page)).toHaveAttribute("data-index", String(i));
      }
      await settled(page);
      if (i > 0) await expect(page).toHaveURL(new RegExp(`slide=${id}`));
      const r = await inspect(page);
      expect(r.id).toBe(id);
      expect(r.sticker).toBe("Illustrative");
      expect(r.titleLines, `${id} title lines`).toBeLessThanOrEqual(2);
      expect(r.small, `${id} text under 20px`).toEqual([]);
      expect(r.overflowing, `${id} panels overflowing`).toEqual([]);
      expect(r.slideOverflow, `${id} slide overflow`).toBe(false);
    }
    // Charts finish growing: every mark ends at full size.
    await expect
      .poll(() =>
        page.evaluate(() =>
          Array.from(document.querySelectorAll<SVGElement>(".uipack-deck-layer .uipack-cx-grow")).every(
            (el) => getComputedStyle(el).transform === "none" || getComputedStyle(el).transform === "matrix(1, 0, 0, 1, 0, 0)",
          ),
        ),
      )
      .toBe(true);
    expect(errors).toEqual([]);
  });
}

test("the KPI value morphs into the next slide's title", async ({ page }) => {
  await page.goto("/deck?deck=consulting&view=present");
  await deck(page).focus();
  await page.keyboard.press("ArrowRight");
  const mid = await page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    document.getAnimations().forEach((a) => {
      a.pause();
      a.currentTime = 380;
    });
    const layers = Array.from(document.querySelectorAll<HTMLElement>(".uipack-deck-layer"));
    const value = layers.find((l) => l.dataset.slide === "situation")!.querySelector<HTMLElement>('.uipack-cx-title [data-morph="cost-per-order"]')!;
    const tile = layers.find((l) => l.dataset.slide === "summary")!.querySelector<HTMLElement>('.uipack-cx-kpi [data-morph="cost-per-order"]')!;
    return { layers: layers.length, value: value.textContent, tile: tile.textContent, moving: getComputedStyle(value).transform !== "none" };
  });
  expect(mid).toEqual({ layers: 2, value: "$8.40", tile: "$8.40", moving: true });
  await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()));
  await settled(page);
  await expect(page.locator(".uipack-cx-title [data-morph='cost-per-order']")).toBeVisible();
});

test("zooming from the dense slide into one panel opens the detail slide inside it, settles and reverses", async ({ page }) => {
  await page.goto("/deck?deck=consulting&slide=situation&view=present");
  await deck(page).focus();
  await settled(page);
  await page.keyboard.press("ArrowRight");
  const mid = await page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    document.getAnimations().forEach((a) => {
      a.pause();
      a.currentTime = 200;
    });
    const layers = Array.from(document.querySelectorAll<HTMLElement>(".uipack-deck-layer"));
    const inner = layers.find((l) => l.dataset.slide === "sites")!;
    const target = layers.find((l) => l.dataset.slide === "situation")!.querySelector('[data-morph="site-costs"]')!;
    const a = inner.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    return { layers: layers.length, innerW: a.width, targetW: t.width, clip: getComputedStyle(inner).clipPath };
  });
  expect(mid.layers).toBe(2);
  expect(mid.innerW).toBeLessThan(mid.targetW * 2);
  expect(mid.clip).toContain("inset");
  // Let it run to the end on its own clock.
  await page.evaluate(() => document.getAnimations().forEach((a) => a.play()));
  await settled(page);
  await expect(page).toHaveURL(/slide=sites/);
  await expect(page.locator(".uipack-deck-layer")).toHaveAttribute("data-slide", "sites");
  await expect(page.locator(".uipack-deck-layer").first()).toHaveCSS("clip-path", "none");
  await page.keyboard.press("ArrowLeft");
  await expect(deck(page)).toHaveAttribute("data-index", "1");
  await settled(page);
  await expect(page.locator('[data-morph="site-costs"]')).toBeVisible();
});

test("reduced motion and thumbnails show charts fully drawn, with no growth", async ({ page }) => {
  await page.goto("/deck?deck=consulting&view=present&motion=none&slide=situation");
  await settled(page);
  const transforms = await page.evaluate(() =>
    Array.from(document.querySelectorAll<SVGElement>(".uipack-deck-stage .uipack-cx-grow"), (el) => getComputedStyle(el).transform),
  );
  expect(transforms.length).toBeGreaterThan(5);
  expect(transforms.every((t) => t === "none")).toBe(true);
  await deck(page).focus();
  await page.keyboard.press("g");
  const dialog = page.getByRole("dialog", { name: "All slides" });
  await expect(dialog).toBeVisible();
  const thumbs = await dialog.evaluate((d) =>
    Array.from(d.querySelectorAll<SVGElement>(".uipack-cx-chart"), (c) => c.hasAttribute("data-grown")),
  );
  expect(thumbs.length).toBeGreaterThan(5);
  expect(thumbs.every(Boolean)).toBe(true);
});
