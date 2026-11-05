# The UI Pack design system

This is the canonical spec for anything UI Pack draws: diagrams, slides, web pages, motion and 3D.
Read this page first. The three layer guides hold the detail:

| Layer | Answers | Guide |
| --- | --- | --- |
| **Style** | How does it look? Colour, type, line, radius, texture, motion feel, 3D material. | [Style roles](style.md) |
| **Writing** | What does it say? Claims, titles, labels, captions, narration, numbers and sources. | [Writing](writing.md) |
| **Layout** | Where does each thing sit, and in what order does it appear? Canvases, grids, regions, archetypes, beats, camera stops. | [Layout](layout.md) |

Each guide has one section per medium (Diagrams, Slides, Web, Motion, 3D), so "the slide rules"
are three short sections: slide style, slide writing and slide layout.

## Philosophy

UI Pack draws explanations. A visual exists to make one thing understood faster than prose could.

1. **One claim per unit.** A figure, a slide, a page section and a 3D stop each make one point. If
   you can't write it in one sentence, you don't know what to draw yet. Two claims means two units.
2. **Show the mechanism, not the inventory.** Draw only the parts the claim depends on. An
   unlabelled box, a decorative icon or a part nobody mentions gets cut.
3. **Shape first, then colour.** Meaning is carried by shape, position and words, and colour
   repeats it. One accent marks the single thing the claim is about. Everything else is ink.
4. **Words go in the right place.** The drawing gets two or three words per label. Sentences go
   in the caption, the headline or the speaker notes. A label that wraps is doing two jobs.
5. **Motion explains a change.** Each movement shows something happening (a request travelling, a
   number falling, a camera going into a part). One movement per beat. The finished state is the
   default, and reduced motion, print and static export show it.
6. **Quiet by default, flourish when it's earned.** Thin lines, small radii, no ambient glow,
   restrained texture. A flashy piece has to justify its motion.
7. **Readable everywhere it travels.** At 390px wide, in dark mode, with reduced motion, forwarded
   without the speaker and exported as a still. A layout that only works at 1440 isn't finished.
8. **Layers are independent.** Style, writing and layout change separately (next section).

## Three layers, swapped independently

You can change any layer without touching the other two:

- **Same words and layout, new style.** Restyle a Technical deck as Graphical: the headlines,
  notes, slide order and regions stay put, and only the colours, faces and ornaments change.
- **Same style and words, new layout.** Turn a deck's comparison slide into a bento slide, or a
  wide figure into its stacked narrow drawing.
- **Same style and layout, new words.** A slide archetype or figure preset fed different content.

What makes that work is a contract between the layers:

| Layer | Owns | Must never contain |
| --- | --- | --- |
| Style | The value of every role (paper, ink, accent, the flow colours, the display face, radius, easing), each with a light and a dark value; a few scalars (density, type ratio, line length, display scale); what it paints in the ornament slots (backdrop, marker, rule, frame); 3D material palettes | Positions, region sizes, words |
| Writing | The words, as typed fields: headline, points, an optional eyebrow and lede, body, figure, caption, speaker notes, source and the slide's role | Colours, font names, coordinates |
| Layout | Named regions and the slots in them, each slot's text budget, the ornament slots left for the style, a grid, a reading order, a beat order and transitions | Colour values, face names, sentences |

Two rules follow from the contract:

- **Layout and writing ask for a role, never a value.** A layout says "the second ink", never a
  hex code or a font name, so a new style changes the answer without touching the layout.
- **Content is data.** Words live in a typed object that any layout with matching slots can
  render. A slide's words are never baked into its layout component.

Four more rules keep the split honest where it would otherwise leak:

- **A style may own scalars and ornaments, never positions or words.** Density, type ratio,
  line length and display scale are style roles. Shapes a style adds (Graphical's disc, Technical's
  dotted grid) go in named ornament slots that never take space, so every region stays put.
