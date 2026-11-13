---
spec: technical
site: uipack package defaults (the docs site extends it: docs-site.md)
extends: core
pages: [landing, documentation, article, deck, dashboard]
layouts: { landing: product-landing, documentation: docs-shell, article: layer-article, deck: slide-canvas, dashboard: one-question-dashboard }
components: { diagrams: blueprint, 3d: [studio, paper-theatre, kinetic, cartoon, realistic, abstract], mechanism: isometric }
diagram-themes: { default: blueprint }
status: implemented
uipack: current
values: src/styles/technical.css
---

# Technical spec

Technical is the package's default look: what a figure, deck or page renders in when nothing else
is set. Its layout picks and writing style (the aims in `src/deck/budgets.ts` are its defaults)
are its own choices, not rules for other sites. Its role values are generated from
`src/styles/technical.css` by `npm run docs:sync`, so this page and the code cannot drift.

The docs site extends it with a dark palette, navigation hues and a location marker of its own
([its spec](docs-site.md)). It is written to the [template](TEMPLATE.md).

## Identity

Cyanotype: every page is a blueprint. Prussian-blue ink on a cool white sheet, a dark half that is
the cyanotype itself (pale lines on deep Prussian blue, not near-black), and one amber mark for the
thing that matters. Square corners and 1px hairlines; a drafting-film grid on the hero and the
figure canvas only; dimension-line section heads, crop-mark card corners, ringed step numbers. On
the web a page leads with the product's real output. Chosen blind over four alternatives in the
2026-11-05 review: the earlier warm paper, forest green and IBM Plex matched generic AI defaults.
It is not a SaaS gradient, not glassy, and has no ambient glow.

**One amber per theme.** The light amber `#9c5700` leans orange (hue 33°) so it never reads olive
at text size; it is the same value on the headline underline, the slide bar, step rings and the
eyebrow dot, 5.1:1 on paper with white on it at 5.6:1. Dark uses gold `#f0c45a` everywhere. Light
pages put gold only on a dark inverted ground (the closing band, `tone="ink"`), where it is the
dark half's value. The primary button is Prussian ink with a white label in light, gold with a
Prussian label in dark.

The red is a data colour only: a falling bar, a down delta, always with a sign or an arrow. It is
never a status colour, an accent or decoration.

## Role values

Every role `src/styles/technical.css` sets, light and dark (a role that is not a `light-dark()`
pair has one value for both). `color-mix` and `var()` values are kept as written: they derive from
the roles above them.

