import { expect, test } from "./fixtures";

test.use({ entrance: true });

test.describe("figure entrance", () => {
  test(
    "a figure below the fold is drawn before it is seen, washes in when scrolled to, then settles",
    { tag: "@cross-browser" },
    async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/components/diagrams");
      const first = page.locator("figure.uipack").first().locator(".uipack__canvas");
      const late = page.locator("figure.uipack", { hasText: "Annotated curve" }).locator(".uipack__canvas");
      await late.waitFor({ state: "attached" });
      // Nothing waits hidden: on screen or not, every part is fully drawn from the first paint.
      await expect(first).not.toHaveAttribute("data-enter", /.*/);
      await expect(late).not.toHaveAttribute("data-enter", /.*/);
      const shown = () =>
        late.locator(":scope > svg.uipack--wide > *").evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
      expect((await shown()).every((o) => o === "1")).toBe(true);
      await late.scrollIntoViewIfNeeded();
      await expect(late).toHaveAttribute("data-enter", "in");
      // Settled: the attribute and the numbering are gone, every part fully shown.
      await expect(late).not.toHaveAttribute("data-enter", /.*/, { timeout: 4000 });
      expect((await shown()).every((o) => o === "1")).toBe(true);
    },
  );

  for (const path of ["/components/diagrams", "/web", "/foundations/layout"]) {
    test(`jumping straight to the bottom of ${path} leaves every figure drawn`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path, { waitUntil: "load" });
      await page.locator("figure.uipack").first().waitFor({ state: "attached" });
      // One jump, no scroll in between: an observer-driven reveal never gets its moment.
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      // Long enough for an entrance that did start to settle (about 0.8s).
      await page.waitForTimeout(1000);
      const figures = await page.locator("figure.uipack .uipack__canvas").evaluateAll((canvases) =>
        canvases.map((c) => {
          // The drawing: the largest SVG in the canvas (a drill-down nests it in a stage).
          const svg = [...c.querySelectorAll<SVGSVGElement>("svg")].sort(
            (a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height,
          )[0];
          const nodes = svg
            ? [
                ...svg.querySelectorAll(
                  ":scope > :not(defs) :is(rect, text, path, circle, line, polyline), :scope > :is(rect, text, path, circle, line, polyline)",
                ),
              ]
            : [];
          const visible = nodes.filter((n) => {
            let el: Element | null = n;
            while (el && el !== c) {
              if (Number(getComputedStyle(el).opacity) < 0.99) return false;
              el = el.parentElement;
            }
            return true;
          });
          return { nodes: nodes.length, visible: visible.length };
        }),
      );
      expect(figures.length).toBeGreaterThan(0);
      for (const f of figures) {
        expect(f.nodes).toBeGreaterThan(0);
        expect(f.visible).toBeGreaterThan(0);
      }
    });
  }

  test("a demo player rests on its result until it is about to be seen", async ({ page }) => {
    // A short window keeps the demo (it sits under the hero) outside the 25% look-ahead band.
    await page.setViewportSize({ width: 1440, height: 600 });
    await page.goto("/web", { waitUntil: "load" });
    const demo = page.locator(".uipack-web-demo").first();
    const top = await demo.evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThan(600 * 1.25);
    await expect(demo).toHaveAttribute("data-state", "finished");
    await expect(demo.getByTestId("demo-metric")).toHaveText("3");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    await expect(demo.getByTestId("demo-metric")).toHaveText("3");
  });

  test("reduced motion shows every figure at once", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/components/diagrams");
    await page.locator("figure.uipack").last().waitFor({ state: "attached" });
    await expect(page.locator(".uipack__canvas[data-enter]")).toHaveCount(0);
    await context.close();
  });
});
