# Writing: what it says

Writing is the content layer: the claim, the words on the canvas, the words beside it and the
spoken track. It is **typed data with no colour, font or position in it**, so the same words
render in any layout that has matching slots, in any style. See [the system overview](README.md).

## Rules for every medium

1. **Write the claim before drawing.** One sentence: what the reader should conclude. "A question
   fans out to five knowledge bases in parallel, and only chunks above 0.35 similarity reach the
   model." Everything on the canvas serves that sentence.
2. **Only the facts you were given.** Every number, scope, cause and reassurance traces to the
   input. Arithmetic on given numbers is fine ("40 to 6 minutes" is "34 minutes sooner"); a guess
   about what a metric includes, why it moved or what it rules out is not, however plausible ("the
   p95 already counts retried requests"). A fact the piece needs but the input lacks becomes a visible
   `TODO:` question in the slot it belongs to (`Source: TODO`), not a filler line. A recommendation
   is said as one ("we recommend"), never as a measured fact.
3. **Specific beats upbeat.** Use a number and what it measures, a multiple ("twice"), or two
   quantities compared ("one meeting, not three"). "In a good place" could describe any quarter.
4. **Every number has a baseline, a window and a source, and each binds only to the number it
   measures.** "The search latency dashboard, May vs June, all regions" given for p95 says nothing
   about the error rate in the next sentence: that one gets `Window and source: TODO`, never "same
   window and source". Keep the measure's own word too: a median stays a median (or
   its exact plain form, "half of requests"). Put all three on the canvas when they change the
   decision, otherwise in the caption or notes.
5. **Each word has one place to live:**

   | Words | Where | Length |
   | --- | --- | --- |
   | Label | Inside the drawing | 2–3 words; a mono sub-label for a value (`1536-dim`, `p95 198ms`) |
   | Arrow label | On the line | What travels or the rule (`cosine · floor 0.35`, `async · queue`) |
   | Eyebrow | Above the title | 1–4 words, a category or section (`FIGURE 02 · RETRIEVAL`, `RESULTS`) |
   | Title / headline | The top of the unit | The claim as a full sentence, 3–14 words |
   | Caption / lede | Under the title or figure | One sentence that adds the why or the caveat |
   | Body | Slides and pages only | Up to three points of at most 12 words, phrases without full stops; each supports the title, never a second claim |
   | Notes / narration | Speaker view, voice-over, `say` | Full sentences, the talk track |
   | Source | Footer or footnote | A named artifact ("the search latency dashboard", "load test 12") |

6. **Plain names.** "The gap-down fade strategy", not an internal code. Codes go in parentheses
   only when someone needs to trace them.
7. **No sentences in the drawing, no labels in the notes.** If a label wraps, split the part or
   move the sentence to the caption.
8. **Readable alone.** A forwarded slide, a screenshot of a figure and a muted video still make the
   point. Caveats that change the conclusion stay on the canvas, not only in the notes.

## The content schema

Each medium fills a subset of one shape. These field names are what layouts bind to.

```ts
type Content = {
  role?: SlideRole;          // the job this unit does (slides)
  eyebrow?: string;
  headline: string;          // the claim
  lede?: string;             // one sentence of why or caveat
  body?: Block[];            // points, a figure, a chart, KPI items, a table
  caption?: string;          // figures
  source?: string;
  notes?: { say: string; delivery?: string; next?: string };
};
```

`DeckSlide` (deck), `SlideStarterData.content` + `.speech` (starters) and preset specs are today's
implementations of this shape. The deck archetype factories (`sectionSlide`, `quoteSlide`,
`factSlide`, `endSlide`) take these fields as data, so the linter can read them.

## Slot budgets

Each slot holds a fixed amount of text before it stops reading at a glance. The budget belongs to
the slot, so it holds in every layout and every style (a condensed display face is no excuse for a
longer headline). `SLOT_BUDGETS` in `uipack/deck` is the table; `lintDeck` reports a slot over
budget as `slot-budget` (a warning), and `slotProblems(slot, text)` checks one string. Line counts
are estimates at the slot's measure on the 1920×1080 canvas.

| Slot | Budget | When it runs over |
| --- | --- | --- |
| eyebrow | 1–4 words, one line, not a sentence | wraps |
| headline | 3–14 words, at most 2 lines | wraps, balanced |
| title | at most 14 words (overview and screen readers) | ellipsis |
| lede | at most 30 words, 3 lines, one sentence | wraps |
| point (body line) | at most 12 words, one line, at most 3 a slide | wraps |
| label | at most 3 words, not a sentence | wraps |
| quote | at most 30 words, 4 lines, 2 sentences | wraps, balanced |
| attribution | at most 8 words | wraps |
| value / number | at most 6 / 3 characters | wraps |
| unit | at most 4 words | wraps |
| baseline | at most 12 words | wraps |
| action | 2–12 words | wraps |
| owner | 1–5 words | wraps |
| date | 1–4 words | wraps |
| source | at most 30 words | wraps |

