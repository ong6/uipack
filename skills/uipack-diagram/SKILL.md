---
name: uipack-diagram
description: >-
  Draw a diagram in UiPack's Blueprint look: a system or architecture figure, a request flow, a
  before/after, a drill-down figure or a layered chart for a site, article, doc or slide. Use for
  "draw the flow", "diagram for this article", "architecture figure", "add a figure", "drill-down".
  Not for data charts of numbers alone, a whole page or deck (uipack-page), or a site's brand
  (uipack-spec).
---

# Draw a diagram

Paths are relative to the uipack root: `node_modules/uipack/` in a site, or a uipack clone.

## The rule that differs from pages

Diagrams have one look, **Blueprint**, and it is `flex`: the grammar (geometry, 8px grid, type
sizes and the 11px floor, strokes, what each flow kind means, one accent path) is the same on every
site, and a **diagram theme** supplies colours, faces and canvas ground: the site's default, and
optionally one per large page. Read [docs/components/diagrams.md](../../docs/components/diagrams.md)
first. The site's spec picks the look (`components: { diagrams: blueprint }`) and names its themes
(`diagram-themes: { default: …, <page>: … }`); its layout and writing style stop at the figure's
frame, so the labels and lengths below hold on every site.
You never recolour a figure locally: no brand accent on one connector, no `--uipack-*` override, no
hex in a figure. A new colour scheme is a theme object (`defineDiagramTheme`) applied to the whole
site or page; a figure on a page inside a theme scope picks it up by itself. A slide or page gives
the figure a region; it never restyles it.

## Steps

1. **Claim.** One sentence the figure makes the reader conclude
   ([writing, diagrams](../../docs/system/writing/figures.md)). Two claims are two figures.
2. **Pick the pattern.** The simplest that carries the claim: a preset from `uipack/presets`
   (agent loop, pipeline, RAG, service map, before/after, sync loop, skill lifecycle) before a
   hand-built `Figure`; `DrillFigure` (from `uipack`) when a node must open into its own figure
   ([drill-down](../../docs/drill.md)); `SpanChart` or `LayerStack` for layers
   ([charts](../../docs/charts.md)); the user-flow parts (`Actor`, `Screen`, `Action`,
   `Decision`, `Outcome`, `LaneRule`) when people and screens are the point, the sequence parts
   (`Lifeline`, `Message`, `Lost`, `SelfLoop`, `Note`) when message order is. Never redraw these
   locally: import them from `uipack`, so a change lands on every figure at once. The playground's
   diagrams page lists every pattern.
3. **Words.** At most six nodes of 2–3 words that draw the system; a label on every connector
   that carries something, saying what moves, taken from the brief's words (the step's given
   output restates a fact; a state the brief never names is invented); results in a sub-label or
   the caption; every path ends at an outcome. A statistic appears once, in the sub-label of the
   node it measures ([arrows](../../docs/system/writing/figures.md#arrows-and-statistics)).
4. **Layout.** 8px grid, lanes and groups, flow left to right or layers top to bottom
   ([layout, diagrams](../../docs/system/layout/README.md#figures)). Author the narrow (390px) drawing or
   keep a readable width that scrolls inside the frame; never shrink labels below the 11px floor.
5. **Build with real exports.** `Figure`, `Node` (a `strip` only where the box's type adds
   meaning, one per type across the figure), `Connector`, `Packet`, `route`, `Defs` from
   `uipack` (props in [docs/figure-api.md](../../docs/figure-api.md)); check `dist/*.d.ts` before a prop. Give
   `alt`, a caption, and a legend only when there is more than one flow kind.
6. **Check.** Render at 1440 and 390 in both modes, inside the site's (or page's) theme, and look at both drawings: labels inside
   their boxes, no page overflow, packets that arrive and leave. Then:
   - **Geometry.** `npx uipack-figure-check <url>` (in a uipack
     clone, `node bin/uipack-figure-check.mjs <url>`) must report no `fail` at either width: no
     line drawn through a label, no label over a node. Read its `check` list of unlabelled
     connectors and give each one that carries something a label (step 3).
   - **Caption against the drawing.** Count the nodes in each group on the render and reread the
     caption: every count, group and step it names matches what is drawn
     ([the caption](../../docs/system/writing/figures.md#the-caption)). Fix the drawing or the words.
   - Then `uipack-review`.
