# Landing (written spec)

Landing is a written style spec, not an implemented style. Technical is the one implemented style
(`src/styles/technical.css`). Landing and Graphical are written specs that fill the same role
contract; an agent builds a new style from a spec by adding one value set in `src/styles`,
registering it in `uiStyles`, and testing it ([how](README.md)).

Landing shipped as code until 2026-11-06. This page records it completely enough to rebuild it
without that code. The last implementation is in Git history if you want to diff against it:
`git show b71f788:src/styles/landing.css`.

## Intent

Product marketing in **label stock**: a page that reads as considered print, not stock SaaS and not
Technical's engineering drawing. Warm ivory paper, a kraft secondary band, warm near-black ink and
one deep ledger-green accent. Editorial serif headlines from heading step 4. Parts are printed
forms, not floating cards: 1px ink rules, 4px corners, no drop shadows and no glow. Internal
divisions are perforations (dashed rules). Steps are numbered stubs ("No. 1") torn off along a
perforation, stats are serif figures between perforated rules, the quote is a pull quote on a green
rule, the featured plan is the green-tinted ticket, buttons are square-cornered ink keys and the
hero stamp is a die-cut label.

**Use it for** a product-marketing or landing page whose brief asks for warmth and an editorial
voice, where Technical's blueprint would read as too engineered. **Don't use it for** diagrams,
docs, decks about systems or anything that should look like the owner's site figures: that is
Technical.

**Colour split (60 / 30 / 10).** Ivory 60% (`--ui-paper`, `#f6f2e8` / `#14130f`), kraft 30%
(`--ui-surface-2`, `#ece5d4` / `#221f19`), ledger green 10% (`--ui-accent`, `#1d5a43` /
`#8fd1ad`), reserved for calls to action and the hero's star. No blue anywhere: Technical owns the
cool palette, so even the request flow is a warm slate.

## Role values

