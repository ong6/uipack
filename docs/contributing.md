# Adding to UI Pack

Recipes for the common additions, with every file each one touches. Read [AGENTS.md](../AGENTS.md), [design direction](design-direction.md) and [component-first](component-first.md) first; this page is the file list, not the design rules. Where a list must be kept in step with another, a unit test names the one you missed.

## The shape of an entry

Every package entry (`uipack`, `uipack/deck`, `uipack/mechanism`…) has the same parts:

| Part | Where | Checked by |
| --- | --- | --- |
| A barrel that lists every export by name (no `export *`) | `src/<entry>/index.ts` | `test/exports.test.tsx` (no name in two entries) |
| A main component that renders on the server | the entry | `test/ssr.test.tsx` (node environment, no React warnings) |
| CSS scoped under one root class (`.uipack-<entry>`), tokens on that class, no bare element rules | `src/<entry>/<entry>.css` | review |
| A doc with the import, the props table and the limits | `docs/<entry>.md`, linked from `docs/README.md` and the root README | `files` ships `docs/*.md` |
| A playground page or section, registered in the catalog | `playground/catalog.ts` | `test/catalog.test.tsx` |
| Unit tests for the pure parts, Playwright for the interaction | `test/<entry>.test.tsx`, `e2e/<entry>.spec.ts` | |

Shared building blocks, so a new part does not grow its own copy:

