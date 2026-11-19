import { expect, test, waitForPage } from "./fixtures";

// A SlideStarter preview draws the 1200-unit slide at whatever width its column gives it. Every text
// renders at 12px or more (SlideStarter measures the preview and raises small text), and the larger
// text still fits the layout: inside the slide's 64-unit margins, inside its box, and clear of every
// other text. Checked on each layout at junxiong.dev's column (680px), a phone column (358px) and a
// narrow phone (320px).

/**
 * Problems with the preview's text, in slide units, as it is drawn now. A text's horizontal extent
 * is its bounding box; its vertical one is cap height to descender (0.72 and 0.25 of the size), as
 * the bounding box's line box would make the opening's two 78-unit headline lines touch.
 */
function slideTextProblems() {
  const svg = document.querySelector<SVGSVGElement>(".uipack-slide-starter__preview svg")!;
  const boxes = [...svg.querySelectorAll("rect")].slice(1).map((r) => r.getBBox());
  const texts = [...svg.querySelectorAll("text")];
  const out: string[] = [];
  const spans = texts.map((t) => {
    const m = t.getScreenCTM()!;
    const px = parseFloat(getComputedStyle(t).fontSize) * Math.hypot(m.a, m.b);
    const size = parseFloat(t.getAttribute("font-size")!);
    const box0 = t.getBBox();
    const baseline = Number(t.getAttribute("y"));
    const b = { x: box0.x, width: box0.width, y: baseline - 0.72 * size, height: 0.97 * size };
    const label = `"${t.textContent}"`;
    if (px < 12 - 0.01) out.push(`${label} ${px.toFixed(2)}px`);
    if (b.x < 64 - 0.5 || b.x + b.width > 1136 + 0.5 || b.y < 0 || b.y + b.height > 675)
      out.push(`${label} leaves the slide's margins (${b.x.toFixed(0)}..${(b.x + b.width).toFixed(0)})`);
    const x = Number(t.getAttribute("x"));
    const box = boxes.find((r) => x >= r.x && x <= r.x + r.width && baseline >= r.y && baseline <= r.y + r.height);
    if (box && (b.x + b.width > box.x + box.width - 4 || b.y < box.y || b.y + b.height > box.y + box.height))
      out.push(`${label} spills its box (${(b.x + b.width).toFixed(0)} > ${(box.x + box.width - 4).toFixed(0)})`);
    return { label, b };
  });
  spans.forEach((a, i) =>
    spans.slice(i + 1).forEach((c) => {
      const w = Math.min(a.b.x + a.b.width, c.b.x + c.b.width) - Math.max(a.b.x, c.b.x);
      const h = Math.min(a.b.y + a.b.height, c.b.y + c.b.height) - Math.max(a.b.y, c.b.y);
      if (w > 0.5 && h > 0.5) out.push(`${a.label} overlaps ${c.label}`);
    }),
  );
  return out;
}

test("slide starter text is 12px or more at every preview width, and fits", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/presentations?theme=light");
  await waitForPage(page);
  const layouts = page.getByRole("navigation", { name: "Slide starter layouts" });
  const preview = page.locator(".uipack-slide-starter__preview").first();
  for (const width of [680, 358, 320]) {
    await page
      .locator(".uipack-slide-starter")
      .first()
      .evaluate((el, w) => (el.style.width = `${w}px`), width);
    await expect.poll(() => preview.evaluate((el) => el.getBoundingClientRect().width)).toBe(width);
    for (const layout of ["Opening", "Explanation", "System"]) {
      await layouts.getByRole("button", { name: layout }).click();
      await expect.poll(() => page.evaluate(slideTextProblems), { message: `${layout} at ${width}px` }).toEqual([]);
    }
  }
});
