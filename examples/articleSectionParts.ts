/**
 * A long article's layer section, in the order `LayerSection` (examples/articleParts.tsx) renders
 * it. docs/recipes/documentation.md states this order through `npm run docs:sync`, and
 * test/article.test.tsx checks the rendered order against it. Data only, no imports.
 */
export const LAYER_SECTION_PARTS: readonly { part: string; what: string }[] = [
  { part: "LayerHead", what: "the strip above the heading: the layer's index, its zone and one metric" },
  { part: "<h2> or <h3>", what: "the section's heading, a plain name" },
  { part: "<p>", what: "the prose: the argument, a few short paragraphs" },
  { part: "TermList", what: "the terms the section uses, each with a one-line gloss" },
  { part: "ChangeNote", what: "what changed recently, dated" },
  { part: "Callout", what: "a self-test question for the reader" },
  { part: "LinkList", what: "where to go deeper" },
  { part: "NoteCluster", what: "the writer's own notes on the layer" },
];