- `src/env.ts`: `useIsoLayoutEffect` (SSR-safe layout effect), `usePrefersReducedMotion()` (the one reduced-motion subscription; a new part uses it rather than its own `matchMedia`), `prefersReducedMotion()` and `onReducedMotionChange()` for code outside React, `REDUCED_MOTION_QUERY`, and `keepFocusedInView` (onFocus for a horizontally scrolling row, so a focused item and its ring are never half hidden).
- `src/zoom-math.ts`: the fixed-point zoom (`zoomFrame`, `zoomSamples`, `easeInOutCubic`, `smoothstep`).
- `src/presets/shared.tsx`: `textPx`, `fits`, `fit` and `nodeWidthFor`, the text-width estimates presets size boxes with.
- Prop names: `theme` (`"light" | "dark"`; omitted, follow an ancestor's `data-theme`), `motion` (`"auto" | "none"`), `interactive` (`false` renders one still frame: thumbnails), `alt` (the accessible description), `number` (the figure number), `className`. Use these names for the same ideas.

## A new visual style

A style is an implementation, not a label: register it only when its renderer exists.

1. Tokens and rules in a scoped stylesheet under the style's root class (Landing: `src/web/web.css` under `.uipack-web`; Mechanism: `src/mechanism/mechanism.css` under `.uipack-mechanism`). Never recolour Technical.
2. The components or renderer that draw in it, with real example data.
3. A guidance doc (`docs/<style>.md`): when to use it, type roles, palette, motion rules. Add a row to the style table in `docs/design-direction.md` and its type roles to the typography line in `AGENTS.md`.
4. Register it in `visualStyles` in `playground/catalog.ts` (`id`, `name`, `description`, `tokens`, `guidance`). `/styles` renders a card from it; `test/catalog.test.tsx` checks both files exist.
5. A page that shows it (next recipe), with `styleName` on its `libraryPages` entry so the shell's context line names the style.
6. Evidence: screenshots at 1440 and 390 in both themes in `docs/`, referenced from the doc.
7. `npm run build` and commit `dist/` with the change.

## A new playground page

1. `libraryPages` in `playground/catalog.ts`: `id`, `group` (one of `libraryGroups`), `label` (nav text and `h1`), `path`, `intro` (one sentence). Optional: `title` when the label names only a sub-view, `query` and `isDefault` for sub-views of one path (the decks), `hostsPage` when the page renders a complete sample page with its own `h1` (`/web`), `styleName` when its content is not Technical.
2. The page component, `playground/<Name>Showcase.tsx`, default export, rendering only the page's content: `main.tsx` puts it inside `ShowcaseShell` (header, `h1`, intro), and `useShowcaseTheme()` gives it the theme. Sections are `<section data-catalog-entry id>` with a sentence-case `h2`; figures inside keep `headingLevel` 3. Its CSS is `playground/<name>-showcase.css`, imported by the page (with `src/theme.css` and `src/canvas.css` if it shows figures), with classes no library entry uses: it loads with the page's chunk, and only `showcase.css` is in the entry.
3. `pageModules` in `playground/routes.ts`: map the id to the module name. The typecheck fails until you do. `main.tsx` lazy-loads it (a module named `App`, `CatalogPages` or `*Showcase`), and the build preloads its chunk from `index.html`.
4. The nav table in `e2e/nav.spec.ts` (`GROUPS`, written out on purpose) and the table in `playground/README.md`.
5. Run `e2e/nav.spec.ts` and `e2e/alignment.spec.ts`; add the path to `PAGES` in `alignment.spec.ts`.

## Which slide system

Three entries draw slides. New slide work goes in `uipack/deck`; the other two are kept so existing imports and links keep working.

| Entry | Role | Add to it when |
| --- | --- | --- |
| `uipack/deck` | The deck player: a whole talk on a 1920×1080 canvas with one transition grammar, builds, an overview and storyline lint, a speaker view, a read view and PDF export. Slide parts and the consulting charts live here. | Any new slide, part, chart, transition or example deck. |
| `uipack/presentations` | Slide starters: three single 16:9 layouts (Opening, Explanation, System) as serializable data with a speaker guide, rendered by `SlideStarter` or exported to SVG by `renderSlideSvg`. | Fixes to those three layouts and their SVG output only. |
| `uipack/slides` | Three.js and GSAP 3D animations (`SlidePlayer`, `SlideScene`): a persistent scene with camera stops, shown in the playground as 3D animations (`/animations`, alias `/slides`). The name is historical. | A 3D animation to embed in a slide or page, not a deck. |

## A new example deck

1. `playground/<name>Deck.tsx` exports `DeckSlide[]` (and `LintOptions` if it follows a storyline template). Build slides from `Slide`, `Morph`, `Build`, `Bento` and the consulting parts; sizes are canvas pixels on 1920×1080.
2. Add `{ id, slides, lint }` to `deckExamples` in `playground/deckExamples.ts`.
3. Add its nav entry to `libraryPages`: `group: "presentations"`, `title: "Deck player"`, `path: "/deck"`, `query: { deck: "<id>" }`, a `label` and an `intro`. `test/catalog.test.tsx` fails until the two lists match. `/deck?deck=<id>` now opens it.
4. Add the row to `GROUPS` in `e2e/nav.spec.ts` and to the deck row in `playground/README.md`.
5. Run `lintDeck` on it (the overview's Storyline tab shows the findings) and `e2e/deck.spec.ts`.

## A new slide part or chart

1. The part: layout parts in `src/deck/parts.tsx` (or `bento.tsx`), consulting charts one per file in `src/deck/consulting/charts/` (shared frame, text and fills in `shared.tsx`; add the new file to `charts/index.ts`). Sizes are canvas pixels; a chart measures its box with `useChartSize` and takes `alt`, `width` and `height` like the others.
2. Its maths as pure functions in `src/deck/consulting/scale.ts` (scales, ticks, layouts, `wrapToWidth`, `formatValue`), unit-tested in `test/deck-consulting.test.tsx`.
3. Styles in `src/deck/deck.css` or `src/deck/consulting/consulting.css`, under `.uipack-deck`, using the deck tokens (`--deck-fg`, `--deck-accent`, `--deck-radius`, `--deck-settle`…). Text on a slide is at least `MIN_TEXT_PX` on the canvas.
4. Export it by name from `src/deck/consulting/index.ts` and again in the consulting block of `src/deck/index.ts`. `test/exports.test.tsx` fails if the second is missing or another entry already uses the name (`Callout` is article's; deck's is `Annotation`).
5. Document it in the parts table of `docs/deck-consulting.md` (or `docs/deck.md`), and use it on a slide of an example deck.
6. `npm run build` and commit `dist/` with the change.

## A new figure pattern on `/`

The diagrams page shows each pattern once, simplest first. Add one the first time a published figure (notes, homepage) uses a pattern the page does not show.

1. The figure: `playground/figures/<pattern>.tsx`, a `Figure` built from library parts, with a wide drawing and an authored `narrow` drawing below 720px, neutral content (no real systems), and `controls={false}` if nothing moves.
2. A `figureEntries` row in `playground/catalog.ts`: `[id, "Pattern: what it teaches", tags]`, placed by complexity.
3. A `figureDetails` entry in `playground/figures/index.tsx` under the same id, with an `intro` that starts "Use when…" and names the parts it is built from, and `render(number)`. The page's `figureSections` are derived from `figureEntries`, so the order is the catalog's; the typecheck fails until every id has its entry.
4. If the figure needs a mark that published figures share (as `Wall` and `Cross` were), promote it to `src/` with a test and a README line instead of drawing it locally, then `npm run build` and commit `dist/`. Candidates still drawn locally are listed at the end of this page.
5. `e2e/geometry.spec.ts` checks every figure on the page: arrowheads clear of nodes, packets clear of heads, text inside node boxes at 1440 and 390, the 11px text floor, no motion controls on a still figure.

## A new Mechanism machine

1. A folder `src/mechanism/<machine>/`, as `gate/` is: `model.ts` (the truth: a small pure module with the numbers, thresholds and readout text), `view.ts` (world units, plans, the camera), `geometry.ts` (solids built once with the kit), `motion.ts` (`sceneAt(pose, t)`, a pure function of time) and the component (`<Machine>.tsx`, the machine wrapped in `MechanismFrame`).
2. Reuse the shared pieces: `kit/` (vendored, do not edit), `solid3.ts`, `MechanismFrame`, `mechanism.css` (add rules under `.uipack-mechanism`), `usePrefersReducedMotion` from `src/env.ts` (not the kit's own stillness helpers). Props follow the gate: `pose`, `theme`, `motion`, `interactive`, `alt`, `frame`, `number`, `title`, `hint`, `caption`.
3. Export it by name from `src/mechanism/index.ts`, with its model and motion renamed to carry the machine's prefix (`GATE_PERIOD`, `gateSceneAt`), as the gate's are.
4. Register it in `mechanismEntries` in `playground/catalog.ts` and give it a section on `playground/MechanismShowcase.tsx`.
5. Tests: the model and the scripts' continuity in `test/mechanism.test.tsx` (the no-Three.js check covers the new folder), interaction and both themes in `e2e/mechanism.spec.ts`.
6. Document it in `docs/mechanism.md` (what moves and what it means, its parts, its API), following the craft rules there.
7. `npm run build` and commit `dist/` with the change.

## A new package entry

1. `src/<entry>/index.ts`, exporting every name explicitly. Add its main component to `entries` in `test/ssr.test.tsx`, which fails until every entry renders on the server.
2. `scripts/entries.ts`: `<entry>: "src/<entry>/index.ts"`. tsup builds `dist/<entry>.{js,cjs,d.ts}` from it.
3. `package.json` `exports`: `"./<entry>": { "types": "./dist/<entry>.d.ts", "import": "./dist/<entry>.js", "require": "./dist/<entry>.cjs" }`.
4. If it has styles: a line in `scripts/css-bundles.ts` (`{ out: "<entry>.css", from: [...] }`) and `"./<entry>.css": "./dist/<entry>.css"` in `exports`. `test/package.test.tsx` fails until entries, bundles and exports agree. (`exports` stays hand-written: npm reads `package.json` as it is, and the test names the line you missed.)
5. Keep heavy dependencies out of the default entry: Three.js and GSAP only behind an optional, lazy entry. A heavy dependency an entry needs goes in three places: `peerDependencies` in `package.json`, `peerDependenciesMeta` with `{ "optional": true }` (so consumers who skip the entry never install it), and `external` in `tsup.config.ts` (so it is never bundled into `dist/`).
6. Docs: `docs/<entry>.md` (shipped by the `docs/*.md` glob in `files`), a line in `docs/README.md`, a section in the root README and a line in `src/README.md`.
7. `npm run build`, commit `dist/`, and load every built entry in both module systems with `node scripts/load-entries.mjs` (CI runs it, and fails if `dist/` differs from a fresh build).

## Formatting

Prettier owns the format: print width 130, double quotes. The config, `npm run format` and `npm run format:check` (also run in CI) are being added; until then, match the surrounding code and do not reformat lines a change does not touch. ESLint (`eslint.config.js`) checks correctness only: the rules of hooks, unhandled promises and unused code. `tsc` also fails on unused locals and parameters; prefix a parameter kept for its position with `_`.

## Candidates

Drawn locally in the playground today, worth promoting once a second figure needs them:

- **Sankey bands and bars** (`playground/figures/flowVolumes.tsx`): the layout (column stacking, band ordering by source and target) is generic, but its API (node and link data, label placement beside bars, the narrow drawing that drops a column) needs a second real use to settle.
- **Caught mark** (`playground/figures/layeredChecks.tsx`): the half-opaque diamond an item leaves where a `Wall` stops it. It is close to `Token kind="change"`; a `Token` variant would be the likely home.
