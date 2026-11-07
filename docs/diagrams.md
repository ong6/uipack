# Architecture diagrams

The diagram catalogue: every figure pattern UiPack draws, once each, simplest first, from the bare
canvas to a figure you drill into, with the parts it is built from. Pick a pattern by the shape of
your claim, then build it from the parts listed beside it.

## Patterns

Generated from the catalogue's own list (`playground/figure-rows.ts`), in page order:

<!-- generated:figure-index -->
| Pattern | Draws | Built from |
| --- | --- | --- |
| [Bare figure](#bare-figure) | just the canvas | Frame, Canvas |
| [Parts](#parts) | every primitive once | Node, Group, Chip, Connector, Packet, Bus, Wall, Cross, Icon, Mark |
| [Pipeline](#pipeline) | stages in a line | Preset, Pipeline, Queue |
| [Loops](#loops) | repeat a step, return to the start | Loop, Feedback, Return path |
| [Decision tree](#decision-tree) | one question per level | Decision, Branch, Tree |
| [Before and after](#before-after) | the same flow, changed | Preset, Comparison |
| [Fan-out and fan-in](#fan-out-fan-in) | parallel work, one merge | Bus, Parallel, Merge |
| [Two-way sync](#two-way-sync) | one source, many copies | Preset, Sync, Bidirectional |
| [Agent loop](#agent-loop) | calls out, results back, a check before output | Preset, Agents, Tools, Gate |
| [Failure rail](#failure-rail) | every stage fails to one place | Vertical, Errors, Dead letter |
| [Queue and callouts](#queue-callouts) | where work piles up | Queue, Callout, Bottleneck |
| [Sequence](#sequence) | messages between actors, in order | Sequence, Lifeline, Protocol |
| [User flow](#user-flow) | who acts, what they see, where it branches | Actor, Screen, Decision, Outcome |
| [Nested groups](#nested-groups) | what runs inside what | Group, Containment, Replicas |
| [Numbered steps](#numbered-steps) | one path across column lanes | Badge, Walkthrough, Lanes |
| [Service map](#service-map) | clients, one platform, its stores | Reference, Bus, Hub, Lanes |
| [Layered checks](#layered-checks) | each layer stops some, one slips through | Filter, Defence in depth |
| [File tree](#file-tree) | what is stored where, and what a file holds | Tree, Files, Storage |
| [Flow volumes](#flow-volumes) | where every item ends up | Sankey, Volumes |
| [Annotated curve](#annotated-curve) | one trend and the points that matter | Chart, Curve, Callout |
| [Drill-down](#drill-figure) | a figure inside a node | Drill-down, Zoom, Levels |
<!-- /generated -->

## How to use a pattern

1. Write the claim and the caption first ([figure labels and captions](system/writing/figures.md)).
2. Pick the pattern whose shape matches the claim ([layout, figures](system/layout/README.md#figures)).
3. Start from a preset (`uipack/presets`) when one fits; otherwise compose `Figure` from the parts.
4. Check the narrow drawing at 390 and both modes; the look is the
   [Blueprint look](components/diagrams.md): one grammar everywhere, coloured by the site's or the
   page's [diagram theme](components/diagrams.md#diagram-themes).

A published figure that needs a pattern not listed here adds it to `figureEntries` and
`playground/figures/` the first time it is used ([contributing](contributing.md)).

## The catalogue

Each section below names the pattern, says when to use it, and draws it live; select a part to
read its note, or open the figure in its canvas.

```uipack-demo diagram-catalogue wide
Every pattern as a live figure, one section each, in the order above: hover, select and open each in its canvas.
```
