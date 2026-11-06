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
writing style stop at the figure's frame: the labels and lengths below hold on every site.
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
3. **Words.** At most six nodes of 2–3 words that draw the system, arrows along the flow saying
   what moves, results in a sub-label or the caption; every path ends at an outcome. A statistic
   appears once, in the sub-label of the node it measures.
4. **Layout.** 8px grid, lanes and groups, flow left to right or layers top to bottom
   ([layout, diagrams](../../docs/system/layout/README.md#figures)). Author the narrow (390px) drawing or
   keep a readable width that scrolls inside the frame; never shrink labels below the 11px floor.
5. **Build with real exports.** `Figure`, `Node`, `Connector`, `Packet`, `route`, `Defs` from
   `uipack` (see the root [README](../../README.md)); check `dist/*.d.ts` before a prop. Give
   `alt`, a caption, and a legend only when there is more than one flow kind.
6. **Check.** Render at 1440 and 390 in both themes; labels inside their boxes, no page overflow,
   packets that arrive and leave. Then `uipack-review`.
