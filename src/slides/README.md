# 3D animations

The folder and `uipack/slides` export retain their original names for compatibility; the gallery calls this collection 3D animations.

- `types.ts`: serializable story, node, stop, and transition contracts.
- `stories.ts`: supplied animation examples.
- `model.ts`: validation and palettes.
- `renderer.ts`: Three.js resources, camera/object timelines, projected labels, selection lighting, zoom, and cleanup.
- `SlidePlayer.tsx`: scene mounting, fallback, selection controls, canvas, presentation navigation.
- `slides.css`: component styling; keep all selectors scoped.

Use `SlideScene` inside full slide layouts and `SlidePlayer` for a self-contained guided animation. Read [API docs](../../docs/slides.md), [interaction docs](../../docs/interaction.md), and [design direction](../../docs/design-direction.md).
