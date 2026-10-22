# Library source

- Root components and `theme.css`: SVG figures and primitives.
- `selection.tsx`: persistent semantic selection within Figure.
- `env.ts`: helpers every entry shares: `useIsoLayoutEffect`, `usePrefersReducedMotion` (the one reduced-motion subscription), `prefersReducedMotion()`, `onReducedMotionChange()` and `REDUCED_MOTION_QUERY`.
- `zoom-math.ts`: the fixed-point zoom into a box, shared by `drill/` and the deck's zoom transition.
- `flight.ts`: `useLayerFlight`, the two-layer flight lifetime both share (cancel on settle and unmount, land only when the latest flight finishes).
- `drill/`: `DrillFigure` and `DrillNode`, a figure whose nodes zoom open into their own figures (exported from the root entry). See [drill-down figures](../docs/drill.md).
- `canvas-gestures.ts`: scoped trackpad/touch inputs, anchored SVG zoom, bounded camera zoom, and reset.
- `CanvasView.tsx` and `canvas.css`: shared modal canvas workspace. Build appends its CSS to both distributed theme files.
- `presets/`: typed SVG scene builders with wide and narrow drawings.
- `slides/`: optional Three.js/GSAP animations; public compatibility entry `uipack/slides`.
- `objects/`: lazy procedural and Blender-authored objects, curated variations, accessible playback, and fallback illustrations (`uipack/objects`).
- `presentations/`: generic Opening, Explanation, and System slide layouts with speaker guides and SVG output (`uipack/presentations`).
- `deck/`: the deck player (`uipack/deck`, `uipack/deck.css`): `DeckPlayer`, slide parts (`parts.tsx`, `bento.tsx`), transitions (`transitions.ts`), the storyline checks (`storyline.ts`) and the consulting slides and charts (`consulting/`). See [deck](../docs/deck.md) and [consulting slides](../docs/deck-consulting.md).
- `browser/`: searchable asset browser.
- `web/`: Landing-style web building blocks (`uipack/web`, `uipack/web.css`): DemoPlayer and its pure timeline, StarHero, SpotlightCard, RevealText, text hierarchy, CtaButton, GlassNav, Section, FeatureGrid and Grid; `motion.tsx` (Reveal, TextScramble, NumberTicker, Marquee, TiltCard, MagneticButton, ScrollTransform), `backgrounds.tsx` (GrainOverlay, DotGrid, LineGrid, Aurora, MaskedStar, BeamLines, BackgroundFrame, DriftingGutters) `hooks.ts` (useInView, useScrollProgress, withViewTransition, withPaintTransition) and `SmoothScroll.tsx` (SmoothScroll, useSmoothScroll, createSmoothScroll, smoothScrollTo and the pure easing and wheel maths). `fonts/` holds the self-hosted Instrument Serif, IBM Plex Sans and IBM Plex Mono woff2 files with their OFL licences, copied to `dist/fonts` by the build. Tokens and rules are scoped under `.uipack-web`. See [web principles](../docs/web-principles.md).
- `static/`: self-contained SVG export, independent of browser interaction.
- `charts/`: HTML/CSS article figures (`uipack/charts`, `uipack/charts.css`). `SpanChart` (`model.ts` validates, groups, sorts and generates the chart's scoped filter rules; `enhance.ts` is the optional script) and `LayerStack`. No JavaScript is needed in the browser, and no Three.js or GSAP. Layout breakpoints come from the data (`spanThresholds`) and reach the stylesheet as custom properties. See [charts](../docs/charts.md).
- `article/`: article parts (`uipack/article`, `uipack/article.css`): `NoteCard` and `NoteCluster` (`NoteCard.tsx`), `LayerHead`, `TermList`, `Callout`, `ChangeNote` and `LinkList` (`parts.tsx`), and pure helpers in `format.ts`. No hooks; the markup is a documented class contract. See [article parts](../docs/article.md).
- `mechanism/`: the Mechanism style (`uipack/mechanism`, `uipack/mechanism.css`): one folder per machine (`gate/`), the shared card (`MechanismFrame.tsx`), `solid3.ts`, and the vendored Anatomy kit in `kit/` (MIT, not edited). See [Mechanism](../docs/mechanism.md).

Follow [agent guidance](../AGENTS.md) and [design direction](../docs/design-direction.md). Never pull Three.js into the default SVG entry. Preserve SSR and static export behaviour. Rebuild `dist/` before committing library changes.

Adding a part, entry, page or machine: the file lists are in [contributing](../docs/contributing.md).
