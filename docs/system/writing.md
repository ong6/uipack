# Writing: what it says

Writing is the content layer: the claim, the words on the canvas, the words beside it and the
spoken track. It is **typed data with no colour, font or position in it**, so the same words
render in any layout that has matching slots, in any style. See [the system overview](README.md).

## Rules for every medium

1. **Write the claim before drawing.** One sentence: what the reader should conclude. "A question
   fans out to five knowledge bases in parallel, and only chunks above 0.35 similarity reach the
   model." Everything on the canvas serves that sentence.
2. **Only the facts you were given, and silence where there are none.** Every number, scope,
   cause and reassurance traces to the input. Arithmetic on given numbers is fine ("40 to 6
   minutes" is "34 minutes sooner"); a guess about what a metric includes, why it moved or what it
   rules out is not, however plausible ("the p95 already counts retried requests"). When the input
   lacks a fact, leave it out. Don't fill it, don't print `TODO`, and don't announce the gap: "still
   to confirm", "not yet known", "we haven't costed a fix" and "nothing else changed" all put the
   writer's bookkeeping in front of the reader. Mention a gap only when the decision turns on it,
   once, as a plain sentence in the notes ("iOS isn't in these numbers"). A before/after claims no
   cause: say "after", "since" or "went from… to", never "lifted", "cut", "drove" or "because"
   (`causal-claim`). Say once in the whole deliverable, in a plain sentence in the deck's
   evidence-slide notes, that the numbers compare two windows ("this compares September with
   October; other things changed too"). Nowhere else: not in the figure, the page or a title. Reasoning from the given facts is not a new fact:
   why a number matters and what follows for this audience are what notes are for. A consequence
   the input gives as a purpose can be stated ("approve by 9 January so it ships in spring": a
   later yes misses spring). A recommendation is said as one ("we recommend"), never as a measured
   fact.
3. **Be specific.** Use a number and what it measures, a multiple ("twice"), or a
   before and after ("3 meetings → 1"). "In a good place" could describe any quarter.
4. **A baseline, a window and a source travel with the number they were given for, and only
   that number.** "The search latency dashboard, May vs June, all regions" given for p95 says
   nothing about the error rate in the next sentence. A number given without them is stated as
   given ("errors rose from 2% to 3%"): never borrow a neighbour's source, and don't scatter
   disclaimers about the missing one. Sources live in one place per piece: the evidence slide's
   source line or notes for a deck, the source line for a figure. List each number's source there
   once, and a number the input gave without one as "source not given", there and nowhere else. Keep the measure's own word and its qualifiers exactly:
   a median stays a median (or its exact plain form, "half of requests"), "up to 15 minutes" never
   becomes "a short while" or "15 min", "about 40" keeps its "about". Put all three on the canvas when they change the
   decision, otherwise in the caption, notes or source line, stated once as a named artifact.
5. **Each word has one place to live:**

   | Words | Where | Length |
   | --- | --- | --- |
   | Label | Inside the drawing | 2–3 words; a mono sub-label for a value (`1536-dim`, `p95 198ms`) |
   | Arrow label | On the line | What travels or the rule (`decoded image`, `cosine · floor 0.35`), never a vague noun (`user sessions`, `data`) |
   | Eyebrow | Above the title; optional, and off on slides by default | 1–4 words, a category or section (`FIGURE 02 · RETRIEVAL`), never the claim |
   | Title / headline | The top of the unit | A presented slide: 2–5 words, a verdict you'd say aloud (`Search got twice as fast`, `Starts got 0.2 s slower`); a bare label only on agenda, section and mechanism slides. A slide read without its speaker, a figure: the claim as a full sentence, 3–14 words. A web section: a short plain head (see [Web](#web)) |
   | Caption / lede | Under the figure (caption) or, rarely, a slide title (lede) | One plain sentence for the why or a caveat; slides have no lede by default |
   | Body | Slides and pages only | Slides: 2–4 fragments of at most 8 words, no full stops, carrying the numbers and cues (`p95 198 ms, half of March`, `5 indexes → 1`). Pages: short paragraphs |
   | Notes / narration | Speaker view, voice-over, `say` | A presented deck: a few short cue lines that add what the slide can't hold (why, so-what, trade-off, bridge). A read-alone deck, a voice-over: full sentences |
   | Source | Footer or footnote | A named artifact ("the search latency dashboard", "load test 12") |

6. **Plain names, in the audience's words.** Use the plain name ("the gap-down fade strategy");
   an internal code goes in parentheses only when someone needs to trace it. Don't coin a label the
   input doesn't use ("off-main decode"). Copy for users says what they notice ("images now load in
   the background"). It leaves out the mechanism ("main thread"), names the measuring tool as what
   it is to them ("Crashlytics" becomes "our crash reports"), and keeps the scope qualifier they
   need ("on Android"). A public or customer page carries no internal metrics (conversion rates,
   ticket counts) unless its reader cares about them. It says "cards that used to go missing now
   show up"; "tickets fell from 40 to 9" stays in the internal deck.
7. **No sentences in the drawing, no labels in the notes.** If a label wraps, split the part or
   move the sentence to the caption.
8. **Readable alone.** A screenshot of a figure and a muted video still make the point. A presented
   slide still shows its numbers and their baselines, so a forwarded copy keeps the facts; a deck
   that must carry the whole argument without its speaker is written read-alone (see
   [Slides](#slides)). Caveats that change the conclusion stay on the canvas as well as in the notes.
9. **Each unit adds something.** A point or number appears once per piece: a title doesn't repeat
   the point under it, a later slide doesn't restate slide one, and a page's hero, subhead and
   sections each carry a different fact. Slide one may preview the answer and the ask in a few
   words; the evidence slide then adds what slide one lacks (baseline, window, source), and the
   ask slide adds the owner, cost and consequence. The ask is the one slide that names its object
   and cost again, in a few words, because it stays up while the room decides.
10. **Write like a person.** Each of these is fine once; repeated, they read as
   generated (Wikipedia's "Signs of AI writing" names most of them):

   | Tell | Looks like | Instead |
   | --- | --- | --- |
   | "X, not Y" on every slide | "decided in one meeting, not three" | State the fact (`3 meetings → 1`); say the contrast if it matters |
   | Two balanced clauses on a semicolon | "Same teams and the same six months; only the order of the slides changed." | Two points, or keep one and say the other |
   | A comparison bolted onto every claim | "198 ms at p95, twice as fast as March" | The baseline as its own point, or said aloud |
   | Matched number pairs | "one meeting, not three" next to "one index replaced five" | One number per point, with its baseline |
   | A tidy closing clause | "…and the cache serves the rest" | Stop at the fact |
   | A kicker line ending a section | "Speed is the feature." | End on the last fact or verdict |
   | A formula closing section | a closing "In summary" or "What we'd do next" recap | End on the ask, or stop |
   | Source disclaimers in the prose | "not a controlled test" or "same window and source" inside a sentence | Method and source once, in a caption, note or source line |
   | Three items where one would do | "faster, cheaper and simpler" | Keep the item that carries the point |
   | A coined term used as if established | "Answer-first reviews" | Say what happened: reviews that opened with the answer |
   | The same shape on every unit | eyebrow, sentence headline, lede, slide after slide | Vary the form: labels, verdicts, the occasional question |
   | A one-word caps eyebrow on a slide | `REVIEWS`, `SEARCH` | Drop it; the title names the topic (a web page's numbered section eyebrow is wayfinding and stays) |

   Hoffman's note on his own LinkedIn pitch applies too: be wary of adjectives and especially
   adverbs (cut "very" from "very high").
11. **Reread as the audience, then revise once.** After the draft, read it cold as the person who
   must act on it, check each line below, and fix every miss in one revision pass:

   ```text
   - Every title states a point and can't mislead by omission ("three weeks" hiding a 400-article review)
   - Every point is unambiguous alone ("survey: ~6% responded"; "6% answered" hides the base)
   - Every note adds why, so-what, the trade-off or the bridge; none restates its slide
   - The ask names action, object, cost, owner and date (and what a no means, if the input says)
   - Each number keeps its exact qualifier, and its own source and window when given
   - Nothing invented, and no gap announced that the decision doesn't need
   - No phrase repeats across the pieces ("still to confirm", a caveat, a title shape on 3+ slides)
   - The copy holds only the reader's words: no role tags ("(answer)"), no field labels
     ("So-what:", "Delivery:"), no notes to the builder ("the figure fills the body"), no brief
     instructions in the headings
   - No AI tells (rule 10)
   ```

## The content schema

Each medium fills a subset of one shape. These field names are what layouts bind to.

```ts
type Content = {
  role?: SlideRole;          // the job this unit does (slides)
  eyebrow?: string;          // optional, off on slides by default
  headline: string;          // presented: a short spoken verdict; read-alone: the claim
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
deck's mode (`TITLE_WORDS`), so `title-length` checks it instead of `slot-budget`.

| Slot | Budget | When it runs over |
| --- | --- | --- |
| eyebrow (optional) | 1–4 words, one line, never a sentence | wraps |
| headline | presented: at most 6 words (aim for 2–5); read-alone: at most 14, on at most 2 lines | wraps, balanced |
| title | at most 14 words (overview and screen readers) | ellipsis |
| lede (optional) | at most 30 words, 3 lines, one sentence | wraps |
| point (body line) | at most 8 words, one line, a fragment with no full stop; 2–4 a slide | wraps |
| label | at most 3 words, never a sentence | wraps |
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
- **Draw the system or the flow.** At most six nodes; past that, use two
  figures with two claims, or a drill-down. Every box appears in the caption (its claim or its
  caveat) or in an arrow label.
- Every arrow follows the direction of flow and is labelled with what moves or the rule that gates
  it (`decoded image`, `draw`), never a statistic or a noun that names no change (`user sessions`).
  Nothing points from a screen to a metric or a ticket count. Node labels use the input's words,
  not coined ones.
- **Results live in a sub-label or the caption**, never as their own node; a time window (`30 days
  after`) is not a node either. Before and after panels show the same measures, and a figure of a change
  draws both states (the old path faded beside the new), never the new flow alone.
- **A statistic lives once, in the sub-label of the node it measures**, with its baseline:
  `p95 198ms · was 410ms` on the search node, `3% · was 5%` on the retry branch's node. On an arrow or a
  single path, it reads as if it covered only that path.
- **Draw only the paths the input describes.** Each branch, the failure and exception ones
  included, reaches a node or rejoins the flow. If the input doesn't say where a branch goes, it
  ends at its last known node, with its number in that node's sub-label (`Misrouted · 6%, was
  4%`). Never invent a route, and never draw an unknown as a node.
- **One scope per figure.** Every number in it shares the caption's population and window, and the
  source line names them. A part outside that scope (a planned or other-region step) carries it in
  its sub-label (`planned · not live`) and the caption says it is unmeasured; a number with a different
  source names its own in the source line, and one given without a source gets none (rule 4).
- Step numbers (`01 / 02 / 03`) only when order matters, and the caption refers to them.
- A `hint` (selection note) is one short sentence on what the part does.
- **Name the parts, not the system.** Don't draw one box labelled "RAG pipeline". Draw the
  stages the claim is about, Chunk → Embed → pgvector, and label the arrows with what travels
  (`~1000 chars`, `1536-dim`).

## Slides

The full guide is [Deck storytelling](../deck-storytelling.md), and `lintDeck` checks it. Every
deck is written for one of two modes, passed as `lintDeck(slides, { mode })` or the player's
`lint={{ mode }}`:

| Mode | When | Title | Body | Notes |
| --- | --- | --- | --- | --- |
| `presented` (default) | You give it, and the room hears you | 2–5 words: a verdict that sounds spoken (`Review decisions: 3 meetings → 1`, `Search got twice as fast`); a bare label only on agenda, section and mechanism slides | 2–4 fragments carrying the numbers and cues, or one piece of evidence | Cues: a few short lines |
| `read-alone` | It goes out without you: a pre-read, a forwarded deck, a consulting-style customer readout | The real conclusion as one sentence, 3–14 words | Points, or one piece of evidence | The talk track in full sentences |

Why presented is the default: across 66 well-regarded decks and talks (keynotes, engineering
talks, pitch decks), the strongest fit for a speaker who talks from on-slide points is a short title
over a few fragments (Rich Hickey, Rob Pike, LinkedIn's Series B deck, Benedict Evans), or a short
spoken claim over one piece of evidence (Simon Willison, Evans). None of the 26 tech talks used an
eyebrow over a sentence headline over a lede. A sentence headline plus a lede writes out what the
speaker would say, so the speaker recites it and the room reads ahead. A bare label goes too far
the other way: the room waits for the speaker to learn the point, and a forwarded slide says
nothing. A short verdict keeps both.

- **Answer first.** The conclusion is on slide one or two. Name the outcome on slide one, such as
  "Search got twice as fast since March"; the system's name goes on slide two, as the reason. Slide
  one's points carry the trade-off and the ask.
- **Short spoken verdicts, mixed forms.** Most titles are something you'd say aloud ("Android
  crashes down by two thirds", "Starts got a bit slower", "We need a German model"). The "Topic:
  a → b" pair ("Start time: 1.4 → 1.6 s") is one form among several: use it on one or two slides,
  not three. The occasional question about something not yet known ("Will the cache hold?") is
  fine, never one about a measured fact ("Slower starts?"). Labels
  ("Crash rate") are for agenda, section and mechanism slides; `title-claim` flags one on a
  content slide. Never the same shape on every slide (`slide-shape`).
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
- **One idea per slide, said once.** The body proves the title without repeating it, and no slide
  restates another (rule 9). Cover the title, and the visual should still point at it.
- **The facts set the length.** When the input can't fill a beat (no options,
  no milestones), merge or drop it; don't invent content to fill it, and don't announce the gap as
  a fact about the team (rule 2). "Do nothing" can always be stated from the facts: what stays as it is.
- **Roles** (`cover`, `answer`, `context`, `problem`, `evidence`, `mechanism`, `option`,
  `recommendation`, `plan`, `risk`, `ask`, `demo`, `appendix`) tag each slide's job. Six storyline
  templates order them: project update, decision request, deep dive, launch, postmortem, review
  highlights.
- **End on a concrete ask**: an action and its object ("approve Spanish and French"; a bare
  "approve by 15 January" has no object), its cost when the facts give one, a named owner (a role or team) and a calendar date (with
  its year when that isn't this year), in the title or the points, plus what happens on a no or a
  missed date: the input's stated purpose gives it ("so it ships in spring": later misses spring);
  if nothing does, leave it out. Never "Questions?".
- **Notes are cues that add what the slide can't hold.** The room reads the slide, so `say` is a
  few short lines, one thought each and at most about 60 words (`notes-cues`), on why it matters,
  the so-what for this audience, the trade-off if the answer is no, and the open question, all
  reasoned from the given facts, then the source. A note that restates its slide's points fails
  (`notes-echo`): "Cost: one engineer for three weeks" under a slide that says so gives the speaker
  nothing; "If no, Spanish and French meet the price change on the old bot" does. A stage direction
  alone ("Point at the 9") goes in `delivery`.
  `delivery` is one cue for pace or where to point; `next` is the bridge, a few words, only where
  the link isn't obvious (the same "Next: …" under every slide reads as a template). Because you
  talk in your own words, the talk's length comes from the slide count, about a minute a slide, not
  from the notes. A read-alone deck keeps `say` in full sentences at about 135 words a minute (100–135
  words a slide when only the count is fixed); notes explain, never pad.
- **No AI tells** (rule 10 above): `ai-tells` flags a "X, not Y" contrast or a bolted-on comparison
  on more than one slide, and a semicolon balancing two clauses.

## Web

The full rules are in [Web principles](../web-principles.md). The core:

- **One goal per page.** One primary action, placed in the hero, the nav and the end. It is the
  reader's own next step. When the facts' real action is an internal approval, that ask belongs
  in the deck; the page keeps budgets, pending approvals and approvers' names off it, but keeps
  any trade-off its readers will feel (a higher error rate) as a section. Internal metrics
  (conversion, ticket counts) stay off it too (rule 6): say what the customer notices.
- **The headline is the outcome for the reader**, in their words and with its scope ("on
  Android"); the subhead says how, and a demo proves it within 15 seconds. An announcement page
  reads as one: the headline says what changed for the reader ("Pull requests check in about
  7 minutes"), never a metric label ("CI: median 18 → 7"), and a section says what they do
  differently, if anything.
- **Section heads are short and plain**: 2–5 words naming what the reader gets ("Fewer crashes",
  "A slightly slower start", "Android only"), never the section's kind ("Features") and never a
  sentence crammed with numbers. The supporting line carries the number, once.
- **The reader's words** (rule 6): no internals or tool names; a source becomes what it is to them
  ("our crash reports, 30 days before and after").
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
- The 2D fallback lists the same components and connections in words. Write it as content
  that a reader can follow.
