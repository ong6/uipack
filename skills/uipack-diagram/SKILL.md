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

Diagrams have one look, **Blueprint**, and it is `fixed`: a figure looks the same on every site
(the blog and the main site share their figures). Read
[docs/components/diagrams.md](../../docs/components/diagrams.md) first: it fixes the card surface,
shapes, flow colours, label face, strokes and radii; only light and dark follow the host. The site's
spec picks it (`components: { diagrams: blueprint }`) but never changes it, and its layout and
writing style stop at the figure's frame: the labels and lengths below hold on every site. That is the intent; today figures still read the host's palette ([where the code stands](../../docs/components/diagrams.md#where-the-code-stands)), so check the render on the site before promising an identical look.
A site spec never recolours a figure, and neither do you: no brand accent on a connector, no
site face in a label, no hex anywhere. A slide or page gives the figure a region; it never
restyles it.

## Steps

1. **Claim.** One sentence the figure makes the reader conclude
   ([writing, diagrams](../../docs/system/writing/figures.md)). Two claims are two figures.
2. **Pick the pattern.** The simplest that carries the claim: a preset from `uipack/presets`
   (agent loop, pipeline, RAG, service map, before/after, sync loop, skill lifecycle) before a
   hand-built `Figure`; `DrillFigure` (from `uipack`) when a node must open into its own figure
   ([drill-down](../../docs/drill.md)); `SpanChart` or `LayerStack` for layers
   ([charts](../../docs/charts.md)). The playground's diagrams page lists every pattern.
3. **Words.** At most six nodes of 2–3 words that draw the system; a label on every connector
   that carries something, saying what moves, taken from the brief's words (the step's given
   output restates a fact; a state the brief never names is invented); results in a sub-label or
   the caption; every path ends at an outcome. A statistic appears once, in the sub-label of the
   node it measures ([arrows](../../docs/system/writing/figures.md#arrows-and-statistics)).
4. **Layout.** 8px grid, lanes and groups, flow left to right or layers top to bottom
   ([layout, diagrams](../../docs/system/layout/README.md#figures)). Author the narrow (390px) drawing or
   keep a readable width that scrolls inside the frame; never shrink labels below the 11px floor.
5. **Build with real exports.** `Figure`, `Node`, `Connector`, `Packet`, `route`, `Defs` from
   `uipack` (props in [docs/figure-api.md](../../docs/figure-api.md)); check `dist/*.d.ts` before a prop. Give
   `alt`, a caption, and a legend only when there is more than one flow kind.
6. **Check.** Render at 1440 and 390 in both themes and look at both drawings: labels inside
   their boxes, no page overflow, packets that arrive and leave. Then:
   - **Geometry.** `node node_modules/uipack/bin/uipack-figure-check.mjs <url>` (in a uipack
     clone, `node bin/uipack-figure-check.mjs <url>`) must report no `fail` at either width: no
     line drawn through a label, no label over a node. Read its `check` list of unlabelled
     connectors and give each one that carries something a label (step 3).
   - **Caption against the drawing.** Count the nodes in each group on the render and reread the
     caption: every count, group and step it names matches what is drawn
     ([the caption](../../docs/system/writing/figures.md#the-caption)). Fix the drawing or the words.
   - Then `uipack-review`.
