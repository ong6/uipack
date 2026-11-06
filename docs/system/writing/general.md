# Writing: general rules

The rules every kind of UiPack text follows (slides, documents, web copy, figure labels), with
the place each word lives and every slot's text budget. The kind files add to these; they never
override them. Start at [Writing](README.md) for the index.

## Rules for every kind

1. **Claim first.** Before writing anything else, write one sentence the reader should conclude:
   "A question fans out to five knowledge bases in parallel, and only chunks above 0.35 similarity
   reach the model." Everything else serves that sentence.
2. **Only the given facts.** Arithmetic on given numbers is fine ("40 to 6 minutes" is "34
   minutes sooner"); a guessed cause, scope or reassurance is not, however plausible. Leave a
   missing fact out: don't fill it, don't print `TODO`, and don't announce it ("still to confirm",
   "not yet known"). Mention a gap only when the decision turns on it, once, in a plain sentence
   ("iOS isn't in these numbers"). A recommendation is said as one ("we recommend"), never as a
   measured fact.
3. **Each caveat has one home.**
   - *Sources:* one source line per piece, giving each number its own source. A number the input
     left bare is listed there once as "source not given". Never borrow a neighbour's source.
   - *Before and after:* say "after", "since" or "went from… to", never "lifted", "cut" or
     "because" (`causal-claim`). Add one plain sentence, once per deliverable, that the numbers
     compare two windows ("this compares September with October; other things changed too").
4. **Keep the numbers' own words.** A median stays a median, and "about" and "up to" stay. "Up to
   15 minutes" never becomes "a short while".
5. **Plain names, in the reader's words.** No coined labels ("off-main decode"), and no internal
   codes unless someone needs to trace them, then in parentheses.
6. **Each unit adds something.** Don't repeat a point or number across slides, between a title
   and its points, or between a hero and its sections.
7. **Write like a person.** Avoid the AI tells in the table below. Read the last sentence of each
   note, caption and paragraph, and delete it if it only sums up.
8. **Finished copy holds only the reader's words.** No role tags ("(answer)"), field labels
   ("So-what:"), builder notes ("the figure fills the body") or brief instructions in headings.
9. **Reread as the audience, revise once.** Read the draft cold as the person who must act on it,
   check each line, and fix every miss in one pass:

   ```text
   - Each title states a point and hides nothing
   - Each point is unambiguous on its own
   - Notes add what the slide can't hold
   - The ask is complete: action, object, cost, owner, date
   - Qualifiers are exact
   - Nothing is invented or announced
   - No phrase repeats across pieces
   - Only the reader's words remain
   - No AI tells
   ```

## Each word has one place

| Words | Where | What goes there |
| --- | --- | --- |
| Label | Inside the drawing | A name in the input's words; a mono sub-label for a value (`1536-dim`, `p95 198ms`) |
| Arrow label | On the line | What travels or the rule (`decoded image`, `cosine · floor 0.35`), never a vague noun (`data`) |
| Eyebrow | Above the title; optional, off on slides | A category or section (`FIGURE 02 · RETRIEVAL`), never the claim |
| Title, headline | The top of the unit | See [Lengths at a glance](README.md#lengths-at-a-glance) and your kind's file |
| Caption, lede | Under a figure; rarely under a slide title | One plain sentence for the why or a caveat |
| Body | Slides and pages | Slides: fragments that carry the numbers. Pages: short paragraphs |
| Notes, narration | Speaker view, voice-over | What the unit can't hold: why, so-what, trade-off, bridge |
| Source | Footer, footnote, source line | A named artifact ("the search latency dashboard", "load test 12") |

No sentences in the drawing and no labels in the notes: if a label wraps, split the part or move
the sentence to the caption.

## AI tells

Each is fine once; repeated, it reads as generated (Wikipedia's "Signs of AI writing" names most).

| Tell | Looks like | Instead |
| --- | --- | --- |
| "X, not Y" on every unit | "decided in one meeting, not three" | State the fact (`3 meetings → 1`) |
| Two clauses balanced on a semicolon | "Same teams and six months; only the order changed." | Two points, or keep one |
| A comparison bolted onto every claim | "198 ms at p95, twice as fast as March" | The baseline as its own point |
| A tidy closer or kicker | "Speed is the feature." | Stop at the last fact |
| A formula ending | a closing "In summary" | End on the ask, or stop |
| Inline disclaimers | "not a controlled test" inside a sentence | Once, in the source line or notes |
| Three items where one would do | "faster, cheaper and simpler" | Keep the item that carries the point |
| A coined term used as established | "Answer-first reviews" | Say what happened |
| The same shape on every unit | eyebrow, sentence headline, lede, again and again | Vary the form |

Be wary of adjectives and especially adverbs (cut "very" from "very high").

## The content schema

Each medium fills a subset of one shape; layouts bind to these field names.

```ts
type Content = {
  role?: SlideRole;          // the job this unit does (slides)
  eyebrow?: string;          // optional, off on slides by default
  headline: string;          // presented: a short spoken verdict; read-alone: the claim
  lede?: string;             // optional: one plain sentence of caveat
  points?: string[];         // slides: fragments that carry the numbers
  body?: Block[];            // a figure, a chart, KPI items, a table
  caption?: string;          // figures
  source?: string;
  notes?: { say: string; delivery?: string; next?: string }; // say: cues when presented
};
```

`DeckSlide` (deck), `SlideStarterData.content` with `.speech` (starters) and the preset specs
implement it. The archetype factories (`pointsSlide`, `sectionSlide`, `quoteSlide`, `factSlide`,
`endSlide`) take these fields as data, so the linter can read them.

## Slot budgets

Each slot holds a fixed amount of text before it stops reading at a glance. The budget belongs
to the slot, so it holds in every layout and every style: a condensed face is no excuse for a
longer headline. `SLOT_BUDGETS` in `uipack/deck` is the table; `lintDeck` reports a slot over
budget as `slot-budget`, and `slotProblems(slot, text)` checks one string. Line counts are
estimates at the slot's measure on the slide canvas. The headline's length depends on the deck's
mode (`TITLE_WORDS`), so `title-length` checks it instead.

<!-- generated:slot-budgets -->
| Slot | Budget | When it runs over |
| --- | --- | --- |
| eyebrow (optional) | 1–4 words, one line, never a sentence | wraps |
| headline | presented: at most 6 words (aim for 2–5); read-alone: at most 14, on at most 2 lines | wraps, balanced |
| title | at most 14 words (overview and screen readers) | ellipsis |
| lede (optional) | at most 30 words, 3 lines, one sentence | wraps |
| point (body line) | at most 8 words, one line, a fragment with no full stop; 2–4 a slide | wraps |
| label | at most 3 words, never a sentence | wraps |
| quote | at most 30 words, 4 lines, 2 sentences | wraps, balanced |
| attribution | at most 8 words, one line, never a sentence | wraps |
| value / number | at most 6 / 3 characters | wraps |
| unit | at most 4 words, never a sentence | wraps |
| baseline | at most 12 words, one line, one sentence | wraps |
| action | 2–12 words, 2 lines, one sentence | wraps |
| owner | 1–5 words, never a sentence | wraps |
| date | 1–4 words, never a sentence | wraps |
| source | at most 30 words, 2 lines | wraps |
<!-- /generated -->

The web uses the same budgets for its eyebrows, headlines and labels; they are not linted there
yet. Try a slot here: the verdict is the one the linter gives a whole deck.

```uipack-demo budget-checker
Pick a slot and type: the live verdict from slotProblems, the same check lintDeck runs.
```
