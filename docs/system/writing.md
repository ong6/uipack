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
3. **Specific beats upbeat.** Use a number and what it measures, a multiple ("twice"), or a
   before and after ("3 meetings → 1"). "In a good place" could describe any quarter.
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
   | Eyebrow | Above the title; optional, and off on slides by default | 1–4 words, a category or section (`FIGURE 02 · RETRIEVAL`), never the claim |
   | Title / headline | The top of the unit | A presented slide: 2–5 words, a topic label or a verdict you'd say aloud (`Search: twice as fast since March`). A slide read without its speaker, a figure, a web section: the claim as a full sentence, 3–14 words |
   | Caption / lede | Under the figure (caption) or, rarely, a slide title (lede) | One plain sentence for the why or a caveat; slides have no lede by default |
   | Body | Slides and pages only | Slides: 2–4 fragments of at most 8 words, no full stops, carrying the numbers and cues (`p95 198 ms, half of March`, `5 indexes → 1`). Pages: short paragraphs |
   | Notes / narration | Speaker view, voice-over, `say` | A presented deck: cues, a few short lines. A read-alone deck, a voice-over: full sentences |
   | Source | Footer or footnote | A named artifact ("the search latency dashboard", "load test 12") |

6. **Plain names.** "The gap-down fade strategy", not an internal code. Codes go in parentheses
   only when someone needs to trace them.
7. **No sentences in the drawing, no labels in the notes.** If a label wraps, split the part or
   move the sentence to the caption.
