# Recipe: deck slide

How to build a deck with `uipack/deck`: pick a storyline, give each slide a role and an
archetype, write it to the mode, and run the checks. Compare your draft with the
[Tech talk deck](../deck.md).

## Relies on

- Words: [talks and slides](../system/writing/talks.md) for a presented deck,
  [read-alone documents](../system/writing/documents.md#read-alone-decks) for one that travels.
- Layout: [deck slide](../system/layout/deck-slide.md): canvas, regions, archetypes, transitions.
- Parts and API: [Deck player](../deck.md), [Deck storytelling](../deck-storytelling.md),
  [Consulting slides](../deck-consulting.md).

## Storylines

Each storyline orders the slide roles; pick the one that matches the job (`STORYLINE_TEMPLATES`,
`starterDeck(id)` builds a draft deck from one):

<!-- generated:storylines -->
| Storyline | Use it for | Slides | Minutes | Beats in order (optional in brackets) |
| --- | --- | --- | --- | --- |
| Project update / results | Status to leadership or stakeholders: where it stands, what it delivered, what you need. | 5–8 | 5–10 | answer → evidence → evidence → (risk) → plan → ask |
| Proposal / decision request | You want a decision, budget or headcount. SCQA with the recommendation stated up front. | 6–9 | 8–15 | answer → context → problem → option → recommendation → plan → (risk) → ask |
| Technical deep dive | Explaining a system to engineers: why it matters, how it works, trade-offs, what's next. | 7–12 | 12–25 | answer → problem → mechanism → mechanism → (mechanism) → evidence → option → (plan) → ask |
| Launch / demo | Something shipped or is about to: show the before and after, earn adoption. | 5–8 | 5–12 | answer → problem → demo → (mechanism) → evidence → plan → ask |
| Postmortem / incident review | After an incident: what happened, why, and what changes. Blameless and specific. | 6–9 | 8–15 | answer → evidence → evidence → mechanism → problem → plan → ask |
| Quarterly / performance review highlights | Your or your team's period in review: impact, not activity. | 5–8 | 5–10 | answer → evidence → evidence → (problem) → plan → ask |
<!-- /generated -->

## Slide roles

<!-- generated:slide-roles -->
| Role | Answers | Its job |
| --- | --- | --- |
| `cover` | What is this and why am I here? | State the outcome the talk is about, in business terms, not the name of the system. |
| `answer` | What's the point? | The governing thought: the result, the recommendation or the thesis, in one sentence. |
| `context` | Where are we? | The situation the room already agrees with. One slide, no history lesson. |
| `problem` | What changed or went wrong? | The complication that makes action necessary now, sized with a number. |
| `evidence` | Why should I believe it? | One finding per slide: value, baseline, window and source. |
| `mechanism` | How does it work? | The system or cause, from overview into one part at a time. |
| `option` | What else could we do? | Real alternatives, including doing nothing, compared on the same criteria. |
| `recommendation` | Which one, and what do we give up? | The chosen option, why it wins, and the trade-off accepted. |
| `plan` | What happens next? | Milestones, cost and how we'll know it worked. |
| `risk` | What could go wrong? | The top risk, its impact, the mitigation and the tripwire. |
| `ask` | What do you need from me? | A specific decision or action, with an owner and a date. |
| `demo` | Show me. | The real thing, one rehearsed path, with a recorded fallback. |
| `appendix` | Where's the detail? | Backup for questions and async readers. Not presented. |
<!-- /generated -->

## Parts

| Slide | Factory or component |
| --- | --- |
| Points, the default | `pointsSlide`, `PointsSlide` |
| Section divider | `sectionSlide`, `SectionSlide` |
| Quote | `quoteSlide`, `QuoteSlide` |
| One number with its baseline | `factSlide`, `FactSlide` |
| The ask | `endSlide`, `EndSlide` |
| A dense data slide | `ConsultingSlide`, `Panel`, `SoWhat`, `KpiTiles`, `BarChart`, `Waterfall` |
| A tour of one dense slide | `Bento`, `BentoCell` |
| The player | `DeckPlayer` with `slides`, `lint={{ mode }}` |

## Steps

1. Write slide one's outcome and the ask first.
2. Pick a storyline, then a role per slide and an archetype per role.
3. Write titles to the mode ([lengths](../system/writing/README.md#lengths-at-a-glance)), points
   that carry the numbers, and cues that add what the slide can't hold.
4. Read the titles alone, in order (`storylineOf`): they should outline the argument.
5. Run the checks below and fix every warning or say why it stays.

## Checks before you present

`lintDeck(slides, { mode })` runs these (`LINT_RULES`):

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