<!-- generated:spec-roles -->
| Role | Light | Dark |
| --- | --- | --- |
| `--ui-paper` | `#f3f6f9` | `#0a2342` |
| `--ui-surface` | `#fcfdfe` | `#0d2a4f` |
| `--ui-surface-raised` | `#ffffff` | `#12345f` |
| `--ui-surface-2` | `#e2e9f1` | `#11315a` |
| `--ui-ink` | `#0b2748` | `#edf3fb` |
| `--ui-ink-2` | `#3d5878` | `#acc2dc` |
| `--ui-ink-3` | `#4b6485` | `#9db4cf` |
| `--ui-line` | `color-mix(in srgb, var(--ui-ink) 26%, transparent)` | `color-mix(in srgb, var(--ui-ink) 26%, transparent)` |
| `--ui-line-soft` | `color-mix(in srgb, var(--ui-ink) 13%, transparent)` | `color-mix(in srgb, var(--ui-ink) 13%, transparent)` |
| `--ui-accent` | `#9c5700` | `#f0c45a` |
| `--ui-accent-ink` | `var(--ui-accent)` | `var(--ui-accent)` |
| `--ui-accent-stroke` | `var(--ui-accent)` | `var(--ui-accent)` |
| `--ui-on-accent` | `#ffffff` | `#0a2342` |
| `--ui-accent-surface` | `#0b2748` | `#f0c45a` |
| `--ui-accent-ink-2` | `#f0c45a` | `#0a2342` |
| `--ui-accent-line` | `#2f4f78` | `#b8913a` |
| `--ui-flow-request` | `#0b77a3` | `#8fd6ff` |
| `--ui-flow-response` | `#2b7a4b` | `#8be6ae` |
| `--ui-flow-change` | `#7048c0` | `#d2b4ff` |
| `--ui-flow-error` | `#c2392b` | `#ff8c7a` |
| `--ui-data-pos` | `#2b7a4b` | `#8be6ae` |
| `--ui-data-neg` | `#c2392b` | `#ff8c7a` |
| `--ui-data-context` | `#8ea0b5` | `#6f88a8` |
| `--ui-data-1` | `#0b2748` | `#edf3fb` |
| `--ui-data-2` | `#9c5700` | `#f0c45a` |
| `--ui-data-3` | `#0b77a3` | `#8fd6ff` |
| `--ui-data-4` | `#5a708b` | `#86a0c0` |
| `--ui-on-data-1` | `#ffffff` | `#0a2342` |
| `--ui-on-data-2` | `#ffffff` | `#0a2342` |
| `--ui-on-data-3` | `#ffffff` | `#0a2342` |
| `--ui-on-data-4` | `#ffffff` | `#0a2342` |
| `--ui-inv-paper` | `#0b2748` | `#f3f6f9` |
| `--ui-inv-surface` | `#10305a` | `#ffffff` |
| `--ui-inv-ink` | `#eef3fa` | `#0b2748` |
| `--ui-inv-ink-2` | `#a9bfd9` | `#3d5878` |
| `--ui-inv-line` | `#335781` | `#b9c8d9` |
| `--ui-inv-accent` | `#f0c45a` | `#9c5700` |
| `--ui-font-display` | `"IBM Plex Sans", "IBM Plex Sans Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | `"IBM Plex Sans", "IBM Plex Sans Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |
| `--ui-font-heading` | `var(--ui-font-display)` | `var(--ui-font-display)` |
| `--ui-font-text` | `"IBM Plex Sans", "IBM Plex Sans Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | `"IBM Plex Sans", "IBM Plex Sans Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |
| `--ui-font-label` | `"IBM Plex Mono", "IBM Plex Mono Fallback", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` | `"IBM Plex Mono", "IBM Plex Mono Fallback", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` |
| `--ui-web-font-display` | `var(--ui-font-display)` | `var(--ui-font-display)` |
| `--ui-web-font-text` | `var(--ui-font-text)` | `var(--ui-font-text)` |
| `--ui-web-font-label` | `var(--ui-font-label)` | `var(--ui-font-label)` |
| `--ui-slide-font-display` | `var(--ui-font-display)` | `var(--ui-font-display)` |
| `--ui-slide-font-text` | `var(--ui-font-text)` | `var(--ui-font-text)` |
| `--ui-slide-font-label` | `var(--ui-font-label)` | `var(--ui-font-label)` |
| `--ui-display-weight` | `600` | `600` |
| `--ui-display-tracking` | `-0.01em` | `-0.01em` |
| `--ui-display-case` | `none` | `none` |
| `--ui-display-scale` | `1` | `1` |
| `--ui-label-tracking` | `0.02em` | `0.02em` |
| `--ui-radius` | `0px` | `0px` |
| `--ui-radius-sm` | `0px` | `0px` |
| `--ui-radius-xs` | `0px` | `0px` |
| `--ui-radius-pill` | `0px` | `0px` |
| `--ui-nav-fill` | `color-mix(in srgb, var(--ui-paper) 94%, transparent)` | `color-mix(in srgb, var(--ui-paper) 94%, transparent)` |
| `--ui-nav-blur` | `none` | `none` |
| `--ui-stroke` | `1` | `1` |
| `--ui-rule-width` | `1px` | `1px` |
| `--ui-type-ratio` | `1.25` | `1.25` |
| `--ui-measure` | `65ch` | `65ch` |
| `--ui-ease-settle` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | `cubic-bezier(0.2, 0.7, 0.2, 1)` |
| `--ui-ease-travel` | `cubic-bezier(0.55, 0, 0.15, 1)` | `cubic-bezier(0.55, 0, 0.15, 1)` |
| `--ui-dur-quick` | `160ms` | `160ms` |
| `--ui-dur-base` | `320ms` | `320ms` |
| `--ui-dur-slow` | `560ms` | `560ms` |
| `--ui-backdrop` | `linear-gradient(90deg, color-mix(in srgb, var(--ui-ink) 11%, transparent) 1px, transparent 1px) -1px -1px / 60px 60px, linear-gradient(color-mix(in srgb, var(--ui-ink) 11%, transparent) 1px, transparent 1px) -1px -1px / 60px 60px, linear-gradient(90deg, color-mix(in srgb, var(--ui-ink) 5%, transparent) 1px, transparent 1px) -1px -1px / 12px 12px, linear-gradient(color-mix(in srgb, var(--ui-ink) 5%, transparent) 1px, transparent 1px) -1px -1px / 12px 12px` | `linear-gradient(90deg, color-mix(in srgb, var(--ui-ink) 11%, transparent) 1px, transparent 1px) -1px -1px / 60px 60px, linear-gradient(color-mix(in srgb, var(--ui-ink) 11%, transparent) 1px, transparent 1px) -1px -1px / 60px 60px, linear-gradient(90deg, color-mix(in srgb, var(--ui-ink) 5%, transparent) 1px, transparent 1px) -1px -1px / 12px 12px, linear-gradient(color-mix(in srgb, var(--ui-ink) 5%, transparent) 1px, transparent 1px) -1px -1px / 12px 12px` |
| `--ui-backdrop-mask` | `linear-gradient(to bottom, black 20%, transparent 85%)` | `linear-gradient(to bottom, black 20%, transparent 85%)` |
| `--ui-backdrop-narrow` | `var(--ui-backdrop)` | `var(--ui-backdrop)` |
| `--ui-canvas-pattern` | `linear-gradient(90deg, color-mix(in srgb, var(--ui-ink) 12%, transparent) 1px, transparent 1px) -1px -1px / 60px 60px, linear-gradient(color-mix(in srgb, var(--ui-ink) 12%, transparent) 1px, transparent 1px) -1px -1px / 60px 60px, linear-gradient(90deg, color-mix(in srgb, var(--ui-ink) 5%, transparent) 1px, transparent 1px) -1px -1px / 12px 12px, linear-gradient(color-mix(in srgb, var(--ui-ink) 5%, transparent) 1px, transparent 1px) -1px -1px / 12px 12px` | `linear-gradient(90deg, color-mix(in srgb, var(--ui-ink) 12%, transparent) 1px, transparent 1px) -1px -1px / 60px 60px, linear-gradient(color-mix(in srgb, var(--ui-ink) 12%, transparent) 1px, transparent 1px) -1px -1px / 60px 60px, linear-gradient(90deg, color-mix(in srgb, var(--ui-ink) 5%, transparent) 1px, transparent 1px) -1px -1px / 12px 12px, linear-gradient(color-mix(in srgb, var(--ui-ink) 5%, transparent) 1px, transparent 1px) -1px -1px / 12px 12px` |
| `--ui-frame-border` | `var(--ui-rule-width) solid var(--ui-line)` | `var(--ui-rule-width) solid var(--ui-line)` |
| `--ui-card-shadow` | `none` | `none` |
| `--ui-frame-shadow` | `none` | `none` |
| `--ui-marker-size` | `7px` | `7px` |
| `--ui-marker-shape` | `50%` | `50%` |
| `--ui-marker-color` | `var(--ui-accent)` | `var(--ui-accent)` |
| `--ui-section-rule` | `none` | `none` |
| `--ui-grain` | `0` | `0` |
| `--ui-glow` | `0` | `0` |
| `--ui-cta-shadow` | `none` | `none` |
| `--ui-cta-shadow-hover` | `0 0 0 3px color-mix(in srgb, var(--ui-accent) 30%, transparent)` | `0 0 0 3px color-mix(in srgb, var(--ui-accent) 30%, transparent)` |
| `--ui-cta-fill` | `var(--ui-ink)` | `var(--ui-accent)` |
| `--ui-on-cta` | `#ffffff` | `#0a2342` |
| `--ui-em-style` | `normal` | `normal` |
| `--ui-em-color` | `var(--ui-ink)` | `var(--ui-accent)` |
| `--ui-em-decoration` | `underline light-dark(var(--ui-accent), transparent) 0.09em` | `underline light-dark(var(--ui-accent), transparent) 0.09em` |
| `--ui-star-fill` | `0` | `0` |
| `--ui-band-fill` | `#0b2748` | `#061a33` |
| `--ui-band-ink` | `#eef3fa` | `#edf3fb` |
| `--ui-band-ink-2` | `#a9bfd9` | `#acc2dc` |
| `--ui-band-cta` | `#f0c45a` | `#f0c45a` |
| `--ui-on-band-cta` | `#0b2748` | `#0a2342` |
| `--ui-band-pattern` | `none` | `none` |
| `--ui-section-index` | `inline` | `inline` |
| `--ui-corner-marks` | `linear-gradient(var(--ui-ink), var(--ui-ink)) 0 0 / 8px 1px no-repeat, linear-gradient(var(--ui-ink), var(--ui-ink)) 0 0 / 1px 8px no-repeat, linear-gradient(var(--ui-ink), var(--ui-ink)) 100% 0 / 8px 1px no-repeat, linear-gradient(var(--ui-ink), var(--ui-ink)) 100% 0 / 1px 8px no-repeat, linear-gradient(var(--ui-ink), var(--ui-ink)) 0 100% / 8px 1px no-repeat, linear-gradient(var(--ui-ink), var(--ui-ink)) 0 100% / 1px 8px no-repeat, linear-gradient(var(--ui-ink), var(--ui-ink)) 100% 100% / 8px 1px no-repeat, linear-gradient(var(--ui-ink), var(--ui-ink)) 100% 100% / 1px 8px no-repeat` | `linear-gradient(var(--ui-ink), var(--ui-ink)) 0 0 / 8px 1px no-repeat, linear-gradient(var(--ui-ink), var(--ui-ink)) 0 0 / 1px 8px no-repeat, linear-gradient(var(--ui-ink), var(--ui-ink)) 100% 0 / 8px 1px no-repeat, linear-gradient(var(--ui-ink), var(--ui-ink)) 100% 0 / 1px 8px no-repeat, linear-gradient(var(--ui-ink), var(--ui-ink)) 0 100% / 8px 1px no-repeat, linear-gradient(var(--ui-ink), var(--ui-ink)) 0 100% / 1px 8px no-repeat, linear-gradient(var(--ui-ink), var(--ui-ink)) 100% 100% / 8px 1px no-repeat, linear-gradient(var(--ui-ink), var(--ui-ink)) 100% 100% / 1px 8px no-repeat` |
| `--ui-density` | `0.9` | `0.9` |
| `--ui-column-rule` | `linear-gradient(var(--ui-ink), var(--ui-ink)) 0 0 / 1px 11px no-repeat, linear-gradient(var(--ui-ink), var(--ui-ink)) 100% 0 / 1px 11px no-repeat, linear-gradient(var(--ui-line), var(--ui-line)) 0 5px / 100% 1px no-repeat` | `linear-gradient(var(--ui-ink), var(--ui-ink)) 0 0 / 1px 11px no-repeat, linear-gradient(var(--ui-ink), var(--ui-ink)) 100% 0 / 1px 11px no-repeat, linear-gradient(var(--ui-line), var(--ui-line)) 0 5px / 100% 1px no-repeat` |
| `--ui-column-rule-gap` | `30px` | `30px` |
| `--ui-card-fill` | `var(--ui-surface)` | `var(--ui-surface)` |
| `--ui-card-pad` | `1.5rem` | `1.5rem` |
| `--ui-num-font` | `var(--ui-font-label)` | `var(--ui-font-label)` |
| `--ui-num-size` | `0.75rem` | `0.75rem` |
| `--ui-num-weight` | `600` | `600` |
| `--ui-num-prefix` | `""` | `""` |
| `--ui-num-pad` | `none` | `none` |
| `--ui-num-rule` | `0 solid transparent` | `0 solid transparent` |
| `--ui-num-color` | `var(--ui-ink)` | `var(--ui-ink)` |
| `--ui-num-fill` | `var(--ui-surface)` | `var(--ui-surface)` |
| `--ui-num-ring` | `inset 0 0 0 1px var(--ui-ink)` | `inset 0 0 0 1px var(--ui-ink)` |
| `--ui-num-box` | `2.25rem` | `2.25rem` |
| `--ui-num-bleed` | `0` | `0` |
| `--ui-num-gap` | `0px` | `0px` |
| `--ui-num-display` | `grid` | `grid` |
| `--ui-stat-divider` | `1px solid var(--ui-line)` | `1px solid var(--ui-line)` |
| `--ui-quote-fill` | `var(--ui-surface)` | `var(--ui-surface)` |
| `--ui-quote-ink` | `var(--ui-ink)` | `var(--ui-ink)` |
| `--ui-quote-ink-2` | `var(--ui-ink-2)` | `var(--ui-ink-2)` |
| `--ui-quote-line` | `var(--ui-line-soft)` | `var(--ui-line-soft)` |
| `--ui-quote-mark` | `var(--ui-accent-ink)` | `var(--ui-accent-ink)` |
| `--ui-quote-face` | `var(--ui-font-text)` | `var(--ui-font-text)` |
| `--ui-quote-weight` | `500` | `500` |
| `--ui-quote-case` | `none` | `none` |
| `--ui-quote-size` | `1.3rem` | `1.3rem` |
| `--ui-quote-rule` | `inset 0 0 0 1px var(--ui-line)` | `inset 0 0 0 1px var(--ui-line)` |
| `--ui-quote-shadow` | `0 0 transparent` | `0 0 transparent` |
| `--ui-plan-featured-border` | `var(--ui-ink)` | `var(--ui-ink)` |
| `--ui-plan-featured-ring` | `inset 0 4px 0 var(--ui-accent)` | `inset 0 4px 0 var(--ui-accent)` |
| `--ui-cell-fill` | `var(--ui-surface-2)` | `var(--ui-surface-2)` |
| `--ui-cell-ink` | `var(--ui-ink)` | `var(--ui-ink)` |
| `--ui-cell-line` | `color-mix(in srgb, var(--ui-ink) 18%, transparent)` | `color-mix(in srgb, var(--ui-ink) 18%, transparent)` |
| `--ui-cell-peak` | `var(--ui-ink)` | `var(--ui-ink)` |
| `--ui-on-cell-peak` | `var(--ui-paper)` | `var(--ui-paper)` |
| `--ui-cell-off-ink` | `var(--ui-ink-3)` | `var(--ui-ink-3)` |
| `--ui-cell-radius` | `0px` | `0px` |
| `--ui-window-dots` | `none` | `none` |
| `--ui-window-bar` | `transparent` | `transparent` |
| `--ui-web-flow-request` | `var(--ui-flow-request)` | `var(--ui-flow-request)` |
| `--ui-perf` | `solid` | `solid` |
| `--ui-plan-featured-fill` | `var(--ui-surface)` | `var(--ui-surface)` |
| `--ui-stamp-fill` | `var(--ui-surface)` | `var(--ui-surface)` |
| `--ui-stamp-ink` | `var(--ui-ink)` | `var(--ui-ink)` |
| `--ui-stamp-accent` | `var(--ui-accent-ink)` | `var(--ui-accent-ink)` |
| `--ui-stamp-border` | `1px solid var(--ui-ink)` | `1px solid var(--ui-ink)` |
| `--ui-stamp-inner` | `1px solid var(--ui-line-soft)` | `1px solid var(--ui-line-soft)` |
| `--ui-stamp-radius` | `0px` | `0px` |
| `--ui-stamp-rotate` | `0deg` | `0deg` |
| `--ui-stamp-face` | `var(--ui-font-display)` | `var(--ui-font-display)` |
| `--ui-stamp-case` | `none` | `none` |
| `--ui-stamp-size` | `2.25rem` | `2.25rem` |
| `--ui-stamp-fit` | `4.6rem` | `4.6rem` |
| `--ui-stamp-label-width` | `9em` | `9em` |
| `--ui-stamp-shadow` | `inset 0 3px 0 var(--ui-accent)` | `inset 0 3px 0 var(--ui-accent)` |
| `--ui-spot` | `var(--ui-accent)` | `var(--ui-accent)` |
| `--ui-on-spot` | `var(--ui-on-accent)` | `var(--ui-on-accent)` |
| `--ui-media-ground` | `#0a2342` | `#0a2342` |
| `--ui-media-cold` | `#0a2342` | `#0a2342` |
| `--ui-media-mid` | `#0b77a3` | `#0b77a3` |
| `--ui-media-warm` | `#8fd6ff` | `#8fd6ff` |
| `--ui-media-hot` | `#f0c45a` | `#f0c45a` |
| `--ui-media-ink` | `#f3f6f9` | `#f3f6f9` |
| `--ui-media-ramp` | `linear-gradient(90deg, var(--ui-media-cold), var(--ui-media-mid), var(--ui-media-warm), var(--ui-media-hot))` | `linear-gradient(90deg, var(--ui-media-cold), var(--ui-media-mid), var(--ui-media-warm), var(--ui-media-hot))` |
| `--ui-media-filter` | `grayscale(1) contrast(1.1)` | `grayscale(1) contrast(1.1)` |
| `--ui-media-tint` | `#0b2748` | `#0b2748` |
| `--ui-media-blend` | `lighten` | `lighten` |
| `--ui-node` | `#ffffff` | `#0d2a4f` |
| `--ui-inv-node` | `#10305a` | `#ffffff` |
| `--ui-line-solid` | `#b9c8d9` | `#2e5180` |
| `--ui-data-neg-ink` | `#b0331f` | `#ff9d8d` |
| `--ui-alert` | `#b3321f` | `#ff8c7a` |
| `--ui-warn` | `#8a5a00` | `#f0c45a` |
<!-- /generated -->

