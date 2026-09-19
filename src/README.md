# Library source

- Root components and `theme.css`: SVG figures and primitives.
- `selection.tsx`: persistent semantic selection within Figure.
- `canvas-gestures.ts`: scoped trackpad/touch inputs, anchored SVG zoom, bounded camera zoom, and reset.
- `CanvasView.tsx` and `canvas.css`: shared modal canvas workspace. Build appends its CSS to both distributed theme files.
- `presets/`: typed SVG scene builders with wide and narrow drawings.
- `slides/`: optional Three.js/GSAP animations; public compatibility entry `uipack/slides`.
- `browser/`: searchable asset browser.
- `static/`: self-contained SVG export, independent of browser interaction.

Follow [agent guidance](../AGENTS.md) and [design direction](../docs/design-direction.md). Never pull Three.js into the default SVG entry. Preserve SSR and static export behaviour. Rebuild `dist/` before committing library changes.
