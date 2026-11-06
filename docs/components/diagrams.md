# Diagrams: the Blueprint look

Diagrams have one look, **Blueprint**, and it is `fixed`: a figure looks the same on every site
that draws one, and only light and dark follow the host. The blog and the main site share their
figures, so a reader who met a uipack figure on one reads it on the other. Members: figures
(`uipack`, the presets), drill-down figures (`uipack/drill`) and the HTML charts (`uipack/charts`:
`SpanChart`, `LayerStack`, drawn in the same language). A spec picks it with
`components: { diagrams: blueprint }` and never sets its values: `scripts/check-spec.ts` fails a
spec that does. The model behind looks and modes is in [Component looks](README.md).

<!-- generated:component-look-list -->
A spec picks one look: `components: { diagrams: blueprint }`.

| Look | Name | Mode | The same on every site | Takes from the site |
| --- | --- | --- | --- | --- |
| `blueprint` | Blueprint | `fixed` | Card surface, node shapes and 6px node radius, the four flow colours and packet shapes, label face, strokes, the 11px type floor | Light or dark only |
<!-- /generated -->

Consulting deck charts (`BarChart`, `Waterfall` in `uipack/deck`) are slide parts, not members:
they take the site's data roles like the rest of the slide.

## Fixed values

Each token a figure reads, the role it takes today and its value in light and dark. Generated from
`src/theme.css` and the values those roles hold in `src/styles/technical.css` by `npm run docs:sync`.

<!-- generated:diagram-family -->
| Token | Reads today | Light | Dark |
| --- | --- | --- | --- |
| `--uipack-fg` | `--ui-ink` | `#0b2748` | `#edf3fb` |
| `--uipack-muted` | `--ui-ink-2` | `#3d5878` | `#acc2dc` |
| `--uipack-bg` | `--ui-surface` | `#fcfdfe` | `#0d2a4f` |
| `--uipack-surface` | `--ui-surface-raised` | `#ffffff` | `#12345f` |
| `--uipack-surface-raised` | `--ui-surface-2` | `#e2e9f1` | `#11315a` |
| `--uipack-grid` | `--ui-line-soft` | `color-mix(in srgb, var(--ui-ink) 13%, transparent)` | `color-mix(in srgb, var(--ui-ink) 13%, transparent)` |
| `--uipack-border` | `--ui-line` | `color-mix(in srgb, var(--ui-ink) 26%, transparent)` | `color-mix(in srgb, var(--ui-ink) 26%, transparent)` |
| `--uipack-accent` | `--ui-accent-stroke` | `var(--ui-accent)` | `var(--ui-accent)` |
| `--uipack-token-request` | `--ui-flow-request` | `#0b77a3` | `#8fd6ff` |
| `--uipack-token-response` | `--ui-flow-response` | `#2b7a4b` | `#8be6ae` |
| `--uipack-token-change` | `--ui-flow-change` | `#7048c0` | `#d2b4ff` |
| `--uipack-token-error` | `--ui-flow-error` | `#c2392b` | `#ff8c7a` |
| `--uipack-mono` | `--ui-font-label` | `"IBM Plex Mono", "IBM Plex Mono Fallback", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` | `"IBM Plex Mono", "IBM Plex Mono Fallback", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` |
| `--uipack-sans` | `--ui-font-text` | `"IBM Plex Sans", "IBM Plex Sans Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | `"IBM Plex Sans", "IBM Plex Sans Fallback", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` |
| `--uipack-radius` | `--ui-radius` | `0px` | `0px` |
| `--uipack-stroke` | `--ui-stroke` | `1` | `1` |
<!-- /generated -->

Figures also fix, in their component CSS: a 6px node radius inside the drawing, a 1.25 connector
stroke with one arrowhead in the request direction, the shape of each flow (square request, circle
response, diamond change), an 11px rendered type floor and the filled-chip wash (28% in dark,
`--uipack-chip-tint`). The full drawing rules are in the core
[style rules, Diagrams](../system/style.md#diagrams) and [layout rules](../system/layout/README.md#figures);
the words a figure carries are in [figure labels and captions](../system/writing/figures.md).

## Where the code stands

- TODO: figures still read the host's roles (`--uipack-fg: var(--ui-ink)`…), so on a site whose
  palette differs a figure takes that palette. Making the look own its values means the figure
  root sets these values itself and reads only the host's light or dark; until then the values above
  are the look's intent and Technical's actual values.