## Type

| Medium | Display | Text | Label |
| --- | --- | --- | --- |
| Page, slide, figure, chart, article, shell | IBM Plex Sans 600, −0.01em; also every figure and consulting-slide title (`--ui-font-heading`) | IBM Plex Sans 400 / 500 / 600 | IBM Plex Mono 400 / 600 (a 0.6em advance, the width diagrams and controls are authored for), tracked 0.02em |

Five self-hosted latin woff2 files (Plex Sans 400 / 500 / 600, Plex Mono 400 / 600), about 101 KB,
in `uipack/fonts/*` with metric-matched fallbacks (IBM Plex Sans over Arial, IBM Plex Mono over
Courier New). Preload IBM Plex Sans 600 (`uiStyles[].preload`). Static SVG export names IBM Plex
Sans and IBM Plex Mono before the system stacks.

## Density and rhythm

Density 0.9: compact sections, vertical rhythm only. Type ratio and measure are the core defaults.
The container radius is 0 (square); inside a drawing, nodes keep the Blueprint look's 6px.

## Ornaments

**Slots**

| Slot | Technical paints |
| --- | --- |
| `--ui-backdrop`, `--ui-backdrop-mask`, `--ui-backdrop-narrow` | Drafting film behind the hero (12px minor, 60px major hairlines), faded downward; the same grid below 720px |
| `--ui-canvas-pattern` | The same drafting film on a figure's canvas, at 12% / 5% ink |
| `--ui-marker-size` / `-shape` / `-color` | A 7px amber dot before each eyebrow |
| `--ui-section-index` | `inline`: `01 / HOW IT WORKS` in mono |
| `--ui-corner-marks` | 8px ink crop marks at all four corners of quiet cards, plans and the quote |
| `--ui-section-rule` | None (the column's dimension line marks each section) |
| `--ui-frame-border`, `--ui-frame-shadow`, `--ui-card-shadow` | 1px line, flat |
| `--ui-nav-fill`, `--ui-nav-blur` | Paper at 94% |
| `--ui-grain`, `--ui-glow`, `--ui-star-fill` | 0 |
| `--ui-cta-shadow(-hover)` | None, a 3px amber halo on hover |
| `--ui-cta-fill`, `--ui-on-cta` | Prussian ink in light, gold in dark |
| `--ui-band-*` | A plain Prussian closing band (no grid: the grid is the hero's and the figure's), gold button |
| `--ui-stamp-*` | A revision tag: square, ruled, amber top bar, the figure in the heading face; fit 4.6rem, label 9em |

**Treatment roles: an engineering drawing**

| Role | Technical |
| --- | --- |
| `--ui-perf` | `solid` |
| `--ui-column-rule`, `-gap` | A dimension line: a hairline across the column with an end tick at both ends |
| `--ui-card-fill`, `--ui-card-pad` | Surface, 1.5rem |
| `--ui-num-*` | A detail bubble: the number in mono inside a 36px ink-ringed circle |
| `--ui-stat-divider` | 1px rule |
| `--ui-quote-*` | Annotation: surface, a 1px hairline frame, text face, amber quote mark |
| `--ui-plan-featured-*` | Ink border, 4px amber rule along the top |
| `--ui-cell-*` | Square cells on surface-2, Prussian-ink peaks |
| `--ui-window-dots`, `--ui-window-bar` | No traffic lights, clear bar |
| `--ui-web-flow-request` | The flow request (cyan, the main flow) |

**Component treatments** (`src/web/web-styles.css`, keyed on the page's style; never move a box)

| Part | Technical |
| --- | --- |
| `DataTable` | A drawing schedule: every cell ruled, ink frame, tinted head, item numbers `01`… |
| `WorkedExample` | A dimensioned detail on drafting film: ruled callouts with numbered balloons, dimension-line arrows, results boxed, a `NOTE` title-block cell |
| `ItemList` | Drawing notes: numbered `1.` in mono, values in a ruled cell |
| `Proof` stats, `StarHero facts` | A title block: ruled cells in an ink frame, label first in mono caps |
| `FAQ` | Each question numbered `01` |
| `ProductShot` | A drawing sheet: an inner keyline, numbered balloon pins, Prussian tag notes, a title-block caption; photos printed as a cyanotype |
| Bands | Plain |

## Layout

Technical uses every page type and picks the library's archetype for each, unchanged: they were
drawn for this site first. Density 0.9 compacts vertical rhythm only.

### Landing

`product-landing` as is: the 1120px column, the split hero with the product's real output (the
`/web` sample), the author's section order. Its own opt-in order (`WebPage layout="style"`,
`uiStyles[].prefers`) is listed in [landing layout, Order](../system/layout/landing.md#order).

### Documentation

`docs-shell` as is, with "View as Markdown" and "Edit on GitHub" in the context row and
`width="wide"` on pages with wide demos. The docs site sets its own widths in [its spec](docs-site.md#layout).

### Article

`layer-article` as is, with every part (the article parts page and the AI-stack example).

### Deck

`slide-canvas` as is: eyebrows off, Points the default slide, advance on nearly every slide (the
deck player examples).

### Dashboard

`one-question-dashboard` as is; no page here is a dashboard yet.

## Writing style

The house voice. Its title aims are the code defaults in `src/deck/budgets.ts` (`WORD_GUIDES`),
generated below; the ceilings they sit under are core.

| Setting | Technical |
| --- | --- |
| Tone and register | The house voice: plain and specific, answer first, as these docs are written |
| Title form | Deck presented: short spoken verdict. Deck read alone, figure, documentation, article: full-sentence claim (docs headings are plain names). Landing: plain-name section heads; the hero headline says what changed for the reader |
| Copy density | Compact: short paragraphs of at most three sentences on a scanned page; fragments on slides; tables over prose for values |
| House words | "UiPack" for the product; plain names, never coined labels; internal codes only in parentheses |
| Budgets | The aims below, inside the core ceilings |

<!-- generated:headline-rule -->
- **Presented** (a speaker in the room): aim for 2–5 words; the check stops at 6 (`title-length`). A verdict you would say aloud.
- **Read alone** (a pre-read, a forwarded deck, a figure): the claim as one sentence of 3–14 words.
- **Web section head:** 2–5 plain words naming what the reader gets.
<!-- /generated -->

<!-- generated:word-guides -->
| Text | Length | The check |
| --- | --- | --- |
| Presented slide title | aim for 2–5 words | `title-length` stops at 6 |
| Read-alone title, figure title | 3–14 words, one sentence | `title-length` stops at 14 |
| Web section head | 2–5 words | not linted |
| Label in a drawing | 2–3 words | `slot-budget` stops at 3 |
| Slide points | 2–4 a slide, each at most 8 words | `slot-budget` |
| Speaker cues (`say`, presented) | at most 60 words | `notes-cues` |
<!-- /generated -->

The presented title has two numbers on purpose. Writers under the trimmed rules wrote titles of up
to six words that passed the check, and no judge marked one down, so the check allows the longest
of those and Technical asks for the shorter aim. The lint message (`title-length`) says the same
thing in the same words.

## Component looks

| Component | Technical picks | Why |
| --- | --- | --- |
| Diagrams | `blueprint`, theme `blueprint` on every page | The one diagram grammar, shared with every site; the built-in `blueprint` theme is Technical's values |
| 3D object scenes | All six | The gallery shows every look; each scene offers its subject's two or three ([which](../components/3d.md#which-subjects-offer-each-look)) |
| Mechanism | `isometric` | Drawn in the Cyanotype roles: Prussian tones, the amber (gold in dark) lit part |

## Reuse

Extends `core` only. The UiPack docs site extends it ([docs-site](docs-site.md)); another site that
should look like UiPack says `extends: technical`.

## Open TODOs

- TODO: the Blueprint diagram look's values are Technical's today and figures still read them from
  the host's roles; once the look owns them ([Diagrams](../components/diagrams.md)), this spec stops
  listing the flow roles as its own.
- TODO: `lintDeck` reads the code's budgets (`src/deck/budgets.ts`) and takes no per-site budget
  (`LintOptions` in `src/deck/storyline/rules.ts`), so a spec's tighter budget is held by review, not
  by the linter ([Writing](../system/writing/README.md#ceilings-and-technicals-defaults)).