8. **Readable alone.** A screenshot of a figure and a muted video still make the point. A presented
   slide still shows its numbers and their baselines, so a forwarded copy keeps the facts; a deck
   that must carry the whole argument without its speaker is written read-alone (see
   [Slides](#slides)). Caveats that change the conclusion stay on the canvas, not only in the notes.
9. **Write like a person, not a template.** Each of these is fine once; repeated, they read as
   generated (Wikipedia's "Signs of AI writing" names most of them):

   | Tell | Looks like | Instead |
   | --- | --- | --- |
   | "X, not Y" on every slide | "decided in one meeting, not three" | State the fact (`3 meetings → 1`); say the contrast if it matters |
   | Two balanced clauses on a semicolon | "Same teams and the same six months; only the order of the slides changed." | Two points, or keep one and say the other |
   | A comparison bolted onto every claim | "198 ms at p95, twice as fast as March" | The baseline as its own point, or said aloud |
   | Matched number pairs | "one meeting, not three" next to "one index replaced five" | One number per point, with its baseline |
   | A tidy closing clause | "…and the cache serves the rest" | Stop at the fact |
   | A coined term used as if established | "Answer-first reviews" | Say what happened: reviews that opened with the answer |
   | The same shape on every unit | eyebrow, sentence headline, lede, slide after slide | Vary the form: labels, verdicts, the occasional question |
   | A one-word caps eyebrow | `REVIEWS`, `SEARCH` | Drop it; the title names the topic |

   Hoffman's note on his own LinkedIn pitch applies too: be wary of adjectives and especially
   adverbs ("high", not "very high").

## The content schema

Each medium fills a subset of one shape. These field names are what layouts bind to.

```ts
type Content = {
  role?: SlideRole;          // the job this unit does (slides)
  eyebrow?: string;          // optional, off on slides by default
  headline: string;          // presented: a short label or verdict; read-alone: the claim
  lede?: string;             // optional: one plain sentence of caveat
  points?: string[];         // slides: 2–4 fragments that carry the numbers
  body?: Block[];            // a figure, a chart, KPI items, a table
  caption?: string;          // figures
  source?: string;
  notes?: { say: string; delivery?: string; next?: string }; // say: cues when presented
};
```

`DeckSlide` (deck), `SlideStarterData.content` + `.speech` (starters) and preset specs are today's
implementations of this shape. The deck archetype factories (`pointsSlide`, `sectionSlide`,
`quoteSlide`, `factSlide`, `endSlide`) take these fields as data, so the linter can read them.

## Slot budgets

Each slot holds a fixed amount of text before it stops reading at a glance. The budget belongs to
the slot, so it holds in every layout and every style (a condensed display face is no excuse for a
longer headline). `SLOT_BUDGETS` in `uipack/deck` is the table; `lintDeck` reports a slot over
budget as `slot-budget` (a warning), and `slotProblems(slot, text)` checks one string. Line counts
are estimates at the slot's measure on the 1920×1080 canvas. The headline's length depends on the
deck's mode (`TITLE_WORDS`), so `title-length` checks it, not `slot-budget`.

| Slot | Budget | When it runs over |
| --- | --- | --- |
| eyebrow (optional) | 1–4 words, one line, not a sentence | wraps |
| headline | presented: at most 6 words (aim for 2–5); read-alone: at most 14, on at most 2 lines | wraps, balanced |
| title | at most 14 words (overview and screen readers) | ellipsis |
| lede (optional) | at most 30 words, 3 lines, one sentence | wraps |
| point (body line) | at most 8 words, one line, a fragment with no full stop; 2–4 a slide | wraps |
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

The full guide is [Deck storytelling](../deck-storytelling.md), and `lintDeck` checks it. Every
deck is written for one of two modes, passed as `lintDeck(slides, { mode })` or the player's
`lint={{ mode }}`:

| Mode | When | Title | Body | Notes |
| --- | --- | --- | --- | --- |
| `presented` (default) | You give it, and the room hears you | 2–5 words: a topic label (`Search latency`) or a verdict that sounds spoken (`Review decisions: 3 meetings → 1`) | 2–4 fragments carrying the numbers and cues, or one piece of evidence | Cues: a few short lines |
| `read-alone` | It goes out without you: a pre-read, a forwarded deck, a consulting-style customer readout | The real conclusion as one sentence, 3–14 words | Points, or one piece of evidence | The talk track in full sentences |

Why presented is the default: across 66 well-regarded decks and talks (keynotes, engineering
talks, pitch decks), the strongest fit for a speaker who talks from on-slide points is a short title
over a few fragments (Rich Hickey, Rob Pike, LinkedIn's Series B deck, Benedict Evans), or a short
spoken claim over one piece of evidence (Simon Willison, Evans). None of the 26 tech talks used an
eyebrow over a sentence headline over a lede. A sentence headline plus a lede writes out what the
speaker would say, so the speaker recites it and the room reads ahead.

- **Answer first.** The conclusion is on slide one or two, and slide one names the outcome
  ("Search: twice as fast, and cheaper"), not the system. Its points carry the trade-off and the ask.
- **Short titles, mixed forms.** A label ("Search latency"), a verdict ("Decided in 6 days"), the
  occasional question ("Will the cache hold?"). Never the same shape on every slide
  (`slide-shape`).
- **The points carry the numbers.** Each is a fragment: a number with its baseline ("p95: 412 ms →
  198 ms"), a cue ("Only change: the answer moved to slide 1"), a caveat that must stay on screen
  ("Not proof of cause"). An answer, evidence, problem or recommendation slide quantifies its claim
  in the title or a point. A plan slide carries a date or a number.
- **Evidence slides: a short spoken headline and one piece of evidence.** A chart, a number with
  its baseline (the fact archetype), a screenshot. The headline says what it shows ("The slowest
  search in 20"); the evidence does the proving.
- **No eyebrow and no lede by default.** Add a lede only for a caveat that would change the decision
  and doesn't fit as a point.
- **Say the because.** The full claim, the comparison and the reasoning are spoken, from cues.
  Nothing on a presented slide needs reading aloud, so you can word it differently every time.
- **Ghost deck.** The titles alone, in order, still outline the argument (`storylineOf`): a
  speaker's outline when presented, the argument in full sentences when read alone.
- **Read-alone titles state the real conclusion.** The Boeing slide NASA saw before Columbia was
  titled "Review of Test Data Indicates Conservatism for Tile Penetration"; the caveat that decided
  it (the foam was 1,920 cubic inches, the test 3) was its last, smallest bullet. A sentence title is
  only as good as the conclusion it states. An evidence or cost title says what the number means
  for the decision, from the given facts ("Moving the last two regions costs one engineer for six
  weeks").
- **One idea per slide.** The body proves the title. Cover the title, and the visual should still
  point at it.
- **The facts set the length, not the template.** When the input can't fill a beat (no options,
  no milestones), merge or drop it and leave one `TODO:` question in that slide's notes; don't
  invent content to fill it. "Do nothing" can always be stated from the facts: what stays as it is.
- **Roles** (`cover`, `answer`, `context`, `problem`, `evidence`, `mechanism`, `option`,
  `recommendation`, `plan`, `risk`, `ask`, `demo`, `appendix`) tag each slide's job. Six storyline
  templates order them: project update, decision request, deep dive, launch, postmortem, review
  highlights.
- **End on a concrete ask**: an action, a named owner (a role or team) and a calendar date, in the
  title or the points, plus what happens on a no or a missed date (if the input doesn't say, a
  `TODO:` in the notes). Never "Questions?".
- **Notes are cues when presented.** `say` is a few short lines, one thought each and at most about
  60 words (`notes-cues`): the claim to say, the number to point at, the caveat, the source.
  `delivery` is one cue for pace or where to point; `next` is the bridge, a few words. Because you
  talk in your own words, the talk's length comes from the slide count, about a minute a slide, not
  from the notes. A read-alone deck keeps `say` in full sentences at about 135 words a minute (100–135
  words a slide when only the count is fixed); notes restate and explain, never pad.
- **No AI tells** (rule 9 above): `ai-tells` flags a "X, not Y" contrast or a bolted-on comparison
  on more than one slide, and a semicolon balancing two clauses.

## Web

The full rules are in [Web principles](../web-principles.md). The core:

- **One goal per page.** One primary action, placed in the hero, the nav and the end. It is the
  reader's own next step. When the facts' real action is an internal approval, that ask belongs
  in the deck; the page keeps budgets, pending approvals and approvers' names off it, but keeps
  any trade-off its readers will feel (a higher error rate) as a section.
- **The headline is the outcome for the reader**, the subhead says how, and a demo proves it within
  15 seconds.
- **Section heads are claims** too. "Answers in one search" beats "Features".
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
