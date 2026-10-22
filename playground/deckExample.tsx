import { Build, Morph, Slide, type DeckSlide } from "../src/deck";

/*
 * The tech talk: a team lead arguing that reviews should open with their answer, presented in the
 * player it recommends. Every number is illustrative: 24 invented platform reviews.
 *
 * It uses one morph and one zoom, each where the story needs it: the morph carries the 19 days from
 * the problem into the comparison that explains it (the same number, now one row of a table), and
 * the zoom goes from the ghost deck into the one slide it flags. Everything else advances.
 */

const footer = "Platform reviews · how we decide · Illustrative";
const source = "Illustrative: 24 platform reviews, April–September 2026, median per group. Source: the platform review log.";

/** What the buried-answer reviews spent their meetings on. */
const meetings = [
  ["Meeting 1", "Context and six charts.", "“So what do you need from us?”"],
  ["Meeting 2", "The options, walked through again.", "“Which one do you recommend?”"],
  ["Meeting 3", "The recommendation, finally on a slide.", "Decided, 19 days after the first."],
] as const;

/** The two groups the review log splits into, on one scale of days to a decision. */
const groups = [
  { label: "Answer first", reviews: 11, meetings: 1, days: 6 },
  { label: "Answer buried", reviews: 13, meetings: 3, days: 19 },
] as const;

/** A first draft of a review, as the ghost deck shows it: titles alone, with the check's flags. */
const ghost = [
  { role: "Answer", title: "Search got twice as fast this quarter, and cheaper to run" },
  { role: "Evidence", title: "Cost update", flag: "A label, not a claim", zoom: true },
  { role: "Evidence", title: "Caching saved 140 of the 214 ms we cut" },
  { role: "Risk", title: "The cache passes 90% memory at the November peak" },
  { role: "Plan", title: "Next steps", flag: "No date" },
  { role: "Ask", title: "Thoughts and questions welcome", flag: "No owner, no date" },
] as const;

/** The flagged slide, fixed: what changes in each of its three parts. */
const fixes = [
  ["Title", "Cost update", "Cost per 1k queries fell 18%, to $0.41"],
  ["Proof", "Four charts, one per cost line", "One pair of bars: Q2 $0.50, Q3 $0.41"],
  ["Source", "None", "Search cost dashboard, Q2 against Q3"],
] as const;

/** The pilot: dated steps, each with an owner. */
const pilot = [
  ["6 Nov", "Send the titles of your next review, answer first", "Team leads"],
  ["13 Nov", "Search, Payments and Storage present in the player", "Their leads"],
  ["30 Nov", "Count days to a decision against the 19-day baseline", "Developer Experience"],
] as const;

