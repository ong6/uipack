# Writing: what it says

Each website has its own writing style, set in its [spec](../../specs/README.md): its tone, the form
its titles take on each page type, how dense its copy runs, its house words, and any budget it
tightens. This folder holds what every site keeps (the honesty and clarity rules, and the ceilings
no spec may loosen), split by the kind of text you are writing. Read the site's spec, then the
general rules, then the file for your kind.

| Kind | Read it when you write | File |
| --- | --- | --- |
| General rules | Anything: they hold for every kind below | [general.md](general.md) |
| Talks and slides | A deck you present, its points and speaker cues | [talks.md](talks.md) |
| Read-alone documents | A pre-read, a forwarded deck, a report, docs, an article or a blog post | [documents.md](documents.md) |
| Web and landing copy | A product, launch or announcement page | [web.md](web.md) |
| Figure labels and captions | A diagram, chart, motion beat or 3D stop | [figures.md](figures.md) |

Emails and meeting briefs follow their own skills and link back to the house voice; they are not
a kind here.

## Core and site

| Every site keeps (core) | Each site's spec sets (`## Writing style`) |
| --- | --- |
| **No invented facts**: only the given facts; a gap is left out, never filled or announced ([general rule 2](general.md#rules-for-every-kind)) | **Tone and register**: how formal, how warm, first person or not |
| **Answer first**: the outcome before the reasons, on a slide, a page or a section | **Title form**, per page type: a short spoken verdict, a full-sentence claim or a plain name (below) |
| **One claim per unit**: a figure, slide, section or stop makes one point | **Copy density**: paragraph length, how much a section says, bullets or prose |
| **Numbers with sources**: each number keeps its own words and its own source; before and after is never a cause | **House words**: words to prefer and to avoid, and how the product is named |
| **No AI tells** ([the table](general.md#ai-tells)) | **Budgets**: tighter aims or limits than the ceilings below, never looser |
| **Accessible language**: plain names in the reader's words, no internal codes, link text that says where it goes, alt text and captions that state the claim | |

A spec's writing style never loosens a core rule: a casual tone still answers first, a dense site
still keeps one claim per unit, and a house word never replaces a number's own qualifier.

## Title forms

A spec chooses one form per page type (a site may present its talks with verdicts and write its
docs with sentences). Each form has a core ceiling, which the linter enforces:

<!-- generated:title-forms -->
- **Short spoken verdict** (a speaker in the room): the check stops at 6 words (`title-length`, `presented` mode).
- **Full-sentence claim** (read without its author: a pre-read, a forwarded deck, a figure): one sentence; the check stops at 14 words (`read-alone` mode).
- **Plain name** (a web section head, a docs heading): names what the reader gets, never a sentence; held to the headline slot's 14 words, not linted on the web yet.
<!-- /generated -->

## Ceilings and Technical's defaults

The slot budgets in `src/deck/budgets.ts` (`TITLE_WORDS`, `SLOT_BUDGETS`) are the ceilings every
site keeps: past them a slot stops reading at a glance in any voice. The aims in the same file
(`WORD_GUIDES`: a presented title of a few words, a two-word label) are
[Technical's](../../specs/technical.md#writing-style) defaults, and another site's spec states its
own. Every slot's ceiling is in [general.md, Slot budgets](general.md#slot-budgets).

TODO: `lintDeck` reads the code's budgets and takes no per-site budget yet
(`LintOptions` in `src/deck/storyline/rules.ts`), so a spec's tighter budget is held by review, not
by the linter.

## How to use these files

1. Read the site's spec, `## Writing style`: its tone, title forms, density, house words and budgets.
2. Write the claim first: one sentence the reader should conclude ([general rule 1](general.md#rules-for-every-kind)).
3. Draft in your kind's file.
4. Reread as the audience and revise once, with the checklist in
   [general rule 9](general.md#rules-for-every-kind).
5. For slides, run `lintDeck(slides, { mode })`; its rules are listed in the
   [deck recipe](../../recipes/deck-slide.md#checks-before-you-present).

Where the words sit on the page is layout's job: see [Layout](../layout/README.md) and the
[recipes](../../recipes/README.md).
