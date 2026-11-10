# UIPACK agent guide

| Your task | Read first |
| --- | --- |
| Build a page, figure, deck or copy for a site | [`docs/agents/README.md`](docs/agents/README.md), then the job's skill in [`skills/`](skills/README.md); you can stop reading this file |
| Add or change a part, page, style or entry in uipack | Its recipe in [`docs/contributing.md`](docs/contributing.md), then "Design contract" and "Engineering and verification" below |
| Change the docs | "Design contract" below (docs bullet), then [grading these docs for agents](docs/grading/agent-docs.md) |

Before any commit to uipack: `npm run verify` (format check, typecheck, lint, affected unit tests; `npm run format` fixes formatting), `npm run build` (commit `dist/`), `npm run test:affected -- --e2e`.

**Using UiPack on a site** (building a page, a diagram, copy, a site spec, a review): start at [`docs/agents/README.md`](docs/agents/README.md), then the job's skill in [`skills/`](skills/README.md). Both ship in the package (`node_modules/uipack/`). The rest of this file is for changing uipack itself.

**Changing uipack:** read `docs/system/README.md` (the design system: style, writing and layout as independent layers) and `docs/design-direction.md` before changing any visible UI. Read the nearest README before editing its area. `CLAUDE.md` points here; keep one canonical policy. Guidance lives in `docs/`; a skill in `skills/` links to it and never restates it.

## What this library is

The owner's own design system, for his sites (every one is in `docs/specs/registry.md`) and work presentations; not a public product, so the registry's sites are the only consumers. Its docs are written for agents: each file opens with what it is for, is headed so an agent can jump, and is reachable from README.md or this file (`scripts/check-agent-docs.ts`). It holds reusable SVG figures, primitives, 3D animations, and presentation composition examples. The gallery is a browsing interface; a 3D animation is not a complete slide deck. Keep the optional 3D entry lazy and keep the SVG entry free of Three.js and GSAP imports.

## Design contract

