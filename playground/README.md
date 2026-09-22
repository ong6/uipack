# Library playground

Run `npm run dev` from the repo root. Pages:

- `/`: figures and presets.
- `/assets`: searchable primitives and static assets.
- `/animations`: 3D animation collection, search, and technique filters. `/slides` is a compatibility alias.
- `/presentations`: complete five-chapter narrative composition example.
- `/styles`: visual-language catalog (Technical plus six object art directions).

`ShowcaseShell.tsx` owns shared navigation/theme handling. `showcase.css` owns page tokens and layout. `catalog.ts` owns type/style/tag metadata. Collection pages must not introduce another header or global styles.

To add an animation, export a validated story from `src/slides`, register metadata in `catalog.ts`, and add it to the story list. To add a visual style, follow [the design contract](../docs/design-direction.md); metadata alone does not implement a style.

Presentation layouts belong in `CatalogPages.tsx` and `presentations.css` until there are enough reusable examples to extract a separate library API. Keep 3D assets independent from those layouts.

Object scenes also appear in `/animations` under the Objects filter. Add source metadata to `src/objects/index.tsx`; `catalog.ts` registers those entries.

For reproducible object reviews, use /animations?story=travel&variant=0 (variants 0–5). The hobby variants select Studio, Paper, Kinetic, Cartoon, Realistic and Abstract. Use the named selector to compare all six hobbies.

The animation collection uses a scene library beside a single preview and style inspector.
Original looks are nested under Studio edition (`edition=0..2`), separate from art direction.
On narrow screens the library becomes a horizontal list and the inspector moves below the preview.

Contact additionally offers Cartoon (variant 3) and Kinetic (variant 4), preserving legacy inbox finishes 0–2. Kinetic Open book makes a complete 12-second rotation.
