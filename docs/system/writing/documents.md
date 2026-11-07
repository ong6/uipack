# Writing: read-alone documents

How to write anything read without its author in the room: a pre-read, a forwarded deck, a
report, product documentation, an article or a blog post. It adds to the
[general rules](general.md). The layout for these pages is
[Documentation and article](../layout/documentation.md).

## Titles

The site's spec chooses the title form for each page type; a read-alone piece usually takes the
full-sentence claim. The core ceilings:

<!-- generated:title-forms -->
- **Short spoken verdict** (a speaker in the room): the check stops at 6 words (`title-length`, `presented` mode).
- **Full-sentence claim** (read without its author: a pre-read, a forwarded deck, a figure): one sentence; the check stops at 14 words (`read-alone` mode).
- **Plain name** (a web section head, a docs heading): names what the reader gets, never a sentence; held to the headline slot's 14 words, not linted on the web yet.
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
- Code and names in `code` style.
- Every task the page covers has a copyable example: the request (or call) and what comes back.
  A reader copies the example before reading the prose, so a section that explains a task without
  one is unfinished, even when the input is thin.
- Examples use only the given names. A name or value the input doesn't give (a parameter, a
  response field, an ID, a key) is a placeholder in angle brackets or capitals (`<cursor>`,
  `<next-page field>`, `YOUR_API_KEY`), and the text says so once near the first one ("Values in
  angle brackets are placeholders: the API reference names them"). A placeholder keeps the
  example's shape honest; an invented name that looks real (`next_cursor`, `st_8f2`) presents a
  guess as an API fact. Never add a header, field or format the input doesn't give to make an
  example look complete.
- Apart from its placeholders, an example runs as written: a reader who fills them in gets the
  response shown.

## Articles and blog posts

Blog-style prose follows the blog's own writing style: its spec's `## Writing style` sets the tone
and house words (the owner's blog voice lives in the private `write-a-blog` skill,
`references/house-voice.md`, which that spec points to); these public rules stay generic. Before writing, choose one finding,
the three to five numbers that carry it and an order that lands. Prefer paragraphs to bullets, add
headings only past about 1,500 words, and stop at the last fact.

An example page written to these rules is the [example text page](../../examples/text-page.md).
