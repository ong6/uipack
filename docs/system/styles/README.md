# Style specs

Technical is the one implemented style. Landing and Graphical are written specs that fill the same
role contract; an agent builds a new style from a spec by adding one value set in `src/styles`,
registering it in `uiStyles`, and testing it. The `uiStyle` mechanism (`data-ui-style`, the
`uiStyle` prop, `uiStyles` in [`src/style.ts`](../../../src/style.ts)) stays in place with one
registered style, so a second one drops in without component changes.

| Spec | Character | Status |
| --- | --- | --- |
| Technical | Cyanotype: Prussian ink on a cool white sheet, one amber mark, square hairlines, a drafting grid; IBM Plex Sans and Mono | Implemented: [`src/styles/technical.css`](../../../src/styles/technical.css), described in [Style roles](../style.md). The reference for every step below |
| [Landing](landing.md) | Label stock: warm ivory and kraft, one ledger-green accent, Instrument Serif headlines, ruled forms with perforated divisions, no shadows | Written spec |
| [Graphical](graphical.md) | Poster: bone paper, black ink, one signal-orange accent, Anton caps, hard edges, one disc motif | Written spec |

A spec gives every role's light and dark value, the faces with their fallback metrics, the
treatment of each web part, the opt-in layout defaults, contrast results and the do/don't. A new
spec follows the same headings.

## Building a style from a spec

1. **Fill the role contract.** Create `src/styles/<id>.css` with one `[data-ui-style="<id>"]` block
   inside `@layer uipack.tokens` that sets every role Technical sets (the spec's role tables list
   them all). [`src/styles/roles.css`](../../../src/styles/roles.css) declares the layers and resets
   the `--tune-*` hooks; [Style roles](../style.md#the-role-contract) says what each role means.
   Colours are `light-dark(light, dark)` pairs. Never edit Technical's values to get a look.
2. **Fill the treatment slots.** The ornament slots (`--ui-backdrop`, `--ui-marker-*`,
   `--ui-section-rule`, `--ui-frame-*`, `--ui-cta-shadow`…) and the treatment roles (`--ui-perf`,
   `--ui-card-*`, `--ui-num-*`, `--ui-stat-divider`, `--ui-quote-*`, `--ui-plan-featured-*`,
   `--ui-cell-*`, `--ui-window-*`, `--ui-stamp-*`, `--ui-band-*`, `--ui-density`) are values too.
   They never take space, so the style changes how parts are drawn and never where they sit. Add a
   component only if the style adds a part.
3. **Add its faces.** Self-host each new face as a latin-subset woff2 in `src/web/fonts/` with its
   SIL OFL licence file (`OFL-<face>.txt`), an `@font-face` with `font-display: swap` and a
   metric-matched `"<Face> Fallback"` (`size-adjust`, `ascent-override`, `descent-override`,
   `line-gap-override`; the specs give the measured numbers) in `src/web/fonts.css`. A face is
   fetched only when the active style uses it. Update the font tests in `test/web.test.tsx`, which
   list the shipped files and licences.
4. **Register it.** Add the file to `styleFiles` in `scripts/css-bundles.ts`, the id to `UiStyleId`
   and an entry to `uiStyles` in `src/style.ts` (name, summary, `fonts`, the display face to
   `preload`, and the opt-in `prefers` order and `layout` defaults from the spec), and the file to
   `STYLE_FILES` in `test/style-values.ts`.
5. **Test it.**
   - Role completeness: `test/style-roles.test.tsx` fails on a missing core role.
   - Contrast: 4.5:1 for text (ink, ink-2, ink-3 on every ground, accent text, button and band
     labels) and 3:1 for flow and data marks, in both themes (`test/style-roles.test.tsx`).
   - No hex in components: `test/no-hex.test.tsx`; colours live only in `src/styles`.
   - Label fit with the new faces: `e2e/geometry.spec.ts` (text inside node boxes at 1440 and 390,
     the 11px floor) and `e2e/charts.spec.ts`, run with the style applied.
   - Layout equivalence: the same `DeckSlide[]` and the same web page in Technical and the new
     style keep the same regions, columns and reading order.
   - Screenshots of a web page, a deck and a figure at 1440 and 390, light and dark, inspected by
     eye. Compare them with the spec's intent and do/don't before calling it done.
6. **Document it.** Change the spec's status to implemented, add the style to the table above and to
   [Style roles](../style.md), then `npm run build` and commit `dist/`.