- **Every slot has a text budget.** A presented slide's headline is 2–5 words (at most 14 when the
  deck is read without its speaker), a body point a fragment of at most 8 words, an optional
  eyebrow 1–4 words, a label 2–3. The linter flags any slot over budget
  ([Writing, slot budgets](writing.md#slot-budgets)).
- **A style may recommend layouts, never require them.** On the web the section order is part of a
  look, so each style names an order for the same content ([Layout, web](layout.md#web)); every
  style still renders every layout.
- **The web loads one style at a time.** The library's CSS sits in cascade layers, so a page's own
  rules win without `!important`. A small script in the page head sets the style and theme before
  the first paint, and each style fetches only its own fonts.

What exists in code and what is still missing is in
[Style roles, "Where the code stands"](style.md#where-the-code-stands). The Foundations pages show
each layer live.

**For implementers.** Roles are CSS custom properties (`--ui-paper`, `--ui-ink`, `--ui-accent`,
`--ui-flow-request`, `--ui-font-display`, `--ui-radius`, `--ui-ease-settle`…), so a layout writes
`color: var(--ui-ink-2)`, never `#5c625e` or `font-family: "IBM Plex Sans"`. A component takes the
style as a prop (`<DeckPlayer uiStyle="graphical">`). Content types are `DeckSlide`,
`SlideStarterData` and the preset specs; notes are `notes { say, delivery, next }`. Budgets are
`SLOT_BUDGETS`, checked by `lintDeck` as `slot-budget`. Each style's recommended order is
`uiStyles[].prefers`. The cascade layers are `uipack.tokens`, `uipack.base`, `uipack.layout` and
`uipack.ornaments`; the head script is `styleBootScript`, which sets `data-ui-style` and
`data-ui-theme`.


## Media at a glance

| Medium | Entry | Default style | Writing core | Layout core |
| --- | --- | --- | --- | --- |
| Diagrams | `uipack` (`Figure`), `uipack/presets`, `uipack/drill`, `uipack/charts`, `uipack/article` | Technical | Claim sentence, 2–3 word labels, labelled arrows, one-line caption | 8px grid, lanes, groups, authored narrow drawing |
| Slides | `uipack/deck` (new work), `uipack/presentations` (three starters) | Technical (deck tokens) | Short titles and fragment points with cue notes (presented) or full-sentence titles (read-alone), ghost deck, slide roles, storylines, a concrete ask | 1920×1080 canvas, headline/body/footer regions, slide archetypes |
| Web | `uipack/web`, `uipack/docs` | Technical (Landing and Graphical swap in) | One goal per page, outcome headline, one CTA in three places | 12/8/4 grid, 8pt spacing, section archetypes, a sequence per style |
| Motion | Packets, entrance, deck transitions, `uipack/web` motion | Inherits the host style's motion tokens | One sentence per beat | Beats, the timing scale, transition grammar |
| 3D | `uipack/slides` (camera stories), `uipack/objects`, `uipack/mechanism` | Studio / Mechanism | A label set and one line of narration per stop | Camera stops, framing, the 2D fallback |

## Skills that use this spec

The spec lives here, in the public repo. Skills point at it and add workflow; they don't restate
values:

| Skill | Role | Reads |
| --- | --- | --- |
| `uipack-design` | The entry point for any UI Pack visual: pick the medium, write the content, choose the layout, apply a style, review against the three layers. Routes execution to the skills below. | This folder |
| `system-diagram` (existing) | Executes diagrams. Its taste table defers to [Style roles, diagrams](style.md#diagrams) and [Layout, diagrams](layout.md#diagrams). | Diagram sections |
| `3d-design`, `blender-authoring` (existing) | Execute 3D. Art direction comes from [Style roles, 3D](style.md#3d). | 3D sections |
| `frontend-design`, `ux-design` | Execute web pages: Technical by default, Landing for a generic landing page, Graphical for a poster. | Web sections, [Web principles](../web-principles.md) |
| `create-fde-deck` (existing) | Customer field-engineering decks; its evidence ledger is a writing layer of its own and renders through `uipack/deck` layouts. | Slide sections |

## Related docs

- [Design direction](../design-direction.md): the playground shell, catalog taxonomy, interaction
  polish and acceptance checks.
- Per-style guides: [web principles (Technical web, Landing, Graphical)](../web-principles.md), [Mechanism](../mechanism.md),
  [Object scenes and 3D art directions](../objects.md).
- Medium references: [Deck player](../deck.md), [Deck storytelling](../deck-storytelling.md),
  [Consulting slides](../deck-consulting.md), [Charts](../charts.md), [Article parts](../article.md),
  [Drill-down figures](../drill.md), [3D animations](../slides.md).
