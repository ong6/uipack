---
spec: TODO-site-id
site: TODO the website, e.g. example.com
extends: core
pages: [landing, documentation]
layouts: { landing: product-landing, documentation: docs-shell }
components: { diagrams: blueprint }
diagram-themes: { default: blueprint }
status: draft
uipack: TODO the uipack commit the site pins
values: TODO the style file once implemented (src/styles/<id>.css), or none
---

# TODO Site name: style spec

Copy this file to start a site's spec (`docs/specs/<id>.md` in uipack, or `STYLE.md` at the root
of the site's own repo), keep every heading, and replace each `TODO`. A value you can't determine
from the live site stays a `TODO:` line with what would decide it. `scripts/check-spec.ts` checks
the shape; [How to write a spec](README.md) explains each part.

Frontmatter: `spec` is the id other specs extend; `extends` is `core`, or the id of a spec whose
look this site reuses; `pages` lists the [page types](../system/layout/README.md#how-a-spec-sets-layout)
the site has (a deck counts: it is a page of the site); `layouts` gives each one an
[archetype](../system/layout/README.md#archetype-library) id or `custom`; `components` picks the
[component looks](../components/README.md) the site uses (`3d: [studio, realistic]` for several);
`diagram-themes` says which [diagram theme](../components/diagrams.md#diagram-themes) colours the
site's figures: `default` for the site, plus one key per page (or page group) that has its own,
e.g. `{ default: site-paper, compoze: compoze, trading: trading }`; a theme UiPack doesn't ship
(only `blueprint` is built in) is described under `## Component looks`; `status` is `draft` or
`implemented`; `uipack` is the pinned commit; `values` is the style file when UiPack renders this
look. Replace the example `pages`, `layouts`, `components` and `diagram-themes` with the site's own.

## Identity

TODO: one paragraph. Who the site is for, what it must feel like, and the one idea that makes it
recognisable. Name what it is not.

## Role values

Every role in the [role contract](../system/style.md#the-role-contract), light and dark. Colours as
hex; a non-colour role (a face, a radius, a scalar) gives the same value in both columns.

<!-- generated:contract-roles -->
| Role | Light | Dark |
| --- | --- | --- |
| `--ui-paper` | TODO: | TODO: |
| `--ui-surface` | TODO: | TODO: |
| `--ui-surface-raised` | TODO: | TODO: |
| `--ui-surface-2` | TODO: | TODO: |
| `--ui-ink` | TODO: | TODO: |
| `--ui-ink-2` | TODO: | TODO: |
| `--ui-ink-3` | TODO: | TODO: |
| `--ui-line` | TODO: | TODO: |
| `--ui-line-soft` | TODO: | TODO: |
| `--ui-accent` | TODO: | TODO: |
| `--ui-on-accent` | TODO: | TODO: |
| `--ui-accent-surface` | TODO: | TODO: |
| `--ui-accent-ink-2` | TODO: | TODO: |
| `--ui-accent-line` | TODO: | TODO: |
| `--ui-flow-request` | TODO: | TODO: |
| `--ui-flow-response` | TODO: | TODO: |
| `--ui-flow-change` | TODO: | TODO: |
| `--ui-data-pos` | TODO: | TODO: |
| `--ui-data-neg` | TODO: | TODO: |
| `--ui-data-context` | TODO: | TODO: |
| `--ui-data-1` | TODO: | TODO: |
| `--ui-data-2` | TODO: | TODO: |
| `--ui-data-3` | TODO: | TODO: |
| `--ui-data-4` | TODO: | TODO: |
| `--ui-on-data-1` | TODO: | TODO: |
| `--ui-on-data-2` | TODO: | TODO: |
| `--ui-on-data-3` | TODO: | TODO: |
| `--ui-on-data-4` | TODO: | TODO: |
| `--ui-inv-paper` | TODO: | TODO: |
| `--ui-inv-surface` | TODO: | TODO: |
| `--ui-inv-ink` | TODO: | TODO: |
| `--ui-inv-ink-2` | TODO: | TODO: |
| `--ui-inv-line` | TODO: | TODO: |
| `--ui-inv-accent` | TODO: | TODO: |
| `--ui-inv-node` | TODO: | TODO: |
| `--ui-node` | TODO: | TODO: |
| `--ui-line-solid` | TODO: | TODO: |
| `--ui-accent-ink` | TODO: | TODO: |
| `--ui-data-neg-ink` | TODO: | TODO: |
| `--ui-alert` | TODO: | TODO: |
| `--ui-warn` | TODO: | TODO: |
| `--ui-slide-font-text` | TODO: | TODO: |
| `--ui-slide-font-label` | TODO: | TODO: |
| `--ui-slide-font-display` | TODO: | TODO: |
| `--ui-web-font-text` | TODO: | TODO: |
| `--ui-web-font-label` | TODO: | TODO: |
| `--ui-web-font-display` | TODO: | TODO: |
| `--ui-font-text` | TODO: | TODO: |
| `--ui-font-label` | TODO: | TODO: |
| `--ui-font-display` | TODO: | TODO: |
| `--ui-display-weight` | TODO: | TODO: |
| `--ui-display-tracking` | TODO: | TODO: |
| `--ui-display-case` | TODO: | TODO: |
| `--ui-label-tracking` | TODO: | TODO: |
| `--ui-radius` | TODO: | TODO: |
| `--ui-radius-sm` | TODO: | TODO: |
| `--ui-radius-xs` | TODO: | TODO: |
| `--ui-radius-pill` | TODO: | TODO: |
| `--ui-stroke` | TODO: | TODO: |
| `--ui-rule-width` | TODO: | TODO: |
| `--ui-density` | TODO: | TODO: |
| `--ui-type-ratio` | TODO: | TODO: |
| `--ui-measure` | TODO: | TODO: |
| `--ui-ease-settle` | TODO: | TODO: |
| `--ui-ease-travel` | TODO: | TODO: |
| `--ui-dur-quick` | TODO: | TODO: |
| `--ui-dur-base` | TODO: | TODO: |
| `--ui-dur-slow` | TODO: | TODO: |
| `--ui-backdrop` | TODO: | TODO: |
| `--ui-backdrop-mask` | TODO: | TODO: |
| `--ui-frame-border` | TODO: | TODO: |
| `--ui-frame-shadow` | TODO: | TODO: |
| `--ui-card-shadow` | TODO: | TODO: |
| `--ui-marker-size` | TODO: | TODO: |
| `--ui-marker-shape` | TODO: | TODO: |
| `--ui-marker-color` | TODO: | TODO: |
| `--ui-section-rule` | TODO: | TODO: |
| `--ui-nav-fill` | TODO: | TODO: |
| `--ui-nav-blur` | TODO: | TODO: |
| `--ui-grain` | TODO: | TODO: |
| `--ui-glow` | TODO: | TODO: |
| `--ui-cta-shadow` | TODO: | TODO: |
| `--ui-cta-shadow-hover` | TODO: | TODO: |
| `--ui-display-scale` | TODO: | TODO: |
| `--ui-em-style` | TODO: | TODO: |
| `--ui-em-color` | TODO: | TODO: |
| `--ui-star-fill` | TODO: | TODO: |
| `--ui-accent-stroke` | TODO: | TODO: |
| `--ui-flow-error` | TODO: | TODO: |
| `--ui-font-heading` | TODO: | TODO: |
| `--ui-canvas-pattern` | TODO: | TODO: |
| `--ui-cta-fill` | TODO: | TODO: |
| `--ui-on-cta` | TODO: | TODO: |
| `--ui-em-decoration` | TODO: | TODO: |
| `--ui-num-ring` | TODO: | TODO: |
<!-- /generated -->

Keep every row (the list is generated from the contract); the checker names any that go missing.

## Type

TODO: the display, text and label faces with their weights, tracking and case; where each is
self-hosted; the fallback metrics; the face to preload.

## Density and rhythm

TODO: the density scalar (`--ui-density`), type ratio and measure, and why.

## Ornaments

TODO: what the spec paints in each ornament slot (backdrop, canvas pattern, eyebrow marker,
section rule, frames, card corners, nav, ambient switches, the primary button, the closing band,
the stamp) and the treatment roles (`--ui-perf`, `--ui-card-*`, `--ui-num-*`, `--ui-quote-*`,
`--ui-cell-*`, `--ui-window-*`). Only slots: nothing here takes space or moves a box.

## Layout

One `###` per page type in `pages:`. For a picked archetype, say what the site keeps and what it
changes when it extends it (max width, hero pattern, section order, which section archetypes it
uses). For `custom`, fill the four rows the checker requires. Every layout keeps the
[floors](../system/layout/README.md#floors-what-holds-on-every-site).

### Landing

TODO: `product-landing` as is, or what this site changes: the column's max width, the hero
pattern, the section order.

### Documentation

TODO: `docs-shell` as is, or what this site changes: the measure, the regions it shows.

A custom layout (`layouts: { <page type>: custom }`) instead gives:

| Setting | This site |
| --- | --- |
| Grid | TODO: columns, gutters (multiples of 8px), max width, the narrow form |
| Regions | TODO: the named regions, in reading order |
| Section order | TODO: the sections, in order |
| Hero | TODO: what fills the first screen |

## Writing style

What this site's words sound like. The [core writing rules](../system/writing/README.md#core-and-site)
hold under every choice; budgets may tighten the [slot ceilings](../system/writing/general.md#slot-budgets),
never loosen them.

| Setting | This site |
| --- | --- |
| Tone and register | TODO: how formal, how warm, first person or not |
| Title form | TODO: per page type, one of [short spoken verdict, full-sentence claim, plain name](../system/writing/README.md#title-forms) |
| Copy density | TODO: paragraph length, how much a section says, bullets or prose |
| House words | TODO: words to prefer and avoid, how the product is named |
| Budgets | TODO: any aim or limit tighter than the ceilings, or "the ceilings" |

## Component looks

TODO: for each component in `components:`, why that look fits the site; for 3D, the subjects the
site shows and the look each one is pinned to ([which subjects offer each look](../components/3d.md#which-subjects-offer-each-look)).
A `fixed` look's values are not this spec's to set.

For diagrams, one row per theme in `diagram-themes` that UiPack doesn't ship: its name in backticks,
where it applies, and its ink, surface, accent and four flow colours in light and dark (or the file
that defines it with `defineDiagramTheme`). The grammar (geometry, type sizes, strokes, what each
flow means) is not the spec's to change.

| Diagram theme | Applies to | Light: ink / surface / accent | Dark: ink / surface / accent | Flows, faces, canvas |
| --- | --- | --- | --- | --- |
| TODO: `site-paper` | TODO: default | TODO: | TODO: | TODO: |

## Reuse

TODO: what this spec extends, and any site that reuses this one. A site that should look like this
one says `extends: <this spec's id>` instead of copying values.

## Open TODOs

TODO: every value still open, with the fact that would decide it.
