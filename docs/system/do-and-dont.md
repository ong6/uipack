# Do and don't

Paired examples of the writing, layout and style rules, each drawn live, then the checklist of
generic AI-landing tropes to keep out of a page. Every pair names the rule it shows; the rules
themselves live in [Writing](writing/README.md), [Layout](layout/README.md) and
[Style](style.md).

## Headlines: two modes

<!-- generated:headline-rule -->
- **Presented** (a speaker in the room): aim for 2–5 words; the check stops at 6 (`title-length`). A verdict you would say aloud.
- **Read alone** (a pre-read, a forwarded deck, a figure): the claim as one sentence of 3–14 words.
- **Web section head:** 2–5 plain words naming what the reader gets.
<!-- /generated -->

**Presented slide: a short verdict you'd say aloud.** With a speaker in the room, a sentence title
and a lede are a script: the room reads ahead while the speaker recites it. A short verdict is the
cue, the points carry the numbers, and the speaker says why it matters
([talks and slides](writing/talks.md#titles)).

```uipack-demo pair-presented wide
Don't: an eyebrow, a sentence headline and a lede. Do: a short verdict over two fragments that carry the numbers.
```

**Read alone, a figure or the web: the claim as a sentence.** Forwarded without you, a label or a
bare verdict says nothing. Write the real conclusion as one sentence; on a web page, the hero says
what changed for the reader and each section head names what they get
([read-alone documents](writing/documents.md#titles)).

```uipack-demo pair-read-alone wide
Don't: a bare label ("Results"). Do: the conclusion as one sentence.
```

**A headline over budget.** Length is the one leak no style can fix, so it is caught in the words,
before any style is chosen. Fix it with a short title and the window and cause moved into points;
shrinking the font would break the budget in every other layout
([slot budgets](writing/general.md#slot-budgets)).

```uipack-demo pair-over-budget wide
Don't: a review result as one long headline, the words past the budget marked. Do: a short title with the window and cause as points.
```

## Paired examples

**Labels, not sentences, in the drawing.** A label that wraps is doing two jobs: a short label in
the box, the sentence in the caption or the selection note
([figure labels](writing/figures.md#nodes-and-labels)).

```uipack-demo pair-labels wide
Don't: a node whose label wraps into a sentence. Do: a one-word label with a mono sub-label for its value.
```

**One accent per unit.** Two filled buttons compete; the accent marks the one action the page is
for ([web copy, one goal](writing/web.md#one-goal)).

```uipack-demo pair-accent wide
Don't: two filled buttons side by side. Do: one filled button and one secondary.
```

**Glow only for selection.** An ambient glow says everything is selected. Mark the one selected
card with a ring, a tick and the word, so it reads without colour; the rest stay plain
([style](style.md)).

```uipack-demo pair-glow wide
Don't: one card in an ambient glow. Do: three cards, one selected with a ring, a tick and the word.
```

## Slide text that reads as generated

Any one of these is fine now and then; on every slide it reads as a template. The full list is in
[general rules, AI tells](writing/general.md#ai-tells), and `ai-tells` flags the first two.

| Tell | Looks like | Instead |
| --- | --- | --- |
| "X, not Y" on every slide | decided in one meeting, not three | State the fact (3 meetings → 1) |
| Matched number pairs | one meeting, not three · one index replaced five | One number per point, with its baseline |
| The same shape on every slide | eyebrow, sentence headline, lede, ten times | Mix labels, verdicts and the odd question |
| A one-word caps eyebrow | REVIEWS, SEARCH | Drop it; the title names the topic |

## Generic AI-landing tropes

Each makes a page read as generated. Check a page against the list before it ships. Where the
right column names a value, it is taken from the [Technical spec](../specs/technical.md); another
site's spec sets its own.

| Trope | Instead |
| --- | --- |
| A purple or indigo accent on a grey page | The spec's one accent; never a second |
| Inter or Roboto everywhere | The spec's own faces (Technical: IBM Plex Sans 600 headings, IBM Plex Mono labels) |
| A centred hero, one CTA, three icon cards | The product's real output in the first screen, straight after the headline |
| Rounded everything | The spec's one container radius (Technical: square corners) |
| A floating dashboard screenshot as the hero | The product's real output drawn from data, the mechanism figure or the demo |
| A fashionable editorial serif by default | The spec's display face |
| Glassy blobs and ambient glow | Glow means selection; grain and aurora are opt-in, one per viewport |
| Emoji as icons | Shape-coded flow tokens and the icon set |
| Gradient text and gradient buttons | One flat accent on one thing |
