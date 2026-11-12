# Library playground

Run `npm run dev` from the repo root. The sidebar is generated from the docs manifest (`docs-manifest.ts`, read through `librarySections`, `libraryGroups` and `pageDefs` in `catalog.ts`; see "Navigation" below); a page's sub-pages and sub-views (the decks) sit under its name. The shell renders a Skip to content link, the header (the banner landmark), then in `<main>` the page bar (the context line, "View as Markdown", "Edit on GitHub") and the page, whose Markdown `#` is its `h1`, and sets the tab title ("Bento · Deck player · uipack"). An unknown path shows a Page not found page listing every page, and an unknown `?deck=` says which deck it shows instead. To add a page, add its entry to `docs-manifest.ts` (group, path, Markdown file, demo ids); `routes.ts` derives its route and renders it with `MarkdownShowcase`. Each page is a lazy chunk: `main.tsx` renders the shell at once and the page below it when its chunk arrives (a "Loading …" status line shows if that takes more than 300 ms), and in a build `index.html` preloads the current page's chunk and CSS alongside the entry. Every recipe is in [contributing](../docs/contributing.md).

## Deployed site

`main` deploys to [ui.junxiong.dev](https://ui.junxiong.dev) on Vercel (`vercel.json`; pull requests get preview deployments). `npm run build:site` (`vite build`) writes the static site to `playground/dist`: one HTML file per route in `routes.ts` plus `/` (the landing page, `index.html`) and `/gallery`, each with its page's title, description and canonical (`site.ts`; Vercel's `cleanUrls` serves `x.html` at `/x`), a 404.html, the raw Markdown and images each docs page renders at their repo paths, the asset manifest's previews, and robots.txt, sitemap.xml and llms.txt for `https://ui.junxiong.dev` (`UIPACK_SITE_ORIGIN` overrides). `vercel.json` enforces a Content-Security-Policy that allows the three inline scripts in `index.html` by hash; the build fails with the new hashes when one changes. `npm run check:site` serves the build with vercel.json's headers (`scripts/serve-site.mjs`) and loads every route in light and dark, failing on a console error, a CSP violation, a failed request or a broken internal link; `npm run check:site -- https://ui.junxiong.dev` checks the live site. CI runs both, one runner per theme.

## The landing page

`/` is the landing page (`LandingShowcase.tsx`, `landing.css`, `landing/`), outside the manifest: a
mode of `ShowcaseShell` (same header, no sidebar; the page brings its own `<main>` and footer site
map), built to the [landing recipe](../docs/recipes/landing.md) in Technical. Its words are data in
`landing/content.ts`, each from the doc it links, with pages named by manifest id; the install line
is `release.ts`'s (the line `npm run docs:sync` writes into the docs); the site map is the manifest.
The hero figure (`landing/HeroFigure.tsx`, the agent read order drawn with the figure parts, a wide
and a phone drawing) loads at once; the layer stack and the bento previews (the agent-loop preset,
the Deck player, the span chart, article parts) mount as they near the viewport
(`preview-stage.tsx`, shared with the gallery), and the 3D tile mounts its scene only on screen with
WebGL and motion allowed, a still from `assets/styles/` otherwise. An old link to a heading of "What
UiPack is" (`/#install`), which `/` used to show, moves to `/what-uipack-is`. `e2e/landing.spec.ts`
covers it; `tier1.spec.ts` grades it.

## Navigation, search and the site's own look

The sidebar is the manifest's five sections (Start, Rules, Build, Check, Reference; `docsSections`
and each group's `section` in `docs-manifest.ts`), collapsible, the current one open, each with its
icon and hue (`site-settings.tsx`, `site-palette.css`). The location marker (a paper plane, or the
uipack square mark with `?marker=mark`) flies to the current page in the sidebar and glides to the
current heading in "On this page"; the sidebar remembers the page being left in sessionStorage so the
next page's marker travels from it. Below 900px the header's menu button opens the sidebar as a
drawer and "On this page" folds into a disclosure (it does from 1180px). Search (the sidebar's box,
⌘K / Ctrl-K) loads `/search-index.json`, built from every page's Markdown by `search-index.ts`
(vite.config.ts serves it in dev and emits it in a build). The site's dark palette, hues, marker and
widths are its own spec, [docs/specs/docs-site.md](../docs/specs/docs-site.md); `site-palette.css`
lays its values over Technical's, for this site only. `e2e/docs-shell.spec.ts` covers the marker,
widths, drawer, disclosure and search.

## Two views: Docs and Assets

The header has two tabs. **Docs** opens the manifest's first page, and holds every page in the docs
manifest, each rendering its Markdown file with its live samples. **Assets** (`/gallery`,
`GalleryShowcase.tsx`) is the other page outside the manifest: a grid of every asset (architecture figures and presets, deck slides and slide
starters, demos, 3D scenes and stories, components, icons and marks), rendered live for review at a
glance, with no prose. It is a mode of the same `ShowcaseShell` (same header, no docs sidebar). Its
cards come from the registries the docs pages render (`figures/`, `PRESETS`, `deckExamples.ts`,
`presentationExamples.ts`, `objectScenes`, `slideStories`, `assets/manifest.json`, `demos.tsx`), so a
registered asset appears there by itself. Each card links to its docs page, and each docs page whose
assets the gallery shows links back ("See it in Assets"; `gallery-index.ts` maps categories to pages).
Previews mount as they near the viewport, are `inert` and `aria-hidden`, and scaled ones set
`FigureLayoutWidthContext` so figure text keeps its size. `e2e/assets-gallery.spec.ts` covers it.

## Pages

A few of the pages and their addresses (the manifest lists every one, with its section and group):

| Section | Page | Path |
|---|---|---|
| Build | Architecture diagrams | `/components/diagrams` (aliases `/diagrams`, and `/drill`, which scrolls to the drill-down) |
| Build | Charts | `/charts` |
| Build | Article parts | `/article` |
| Build | Tech talk, Bento, Consulting (under Deck player) | `/deck?deck=moves`, `?deck=bento`, `?deck=consulting` |
| Build | Slide starters | `/presentations` |
| Build | 3D animations | `/animations` (alias `/slides`) |
| Build | Mechanism | `/mechanism` |
| Build | Example landing page | `/web` |
| Build | Docs layout | `/docs` |
| Rules | Overview, Style contract, Writing, Layout, Do and don't | `/foundations`, `/foundations/style`, `/foundations/writing`, `/foundations/layout`, `/foundations/do-and-dont` (alias `/foundations/mix`; `/foundations/recipes` opens Recipes) |
| Rules | How to write a spec | `/styles` |
| Reference | Icons & marks | `/assets` |

Every page has the same headings: the context line (`<Section> · <Style> style`, the section as a chip in its hue), one `h1`, a one-sentence intro, then sentence-case `h2` sections. Figures inside an `h2` keep `headingLevel` 3; inside an `h3` they use 4.

- `/components/diagrams`: the figure design system. One section per diagram pattern, simplest first (bare figure, parts, pipeline … drill-down), from `figureEntries` in `catalog.ts`; the section copy and renderers are in `figures/index.tsx`, the ported examples in `figures/*.tsx`. Each h2 names the pattern and what it teaches, the intro says when to use it and which parts build it, and figures are numbered in page order. Show a pattern once: add a section the first time a published figure (notes, homepage) uses a new one, with neutral content, and skip figures that repeat an existing pattern. Preset sections carry `data-preset`.
- `/charts`: the `uipack/charts` examples: the layer stack (`#layer-stack`) and the span chart (`#span-chart`, with `enhanceSpanChart`). They render in a frame at a host's real figure width, 896px by default; `?frame=720|390|320|full` changes it. Widths wider than the screen are disabled, and the bar then reports the frame as `full` at the measured width. Their data is `examples/aiStack.ts`; `scripts/build-static-fixtures.tsx` renders the same data to static HTML for the no-JavaScript tests, including a host article whose prose CSS loads after `charts.css`.
- `/assets`: searchable icons, marks, backgrounds and motion tokens. Diagrams are coded figures and live on `/components/diagrams`, not in `assets/manifest.json`.
- `/animations`: 3D animation collection, search, and technique filters. `/slides` is a compatibility alias.
- `/deck`: the example decks in the deck player. The three decks are sub-pages under "Deck player" in the sidebar, so the page's own picker is redundant.
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
