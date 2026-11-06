# Layout archetype: slide canvas

The `slide-canvas` archetype: one slide in a `uipack/deck` deck, with the canvas, the regions every
slide shares, the slide archetypes, and the transitions between slides. A deck is a page of a site
(an HTML deck), so the site's spec picks it for its `deck` page type
(`layouts: { deck: slide-canvas }`), extends it, or a talk series' own spec does
([presentations](../README.md#presentations-are-websites)). Every deck keeps the
[layout floors](README.md#floors-what-holds-on-every-site). The words follow the site's writing
style and [talks and slides](../writing/talks.md); the build steps are the
[deck recipe](../../recipes/deck-slide.md).

<!-- generated:layout-archetype -->
- **Archetype:** `slide-canvas` (Slide canvas), for the `deck` page type.
- **Grid:** A 1920×1080 canvas scaled to its frame, inside a fixed safe area.
- **Regions:** Eyebrow (optional), headline, lede (optional), body, footer.
- **Section order:** The storyline's roles, one archetype per slide.
- **Hero:** A cover slide: the outcome as the title.
- **Rendered by:** `DeckPlayer`, `Slide` and the archetype factories (`uipack/deck`).
<!-- /generated -->

**Extending it.** A spec may turn the eyebrow on, choose which slide archetypes its decks use and
how often each transition appears, and says so under its `### Deck`. The region map holds: the
headline and footer keep their places on every slide.

## Canvas

From `CANVAS_WIDTH`, `CANVAS_HEIGHT` and the slide frame in `deck.css`:

<!-- generated:slide-canvas -->
- **Canvas:** 1920×1080, scaled to fit its frame.
- **Safe area:** 112 top, 144 each side, 88 bottom (canvas pixels).
<!-- /generated -->

## Regions

The slot map every archetype shares:

```text
┌─ safe area ──────────────────────────────────────────────────────┐
│  (eyebrow: optional, off by default) ................. (eyebrow) │
│  Headline: a short verdict, or the claim read alone . (headline) │
│  (lede: optional, one sentence of caveat) ................ (lede) │
│                                                                  │
│  ┌ BODY ──────────────────────────────────────────────────────┐  │
│  │  the evidence: figure / chart / points / tiles / table     │  │
│  └────────────────────────────────────────────────────────────┘  │
│ ──────────────────────────────────────────────────────────────── │
│  FOOTER · deck name                      source        page      │
└──────────────────────────────────────────────────────────────────┘
```

The headline keeps the same position on every slide (and so does an eyebrow, on the rare slide
that has one), so `advance` reads as the argument moving, not the page jumping. The footer stays put
across transitions.

## Archetypes

Each one is a layout over the regions above, with the role it usually serves:

| Archetype | Body | Typical role | Built as |
| --- | --- | --- | --- |
| Points | A short title and a few fragments that carry the numbers ([slot budgets](../writing/general.md#slot-budgets)); the default for a presented deck | any, most often `answer`, `problem`, `plan` | `pointsSlide`, `PointsSlide` |
| Cover | None. Big title, footer | `cover` | `Slide layout="center"`, `.uipack-deck-title` |
| Statement | The title alone, centred, or with its points | `answer`, `recommendation` | `Slide layout="center"` |
| Hero number | One large number with its label and baseline | `evidence` | `.uipack-deck-number` |
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

Step through the archetypes and watch the map hold: only the body region changes.

```uipack-demo slide-archetypes wide
Points, section, quote, fact, inverted points and end on one region map: the headline and footer never move.
```

## Transitions

| Move | When | How often |
| --- | --- | --- |
| Advance (default) | The argument moves to the next claim | Nearly every slide |
| Morph | The *same thing* changes; you can say "watch X change" | About 1 slide in 10, with zoom |
| Zoom | Overview into one part, then back out | Once or twice per talk |
| Fade / cut | Jumps (overview, Home/End) | Rarely |

Builds reveal in reading order, and going back into a slide lands fully built. The player's
API is in [Deck player](../../deck.md).
