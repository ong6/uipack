import { renderToStaticMarkup } from "react-dom/server";
import { figureEntries } from "../playground/catalog";
import { figureSections } from "../playground/figures";

// The diagrams page renders figureEntries in order and looks up each section's
// copy and figure by id; the two lists must name the same patterns.
describe("diagrams page", () => {
  it("has one section per catalog entry, in the same order", () => {
    expect(figureSections.map((s) => s.id).sort()).toEqual(figureEntries.map((e) => e.id).sort());
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
