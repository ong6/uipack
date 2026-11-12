---
spec: docs-site
site: ui.junxiong.dev (the uipack docs site, this repo's playground)
extends: technical
pages: [documentation]
layouts: { documentation: docs-shell }
components: { diagrams: blueprint, 3d: [studio, paper-theatre, kinetic, cartoon, realistic, abstract], mechanism: isometric }
diagram-themes: { default: blueprint }
status: implemented
uipack: current
values: playground/site-palette.css
---

# Docs site: the ui.junxiong.dev spec

The spec of the uipack docs site at [ui.junxiong.dev](https://ui.junxiong.dev): what it sets on top
of [Technical](technical.md), the package's default look. Read it before changing the site's dark
palette, its sidebar sections and their hues, its location marker or the docs shell's widths;
everything else is Technical's and a rule for no other site.

Its values live in `playground/site-palette.css`, loaded only by the site, so the package and every
other site keep Technical ([what a spec may set](../system/spec-settings.md)). The role table below
is generated from Technical's file with the site's laid over it, so page and code cannot drift.

## Identity

Technical's blueprint, read at night. Light is Technical exactly: Prussian ink on a cool white
sheet, one amber mark. Dark is the site's own: a near-black neutral ground, charcoal rather than
Technical's Prussian blue (the owner, 2026-11-11: "make it darker", "consider new colors for dark
mode"), with neutral surfaces a small step lighter each, a neutral ink ramp, and Technical's gold
and flow hues re-tuned to sit on charcoal. The sidebar is how a reader finds their way: five
sections, each with an icon and a hue, and a paper plane that flies to where the reader is.

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

**Hues.** Each section has a hue, used on exactly three things: the section heading's icon, the
current-page marker, and the page's breadcrumb chip (and the section's group in search results).
Never on text, links or status. Start is the ink and Rules the accent; Build, Check and Reference
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
and "On this page" (on the heading being read). `plane` (the default) is a paper plane; `mark` is
the uipack logo's square mark. The setting is `SITE_MARKER` in `playground/site-settings.tsx`;
`?marker=mark` or `?marker=plane` overrides it for the rest of a visit, so the two can be compared
live. In "On this page" the marker glides along a dotted path that steps right for each h3, the
read part of the path in the accent. In the sidebar, when the page changes, it flies from the page
the reader left along the sidebar's page column (out to a sub-page's tree line), crossing sections
if it must, the new section opening as it arrives, a short dotted trail fading behind it, and docks
facing the link, tinted with the section's hue. With reduced motion it jumps. The current page is
also marked by weight and a tinted row, so the marker is never the only cue.

**Search.** A box at the top of the sidebar (and the drawer) and ⌘K / Ctrl-K open one dialog over
every page's title, headings and text; results are grouped by section with the section's icon in
its hue.

## Type

Technical's, unchanged ([Technical, Type](technical.md#type)): IBM Plex Sans 600 headings, Plex
Sans text, IBM Plex Mono labels, self-hosted. Sidebar levels: section labels in mono caps 12px
600 (ink), pages 13.5px (ink-2), sub-pages 12.5px (ink-3), captions 12px mono (ink-3).

## Density and rhythm

Technical's (density 0.9, the core type ratio). Prose keeps a 76ch measure.

## Ornaments

Technical's slots and treatments, unchanged ([Technical, Ornaments](technical.md#ornaments)). The
location marker and the section hues are navigation, not ornaments: they are set under
[Navigation](#navigation).

## Layout

### Documentation

`docs-shell`, with this site's widths (`playground/showcase.css`):

| Setting | This site |
| --- | --- |
| Banner | Sticky, 64px, full width |
| Sidebar | Docked to the left edge under the banner, 232–288px (15vw), scrolling on its own |
| Page column | At most 880px; prose at a 76ch measure inside it; tables, code, figures and demos take the whole column |
| On this page | 204–248px, 40–56px from the column; the column and the rail are centred as a pair, so the spare width goes to the outer margins and there is no dead gutter between the text and the rail at 1440 or 1920 |
| A page without a rail | Its demos need the width (a figure gallery, charts, 3D): a column up to 1344px, 1176px at 1440, so a 1120-unit figure draws within 1% of its own size |
| 900–1180px | "On this page" folds into a disclosure above the page |
| Below 900px | The sidebar becomes a drawer from the header's menu button; "On this page" is the disclosure; phone type sizes are the docs layout's own |

## Writing style

Technical's ([Technical, Writing style](technical.md#writing-style)): the house voice.

| Setting | This site |
| --- | --- |
| Tone and register | As Technical: plain and specific, answer first |
| Title form | As Technical: documentation headings are plain names |
| Copy density | As Technical: compact, tables over prose for values |
| House words | As Technical: "UiPack" for the product; section names Start, Rules, Build, Check, Reference |
| Budgets | The ceilings, as Technical |

## Component looks

As Technical: diagrams in `blueprint` (theme `blueprint`), all six 3D looks, the `isometric`
mechanism. Figures read the page's roles, so in dark they sit on the site's charcoal surfaces; their
grammar, flow meanings and strokes are the look's own.

## Reuse

Extends `technical`. No other site reuses this spec; a site that wants the uipack docs site's look,
dark palette and navigation included, says `extends: docs-site`.

## Open TODOs

- TODO: the landing page at `/` is being redesigned on its own branch; when it lands, add
  `landing` to `pages:` with its layout here.
- TODO: static SVG export (`uipack/static`) and still images keep Technical's dark values; whether
  the site's stills should follow its charcoal is open (the owner decides).