Every role in the contract ([`src/styles/roles.css`](../../../src/styles/roles.css), listed in
[Style roles](../style.md#the-role-contract)), with its exact value. Colours are
`light-dark(light, dark)` pairs. `ink-2`, `ink-3`, `line` and `line-soft` are mixes of the ink, not
hex: `color-mix(in srgb, var(--ui-ink) 87%, transparent)` and so on, so they follow both themes.

**Grounds, ink and lines**

| Role | Light | Dark |
| --- | --- | --- |
| `--ui-paper` | `#f6f2e8` | `#14130f` |
| `--ui-surface` | `#fffdf7` | `#1c1a15` |
| `--ui-surface-raised` | `#ffffff` | `#23211b` |
| `--ui-surface-2` | `#ece5d4` | `#221f19` |
| `--ui-ink` | `#1d1a15` | `#f2ece0` |
| `--ui-ink-2` | `color-mix(in srgb, var(--ui-ink) 87%, transparent)` | same |
| `--ui-ink-3` | `color-mix(in srgb, var(--ui-ink) 66%, transparent)` | same |
| `--ui-line` | `color-mix(in srgb, var(--ui-ink) 30%, transparent)` | same |
| `--ui-line-soft` | `color-mix(in srgb, var(--ui-ink) 14%, transparent)` | same |
| `--ui-node` | `var(--ui-surface)` | same |
| `--ui-line-solid` | `var(--ui-line)` | same |

**Accent and emphasis**

| Role | Light | Dark |
| --- | --- | --- |
| `--ui-accent` | `#1d5a43` | `#8fd1ad` |
| `--ui-accent-stroke` | `var(--ui-accent)` | same |
| `--ui-accent-ink` | `var(--ui-accent)` | same |
| `--ui-on-accent` | `#fffdf7` | `#14130f` |
| `--ui-accent-surface` | `#246b50` | `#a6dcbf` |
| `--ui-accent-ink-2` | `#dcebe2` | `#173b2d` |
| `--ui-accent-line` | `#5f9a80` | `#5e9c7f` |
| `--ui-cta-fill` | `var(--ui-accent)` | same |
| `--ui-on-cta` | `var(--ui-on-accent)` | same |
| `--ui-em-style` | `italic` | same |
| `--ui-em-color` | `var(--ui-accent-ink)` | same |
| `--ui-em-decoration` | `none` | same |

**Flows, data and alerts**

| Role | Light | Dark |
| --- | --- | --- |
| `--ui-flow-request` | `#5f5a52` | `#a39d92` |
| `--ui-flow-response` | `#3a9a6c` | `#5fd39b` |
| `--ui-flow-change` | `#9a63e0` | `#c39aff` |
| `--ui-flow-error` | `#b8341f` | `#ff8a7a` |
| `--ui-web-flow-request` | `var(--ui-flow-request)` | same |
| `--ui-data-pos` | `#1d6b4c` | `#3fb07f` |
| `--ui-data-neg` | `#b8452b` | `#d4623f` |
| `--ui-data-neg-ink` | `var(--ui-data-neg)` | same |
| `--ui-data-context` | `#8f897d` | `#6f6a60` |
| `--ui-data-1` | `#1d5a43` | `#8fd1ad` |
| `--ui-data-2` | `#a8571c` | `#d99a55` |
| `--ui-data-3` | `#5f5a52` | `#a39d92` |
| `--ui-data-4` | `#7a5c99` | `#b89ad6` |
| `--ui-on-data-1` | `#ffffff` | `#14130f` |
| `--ui-on-data-2` | `#ffffff` | `#14130f` |
| `--ui-on-data-3` | `#ffffff` | `#14130f` |
| `--ui-on-data-4` | `#ffffff` | `#14130f` |
| `--ui-alert` | `#b42318` | `#ff8a7a` |
| `--ui-warn` | `#b4471f` | `#f08a5d` |

**Invert (deck `invert`, `tone="ink"`, the quote card)**

| Role | Light | Dark |
| --- | --- | --- |
| `--ui-inv-paper` | `#1d1a15` | `#f2ece0` |
| `--ui-inv-surface` | `#26231d` | `#fffdf7` |
| `--ui-inv-node` | `var(--ui-inv-surface)` | same |
| `--ui-inv-ink` | `#f2ece0` | `#1d1a15` |
| `--ui-inv-ink-2` | `#c4bcad` | `#4f4a41` |
| `--ui-inv-line` | `#4a453c` | `#c9c1b2` |
| `--ui-inv-accent` | `#8fd1ad` | `#1d5a43` |

**Closing band (`ClosingCta`)**

| Role | Light | Dark |
| --- | --- | --- |
| `--ui-band-fill` | `#1d5a43` | `#173b2d` |
| `--ui-band-ink` | `#f6f2e8` | `#f2ece0` |
| `--ui-band-ink-2` | `#cfe3d7` | `#c3d9cb` |
| `--ui-band-cta` | `#f6f2e8` | `#f2ece0` |
| `--ui-on-band-cta` | `#1d1a15` | `#14130f` |
| `--ui-band-pattern` | `repeating-linear-gradient(90deg, color-mix(in srgb, var(--ui-band-ink) 55%, transparent) 0 6px, transparent 6px 12px) 0 12px / 100% 1px no-repeat` | same |

**Type**

| Role | Value |
| --- | --- |
| `--ui-font-display` | `"Instrument Serif", "Instrument Serif Fallback", ui-serif, Georgia, "Times New Roman", serif` |
| `--ui-font-text` | `"IBM Plex Sans", "IBM Plex Sans Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |
| `--ui-font-label` | `"IBM Plex Mono", "IBM Plex Mono Fallback", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` |
| `--ui-font-heading` | `var(--ui-font-text)` |
| `--ui-display-weight` | `400` |
| `--ui-display-tracking` | `-0.01em` |
| `--ui-display-case` | `none` |
| `--ui-display-scale` | `1.05` |
| `--ui-label-tracking` | `0.08em` |
| `--ui-slide-font-display` | `var(--ui-font-display)` |
| `--ui-slide-font-text` | `var(--ui-font-text)` |
| `--ui-slide-font-label` | `var(--ui-font-label)` |
| `--ui-web-font-display` | `var(--ui-font-display)` |
| `--ui-web-font-text` | `var(--ui-font-text)` |
| `--ui-web-font-label` | `var(--ui-font-label)` |

**Shape, scalars and motion**

| Role | Value |
| --- | --- |
| `--ui-radius` | `4px` |
| `--ui-radius-sm` | `4px` |
| `--ui-radius-xs` | `2px` |
| `--ui-radius-pill` | `3px` |
| `--ui-stroke` | `1.25` |
| `--ui-rule-width` | `1px` |
| `--ui-density` | `1` |
| `--ui-type-ratio` | `1.25` |
| `--ui-measure` | `65ch` |
| `--ui-ease-settle` | `cubic-bezier(0.2, 0.7, 0.2, 1)` |
| `--ui-ease-travel` | `cubic-bezier(0.55, 0, 0.15, 1)` |
| `--ui-dur-quick` | `160ms` |
| `--ui-dur-base` | `320ms` |
| `--ui-dur-slow` | `560ms` |

**Ornament slots**

| Role | Value |
| --- | --- |
| `--ui-backdrop` | `none` |
| `--ui-backdrop-mask` | `none` |
| `--ui-backdrop-narrow` | `none` |
| `--ui-canvas-pattern` | `linear-gradient(var(--ui-line-soft) 1px, transparent 1px) 0 0 / 100% 24px` |
| `--ui-marker-size` | `0px` |
| `--ui-marker-shape` | `0px` |
| `--ui-marker-color` | `transparent` |
| `--ui-section-index` | `none` |
| `--ui-section-rule` | `inset 0 1px 0 var(--ui-line-soft)` |
| `--ui-corner-marks` | `none` |
| `--ui-column-rule` | `none` |
| `--ui-column-rule-gap` | `0px` |
| `--ui-frame-border` | `1px solid var(--ui-line)` |
| `--ui-frame-shadow` | `none` |
| `--ui-card-shadow` | `none` |
| `--ui-nav-fill` | `var(--ui-paper)` |
| `--ui-nav-blur` | `none` |
| `--ui-grain` | `0` |
| `--ui-glow` | `0` |
| `--ui-star-fill` | `1` |
| `--ui-cta-shadow` | `inset 0 -2px 0 color-mix(in srgb, black 28%, transparent)` |
| `--ui-cta-shadow-hover` | `inset 0 -3px 0 color-mix(in srgb, black 36%, transparent)` |

**Treatment: cards, step numbers, stats**

| Role | Value |
| --- | --- |
| `--ui-perf` | `dashed` |
| `--ui-card-fill` | `var(--ui-surface)` |
| `--ui-card-pad` | `1.75rem` |
| `--ui-num-font` | `var(--ui-font-display)` |
| `--ui-num-size` | `1.875rem` |
| `--ui-num-weight` | `400` |
| `--ui-num-prefix` | `"No.\00a0"` |
| `--ui-num-pad` | `none` |
| `--ui-num-rule` | `1px dashed var(--ui-line)` |
| `--ui-num-color` | `var(--ui-accent-ink)` |
| `--ui-num-fill` | `transparent` |
| `--ui-num-ring` | `none` |
| `--ui-num-box` | `auto` |
| `--ui-num-display` | `block` |
| `--ui-num-bleed` | `1` |
| `--ui-num-gap` | `0.875rem` |
| `--ui-stat-divider` | `1px dashed var(--ui-line)` |

**Treatment: quote, featured plan, product cells, windows**

| Role | Value |
| --- | --- |
| `--ui-quote-fill` | `transparent` |
| `--ui-quote-ink` | `var(--ui-ink)` |
| `--ui-quote-ink-2` | `var(--ui-ink-3)` |
| `--ui-quote-line` | `transparent` |
| `--ui-quote-mark` | `var(--ui-accent-ink)` |
| `--ui-quote-face` | `var(--ui-font-display)` |
| `--ui-quote-weight` | `400` |
| `--ui-quote-case` | `none` |
| `--ui-quote-size` | `2.125rem` |
| `--ui-quote-rule` | `inset 3px 0 0 var(--ui-accent)` |
| `--ui-quote-shadow` | `0 0 transparent` |
| `--ui-plan-featured-border` | `var(--ui-accent)` |
| `--ui-plan-featured-ring` | `inset 0 0 0 1px var(--ui-accent)` |
| `--ui-plan-featured-fill` | `color-mix(in srgb, var(--ui-accent) 7%, var(--ui-surface))` |
| `--ui-cell-fill` | `var(--ui-surface-2)` |
| `--ui-cell-ink` | `var(--ui-ink)` |
| `--ui-cell-line` | `color-mix(in srgb, var(--ui-ink) 22%, transparent)` |
| `--ui-cell-peak` | `var(--ui-accent)` |
| `--ui-on-cell-peak` | `var(--ui-on-accent)` |
| `--ui-cell-off-ink` | `var(--ui-ink-3)` |
| `--ui-cell-radius` | `2px` |
| `--ui-window-dots` | `none` |
| `--ui-window-bar` | `transparent` |

**Stamp (`StarHero stamp`)**

| Role | Value |
| --- | --- |
| `--ui-stamp-fill` | `var(--ui-surface)` |
| `--ui-stamp-ink` | `var(--ui-ink)` |
| `--ui-stamp-accent` | `var(--ui-accent-ink)` |
| `--ui-stamp-border` | `1px solid var(--ui-ink)` |
| `--ui-stamp-inner` | `1px dashed var(--ui-line)` |
| `--ui-stamp-radius` | `6px` |
| `--ui-stamp-rotate` | `-3deg` |
| `--ui-stamp-face` | `var(--ui-font-display)` |
| `--ui-stamp-case` | `none` |
| `--ui-stamp-size` | `2.75rem` |
| `--ui-stamp-shadow` | `none` |

## Type

| Role | Face | Weights and files | Used for |
| --- | --- | --- | --- |
| Display | Instrument Serif | 400 and 400 italic (`instrument-serif-latin-400-normal.woff2`, 21 KB; `instrument-serif-latin-400-italic.woff2`, 22 KB) | Web headings at steps 4–6, the hero, big numbers (`NumberTicker`, the DemoPlayer metric, prices), the pull quote, the stamp, step numbers, the wordmark, slide headlines |
| Text | IBM Plex Sans | 400 / 500 / 600 (22 + 24 + 24 KB) | Body, subheads, buttons, nav, headings at steps 0–3, figure titles (`--ui-font-heading` is the text face) |
| Label | IBM Plex Mono | 400 / 600 (15 + 16 KB) | Eyebrows, labels, data, addresses, code, metadata; tracked 0.08em |

- **The face is decided by size.** Steps 4–6 (39, 49, 61px; one step smaller in containers under
  720px, the hero clamping between 39 and 49px at `11.5cqi`) use the display face at its one weight
  (400, `font-synthesis-weight: none`), tracking −0.01em, leading 1.1 / 1.05 / 1.02, scaled by
  `--ui-display-scale: 1.05`. Steps 0–3 stay in Plex Sans at 600, step 3 at 500 so a 31px sans
  heading does not outweigh a 39px serif one; tracking −0.015em (step 3) to 0. A hairline serif loses
  its contrast below about 32px and reads as body, which is why the serif starts at step 4.
- **Emphasis is a real italic.** `<em>` in a display headline sets the shipped italic in the accent
  (`--ui-em-style: italic`, `--ui-em-color: var(--ui-accent-ink)`, no underline). Use it on the one
  phrase that matters.
- **Why this pairing.** A high-contrast editorial serif gives headlines a voice the grotesk body
  cannot, and Plex Sans and Plex Mono are already the owner's faces. Instrument Serif's x-height
  (0.510 em) matches Plex Sans (0.516 em), so serif headlines and sans copy share a size rhythm; its
  letters are about a quarter narrower (average width 0.36 em against 0.48 em), which is why narrow
  containers drop steps 6 and 5 by one step instead of two.
- **Figures.** Instrument Serif has proportional figures only; `NumberTicker` lays its count over
  the final value so nothing shifts.
- **Fallback.** Self-host the woff2 files (latin subset from Fontsource, SIL OFL 1.1; the licence
  file was `src/web/fonts/OFL-instrument-serif.txt`) with `font-display: swap` and this
  metric-matched fallback, measured from the woff2 against the local faces:

  ```css
  @font-face {
    font-family: "Instrument Serif Fallback";
    src: local("Times New Roman"), local("TimesNewRomanPSMT"), local("Liberation Serif"), local("Tinos");
    size-adjust: 81.75%;
    ascent-override: 121.1%;
    descent-override: 37.92%;
    line-gap-override: 0%;
  }
  ```

  Plex Sans and Plex Mono reuse Technical's existing fallbacks (`IBM Plex Sans Fallback` on Arial,
  `IBM Plex Mono Fallback` on Courier New) already in `src/web/fonts.css`.
- **Files and preload.** Seven files, 143 KB in total: both Instrument Serif files plus Technical's
  five Plex files. Preload both Instrument Serif files (normal and italic) at 720px and wider: on
  `/web` at 1440px the centred hero headline re-wrapped on the swap (CLS 0.042) even with the
  matched fallback, while at 390px the swap moved nothing.

## Treatment

How Landing draws the shared web parts, through the treatment roles above. None of it moves a box.

| Part | Landing draws it as |
| --- | --- |
| Section | Density 1 (even padding); each section after the first opens on a 1px soft ruled line, as a printed form; no column rule, no section index, no eyebrow marker |
| Internal divisions | Perforations: `--ui-perf: dashed` on table rows, card and window heads, feature lists and the step rail |
| Cards (steps, features) | Ivory surface, 1.75rem padding, a 1px ink edge at 30%, 4px corners, no shadow, no corner marks |
| Step numbers (`FeatureGrid numbered`) | A stub: "No. 1" in the serif at 1.875rem, green, over a dashed rule that runs edge to edge across the card (`--ui-num-bleed: 1`), no ring, no fill |
| Stats (`Proof`) | Serif figures between 1px dashed rules |
| Quote | A pull quote with no card: the serif at 2.125rem (34px) on a 3px green rule along its start edge, the quote mark in green, attribution in ink-3 |
| Featured plan | The green-tinted ticket: 7% accent over the surface, a green edge and a 1px inset green ring |
| Product cells (`DataTable`, `ScheduleGrid`, chips, worked rules) | Kraft chips: surface-2 fill, a 22% ink line, 2px corners, green peaks with ivory text |
| Windows (`ProductWindow`, `DemoPlayer`) | A printed panel with a ruled head: no traffic lights, a clear bar |
| Buttons | Square-cornered ink keys (3px "pill" radius): green fill, ivory label, a 2px inset foot that deepens to 3px on hover; no glow |
| Nav | A solid paper masthead, no blur |
| Stamp (`StarHero stamp`) | A die-cut label: ivory, 1px ink edge, dashed inner edge, 6px corners, the number in the serif at 2.75rem, tilted −3°, no shadow |
| Closing band | Ledger green (`#1d5a43`; dark `#173b2d`) with ivory text and an ivory button, and a perforation (6px dashes at 55% band ink) 12px from the top |
| Ornaments | None ambient: no backdrop, no grain, no glow, no corner marks. The hero's one device is the stamp. The hero star's area fill is on (`--ui-star-fill: 1`) |
| Figure canvas | A faint ruled ledger: a 1px soft line every 24px |

## Layout defaults (opt-in)

A page keeps its author's order in every style. If Landing is registered, these are the values for
its `uiStyles` entry, used only when a page opts in with `WebPage layout="style"`:

- `prefers`: hero → how → mechanism → proof → FAQ → pricing.
- `layout`: `{ hero: "demo", align: "center", steps: "cards" }` (a centred hero with the
  `DemoPlayer` as its proof, steps as a row of cards).

## Figures, slides, charts and 3D

- **Figures on a Landing page** take the text and label faces, the 1px ink frame and the 4px radius;
  figure titles are Plex Sans (`--ui-font-heading`). Request flows are warm slate (`#5f5a52` /
  `#a39d92`), so the green stays the only saturated hue; response green and change violet keep
  their own Landing values (table above).
- **Slides** take the display face for headlines (Instrument Serif, `--ui-slide-font-display`) and
  the text and label faces as on the web. A deck never mixes styles between slides.
- **Charts** read the data roles: green, burnt orange (`#a8571c`), slate and violet as the four
  categorical slots, a green positive and a rust negative. Consulting charts in Landing passed the
  layout swap test but never had a visual review.
- **3D and Mechanism.** WebGL scenes do not follow Landing: their palettes in
  `src/styles/scene-palettes.ts` are Technical's, and a 3D art direction is its own style. Mechanism
  tones, the Studio stage and docs surfaces were derived from Landing's core roles (Technical's
  `--tune-*` hooks reset to their derivations).

## Contrast

Computed with the WCAG 2 formula from the values above (2026-11-06). Every text pair clears 4.5:1
in both themes.

| Pair | Light | Dark |
| --- | --- | --- |
| ink / ink-2 / ink-3 on paper | 15.5 / 10.8 / 5.3 | 15.8 / 12.1 / 7.3 |
| ink-3 on surface-2 (the lowest text pair) | 5.1 | 6.8 |
| accent on paper (accent as text) | 7.2 | 10.5 |
| on-accent on accent (the primary button) | 8.0 | 10.5 |
| band ink / band ink-2 on the band | 7.2 / 6.0 | 10.5 / 8.3 |
| button label on the band button | 15.5 | 15.8 |
| inverted ink / inverted accent | 14.7 / 9.8 | 14.7 / 6.9 |

Marks against the surface (3:1 for graphical objects): request 6.7 / 6.5, response 3.4 / 9.3,
change 3.9 / 7.8, error 5.8 / 7.6, data negative 5.3 / 4.7. Response green in light (3.4) is the
tightest; keep it.

## Do and don't

Do:

- Keep green to one thing per unit: the CTA, the star, the emphasised phrase, the featured plan.
- Rule things instead of floating them: 1px ink edges, dashed internal divisions.
- Use `<em>` in a display headline for the one phrase that matters.
- Show the product's real output in the hero (the shared web rules apply).

Don't:

- Add blue, purple, gradient blobs, glass, glow, grain, soft drop shadows or traffic-light window
  dots. Landing's earlier cobalt, glass and soft shadows read as stock SaaS beside Technical and
  were replaced by label stock on 2026-11-05.
- Set the serif below step 4 or add a second display weight (there is one).
- Round corners past 4px, or add a second accent.

## Measured before

Lighthouse 13.5 mobile on the built playground, median of 3, 2026-11-04, on the earlier cobalt
Landing (same faces): LCP 2.57 s, 143 KB of fonts in 7 files, CLS 0. The label-stock values above
were never re-measured. TODO: measure LCP and CLS again when Landing is rebuilt.
