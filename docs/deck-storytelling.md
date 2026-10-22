# Deck storytelling: content and flow for internal decks

The deck player makes slides move well. This guide covers what they say and in what order. Inside a company a deck is how work gets seen: it's presented once and then forwarded, skimmed and quoted. It has to make one point clearly, both in the room and in an inbox.

The code lives in [`src/deck/storyline.ts`](../src/deck/storyline.ts): slide roles, six storyline templates, `lintDeck` and `storylineOf`. Everything there is plain data and pure functions.

## What makes an internal deck land

| Principle | What it means | Quick test |
|---|---|---|
| **Answer first** | Open with the conclusion: the status, the recommendation or the thesis (Minto's pyramid). The rest of the deck supports it. | If the meeting ended after slide two, would they know the point? |
| **Slide one names the outcome, not the system** | Leadership funds results. "Search got twice as fast and cheaper to run" beats "The new caching tier". Name the system on slide two, as the reason. | Would a director who has never heard of the system repeat slide one to their boss? |
| **Specific, not upbeat** | An answer, evidence, problem or recommendation title quantifies its claim: a number with what it measures, a multiple ("twice", "a third"), a number word with its unit ("three weeks", "one engineer") or two quantities compared ("one meeting, not three"). "In a good place", "two teams worked hard", "no regressions and lots of wins" and a product version ("Kafka 3") could describe any quarter. A plan title carries a date or a number. | Could the same title appear in last quarter's deck? Then it says nothing. |
| **Action titles** | Every title is a full claim ("Index freshness fell from 40 to 6 minutes"), not a topic ("Results"). 3–14 words. | Does the title say what to conclude? |
| **Ghost deck** | Read only the titles, in order. They should tell the whole argument. | Run `storylineOf`; does it read as a story? |
| **One idea per slide** | One claim, and a body that proves it. Two claims means two slides. | Can you state the slide in one sentence? |
| **Evidence with sources** | Every number has a baseline, a window and a source: on the slide when it changes the decision, otherwise in the notes. | "Where's that from?" has an answer. |
| **A specific ask** | End on a decision or action, a named owner (a team or role: "platform leads", "the payments team", "VP Eng", an @handle; not "we", "the team", a first name or "owner TBD") and a firm calendar date ("next quarter", "Monday-ish" and "next Monday maybe" are not). Not "Questions?" | Could someone act on it tomorrow, and would they know it's theirs? |
| **Design serves the claim** | The dominant visual element is the evidence for the title. Cut decoration, logos and anything the title doesn't need. | Cover the title: does the visual still point at it? |

For a decision deck, use SCQA: **S**ituation (what the room accepts), **C**omplication (what changed), **Q**uestion (what to do), **A**nswer (the recommendation). With an exec audience, put the A first and let S and C follow as support.

## Slide roles

Tag each slide with the job it does. The linter and the ghost deck read these tags.

| Role | Answers | Its job |
|---|---|---|
| `cover` | What is this? | States the outcome the talk is about, in business terms ("Search got twice as fast"), not the system's name. |
| `answer` | What's the point? | The governing thought in one sentence. |
| `context` | Where are we? | The situation everyone already agrees with. One slide. |
| `problem` | What changed or went wrong? | The complication, with a number, and why it matters now. |
| `evidence` | Why should I believe it? | One finding: value, baseline, window, source. |
| `mechanism` | How does it work? | The system or the cause, from overview into one part. |
| `option` | What else could we do? | Real alternatives, including doing nothing, on the same criteria. |
| `recommendation` | Which one, and what does it cost? | The pick, why it wins, the trade-off accepted. |
| `plan` | What happens next? | Milestones, cost, how we'll know it worked. |
| `risk` | What could go wrong? | Top risk, mitigation, and the tripwire for reversing. |
| `ask` | What do you need from me? | Decision or action, owner, date. |
| `demo` | Show me. | The real thing, one rehearsed path, with a fallback. |
| `appendix` | Where's the detail? | Backup for questions and async readers. Not presented. |

`evidence`, `mechanism`, `demo` and `appendix` may repeat back to back. Any other role appearing twice in a row usually means two slides should merge.

## The six storylines

Each template is an ordered list of beats (`role`, `purpose`, `titlePattern`, `example`, `guidance`, and sometimes a suggested `move`), plus `remember`: what leadership should be able to repeat a week later. Draft that line first; slide one and the ask should carry it. `templateOutline(id)` turns a template into a scaffold deck. The example titles below describe generic projects; the numbers are illustrative.

### Project update / results (5–8 slides, 5–10 min)

**What leadership remembers:** whether it's on track, the one number that proves it, and what you need from them.

| # | Role | Ghost-deck title |
|---|---|---|
| 1 | answer | Search indexing migration is on track: 70% of traffic moved, no regressions |
| 2 | evidence | Index freshness improved from 40 minutes to 6 against a 10-minute goal |
| 3 | evidence | Four of six milestones are done; backfill slipped two weeks on quota |
| 4 | risk *(optional)* | Shard rebalancing could delay cutover; a dry run on 12 May will tell us |
| 5 | plan | Next: full cutover by 30 May, then the old cluster is retired in June |
| 6 | ask | We need Platform leads to approve a two-week schema freeze from 20 May |

Put the status word first. If the project is at risk, say so on slide one. With no asks, end on "No asks; next update on <date>".

### Proposal / decision request (6–9 slides, 8–15 min)

**What leadership remembers:** the choice, what it costs, what it returns, and the date they have to decide by.

| # | Role | Ghost-deck title |
|---|---|---|
| 1 | answer | Move image resizing to a queue to stop upload timeouts; we need one engineer |
| 2 | context | Uploads resize every image inline before the request returns |
| 3 | problem | Large uploads time out 4% of the time, and volume doubles by Q4 |
| 4 | option | Three options: bigger servers, a resize queue, or doing nothing |
| 5 | recommendation | A queue ends timeouts; thumbnails arrive about 5 seconds later |
| 6 | plan | Six engineer-weeks; done when upload timeouts drop below 0.1% |
| 7 | risk *(optional)* | If queue lag passes one minute, we fall back to inline resizing |
| 8 | ask | Platform leads: decide by 14 March so the work is staffed in Q2 |

Compare the options on one slide using the same criteria, and always include "do nothing". Naming what the recommendation costs is what makes it credible.

### Technical deep dive (7–12 slides, 12–25 min)

**What leadership remembers:** one idea about how the system works, the number that shows it works, and the trade-off it makes.

| # | Role | Move | Ghost-deck title |
|---|---|---|---|
| 1 | answer | advance | The rate limiter adds 0.2 ms by deciding locally and syncing counts later |
| 2 | problem | advance | A central counter adds a 2 ms network hop to every request |
| 3 | mechanism | advance | Three parts: a local bucket, a sync loop and a global budget |
| 4 | mechanism | **zoom** | Each local bucket refills from its share of the global budget |
| 5 | mechanism *(optional)* | **morph** | A burst drains one bucket while the others keep serving |
| 6 | evidence | advance | Load tests show 0.2 ms added latency and 3% overshoot at peak |
| 7 | option | advance | We accept brief overshoot in exchange for no extra network hop |
| 8 | plan *(optional)* | advance | Next: per-tenant budgets in Q3; fairness under bursts is still open |
| 9 | ask | advance | Storage team: review the sync design doc by Friday; I'll fold in every comment |

This is the one template that doesn't require answer first: a teaching talk may build up to its idea. Still state the thesis on slide one; engineers follow the mechanism better when they know where it leads.

### Launch / demo (5–8 slides, 5–12 min)

**What leadership remembers:** what users can do now that they couldn't before, the early result, and who switches it on next.

| # | Role | Move | Ghost-deck title |
|---|---|---|---|
| 1 | answer | advance | Support agents can now issue refunds in one click instead of a two-day ticket |
| 2 | problem | advance | Refunds took two days because every one needed an engineer |
| 3 | demo | **morph** | Watch an agent refund a duplicate charge in under a minute |
| 4 | mechanism *(optional)* | advance | Refunds over an agent's limit still route to a lead for approval |
| 5 | evidence | advance | In the first two weeks, 1,200 refunds skipped the engineering queue |
| 6 | plan | advance | All support regions get it by 1 June; partial refunds come next |
| 7 | ask | advance | Team leads: switch your queues on by 15 May and send feedback to me |

Rehearse one path through the demo and keep a recording ready in case it fails. If a result hasn't been measured yet, say so.

### Postmortem / incident review (6–9 slides, 8–15 min)

**What leadership remembers:** the impact in one number, the cause in one sentence, and the fix that stops it happening again.

| # | Role | Move | Ghost-deck title |
|---|---|---|---|
| 1 | answer | advance | A bad config push took checkout down for 42 minutes; fixed and guarded |
| 2 | evidence | advance | About 18,000 orders failed; most customers retried within an hour |
| 3 | evidence | advance | Alerts fired after 9 minutes; rollback took 25 because the tool was slow |
| 4 | mechanism | **zoom** | A missing default let one bad value disable every payment provider |
| 5 | problem | advance | Config changes skipped canary, so the bad value reached all 14 regions at once |
| 6 | plan | advance | Three fixes: canary config pushes, schema defaults and faster rollback by June |
| 7 | ask | advance | Prioritise the canary work in Q3 planning; Release Engineering owns it |

Keep it blameless: write about systems and safeguards, not people. The gaps in the timeline are usually the real findings. A few fixes, each with an owner and a date, beat a long list nobody tracks.

### Quarterly / performance review highlights (5–8 slides, 5–10 min)

**What leadership remembers:** two or three outcomes with numbers, what other teams can now do, and the one ask.

| # | Role | Ghost-deck title |
|---|---|---|
| 1 | answer | This half we cut payment failures by a third and unblocked two launches |
| 2 | evidence | Smarter retries cut failed payments from 3% to 2% of attempts |
| 3 | evidence | Two product teams launched on the new API in three weeks, without our help |
| 4 | problem *(optional)* | The fraud-rule rewrite slipped three months; we now ship rules behind flags |
| 5 | plan | Next half: halve payout latency to support instant withdrawals |
| 6 | ask | We need the payments director to approve one more engineer by July |

Report impact, not activity. "Cut failures by a third" is impact; "worked on retries" is activity. Show one outcome per slide with its baseline and source, and say which part was yours and which was the team's. Leverage, meaning what others can now do because of your work, is what senior reviewers look for. One honest miss makes the wins believable.

## The player's three moves, used for meaning

The player has one default move and two special ones. A special move only means something because it's rare, so most slides should simply advance.

| Move | Use it when | It's a gimmick when |
|---|---|---|
| **Advance** (default) | The argument moves on to the next claim. That's nearly every slide. | Never; it's the baseline. |
| **Morph** | The *same thing* changes: before and after, a request moving through a diagram, one number becoming a row in a table, a list re-sorting. The audience tracks the object, not a new layout. | The two slides share nothing meaningful, or a title slides around for style alone. If you can't say "watch X change", don't morph. |
| **Zoom** | Going from an overview into *one part* of it: a system and then one component, a timeline and then one incident, a portfolio and then one project. Come back out afterwards (going back reverses the zoom). | The target isn't on the previous slide, you zoom two levels without returning, or you zoom into every part in turn. Zoom once or twice per talk. |

In a typical deck, about one slide in ten uses morph or zoom. The templates mark where those moves fit.

## Decks that work when forwarded

People will read your deck without you in the room. Write it so it still works:

- **Titles carry the argument.** The ghost deck should stand on its own. Put the claim in the slide's heading, not in what you say over it.
- **Notes carry the talk.** Write the `say` text in full sentences; the speaker view shows it, and readers can open it. Use `delivery` for cues and `next` for the bridge to the following slide.
- **Caveats that change the decision stay on the slide.** Exports and screenshots drop notes.
- **Every number keeps its source** where a reader can find it.
- **Appendix for depth.** Put a divider before it, so the last slide you present is the ask.
- **Slide one works alone.** It's often the only slide anyone forwards.

## The checklist `lintDeck` enforces

`lintDeck(slides, { template?, minutes?, answerFirst? })` reads `{ id, title, role?, notes?, headline?, source? }[]`. A `DeckSlide` already fits. When the overview `title` is a short name, pass the on-slide claim as `headline`.

| Rule | Severity | Check |
|---|---|---|
| `deck-empty` | error | The deck has at least one slide. |
| `duplicate-id` | error | Slide IDs are unique (they appear in URLs and presenter sync). |
| `title-present` | error | Every slide has a title. |
| `title-claim` | error / warn / tip | The title is a claim of three or more words, not a topic label like "Background" or "Agenda". A short label-like phrase warns, and so does a title of any length that opens like a topic: "Overview of…", "How … works", "Status…", "Some of…", "Introduction to…", "Update on…", "Thanks…", "Questions…". A "Label: claim" title gets a tip; on a cover every finding is softened to a tip. |
| `title-length` | warn | The title has 14 words or fewer. |
| `title-specific` | warn | An `answer`, `evidence`, `problem` or `recommendation` title quantifies its claim: digits that aren't a date, quarter or version ("v2", "Kafka 3", "Python 3.12"), a multiple or fraction ("twice", "halved", "a third"), a number word with its unit ("three weeks", "nine months", "one engineer") or two quantities compared ("one meeting, not three", "nine in ten", "from 40 to 6 minutes"). A bare count, "no regressions" and proper nouns don't: "Two teams worked hard and things are better", "One big improvement in search quality", "No regressions and lots of wins" and "The new Kafka pipeline is much better than before" fail. A `plan` title needs a date or a number ("We will keep improving things going forward" fails). |
| `one-idea` | tip | The title is a single sentence. |
| `notes-present` | warn | Every presented slide has a `say` talk track. |
| `number-source` | warn | A number in a title (dates, quarters and versions excluded) names its source: a named artifact in the notes (a dashboard, query, test, survey, report, benchmark, log, experiment, trace or forecast with a name in front, "the search latency dashboard", "load test 12", "the Q3 user survey", or a name after it, "benchmark suite"; management accounts, a cost model or a URL), or the slide's `source`. Bare and hedged mentions don't count: "I measured this from my laptop once", "Per the test I ran once on staging, trust me", "From a report someone mentioned", "Finance said so in the dashboard chat". Plan and ask slides are exempt, because they hold targets. |
| `roles-missing` | warn | No slide has a role. Roles are then read from the titles (slide one is the answer if it states a quantity or an outcome, else the cover; "Next steps" is the plan; a last slide asking for a decision with an owner or a date is the ask) and the answer-first, outcome-first, closing-ask and ask-concrete checks run on them. A deck closing on "Questions?", "Thank you" or "Q&A" hears that its ask is missing. Role rhythm needs real roles. |
| `answer-first` | error / warn | An `answer` or `recommendation` slide exists and appears within the first three content slides. Off for the deep-dive template. |
| `outcome-first` | tip | Slide one's title names an outcome (a number, a comparison, or a word like faster, cheaper, cut, saved, unblocked, on track), not just the system. Off where `answer-first` is off. |
| `closing-ask` | error / warn | An `ask` slide exists and is the last presented slide. |
| `ask-concrete` | warn | The ask, title plus notes, names an action, an owner and a date. The owner is a role ("Platform leads", "the payments director", "VP Eng", "Dana, our platform lead"), a named team ("Storage team", "the payments team"), "<Name> owns it" or an @handle; "we", "you", "the team", a bare capitalised word ("Please continue to Support this effort", "Thanks Bob"), a placeholder ("owner TBD", "Leads to approve") and "lead" as a verb ("We will lead the review") don't count. The date is on a calendar and said firmly: a month, a weekday, a numeric date, Q3 or H2, or today. "Next quarter", "soon", "going forward", "Monday-ish" and "Next Monday maybe" don't count. |
| `role-repeat` | warn | No two adjacent slides share a role, except evidence, mechanism, demo and appendix. |
| `deck-length` | warn / tip | About one to two minutes per presented slide; with only a template given, the slide count falls inside its range. |
| `template-beats` | warn | With a `template`, every beat it doesn't mark optional has a slide in that role: a decision request without an options slide, or a postmortem without its plan, hears which beat is missing. |
| `talk-time` | warn | The `say` text fits the time budget at 135 words a minute, and, once every slide has a track, covers at least half of it (the `minutes` given, else the template's shortest length). A thin track leaves the speaker view's clock and a forwarded deck with nothing to go on. |

These checks are heuristics. They catch a missing ask or a topic-label title, but they can't tell whether a claim is true. Rehearse the deck out loud and have someone else read the ghost deck cold.

```ts
import { lintDeck, storylineOf, templateOutline } from "uipack/deck";

const scaffold = templateOutline("decision-request"); // rewrite each title with your facts
const findings = lintDeck(slides, { template: "decision-request", minutes: 10 });
const ghost = storylineOf(slides); // [{ number, id, title, role, roleLabel, appendix }]
```

## Sources

- Barbara Minto, *The Pyramid Principle*: answer first, grouped support, SCQA.
- Consulting practice for action titles and the ghost deck, where you draft the titles before the slides.
- The [`create-fde-deck`](https://github.com/ong6/skills/tree/main/skills/create-fde-deck) skill: takeaway headlines, every number traceable, caveats that change the decision kept on the slide, a closing slide with an action, an owner and a date, and options compared on the same criteria.
