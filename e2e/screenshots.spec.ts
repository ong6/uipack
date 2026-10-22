import { test } from "./fixtures";

// Not a test: writes the README and docs screenshots. Run with `npm run screenshots`.
// The presets the diagrams page shows; the other presets keep their committed shots.
const PRESETS = ["pipeline", "beforeAfter", "syncLoop", "agentLoop"];

for (const theme of ["light", "dark"] as const) {
  for (const [w, h] of [[1440, 1100], [390, 1400]] as const) {
    test(`shot ${theme} ${w}`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`/?theme=${theme}`);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `docs/playground-${w}-${theme}.png`, fullPage: true });
      await page.goto(`/assets?theme=${theme}`);
      await page.waitForTimeout(800);
      await page.screenshot({ path: `docs/assets-${w}-${theme}.png`, fullPage: false });
      await page.goto(`/web?theme=${theme}`);
      await page.locator(".uipack-web-demo").scrollIntoViewIfNeeded();
      // Let the demo reach its result so the shot shows the product working.
      await page.waitForTimeout(11000);
      // Desktop shows the hero and the settled demo; 390px shows the demo itself.
      if (w === 1440) await page.evaluate(() => window.scrollTo(0, 200));
      await page.waitForTimeout(300);
      await page.screenshot({ path: `docs/web-${w}-${theme}.png`, fullPage: false });
    });
  }
  for (const w of [1440, 390] as const) {
    test(`shot web sections ${theme} ${w}`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width: w, height: w === 1440 ? 1000 : 844 });
      await page.goto(`/web?theme=${theme}`);
      for (const name of ["motion", "backgrounds"]) {
        const section = page.locator(`section[data-section="${name}"]`);
        // Walk through the section so reveals and tickers have played before the capture.
        const box = (await section.boundingBox())!;
        for (let y = box.y - 200; y < box.y + box.height; y += 400) {
          await page.evaluate((top) => window.scrollTo(0, top), y);
          await page.waitForTimeout(250);
        }
        await page.waitForTimeout(1600);
        await section.screenshot({ path: `docs/web-${name}-${w}-${theme}.png` });
      }
    });
  }
  test(`shot presets ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto(`/?theme=${theme}`);
    await page.waitForTimeout(600);
    await page.locator('section[data-section="service-map"] figure').screenshot({ path: `docs/habitat-${theme}.png` });
    await page.locator('section[data-section="parts"] figure').screenshot({ path: `docs/parts-${theme}.png` });
    for (const name of PRESETS) {
      await page.locator(`[data-preset="${name}"] figure`).screenshot({ path: `docs/presets/${name}-${theme}.png` });
    }
  });
}

// SpanChart and LayerStack, each state in both themes, at the notes site's
// figure width (896px, in the playground's host frame) and at 390. The
// chart's header is sticky, so shots are clipped from a full-page capture
// taken at the top rather than scrolled element shots.
async function shootElement(page: import("@playwright/test").Page, selector: string, path: string) {
  await page.waitForTimeout(250); // let a chevron finish turning
  const clip = await page.locator(selector).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height };
  });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path, fullPage: true, clip });
}

for (const theme of ["light", "dark"] as const) {
  for (const [w, viewport, frame] of [[896, 1440, "896"], [390, 390, "full"]] as const) {
    test(`shot charts ${theme} ${w}`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width: viewport, height: 1000 });
      await page.goto(`/charts?theme=${theme}&frame=${frame}#span-chart`);
      const chart = "#ai-stack";
      await page.locator(chart).waitFor();
      // Walk the page once so lazy logos load before the full-page captures.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 40));
        }
      });
      await shootElement(page, chart, `docs/span-chart-${w}-${theme}.png`);
      await page.locator(`${chart} .uipack-span__toggle--foot`).click();
      await shootElement(page, chart, `docs/span-chart-expanded-${w}-${theme}.png`);
      await page.locator(`${chart} .uipack-span__toggle--foot`).click();
      await page.locator(`${chart} .uipack-span__col[data-l="inference"]`).click();
      await shootElement(page, chart, `docs/span-chart-filtered-${w}-${theme}.png`);
      await page.keyboard.press("Escape");
      await page.locator(`${chart} [data-item="fireworks"] summary`).click();
      await shootElement(page, chart, `docs/span-chart-open-${w}-${theme}.png`);

      await page.locator(`${chart} [data-item="fireworks"] summary`).click();
      await page.locator(`${chart} input[type="search"]`).fill("nvidia");
      await shootElement(page, chart, `docs/span-chart-search-${w}-${theme}.png`);

      await shootElement(page, "#ai-stack-layers", `docs/layer-stack-${w}-${theme}.png`);
    });
  }
}

// uipack/article in the playground's host article with the notes site's
// palette: the Inference section (strip to cluster) at the 40rem column and at
// 390, and the wide cluster at the 56rem slot.
for (const theme of ["light", "dark"] as const) {
  test(`shot article ${theme}`, async ({ page }) => {
    const clipBetween = async (from: string, to: string, path: string) => {
      const clip = await page.evaluate(([f, t]) => {
        const a = document.querySelector(f)!.getBoundingClientRect();
        const b = document.querySelector(t)!.getBoundingClientRect();
        const left = Math.min(a.left, b.left) - 24;
        const right = Math.max(a.right, b.right) + 24;
        return { x: Math.max(0, left + scrollX), y: a.top + scrollY - 24, width: Math.min(innerWidth, right) - Math.max(0, left), height: b.bottom - a.top + 48 };
      }, [from, to]);
      await page.screenshot({ path, fullPage: true, clip });
    };
    const first = "#layer-section .uipack-layerhead";
    const cluster = "#layer-section .uipack-cluster";
    const wide = "#layer-section .uipack-cluster--wide";
    for (const [w, name] of [[1440, "640"], [390, "390"]] as const) {
      await page.setViewportSize({ width: w, height: 1000 });
      await page.goto(`/article?theme=${theme}&host=notes`);
      await page.locator(cluster).first().waitFor();
      await clipBetween(first, cluster, `docs/article-section-${name}-${theme}.png`);
      if (w === 1440) await clipBetween(wide, wide, `docs/article-cluster-896-${theme}.png`);
    }
  });
}
