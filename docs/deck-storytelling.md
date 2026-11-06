# Deck storytelling: content and flow for internal decks

The deck player makes slides move well. This guide covers what they say and in what order. Inside a company a deck is how work gets seen: it's presented, and often forwarded, skimmed and quoted afterwards. It has to make one point clearly in the room, and keep its facts when it lands in an inbox.

## Two modes: presented and read-alone

Write every deck for one of two modes, and lint it in that mode (`lintDeck(slides, { mode })`, or the player's `lint={{ mode }}`).

| | **Presented** (default) | **Read-alone** |
|---|---|---|
| When | You give it and talk freely from the slides | It travels without you: a pre-read, a forwarded deck, a consulting-style customer readout |
| Title | A verdict that sounds spoken: aim for 2–5 words; the check stops at 6 (a bare label only on agenda, section and mechanism slides) | The real conclusion as one sentence, 3–14 words |
| Body | 2–4 fragments that carry the numbers and cues, or one piece of evidence | Points, a chart or a table that proves the title |
| Eyebrow, lede | None by default | None by default |
| Notes | Cues for what the slide can't hold (why, so-what, trade-off, bridge), said in your own words | The talk track in full sentences |

The same slide, both ways:

```text
Presented                              Read-alone
Search: twice as fast since March      Search answers in 198 ms at p95 after five indexes became one
• p95 198 ms, half of March            • March: 410 ms
• 5 indexes → 1                        • Source: the search latency dashboard, October
```

Why presented is the default. Across 66 well-regarded decks and talks, the slides that suit a speaker who talks from on-slide points are a short title over a few fragments (Rich Hickey, Rob Pike, LinkedIn's Series B deck, Airbnb's pitch) or a short spoken claim over one piece of evidence (Simon Willison, Benedict Evans). None of the 26 tech talks catalogued used an eyebrow over a sentence headline over a lede. That shape writes out what the speaker would say, twice, so the speaker recites and the room reads ahead (Patrick Winston: an audience can't read and listen at once). Full-sentence action titles come from consulting decks built to be read without the presenter; that is what read-alone mode keeps them for.

The code lives behind [`src/deck/storyline.ts`](../src/deck/storyline.ts), with its parts in [`src/deck/storyline/`](../src/deck/storyline/): slide roles (`roles.ts`), six storyline templates (`templates.ts`), the rules (`rules.ts`), how titles, numbers, owners, dates and sources are read (`heuristics.ts`), the checks and `lintDeck` (`checks.ts`), and `storylineOf` (`ghost.ts`). Everything there is plain data and pure functions. A new rule is a line in `LINT_RULES` and a check in `LINT_CHECKS`.

## What makes an internal deck land

| Principle | What it means | Quick test |
|---|---|---|
| **Answer first** | Open with the conclusion: the status, the recommendation or the thesis (Minto's pyramid). The rest of the deck supports it. | If the meeting ended after slide two, would they know the point? |
| **Slide one names the outcome** | Leadership funds results. Name the outcome on slide one, such as "Search got twice as fast since March"; the system's name ("the new caching tier") goes on slide two, as the reason. | Would a director who has never heard of the system repeat slide one to their boss? |
| **Be specific** | An answer, evidence, problem or recommendation slide quantifies its claim, in the title or (presented) a point: a number with what it measures, a multiple ("twice", "a third"), a number word with its unit ("three weeks", "one engineer") or a before and after ("3 meetings → 1"). "In a good place", "two teams worked hard", "no regressions and lots of wins" and a product version ("Kafka 3") could describe any quarter. A plan slide carries a date or a number. | Could the same slide appear in last quarter's deck? Then it says nothing. |
| **Short titles you talk from** | Presented: a spoken verdict, aiming for 2–5 words with the check stopping at 6 ("Android crashes down by two thirds", "Freshness: 40 → 6 min"; the "Topic: a → b" form on one or two slides, not three), never a sentence to read out. Mix the forms; the occasional question about something not yet known ("Could cutover slip?") is welcome. A bare topic label ("Index freshness") is only for agenda, section and mechanism slides; on a content slide it makes the room wait for the point. Read-alone: the full claim, 3–14 words. Never a word that names the slide's kind ("Results", "Next steps"). | Could you say the title in your own words and point at the numbers under it? |
| **Ghost deck** | Read only the titles, in order. Presented, they outline the argument; read-alone, they tell it. | Run `storylineOf`; does it read as a story? |
| **One idea per slide, said once** | One claim, and a body that proves it without repeating the title. Two claims means two slides. Each slide adds something: slide one may preview the answer and the ask, but a later slide adds the baseline, the source or the cost, never the same line again. | Can you state the slide in one sentence, and what it adds to the one before? |
| **Evidence slides show one thing** | A short spoken headline and one piece of evidence: a chart, a number with its baseline, a screenshot (Evans, Willison). | Can you point at it while you say the claim? |
| **Evidence with sources** | Every number has a baseline, a window and a source: on the slide when it changes the decision, otherwise in the notes. Each covers only the number it was given for; sources sit in one place, the evidence slide's source line or notes, where a number given without one is listed once as "source not given"; never a neighbour's source, a `TODO` or a "still to confirm" on other slides. Qualifiers are copied exactly ("up to 15 minutes", "about 40"). Nothing goes in that the input doesn't say: no guessed causes, scopes or reassurances, and no gap stated as a fact about the team ("we haven't costed a fix"). A before/after says "after" or "since", never "lifted" or "cut", and the evidence slide's notes say once, in a plain sentence, that it compares two windows. Method and sources live in notes, captions and source lines, never as stock phrases in the prose (see [Writing](system/writing/general.md#rules-for-every-kind)). | "Where's that from?" has an answer, and it's the right one. |
| **A specific ask** | End on a decision or action with its object ("approve Spanish and French"; a bare "approve by 15 January" has no object) and, when the facts give one, its cost, on the ask slide itself; a named owner (a team or role: "platform leads", "the payments team", "VP Eng", an @handle; not "we", "the team", a first name or "owner TBD") and a firm calendar date ("next quarter", "Monday-ish" and "next Monday maybe" are not), and what happens on a no or a missed date (a stated purpose gives it: "so it ships in spring" means a later yes misses spring). Not "Questions?" | Could someone act on it tomorrow, and would they know it's theirs? |
| **Design serves the claim** | The dominant visual element is the evidence for the title. Cut decoration, logos and anything the title doesn't need, eyebrows and ledes included. | Cover the title: does the visual still point at it? |
| **Written by a person** | No "X, not Y" on every slide, no clauses balanced on a semicolon, no comparison bolted onto every claim, no tidy closing clause or kicker line ending a section, no source disclaimers in the prose, no three items where one example would do, no coined term used as if established, no three-part template repeated slide after slide ([the full list](system/writing/general.md#rules-for-every-kind)). | Read the deck aloud: does any line sound like a slogan? |

For a decision deck, use SCQA: **S**ituation (what the room accepts), **C**omplication (what changed), **Q**uestion (what to do), **A**nswer (the recommendation). With an exec audience, put the A first and let S and C follow as support.

## Slide roles

Tag each slide with the job it does. The linter and the ghost deck read these tags.

| Role | Answers | Its job |
|---|---|---|
| `cover` | What is this? | States the outcome the talk is about, in business terms ("Search: twice as fast"); the system's name comes later. |
| `answer` | What's the point? | The governing thought: a verdict title with its numbers in the points (read-alone: one sentence). |
| `context` | Where are we? | The situation everyone already agrees with. One slide. |
| `problem` | What changed or went wrong? | The complication, with a number, and why it matters now. |
| `evidence` | Why should I believe it? | One finding: value, baseline, window, source. |
| `mechanism` | How does it work? | The system or the cause, from overview into one part. |
| `option` | What else could we do? | Real alternatives, including doing nothing, on the same criteria. |
| `recommendation` | Which one, and what does it cost? | The pick, why it wins, the trade-off accepted. |
| `plan` | What happens next? | Milestones, cost, how we'll know it worked. |
| `risk` | What could go wrong? | Top risk, mitigation, and the tripwire for reversing. |
| `ask` | What do you need from me? | Decision or action and its object, cost, owner, date, and what a no means when the facts say. |
| `demo` | Show me. | The real thing, one rehearsed path, with a fallback. |
| `appendix` | Where's the detail? | Backup for questions and async readers. Not presented. |

`evidence`, `mechanism`, `demo` and `appendix` may repeat back to back. Any other role appearing twice in a row usually means two slides should merge.

## The six storylines

Each template is an ordered list of beats (`role`, `purpose`, `titlePattern`, `example` with its `points`, `readAlone`, `guidance`, and sometimes a suggested `move`), plus `remember`: what leadership should be able to repeat a week later. Draft that line first; slide one and the ask should carry it. `templateOutline(id)` turns a template into a scaffold deck of short titles and points; `templateOutline(id, { mode: "read-alone" })` gives the full-sentence titles. The examples below describe generic projects; the numbers are illustrative.

A template is a default order. When the brief fixes a shorter deck or the facts can't fill a beat (no options, no milestones), merge it into a neighbour or drop it. Say the gap only when the decision needs it, and then as a fact about the input ("the brief gives no other options"), never about the team ("no other options costed yet"); `template-beats` will name the gap, which is the honest result. Never invent options, milestones or numbers to fill a slot. Talk about a minute a slide; `talk-time` doesn't ask a short deck to fill the template's length.

### Project update / results (5–8 slides, 5–10 min)

**What leadership remembers:** whether it's on track, the one number that proves it, and what you need from them.

| # | Role | Title | Points | Read-alone title |
|---|---|---|---|---|
| 1 | answer | Index migration: on track | 70% of traffic moved · No regressions | Search indexing migration is on track: 70% of traffic moved, no regressions |
| 2 | evidence | Freshness: 40 → 6 min | Goal: 10 min · Source: the indexing dashboard | Index freshness improved from 40 minutes to 6 against a 10-minute goal |
| 3 | evidence | Milestones: 4 of 6 | Backfill slipped 2 weeks · Cause: storage quota | Four of six milestones are done and backfill is two weeks late on quota |
| 4 | risk *(optional)* | Could cutover slip? | Shard rebalancing may run long · Dry run on 12 May decides | A dry run on 12 May will show whether shard rebalancing delays cutover |
| 5 | plan | Next: cutover 30 May | Old cluster retired in June | Next: full cutover by 30 May, then the old cluster is retired in June |
| 6 | ask | Schema freeze from 20 May | Platform leads to approve · Two weeks | We need Platform leads to approve a two-week schema freeze from 20 May |

Put the status word in slide one's title. If the project is at risk, say so there. With no asks, end on "No asks; next update on <date>".

### Proposal / decision request (6–9 slides, 8–15 min)

**What leadership remembers:** the choice, what it costs, what it returns, and the date they have to decide by.

| # | Role | Title | Points | Read-alone title |
|---|---|---|---|---|
| 1 | answer | Resize uploads in a queue | Ends upload timeouts · Needs one engineer | One engineer can end upload timeouts by moving resizing to a queue |
| 2 | context | Every upload resizes inline | Every image, before the request returns | Uploads resize every image inline before the request returns |
| 3 | problem | 4% of large uploads time out | Volume doubles by Q4 | Large uploads time out 4% of the time, and volume doubles by Q4 |
| 4 | option | Three options compared | Bigger servers · A resize queue · Do nothing | Three options: bigger servers, a resize queue, or doing nothing |
| 5 | recommendation | Why the queue wins | Cost: thumbnails about 5 s later | A queue ends timeouts at the cost of thumbnails arriving 5 seconds later |
| 6 | plan | Six engineer-weeks | Done when timeouts drop below 0.1% | Six engineer-weeks, done when upload timeouts drop below 0.1% |
| 7 | risk *(optional)* | Tripwire: queue lag over 1 min | Fall back to inline resizing | If queue lag passes one minute, we fall back to inline resizing |
| 8 | ask | Approve the queue by 14 March | Platform leads · Six engineer-weeks · Later misses Q2 staffing | Platform leads: approve the six-week queue by 14 March so Q2 can staff it |

Compare the options on one slide using the same criteria, and always include "do nothing", which the facts can always state: what stays as it is. Naming what the recommendation costs is what makes it credible.

### Technical deep dive (7–12 slides, 12–25 min)

**What leadership remembers:** one idea about how the system works, the number that shows it works, and the trade-off it makes.

| # | Role | Move | Title | Points | Read-alone title |
|---|---|---|---|---|---|
| 1 | answer | advance | A rate limiter at 0.2 ms | Decides locally · Syncs counts later | The rate limiter adds 0.2 ms by deciding locally and syncing counts later |
| 2 | problem | advance | A central counter costs 2 ms | One network hop · On every request | A central counter adds a 2 ms network hop to every request |
| 3 | mechanism | advance | Three parts | Local bucket · Sync loop · Global budget | Three parts: a local bucket, a sync loop and a global budget |
| 4 | mechanism | **zoom** | The local bucket | Refills from its share of the budget | Each local bucket refills from its share of the global budget |
| 5 | mechanism *(optional)* | **morph** | A burst | Drains one bucket · The others keep serving | A burst drains one bucket while the others keep serving |
| 6 | evidence | advance | Load test: +0.2 ms | 3% overshoot at peak · Source: load test 12 | Load tests show 0.2 ms added latency and 3% overshoot at peak |
| 7 | option | advance | Brief overshoot is the price | Buys: no extra network hop | We accept brief overshoot in exchange for no extra network hop |
| 8 | plan *(optional)* | advance | Next: per-tenant budgets, Q3 | Open: fairness under bursts | Next: per-tenant budgets in Q3, with fairness under bursts still open |
| 9 | ask | advance | Review the sync design | Storage team, by Friday · Every comment folded in | Storage team: review the sync design doc by Friday |

This is the one template that doesn't require answer first: a teaching talk may build up to its idea. Still state the thesis on slide one; engineers follow the mechanism better when they know where it leads.

### Launch / demo (5–8 slides, 5–12 min)

**What leadership remembers:** what users can do now that they couldn't before, the early result, and who switches it on next.

| # | Role | Move | Title | Points | Read-alone title |
|---|---|---|---|---|---|
| 1 | answer | advance | Refunds take one click | Support agents, no ticket · Was a two-day wait | Support agents can now issue refunds in one click instead of a two-day ticket |
| 2 | problem | advance | Refunds took two days | Every one needed an engineer | Refunds took two days because every one needed an engineer |
| 3 | demo | **morph** | Watch: a duplicate charge | Refunded in under a minute | Watch an agent refund a duplicate charge in under a minute |
| 4 | mechanism *(optional)* | advance | Limits still apply | Over an agent's limit → a lead approves | Refunds over an agent's limit still route to a lead for approval |
| 5 | evidence | advance | 1,200 refunds skipped engineering | In the first two weeks · Source: the refunds log | In the first two weeks, 1,200 refunds skipped the engineering queue |
| 6 | plan | advance | All regions by 1 June | Partial refunds next | All support regions get it by 1 June, then partial refunds |
| 7 | ask | advance | Switch your queues on | Team leads, by 15 May · Feedback to me | Team leads: switch your queues on by 15 May and send feedback to me |

Rehearse one path through the demo and keep a recording ready in case it fails. If a result hasn't been measured yet, say so.

### Postmortem / incident review (6–9 slides, 8–15 min)

**What leadership remembers:** the impact in one number, the cause in one sentence, and the fix that stops it happening again.

| # | Role | Move | Title | Points | Read-alone title |
|---|---|---|---|---|---|
| 1 | answer | advance | Checkout down 42 minutes | Bad config push · Fixed and guarded | A bad config push took checkout down for 42 minutes and is now guarded |
| 2 | evidence | advance | About 18,000 failed orders | Most customers retried within an hour | About 18,000 orders failed and most customers retried within an hour |
| 3 | evidence | advance | Where the minutes went | Alerts: 9 min · Rollback: 25 min, slow tool | Alerts took 9 minutes and a slow rollback tool took 25 more |
| 4 | mechanism | **zoom** | One missing default | One bad value · Every payment provider off | A missing default let one bad value disable every payment provider |
| 5 | problem | advance | Why didn't canary catch it? | Config pushes skipped canary · All 14 regions at once | Config changes skipped canary, so the bad value reached all 14 regions at once |
| 6 | plan | advance | Three fixes by June | Canary config pushes · Schema defaults · Faster rollback | Three fixes: canary config pushes, schema defaults and faster rollback by June |
| 7 | ask | advance | Prioritise canary work in Q3 | Release Engineering owns it | Prioritise the canary work in Q3 planning so Release Engineering owns it |

Keep it blameless: write about systems and safeguards, and name no person as a cause. The gaps in the timeline are usually the real findings. Keep the fix list short enough to track, each fix with an owner and a date.

### Quarterly / performance review highlights (5–8 slides, 5–10 min)

**What leadership remembers:** two or three outcomes with numbers, what other teams can now do, and the one ask.

| # | Role | Title | Points | Read-alone title |
|---|---|---|---|---|
| 1 | answer | A third fewer payment failures | Two launches unblocked | Payment failures fell by a third this half, and two launches were unblocked |
| 2 | evidence | Failed payments: 3% → 2% | Since smarter retries shipped · Share of all attempts | Failed payments went from 3% to 2% of attempts after smarter retries shipped |
| 3 | evidence | Two teams, three weeks | Launched on the new API · Without our help | Two product teams launched on the new API in three weeks, without our help |
| 4 | problem *(optional)* | Fraud rules slipped 3 months | Now: rules ship behind flags | The fraud-rule rewrite slipped three months, so rules now ship behind flags |
| 5 | plan | Next half: halve payout latency | For instant withdrawals | Next half: halve payout latency to support instant withdrawals |
| 6 | ask | One more engineer by July | Payments director to approve | We need the payments director to approve one more engineer by July |

Report impact, such as "a third fewer failures". "Worked on retries" describes activity and says nothing about the result. Show one outcome per slide with its baseline and source, said as what changed after the work ("since retries shipped") with no claim that the work caused it, and say which part was yours and which was the team's. Leverage, meaning what others can now do because of your work, is what senior reviewers look for. Include a miss, like the fraud-rule slip on slide 4.

## The player's three moves, used for meaning

The player has one default move and two special ones. A special move only means something because it's rare, so most slides should simply advance.

| Move | Use it when | It's a gimmick when |
|---|---|---|
| **Advance** (default) | The argument moves on to the next claim. That's nearly every slide. | Never; it's the baseline. |
| **Morph** | The *same thing* changes: before and after, a request moving through a diagram, one number becoming a row in a table, a list re-sorting. The audience tracks the object across both slides. | The two slides share nothing meaningful, or a title slides around for style alone. If you can't say "watch X change", don't morph. |
| **Zoom** | Going from an overview into *one part* of it: a system and then one component, a timeline and then one incident, a portfolio and then one project. Come back out afterwards (going back reverses the zoom). | The target isn't on the previous slide, you zoom two levels without returning, or you zoom into every part in turn. Zoom once or twice per talk. |

In a typical deck, about one slide in ten uses morph or zoom. The templates mark where those moves fit.

## Speaker notes: what the slide can't hold

A presented deck's notes are cues you glance at while you talk. The slide already holds the order and the numbers, and the room can read it, so a note that restates its slide gives you nothing to say. Notes carry what the slide can't: why it matters, the so-what for this audience, the trade-off if the answer is no, the open question, and the bridge. All of it is reasoning from the given facts; a note never adds a new fact.

- **`say`: a few short lines, one thought each,** at most about 60 words (`notes-cues` warns past that). Under "1 engineer, 3 weeks, 400 articles": "Why now: those customers meet the February price change on the old bot", "The engineering is small; the 400-article review is the open item". Not "Cost: one engineer for about three weeks", which the slide already says (`notes-echo` warns when more than half a note's words are on its slide; source lines don't count). End with the source. "Point at the 9" alone is a stage direction and belongs in `delivery` (`notes-cues` warns when `say` is nothing else). Separate lines with `\n`; the speaker view, read view and notes PDF keep the breaks.
- **`delivery`: one cue** for pace or where to point ("Point at the 19 and hold it").
- **`next`: the bridge,** a few words ("The 19 becomes one row"), only where the link isn't obvious; the same "Next: …" under every slide reads as a template.
- **Timing comes from the slide count,** about a minute a slide, so pass `minutes` to the player for its clock. `talk-time` only warns when the notes run over the budget; it doesn't ask cues to fill it.

```ts
notes: {
  say: "Two fewer meetings for every decision this room takes.\nSource: the platform review log, 24 reviews, April to September.",
  delivery: "Say one, then three. Stop.",
  next: "What a buried answer costs",
}
```

## Decks read without you

When a deck goes out without its speaker (a pre-read, a deck forwarded up the chain, a consulting-style customer readout), write it read-alone and lint it with `mode: "read-alone"`:

- **Titles carry the argument.** Each is the real conclusion as one sentence, and the ghost deck stands on its own. A sentence title is only as good as the conclusion it states: the Boeing slide NASA saw before Columbia was titled "Review of Test Data Indicates Conservatism for Tile Penetration", and the caveat that decided it (the foam was 1,920 cubic inches, the test 3) was its last, smallest bullet (Tufte). Put the decisive caveat in the title or the slide's top level.
- **Notes carry the talk.** Write `say` in full sentences at about 135 words a minute; readers can open it. `talk-time` then also warns when the track covers under half the budget.
- **Caveats that change the decision stay on the slide.** Exports and screenshots drop notes. This holds for presented decks too.
- **Every number keeps its source** where a reader can find it.
- **Appendix for depth.** Put a divider before it, so the last slide you present is the ask.
- **Slide one works alone.** It's often the only slide anyone forwards. A presented slide one still carries its numbers in the points, so it keeps the facts when forwarded; it just leaves the because to you.

## The checklist `lintDeck` enforces

`lintDeck(slides, { mode?, template?, minutes?, answerFirst? })` reads `{ id, title, role?, notes?, headline?, source?, eyebrow?, lede?, points?, slots? }[]`. A `DeckSlide` already fits. When the overview `title` differs from what the slide shows, pass the on-slide title as `headline`. `mode` is `"presented"` (default) or `"read-alone"`; the rules below say where it changes a check.

The rules and what each checks, as `LINT_RULES` states them (generated):

<!-- generated:lint-rules -->
| Rule | Severity | What it checks |
| --- | --- | --- |
| `deck-empty` | error | The deck has at least one slide. |
| `duplicate-id` | error | Slide IDs are unique (they appear in URLs and presenter sync). |
| `title-present` | error | Every slide has a title. |
| `title-claim` | error | Presented: a content slide's title is a short verdict the speaker can say ('Crashes down by two thirds', 'Start time: 0.2 s slower'); a bare topic label ('Crash rate') warns except on a cover, section, mechanism, demo or appendix slide, and a word that names the slide's kind ('Background', 'Results', 'Next steps') warns everywhere. Read-alone: the title states a claim of three or more words, not a topic label. |
| `title-length` | warn | Presented: aim for 2–5 words; the check stops at 6. A spoken verdict, never a sentence to read out. Read-alone: at most 14 words. |
| `title-specific` | warn | An answer, evidence, problem or recommendation slide quantifies its claim, in the title or (presented) a point: a number that isn't a date or a version, a multiple or fraction ('twice', 'a third'), a number word with a unit ('three weeks', 'one engineer'), or a comparison of two quantities ('from 40 to 6 minutes'). A plan title carries a date or a number. A bare count ('two teams', 'one big improvement'), 'no regressions', adjectives and names don't count. |
| `one-idea` | tip | The title is one sentence: one idea per slide. |
| `notes-present` | warn | Every presented slide has speaker notes: cues when presented, a talk track when read alone. |
| `number-source` | tip | A number in a title or a point names its source in the notes: a named artifact ('the search latency dashboard', 'load test 12', 'the Q3 user survey') or a URL, with no hedge ('trust me', 'someone mentioned', 'said so'); or in the slide's `source`. |
| `roles-missing` | warn | Slides are tagged with roles. Without them, roles are inferred from the titles and only the answer-first and closing-ask checks run. |
| `answer-first` | error | The answer or recommendation appears within the first three content slides. |
| `outcome-first` | tip | Slide one names the business outcome (faster, cheaper, safer, by how much), not the system that produced it. |
| `closing-ask` | error | The last presented slide is an ask. |
| `ask-concrete` | warn | The ask names a decision or action, an owner (a team or role such as 'platform leads', 'the payments team', 'VP Eng' or an @handle; not 'we', 'the team', a bare name, 'owner TBD' or 'lead' as a verb) and a firm calendar date ('next quarter', 'Monday-ish' and 'next Monday maybe' are not). |
| `role-repeat` | warn | No two adjacent slides share a role, except evidence, mechanism, demo and appendix. |
| `deck-length` | warn | About one to two minutes per presented slide. |
| `talk-time` | warn | The notes fit the time budget at 135 words a minute. Read-alone decks' talk tracks also cover at least half of it (the minutes given, else the template's shortest length, capped at one minute per presented slide); a presented deck's cues aren't timed. |
| `template-beats` | warn | With a template, every beat it requires has a slide in that role: a decision request has its options, a postmortem its plan. |
| `slot-budget` | warn | Every slot the slide declares as data (title, eyebrow, headline lines, lede, body points, and archetype slots such as quote, value, owner and date) fits its text budget in SLOT_BUDGETS: an eyebrow is one to four words, a lede one sentence, a headline at most two lines, a body point a fragment of at most 8 words on one line and at most four a slide, a label no sentence. |
| `notes-cues` | warn | Presented: each slide's `say` is cues, not a script: at most 60 words (why it matters, the so-what, the trade-off), with the bridge in `next`. A `say` of stage directions only ('Point at the 9', 'Walk the figure') warns; a stage direction beside content is a tip to move it to `delivery`. |
| `notes-echo` | warn | Presented: a slide's notes add what the slide can't hold (why it matters, the so-what for this audience, the trade-off if the answer is no, the bridge), reasoned from the given facts. Notes whose content words are mostly (55% or more) already on the slide warn; source lines don't count. |
| `ask-scope` | warn | Presented: the ask slide itself says what is approved or done (a decision verb with its object: 'approve Spanish and French', not 'approve by 15 January') and, when another slide states a cost, what it costs (a quantity that isn't a date: 'one engineer, about three weeks', or 'no extra cost'). |
| `slide-shape` | warn | The deck doesn't repeat one shape on every slide: not eyebrow + headline + lede throughout, and (presented) not the same title form throughout ('Topic: verdict' or a full sentence on every slide). Mix labels, verdicts and the occasional question. |
| `ai-tells` | warn | No templated rhetoric: a 'X, not Y' contrast or an appended comparison ('…, twice as fast as March') on more than one slide warns; a semicolon joining two clauses in a title, lede or point is a tip. |
| `causal-claim` | warn | A deck that shows a before/after comparison ('61.2% → 63.0%', 'was 40', 'Sep vs Oct') claims no cause from it: a cause verb ('lifted', 'cut', 'drove', 'because') in a title, lede or point warns outside mechanism, plan and ask slides (say 'after', 'since', 'went from… to'). A tip when nothing on the slides, notes or source says once that the numbers come from two windows, before and after. |
<!-- /generated -->

### Slot text budgets

Each slot of the slide region map holds a fixed amount of text in every layout and every style. Measures are estimates for IBM Plex Sans at the slot's canvas size; `slotProblems(slot, text)` applies one.

<!-- generated:slot-budgets -->
| Slot | Budget | When it runs over |
| --- | --- | --- |
| eyebrow (optional) | 1–4 words, one line, never a sentence | wraps |
| headline | presented: at most 6 words (aim for 2–5); read-alone: at most 14, on at most 2 lines | wraps, balanced |
| title | at most 14 words (overview and screen readers) | ellipsis |
| lede (optional) | at most 30 words, 3 lines, one sentence | wraps |
| point (body line) | at most 8 words, one line, a fragment with no full stop; 2–4 a slide | wraps |
| label | at most 3 words, never a sentence | wraps |
| quote | at most 30 words, 4 lines, 2 sentences | wraps, balanced |
| attribution | at most 8 words, one line, never a sentence | wraps |
| value / number | at most 6 / 3 characters | wraps |
| unit | at most 4 words, never a sentence | wraps |
| baseline | at most 12 words, one line, one sentence | wraps |
| action | 2–12 words, 2 lines, one sentence | wraps |
| owner | 1–5 words, never a sentence | wraps |
| date | 1–4 words, never a sentence | wraps |
| source | at most 30 words, 2 lines | wraps |
<!-- /generated -->

These checks are heuristics. They catch a missing ask or a topic-label title, but they can't tell whether a claim is true. After the draft, reread it as the audience against the [review checklist](system/writing/general.md#rules-for-every-kind) (rule 9) and revise once; then rehearse it out loud and have someone else read the ghost deck cold.

```ts
import { lintDeck, storylineOf, templateOutline } from "uipack/deck";

const scaffold = templateOutline("decision-request"); // short titles and points: rewrite with your facts
const findings = lintDeck(slides, { template: "decision-request", minutes: 10 }); // presented
const preRead = lintDeck(slides, { mode: "read-alone", template: "decision-request" }); // sent without you
const ghost = storylineOf(slides); // [{ number, id, title, role, roleLabel, appendix }]
```

## Sources

- A survey of 66 decks and talks (November 2026): tech keynotes and engineering talks (Hickey, Pike, Karpathy, Willison, Majors, Jobs), method authors and teachers (Winston's *How to Speak*, Takahashi, Alley's assertion-evidence studies, Godin, Kawasaki, Duarte, Tufte on the Columbia slide) and business decks (LinkedIn's Series B with Reid Hoffman's notes, Airbnb, Front, Benedict Evans, the McKinsey USPS deck). It is the basis for presented mode and the AI-tells list.
- Wikipedia, "Signs of AI writing": negative parallelism, formulaic punctuation, superficial analytic tails, rule of three.
- Barbara Minto, *The Pyramid Principle*: answer first, grouped support, SCQA.
- Consulting practice for action titles and the ghost deck, where you draft the titles before the slides: the read-alone mode.
- The [`create-fde-deck`](https://github.com/ong6/skills/tree/main/skills/create-fde-deck) skill: takeaway headlines, every number traceable, caveats that change the decision kept on the slide, a closing slide with an action, an owner and a date, and options compared on the same criteria.
