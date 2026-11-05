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

**Patterns.** The diagram gallery, the playground's home page, is the catalogue of figure layouts,
simplest first. Pick one by the shape of the claim before drawing:

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
│  (eyebrow: optional, off by default) ................. (eyebrow) │
│  44                                                              │
│  Headline: 2–5 words, or the claim when read alone .. (headline) │
│  (lede: optional, one sentence of caveat) ................ (lede) │
│                                                                  │
│  ┌ BODY ──────────────────────────────────────────────────────┐  │
│  │  the evidence: figure / chart / points / tiles / table     │  │
│  └────────────────────────────────────────────────────────────┘  │
│ ──────────────────────────────────────────────────────────────── │
│  FOOTER · deck name                      source        page  88  │
└─ 144 ──────────────────────────────────────────────────── 144 ───┘
```

The headline keeps the same position on every slide (and so does an eyebrow, on the rare slide
that has one), so `advance` reads as the argument moving, not the page jumping. The footer stays put
across transitions.

**Archetypes.** Each one is a layout over the regions above, with the role it usually serves:

| Archetype | Body | Typical role | Built as |
| --- | --- | --- | --- |
| Points | A short title and 2–4 fragments that carry the numbers; the default for a presented deck | any, most often `answer`, `problem`, `plan` | `pointsSlide`, `PointsSlide` |
| Cover | None. Big title, footer | `cover` | `Slide layout="center"`, `.uipack-deck-title` |
| Statement | The title alone, centred, or with its points | `answer`, `recommendation` | `Slide layout="center"` |
| Hero number | One number (360) with its label and baseline | `evidence` | `.uipack-deck-number` |
| Figure + narration | A diagram across the body, the narration in the notes | `mechanism` | `Slide` + `Figure`; zoom target for a drill |
| Split | Text left, visual right (or the reverse) | `evidence`, `mechanism` | `Slide layout="split"` |
| Before / after | Two columns with matching rows, the change highlighted | `evidence`, `option` | Morph the changed element |
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
  `GridItem span={[w, m, n]}` respond to their container. The hero, every section and the closing
  band share one 1120px column, so every left edge on the page lines up.
- **Section archetypes**, each a component:

  | Archetype | Component | Holds |
  | --- | --- | --- |
  | Nav | `GlassNav` | Brand (on the sections' start edge), links, the CTA. Below 720px: brand on the start edge, Menu on the end edge. The CTA stays in the bar beside Menu, with its `short` label (`cta={{ label, short, href }}`); below 340px it moves into the menu |
  | Hero | `StarHero` | Eyebrow, headline, subhead, actions, then the proof: a `DemoPlayer` or a `Figure`, with `media` (a `ProductShot`) above it when the product is physical or visual. `layout="split"` (use it with a product proof) sets copy on 5 columns and the proof on 7 from 1024px, top-aligned, so a wide screen has no empty half; stacked below. `stamp={{ value, label }}` carries the page's one measured number in the style's device (Technical revision tag, Landing riso sticker, Graphical postmark): in a split hero it is stuck on the proof's top-end corner (the media's), in a stacked hero beside the headline, below 1024px a strip above the proof. Value up to 4 characters, label up to about 30 (it is clamped at three lines) |
  | Demo | `DemoPlayer` steps mode | The product's screens. `rail="compact"` (default): one row of step labels over the screen, the step tabs while it plays, under the screen below 720px; `"side"` the full checklist in a start column (under the screen below 720px); `"none"`. At rest (and under reduced motion) no step caption shows |
  | Steps | `Section` + `FeatureGrid numbered` | Three numbered cards |
  | Mechanism | `Section` + `Figure` | A working figure, with quiet chrome on a web page |
  | Proof | `Section` + `Proof` | The headline number (or a before/after `compare`), ruled stats (one stat sets as a single compact line), a `caveat` line under the numbers, a named quote. Three or four `stats` without a `lead` are the headline row (two by two below 720px): use that when the brief gives several measured facts of equal weight, rather than one big number and a thin line |
  | FAQ | `FAQ` | Head beside the questions at 1024px and up, sticky as they scroll: give it an `intro` and an `aside` (the CTA or a contact line) so that column is not a lone title |
  | Pricing | `Section` + `PricingPlans` | One to three plan cards, each with features and its own button label (what that plan's click does); one plan `featured` carries the page's goal |
  | Closing | `ClosingCta` | A full-bleed band: the claim, the CTA a third time, a reassurance line |
  | Footer | `SiteFooter` | Brand, links, fine print |

- **One order in every style.** `WebPage` renders `sections` in the order the page lists them, in
  every style, and the hero keeps whatever proof the page put there. Swapping the style changes
  tokens and ornaments only. Alignment is the start edge everywhere by default.
- **A style's own sequence is opt-in.** `WebPage layout="style"` uses `uiStyles[].prefers` and
  `.layout` (what fills the hero, alignment, cards or rows). Ids a style doesn't name are kept, after
  the ones it does. Section ids it knows: `hero`, `how`, `demo`, `mechanism`, `proof`, `faq`,
  `pricing`.

  | Style | Its own order (opt-in) | Its own hero |
  | --- | --- | --- |
  | Technical | hero → how → demo → proof → FAQ → pricing | The figure, start edge; steps as numbered rows |
  | Landing | hero → how → mechanism → proof → FAQ → pricing | The demo, centred |
  | Graphical | hero → proof → how → mechanism → pricing → FAQ | The demo, centred |

  Section render functions receive `{ uiStyle, layout, defaults }`; under the default layout,
  `defaults` is `{ hero: "demo", align: "start", steps: "cards" }` in every style.
- One goal, so the primary CTA appears three times (hero, nav, closing band) and nothing else competes.
- One ambient background per viewport, behind the star, never behind body copy. A hero with a
  proof draws no extra chart: the proof is the star.
- Cards that share a row share a height, with the action row at `margin-top: auto`; a product
  window stretched by a taller neighbour gives the height to its body, and a lone `ItemList`
  inside spreads its rows over it (equal rows), so no window ends in an empty box. Balance the
  pair's content rather than leaving one card half full.
- **Product surfaces at 390.** A `DataTable` drops `priority: "low"` columns below 440px of its own
  width, and with more than four remaining columns (more than three with a `priority: "key"`
  column) stacks each row as a small record (`narrow` overrides: `fit`, `stack`, `scroll`). Mark
  the column the page is about (payback, price, the result) `priority: "key"`: stacked, it sits
  large on the row's name line; in `fit` or `scroll` it is pinned to the end edge, never scrolled
  off. `WorkedExample` results take a `unit` set small beside the
  value, and the result column fits the value. A `ProductWindow`'s data source goes in `source`
  (a tag on its title row), not a lone `footer`; a lone footer renders as a caption.
- **Product visuals.** When the product is a thing (a device, a kit, packaging) or makes a picture
  (a scan, a print, a map), the hero shows it beside its output: `StarHero media={<ProductShot>}`
  above the `DemoPlayer`. A table alone undersells a physical product. `ProductShot` frames a photo
  (`src`, which takes the style's media treatment) or a role-painted drawing (`children`), with a
  `tag`, up to three `readouts`, up to three `callouts` (`{ x, y }` in % of the plate, a label and
  a reading), a small `inset` detail view (the hardware; a row under the plate below 520px), a
  `caption` and a ramp `scale`. Keep the plate's top-end corner (the stamp) and end quarter (the
  inset) free of callouts. Recipe for a bespoke drawing with no photo:
  1. Draw the product's own picture as an inline SVG at the plate's aspect (default `5 / 2`,
     `viewBox="0 0 500 200"`, `preserveAspectRatio="xMidYMid slice"`).
  2. Paint it only from roles: false-colour or tonal fields from the media ramp
     (`stop-color: var(--ui-media-cold | -mid | -warm | -hot)` in gradients, soft shapes through an
     `feGaussianBlur`), marks and text in `var(--ui-media-ink)`; hardware line drawings in
     `var(--ui-ink)` on `var(--ui-surface)`, one detail (a lens, a button) in `var(--ui-spot)`.
     No hex: each style repaints it (Technical a cyanotype, Graphical a poster duotone, Landing a
     riso duotone).
  3. Match the page's numbers: the callout's reading is a row of the table beside it.
  4. Put the device in `inset`, with one dimension if size matters ("40 mm").

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
