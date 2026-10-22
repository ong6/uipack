import { render } from "@testing-library/react";
import { DeckSlideContext, STORYLINE_TEMPLATES, lintDeck, starterDeck } from "../src/deck";
import { deckExamples } from "../playground/deckExamples";
import { findings as starterFindings, slides as starterSlides } from "../examples/deckStarter";

// The example decks teach by example, so each must pass the checks it asks authors to pass.
describe("example decks", () => {
  it.each(deckExamples.map((d) => [d.id, d] as const))("%s passes its own lintDeck with no findings", (_, d) => {
    expect(lintDeck(d.slides, d.lint ?? {})).toEqual([]);
  });

  it.each(deckExamples.map((d) => [d.id, d] as const))("%s: every headline is unique and every slide has a talk track", (_, d) => {
    const headlines = d.slides.map((s) => s.headline ?? s.title);
    expect(new Set(headlines).size).toBe(headlines.length);
    for (const s of d.slides) expect(s.notes, s.id).toBeTruthy();
  });
});

describe("starterDeck", () => {
  it.each(STORYLINE_TEMPLATES.map((t) => [t.id, t] as const))("%s: one playable stub per beat, roles in template order", (id, t) => {
    const deck = starterDeck(id, { footer: "Team · Review" });
    expect(deck.map((s) => s.role)).toEqual(t.beats.map((b) => b.role));
    deck.forEach((slide, i) => {
      const { container, unmount } = render(
        <DeckSlideContext.Provider value={{ step: Infinity, active: true, thumbnail: false, index: i, count: deck.length }}>
          {slide.render({ step: Infinity, active: true, thumbnail: false, theme: "light", reducedMotion: true })}
        </DeckSlideContext.Provider>,
      );
      expect(container.querySelector(".uipack-deck-heading")?.textContent).toBe(slide.headline);
      unmount();
    });
    // Only the talk tracks (and sources for the example numbers) are left to write.
    const left = new Set(lintDeck(deck, { template: id }).map((f) => f.rule));
    for (const rule of left) expect(["notes-present", "number-source"]).toContain(rule);
  });

  it("the copyable starter file is one project, fully written over the template's stubs, and lint-clean", () => {
    expect(starterFindings).toEqual([]);
    expect(starterSlides.map((s) => s.role)).toEqual(starterDeck("project-update").map((s) => s.role));
    // One example project throughout: the index migration, not a mix of stub topics.
    expect(starterSlides[0].headline).toMatch(/index migration/i);
    for (const s of starterSlides) {
      expect(s.notes, s.id).toBeTruthy();
      expect(s.headline, s.id).not.toMatch(/twice as fast/i);
    }
  });
});
