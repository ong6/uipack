# Writing: what it says

This folder holds the writing rules for anything UiPack draws, split by the kind of text you are
writing. Read the general rules first, then the file for your kind. Writing is the content layer:
typed data with no colour, face or position in it, so the same words render in any layout with
matching slots and in any style ([the system overview](../README.md)).

| Kind | Read it when you write | File |
| --- | --- | --- |
| General rules | Anything: they hold for every kind below | [general.md](general.md) |
| Talks and slides | A deck you present, its points and speaker cues | [talks.md](talks.md) |
| Read-alone documents | A pre-read, a forwarded deck, a report, docs, an article or a blog post | [documents.md](documents.md) |
| Web and landing copy | A product, launch or announcement page | [web.md](web.md) |
| Figure labels and captions | A diagram, chart, motion beat or 3D stop | [figures.md](figures.md) |

Emails and meeting briefs follow their own skills and link back to the house voice; they are not
a kind here.

## Lengths at a glance

Every length the writing files state, from `src/deck/budgets.ts` (`WORD_GUIDES`, `TITLE_WORDS`,
`SLOT_BUDGETS`). Where a check exists, the limit is what it reads; the aim is the guidance on top.

<!-- generated:word-guides -->
| Text | Length | The check |
| --- | --- | --- |
| Presented slide title | aim for 2–5 words | `title-length` stops at 6 |
| Read-alone title, figure title | 3–14 words, one sentence | `title-length` stops at 14 |
| Web section head | 2–5 words | not linted |
| Label in a drawing | 2–3 words | `slot-budget` stops at 3 |
| Slide points | 2–4 a slide, each at most 8 words | `slot-budget` |
| Speaker cues (`say`, presented) | at most 60 words | `notes-cues` |
<!-- /generated -->

The headline rule, said the same way everywhere it appears:

<!-- generated:headline-rule -->
- **Presented** (a speaker in the room): aim for 2–5 words; the check stops at 6 (`title-length`). A verdict you would say aloud.
- **Read alone** (a pre-read, a forwarded deck, a figure): the claim as one sentence of 3–14 words.
- **Web section head:** 2–5 plain words naming what the reader gets.
<!-- /generated -->

The presented title has two numbers on purpose. Writers under the trimmed rules wrote titles of
up to six words that passed the check, and no judge marked one down, so the check allows the
longest of those and the docs ask for the shorter aim. The lint message (`title-length`) says the
same thing in the same words. Every slot's hard budget is in
[general.md, Slot budgets](general.md#slot-budgets).

## How to use these files

1. Write the claim first: one sentence the reader should conclude ([general rule 1](general.md#rules-for-every-kind)).
2. Draft in your kind's file.
3. Reread as the audience and revise once, with the checklist in
   [general rule 9](general.md#rules-for-every-kind).
4. For slides, run `lintDeck(slides, { mode })`; its rules are listed in the
   [deck recipe](../../recipes/deck-slide.md#checks-before-you-present).

Where the words sit on the page is layout's job: see [Layout](../layout/README.md) and the
[recipes](../../recipes/README.md).