- Reuse `playground/ShowcaseShell.tsx` for every collection. Never create another logo, header, theme toggle, page width, or navigation system.
- Classify content by both type and style. Register catalog metadata in `playground/catalog.ts`. Technical is the one implemented style, for every medium; pages and Foundations show it alone, with no style switcher. Light/dark are colour themes within a style, not new styles.
- The docs are layered: core rules (`docs/system/`: the role contract, layout floors, core writing rules; no site's values), the libraries a spec picks from (layout archetypes in `docs/system/layout/`, component looks in `docs/components/`, each `fixed` or `flex`; both listed in `scripts/site-model.ts`) and one spec per website (`docs/specs/`, or a site repo's `STYLE.md`, from `docs/specs/TEMPLATE.md`, checked by `scripts/check-spec.ts`), which owns the site's look, its layout per page type, its writing style and the looks it picks; a deck reads its site's spec. Every site is in `docs/specs/registry.md`. A site that should look like another reuses that spec. uipack renders a spec's look by adding one value set in `src/styles`, registering it in `uiStyles`, and testing it ([recipe](docs/specs/README.md#building-a-style-from-a-spec)); build one only when the owner or a brief asks, and it adds components only when it adds a part and never moves a section. Do not recolour Technical without the owner (its Cyanotype values were chosen blind on 2026-11-05) or invent unavailable style choices.
- Colours, faces, radii and ornaments come from the role layer (`src/styles`, `var(--ui-*)`); never write a hex literal in component CSS or TSX (`test/no-hex.test.tsx`). A style is one value set keyed by `data-ui-style`; components take a `uiStyle` prop (`style` stays React's inline CSS).
- A web style owns how parts are drawn (cards, step numbers, stats, quote, featured plan, table cells, density) through its treatment roles (`docs/system/style.md`, "Treatment roles"); range never comes from moving a box. Marketing pages show the product's real output with the product-surface parts (`ProductWindow`, `DataTable`, `ScheduleGrid`, `FileTable`, `ItemList`, `RecordCard`, `WorkedExample`, `BeforeAfter`, `DemoPlayer` steps mode); `examples/web-starter` is the working reference and ships in the package.
- Use the style's own type roles, never a new face. Technical (page, slide, figure, chart, article, shell): IBM Plex Sans 600 for every heading (one face across page, slide and figure titles), IBM Plex Sans text, IBM Plex Mono labels, IDs and controls, self-hosted in `uipack/fonts`. A different face is a new style built from a spec. Deck and Mechanism take the active style's slide faces.
- Use the existing semantic flow colours, spacing, borders, and buttons. Scope CSS under the entry's root class; no global h1/h2/button rules.
- Motion explains change. Prefer one camera movement or object sequence per beat. Respect reduced motion and keep labels readable.
- Every new part, figure and page ships the interaction polish in `docs/design-direction.md` (hover on what a reader points at, one 120–160ms timing, the scroll-in entrance, packets that arrive and leave). A review that finds a part without it treats that as unfinished.
- Every interactive feature must work with touch and keyboard. Selection is persistent, reversible, and visible without colour alone. Keep links as links.
- Dense diagrams need an authored narrow layout or an internally scrollable readable drawing. Do not compress labels into unreadable text or allow page-wide overflow.
- Figures and animation players offer Open canvas in articles, docs and the gallery; on a `uipack/web` page their chrome is quiet by default (no Open canvas, no one-entry legend; `chrome="full"` opts back in). Preserve modal focus containment, Escape, return focus, close controls, and scroll restoration.
- Presentation layouts need words, hierarchy, whitespace, and a narrative purpose. Use animation as one part of a composition.
- The Assets tab (`/gallery`, `playground/GalleryShowcase.tsx`) is the one page outside the docs manifest: a live grid of every registered asset with no prose, generated from the same registries the docs render; each card links to its docs page. A new kind of asset gets a block there; a new instance of an existing kind appears by itself.
- Every docs-site page renders its Markdown file (`playground/docs-manifest.ts`); live demos are `uipack-demo` blocks registered in `playground/demos.tsx`, and the demo modules show, never explain: rules, tables and budgets live in the Markdown. Every number or sequence a Rules, recipe or example page states comes from code through a generated block (`npm run docs:sync`; `test/foundations-drift.test.tsx` fails on a word budget written outside one). The `/web` sample's copy is owned by the front-end showcase work (`playground/WebShowcase.tsx`, `playground/tidyFacts.ts`); when a new part needs to appear there, add it with words and numbers from `tidyFacts.ts` (a new claim or section is an edit there) and keep `e2e/showcase-content.spec.ts` green. A gallery demo that shows the sample product's words carries `data-sample`.

## Engineering and verification

Inspect Git status first. Preserve unrelated changes; do not deploy the homepage from this repo. Keep existing `uipack/slides` imports and `/slides` links working while presenting the feature as 3D animations.

A question, review or evaluation the owner asks for changes nothing: no build, tests, CI waits or scoring subagents unless the owner asks for them.
Screenshots go through `npm run shoot`. Any other browser script needs a page timeout and an overall deadline, and never waits for `networkidle`.
Wait for CI in the background (`gh run watch` in a background task), never as a foreground block before replying; merge to `main` only from a branch whose CI is green.

Run `npm run verify` (format check, typecheck, lint and the affected unit tests; `npm run format` fixes formatting), `npm run build` (then commit `dist/`) and `npm run test:affected -- --e2e`. Affected means only the unit tests that import what changed and the browser specs mapped to the changed areas, Chromium only (owner, 2026-11-04). `-- --dry` prints the plan. CI runs the full suites on every push; run them locally only when asked or when the script reports an unmapped path. When you add a spec or a source area, add its row to `AREAS` in `scripts/affected.mjs`. Use a bounded worker count on this machine. Do not build or mutate source while browser tests are running. Verify the built package too; `dist/` is intentionally committed.

`.claude/settings.json` denies agents reads of generated files (`dist/`, `docs/screenshots/`, `package-lock.json`, `test-results/`); check them through the build, tests or `git diff --stat`.

Inspect real browser screenshots at desktop and 390px, with both themes when colour changes. Automated tests do not prove visual polish. Report failures, skips, and unsupported behaviour honestly. Test the meaning of an interaction, not just matching implementation details.

Never assume the preview is running. Check it before handing over a localhost link. Update the API doc for the entry (the root README's Entries table names it) with the change; a docs change passes `npx tsx scripts/check-agent-docs.ts`. Keep work scoped; do not add unrelated dependencies or publish without authorization.

## Component-first workflow

Read [docs/component-first.md](docs/component-first.md) before building a significant visual. To add a style, page, deck, slide part, figure pattern, machine or package entry, follow its recipe in [docs/contributing.md](docs/contributing.md). Implement and register it here before a consumer integrates it. Geometry and playback have one owner; consumer code supplies content and theme only.
