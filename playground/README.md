# Library playground

Run `npm run dev` from the repo root. The nav has two rows: groups, then the active group's pages. Both come from `libraryGroups` and `libraryPages` in `catalog.ts`; the shell renders the context line, the page's `h1` (its label) and its intro (`intro`) from the same entry. To add a page, add a `libraryPages` entry with a `group` and a route in `main.tsx`.

| Group | Page | Path |
|---|---|---|
| Diagrams | Architecture diagrams | `/` (alias `/diagrams`) |
| Diagrams | Charts | `/charts` |
| Diagrams | Article parts | `/article` |
| Presentations | Tech talk, Bento, Consulting | `/deck?deck=moves`, `?deck=bento`, `?deck=consulting` |
| Presentations | Slide starters | `/presentations` |
| Motion & 3D | 3D animations | `/animations` (alias `/slides`) |
| Motion & 3D | Mechanism | `/mechanism` |
| Web | Web UI | `/web` |
| Web | Docs layout | `/docs` |
| Foundations | Styles | `/styles` |
| Foundations | Icons & marks | `/assets` |

Every page has the same headings: the context line (`<Group> · <Style> style`), one `h1`, a one-sentence intro, then sentence-case `h2` sections. Figures inside an `h2` keep `headingLevel` 3; inside an `h3` they use 4.

- `/`: Presets (`data-preset` sections), Reference figure (Habitat), Parts (every part once) and Bare figure.
- `/charts`: the `uipack/charts` examples: the layer stack (`#layer-stack`) and the span chart (`#span-chart`, with `enhanceSpanChart`). They render in a frame at a host's real figure width, 896px by default; `?frame=720|390|320|full` changes it. Their data is `examples/aiStack.ts`; `scripts/build-static-fixtures.tsx` renders the same data to static HTML for the no-JavaScript tests, including a host article whose prose CSS loads after `charts.css`.
- `/assets`: searchable icons, marks, backgrounds and motion tokens. Diagrams are coded figures and live on `/`, not in `assets/manifest.json`.
- `/animations`: 3D animation collection, search, and technique filters. `/slides` is a compatibility alias.
- `/deck`: the example decks in the deck player. The three decks are second-row entries in the nav, so the page's own picker is redundant.
- `/presentations`: slide starters and a complete five-chapter narrative composition example.
- `/web`: Web UI in the Landing style. One composed landing page (glass nav, star hero, demo player, spotlight features, reveal quote, closing CTA), then the flashy, low-key, Motion and Backgrounds sections and the principles.
- `/article`: the `uipack/article` parts in a host article: a 40rem prose column with blog-like prose CSS and a 56rem slot for wide clusters. `#layer-section` composes the Inference and Harness sections; the other anchors show each part's variants. `?host=notes` maps the tokens to the notes site's palette. The content is `examples/articleParts.tsx`; `scripts/build-article-fixtures.tsx` renders it to static HTML in a copy of the notes site's article layout for the no-JavaScript tests.
- `/mechanism`: the Mechanism style. The verification gate in its card with pose buttons (`?pose=idle|pass|return|apart`), and the four still thumbnails a deck would render (`interactive={false}`, `frame={false}`).
- `/styles`: visual-language catalog (Technical, Landing, Mechanism, and six object art directions).

`ShowcaseShell.tsx` owns shared navigation/theme handling; its `styleName` prop names the page's content style in the context line. `showcase.css` owns page tokens and layout. `catalog.ts` owns type/style/tag metadata. Collection pages must not introduce another header or global styles.

To add an animation, export a validated story from `src/slides`, register metadata in `catalog.ts`, and add it to the story list. To add a visual style, follow [the design contract](../docs/design-direction.md); metadata alone does not implement a style.

Presentation layouts belong in `CatalogPages.tsx` and `presentations.css` until there are enough reusable examples to extract a separate library API. Keep 3D assets independent from those layouts.

Object scenes also appear in `/animations` under the Objects filter. Add source metadata to `src/objects/index.tsx`; `catalog.ts` registers those entries.

For reproducible object reviews, use /animations?story=travel&variant=0 (variants 0–5). The hobby variants select Studio, Paper, Kinetic, Cartoon, Realistic and Abstract. Use the named selector to compare all six hobbies.

The animation collection uses a scene library beside a single preview and style inspector.
Original looks are nested under Studio edition (`edition=0..2`), separate from art direction.
On narrow screens the library becomes a horizontal list and the inspector moves below the preview.

Contact additionally offers Cartoon (variant 3) and Kinetic (variant 4), preserving legacy inbox finishes 0–2. Kinetic Open book makes a complete 12-second rotation.
