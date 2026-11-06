# Writing: read-alone documents

How to write anything read without its author in the room: a pre-read, a forwarded deck, a
report, product documentation, an article or a blog post. It adds to the
[general rules](general.md). The layout for these pages is
[Documentation and article](../layout/documentation.md).

## Titles

<!-- generated:headline-rule -->
- **Presented** (a speaker in the room): aim for 2–5 words; the check stops at 6 (`title-length`). A verdict you would say aloud.
- **Read alone** (a pre-read, a forwarded deck, a figure): the claim as one sentence of 3–14 words.
- **Web section head:** 2–5 plain words naming what the reader gets.
<!-- /generated -->

Read in order, the titles and headings tell the argument. A sentence title is only as good as the
conclusion it states: the Boeing slide NASA saw before Columbia was titled "Review of Test Data
Indicates Conservatism for Tile Penetration"; the caveat that decided it (the foam was 1,920 cubic
inches, the test 3) was its last, smallest bullet. An evidence or cost title says what the number
means for the decision, from the given facts ("Moving the last two regions costs one engineer for
six weeks").

## Body

- Full sentences. Length follows the facts; never pad.
- One idea per paragraph, at most three sentences on a page meant to be scanned.
- Caveats sit where the [general rules](general.md#rules-for-every-kind) put them: a source line
  or footnote, and the before/after sentence once.
- The first line of a page says what the page is for, so a reader (or an agent) who opens it cold
  knows whether to keep reading.

## Read-alone decks

A deck that goes out without you keeps the slide shape but writes it out:

- Each title is the real conclusion as one sentence; read in order they are the argument.
- Points, a chart or a table prove the title.
- `say` is the talk track in full sentences. Notes explain; they never pad.

<!-- generated:talk-pace -->
- **Pace:** about 135 words a minute; `talk-time` times the track at that pace against the deck's `minutes`.
- **A slide:** about a minute when presented, so about 135 words of track when read alone.
<!-- /generated -->

- Lint it with `lintDeck(slides, { mode: "read-alone" })`.

## Documentation pages

- One topic per file, short enough to read whole.
- The values or options table near the top, then the detail.
- Headings a reader can jump to: plain names ("Install", "Props", "Keyboard"), never "Overview of
  the various options".
- Code and names in `code` style; every example runs as written.

## Articles and blog posts

Blog-style prose follows the owner's house voice, which lives in the private `write-a-blog` skill
(`references/house-voice.md`); these public rules stay generic. Before writing, choose one finding,
the three to five numbers that carry it and an order that lands. Prefer paragraphs to bullets, add
headings only past about 1,500 words, and stop at the last fact.

An example page written to these rules is the [example text page](../../examples/text-page.md).
