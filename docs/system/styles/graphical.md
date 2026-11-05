# Graphical (written spec)

Graphical is a written style spec, not an implemented style. Technical is the one implemented style
(`src/styles/technical.css`). Landing and Graphical are written specs that fill the same role
contract; an agent builds a new style from a spec by adding one value set in `src/styles`,
registering it in `uiStyles`, and testing it ([how](README.md)).

Graphical shipped as code until 2026-11-06. This page records it completely enough to rebuild it
without that code. The last implementation is in Git history if you want to diff against it:
`git show b71f788:src/styles/graphical.css`.

## Intent

A **poster**: bone paper, black ink, one signal-orange accent, condensed display caps (Anton), hard
edges, 2px rules and hard offset frames. Its one motif is the disc: the hero's stamp is an orange
postmark that carries the page's number, and the disc returns small as every eyebrow marker. Things
land, they do not float.

**Use it for** launches, events and campaigns: a page or deck that should be loud and read from
across a room. **Don't use it for** diagrams-first pages, docs, dense data or long reading: that is
Technical.

**Colour.** Bone `#f1eee6` (dark `#121212`), black ink `#111111` (dark `#f1eee6`), one signal
orange `#f24a00` (dark `#ff6a26`). Orange as a fill is too light for small text on bone (3.2:1), so
text and thin marks in orange use `--ui-accent-ink`, `#b23700` (dark `#ff7f45`). Flows stay in the
poster's three inks (shape still tells them apart): request in ink, response in warm grey, change in
the orange's text tone. No blue beside the orange, except the third data slot.

## Role values

