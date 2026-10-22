import { lintDeck } from "../src/deck";
import { deckExamples } from "../playground/deckExamples";

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
