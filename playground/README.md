# Library playground

Run `npm run dev` from the repo root. Pages:

- `/`: figures and presets.
- `/assets`: searchable primitives and static assets.
- `/animations`: 3D animation collection, search, and technique filters. `/slides` is a compatibility alias.
- `/presentations`: complete five-chapter narrative composition example.
- `/styles`: visual-language catalog (Technical is implemented).

`ShowcaseShell.tsx` owns shared navigation/theme handling. `showcase.css` owns page tokens and layout. `catalog.ts` owns type/style/tag metadata. Collection pages must not introduce another header or global styles.

To add an animation, export a validated story from `src/slides`, register metadata in `catalog.ts`, and add it to the story list. To add a visual style, follow [the design contract](../docs/design-direction.md); metadata alone does not implement a style.

Presentation layouts belong in `CatalogPages.tsx` and `presentations.css` until there are enough reusable examples to extract a separate library API. Keep 3D assets independent from those layouts.

Object scenes also appear in `/animations` under the Objects filter. Add source metadata to `src/objects/index.tsx`; `catalog.ts` registers those entries.
