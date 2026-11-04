# UIPACK agent guide

Read `docs/system/README.md` (the design system: style, writing and layout as independent layers) and `docs/design-direction.md` before changing any visible UI. Read the nearest README before editing its area. `CLAUDE.md` points here; keep one canonical policy.

## What this library is

Reusable SVG figures, primitives, 3D animations, and presentation composition examples. The gallery is a browsing interface; a 3D animation is not a complete slide deck. Keep the optional 3D entry lazy and keep the SVG entry free of Three.js and GSAP imports.

## Design contract

- Reuse `playground/ShowcaseShell.tsx` for every collection. Never create another logo, header, theme toggle, page width, or navigation system.
- Classify content by both type and style. Register catalog metadata in `playground/catalog.ts`. Technical is the default style (and the default web style); Landing is the generic landing option; Graphical is the poster style. Light/dark are colour themes within a style, not new styles.
- A new visual style is one value set in `src/styles` plus its doc, evidence and registration ([recipe](docs/contributing.md#a-new-visual-style)); it adds components only when it adds a part. Do not recolour Technical or invent unavailable style choices.
- Colours, faces, radii and ornaments come from the role layer (`src/styles`, `var(--ui-*)`); never write a hex literal in component CSS or TSX (`test/no-hex.test.tsx`). A style is one value set keyed by `data-ui-style`; components take a `style` prop.
- Use the style's own type roles, never a new face. Technical (figures, charts, article, shell): system sans for text, system mono for labels, IDs and controls, no font requests; on the web, IBM Plex Sans and Mono. Landing (generic landing): Instrument Serif display (heading step 4 and up), IBM Plex Sans text, IBM Plex Mono labels and data. Graphical: Anton display in caps, IBM Plex Sans text, IBM Plex Mono labels. Deck and Mechanism: IBM Plex Sans and Mono when the host provides them (`--font-sans`/`--font-mono`), else the style's stacks.
- Use the existing semantic flow colours, spacing, borders, and buttons. Scope CSS under the entry's root class; no global h1/h2/button rules.
- Motion explains change. Prefer one camera movement or object sequence per beat. Respect reduced motion and keep labels readable.
- Every new part, figure and page ships the interaction polish in `docs/design-direction.md` (hover on what a reader points at, one 120–160ms timing, the scroll-in entrance, packets that arrive and leave). A review that finds a part without it treats that as unfinished.
- Every interactive feature must work with touch and keyboard. Selection is persistent, reversible, and visible without colour alone. Keep links as links.
- Dense diagrams need an authored narrow layout or an internally scrollable readable drawing. Do not compress labels into unreadable text or allow page-wide overflow.
- Figures and animation players offer Open canvas. Preserve modal focus containment, Escape, return focus, close controls, and scroll restoration.
- Presentation layouts need words, hierarchy, whitespace, and a narrative purpose. Use animation as one part of a composition.

## Engineering and verification

Inspect Git status first. Preserve unrelated changes; do not deploy the homepage from this repo. Keep existing `uipack/slides` imports and `/slides` links working while presenting the feature as 3D animations.

Run `npm run typecheck`, `npm run lint`, `npm run build` (then commit `dist/`) and `npm run test:affected`: only the unit tests that import what changed and the browser specs mapped to the changed areas, Chromium only (owner, 2026-11-04). `-- --dry` prints the plan. CI runs the full suites on every push; run them locally only when asked or when the script reports an unmapped path. When you add a spec or a source area, add its row to `AREAS` in `scripts/affected.mjs`. Use a bounded worker count on this machine. Do not build or mutate source while browser tests are running. Verify the built package too; `dist/` is intentionally committed.

Inspect real browser screenshots at desktop and 390px, with both themes when colour changes. Automated tests do not prove visual polish. Report failures, skips, and unsupported behaviour honestly. Test the meaning of an interaction, not just matching implementation details.

Never assume the preview is running. Check it before handing over a localhost link. Update README links and API docs with the change. Keep work scoped; do not add unrelated dependencies or publish without authorization.

## Component-first workflow

Read [docs/component-first.md](docs/component-first.md) before building a significant visual. To add a style, page, deck, slide part, figure pattern, machine or package entry, follow its recipe in [docs/contributing.md](docs/contributing.md). Implement and register it here before a consumer integrates it. Geometry and playback have one owner; consumer code supplies content and theme only.
