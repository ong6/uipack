# Diagrams: the Blueprint look and diagram themes

Diagrams have one look, **Blueprint**, and it is `flex`: the grammar (geometry, type, strokes, what
each flow means) is the same on every site, and a **diagram theme** supplies its colours, faces and
canvas ground. This page says what a theme may change, how to define and apply one, the tokens, the
user-flow and sequence parts and the node strip.

A site has a default theme and may give a large page its own (junxiong.dev's Compoze and Trading
Engine); figures within one site, the blog included, share theirs. Members: figures and every part,
drill-down figures and the HTML charts. A spec picks the look with
`components: { diagrams: blueprint }` and declares its themes with `diagram-themes:`
([below](#declaring-themes-in-a-spec)).

<!-- generated:component-look-list -->
A spec picks one look: `components: { diagrams: blueprint }`.

| Look | Name | Mode | The same on every site | Takes from the site |
| --- | --- | --- | --- | --- |
| `blueprint` | Blueprint | `flex` | The grammar: geometry and the 8px grid, node shapes and 6px node radius, type sizes and the 11px floor, stroke widths, packet shapes, what each flow kind means, one accent path per figure | Colours, faces and canvas ground from a diagram theme: the site's default, optionally one per page (`diagram-themes:`); the built-in `blueprint` theme is Technical's |
<!-- /generated -->

Consulting deck charts (`BarChart`, `Waterfall` in `uipack/deck`) are slide parts, not members:
they take the site's data roles like the rest of the slide.

## What a theme may change

| A theme sets (varies per site or page) | The core keeps (the same everywhere) |
| --- | --- |
| Colours: ink, secondary ink, the canvas surface, node fill, raised fill, line weights, the accent (and its text ink), the four flow colours | Geometry: the 8px grid, node shapes, 6px node radius, the square frame |
| Faces: text, label and heading stacks | Type sizes and the 11px rendered floor |
| The canvas ground: drafting grid, dots or plain | Stroke widths (1.25 connector, 1 hairline), one arrowhead in the request direction, dash meanings |
| Light and dark halves of every colour | What each flow kind means (request main flow, response return, change async, error declined) and its packet shape |
|  | One accent path per figure; glow means selection |

A theme never adds a colour job or a second accent. The core rules are in
[style rules, Diagrams](../system/style.md#diagrams).

## Diagram themes

```uipack-demo diagram-themes wide
One figure in three diagram themes (blueprint, warm paper with cobalt, terracotta), light and dark.
```

A theme is one object, `defineDiagramTheme({ name, light, dark, fonts?, canvas? })` from `uipack`,
and the same object feeds every renderer:

| Renderer | How it takes the theme |
| --- | --- |
| Live React, site default | `diagramThemeCss(theme, { scope: ":root" })` in a `<style>` in the document head (SSR, no flash) |
| Live React, one page | `<DiagramThemeScope theme={compoze}>` around the page, or `<div data-diagram-theme="compoze">` with `diagramThemeCss(compoze)` injected once |
| Static SVG (`uipack/static`) | `renderStatic(fig, { theme, mode: "dark" })` |
| Open canvas | The dialog copies the theme from where the figure sits |

The colour keys are the `--ui-*` roles they stand in for: `ink`, `ink-2`, `surface` (the canvas),
`surface-raised` (node fill), `surface-2` (raised and hover fill), `line` and `line-soft` (default
ink at 26% and 13%), `accent`, `accent-ink` (default the accent), `flow-request`,
`flow-response`, `flow-change`, `flow-error`. `fonts` takes `text`, `label` and `heading` stacks;
a face left out follows the enclosing theme, then the page. `canvas` is `grid` (default), `dots` or
`plain`. Only `blueprint` ships: it is Technical's values with the drafting grid, and a figure
inside a `blueprint` scope draws exactly what it draws with no scope.

How it resolves: a scope sets private carriers (`--uipack-diagram-<role>`); each figure token reads
its carrier first and the page's role second, so the nearest scope wins, a page scope nested in the
site's overrides it, and a figure outside every scope is unchanged. Each colour is a
`light-dark()` pair resolved by the figure's own colour scheme, so the host's dark switch flips
every theme at once: UiPack follows `[data-theme="dark"]` on any ancestor and the OS setting; a host
with another switch passes `darkSelector` (and `lightSelector`) to `diagramThemeCss`.
`DiagramThemeScope mode="dark"` holds one mode for what it wraps. Remove any old `--uipack-*`
overrides on `.uipack` when adopting a theme: a host rule on the figure root still wins.

### Declaring themes in a spec

```yaml
components: { diagrams: blueprint }
diagram-themes: { default: site-paper, compoze: compoze, trading: trading }
```

`default` is the site's theme; every other key is a page or page group with its own. A theme UiPack
doesn't ship is described in the spec's `## Component looks` (its name in backticks with its
values, or the file that defines it). `scripts/check-spec.ts` fails a map without `default`, a name
that isn't kebab-case, and an undescribed theme. A spec without `diagram-themes` draws `blueprint`.

## Tokens

Each token a figure reads: its theme role, the role it reads outside every theme, and the
`blueprint` theme's value. Generated from `src/theme.css` and `src/styles/technical.css` by
`npm run docs:sync`. `blueprint` leaves faces to the page.

<!-- generated:diagram-family -->
| Token | Theme role | Outside a theme, reads | Blueprint light | Blueprint dark |
| --- | --- | --- | --- | --- |
| `--uipack-fg` | `ink` | `--ui-ink` | `#0b2748` | `#edf3fb` |
| `--uipack-muted` | `ink-2` | `--ui-ink-2` | `#3d5878` | `#acc2dc` |
| `--uipack-bg` | `surface` | `--ui-surface` | `#fcfdfe` | `#0d2a4f` |
| `--uipack-surface` | `surface-raised` | `--ui-surface-raised` | `#ffffff` | `#12345f` |
| `--uipack-surface-raised` | `surface-2` | `--ui-surface-2` | `#e2e9f1` | `#11315a` |
| `--uipack-grid` | `line-soft` | `--ui-line-soft` | `color-mix(in srgb, var(--ui-ink) 13%, transparent)` | `color-mix(in srgb, var(--ui-ink) 13%, transparent)` |
| `--uipack-border` | `line` | `--ui-line` | `color-mix(in srgb, var(--ui-ink) 26%, transparent)` | `color-mix(in srgb, var(--ui-ink) 26%, transparent)` |
| `--uipack-accent` | `accent` | `--ui-accent-stroke` | `var(--ui-accent)` | `var(--ui-accent)` |
| `--uipack-accent-ink` | `accent-ink` | `--uipack-accent` | `as the accent` | `as the accent` |
| `--uipack-token-request` | `flow-request` | `--ui-flow-request` | `#0b77a3` | `#8fd6ff` |
| `--uipack-token-response` | `flow-response` | `--ui-flow-response` | `#2b7a4b` | `#8be6ae` |
| `--uipack-token-change` | `flow-change` | `--ui-flow-change` | `#7048c0` | `#d2b4ff` |
| `--uipack-token-error` | `flow-error` | `--ui-flow-error` | `#c2392b` | `#ff8c7a` |
| `--uipack-mono` | `font-label` | `--ui-font-label` | `"IBM Plex Mono", "IBM Plex Mono Fallback", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` | `"IBM Plex Mono", "IBM Plex Mono Fallback", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` |
| `--uipack-sans` | `font-text` | `--ui-font-text` | `"IBM Plex Sans", "IBM Plex Sans Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | `"IBM Plex Sans", "IBM Plex Sans Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |
| `--uipack-radius` | not themed | `--ui-radius` | `0px` | `0px` |
| `--uipack-stroke` | not themed | `--ui-stroke` | `1` | `1` |
<!-- /generated -->

Figures also fix, in their component code: a 6px node radius inside the drawing, a 1.25 connector
stroke with one arrowhead in the request direction, the shape of each flow (square request, circle
response, diamond change), an 11px rendered type floor and the filled-chip wash (28% in dark,
`--uipack-chip-tint`). The full drawing rules are in the core
[style rules, Diagrams](../system/style.md#diagrams) and [layout rules](../system/layout/README.md#figures);
the words a figure carries are in [figure labels and captions](../system/writing/figures.md).

## User-flow and sequence parts

```uipack-demo flow-parts wide
The user-flow parts and the sequence parts, once each, in the page's theme.
```

| Part | Draws | Use for |
| --- | --- | --- |
| `Actor` | Circle with the person glyph (`icons.user`), mono role | Who acts; one per lane |
| `Screen` | Mini window: three-dot bar, title, mono lines | What they see |
| `Action` | Pill | What they do |
| `Decision` | Diamond, mono question | Where it branches; label branches with `Label` (`yes`, `no`) |
| `Outcome` | Accent stadium with a check | Where a lane lands; it is the accent's job |
| `LaneRule` | Faint `2 6` dotted rule | Between two actor lanes |
| `Lifeline` | Faint `3 5` dashed rule | Time under a participant (a `Node`) |
| `Activation` | 12-wide bar | While a participant does the work |
| `Message` | Numbered arrow, label above, optional `packet` | One message; the number sits on the sender's lifeline |
| `Lost` | Dashed line ending in a `Cross` | A message that never arrives |
| `SelfLoop` | Dashed loop off a lifeline | A retry or poll |
| `Note` | Dashed card, mono caps title | A budget or invariant beside a lifeline |

They draw from the theme tokens like every part, render in `uipack/static`, and take `flow` for
hover tracing. The catalogue's [user flow](../diagrams.md#user-flow) and
[sequence](../diagrams.md#sequence) are built from them.

## Node header strip

`Node strip="window" | "terminal" | "file" | "store"` adds a 16-unit header strip under a muted
hairline, saying what kind of thing the box is: three dots for a UI, app or page; `>_` for a CLI,
job or worker; a folded page for a document, config or spec; a bowed lip for a store.

- Optional, and off by default: use it only where the type adds meaning the label and icon don't.
- One strip per type, the same across the figure (every UI a `window`, not some).
- It never replaces the label or the icon; the icon and words centre in the body below it, so give
  a stripped node with a sub-label 56 or more units of height.
- Drawn from theme tokens only; text floors and the 8px grid are unchanged.

The [parts](../diagrams.md#parts) figure shows all four.

## Related

- [Component looks](README.md): every look and how a spec picks.
- [Figure API](../figure-api.md): the theme functions and the parts' props.
- [Architecture diagrams](../diagrams.md): the catalogue.