The web uses the same budgets for its eyebrows, headlines and labels; they are not linted there
yet.

## Diagrams

- The **caption** states the claim. A stranger should be able to say it from the picture alone, and
  the caption confirms it.
- Every box appears in the caption (its claim or its caveat) or in an arrow label. Eight to twelve
  nodes is the ceiling; past that, use two figures with two claims, or a drill-down.
- Every arrow is labelled with what moves or the rule that gates it, never a statistic.
- **A statistic lives once, in the sub-label of the node it measures**, with its baseline:
  `p95 198ms · was 410ms` on the outcome node, `3% · was 5%` on the retry branch's node. On an arrow or a
  single path, it reads as if it covered only that path.
- **Every path ends somewhere.** Each branch, the failure and exception ones included, reaches an
  outcome node or rejoins the flow. If the input doesn't say where a branch goes, end it at a node
  labelled `TODO: what happens next` rather than drawing an invented route or a dead end.
- **One scope per figure.** Every number in it shares the caption's population and window, and the
  source line names them. A part outside that scope (a planned or other-region step) carries it in
  its sub-label (`planned · not live`) and the caption says it is unmeasured; a number with a different
  or unknown source says so in the source line.
- Step numbers (`01 / 02 / 03`) only when order matters, and the caption refers to them.
- A `hint` (selection note) is one short sentence on what the part does.
- ❌ a box labelled "RAG pipeline". ✅ `Chunk → Embed → pgvector`, with arrows `~1000 chars` and
  `1536-dim`.

## Slides

The full guide is [Deck storytelling](../deck-storytelling.md), and `lintDeck` checks it. The core:

- **Answer first.** The conclusion is on slide one or two. Slide one names the outcome ("Search
  got twice as fast"), not the system. Its body carries the trade-off and the ask that qualify
  the answer.
- **Action titles.** Every headline is a claim of 3–14 words. "Index freshness fell from 40 to 6
  minutes", not "Results". An evidence or cost headline also says what the number means for the
  decision, from the given facts ("Moving the last two regions costs one engineer for six weeks"),
  not the bare figure again.
- **Ghost deck.** The titles alone, in order, tell the whole argument (`storylineOf`).
- **One idea per slide.** The body proves the title. Cover the title, and the visual should still
  point at it.
- **The facts set the length, not the template.** When the input can't fill a beat (no options,
  no milestones), merge or drop it and leave one `TODO:` question in that slide's notes; don't
  invent content to fill it. "Do nothing" can always be stated from the facts: what stays as it is.
- **Roles** (`cover`, `answer`, `context`, `problem`, `evidence`, `mechanism`, `option`,
  `recommendation`, `plan`, `risk`, `ask`, `demo`, `appendix`) tag each slide's job. Six storyline
  templates order them: project update, decision request, deep dive, launch, postmortem, review
  highlights.
- **End on a concrete ask**: an action, a named owner (a role or team) and a calendar date, plus
  what happens on a no or a missed date (if the input doesn't say, a `TODO:` in the notes). Never
  "Questions?".
- **Notes carry the talk.** `say` in full sentences (about 135 words a minute), `delivery` for cues,
  `next` for the bridge to the next slide. When the brief fixes the slide count but not the time,
  budget about a minute a slide (100–135 words); notes restate and explain, never pad.
- Eyebrows on slides name the section, not the slide's claim.

## Web

The full rules are in [Web principles](../web-principles.md). The core:

- **One goal per page.** One primary action, placed in the hero, the nav and the end. It is the
  reader's own next step. When the facts' real action is an internal approval, that ask belongs
  in the deck; the page keeps budgets, pending approvals and approvers' names off it, but keeps
  any trade-off its readers will feel (a higher error rate) as a section.
- **The headline is the outcome for the reader**, the subhead says how, and a demo proves it within
  15 seconds.
- **Section heads are claims** too. "Answers in one search, not five" beats "Features".
- **The FAQ answers real objections** in the asker's words. Its text and its structured data share
  one source.
- Body copy is short: one idea per paragraph, at most three sentences.

## Motion

Write a **beat script** before animating: one line per beat, saying what changes and why it
matters.

```text
01  The request leaves the browser and reaches the edge cache.
02  Cache miss: it continues to the origin. (packet turns, accent path)
03  The response rides back; the cache keeps a copy.
```

- One change per beat. A beat with "and" in it is two beats.
- Each beat's line becomes the step narration (stepped figures), the speaker `say`, or the voice-over.
- The resting frame must make the point without the motion: it's what reduced motion, print and
  thumbnails show.

## 3D

- **One subject, one story.** Write the stops as a beat script, one sentence of narration each.
- **A small label set per stop**, 2–3 words each. Only the labels that stop's sentence needs.
- Inspect details (selection) are one sentence on what the component does.
- The 2D fallback lists the same components and connections in words. It is content, not an
  error message.
