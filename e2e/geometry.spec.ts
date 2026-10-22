import { expect, test } from "./fixtures";

// Arrowheads must end short of node borders, packets short of arrowheads,
// and bus junctions on the 8px grid. Checked in user units on every figure of
// the diagrams page, so it holds for whatever the site draws with them.
test.describe("geometry", () => {
  test("no arrowhead tip or path end lies inside a node on any wide drawing", async ({ page }) => {
    await page.goto("/");
    await page.locator("figure.uipack").first().waitFor();
    const report = await page.evaluate(() => {
      const bad: string[] = [];
      let checked = 0;
      for (const svg of document.querySelectorAll<SVGSVGElement>("svg.uipack--wide")) {
        const rects = [...svg.querySelectorAll<SVGRectElement>('[data-uipack="node"] > rect')].map((r) => ({
          x: r.x.baseVal.value,
          y: r.y.baseVal.value,
          w: r.width.baseVal.value,
          h: r.height.baseVal.value,
        }));
        for (const p of svg.querySelectorAll<SVGPathElement>('[data-uipack="connector"][marker-end]')) {
          checked++;
          const len = p.getTotalLength();
          const end = p.getPointAtLength(len);
          const back = p.getPointAtLength(Math.max(0, len - 1));
          const dx = end.x - back.x;
          const dy = end.y - back.y;
          const n = Math.hypot(dx, dy) || 1;
          const tip = { x: end.x + (dx / n) * 1, y: end.y + (dy / n) * 1 }; // marker refX 7 of 8: tip is 1 past the end
          for (const r of rects) {
            const inside = (q: { x: number; y: number }) => q.x > r.x + 0.5 && q.x < r.x + r.w - 0.5 && q.y > r.y + 0.5 && q.y < r.y + r.h - 0.5;
            if (inside(end) || inside(tip)) bad.push(`${svg.getAttribute("aria-label")?.slice(0, 30)}: ${p.id || p.getAttribute("d")?.slice(0, 24)} ends inside a node`);
          }
        }
      }
      return { bad, checked };
    });
    expect(report.checked).toBeGreaterThan(20);
    expect(report.bad).toEqual([]);
  });

  test("packets never reach the arrowhead", async ({ page }) => {
    await page.goto("/");
    await page.locator("figure.uipack").first().waitFor();
    const bad = await page.evaluate(() => {
      const out: string[] = [];
      for (const svg of document.querySelectorAll<SVGSVGElement>("svg.uipack--wide")) {
        const ends = [...svg.querySelectorAll<SVGPathElement>('[data-uipack="connector"][marker-end]')].map((p) => p.getPointAtLength(p.getTotalLength()));
        for (const am of svg.querySelectorAll("animateMotion")) {
          const d = am.getAttribute("path") ?? "";
          const nums = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
          const last = { x: nums[nums.length - 2], y: nums[nums.length - 1] };
          for (const e of ends) if (Math.hypot(e.x - last.x, e.y - last.y) < 8) out.push(`${d.slice(0, 30)} ends ${Math.hypot(e.x - last.x, e.y - last.y).toFixed(1)} from a head`);
        }
      }
      return out;
    });
    expect(bad).toEqual([]);
  });

  test("bus junctions sit on the 8px grid", async ({ page }) => {
    await page.goto("/");
    await page.locator("figure.uipack").first().waitFor();
    const off = await page.evaluate(() =>
      [...document.querySelectorAll<SVGCircleElement>('svg.uipack--wide [data-uipack="junction"]')]
        .map((c) => [c.cx.baseVal.value, c.cy.baseVal.value])
        .filter(([x, y]) => x % 8 !== 0 || y % 8 !== 0),
    );
    expect(off).toEqual([]);
    expect(await page.locator('svg.uipack--wide [data-uipack="junction"]').count()).toBeGreaterThan(10);
  });

  test("lane headers sit on the 8px grid on every figure", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-section] figure.uipack").first().waitFor();
    const off = await page.evaluate(() =>
      [...document.querySelectorAll<SVGTextElement>('[data-section] svg.uipack--wide [data-uipack="lane"] > text')]
        .map((t) => `${t.closest("[data-section]")?.getAttribute("data-section")} ${t.getAttribute("y")}`)
        .filter((s) => Number(s.split(" ")[1]) % 8 !== 0),
    );
    expect(off).toEqual([]);
    expect(await page.locator('[data-section] svg.uipack--wide [data-uipack="lane"] > text').count()).toBeGreaterThan(10);
  });

  test("no figure text renders under 11px at 1440", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto("/");
    await page.locator("[data-section] figure.uipack").first().waitFor();
    // The floor applies once each figure's ResizeObserver has measured it: poll for that state.
    const smallText = () => page.evaluate(() => {
      const out: string[] = [];
      for (const svg of document.querySelectorAll<SVGSVGElement>("[data-section] svg.uipack--wide")) {
        if (!svg.getClientRects().length) continue; // a drill level that is not showing
        const k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
        for (const t of svg.querySelectorAll("text")) {
          const px = parseFloat(getComputedStyle(t).fontSize) * k;
          if (px < 11 - 0.05) out.push(`${svg.closest("[data-section]")?.getAttribute("data-section")}: "${t.textContent}" ${px.toFixed(1)}px`);
        }
      }
      return out;
    });
    await expect.poll(smallText).toEqual([]);
  });

  for (const width of [1440, 390]) {
    test(`node text stays inside its box on every drawing at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1100 });
      await page.goto("/");
      await page.locator("[data-section] figure.uipack").first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const over = await page.evaluate(() => {
        const out: string[] = [];
        for (const node of document.querySelectorAll<SVGGElement>('[data-section] svg [data-uipack="node"]')) {
          if (!node.getClientRects().length) continue; // the other drawing, or a drill level not showing
          const box = node.querySelector<SVGRectElement>(":scope > rect")!.getBBox();
          for (const t of node.querySelectorAll<SVGTextElement>(":scope > text")) {
            const b = t.getBBox();
            if (!b.width) continue;
            // 1 unit of slack: a glyph's side bearing may touch the stroke without crossing it.
            if (b.x < box.x - 1 || b.x + b.width > box.x + box.width + 1)
              out.push(`${node.closest("[data-section]")?.getAttribute("data-section")}: "${t.textContent}" ${b.x.toFixed(0)}..${(b.x + b.width).toFixed(0)} in ${box.x}..${box.x + box.width}`);
          }
        }
        return out;
      });
      expect(over).toEqual([]);
    });
  }

  test("a figure with nothing moving offers no Pause or Replay", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-section] figure.uipack").first().waitFor();
    const wrong = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("[data-section] figure.uipack")]
        .filter((f) => !f.querySelector("animateMotion, animate, animateTransform") && f.querySelector(".uipack__ctl--motion"))
        .map((f) => f.closest("[data-section]")?.getAttribute("data-section")),
    );
    expect(wrong).toEqual([]);
  });
});

