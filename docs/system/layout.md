# Layout: where things sit and in what order

Layout is the structure layer: the canvas, the grid, named regions, which content slot fills each
region, the reading order, and the beat order with its transitions. It is **sizes in grid units and
slot names, with no colours, faces or sentences in it**. A layout reads content fields (`eyebrow`,
`headline`, `body`…, see [Writing](writing.md#the-content-schema)) and style roles (see
[Style roles](style.md#the-role-contract)), so any content can fill it and any style can paint it.

## Rules for every medium

1. **Pick the archetype from the claim's shape.** A flow through time goes left to right. Layers
   go top to bottom. Two actors get swimlanes. Two options go side by side. One number gets a hero
   number.
2. **Everything on a grid.** Positions are computed in code or a table, never nudged by eye.
3. **Reading order is the build order.** Blocks enter in the order they're read. The keyboard
   order is the same.
4. **Whitespace is part of the layout.** Crowded reads as careless. Keep the margins below as
   minimums.
5. **Every layout has a narrow form.** Author it (a stacked drawing, a single column, a still
   image), or keep a readable internal width that scrolls inside its frame. Never shrink labels
   below the type floor, and never let the page overflow.

## Diagrams

**Grid.** 8px base. Node positions, widths and gaps are multiples of 8, columns share x and rows
share y. Margins are 40 inside the `viewBox`. Gaps are 40 between nodes in a flow (32 at least, to
leave room for arrow labels) and 64 between groups. Group padding is 24. Nodes are 56 tall with a
label, 72 with a sub-label. Lanes are on the 8px grid with headers at y 40.

**Size first.** Decide the render width (column width or a breakout), then size the `viewBox` to
it. A 1120 `viewBox` in a 680 column puts 13px labels at 8px.

**Patterns.** The diagram page (`/`) is the catalogue of figure layouts, simplest first. Pick one
before drawing:

| Claim shape | Pattern |
| --- | --- |
| Stages in a line | Pipeline |
| Repeat until done | Loops, Agent loop |
| One question per level | Decision tree |
| Same flow, changed | Before and after |
| Parallel work, one merge | Fan-out and fan-in |
| One source, many copies | Two-way sync |
| Where errors go | Failure rail |
| Where work piles up | Queue and callouts |
| Messages in order between actors | Sequence |
| What runs inside what | Nested groups |
| One path across environments | Numbered steps (column lanes) |
| Clients, a platform, its stores | Service map |
| Each layer stops some | Layered checks |
| What is stored where | File tree |
| Where every item ends up | Flow volumes |
| One trend and its points | Annotated curve |
| More inside one part | Drill-down |
| Companies across a stack / bottom-up layers | Span chart / Layer stack |

**Narrow.** Below 720px, use the authored stacked drawing. Presets and Habitat have one. Dense
drawings without one keep their readable width and scroll inside the frame.

## Slides

**Canvas.** 1920×1080, scaled to fit. Safe area padding is 112 top, 144 sides and 88 bottom.

**Regions** (the slot map every archetype shares):

```text
┌──────────────────────────────────────────────────────────── 1920 ┐
│  112                                                             │
│  EYEBROW  ............................................ (eyebrow) │
│  44                                                              │
│  Headline: the claim, at most two lines ............. (headline) │
│  Lede: one sentence of why ............................... (lede) │
│                                                                  │
│  ┌ BODY ──────────────────────────────────────────────────────┐  │
│  │  the evidence: figure / chart / points / tiles / table     │  │
│  └────────────────────────────────────────────────────────────┘  │
│ ──────────────────────────────────────────────────────────────── │
│  FOOTER · deck name                      source        page  88  │
└─ 144 ──────────────────────────────────────────────────── 144 ───┘
```

The eyebrow and headline keep the same position on every slide, so `advance` reads as the argument
moving, not the page jumping. The footer stays put across transitions.

**Archetypes.** Each one is a layout over the regions above, with the role it usually serves:

| Archetype | Body | Typical role | Built as |
| --- | --- | --- | --- |
| Cover | None. Big title, eyebrow, footer | `cover` | `Slide layout="center"`, `.uipack-deck-title` |
| Statement | The headline alone, centred | `answer`, `recommendation` | `Slide layout="center"` |
| Hero number | One number (360) with its label and baseline | `evidence` | `.uipack-deck-number` |
| Figure + narration | A diagram across the body, one-line lede | `mechanism` | `Slide` + `Figure`; zoom target for a drill |
| Split | Text left, visual right (or the reverse) | `evidence`, `mechanism` | `Slide layout="split"` |
| Before / after | Two columns with matching rows, the change highlighted | `evidence`, `option` | Morph the changed element |
| Points | Three supporting points, at most | `context`, `problem` | `Slide` blocks |
| KPI row | 3–4 tiles, one highlighted | `evidence` | `KpiTiles` |
| Options | Options against criteria | `option` | `HarveyTable`, `Matrix2x2` |
| Consulting frame | Tracker, action title, a 12-column grid of panels, "So what", notes, source | Any data slide | `ConsultingSlide` + `Panel` |
| Bento | A grid of cells the camera tours | `evidence` (dense) | `Bento` + `BentoCell` |
| Plan | Milestones on a line with owners and dates | `plan` | `Slide` blocks |
| Ask | The decision, the owner, the date | `ask` | `Slide layout="center"` |
| Section | A chapter divider: a big number, the chapter's claim, one line | `context` | `sectionSlide`, `SectionSlide` |
| Quote | One quote in the reader's words, with who said it | `evidence` | `quoteSlide`, `QuoteSlide` |
| Fact | One number with its unit, baseline and source | `evidence` | `factSlide`, `FactSlide` |
| End | The ask as a slide: action, owner, date | `ask` | `endSlide`, `EndSlide` |

**Invert.** Any slide can set `invert` (sugar for `tone="ink"`): the same layout on the style's
invert roles, a dark ground in a light deck. It is a variant inside the style, not another style,
and it never changes a region.

Keep a slide to a handful of top-level blocks. That's what `advance` staggers. Embedded figures
keep their own diagram layout. The slide gives them the body region and nothing else.

**Sequence.** The storyline template orders the roles, and roles pick archetypes. A deck is a
sequence of archetypes, so swapping one archetype for another (Points → Bento) changes neither the
words nor the style.

## Web

- **Grid.** 12 columns at 1024px and up, 8 at 640px, 4 below. Spacing is 8pt. `Grid` and
  `GridItem span={[w, m, n]}` respond to their container.
- **Section archetypes**: nav, hero (headline, subhead, CTA, the star or `DemoPlayer`), mechanism
  (a working figure), steps (feature cards with actions pinned to the bottom), proof (a quote and
  numbers), FAQ, pricing with the final CTA.
- **Each style recommends a sequence** for the same sections (`uiStyles[].prefers` in `uipack`).
  The order is part of a look: the demo hero, three cards, pricing and FAQ is the generic landing
  template, so the other styles reorder it.

  | Style | Recommended order | Hero |
  | --- | --- | --- |
  | Technical | hero → mechanism → proof → steps → FAQ → pricing | Copy on the start edge; the diagram follows at once |
  | Landing | hero → steps → mechanism → proof → FAQ → pricing | Centred |
  | Graphical | hero → proof → steps → mechanism → pricing → FAQ | Centred; the numbers come second, as a poster's |

  A recommendation only: `/web?layout=shared` shows all three in one order, which is what the swap
  test compares.
- One goal, so the primary CTA appears three times (hero, nav, end) and nothing else competes.
- One ambient background per viewport, behind the star, never behind body copy.
- Cards that share a row share a height, with the action row at `margin-top: auto`.

## Motion

Motion layout is choreography: what moves, in what order, on which clock.

- **Reading order.** Blocks enter top to bottom, left to right. A figure washes in from the top
  down (0–240ms stagger by position), so nothing arrives one part at a time.
- **The transition grammar** (deck):

  | Move | When | How often |
  | --- | --- | --- |
  | Advance (default) | The argument moves to the next claim | Nearly every slide |
  | Morph | The *same thing* changes; you can say "watch X change" | About 1 slide in 10, with zoom |
  | Zoom | Overview into one part, then back out | Once or twice per talk |
  | Fade / cut | Jumps (overview, Home/End) | Rarely |

- **Builds** reveal in reading order. Going back into a slide lands fully built.
- **Packets** ride only the claim's flows, one kind per direction, offset by delay so they never
  stack.
- **Stepped figures** have one beat per step, from the beat script, with tabs `01 / 02 / 03`.
- **Loops** longer than 5 seconds get Pause. Everything ambient pauses off-screen.

## 3D

- **Camera stops are the layout.** Each stop frames one subject, and its beat sentence says why
  (see [writing.md → 3D](writing.md#3d)). Prefer one camera movement per beat.
- **Framing.** An orthographic camera fits the authored animation envelope to both axes. Stages
  under 480px may frame tighter (`userData.narrowFrame`).
- **Labels** are HTML at projected positions with collision avoidance. Choose a small set per stop.
  Inspect component reaches any hidden one.
- **In a slide**, a 3D scene is the body of a Figure + narration archetype. The deck drives its
  stop. A scene never fills a slide with no headline.
- **Fallback.** Without WebGL, the readable diagram view (components and active connections) takes
  the same region.
