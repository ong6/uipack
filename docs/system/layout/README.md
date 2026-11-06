# Layout: where things sit and in what order

This folder holds the layout rules, one file per page type, plus the rules every layout follows
and the layout of figures, motion and 3D, which sit inside any page. Layout is the structure
layer: canvas, grid, named regions, which content slot fills each region, the reading order and
the beat order. It holds sizes in grid units and slot names, with no colours, faces or sentences,
so any [content](../writing/general.md#the-content-schema) can fill it and any
[style](../style.md#the-role-contract) can paint it.

| Page type | Use it for | File |
| --- | --- | --- |
| Landing | A product, launch or announcement page with one goal | [landing.md](landing.md) |
| Documentation and article | Product docs, a reference page, a long read | [documentation.md](documentation.md) |
| Deck slide | One slide of a presented or read-alone deck | [deck-slide.md](deck-slide.md) |
| Dashboard | A screen of live numbers, tables and status someone checks | [dashboard.md](dashboard.md) |

Add a page type only when a real page needs one. Each page type has a [recipe](../../recipes/README.md)
with the section order and the parts to build it from.

## Rules for every layout

1. **Pick the archetype from the claim's shape.** A flow through time goes left to right, layers
   top to bottom, two actors get swimlanes, two options sit side by side, one number gets a hero
   number.
2. **Everything on a grid.** Positions are computed in code or a table, never nudged by eye.
3. **Reading order is the build order,** and the keyboard order is the same.
4. **Whitespace is part of the layout.** Crowded reads as careless; margins are minimums.
5. **Every layout has a narrow form.** Author it (a stacked drawing, a single column, a still), or
   keep a readable internal width that scrolls inside its frame. Never shrink labels below the type
   floor, and never let the page overflow.
6. **A style never moves a region.** Headings may change height between widths or faces; regions
   and their order do not. Long text is fixed in the words, never by shrinking the type.

The same title at three widths: the words and the order hold, and the line breaks follow the
measure, which is why a heading may change height and a region may not.

```uipack-demo title-widths wide
One title in one style at a wide, a medium and a narrow column: the line breaks move, the regions do not.
```

## Figures

The grid, from `FIGURE_GRID` in `uipack`:

<!-- generated:figure-grid -->
- **Grid:** 8px. Node positions, widths and gaps are multiples of 8; columns share x and rows share y (`grid()` rounds to it).
- **Margins:** 40 inside the `viewBox`.
- **Gaps:** 40 between nodes in a flow (32 at least, to leave room for arrow labels), 64 between groups; group padding 24.
- **Nodes:** 56 tall with a label, 72 with a sub-label.
- **Narrow:** below 720px a figure shows its authored narrow drawing.
<!-- /generated -->

**Size first.** Decide the render width (a column or a breakout), then size the `viewBox` to it:
a `viewBox` much wider than its column shrinks every label below the type floor.

**Patterns.** Pick the pattern from the shape of the claim before drawing. The
[diagram catalogue](../../diagrams.md) shows each one, simplest first:

<!-- generated:figure-patterns -->
| Claim shape | Pattern |
| --- | --- |
| Just the canvas | Bare figure |
| Every primitive once | Parts |
| Stages in a line | Pipeline |
| Repeat a step, return to the start | Loops |
| One question per level | Decision tree |
| The same flow, changed | Before and after |
| Parallel work, one merge | Fan-out and fan-in |
| One source, many copies | Two-way sync |
| Calls out, results back, a check before output | Agent loop |
| Every stage fails to one place | Failure rail |
| Where work piles up | Queue and callouts |
| Messages between actors, in order | Sequence |
| What runs inside what | Nested groups |
| One path across column lanes | Numbered steps |
| Clients, one platform, its stores | Service map |
| Each layer stops some, one slips through | Layered checks |
| What is stored where, and what a file holds | File tree |
| Where every item ends up | Flow volumes |
| One trend and the points that matter | Annotated curve |
| A figure inside a node | Drill-down |
<!-- /generated -->

Span charts and layer stacks are in [Charts](../../charts.md).

**Narrow.** Use the authored stacked drawing (presets and Habitat have one). Dense drawings
without one keep their readable width and scroll inside the frame. Narrow the window to
see this one switch:

```uipack-demo narrow-form
A pipeline preset that swaps to its authored stacked drawing below 720px instead of shrinking.
```

## Motion

Motion layout is choreography: what moves, in what order, on which clock.

- **Reading order.** Blocks enter top to bottom, start to end. A figure washes in from the top
  down, so nothing arrives one part at a time.
- **Builds** reveal in reading order; going back into a slide lands fully built.
- **Packets** ride only the claim's flows, one kind per direction, offset so they never stack.
- **Stepped figures** have one beat per step, from the beat script, with tabs `01 / 02 / 03`.
- **Loops** longer than 5 seconds get Pause; everything ambient pauses off-screen.

The deck's transition grammar (advance, morph, zoom) is in [Deck slide](deck-slide.md#transitions).

## 3D

- **Camera stops are the layout.** Each stop frames one subject, and its beat sentence says why
  ([figure writing, 3D stops](../writing/figures.md#3d-stops)). One camera movement per beat.
- **Framing.** An orthographic camera fits the authored animation envelope to both axes; stages
  under 480px may frame tighter (`userData.narrowFrame`).
- **Labels** are HTML at projected positions with collision avoidance, a small set per stop.
- **In a slide,** a 3D scene is the body of a figure-and-narration slide, and the deck drives its
  stop. A scene never fills a slide with no headline.
- **Fallback.** Without WebGL, the readable diagram view (parts and active connections) takes the
  same region.
