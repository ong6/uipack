---
spec: docs-site
site: ui.junxiong.dev (the uipack docs site, this repo's playground)
extends: technical
pages: [landing, documentation]
layouts: { landing: product-landing, documentation: docs-shell }
components: { diagrams: blueprint, 3d: [studio, paper-theatre, kinetic, cartoon, realistic, abstract], mechanism: isometric }
diagram-themes: { default: docs-night }
status: implemented
uipack: current
values: playground/site-palette.css
---

# Docs site: the ui.junxiong.dev spec

The spec of the uipack docs site at [ui.junxiong.dev](https://ui.junxiong.dev): what it sets on top
of [Technical](technical.md), the package's default look. Read it before changing the site's dark
palette, the dark ground its demos sit on, its sidebar sections and their hues, its location marker,
the docs shell's widths or the landing page; everything else is Technical's and a rule for no other
site.

Its values live in `playground/site-palette.css`, loaded only by the site, so the package and every
other site keep Technical ([what a spec may set](../system/spec-settings.md)). The role table below
is generated from Technical's file with the site's laid over it, so page and code cannot drift.

## Identity

Technical's blueprint, read at night. Light is Technical exactly: Prussian ink on a cool white
sheet, one amber mark. Dark is the site's own: a near-black neutral ground, charcoal rather than
Technical's Prussian blue (the owner, 2026-11-11: "make it darker", "consider new colors for dark
mode"), with neutral surfaces a small step lighter each, a neutral ink ramp, and Technical's gold
and flow hues re-tuned to sit on charcoal. Nothing large reads as blue in dark: the live demos and
previews sit on the same charcoal ([Demos and fixed looks](#demos-and-fixed-looks)). The sidebar is how a reader finds their way: five
sections, each with an icon and a hue, and the uipack mark, which hops to where the reader is.

## Role values

Every role, light and dark: Technical's values with the site's own laid over them (the site sets
the surfaces, the ink ramp, the accent and what sits on it, the data context and slate slots, the
closing band and the line roles in dark; light is unchanged). Contrast: every text role is 4.5:1 or
more on every surface in both themes, and every mark 3:1 (`test/site-palette.test.tsx`).

<!-- generated:spec-roles -->
| Role | Light | Dark |
| --- | --- | --- |
| `--ui-paper` | `#f3f6f9` | `#111315` |
| `--ui-surface` | `#fcfdfe` | `#16181b` |
| `--ui-surface-raised` | `#ffffff` | `#1c1f23` |
| `--ui-surface-2` | `#e2e9f1` | `#22262a` |
| `--ui-ink` | `#0b2748` | `#eceef1` |
| `--ui-ink-2` | `#3d5878` | `#b3bac2` |
| `--ui-ink-3` | `#4b6485` | `#8f979f` |
| `--ui-line` | `color-mix(in srgb, var(--ui-ink) 26%, transparent)` | `color-mix(in srgb, var(--ui-ink) 26%, transparent)` |
| `--ui-line-soft` | `color-mix(in srgb, var(--ui-ink) 13%, transparent)` | `color-mix(in srgb, var(--ui-ink) 13%, transparent)` |
| `--ui-accent` | `#9c5700` | `#f3c05a` |
| `--ui-accent-ink` | `var(--ui-accent)` | `var(--ui-accent)` |
| `--ui-accent-stroke` | `var(--ui-accent)` | `var(--ui-accent)` |
| `--ui-on-accent` | `#ffffff` | `#111315` |
| `--ui-accent-surface` | `#0b2748` | `#f3c05a` |
| `--ui-accent-ink-2` | `#f0c45a` | `#111315` |
| `--ui-accent-line` | `#2f4f78` | `#b8913a` |
| `--ui-flow-request` | `#0b77a3` | `#8fd6ff` |
| `--ui-flow-response` | `#2b7a4b` | `#8be6ae` |
| `--ui-flow-change` | `#7048c0` | `#d2b4ff` |
| `--ui-flow-error` | `#c2392b` | `#ff8c7a` |
| `--ui-data-pos` | `#2b7a4b` | `#8be6ae` |
| `--ui-data-neg` | `#c2392b` | `#ff8c7a` |
| `--ui-data-context` | `#8ea0b5` | `#737b85` |
| `--ui-data-1` | `#0b2748` | `#eceef1` |
| `--ui-data-2` | `#9c5700` | `#f3c05a` |
| `--ui-data-3` | `#0b77a3` | `#8fd6ff` |
| `--ui-data-4` | `#5a708b` | `#a2adbb` |
| `--ui-on-data-1` | `#ffffff` | `#111315` |
| `--ui-on-data-2` | `#ffffff` | `#111315` |
| `--ui-on-data-3` | `#ffffff` | `#111315` |
| `--ui-on-data-4` | `#ffffff` | `#111315` |
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
| `--ui-on-cta` | `#ffffff` | `#111315` |
| `--ui-em-style` | `normal` | `normal` |
| `--ui-em-color` | `var(--ui-ink)` | `var(--ui-accent)` |
| `--ui-em-decoration` | `underline light-dark(var(--ui-accent), transparent) 0.09em` | `underline light-dark(var(--ui-accent), transparent) 0.09em` |
| `--ui-star-fill` | `0` | `0` |
| `--ui-band-fill` | `#0b2748` | `#0b0c0e` |
| `--ui-band-ink` | `#eef3fa` | `#eceef1` |
| `--ui-band-ink-2` | `#a9bfd9` | `#b3bac2` |
| `--ui-band-cta` | `#f0c45a` | `#f0c45a` |
| `--ui-on-band-cta` | `#0b2748` | `#111315` |
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
| `--ui-node` | `#ffffff` | `#16181b` |
| `--ui-inv-node` | `#10305a` | `#ffffff` |
| `--ui-line-solid` | `#b9c8d9` | `#363b41` |
| `--ui-data-neg-ink` | `#b0331f` | `#ff9d8d` |
| `--ui-alert` | `#b3321f` | `#ff8c7a` |
| `--ui-warn` | `#8a5a00` | `#f0c45a` |
<!-- /generated -->

## Navigation

The sidebar has five sections, in reading order: **Start** (what UiPack is, install, the agent
read order), **Rules** (the core rules and the site specs), **Build** (recipes, components,
component looks, examples), **Check** (grading, rubrics, testing) and **Reference** (the registry,
icons, releases, contributing, web reference). The pages in each are `docsManifest` in
`playground/docs-manifest.ts`.

**Hues.** Each section has a hue, used on exactly four things: the section heading's icon, the
current-page marker, the page's breadcrumb chip (and the section's group in search results), and
the dot of the header's mark (below). Never on text, links or status. Start is the ink and Rules the accent; Build, Check and Reference
are Technical's request cyan, response green and slate, re-tuned for charcoal in dark. Each is 3:1
or more as a mark on every ground. Generated from `playground/site-palette.css`:

<!-- generated:nav-hues -->
| Section | Role | Light | Dark |
| --- | --- | --- | --- |
| Start | `--site-hue-start` | `var(--ui-ink)` | `var(--ui-ink)` |
| Rules | `--site-hue-rules` | `var(--ui-accent)` | `var(--ui-accent)` |
| Build | `--site-hue-build` | `#0b77a3` | `#7cc4ec` |
| Check | `--site-hue-check` | `#2b7a4b` | `#7dd9a0` |
| Reference | `--site-hue-reference` | `#5a708b` | `#a2adbb` |
<!-- /generated -->

**The location marker.** One shape for both places it shows: the sidebar (beside the current page)
and "On this page" (on the heading being read). The site's is `mark`, the uipack logo's square mark,
hopping like a game piece (owner, 2026-11-12: "it can also be our logo hopping around"); `plane` is
the package's paper plane, which flies a dotted path. The setting is `SITE_MARKER` in
`playground/site-settings.tsx`; `?marker=plane` or `?marker=mark` overrides it for the rest of a
visit. The marker shows the page's state, as the header's mark does (below): three squares in the
ink and the dot on the section's cell in its hue, the neutral mark on a Reference page. It is drawn
for its 14px size: 5px squares on a 1.25px line, not the header's drawing scaled down.

In the sidebar, when the page changes, the mark hops from the page the reader left along the
page column (out to a sub-page's tree line), crossing sections if it must, the new section
opening as it arrives. A hop is a small arc off the column (2.5 to 5px) ending in a soft squash; a trip is one hop for each 36px, nine at most, over 300ms plus 3ms a pixel (1400ms at most), so the mark stays by the short dotted trail it leaves. Each hop is a plain arc, a full turn, a lean or two skips, to either side, picked from the trip's ends. Across sections it changes its dot's cell and hue as its last hop lifts (`?morph=pause`, `portal` or `flip` previews a stop to change in). In "On this page" the mark hops down a dotted path that steps right
for each h3, the read part in the accent; when headings pass faster than a hop it makes for the
latest, never a queue. With reduced motion nothing hops: the marker is drawn in place. The current page is also marked by weight and a tinted row, so the
marker is never the only cue.

**The mark.** The header's uipack mark is the one mark (three outlined squares and one filled dot)
with its dot on the page's section (owner, 2026-11-12): its four cells in reading order are Start
(top left), Rules (top right), Build (bottom left) and Check (bottom right), and on a page in one of
them that cell is the dot, filled in the section's hue; the other three are squares in the ink, and
the name stays in the ink. Reference has no cell: its pages, the Assets tab, the landing page at
rest and a not-found page show the neutral mark, the dot bottom right in the ink, as the package
draws it. Each hue holds 3:1 or more as the dot on the header's ground in both themes (the lowest is
Build in light, 4.6:1). When the page changes section the dot hops from the cell the reader left
(kept for the visit in sessionStorage, as the sidebar marker's page is): the marker's hop, an arc
6 units above the line between the cells, the dot taking the new hue on the way and squashing as
it lands, the square it lands on making way and the cell it left redrawing as a square. The hop takes the slow duration role (560ms) and the redraw the base one (320ms). It
waits 400ms for the page to settle (`--site-mark-wait`), or longer when the sidebar's marker is
travelling, so the two land together. A change between the neutral mark and Check, which share a
cell, is a hop in place. On the landing page it visits Start, Rules, Build and Check in turn, 2s
each, hopping between them over the last 560ms of each state, in one 8s CSS loop that never moves
the header. With reduced motion the dot is drawn in place and the landing page holds the neutral
mark. The dot repeats what the breadcrumb chip and the sidebar say in words, so it is never the
only cue. It is `Wordmark`'s `live` and `liveColor` ([figure parts API](../figure-api.md)), mapped
in `playground/site-settings.tsx` (`BRAND_CELLS`, `useBrandMark`, and `markerState` for the docs
layout's marker) and moved by `playground/showcase.css`; `e2e/brand-mark.spec.ts` holds it.

**Search.** A box at the top of the sidebar (and the drawer) and ⌘K / Ctrl-K open one dialog over
every page's title, headings and text; results are grouped by section with the section's icon in
its hue.

## Type

Technical's, unchanged ([Technical, Type](technical.md#type)): IBM Plex Sans 600 headings, Plex
Sans text, IBM Plex Mono labels, self-hosted. Sidebar levels: section labels in mono caps 12px
600 (ink), pages 14px (ink-2), sub-pages 13px (ink-2, on the tree line), captions 12px mono (ink-3); "On
this page" 13.5px (ink-2), its sub-headings 13px.

## Density and rhythm

Technical's (density 0.9, the core type ratio). Prose keeps a 37em measure, 75–88 characters a line
(Plex Sans averages about 0.45em a character; a `ch` is 0.6em, so a 76ch measure ran to 105), and
steps up from 17px to 18px from 1440.

## Ornaments

Technical's slots and treatments, unchanged ([Technical, Ornaments](technical.md#ornaments)). The
location marker and the section hues are navigation, not ornaments: they are set under
[Navigation](#navigation).

## Layout

### Landing

`product-landing`, at `/` (`playground/LandingShowcase.tsx`, `playground/landing.css`, its words in
`playground/landing/content.ts`), in the archetype's one 1120px column, with this site's changes:

| Setting | This site |
| --- | --- |
| Banner | The shell's (sticky, 64px, its ground and rule full width); its logo, tabs, search and theme toggle sit on the page's 1120px column, on the sections' edges (`playground/showcase.css`, "The landing view") |
| Hero | Split: the statement, the install line with a copy button (the release `docs:sync` writes), Read the docs and Open the gallery on 5 columns; the product's real output on 7: the agent read order as a live figure building a real page (the `/web` sample, Tidy: its brand, headline, action, a figure of the product and its result rows), with an authored phone drawing |
| Section order | Hero, Start from your job (the four Build cards in one row, each tinted with its docs section's hue), How it's built (the layers as a `LayerStack` on two thirds, the text and a read-next list beside it), The parts (live parts in a bento), Set the rules, check the work (the two secondary cards, Rules and Check: most readers only build), For agents (the closing band), then a footer site map generated from the docs manifest's five sections |
| Goal | Read the docs: the hero's one filled button. The closing band's action is its own (How an agent uses UiPack), in the band's gold |
| Loading | The hero figure at once; the layer stack and the parts as they near the viewport; the 3D scene only on screen, with WebGL and motion allowed, a still otherwise |

### Documentation

`docs-shell`, with this site's widths (`playground/showcase.css`):

| Setting | This site |
| --- | --- |
| Banner | Sticky, 64px, full width; its logo starts on the sidebar's left inset (below 900px the menu icon on the page's edge) and its last control ends on the right edge of "On this page", or of the page column where there is no rail. On Assets both sit on the grid's edges |
| Page bar | Where the page sits, and nothing else: its section's chip, then its parent page (a sub-page's page, a deck view's Deck player). To the right, "Style: Technical", See it in Assets (where the gallery has the page's assets), View as Markdown and Edit on GitHub; a phone keeps the location and the style |
| Sidebar | Docked to the left edge under the banner, 232–288px (15vw), scrolling on its own |
| Page column | At most 760px; prose at a 37em measure inside it (75–88 characters a line, 18px from 1440); tables, code, figures and demos take the whole column |
| On this page | 204–248px, 40–56px from the column; the column and the rail are centred as a pair, so the spare width goes to the outer margins and there is no dead gutter between the text and the rail at 1440 or 1920 |
| A page without a rail | Its demos need the width (a figure gallery, charts, 3D): a column up to 1344px, 1176px at 1440, so a 1120-unit figure draws within 1% of its own size |
| 900–1180px | "On this page" folds into a disclosure above the page |
| A table wider than the column | Scrolls inside its own focusable box (the arrow keys move it), its content fading out at each edge that has more table beyond it (a mask on the box, so nothing darkens behind the text; the shell marks which edges have more as the box scrolls or resizes); never a page-wide scroll |
| Below 900px | The sidebar becomes a drawer from the header's menu button; "On this page" is the disclosure; phone type sizes are the docs layout's own |

## Writing style

Technical's ([Technical, Writing style](technical.md#writing-style)): the house voice.

| Setting | This site |
| --- | --- |
| Tone and register | As Technical: plain and specific, answer first |
| Title form | As Technical: documentation headings are plain names |
| Copy density | As Technical: compact, tables over prose for values |
| House words | As Technical: "UiPack" for the product; section names Start, Rules, Build, Check, Reference |
| Landing | As Technical: plain-name section heads of two to five words; the hero headline says what UiPack is for the reader |
| Budgets | The ceilings, as Technical |

## Component looks

As Technical: diagrams in `blueprint`, all six 3D looks, the `isometric` mechanism. Diagrams take the
site's diagram theme, `docs-night`: Blueprint's ink, accent and flow colours (Technical's, the
`blueprint` theme exactly in light), on this site's charcoal ground in dark (below). Every live demo
and Assets preview shows a part as the package draws it, with Technical's hues: the site's palette
stops at each demo (`.showcase-demo`) and preview, which reset to Technical, except for the ground.

### Demos and fixed looks

In dark, every demo, Assets preview and figure canvas dialog, and every 3D scene's card, sits on the
site's charcoal ground instead of Technical's Prussian navy (the owner, 2026-11-12: "the dark mode is
still blue, i dont want it to be blue"; "the rules in the first place should be per site and flexible
to changes if needed"). The site sets only the ground a part sits on, the allowance
[a spec has for a fixed look](../system/spec-settings.md): the paper, the surfaces, node fills,
solid lines and the closing band, the values below (the same as the page's). A part's ink, accent,
flow, data and slide hues stay Technical's, so a figure, slide or chart reads as it does on every
site. Light is Technical's exactly. A 3D scene's own world, once WebGL draws it, is its look's, and
static exports and stills keep Technical (see Open TODOs). Generated from `playground/site-palette.css`:

<!-- generated:demo-ground -->
| Role | Light (Technical's) | Dark (the site's) |
| --- | --- | --- |
| `--ui-paper` | `#f3f6f9` | `#111315` |
| `--ui-surface` | `#fcfdfe` | `#16181b` |
| `--ui-surface-raised` | `#ffffff` | `#1c1f23` |
| `--ui-surface-2` | `#e2e9f1` | `#22262a` |
| `--ui-node` | `#ffffff` | `#16181b` |
| `--ui-line-solid` | `#b9c8d9` | `#363b41` |
| `--tune-slide-line` | `#b9c8d9` | `#363b41` |
| `--ui-band-fill` | `#0b2748` | `#0b0c0e` |
<!-- /generated -->

## Reuse

Extends `technical`. No other site reuses this spec; a site that wants the uipack docs site's look,
dark palette and navigation included, says `extends: docs-site`.

## Open TODOs

- TODO: static SVG export (`uipack/static`), the asset manifest's dark previews and the 3D stills
  keep Technical's dark values; whether the site's stills should follow its charcoal is open (the
  owner decides). The diagram themes demo shows each theme's own dark, Blueprint's navy included, on
  purpose; the art directions' WebGL worlds (Cartoon's night sky, Abstract's navy pool) are their
  looks'.