Every role in the contract ([`src/styles/roles.css`](../../../src/styles/roles.css), listed in
[Style roles](../style.md#the-role-contract)), with its exact value. Colours are
`light-dark(light, dark)` pairs. `--ui-line` is solid ink; `--ui-line-soft` is
`color-mix(in srgb, var(--ui-ink) 22%, transparent)`.

**Grounds, ink and lines**

| Role | Light | Dark |
| --- | --- | --- |
| `--ui-paper` | `#f1eee6` | `#121212` |
| `--ui-surface` | `#fbfaf6` | `#1b1b1b` |
| `--ui-surface-raised` | `#ffffff` | `#222222` |
| `--ui-surface-2` | `#e6e1d3` | `#262420` |
| `--ui-ink` | `#111111` | `#f1eee6` |
| `--ui-ink-2` | `#363532` | `#cfcbc0` |
| `--ui-ink-3` | `#57554f` | `#a29e93` |
| `--ui-line` | `#111111` | `#f1eee6` |
| `--ui-line-soft` | `color-mix(in srgb, var(--ui-ink) 22%, transparent)` | same |
| `--ui-node` | `var(--ui-surface)` | same |
| `--ui-line-solid` | `var(--ui-line)` | same |

**Accent and emphasis**

| Role | Light | Dark |
| --- | --- | --- |
| `--ui-accent` | `#f24a00` | `#ff6a26` |
| `--ui-accent-stroke` | `var(--ui-accent)` | same |
| `--ui-accent-ink` | `#b23700` | `#ff7f45` |
| `--ui-on-accent` | `#111111` | `#111111` |
| `--ui-accent-surface` | `#ff6a26` | `#ff8247` |
| `--ui-accent-ink-2` | `#2b1406` | `#2b1406` |
| `--ui-accent-line` | `#111111` | `#111111` |
| `--ui-cta-fill` | `var(--ui-accent)` | same |
| `--ui-on-cta` | `var(--ui-on-accent)` | same |
| `--ui-em-style` | `normal` | same |
| `--ui-em-color` | `var(--ui-accent-ink)` | same |
| `--ui-em-decoration` | `none` | same |

**Flows, data and alerts**

| Role | Light | Dark |
| --- | --- | --- |
| `--ui-flow-request` | `#111111` | `#f1eee6` |
| `--ui-flow-response` | `#57554f` | `#a29e93` |
| `--ui-flow-change` | `#b23700` | `#ff7f45` |
| `--ui-flow-error` | `#c8102e` | `#ff6b5e` |
| `--ui-web-flow-request` | `var(--ui-flow-request)` | same |
| `--ui-data-pos` | `#14805a` | `#33a979` |
| `--ui-data-neg` | `#c0174f` | `#ff6b93` |
| `--ui-data-neg-ink` | `var(--ui-data-neg)` | same |
| `--ui-data-context` | `#8f8b80` | `#6a675f` |
| `--ui-data-1` | `#f24a00` | `#ff6a26` |
| `--ui-data-2` | `#111111` | `#f1eee6` |
| `--ui-data-3` | `#2348e0` | `#7f97ff` |
| `--ui-data-4` | `#8f8b80` | `#8a867b` |
| `--ui-on-data-1` | `#111111` | `#111111` |
| `--ui-on-data-2` | `#f1eee6` | `#111111` |
| `--ui-on-data-3` | `#ffffff` | `#111111` |
| `--ui-on-data-4` | `#111111` | `#111111` |
| `--ui-alert` | `#c0174f` | `#ff6b93` |
| `--ui-warn` | `#8a5a00` | `#ffb347` |

**Invert (deck `invert`, `tone="ink"`, the quote card)**

| Role | Light | Dark |
| --- | --- | --- |
| `--ui-inv-paper` | `#111111` | `#f1eee6` |
| `--ui-inv-surface` | `#1e1e1e` | `#ffffff` |
| `--ui-inv-node` | `var(--ui-inv-surface)` | same |
| `--ui-inv-ink` | `#f1eee6` | `#111111` |
| `--ui-inv-ink-2` | `#cfcbc0` | `#363532` |
| `--ui-inv-line` | `#f1eee6` | `#111111` |
| `--ui-inv-accent` | `#ff6a26` | `#c74000` |

**Closing band (`ClosingCta`)**

| Role | Light | Dark |
| --- | --- | --- |
| `--ui-band-fill` | `#ff6a26` | `#ff8247` |
| `--ui-band-ink` | `#111111` | `#111111` |
| `--ui-band-ink-2` | `#2b1406` | `#2b1406` |
| `--ui-band-cta` | `#111111` | `#111111` |
| `--ui-on-band-cta` | `#f1eee6` | `#f1eee6` |
| `--ui-band-pattern` | `repeating-linear-gradient(90deg, var(--ui-band-ink) 0 2px, transparent 2px 14px) 0 0 / 100% 16px no-repeat` | same |

**Type**

| Role | Value |
| --- | --- |
| `--ui-font-display` | `"Anton", "Anton Fallback", Impact, "Arial Narrow", sans-serif-condensed, sans-serif` |
| `--ui-font-text` | `"IBM Plex Sans", "IBM Plex Sans Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |
| `--ui-font-label` | `"IBM Plex Mono", "IBM Plex Mono Fallback", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` |
| `--ui-font-heading` | `var(--ui-font-text)` |
| `--ui-display-weight` | `400` |
| `--ui-display-tracking` | `0.012em` |
| `--ui-display-case` | `uppercase` |
| `--ui-display-scale` | `1.3` |
| `--ui-label-tracking` | `0.12em` |
| `--ui-slide-font-display` | `var(--ui-font-display)` |
| `--ui-slide-font-text` | `var(--ui-font-text)` |
| `--ui-slide-font-label` | `var(--ui-font-label)` |
| `--ui-web-font-display` | `var(--ui-font-display)` |
| `--ui-web-font-text` | `var(--ui-font-text)` |
| `--ui-web-font-label` | `var(--ui-font-label)` |

**Shape, scalars and motion**

| Role | Value |
| --- | --- |
| `--ui-radius` | `0px` |
| `--ui-radius-sm` | `0px` |
| `--ui-radius-xs` | `0px` |
| `--ui-radius-pill` | `0px` |
| `--ui-stroke` | `2` |
| `--ui-rule-width` | `2px` |
| `--ui-density` | `0.95` |
| `--ui-type-ratio` | `1.25` |
| `--ui-measure` | `60ch` |
| `--ui-ease-settle` | `cubic-bezier(0.3, 0.9, 0.2, 1)` |
| `--ui-ease-travel` | `cubic-bezier(0.7, 0, 0.2, 1)` |
| `--ui-dur-quick` | `120ms` |
| `--ui-dur-base` | `240ms` |
| `--ui-dur-slow` | `480ms` |

**Ornament slots**

| Role | Value |
| --- | --- |
| `--ui-backdrop` | `none` |
| `--ui-backdrop-mask` | `none` |
| `--ui-backdrop-narrow` | `none` |
| `--ui-canvas-pattern` | `radial-gradient(var(--ui-line-soft) 1px, transparent 1.2px) 0 0 / 12px 12px` |
| `--ui-marker-size` | `12px` |
| `--ui-marker-shape` | `50%` |
| `--ui-marker-color` | `var(--ui-accent)` |
| `--ui-section-index` | `none` |
| `--ui-section-rule` | `inset 0 2px 0 var(--ui-ink)` |
| `--ui-corner-marks` | `none` |
| `--ui-column-rule` | `none` |
| `--ui-column-rule-gap` | `0px` |
| `--ui-frame-border` | `2px solid var(--ui-ink)` |
| `--ui-frame-shadow` | `6px 6px 0 var(--ui-ink)` |
| `--ui-card-shadow` | `6px 6px 0 var(--ui-ink)` |
| `--ui-nav-fill` | `var(--ui-paper)` |
| `--ui-nav-blur` | `none` |
| `--ui-grain` | `0` |
| `--ui-glow` | `0` |
| `--ui-star-fill` | `0` |
| `--ui-cta-shadow` | `4px 4px 0 var(--ui-ink)` |
| `--ui-cta-shadow-hover` | `6px 6px 0 var(--ui-ink)` |

**Treatment: cards, step numbers, stats**

| Role | Value |
| --- | --- |
| `--ui-perf` | `solid` |
| `--ui-card-fill` | `var(--ui-surface)` |
| `--ui-card-pad` | `1.75rem` |
| `--ui-num-font` | `var(--ui-font-display)` |
| `--ui-num-size` | `4rem` |
| `--ui-num-weight` | `400` |
| `--ui-num-prefix` | `""` |
| `--ui-num-pad` | `none` |
| `--ui-num-rule` | `0 solid transparent` |
| `--ui-num-color` | `var(--ui-accent-ink)` |
| `--ui-num-fill` | `transparent` |
| `--ui-num-ring` | `none` |
| `--ui-num-box` | `auto` |
| `--ui-num-display` | `block` |
| `--ui-num-bleed` | `0` |
| `--ui-num-gap` | `0px` |
| `--ui-stat-divider` | `2px solid var(--ui-ink)` |

**Treatment: quote, featured plan, product cells, windows**

| Role | Value |
| --- | --- |
| `--ui-quote-fill` | `var(--ui-accent)` |
| `--ui-quote-ink` | `var(--ui-on-accent)` |
| `--ui-quote-ink-2` | `var(--ui-accent-ink-2)` |
| `--ui-quote-line` | `var(--ui-on-accent)` |
| `--ui-quote-mark` | `var(--ui-on-accent)` |
| `--ui-quote-face` | `var(--ui-font-display)` |
| `--ui-quote-weight` | `400` |
| `--ui-quote-case` | `uppercase` |
| `--ui-quote-size` | `2.25rem` |
| `--ui-quote-rule` | `0 0 transparent` |
| `--ui-quote-shadow` | `8px 8px 0 var(--ui-ink)` |
| `--ui-plan-featured-border` | `var(--ui-ink)` |
| `--ui-plan-featured-ring` | `8px 8px 0 var(--ui-accent)` |
| `--ui-plan-featured-fill` | `var(--ui-surface)` |
| `--ui-cell-fill` | `var(--ui-surface)` |
| `--ui-cell-ink` | `var(--ui-ink)` |
| `--ui-cell-line` | `var(--ui-ink)` |
| `--ui-cell-peak` | `var(--ui-accent)` |
| `--ui-on-cell-peak` | `var(--ui-on-accent)` |
| `--ui-cell-off-ink` | `var(--ui-ink-3)` |
| `--ui-cell-radius` | `0px` |
| `--ui-window-dots` | `flex` |
| `--ui-window-bar` | `var(--ui-surface-2)` |

**Stamp (`StarHero stamp`)**

| Role | Value |
| --- | --- |
| `--ui-stamp-fill` | `var(--ui-accent)` |
| `--ui-stamp-ink` | `var(--ui-on-accent)` |
| `--ui-stamp-accent` | `var(--ui-on-accent)` |
| `--ui-stamp-border` | `2px solid var(--ui-ink)` |
| `--ui-stamp-inner` | `2px solid var(--ui-ink)` |
| `--ui-stamp-radius` | `50%` |
| `--ui-stamp-rotate` | `-8deg` |
| `--ui-stamp-face` | `var(--ui-font-display)` |
| `--ui-stamp-case` | `uppercase` |
| `--ui-stamp-size` | `3.25rem` |
| `--ui-stamp-shadow` | `6px 6px 0 var(--ui-ink)` |

## Type

| Role | Face | Weights and files | Used for |
| --- | --- | --- | --- |
| Display | Anton, in caps | 400 (`anton-latin-400-normal.woff2`, 18 KB) | Web headings at steps 4–6 (at 1.3× the scale), big numbers, step numerals, the quote, the stamp, the wordmark, slide headlines |
| Text | IBM Plex Sans | 400 / 500 / 600 | Body, subheads, buttons, nav, headings at steps 0–3, figure titles (`--ui-font-heading` is the text face) |
| Label | IBM Plex Mono | 400 / 600 | Eyebrows, labels and data, tracked 0.12em |

- **Display setting.** `--ui-display-case: uppercase`, tracking +0.012em, weight 400 (Anton's only
  weight; no synthesised bold), `--ui-display-scale: 1.3` on steps 4–6 only. Steps and leading are
  the shared web scale (step 6 at 61px × 1.3, leading 1.02; step 5 1.05; step 4 1.1; narrow
  containers drop a step).
- **Emphasis** in a display headline is colour, not italic: `--ui-em-style: normal`,
  `--ui-em-color: var(--ui-accent-ink)`. Anton ships no italic; never synthesise one.
- **Never in a figure.** Figure text stays at label sizes in Plex; a figure's title takes the text
  face. Anton is too condensed for 11–13px labels.
- **Fallback.** Self-host the woff2 (latin subset from Fontsource, SIL OFL 1.1; the licence file was
  `src/web/fonts/OFL-anton.txt`) with `font-display: swap` and this metric-matched fallback,
  measured on caps and figures because the face is set in caps:

  ```css
  @font-face {
    font-family: "Anton Fallback";
    src: local("Impact"), local("Impact Regular");
    size-adjust: 95.67%;
    ascent-override: 122.95%;
    descent-override: 34.4%;
    line-gap-override: 0%;
  }
  ```

  The display stack was `"Anton", "Anton Fallback", Impact, "Arial Narrow", sans-serif-condensed,
  sans-serif`. Plex Sans and Plex Mono reuse Technical's fallbacks already in `src/web/fonts.css`.
- **Files and preload.** Six files, 119 KB: Anton plus Technical's five Plex files. Preload Anton
  only, at 720px and wider.

## Treatment

How Graphical draws the shared web parts, through the treatment roles above. None of it moves a box.

| Part | Graphical draws it as |
| --- | --- |
| Section | Density 0.95; each section after the first opens on a 2px full-bleed ink rule; no column rule, no section index |
| Eyebrow marker | A 12px orange disc before each eyebrow (the stamp's disc, small) |
| Internal divisions | Solid (`--ui-perf: solid`) |
| Cards (steps, features) | Surface fill, 1.75rem padding, a 2px ink border, a hard 6px × 6px ink offset shadow, 0 radius |
| Step numbers (`FeatureGrid numbered`) | A giant Anton numeral at 4rem in the orange text tone; no prefix, no rule, no ring |
| Stats (`Proof`) | Between 2px ink rules |
| Quote | An orange poster block: accent fill, ink text, Anton caps at 2.25rem, ink quote mark and rule, an 8px × 8px hard ink shadow |
| Featured plan | A 2px ink border and an 8px × 8px orange offset shadow; plain surface fill |
| Product cells (`DataTable`, `ScheduleGrid`, chips, worked rules) | Ink-ruled boxes: surface fill, solid ink lines, 0 radius, orange peaks with ink text |
| Windows (`ProductWindow`, `DemoPlayer`) | Square window dots on a surface-2 bar |
| Buttons | Orange fill, ink label, 0 radius, a hard 4px ink offset shadow that grows to 6px on hover |
| Nav | Solid paper, no blur |
| Stamp (`StarHero stamp`) | A postmark: an orange disc with a 2px ink border and a second 2px ink inner ring, the number in Anton caps at 3.25rem, tilted −8°, a hard 6px ink shadow |
| Closing band | Orange (`#ff6a26`; dark `#ff8247`) with ink type, an ink button with a bone label, and the hero's tick rule along the top (2px ink ticks every 14px, 16px tall) |
| Ornaments | No backdrop (the disc is the stamp now), no grain, no glow, no corner marks, no star fill (`--ui-star-fill: 0`) |
| Figure canvas | A 12px dot grid at 22% ink |
| Motion | Poster motion: settle `cubic-bezier(0.3, 0.9, 0.2, 1)`, travel `cubic-bezier(0.7, 0, 0.2, 1)`, 120 / 240 / 480ms |

## Layout defaults (opt-in)

A page keeps its author's order in every style. If Graphical is registered, these are the values for
its `uiStyles` entry, used only when a page opts in with `WebPage layout="style"`:

- `prefers`: hero → proof (big numbers) → how → mechanism → pricing → FAQ.
- `layout`: `{ hero: "demo", align: "center", steps: "cards" }`.

## Figures, slides, charts and 3D

- **Figures on a Graphical page** take Plex text and labels, the 2px ink frame with the hard 6px
  shadow and the square radius; flows are ink, warm grey and orange, so a figure never carries
  Technical's blue. Figures kept their own 6px node radius inside the square frame (rounded boxes in
  a square card); square the nodes if that reads wrong.
- **Slides** take Anton caps for headlines (`--ui-slide-font-display`). The 1.3× display scale is a
  web role; slides keep the deck's canvas sizes. A deck never mixes styles between slides.
- **Charts** read the data roles: orange, ink, blue `#2348e0` and grey as the four categorical
  slots, green `#14805a` positive, crimson `#c0174f` negative. Consulting charts and bento decks
  passed the layout swap test but never had a visual review, and dense chart labels with Anton
  headlines were never checked. TODO: check both when Graphical is rebuilt.
- **3D and Mechanism.** WebGL scenes do not follow Graphical: their palettes in
  `src/styles/scene-palettes.ts` are Technical's, and a 3D art direction is its own style. Mechanism
  tones, the Studio stage and docs surfaces were derived from Graphical's core roles.

## Contrast

Computed with the WCAG 2 formula from the values above (2026-11-06).

| Pair | Light | Dark |
| --- | --- | --- |
| ink / ink-2 / ink-3 on paper | 16.3 / 10.6 / 6.4 | 16.2 / 11.6 / 7.0 |
| ink-3 on surface-2 (the lowest text pair) | 5.7 | 5.8 |
| accent fill on paper | 3.2 (fill and large marks only) | 6.6 |
| accent-ink on paper (orange as text) | 5.3 | 7.5 |
| on-accent on accent (button, quote, stamp) | 5.2 | 6.6 |
| band ink / band ink-2 on the band | 6.6 / 6.1 | 7.7 / 7.1 |
| button label on the band button | 16.3 | 16.3 |
| inverted ink / inverted accent | 16.3 / 6.6 | 16.3 / 4.4 |

Marks against the surface (3:1 for graphical objects): request 18.1 / 14.9, response 7.1 / 6.4,
change 5.9 / 6.9, error 5.6 / 6.2, data positive 4.7 / 5.8, data-4 grey 3.3 / 4.7. The dark
inverted accent (`#c74000` on bone, 4.4:1) is under 4.5:1: use it for large text and marks only, or
darken it slightly when rebuilding (TODO).

## Do and don't

Do:

- Set display type big, in caps, and let one orange thing per unit carry the point.
- Use hard edges: 0 radius, 2px ink rules, hard offset shadows with no blur.
- Use `--ui-accent-ink` whenever orange is text or a thin line on bone.
- Keep the disc as the one motif: the stamp, then the eyebrow markers.

Don't:

- Add purple, gradient blobs, glass, glow, blur, grain, emoji icons or rounded corners. Graphical
  avoids the generic-AI tropes on purpose.
- Put Anton in a figure, a label or body copy, or set it in lower case.
- Add a second accent or a second motif.

## Measured before

Lighthouse 13.5 mobile on the built playground, median of 3, 2026-11-04: LCP 2.42 s, 119 KB of
fonts in 6 files, CLS 0. The stamp and treatment roles came after that run. TODO: measure LCP and
CLS again when Graphical is rebuilt.
