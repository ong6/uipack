---
name: uipack-copy
description: >-
  Write or tighten the words of a UiPack piece: slide titles, points and speaker notes, a
  read-alone deck or document, landing and web copy, figure labels and captions. Use for "write
  the copy", "fix these slide titles", "make it not sound AI-generated", "tighten the hero",
  "caption this figure", or the content step of a page or deck. Not for emails or meeting briefs
  (their own skills), or layout and styling (uipack-page).
---

# Write the copy

Paths are relative to the uipack root: `node_modules/uipack/` in a site, or a uipack clone.

Words are typed data with no colour, face or position in them. Write them into the content object
(a `DeckSlide[]`, a preset spec, a page content object) before any layout.

## Pick the kind, then read only its section

| Kind | Read |
| --- | --- |
| Talk or presented slides | [Writing, slides](../../docs/system/writing/talks.md) and [deck storytelling](../../docs/deck-storytelling.md) |
| Read-alone document or deck (pre-read, readout) | The same sections, `read-alone` mode: full-sentence titles, full notes |
| Web and landing copy | [Writing, web](../../docs/system/writing/web.md) and [web principles](../../docs/web-principles.md) |
| Figure labels and captions | [Writing, diagrams](../../docs/system/writing/figures.md) |
| Every kind | [Rules for every kind](../../docs/system/writing/general.md#rules-for-every-kind) and the [slot budgets](../../docs/system/writing/general.md#slot-budgets) |

The site's spec (`STYLE.md`, `## Writing style`) sets the tone and register, the title form for
each page type (short spoken verdict, full-sentence claim or plain name), copy density, house words
and any budget it tightens: read it before drafting. The rules above and the
[core writing rules](../../docs/system/writing/README.md#core-and-site) hold on every site, and no
spec loosens a [slot ceiling](../../docs/system/writing/general.md#slot-budgets). A deck takes its
site's writing style for talks. Figure labels follow the Blueprint look's lengths on every site.

## Non-negotiables

- Only the facts you were given. A missing fact is left out, never filled in or announced; finished
  copy never shows `TODO`. A docs code example is the exception that keeps its shape: a missing
  name becomes a marked placeholder (`<cursor>`, `YOUR_API_KEY`), and the page says so once
  ([documentation pages](../../docs/system/writing/documents.md#documentation-pages)).
- A before/after says "after", "since" or "went from… to", never a cause.
- Copy qualifiers exactly ("up to 15 minutes", "about").
- The reader's words: no internal metrics or tool names on public pages.
- Each fact once per piece.

## Check

Decks: `lintDeck(slides, { mode })` from `uipack/deck` and fix every finding. Then reread as the
person who must act on it against general rule 9's checklist in
[general.md](../../docs/system/writing/general.md#rules-for-every-kind) and the spec's writing
style, and revise once.
