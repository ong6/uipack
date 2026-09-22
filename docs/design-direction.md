# Design direction

## The product structure

UIPACK is a library of reusable visual explanations. The browser organizes two independent axes:

| Axis | Values |
| --- | --- |
| Content type | Figures, Assets, 3D animations, Presentations |
| Visual style | Technical diagrams; Studio, Paper, Kinetic, Cartoon, Realistic and Abstract for 3D objects |

The Styles collection is the index of visual languages. Light and dark are themes within a style. Do not use “slides” as the name for all 3D content. The existing `uipack/slides` API and `/slides` URL remain compatibility paths.

`playground/catalog.ts` owns gallery metadata. An animation entry has an ID, title, content type, style ID, and tags. Search and technique filters read metadata instead of relying on array indices. A new collection should reuse the shared shell. A future style should add its own registry entry, renderer or component mapping, scoped stylesheet, and examples. Register a style only when that implementation exists. The shell keeps its Technical navigation language. Object scenes additionally implement Studio, Paper, Kinetic, Cartoon, Realistic and Abstract art directions, each with separate geometry and scoped stage tokens.

## Technical style

- Light: warm off-white page (`#f6f5f1`), white figure surfaces, near-black ink (`#1a1c1a`), forest accent (`#205f49`).
- Dark: near-black green page (`#0a100d`), forest surfaces (`#0e1512`, `#14201b`), pale ink (`#e8ece9`), mint accent (`#71dcb2`).
- Blue squares mean requests, green circles mean responses, violet diamonds mean changes. Preserve shape as well as colour.
- System sans for titles and explanation; system monospace for metadata, IDs, and controls where appropriate. No font network requests.
- One shared page width, header, navigation, theme control, and active-page indicator. Theme survives navigation and reload through URL parameters.
- Restrained borders and small radii. Glow is a selection signal, never ambient decoration. Text and selected state explain the same thing without relying on glow.

## Interaction and mobile

Click or tap a semantic component to select it. Enter/Space do the same. Selecting another item replaces the selection; repeat activation, Clear selection, or the empty canvas clears it. Nodes with href retain normal navigation. Node, Chip, and Group support selection; lines, lane headings, and motion tokens remain explanatory marks rather than artificial buttons.

Use authored stacked drawings below 720px where available. Dense drawings without a narrow alternative keep a readable internal width with horizontal scrolling. Opening a canvas offers a wide drawing with zoom and scroll. Expanded canvases support trackpad and touch pinch zoom, preserve native scrolling, and expose keyboard zoom/reset. Figure zoom stays anchored to the pointer; 3D zoom uses the authored camera target. Free 3D orbit is not implemented. Check page overflow, label sizes, clipping, control reachability, focus, and reduced motion at 390px.

Canvas is an inspection workspace, distinct from the presentation layout. It uses a native modal dialog, contains focus, closes with Escape, and returns focus to the opener. A figure or renderer may remount when entering/exiting it; it is not a second simultaneous copy of the SVG IDs or GPU scene. Presentation mode remains an in-page full-window view.

## Presentation composition

Use a sequence with a point, not a succession of spinning objects:

1. Opening: one thesis and generous whitespace.
2. Argument: the problem, constraints, or three supporting points.
3. Explanation: a labelled figure or 3D scene with short narration.
4. Comparison: explicit before/after statements and their consequences.
5. Closing: a takeaway and a concrete next decision.

The Presentations collection demonstrates this sequence. It is an editable code example, not a deck editor, export engine, or template marketplace. Keep one scene mounted across chapter transitions when possible. Never put every paragraph into the scene's labels.

## Acceptance

Inspect both light/dark and desktop/mobile in a browser. Verify touch/keyboard selection, modal focus return, zoom bounds, internal scrolling, live 3D fallback, and reduced motion. Report tested behaviour separately from visual judgement. A passing screenshot or test is not permission to deploy.
