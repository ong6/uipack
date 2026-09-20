# UIPACK agent guide

Read `docs/design-direction.md` before changing any visible UI. Read the nearest README before editing its area. `CLAUDE.md` points here; keep one canonical policy.

## What this library is

Reusable SVG figures, primitives, 3D animations, and presentation composition examples. The gallery is a browsing interface; a 3D animation is not a complete slide deck. Keep the optional 3D entry lazy and keep the SVG entry free of Three.js and GSAP imports.

## Design contract

- Reuse `playground/ShowcaseShell.tsx` for every collection. Never create another logo, header, theme toggle, page width, or navigation system.
- Classify content by both type and style. Register catalog metadata in `playground/catalog.ts`. Technical is the existing style; light/dark are colour themes within it, not new styles.
- A new visual style needs a distinct style ID, scoped tokens, renderer/components, example data, documentation, and mobile evidence. Do not recolour Technical globally or invent unavailable style choices.
- Use existing sans/mono typography, semantic flow colours, spacing, borders, and buttons. Scope CSS; no global h1/h2/button rules.
- Motion explains change. Prefer one camera movement or object sequence per beat. Respect reduced motion and keep labels readable.
- Every interactive feature must work with touch and keyboard. Selection is persistent, reversible, and visible without colour alone. Keep links as links.
- Dense diagrams need an authored narrow layout or an internally scrollable readable drawing. Do not compress labels into unreadable text or allow page-wide overflow.
- Figures and animation players offer Open canvas. Preserve modal focus containment, Escape, return focus, close controls, and scroll restoration.
- Presentation layouts need words, hierarchy, whitespace, and a narrative purpose. Use animation as one part of a composition.

## Engineering and verification

Inspect Git status first. Preserve unrelated changes; do not deploy the homepage from this repo. Keep existing `uipack/slides` imports and `/slides` links working while presenting the feature as 3D animations.

Run `npm run typecheck`, `npm test`, `npm run build`, and affected Playwright tests. Run the full browser suite for shared Figure, shell, theme, or interaction changes. Use a bounded worker count on this machine. Do not build or mutate source while browser tests are running. Verify the built package too; `dist/` is intentionally committed.

Inspect real browser screenshots at desktop and 390px, with both themes when colour changes. Automated tests do not prove visual polish. Report failures, skips, and unsupported behaviour honestly. Test the meaning of an interaction, not just matching implementation details.

Never assume the preview is running. Check it before handing over a localhost link. Update README links and API docs with the change. Keep work scoped; do not add unrelated dependencies or publish without authorization.

## Component-first workflow

Read [docs/component-first.md](docs/component-first.md) before building a significant visual. Implement and register it here before a consumer integrates it. Geometry and playback have one owner; consumer code supplies content and theme only.
