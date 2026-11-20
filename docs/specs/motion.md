---
spec: motion
site: the Motion style (talk decks and the pages that go with them)
extends: core
pages: [deck, landing, article]
layouts: { deck: slide-canvas, landing: product-landing, article: layer-article }
components: { diagrams: blueprint, 3d: ink, mechanism: isometric }
diagram-themes: { default: blueprint }
status: implemented
uipack: current
values: src/styles/motion.css
---

# Motion spec

Motion is the spec of the talk-deck style: slides that move with the story. It was drawn from a
conference talk's slides (Brandon Thomas, "How I cloned Adobe with AI", AI Engineer Code Summit,
2026-11-12) that the owner asked to emulate (2026-11-20); its light values are sampled from that
talk's frames. Its role values are generated from `src/styles/motion.css` by `npm run docs:sync`.

Its motion parts (six whole-slide transitions, a count-up number, a letter reveal and a drifting
wireframe backdrop) are deck parts every style can use, in [the deck guide](../deck.md#transitions).
It is written to the [template](TEMPLATE.md).

## Identity

A presenter's deck that feels built, not templated: warm grey paper, near-black headlines set heavy
and tight (Instrument Sans 700 at −0.045em on slides), one vermilion-orange accent for the line
that matters (a headline's second voice, a hero number, the current slide's progress segment),
and tracked mono kickers (`07 —— CRAFT`) above each title. Cards lift off the paper on a soft
shadow; bullets are small diamonds. Behind every slide, thin wireframe polyhedra drift and turn, one
of them bolder with accent vertices, the far edges dashed. The slide itself moves: it pushes, flips,
turns as a cube, opens like a shutter or blinds, or rises from a blur.

It is not a SaaS gradient, has no glow, and keeps one accent per slide. The talk's accent was red;
here it is moved to orange so that red stays a data colour (owner, 2026-11-20), and the talk's
second hue (a green column head) is dropped for the one-accent rule.

**One accent per theme.** Light `#e0560f` (hue 21°) for large type, fills and marks: 3.2:1 on
paper, ink on it at 4.6:1. Where the accent is small text it is the deeper `#ad4500` (hue 24°,
4.8:1). Dark uses one light orange, `#ff8a4c`. The data red (`#b42318`, hue 4°) is never the accent.

The dark half and the web and figure values are not in the talk: they are derived (by the agent
that built the style) from the light half and the role contract, and pass the contrast tests.

## Role values

Every role `src/styles/motion.css` sets, light and dark (a role that is not a `light-dark()` pair
has one value for both). `color-mix` and `var()` values are kept as written.

<!-- generated:spec-roles -->
| Role | Light | Dark |
| --- | --- | --- |
| `--ui-paper` | `#ecebe3` | `#161512` |
| `--ui-surface` | `#f8f8f1` | `#1f1e1a` |
| `--ui-surface-raised` | `#fdfdf8` | `#27261f` |
| `--ui-surface-2` | `#e2e1d7` | `#2c2a24` |
| `--ui-ink` | `#191917` | `#efede5` |
| `--ui-ink-2` | `#54524c` | `#b6b3a9` |
| `--ui-ink-3` | `#625f58` | `#a3a096` |
| `--ui-line` | `color-mix(in srgb, var(--ui-ink) 22%, transparent)` | `color-mix(in srgb, var(--ui-ink) 22%, transparent)` |
| `--ui-line-soft` | `color-mix(in srgb, var(--ui-ink) 11%, transparent)` | `color-mix(in srgb, var(--ui-ink) 11%, transparent)` |
| `--ui-accent` | `#e0560f` | `#ff8a4c` |
| `--ui-accent-ink` | `#ad4500` | `#ff9a5c` |
| `--ui-accent-stroke` | `var(--ui-accent)` | `var(--ui-accent)` |
| `--ui-on-accent` | `#191917` | `#161512` |
| `--ui-accent-surface` | `#191917` | `#ff8a4c` |
| `--ui-accent-ink-2` | `#ff9a5c` | `#161512` |
| `--ui-accent-line` | `#3a3833` | `#b8653a` |
| `--ui-flow-request` | `#0f6278` | `#7fd3e8` |
| `--ui-flow-response` | `#20694c` | `#8be0b4` |
| `--ui-flow-change` | `#6a4bb8` | `#c9b2ff` |
| `--ui-flow-error` | `#b42318` | `#ff8c7a` |
| `--ui-data-pos` | `#20694c` | `#8be0b4` |
| `--ui-data-neg` | `#b42318` | `#ff8c7a` |
| `--ui-data-context` | `#a3a096` | `#6b675e` |
| `--ui-data-1` | `#191917` | `#efede5` |
| `--ui-data-2` | `#ad4500` | `#ff8a4c` |
| `--ui-data-3` | `#0f6278` | `#7fd3e8` |
| `--ui-data-4` | `#5e5b54` | `#a8a59b` |
| `--ui-on-data-1` | `#ffffff` | `#161512` |
| `--ui-on-data-2` | `#ffffff` | `#161512` |
| `--ui-on-data-3` | `#ffffff` | `#161512` |
| `--ui-on-data-4` | `#ffffff` | `#161512` |
| `--ui-inv-paper` | `#191917` | `#ecebe3` |
| `--ui-inv-surface` | `#24231f` | `#f8f8f1` |
| `--ui-inv-ink` | `#efede5` | `#191917` |
| `--ui-inv-ink-2` | `#b6b3a9` | `#54524c` |
| `--ui-inv-line` | `#45433d` | `#c9c7bd` |
| `--ui-inv-accent` | `#ff8a4c` | `#ad4500` |
| `--ui-font-display` | `"Instrument Sans", "Instrument Sans Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | `"Instrument Sans", "Instrument Sans Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |
| `--ui-font-heading` | `var(--ui-font-display)` | `var(--ui-font-display)` |
| `--ui-font-text` | `"Instrument Sans", "Instrument Sans Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | `"Instrument Sans", "Instrument Sans Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |
| `--ui-font-label` | `"JetBrains Mono", "JetBrains Mono Fallback", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` | `"JetBrains Mono", "JetBrains Mono Fallback", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` |
| `--ui-web-font-display` | `var(--ui-font-display)` | `var(--ui-font-display)` |
| `--ui-web-font-text` | `var(--ui-font-text)` | `var(--ui-font-text)` |
| `--ui-web-font-label` | `var(--ui-font-label)` | `var(--ui-font-label)` |
| `--ui-slide-font-display` | `var(--ui-font-display)` | `var(--ui-font-display)` |
| `--ui-slide-font-text` | `var(--ui-font-text)` | `var(--ui-font-text)` |
| `--ui-slide-font-label` | `var(--ui-font-label)` | `var(--ui-font-label)` |
| `--ui-display-weight` | `700` | `700` |
| `--ui-display-tracking` | `-0.035em` | `-0.035em` |
| `--ui-slide-display-tracking` | `-0.045em` | `-0.045em` |
| `--ui-display-case` | `none` | `none` |
| `--ui-display-scale` | `1.04` | `1.04` |
| `--ui-label-tracking` | `0.06em` | `0.06em` |
| `--ui-radius` | `4px` | `4px` |
| `--ui-radius-sm` | `3px` | `3px` |
| `--ui-radius-xs` | `2px` | `2px` |
| `--ui-radius-pill` | `2px` | `2px` |
| `--ui-nav-fill` | `color-mix(in srgb, var(--ui-paper) 90%, transparent)` | `color-mix(in srgb, var(--ui-paper) 90%, transparent)` |
| `--ui-nav-blur` | `blur(10px)` | `blur(10px)` |
| `--ui-stroke` | `1` | `1` |
| `--ui-rule-width` | `1px` | `1px` |
| `--ui-type-ratio` | `1.333` | `1.333` |
| `--ui-measure` | `62ch` | `62ch` |
| `--ui-ease-settle` | `cubic-bezier(0.16, 1, 0.3, 1)` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ui-ease-travel` | `cubic-bezier(0.65, 0, 0.2, 1)` | `cubic-bezier(0.65, 0, 0.2, 1)` |
| `--ui-dur-quick` | `160ms` | `160ms` |
| `--ui-dur-base` | `320ms` | `320ms` |
| `--ui-dur-slow` | `560ms` | `560ms` |
| `--ui-backdrop` | `none` | `none` |
| `--ui-backdrop-mask` | `none` | `none` |
| `--ui-backdrop-narrow` | `none` | `none` |
| `--ui-canvas-pattern` | `radial-gradient(color-mix(in srgb, var(--ui-ink) 14%, transparent) 1px, transparent 1.2px) 0 0 / 24px 24px` | `radial-gradient(color-mix(in srgb, var(--ui-ink) 14%, transparent) 1px, transparent 1.2px) 0 0 / 24px 24px` |
| `--ui-frame-border` | `var(--ui-rule-width) solid var(--ui-line-soft)` | `var(--ui-rule-width) solid var(--ui-line-soft)` |
| `--ui-card-shadow` | `0 1px 2px color-mix(in srgb, var(--ui-ink) 6%, transparent), 0 14px 32px -16px color-mix(in srgb, var(--ui-ink) 22%, transparent)` | `0 1px 2px color-mix(in srgb, var(--ui-ink) 6%, transparent), 0 14px 32px -16px color-mix(in srgb, var(--ui-ink) 22%, transparent)` |
| `--ui-frame-shadow` | `var(--ui-card-shadow)` | `var(--ui-card-shadow)` |
| `--ui-marker-size` | `7px` | `7px` |
| `--ui-marker-shape` | `1px` | `1px` |
| `--ui-marker-rotate` | `45deg` | `45deg` |
| `--ui-marker-color` | `var(--ui-accent)` | `var(--ui-accent)` |
| `--ui-section-rule` | `none` | `none` |
| `--ui-grain` | `0` | `0` |
| `--ui-glow` | `0` | `0` |
| `--ui-cta-shadow` | `var(--ui-card-shadow)` | `var(--ui-card-shadow)` |
| `--ui-cta-shadow-hover` | `0 0 0 3px color-mix(in srgb, var(--ui-accent) 32%, transparent)` | `0 0 0 3px color-mix(in srgb, var(--ui-accent) 32%, transparent)` |
| `--ui-cta-fill` | `var(--ui-ink)` | `var(--ui-accent)` |
| `--ui-on-cta` | `#ffffff` | `#161512` |
| `--ui-em-style` | `normal` | `normal` |
| `--ui-em-color` | `var(--ui-accent-ink)` | `var(--ui-accent-ink)` |
| `--ui-em-decoration` | `none` | `none` |
| `--ui-star-fill` | `0` | `0` |
| `--ui-band-fill` | `#191917` | `#0e0d0b` |
| `--ui-band-ink` | `#efede5` | `#efede5` |
| `--ui-band-ink-2` | `#b6b3a9` | `#b6b3a9` |
| `--ui-band-cta` | `#ff8a4c` | `#ff8a4c` |
| `--ui-on-band-cta` | `#191917` | `#161512` |
| `--ui-band-pattern` | `none` | `none` |
| `--ui-section-index` | `inline` | `inline` |
| `--ui-corner-marks` | `none` | `none` |
| `--ui-slide-eyebrow-index` | `inline-flex` | `inline-flex` |
| `--ui-slide-eyebrow-accent` | `0` | `0` |
| `--ui-slide-progress` | `flex` | `flex` |
| `--ui-density` | `1` | `1` |
| `--ui-column-rule` | `none` | `none` |
| `--ui-column-rule-gap` | `0px` | `0px` |
| `--ui-card-fill` | `var(--ui-surface)` | `var(--ui-surface)` |
| `--ui-card-pad` | `1.75rem` | `1.75rem` |
| `--ui-num-font` | `var(--ui-font-label)` | `var(--ui-font-label)` |
| `--ui-num-size` | `0.8125rem` | `0.8125rem` |
| `--ui-num-weight` | `600` | `600` |
| `--ui-num-prefix` | `""` | `""` |
| `--ui-num-pad` | `inline` | `inline` |
| `--ui-num-rule` | `1px solid var(--ui-line-soft)` | `1px solid var(--ui-line-soft)` |
| `--ui-num-color` | `var(--ui-accent-ink)` | `var(--ui-accent-ink)` |
| `--ui-num-fill` | `transparent` | `transparent` |
| `--ui-num-ring` | `none` | `none` |
| `--ui-num-box` | `auto` | `auto` |
| `--ui-num-bleed` | `1` | `1` |
| `--ui-num-gap` | `0.75rem` | `0.75rem` |
| `--ui-num-display` | `block` | `block` |
| `--ui-stat-divider` | `none` | `none` |
| `--ui-quote-fill` | `var(--ui-surface)` | `var(--ui-surface)` |
| `--ui-quote-ink` | `var(--ui-ink)` | `var(--ui-ink)` |
| `--ui-quote-ink-2` | `var(--ui-ink-2)` | `var(--ui-ink-2)` |
| `--ui-quote-line` | `var(--ui-line-soft)` | `var(--ui-line-soft)` |
| `--ui-quote-mark` | `var(--ui-accent)` | `var(--ui-accent)` |
| `--ui-quote-face` | `var(--ui-font-display)` | `var(--ui-font-display)` |
| `--ui-quote-weight` | `600` | `600` |
| `--ui-quote-case` | `none` | `none` |
| `--ui-quote-size` | `1.45rem` | `1.45rem` |
| `--ui-quote-rule` | `inset 4px 0 0 var(--ui-accent)` | `inset 4px 0 0 var(--ui-accent)` |
| `--ui-quote-shadow` | `var(--ui-card-shadow)` | `var(--ui-card-shadow)` |
| `--ui-plan-featured-border` | `var(--ui-line)` | `var(--ui-line)` |
| `--ui-plan-featured-ring` | `inset 0 3px 0 var(--ui-accent)` | `inset 0 3px 0 var(--ui-accent)` |
| `--ui-cell-fill` | `var(--ui-surface-2)` | `var(--ui-surface-2)` |
| `--ui-cell-ink` | `var(--ui-ink)` | `var(--ui-ink)` |
| `--ui-cell-line` | `color-mix(in srgb, var(--ui-ink) 14%, transparent)` | `color-mix(in srgb, var(--ui-ink) 14%, transparent)` |
| `--ui-cell-peak` | `var(--ui-accent)` | `var(--ui-accent)` |
| `--ui-on-cell-peak` | `var(--ui-on-accent)` | `var(--ui-on-accent)` |
| `--ui-cell-off-ink` | `var(--ui-ink-3)` | `var(--ui-ink-3)` |
| `--ui-cell-radius` | `2px` | `2px` |
| `--ui-window-dots` | `inline-flex` | `inline-flex` |
| `--ui-window-bar` | `var(--ui-surface-2)` | `var(--ui-surface-2)` |
| `--ui-web-flow-request` | `var(--ui-flow-request)` | `var(--ui-flow-request)` |
| `--ui-perf` | `solid` | `solid` |
| `--ui-plan-featured-fill` | `var(--ui-surface)` | `var(--ui-surface)` |
| `--ui-stamp-fill` | `var(--ui-surface)` | `var(--ui-surface)` |
| `--ui-stamp-ink` | `var(--ui-ink)` | `var(--ui-ink)` |
| `--ui-stamp-accent` | `var(--ui-accent-ink)` | `var(--ui-accent-ink)` |
| `--ui-stamp-border` | `1px solid var(--ui-line)` | `1px solid var(--ui-line)` |
| `--ui-stamp-inner` | `1px solid transparent` | `1px solid transparent` |
| `--ui-stamp-radius` | `2px` | `2px` |
| `--ui-stamp-rotate` | `0deg` | `0deg` |
| `--ui-stamp-face` | `var(--ui-font-display)` | `var(--ui-font-display)` |
| `--ui-stamp-case` | `none` | `none` |
| `--ui-stamp-size` | `2.25rem` | `2.25rem` |
| `--ui-stamp-fit` | `4.6rem` | `4.6rem` |
| `--ui-stamp-label-width` | `9em` | `9em` |
| `--ui-stamp-shadow` | `var(--ui-card-shadow)` | `var(--ui-card-shadow)` |
| `--ui-spot` | `var(--ui-accent)` | `var(--ui-accent)` |
| `--ui-on-spot` | `var(--ui-on-accent)` | `var(--ui-on-accent)` |
| `--ui-media-ground` | `#161512` | `#161512` |
| `--ui-media-cold` | `#161512` | `#161512` |
| `--ui-media-mid` | `#54524c` | `#54524c` |
| `--ui-media-warm` | `#d9cfc0` | `#d9cfc0` |
| `--ui-media-hot` | `#ff8a4c` | `#ff8a4c` |
| `--ui-media-ink` | `#efede5` | `#efede5` |
| `--ui-media-ramp` | `linear-gradient(90deg, var(--ui-media-cold), var(--ui-media-mid), var(--ui-media-warm), var(--ui-media-hot))` | `linear-gradient(90deg, var(--ui-media-cold), var(--ui-media-mid), var(--ui-media-warm), var(--ui-media-hot))` |
| `--ui-media-filter` | `grayscale(1) contrast(1.05)` | `grayscale(1) contrast(1.05)` |
| `--ui-media-tint` | `#191917` | `#191917` |
| `--ui-media-blend` | `lighten` | `lighten` |
| `--ui-node` | `#fdfdf8` | `#1f1e1a` |
| `--ui-inv-node` | `#24231f` | `#fdfdf8` |
| `--ui-line-solid` | `#cfcdc3` | `#3a3833` |
| `--ui-data-neg-ink` | `#a8261b` | `#ff9d8d` |
| `--ui-alert` | `#a8261b` | `#ff8c7a` |
| `--ui-warn` | `#8a5a00` | `#f0c45a` |
<!-- /generated -->

## Type

| Medium | Display | Text | Label |
| --- | --- | --- | --- |
| Slide, page, figure, article | Instrument Sans 700; −0.045em on slide titles and headings (`--ui-slide-display-tracking`), −0.035em on the page | Instrument Sans 400 / 500 | JetBrains Mono 400 / 600, tracked 0.14em in slide kickers and 0.06em in web labels (wider tracking overflowed the 390px schedule grid) |

Five self-hosted latin woff2 files (Instrument Sans 400 / 500 / 700, JetBrains Mono 400 / 600) in
`uipack/fonts/*`, each with a metric-matched fallback (Instrument Sans over Arial, JetBrains Mono
over Courier New, from the faces' published metrics). Preload Instrument Sans 700. The talk's faces
were matched by eye against frame crops: Instrument Sans was the closest of six OFL grotesques
(the squared numerals, the tight heavy set); the talk's own faces are not named in it.

## Density and rhythm

Density 1, type ratio 1.333 (headlines step up further than Technical's), measure 62ch. Radii are
small (4px cards, 2px chips): the talk's cards are nearly square.

## Ornaments

**Slots**

| Slot | Motion paints |
| --- | --- |
| `--ui-backdrop`, `--ui-backdrop-mask`, `--ui-backdrop-narrow` | None: the deck's `Polyhedra` backdrop is the style's one ambient effect |
| `--ui-canvas-pattern` | A faint 24px dot field on a figure's canvas |
| `--ui-marker-size` / `-shape` / `-rotate` / `-color` | A 7px orange diamond before each eyebrow |
| `--ui-section-index` | `inline`: each section's eyebrow opens with its number |
| `--ui-slide-eyebrow-index`, `--ui-slide-eyebrow-accent` | A kicker on slides: the slide number in the accent and a rule before the eyebrow, the words in muted ink |
| `--ui-slide-progress` | One footer segment per slide, the current one in the accent |
| `--ui-corner-marks` | None |
| `--ui-section-rule` | None |
| `--ui-frame-border`, `--ui-frame-shadow`, `--ui-card-shadow` | A soft line and a soft two-layer shadow: cards lift off the paper |
| `--ui-nav-fill`, `--ui-nav-blur` | Paper at 90%, 10px blur |
| `--ui-grain`, `--ui-glow`, `--ui-star-fill` | 0 |
| `--ui-cta-shadow(-hover)` | The card shadow, a 3px orange halo on hover |
| `--ui-cta-fill`, `--ui-on-cta` | Ink in light, orange in dark |
| `--ui-band-*` | A near-black closing band, orange button |
| `--ui-stamp-*` | A mono chip: 2px corners, a hairline border, lifted |

**Treatment roles: lifted cards**

| Role | Motion |
| --- | --- |
| `--ui-perf` | `solid` |
| `--ui-column-rule`, `-gap` | None |
| `--ui-card-fill`, `--ui-card-pad` | Surface, 1.75rem |
| `--ui-num-*` | The number in mono, in the accent, over a hairline the width of the card |
| `--ui-stat-divider` | None (stats sit in their own cards) |
| `--ui-quote-*` | A lifted card with a 4px orange rule at the left, the words in the display face |
| `--ui-plan-featured-*` | A 3px orange rule along the top |
| `--ui-cell-*` | 2px cells on surface-2, orange peaks |
| `--ui-window-dots`, `--ui-window-bar` | Traffic lights on a surface-2 bar, as the talk's app screenshots |
| `--ui-web-flow-request` | The flow request (teal) |

## Layout

### Deck

`slide-canvas` as is, with eyebrows on: every content slide has a kicker (the slide number, a
rule, a one- or two-word section) above its title, and a title that is a short verdict. A headline's
second voice goes in the accent (`<span className="uipack-deck-em">`). Whole-slide moves instead of
`advance`: pick one or two for a talk and keep to them (the example deck shows all six, one per
slide, as the reference). The `Polyhedra` backdrop is on (`DeckPlayer backdrop={<Polyhedra />}`).

### Landing

`product-landing` as is: the author's section order. Its opt-in order (`uiStyles[].prefers`) leads
with proof after the hero, and its layout defaults are a demo in the hero, start-aligned, steps as
cards.

### Article

`layer-article` as is.

## Writing style

| Setting | Motion |
| --- | --- |
| Tone and register | A speaker on stage: direct, first person plural, confident |
| Title form | Deck presented: short spoken verdict, often split over two lines with the second in the accent. Landing: plain-name section heads. Article: full-sentence claim |
| Copy density | Sparse on slides: a title, one number or three short items; the detail goes in the talk track |
| House words | Plain names; the kicker is one or two words |
| Budgets | The ceilings |

## Component looks

| Component | Motion picks | Why |
| --- | --- | --- |
| Diagrams | `blueprint`, theme `blueprint` | The one diagram grammar; Motion has no diagram theme of its own yet |
| 3D object scenes | `ink` | The one 3D look, drawn in Motion's paper, ink and orange |
| Mechanism | `isometric` | Drawn in Motion's roles |

## Reuse

Extends `core` only. A site whose talks should look like this says `extends: motion`.

## Open TODOs

- TODO: a diagram theme of Motion's own (its faces and orange on the paper); figures use the
  built-in `blueprint` theme until one is asked for.
- TODO: the talk's faces are matched by eye; if the owner learns the talk's real faces, compare.