export const deckExample: DeckSlide[] = [
  {
    id: "answer",
    title: "One meeting, not three",
    headline: "Reviews that open with the answer were decided in one meeting, not three.",
    role: "answer",
    render: () => (
      <Slide eyebrow="Team leads · how we run reviews · Illustrative" footer={footer} layout="center">
        <h2 className="uipack-deck-title deck-demo-cover-title">
          Reviews that open with the answer were decided in one meeting, not three.
        </h2>
        <p className="uipack-deck-lede deck-demo-lede">
          So present your next review in the deck player: the answer on slide one, one claim per slide, and motion only where the
          story needs it.
        </p>
      </Slide>
    ),
    notes: {
      say: "Here is the whole talk in one sentence. Of the twenty-four platform reviews we held between April and September, the eleven that opened with their answer were decided in one meeting. The other thirteen took three meetings each, and nineteen days. So I'm asking every team lead to present their next review in the deck player, which puts the answer on slide one, keeps one claim per slide, and only moves a slide when the story needs it. The numbers in this deck are illustrative. Source: the platform review log, April to September 2026.",
      delivery: "Say the two numbers slowly: one meeting, three meetings. Then stop.",
      next: "First, what a buried answer costs.",
    },
  },
  {
    id: "problem",
    title: "Nineteen days to decide",
    headline: "A review that buries its answer takes three meetings and 19 days to decide.",
    role: "problem",
    render: () => (
      <Slide eyebrow="The cost of a buried answer" footer={footer} layout="split" className="deck-demo-problem">
        <div className="deck-demo-problem__copy">
          <h2 className="uipack-deck-heading">A review that buries its answer takes three meetings and 19 days to decide.</h2>
          <ol className="deck-demo-meetings">
            {meetings.map(([when, what, said]) => (
              <li key={when}>
                <span className="uipack-deck-label">{when}</span>
                <b>{what}</b>
                <span>{said}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="deck-demo-problem__figure">
          <p className="uipack-deck-number">
            <Morph id="days" as="span">
              19
            </Morph>
          </p>
          <p className="deck-demo-problem__unit">days to a decision</p>
          <p className="uipack-deck-label">Median of 13 reviews · Next: where this number sits</p>
        </div>
      </Slide>
    ),
    notes: {
      say: "Here is what a buried answer costs. A typical review opens with context and six charts, and the first meeting ends with someone asking what we need from them. The second meeting walks through the options again and ends with: which one do you recommend? The recommendation finally lands in the third meeting. Across the thirteen reviews that buried their answer, the median was three meetings and nineteen days from the first meeting to a decision. That is nineteen days of a team waiting on a call it could have had in the first hour. Source: the platform review log.",
      delivery: "Point at the 19 and hold it there; the next slide moves it.",
      next: "Watch the nineteen: it becomes one row of a comparison.",
    },
  },
  {
    id: "evidence",
    title: "Six days against nineteen",
    headline: "Answer-first reviews were decided in 6 days; buried ones took 19.",
    role: "evidence",
    // The same 19 days travels into its row: the morph says "this number, compared".
    transition: "morph",
    render: () => (
      <Slide eyebrow="Answer first against answer buried" footer={footer} className="deck-demo-evidence">
        <h2 className="uipack-deck-heading">Answer-first reviews were decided in 6 days; buried ones took 19.</h2>
        <table className="deck-demo-compare">
          <thead>
            <tr>
              <th scope="col">Reviews</th>
              <th scope="col">Count</th>
              <th scope="col">Meetings</th>
              <th scope="col">Days to a decision</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.label} data-now={g.days === 6 ? "" : undefined}>
                <th scope="row">{g.label}</th>
                <td>{g.reviews}</td>
                <td>{g.meetings}</td>
                <td>
                  <span className="deck-demo-compare__bar" style={{ width: `${(g.days / 19) * 62}%` }} />
                  <span className="deck-demo-compare__days">
                    {g.days === 19 ? (
                      <Morph id="days" as="span">
                        19
                      </Morph>
                    ) : (
                      g.days
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="uipack-deck-label deck-demo-source">{source}</p>
      </Slide>
    ),
    notes: {
      say: "Here is the nineteen again, as one row of a comparison. The review log splits our twenty-four reviews into two groups. Eleven opened with their answer: a median of one meeting and six days to a decision. Thirteen buried it: three meetings and nineteen days. Same teams, same kinds of decision, same quarter. The difference is the order of the slides. We can't prove the order caused all of it, but in every pair of reviews from the same team, the answer-first one was decided sooner. Source: the platform review log, April to September 2026, median per group.",
      delivery: "Trace the two bars left to right, then read the meetings column.",
      next: "So how do you check a review before you give it?",
    },
  },
  {
    id: "ghost",
    title: "The ghost deck flags it",
    headline: "Press G: the ghost deck reads a review's titles and flags the weak ones.",
    role: "demo",
    render: () => (
      <Slide eyebrow="Demo · the Storyline view" footer={footer} className="deck-demo-ghost">
        <h2 className="uipack-deck-heading">Press G: the ghost deck reads a review's titles and flags the weak ones.</h2>
        <ol className="deck-demo-ghost__grid">
          {ghost.map((g, i) => {
            const card = (
              <>
                <span className="deck-demo-ghost__meta">
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span>{g.role}</span>
                </span>
                <span className="deck-demo-ghost__title">{g.title}</span>
              </>
            );
            return (
              <li key={g.title} data-flag={"flag" in g ? "" : undefined}>
                {"zoom" in g ? (
                  <Morph id="flagged" className="deck-demo-ghost__card">
                    {card}
                  </Morph>
                ) : (
                  <div className="deck-demo-ghost__card">{card}</div>
                )}
                <span className="deck-demo-ghost__flag">{"flag" in g ? `⚑ ${g.flag}` : "✓"}</span>
              </li>
            );
          })}
        </ol>
      </Slide>
    ),
    notes: {
      say: "This is the check, live. Press G in the player and the Storyline tab shows the review as its titles alone, the ghost deck, with the player's checks beside it. This is the first draft of the search team's quarterly review. Read the titles in order: the answer is there, but slide two is a label, the plan has no date and the ask names nobody. Those three flags are exactly the gaps that cost a second meeting. Fixing them takes minutes, before anyone is in a room.",
      delivery: "Read the six titles aloud in order, then point at slide two.",
      next: "Let's go inside slide two and fix it.",
    },
  },
  {
    id: "fix",
    title: "Three edits fix it",
    headline: "A flagged slide takes three edits: a claim, one chart and a source.",
    role: "mechanism",
    // The ghost deck's flagged card opens into the slide it stands for: the same slide, closer.
    transition: { zoom: "flagged" },
    render: () => (
      <Slide eyebrow="Inside slide 02 · Cost update" footer={footer} className="deck-demo-fix">
        <h2 className="uipack-deck-heading">A flagged slide takes three edits: a claim, one chart and a source.</h2>
        <div className="deck-demo-fix__table">
          <p className="uipack-deck-label" aria-hidden="true">
            <span />
            <span>Draft</span>
            <span>Fixed</span>
          </p>
          <ol>
            {fixes.map(([part, before, after], i) => {
              const row = (
                <>
                  <b>{part}</b>
                  <s>{before}</s>
                  <span>{after}</span>
                </>
              );
              // The first edit is on screen as the camera lands, so the zoom opens onto a finding.
              return i === 0 ? (
                <li key={part}>{row}</li>
              ) : (
                <Build key={part} as="li" step={i}>
                  {row}
                </Build>
              );
            })}
          </ol>
        </div>
      </Slide>
    ),
    notes: {
      say: "Inside slide two there are three edits. The title says what to conclude, with its number: cost per thousand queries fell eighteen percent, to forty-one cents. The proof is the one chart that shows it, a pair of bars for the two quarters, instead of four charts of every cost line. And the number gets its source, the search cost dashboard, so nobody has to ask where it came from. Each edit takes a minute. Each one removes a question that would otherwise wait for the next meeting.",
      delivery: "Press Next for the proof, then the source. Go back one slide to show the zoom reversing.",
      next: "Here's how we'll try it.",
    },
  },
  {
    id: "plan",
    title: "Three pilots by 30 November",
    headline: "Three pilot reviews by 30 November, then we count days to a decision again.",
    role: "plan",
    tone: "ink",
    render: () => (
      <Slide eyebrow="The pilot" footer={footer} className="deck-demo-plan">
        <h2 className="uipack-deck-heading">Three pilot reviews by 30 November, then we count days to a decision again.</h2>
        <ol className="deck-demo-pilot">
          {pilot.map(([when, what, who]) => (
            <li key={when}>
              <span className="deck-demo-pilot__when">{when}</span>
              <b>{what}</b>
              <span className="uipack-deck-label">{who}</span>
            </li>
          ))}
        </ol>
        <p className="deck-demo-pilot__done">
          <span className="uipack-deck-label">Done when</span> the pilots' median is under 10 days to a decision, against 19
          today.
        </p>
      </Slide>
    ),
    notes: {
      say: "The pilot is small and dated. By the sixth of November, each team lead sends me the titles of their next review, answer first. In the week of the thirteenth, Search, Payments and Storage present theirs in the player. And on the thirtieth, Developer Experience counts days to a decision for those reviews against the nineteen-day baseline. We call it a success if the median comes in under ten days. If it doesn't, we stop, and I'll say so in the next leads' meeting.",
      delivery: "Read the three dates; let the done-when line land.",
      next: "Which leaves one thing I need from you.",
    },
  },
  {
    id: "ask",
    title: "Send your titles by 6 November",
    headline: "Team leads: send me your next review's titles, answer first, by 6 November.",
    role: "ask",
    tone: "accent",
    render: () => (
      <Slide eyebrow="The ask" footer={footer} layout="center">
        <h2 className="uipack-deck-title deck-demo-cover-title">
          Team leads: send me your next review's titles, answer first, by 6{" "}November.
        </h2>
        <p className="uipack-deck-lede deck-demo-lede">I'll send back the three titles I'd rewrite within two working days.</p>
        <p className="uipack-deck-label deck-demo-keys">
          ← → or swipe · G for all slides and the Storyline · S for the speaker view · F for full screen
        </p>
      </Slide>
    ),
    notes: {
      say: "One ask, for the team leads in the room. By Friday the sixth of November, send me the titles of your next review, in order, answer first. Just the titles: that's the ghost deck, and it's where the argument lives. I'll send back the three I'd rewrite within two working days, and the three pilot teams present in the player the week after. If your review is already answer first, send it anyway; it becomes the example for everyone else.",
      delivery: "End on the date. Leave the slide up while you take questions.",
    },
  },
];
