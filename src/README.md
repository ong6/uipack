# Library source

- Root components and `theme.css`: SVG figures and primitives.
- `selection.tsx`: persistent semantic selection within Figure.
- `canvas-gestures.ts`: scoped trackpad/touch inputs, anchored SVG zoom, bounded camera zoom, and reset.
- `CanvasView.tsx` and `canvas.css`: shared modal canvas workspace. Build appends its CSS to both distributed theme files.
- `presets/`: typed SVG scene builders with wide and narrow drawings.
- `slides/`: optional Three.js/GSAP animations; public compatibility entry `uipack/slides`.
- `presentations/`: generic Opening, Explanation, and System slide layouts with speaker guides and SVG output (`uipack/presentations`).
- `browser/`: searchable asset browser.
- `web/`: Landing-style web building blocks (`uipack/web`, `uipack/web.css`): DemoPlayer and its pure timeline, StarHero, SpotlightCard, RevealText, text hierarchy, CtaButton, GlassNav, Section, FeatureGrid and Grid; `motion.tsx` (Reveal, TextScramble, NumberTicker, Marquee, TiltCard, MagneticButton, ScrollTransform), `backgrounds.tsx` (GrainOverlay, DotGrid, LineGrid, Aurora, MaskedStar, BeamLines, BackgroundFrame, DriftingGutters) and `hooks.ts` (useInView, useScrollProgress, withViewTransition, withPaintTransition). Tokens and rules are scoped under `.uipack-web`. See [web principles](../docs/web-principles.md).
- `static/`: self-contained SVG export, independent of browser interaction.

Follow [agent guidance](../AGENTS.md) and [design direction](../docs/design-direction.md). Never pull Three.js into the default SVG entry. Preserve SSR and static export behaviour. Rebuild `dist/` before committing library changes.

- `objects/`: lazy procedural and Blender-authored objects, curated variations, accessible playback, and fallback illustrations (`uipack/objects`).
