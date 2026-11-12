# Recipe: deck slide

How to build a deck with `uipack/deck`: pick a storyline, give each slide a role and an
archetype, write it to the mode, and run the checks. Compare your draft with the
[Tech talk deck](../deck.md).

## Relies on

- The site's spec: a deck is a page of the site (an HTML deck), so it takes the spec's slide faces
  (`--ui-slide-font-*`), palette and ornaments, its `### Deck` layout (`slide-canvas` or an extension)
  and its writing style for talks: the title form for presented and read-alone decks, tone and house
  words. A talk series that should look unlike any site has its own spec
  ([presentations](../system/README.md#presentations-are-websites)). Pass the style as
  `<DeckPlayer uiStyle="<id>">` when UiPack renders it; otherwise the site's own CSS sets the roles.
- Words: [talks and slides](../system/writing/talks.md) for a presented deck,
  [read-alone documents](../system/writing/documents.md#read-alone-decks) for one that travels.
- Layout: [deck slide](../system/layout/deck-slide.md): canvas, regions, archetypes, transitions.
- Parts and API: [Deck player](../deck.md), [Deck storytelling](../deck-storytelling.md),
  [Consulting slides](../deck-consulting.md).

## Storylines

Each storyline orders the slide roles; pick the one that matches the job (`STORYLINE_TEMPLATES`,
`starterDeck(id)` builds a draft deck from one):

<!-- generated:storylines -->
| Storyline | `starterDeck` / `template` id | Use it for | Slides | Minutes | Beats in order (optional in brackets) |
| --- | --- | --- | --- | --- | --- |
| Project update / results | `project-update` | Status to leadership or stakeholders: where it stands, what it delivered, what you need. | 5–8 | 5–10 | answer → evidence → evidence → (risk) → plan → ask |
| Proposal / decision request | `decision-request` | You want a decision, budget or headcount. SCQA with the recommendation stated up front. | 6–9 | 8–15 | answer → context → problem → option → recommendation → plan → (risk) → ask |
| Technical deep dive | `deep-dive` | Explaining a system to engineers: why it matters, how it works, trade-offs, what's next. | 7–12 | 12–25 | answer → problem → mechanism → mechanism → (mechanism) → evidence → option → (plan) → ask |
| Launch / demo | `launch-demo` | Something shipped or is about to: show the before and after, earn adoption. | 5–8 | 5–12 | answer → problem → demo → (mechanism) → evidence → plan → ask |
| Postmortem / incident review | `postmortem` | After an incident: what happened, why, and what changes. Blameless and specific. | 6–9 | 8–15 | answer → evidence → evidence → mechanism → problem → plan → ask |
| Quarterly / performance review highlights | `review-highlights` | Your or your team's period in review: impact, not activity. | 5–8 | 5–10 | answer → evidence → evidence → (problem) → plan → ask |
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
2. Pick a storyline, then a role per slide and an archetype per role from the
   [archetype table](../system/layout/deck-slide.md#archetypes): an `option` slide is an options
   table (`HarveyTable`), a `plan` slide milestones with dates, one number a `factSlide`. Points
   is the default only where the role has no better body.
3. Write titles to the mode ([title forms](../system/writing/README.md#title-forms) and the site spec's writing style), points
   that carry the numbers, and cues that add what the slide can't hold.
4. Read the titles alone, in order (`storylineOf`): they should outline the argument.
5. **What each slide adds.** Beside each title write the one thing it adds that no earlier slide
   said (a number, a baseline, a cost, a date, the trade-off). A slide with nothing new merges into
   its neighbour; a template's beat count is a ceiling, not a target. The usual repeat in a decision
   request: an options slide whose title already names the pick, then a recommendation slide that
   argues it again, then a plan that restates the same conditions. The options slide compares on
   the same criteria and picks nothing; the recommendation picks and names what it gives up; the
   plan adds dates and cost.
6. Run `lintDeck` (below) on the final slides, after the last edit, and fix every `error` and
   `warn` or say why it stays. Its checks read words, so they can't see steps 5, 7 and 8.
7. **Fill.** Render every slide and look at the body region: content that leaves half of it empty
   (three short points under a title, a lone line) means the archetype is wrong for the content.
   Change it (a fact, a statement, an options table) or merge the slide; never pad the words.
8. **One tone.** Every slide uses the deck's ground. `invert` or another `tone` marks a section
   break (every `sectionSlide` of the deck alike), never a single content slide for variety
   ([invert](../system/layout/deck-slide.md#archetypes)).

## Checks before you present

`lintDeck(slides, { mode })` runs these (`LINT_RULES`):

The checks that most often fail a presented deck: `title-claim` and `title-length` (a short spoken
verdict), `answer-first`, `closing-ask` and `ask-concrete` (the ask names a decision, an owner and a
date), `notes-echo` and `number-source`. Every rule, with its severity: [lintDeck rules](../deck-lint-rules.md).
