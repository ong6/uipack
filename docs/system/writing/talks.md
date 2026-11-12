# Talks and slides

How to write a deck you present: titles, points, speaker cues, order and the ask. It adds to the
[general writing rules](general.md). A deck that travels without you is written read-alone
([documents.md](documents.md#read-alone-decks)). The full storytelling guide is
[Deck storytelling](../../deck-storytelling.md); `lintDeck` checks both.

## Title form and lengths

The site's spec chooses the title form for its decks (Technical: a short spoken verdict when
presented, a full-sentence claim read alone; [its writing style](../../specs/technical.md#writing-style)).
The core ceilings:

<!-- generated:title-forms -->
- **Short spoken verdict** (a speaker in the room): the check stops at 6 words (`title-length`, `presented` mode).
- **Full-sentence claim** (read without its author: a pre-read, a forwarded deck, a figure): one sentence; the check stops at 14 words (`read-alone` mode).
- **Plain name** (a web section head, a docs heading): names what the reader gets, never a sentence; held to the headline slot's 14 words, not linted on the web yet.
<!-- /generated -->

Points, cues and every other slot are in the [slot budgets](general.md#slot-budgets); a spec may
tighten them, never loosen them.

## Titles

- Short and said aloud, in varied forms: "Android crashes down by two thirds", "Starts got a bit
  slower", "We need a German model".
- "Topic: a → b" ("Start time: 1.4 → 1.6 s") on one or two slides at most. Writers copy it as the
  default shape when the examples lean on it.
- Bare labels ("Crash rate") only on agenda, section and mechanism slides (`title-claim`).
- A question only about something not yet known ("Will the cache hold?"), never about a measured
  fact.
- No eyebrow and no lede by default (a spec may turn eyebrows on for its decks). Add a lede only for
  a caveat that would change the decision and doesn't fit as a point.

## Points

Fragments that carry the numbers: a number with its baseline ("p95: 412 ms → 198 ms"), a cue
("Only change: the answer moved to slide 1"), a caveat that must stay on screen ("Not proof of
cause"). An answer, evidence, problem or recommendation slide quantifies its claim in the title or
a point; a plan slide carries a date or a number. The body proves the title without repeating it.

An evidence slide pairs a short spoken headline with one piece of evidence: a chart, a number with
its baseline (the fact archetype) or a screenshot. The headline says what it shows; the evidence
does the proving.

## Speaker cues

`say` holds cues that add what the slide can't hold: why it matters, what follows for this
audience, the trade-off. Never the slide again (`notes-echo`): "Cost: one engineer for three
weeks" under a slide that says so gives the speaker nothing; "If no, Spanish and French meet the
price change on the old bot" does. A stage direction alone ("Point at the 9") goes in `delivery`;
`next` is the bridge, a few words, only where the link isn't obvious. The talk's length comes
from the slide count, about a minute a slide, not from the notes.

## Order

- **Answer first.** Slide one names the outcome ("Search got twice as fast since March"); slide
  two names the system, as the reason.
- **Ghost deck.** The titles alone, in order, outline the argument (`storylineOf`).
- **The facts set the length.** When the input can't fill a beat (no options, no milestones),
  merge or drop it; don't invent content and don't announce the gap.
- Each slide's role orders the deck through a storyline template; the six are in the
  [deck recipe](../../recipes/deck-slide.md#storylines).

## The ask

End on action and object ("approve Spanish and French"; a bare "approve by 15 January" has no
object), its cost when the facts give one, a named owner (a role or team) and a calendar date with
the year. Add what a no means only when the facts say ("so it ships in spring": later misses
spring). Never "Questions?".

## Example

The same slide as presented and as read alone:

```text
Presented                              Read-alone
Search: twice as fast since March      Search answers in 198 ms at p95 after five indexes became one
• p95 198 ms, half of March            • March: 410 ms
• 5 indexes → 1                        • Source: the search latency dashboard, October
```

Paired do and don't examples, drawn live, are on [Do and don't](../do-and-dont.md).
