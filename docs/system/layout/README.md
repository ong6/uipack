# Layout: the floors every site keeps, and the archetypes a spec picks

Layout is the structure layer: grid, named regions, which content slot fills each region, the
reading order and the beat order. Each website has its own layout, set in its
[spec](../../specs/README.md): for every page type it uses, the spec picks an archetype from the
library below, extends one, or defines its own. This page holds the floors no layout may break, the
library, and the layout of figures, motion and 3D, which sit inside any page. Layout holds sizes and
slot names, never colours, faces or sentences.

## Floors: what holds on every site

1. **Reading order is the DOM order, the keyboard order and the build order.** A region that is
   placed visually out of its source order (a sidebar on the start edge, a sticky FAQ head) keeps
   its place in the reading order.
2. **A real narrow layout.** Every page type has an authored layout at 390px: a single column, a
   stacked drawing, a still. Never a desktop page scaled down, and never labels shrunk below the
   type floor to fit.
3. **No page-wide horizontal overflow** at any width from 320px up. A wide table or drawing scrolls
   inside its own frame.
4. **Tap targets** of at least 44px on touch and 24px with a fine pointer (tier 1 grades both:
   `tapTargetPx` in `src/grade/spec.ts`).
5. **Visible focus** on everything that takes it, in reading order; modal focus is contained and
   returns where it came from.
6. **The 8px base unit.** Spacing, gutters and section padding are multiples of 8 (4 for hairline
   offsets inside a part). Kept core, not per site, because the parts are built on it: the
   [Blueprint diagram look](../../components/diagrams.md), which every site shares, sits on an 8px
   grid (below), and every part's internal padding comes from the same scale (`SPACE` in
   `uipack/web`). A page on another base would misalign with every figure and part in it. A site
   still chooses which steps it uses, its columns, gutters and max width, and its vertical rhythm
   through density.
7. **A style never moves a region.** The spec's palette, faces and ornaments paint the layout the
   spec chose; headings may change height between widths or faces, regions and their order do not.
   Long text is fixed in the words, never by shrinking the type.

## How a spec sets layout

In the frontmatter, the page types the site uses and a layout for each:

```yaml
pages: [landing, documentation, deck]
layouts: { landing: product-landing, documentation: docs-shell, deck: custom }
```

Then one `### <Page type>` under the spec's `## Layout`: for a picked archetype, what the site
changes when it extends it (a wider column, another hero pattern, a section order); for `custom`, a
table with a **Grid** row (columns, gutters, max width), **Regions**, **Section order** and **Hero**.
`scripts/check-spec.ts` fails a page type with no layout, an archetype that doesn't exist or belongs
to another page type, and a custom layout missing a row.

The page types:

<!-- generated:page-types -->
| Page type | Use it for | Archetypes |
| --- | --- | --- |
| `landing` | A product, launch or announcement page with one goal | `product-landing` |
| `documentation` | Product docs or a reference page in a navigable shell | `docs-shell` |
| `article` | A long read or a blog post | `layer-article` |
| `deck` | Slides, presented or read alone: an HTML deck is a page of the site | `slide-canvas` |
| `dashboard` | A screen of live numbers, tables and status someone checks | `one-question-dashboard` |
<!-- /generated -->

## Archetype library

Generated from `LAYOUT_ARCHETYPES` in `scripts/site-model.ts` by `npm run docs:sync`. Each archetype's
file opens with its card (grid, regions, section order, hero, what renders it), then its rules and
narrow form; extend one rather than copy it.

<!-- generated:layout-archetypes -->
| Archetype | Page type | Regions | Hero |
| --- | --- | --- | --- |
| [`product-landing`](landing.md) | landing | Nav, hero, sections, closing band, footer | Split: copy on 5 columns, the product's real output on 7, stacked below 1024px |
| [`docs-shell`](documentation.md) | documentation | Header, sidebar, context row, article, On this page, pager | None: the page's h1 and its first line |
| [`layer-article`](article.md) | article | Title, lede, a run of sections, each from the article parts | The title and a one-sentence lede; a figure only when it carries the claim |
| [`slide-canvas`](deck-slide.md) | deck | Eyebrow (optional), headline, lede (optional), body, footer | A cover slide: the outcome as the title |
| [`one-question-dashboard`](dashboard.md) | dashboard | Title row, headline numbers, the chart, records, time, source | Three or four headline numbers of equal weight |
<!-- /generated -->

Add an archetype when a real site needs a layout none of these give: its doc in this folder (an
archetype card at the top, then regions, order and narrow form), its entry in `LAYOUT_ARCHETYPES`,
and the parts that render it. Each page type also has a [recipe](../../recipes/README.md) with the
parts to build it from.

The same title at three widths: the words and the order hold, and the line breaks follow the
measure, which is why a heading may change height and a region may not.

```uipack-demo title-widths wide
One title in one style at a wide, a medium and a narrow column: the line breaks move, the regions do not.
```

## Where code still fixes a layout

The archetypes are rendered by parts that hard-code some of their numbers, so a spec that changes
them gets the change by overriding CSS, not by a prop, until these are lifted (no refactor now):

- TODO: the 1120px section column is literal in `src/web/web.css`, `src/web/web-styles.css` and
  `src/web/gutters.css` (`--gutters-content` is the only hook): a site with another max width
  overrides each.
- TODO: the 12 / 8 / 4 column counts (`GRID_COLUMNS`), their 1024 / 640 container breakpoints and
  the 32 / 24px gutters (`.uipack-web-grid`) are constants in `src/web/tokens.ts` and the
  `@container web` queries in `src/web/web.css`.
- TODO: the split hero's 5 / 7 columns and its 1024px switch are in `src/web/web.css` (`StarHero`).
- TODO: the 720 / 520 / 340px narrow switches of the nav, hero and product parts are literal
  container queries in `src/web/web.css`.
- TODO: the docs shell's 900px switch is `@media (max-width: 899px)` in `src/docs/docs.css`.
- TODO: the slide canvas (1920×1080) and safe area (`padding: 112px 144px 88px`) are in
  `src/deck/transitions.ts` and `src/deck/deck.css`.
- TODO: a site's own section order is keyed by style, not by spec: `uiStyles[].prefers` and
  `.layout` in `src/style.ts`, used by `sectionOrder` and `WebPage layout="style"`. Until a spec's
  layout is data the page reads, a site passes its order as the page's `sections`.
- TODO: the figure grid (`FIGURE_GRID` in `src/geometry.ts`) and its 720px narrow switch
  (`src/theme.css`) belong to the Blueprint look and stay fixed by design.

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
