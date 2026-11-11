# Library playground

Run `npm run dev` from the repo root. The nav has two rows: groups, then the active group's pages. Both come from `libraryGroups` and `libraryPages` in `catalog.ts`; a page's sub-views (the decks) sit together after the page's name. The shell renders a Skip to content link, the header (the banner landmark), then in `<main>` the context line, the page's `h1` (its label, or "Deck player · Bento" for a sub-view) and its intro (`intro`) from the same entry, and sets the tab title ("Bento · Deck player · uipack"). An unknown path shows a Page not found page listing every page, and an unknown `?deck=` says which deck it shows instead. To add a page, add a `libraryPages` entry with a `group`, then map its id to the page's module in `pageModules` (`routes.ts`), which also derives the routes; the typecheck fails until it is mapped. Each page is a lazy chunk: `main.tsx` renders the shell at once and the page below it when its chunk arrives (a "Loading …" status line shows if that takes more than 300 ms), and in a build `index.html` preloads the current page's chunk and CSS alongside the entry. Every recipe is in [contributing](../docs/contributing.md).

## Deployed site

`main` deploys to [ui.junxiong.dev](https://ui.junxiong.dev) on Vercel (`vercel.json`; pull requests get preview deployments). `npm run build:site` (`vite build`) writes the static site to `playground/dist`: one HTML file per route in `routes.ts` plus `/gallery`, each with its page's title, description and canonical (`site.ts`; Vercel's `cleanUrls` serves `x.html` at `/x`), a 404.html, the raw Markdown and images each docs page renders at their repo paths, the asset manifest's previews, and robots.txt, sitemap.xml and llms.txt for `https://ui.junxiong.dev` (`UIPACK_SITE_ORIGIN` overrides). `vercel.json` enforces a Content-Security-Policy that allows the three inline scripts in `index.html` by hash; the build fails with the new hashes when one changes. `npm run check:site` serves the build with vercel.json's headers (`scripts/serve-site.mjs`) and loads every route in light and dark, failing on a console error, a CSP violation, a failed request or a broken internal link; `npm run check:site -- https://ui.junxiong.dev` checks the live site. CI runs both, one runner per theme.

## Two views: Docs and Assets

The header has two tabs. **Docs** is every page in the docs manifest, each rendering its Markdown
file with its live samples. **Assets** (`/gallery`, `GalleryShowcase.tsx`) is the one page outside
the manifest: a grid of every asset (architecture figures and presets, deck slides and slide
starters, demos, 3D scenes and stories, components, icons and marks), rendered live for review at a
glance, with no prose. It is a mode of the same `ShowcaseShell` (same header, no docs sidebar). Its
cards come from the registries the docs pages render (`figures/`, `PRESETS`, `deckExamples.ts`,
`presentationExamples.ts`, `objectScenes`, `slideStories`, `assets/manifest.json`, `demos.tsx`), so a
registered asset appears there by itself. Each card links to its docs page, and each docs page whose
assets the gallery shows links back ("See it in Assets"; `gallery-index.ts` maps categories to pages).
Previews mount as they near the viewport, are `inert` and `aria-hidden`, and scaled ones set
`FigureLayoutWidthContext` so figure text keeps its size. `e2e/assets-gallery.spec.ts` covers it.

## Pages

| Group | Page | Path |
|---|---|---|
| Diagrams | Architecture diagrams | `/` (aliases `/diagrams`, and `/drill`, which scrolls to the drill-down) |
| Diagrams | Charts | `/charts` |
| Diagrams | Article parts | `/article` |
| Presentations | Tech talk, Bento, Consulting | `/deck?deck=moves`, `?deck=bento`, `?deck=consulting` |
| Presentations | Slide starters | `/presentations` |
| Motion & 3D | 3D animations | `/animations` (alias `/slides`) |
| Motion & 3D | Mechanism | `/mechanism` |
| Web | Web UI | `/web` |
| Web | Docs layout | `/docs` |
| Foundations | Overview, Style roles, Writing, Layout, Mix and match, Recipes, Do and don't | `/foundations`, `/foundations/style`, `/foundations/writing`, `/foundations/layout`, `/foundations/mix`, `/foundations/recipes`, `/foundations/do-and-dont` |
| Foundations | Styles | `/styles` |
| Foundations | Icons & marks | `/assets` |

Every page has the same headings: the context line (`<Group> · <Style> style`), one `h1`, a one-sentence intro, then sentence-case `h2` sections. Figures inside an `h2` keep `headingLevel` 3; inside an `h3` they use 4.

- `/`: the figure design system. One section per diagram pattern, simplest first (bare figure, parts, pipeline … drill-down), from `figureEntries` in `catalog.ts`; the section copy and renderers are in `figures/index.tsx`, the ported examples in `figures/*.tsx`. Each h2 names the pattern and what it teaches, the intro says when to use it and which parts build it, and figures are numbered in page order. Show a pattern once: add a section the first time a published figure (notes, homepage) uses a new one, with neutral content, and skip figures that repeat an existing pattern. Preset sections carry `data-preset`.
- `/charts`: the `uipack/charts` examples: the layer stack (`#layer-stack`) and the span chart (`#span-chart`, with `enhanceSpanChart`). They render in a frame at a host's real figure width, 896px by default; `?frame=720|390|320|full` changes it. Widths wider than the screen are disabled, and the bar then reports the frame as `full` at the measured width. Their data is `examples/aiStack.ts`; `scripts/build-static-fixtures.tsx` renders the same data to static HTML for the no-JavaScript tests, including a host article whose prose CSS loads after `charts.css`.
- `/assets`: searchable icons, marks, backgrounds and motion tokens. Diagrams are coded figures and live on `/`, not in `assets/manifest.json`.
- `/animations`: 3D animation collection, search, and technique filters. `/slides` is a compatibility alias.
- `/deck`: the example decks in the deck player. The three decks are second-row entries in the nav, so the page's own picker is redundant.
- `/presentations`: slide starters and a complete five-chapter narrative composition example.
- `/web`: Web UI in Technical, the one implemented style. One composed product page (glass nav, star hero, demo player, spotlight features, reveal quote, closing CTA), then the flashy, low-key, Motion and Backgrounds sections and the principles.
- `/article`: the `uipack/article` parts in a host article: a 40rem prose column with blog-like prose CSS and a 56rem slot for wide clusters. `#layer-section` composes the Inference and Harness sections; the other anchors show each part's variants. `?host=notes` maps the tokens to the notes site's palette. The content is `examples/articleParts.tsx`; `scripts/build-article-fixtures.tsx` renders it to static HTML in a copy of the notes site's article layout for the no-JavaScript tests.
- `/mechanism`: the Mechanism style. The verification gate in its card with pose buttons (`?pose=idle|pass|return|apart`), and the four still thumbnails a deck would render (`interactive={false}`, `frame={false}`).
- `/foundations/*`, `/recipes/*`, `/examples/*`: the Rules, recipes and examples, each a Markdown file under `docs/` rendered by `MarkdownShowcase.tsx`; their live demos (layer swap, role swatches, ornament slots, budget checker, archetype deck, do-and-don't pairs) are in `rulesDemos.tsx` with `foundations.css`. Component pages work the same way: each `*Showcase.tsx` module exports the demos its doc embeds (`demos.tsx` registers them); only the deck's print and speaker windows render a module without the shell.
- `/styles` renders `docs/specs/README.md` (one spec per website); `/specs/technical` renders the Technical spec with the visual-language catalog as a demo (Technical, Mechanism, and six object art directions). Each card shows the style itself (`StylePreviews.tsx`): a live figure and gate machine, and a still for each of the six WebGL directions on a subject that offers it (travel for Studio, Paper and Kinetic; tennis for Cartoon, reading for Realistic, AI for Abstract), linked to that scene (`assets/styles/`, regenerated with `node scripts/style-stills.mjs [baseURL] [direction ids…]` while the dev server runs on port 5285).

`ShowcaseShell.tsx` owns shared navigation/theme handling (`ShowcaseThemeProvider`, `useShowcaseTheme`); a page's `styleName` in `catalog.ts` names its content style in the context line. `showcase.css` owns page tokens and layout. `catalog.ts` owns type/style/tag metadata. Collection pages must not introduce another header or global styles.

To add an animation, export a validated story from `src/slides`, register metadata in `catalog.ts`, and add it to the story list. To add a visual style, build it from the site's spec (`docs/specs/`): one value set in `src/styles`, registered in `uiStyles` (`src/style.ts`), and tested; metadata alone does not implement a style.

Presentation layouts belong in `CatalogShowcase.tsx` and `presentations.css` until there are enough reusable examples to extract a separate library API. Keep 3D assets independent from those layouts.

Object scenes also appear in `/animations` under the Objects filter. Add source metadata to `objectScenes` in `src/objects/scene-list.ts` (plain data, so the catalog in the playground's entry does not pull in the 3D player); `catalog.ts` registers those entries.

For reproducible object reviews, use /animations?story=travel&variant=0. Variants 0–5 select Studio, Paper, Kinetic, Cartoon, Realistic and Abstract; each object offers two or three of them (`objectLooks`, the reasons in [docs/objects.md](../docs/objects.md#directions-per-subject)), the inspector lists only those, and a variant the object lacks shows its default with a note.

The animation collection uses a scene library beside a single preview and style inspector.
Original looks are nested under Studio edition (`edition=0..2`), separate from art direction.
On narrow screens the library becomes a horizontal list and the inspector moves below the preview.

Contact offers Cartoon (variant 3) beside its legacy Studio inbox finishes 0–2.
