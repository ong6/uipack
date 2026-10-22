import { expect, test, type Page } from "./fixtures";

// The heading scale in docs/design-direction.md, checked on every playground page: one size for
// section headings across pages, and card, figure and scene titles at 18–20px / 600 below them.
// Sample content keeps its own scale (slides, the Landing page, the docs prose), so headings
// inside those roots are not the page's.
const PAGES = ["/", "/charts", "/article", "/deck?deck=moves", "/deck?deck=bento", "/deck?deck=consulting", "/presentations", "/animations", "/mechanism", "/web", "/docs", "/styles", "/assets"];
const SAMPLE = ".uipack-web, .uipack-docs, .uipack-deck, .uipack-deck-stage, .composed-deck, .uipack-slide-starter";
const TITLES = ".uipack__title, .style-card h3, .uipack-animation-heading h3";

async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator(".showcase-title")).toBeVisible();
  await expect(page.locator(".showcase-shell section > h2").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

function measure({ sample, titles }: { sample: string; titles: string }) {
  const size = (el: Element) => parseFloat(getComputedStyle(el).fontSize);
  const visible = (el: Element) => el.getClientRects().length > 0;
  const page = document.querySelector(".showcase-title h1, .showcase-title .showcase-title__name");
  const sections = [...document.querySelectorAll(".showcase-shell h2")].filter((h) => visible(h) && !h.closest(sample));
  const cards = [...document.querySelectorAll(titles)].filter((h) => visible(h) && !h.closest(sample.replace(".uipack-docs, ", "")));
  return {
    page: page ? size(page) : null,
    sections: [...new Set(sections.map(size))],
    titles: cards.map((t) => ({ text: (t.textContent ?? "").trim().slice(0, 30), size: size(t), weight: getComputedStyle(t).fontWeight })),
  };
}

for (const [width, section] of [
  [1440, 24],
  [390, 22],
] as const) {
  test.describe(`heading scale at ${width}`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const path of PAGES) {
      test(`${path}: section headings are ${section}px; card and figure titles are 18–20px / 600`, async ({ page }) => {
        await open(page, path);
        const m = await page.evaluate(measure, { sample: SAMPLE, titles: TITLES });
        expect(m.sections, "every section heading on the page has one size").toEqual([section]);
        expect(m.page ?? 0).toBeGreaterThan(section);
        for (const t of m.titles) {
          expect(t.size, `${t.text} is a card-level title`).toBeGreaterThanOrEqual(18);
          expect(t.size, `${t.text} stays below the section heading`).toBeLessThanOrEqual(20);
          expect(t.weight, `${t.text} weight`).toBe("600");
        }
      });
    }
  });
}
