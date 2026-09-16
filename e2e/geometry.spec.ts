import { expect, test } from "@playwright/test";

// Arrowheads must end short of node borders, packets short of arrowheads,
// and bus junctions on the 8px grid. Checked in user units on the Habitat
// figure and every preset, so it holds for whatever the site draws with them.
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
});
