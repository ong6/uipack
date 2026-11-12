# Adding to UI Pack

Recipes for the common additions, with every file each one touches. Read [AGENTS.md](../AGENTS.md), [design direction](design-direction.md) and [component-first](component-first.md) first; this page is the file list, not the design rules. Where a list must be kept in step with another, a unit test names the one you missed.

## Built files

`dist/` is built, never committed (gitignored since 0.4.0). Run `npm run build` before the unit tests, the typecheck and the e2e smoke, which read it; CI builds it first in every job that needs it. A release's built copy is the tarball the release workflow attaches to the tag ([releases](releases.md)).

## The shape of an entry

Every package entry (`uipack`, `uipack/deck`, `uipack/mechanism`…) has the same parts:

| Part | Where | Checked by |
| --- | --- | --- |
| A barrel that lists every export by name (no `export *`) | `src/<entry>/index.ts` | `test/exports.test.tsx` (no name in two entries) |
| A main component that renders on the server | the entry | `test/ssr.test.tsx` (node environment, no React warnings) |
| CSS scoped under one root class (`.uipack-<entry>`), tokens on that class, no bare element rules | `src/<entry>/<entry>.css` | review |
| A doc with the import, the props table and the limits | `docs/<entry>.md`, in `playground/docs-manifest.ts` (the docs index and `llms.txt` follow), and a row in the root README's Entries table | `files` ships `docs/*.md` |
| A playground page or section, registered in the catalog | `playground/catalog.ts` | `test/catalog.test.tsx` |
| Unit tests for the pure parts, Playwright for the interaction | `test/<entry>.test.tsx`, `e2e/<entry>.spec.ts` | |

Shared building blocks, so a new part does not grow its own copy:

