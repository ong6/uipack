# Web and landing copy

How to write a product, launch or announcement page: the goal, the hero, section heads, proof and
the FAQ. It adds to the [general writing rules](general.md). The layout is
[Landing layout](../layout/landing.md); the build steps are the [landing recipe](../../recipes/landing.md).

## Title form

The site's spec chooses the form of its hero headline and section heads (Technical: plain names of
a few words; [its writing style](../../specs/technical.md#writing-style)). The core ceilings:

<!-- generated:title-forms -->
- **Short spoken verdict** (a speaker in the room): the check stops at 6 words (`title-length`, `presented` mode).
- **Full-sentence claim** (read without its author: a pre-read, a forwarded deck, a figure): one sentence; the check stops at 14 words (`read-alone` mode).
- **Plain name** (a web section head, a docs heading): names what the reader gets, never a sentence; held to the headline slot's 14 words, not linted on the web yet.
<!-- /generated -->

## One goal

One primary action, the reader's own next step, placed in the hero, the nav and the closing band.
When the facts' real action is an internal approval, that ask stays in the deck: budgets, pending
approvals and approvers' names stay off the page.

## The hero

- The headline says what changed for the reader, in their words and with its scope ("on
  Android"); the subhead says how. A demo proves it within 15 seconds.
- An announcement page reads as one: "Pull requests check in about 7 minutes", never a metric
  label ("CI: median 18 → 7").
- No method sentence in a customer headline or subhead.

## Sections

- Heads name what the reader gets, in the form the spec chose ("Fewer crashes", "A slightly slower
  start", "Android only"), never the section's kind ("Features") and never a sentence crammed with
  numbers.
- The supporting line carries the number, once.
- Body copy is short: one idea per paragraph, at most three sentences.

## The reader's words

- No internal metrics (conversion rates, ticket counts) or tool names on a customer page: say what
  the customer notices ("cards that used to go missing now show up"; "tickets fell from 40 to 9"
  stays in the internal deck).
- A source becomes what it is to the reader ("our crash reports, 30 days before and after").
- Keep the trade-offs the reader will feel, as their own section (a higher error rate, a slower
  start).

## FAQ

Answer real objections in the asker's words. The answers and their structured data share one
source (`FAQ`, see [Web discoverability](../../web-discoverability.md)).

The [example landing page](../../examples/landing-page.md) is written to these rules; the full
numbered web rules, with their sources, are [Web principles](../../web-principles.md).
