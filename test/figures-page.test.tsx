// @vitest-environment node
// Server-rendered, as the diagrams page's figures are on a real server: no window, so no layout effects.
import { renderToStaticMarkup } from "react-dom/server";
import { figureEntries } from "../playground/catalog";
import { figureSections } from "../playground/figures";

// The diagrams page renders figureSections, which are figureEntries (ids, order, titles)
// joined with each pattern's copy and figure by id; the typecheck fails on a missing id.
describe("diagrams page", () => {
  it("has one section per catalog entry, in the same order", () => {
    expect(figureSections.map((s) => s.id)).toEqual(figureEntries.map((e) => e.id));
    expect(new Set(figureEntries.map((e) => e.id)).size).toBe(figureEntries.length);
  });

  it("every section says when to use it and renders its figure", () => {
    for (const s of figureSections) {
      expect(s.intro, s.id).toMatch(/^(Use |The vocabulary)/);
      const html = renderToStaticMarkup(<>{s.render("Figure 01")}</>);
      expect(html, s.id).toContain("<figure");
    }
  });
});