- `src/env.ts`: `useIsoLayoutEffect` (SSR-safe layout effect), `usePrefersReducedMotion()` (the one reduced-motion subscription; a new part uses it rather than its own `matchMedia`), `prefersReducedMotion()` and `onReducedMotionChange()` for code outside React, `REDUCED_MOTION_QUERY`, and `keepFocusedInView` (onFocus for a horizontally scrolling row, so a focused item and its ring are never half hidden).
- `src/zoom-math.ts`: the fixed-point zoom (`zoomFrame`, `zoomSamples`, `easeInOutCubic`, `smoothstep`).
- `src/presets/shared.tsx`: `textPx`, `fits`, `fit` and `nodeWidthFor`, the text-width estimates presets size boxes with.
- Prop names: `theme` (`"light" | "dark"`; omitted, follow an ancestor's `data-theme`), `motion` (`"auto" | "none"`), `interactive` (`false` renders one still frame: thumbnails), `alt` (the accessible description), `number` (the figure number), `className`. Use these names for the same ideas.

## A new visual style

Each website has one spec ([how to write one](specs/README.md)); Technical is the package's default look
(the docs site's own spec extends it) and the one implemented style. uipack renders another site's look by adding one value set in
`src/styles`, registering it in `uiStyles`, and testing it. The full recipe, with every file and
test, is in [Building a style from a spec](specs/README.md#building-a-style-from-a-spec); the contract is
[docs/system/style.md](system/style.md#the-role-contract). In short:

1. **The value set**: `src/styles/<id>.css`, one `[data-ui-style="<id>"]` block inside
   `@layer uipack.tokens` that sets every role (`test/style-values.ts` lists them;
   `test/style-roles.test.tsx` fails on a missing one), ornament slots and treatment roles
   included. Never edit Technical's values to get a look; add a component only for a new part.
2. **Faces**, if the style brings one: a latin-subset woff2 in `src/web/fonts/` with its OFL
   licence, an `@font-face` (`font-display: swap`) and a metric-matched `… Fallback` face in
   `src/web/fonts.css`, and the font tests in `test/web.test.tsx` updated.
3. **Register it**: `styleFiles` in `scripts/css-bundles.ts`, `UiStyleId` and `uiStyles` in
   `src/style.ts` (summary, fonts, the face to preload, its opt-in `prefers` order and `layout`),
   `STYLE_FILES` in `test/style-values.ts`.
4. **Test it**: role completeness and contrast in both themes, no hex outside `src/styles`, label
   fit with the new faces (`e2e/geometry.spec.ts`, `e2e/charts.spec.ts`), and screenshots at 1440
   and 390 in both themes, inspected by eye.
5. Mark the spec implemented, add the style to `docs/system/style.md`, then `npm run build` and
   check it with the tests.

## A new playground page

1. `libraryPages` in `playground/catalog.ts`: `id`, `group` (one of `libraryGroups`), `label` (nav text and `h1`), `path`, `intro` (one sentence). Optional: `title` when the label names only a sub-view, `query` and `isDefault` for sub-views of one path (the decks), `hostsPage` when the page renders a complete sample page with its own `h1` (`/web`), `styleName` when its content is not Technical.
2. The page component, `playground/<Name>Showcase.tsx`, default export, rendering only the page's content: `main.tsx` puts it inside `ShowcaseShell` (header, `h1`, intro), and `useShowcaseTheme()` gives it the theme. Sections are `<section data-catalog-entry id>` with a sentence-case `h2`; figures inside keep `headingLevel` 3. Its CSS is `playground/<name>-showcase.css`, imported by the page (with `src/theme.css` and `src/canvas.css` if it shows figures), with classes no library entry uses: it loads with the page's chunk, and only `showcase.css` is in the entry.
3. `pageModules` in `playground/routes.ts`: map the id to the module name. The typecheck fails until you do. Name a new module `<Name>Showcase`: `main.tsx` lazy-loads only modules matching its `import.meta.glob` (`*Showcase`), and `test/catalog.test.tsx` fails on any other name. The build preloads the page's chunk from `index.html`.
4. The table in `playground/README.md`. The nav and page-audit tests read their page lists from the catalog, so the page is covered once it is registered.
5. Run `e2e/nav.spec.ts` and `e2e/page-audit.spec.ts` (one test per page: heading outline and scale, control faces, card and control alignment, the phone header, focus rings and overflow; the checks live in `e2e/page-audit.ts`).

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
4. Add it to the deck row in `playground/README.md` (`e2e/nav.spec.ts` reads its nav table from the catalog).
5. Run `lintDeck` on it (the overview's Storyline tab shows the findings) and `e2e/deck.spec.ts`.

## A new slide part or chart

1. The part: layout parts in `src/deck/parts.tsx` (or `bento.tsx`), consulting charts one per file in `src/deck/consulting/charts/` (shared frame, text and fills in `shared.tsx`; add the new file to `charts/index.ts`). Sizes are canvas pixels; a chart measures its box with `useChartSize` and takes `alt`, `width` and `height` like the others.
2. Its maths as pure functions in `src/deck/consulting/scale.ts` (scales, ticks, layouts, `wrapToWidth`, `formatValue`), unit-tested in `test/deck-consulting.test.tsx`.
3. Styles in `src/deck/deck.css` or `src/deck/consulting/consulting.css`, under `.uipack-deck`, using the deck tokens (`--deck-fg`, `--deck-accent`, `--deck-radius`, `--deck-settle`…). Text on a slide is at least `MIN_TEXT_PX` on the canvas.
4. Export it by name from `src/deck/consulting/index.ts` and again in the consulting block of `src/deck/index.ts`. `test/exports.test.tsx` fails if the second is missing or another entry already uses the name (`Callout` is article's; deck's is `Annotation`).
5. Document it in the parts table of `docs/deck-consulting.md` (or `docs/deck.md`), and use it on a slide of an example deck.
6. `npm run build` and run the affected tests on the build.

## A new web part

For a part in `uipack/web` (a stat strip, a new product surface, a closing block). A significant
visual follows [component-first](component-first.md) first.

1. The part: a component in `src/web/` (one file, or beside its family in `Blocks.tsx` or
   `ProductMock.tsx`), reading only `var(--ui-*)` roles and the web tokens; no hex literal
   (`test/no-hex.test.tsx`). Anything a style should draw differently is a treatment role
   ([style roles](system/style.md), "Treatment roles"), never a new layout per style.
2. Styles in `src/web/web.css`, in the matching family block, scoped under `.uipack-web`, with the
   interaction polish in [design direction](design-direction.md#interaction-polish-the-standard-for-every-new-part-figure-and-page),
   a real 390px layout and 44px targets.
3. Export it by name from `src/web/index.ts`; `test/exports.test.tsx` fails on a name clash.
4. A unit test beside the family's (`test/web-blocks.test.tsx` or `test/web-product.test.tsx`),
   including the server render.
5. Show it on `/web`: add it to `playground/WebShowcase.tsx` with its words and numbers from
   `playground/tidyFacts.ts` (a new claim is an edit there) and keep
   `e2e/showcase-content.spec.ts` and `e2e/web.spec.ts` green.
6. Document its props in [docs/web-api.md](web-api.md) and, if it changes a rule, in
   [web principles](web-principles.md).
7. `npm run build`, `npm run verify` and `npm run test:affected -- --e2e`.

## A new figure pattern on `/`

The diagrams page shows each pattern once, simplest first. Add one the first time a published figure (notes, homepage) uses a pattern the page does not show.

1. The figure: `playground/figures/<pattern>.tsx`, a `Figure` built from library parts, with a wide drawing and an authored `narrow` drawing below 720px, neutral content (no real systems), and `controls={false}` if nothing moves.
2. A `figureEntries` row in `playground/catalog.ts`: `[id, "Pattern: what it teaches", tags]`, placed by complexity.
3. A `figureDetails` entry in `playground/figures/index.tsx` under the same id, with an `intro` that starts "Use when…" and names the parts it is built from, and `render(number)`. The page's `figureSections` are derived from `figureEntries`, so the order is the catalog's; the typecheck fails until every id has its entry.
4. If the figure needs a mark that published figures share (as `Wall` and `Cross` were), promote it to `src/` with a test and a line in [docs/figure-api.md](figure-api.md#parts) instead of drawing it locally, then `npm run build` and run its tests. Candidates still drawn locally are listed at the end of this page.
5. `e2e/geometry.spec.ts` checks every figure on the page: arrowheads clear of nodes, packets clear of heads, text inside node boxes at 1440 and 390, the 11px text floor, no motion controls on a still figure.

## A new Mechanism machine

1. A folder `src/mechanism/<machine>/`, as `gate/` is: `model.ts` (the truth: a small pure module with the numbers, thresholds and readout text), `view.ts` (world units, plans, the camera), `geometry.ts` (solids built once with the kit), `motion.ts` (`sceneAt(pose, t)`, a pure function of time), and the component (`<Machine>.tsx`, the machine wrapped in `MechanismFrame`). A machine that animates splits its component as the gate does: `display.ts` (the moving state, how it follows a scene and paints onto the SVG; no React), `GateArt.tsx` (the drawing at its first frame) and `useGateLoop.ts` (the requestAnimationFrame loop, reading props through refs).
2. Reuse the shared pieces: `kit/` (vendored, do not edit), `solid3.ts`, `MechanismFrame`, `mechanism.css` (add rules under `.uipack-mechanism`), `usePrefersReducedMotion` from `src/env.ts` (not the kit's own stillness helpers). Props follow the gate: `pose`, `theme`, `motion`, `interactive`, `alt`, `frame`, `number`, `title`, `hint`, `caption`.
3. Export it by name from `src/mechanism/index.ts`, with its model and motion renamed to carry the machine's prefix (`GATE_PERIOD`, `gateSceneAt`), as the gate's are.
4. Register it in `mechanismEntries` in `playground/catalog.ts` and give it a section on `playground/MechanismShowcase.tsx`.
5. Tests: the model and the scripts' continuity in `test/mechanism.test.tsx` (the no-Three.js check covers the new folder), interaction and both themes in `e2e/mechanism.spec.ts`.
6. Document it in `docs/mechanism.md` (what moves and what it means, its parts, its API), following the craft rules there.
7. `npm run build` and run the affected tests on the build.

## A new package entry

1. `src/<entry>/index.ts`, exporting every name explicitly. Add its main component to `entries` in `test/ssr.test.tsx`, which fails until every entry renders on the server.
2. `scripts/entries.ts`: `<entry>: "src/<entry>/index.ts"`. tsup builds `dist/<entry>.{js,d.ts}` from it (ES modules only since 0.4.0).
3. `package.json` `exports`: `"./<entry>": { "types": "./dist/<entry>.d.ts", "default": "./dist/<entry>.js" }`, `types` first (TypeScript takes the first condition that matches). There is no `require` condition: the package is ES modules only.
4. If it has styles: a line in `scripts/css-bundles.ts` (`{ out: "<entry>.css", from: [...] }`), `"./<entry>.css": "./dist/<entry>.css"` in `exports`, and the same `"./<entry>.css"` in `excludeEntrypoints` in `.attw.json` (a stylesheet has no type declarations for attw to find). `test/package.test.tsx` fails until entries, bundles, exports and `.attw.json` agree. (`exports` stays hand-written: npm reads `package.json` as it is, and the test names the line you missed.)
5. Keep heavy dependencies out of the default entry: Three.js and GSAP only behind an optional, lazy entry. A heavy dependency an entry needs goes in `peerDependencies` in `package.json` and in `peerDependenciesMeta` with `{ "optional": true }` (so consumers who skip the entry never install it). Nothing in `tsup.config.ts`: tsup leaves every dependency and peer dependency, and their subpaths (`react-dom/server`), out of `dist/`.
6. Docs: `docs/<entry>.md` (shipped by the `docs/*.md` glob in `files`), a page in `playground/docs-manifest.ts` (then `npm run docs:sync`), a row in the root README's Entries table and a line in `src/README.md`.
7. `npm run build`, import every built entry and resolve every file export with `node scripts/load-entries.mjs`, and check the types resolve with `npm run attw` (CI runs both on a fresh build). `.attw.json` uses the `esm-only` profile: it checks `node16` (from ESM) and `bundler` resolution, and skips CommonJS, which the package does not ship.

## Formatting

Prettier owns the format of code, styles and config (`.prettierrc.json`: print width 130, double quotes, semicolons, trailing commas). Run `npm run format` before committing; CI runs `npm run format:check` and fails on any unformatted file. `.prettierignore` leaves out what tools write (`dist/`, `assets/manifest.json`, `docs/assets/`, `package-lock.json`), the vendored Anatomy kit (`src/mechanism/kit/`), and Markdown, whose compact tables Prettier would pad to their widest cell. In Markdown, keep tables unpadded and one paragraph to a line. ESLint (`eslint.config.js`) checks correctness only: react-hooks' recommended set (the rules of hooks, effect dependencies, and the React Compiler checks: no ref read or written during render, no prop or global mutated, no synchronous setState in an effect), unhandled promises and unused code. A value that handlers, timers or loops need at its latest goes through `useLatest` (`src/env.ts`), not a ref written during render; markup that exists only with JavaScript running uses `useHydrated`. A disable names its rule and says why after `--`. `tsc` also fails on unused locals and parameters; prefix a parameter kept for its position with `_`.

## Candidates

Drawn locally in the playground today, worth promoting once a second figure needs them:

- **Sankey bands and bars** (`playground/figures/flowVolumes.tsx`): the layout (column stacking, band ordering by source and target) is generic, but its API (node and link data, label placement beside bars, the narrow drawing that drops a column) needs a second real use to settle.
- **Caught mark** (`playground/figures/layeredChecks.tsx`): the half-opaque diamond an item leaves where a `Wall` stops it. It is close to `Token kind="change"`; a `Token` variant would be the likely home.
