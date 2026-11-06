# Check a deck before you present it

An example text page: a short documentation page written to the
[read-alone rules](../system/writing/documents.md) and laid out by the
[documentation recipe](../recipes/documentation.md). Its subject is real: how to run `lintDeck` on
a `uipack/deck` deck, and what to do with what it finds.

## The two modes

Lint a deck in the mode it will be read in. The title lengths each mode allows, from the code:

<!-- generated:headline-rule -->
- **Presented** (a speaker in the room): aim for 2–5 words; the check stops at 6 (`title-length`). A verdict you would say aloud.
- **Read alone** (a pre-read, a forwarded deck, a figure): the claim as one sentence of 3–14 words.
- **Web section head:** 2–5 plain words naming what the reader gets.
<!-- /generated -->

| Mode | Use it when | Notes are |
| --- | --- | --- |
| `presented` (default) | You give the talk and the room hears you | Cues that add what the slide can't hold |
| `read-alone` | The deck travels without you: a pre-read, a forwarded deck | The talk track in full sentences |

## Run the check

Pass the slides and the mode. Each finding names its rule, its severity and the slide:

```ts
import { lintDeck } from "uipack/deck";

const findings = lintDeck(slides, { mode: "presented" });
for (const f of findings) console.log(f.severity, f.rule, f.slideId ?? "deck", f.message);
```

In the player, `lint={{ mode: "presented" }}` lists the same findings in the overview's Storyline
tab while you write. Remove it before you present.

## Read the findings

- An **error** stops the deck from making sense: no title, a duplicate slide id, a content slide
  titled like a topic. Fix every one.
- A **warning** is a rule the deck breaks: a title over its length, notes that repeat their slide,
  an ask with no owner or date. Fix it, or know why it stays.
- A **tip** is worth a second look: a number with no source in the notes, a stage direction in
  `say`. It can stay when the input gave nothing more.

Every rule, with what it checks, is listed in the
[deck recipe](../recipes/deck-slide.md#checks-before-you-present).

## Check one line

The same budget check runs on a single string with `slotProblems(slot, text)`. Try a headline or
a point:

```uipack-demo budget-checker
Pick a slot and type: the live verdict from slotProblems, the same check lintDeck runs.
```

## What the check can't see

The checks read the shape of the words, not whether they are true. After a clean run, reread the
deck as the person who must act on it, against the checklist in
[general rule 9](../system/writing/general.md#rules-for-every-kind), and read the titles alone, in
order, to hear the argument (`storylineOf`).

## Related

- [Talks and slides](../system/writing/talks.md): how to write each slide.
- [Deck slide layout](../system/layout/deck-slide.md): the regions and archetypes.
- [Deck storytelling](../deck-storytelling.md): the storylines and why the rules exist.
