import { Build, Morph, Slide, type DeckSlide } from "../src/deck";

/*
 * The tech talk: a team lead arguing that reviews should open with their answer, presented in the
 * player it recommends. Every number is illustrative: 24 invented platform reviews. It is written
 * for a speaker who talks freely: short titles in mixed forms (a verdict, labels, a question), the
 * numbers in fragments on the slide, and cue notes, not a script.
 *
 * It uses one morph and one zoom, each where the story needs it: the morph carries the 19 days from
 * the problem into the comparison that explains it (the same number, now one row of a table), and
 * the zoom goes from the ghost deck into the one slide it flags. Everything else advances.
 */

const footer = "Platform reviews · how we decide · Illustrative";
const source = "Illustrative: 24 platform reviews, April–September 2026, median per group. Source: the platform review log.";

/** What the buried-answer reviews spent their meetings on. */
const meetings = [
  ["Meeting 1", "Context and six charts", "“So what do you need from us?”"],
  ["Meeting 2", "The options, again", "“Which one do you recommend?”"],
  ["Meeting 3", "The recommendation, at last", "Decided on day 19"],
] as const;

/** The two groups the review log splits into, on one scale of days to a decision. */
const groups = [
  { label: "Answer first", reviews: 11, meetings: 1, days: 6 },
  { label: "Answer buried", reviews: 13, meetings: 3, days: 19 },
] as const;

/** A first draft of a review, as the ghost deck shows it: titles alone, with the check's flags. */
const ghost = [
  { role: "Answer", title: "Search: twice as fast, and cheaper" },
  { role: "Evidence", title: "Search now costs 18% less per query this quarter", flag: "A sentence to read out", zoom: true },
  { role: "Evidence", title: "Caching: 140 of the 214 ms" },
  { role: "Risk", title: "Will the cache hold in November?" },
  { role: "Plan", title: "Next steps", flag: "Names the slide, no date" },
  { role: "Ask", title: "Thoughts and questions welcome", flag: "No owner, no date" },
] as const;

/** The flagged slide, fixed: what changes in each of its three parts. */
const fixes = [
  ["Title", "Search now costs 18% less per query this quarter", "Cost per 1k queries"],
  ["Proof", "Four charts, one per cost line", "Q2 $0.50 → Q3 $0.41"],
  ["Source", "None", "Search cost dashboard"],
] as const;

/** The pilot: dated steps, each with an owner. */
const pilot = [
  ["6 Nov", "Titles of your next review, answer first", "Team leads"],
  ["13 Nov", "Search, Payments and Storage present", "Their leads"],
  ["30 Nov", "Days to a decision, against 19", "Developer Experience"],
] as const;

/** Cue lines for the speaker: one thought each, said in their own words. */
const cues = (...lines: string[]) => lines.join("\n");

export const deckExample: DeckSlide[] = [
  {
    id: "answer",
    title: "3 meetings → 1",
    headline: "Review decisions: 3 meetings → 1",
    role: "answer",
    points: ["Same teams, same 6 months", "Only change: the answer moved to slide 1", "Not proof of cause"],
    render: () => (
      <Slide footer={footer} layout="center">
        <h2 className="uipack-deck-title deck-demo-cover-title">Review decisions: 3{"\u00a0"}meetings → 1</h2>
        <ul className="uipack-deck-points deck-demo-cover-points">
          <li>Same teams, same 6 months</li>
          <li>Only change: the answer moved to slide 1</li>
          <li className="deck-demo-caveat">Not proof of cause</li>
        </ul>
      </Slide>
    ),
    notes: {
      say: cues(
        "Answer first: decided in one meeting. Buried: three.",
        "24 platform reviews, April to September.",
        "Ask, up front: your next review's titles by 6 November.",
        "Illustrative numbers. Source: the platform review log.",
      ),
      delivery: "Say one, then three. Stop.",
      next: "What a buried answer costs",
    },
  },
  {
    id: "problem",
    title: "19 days to decide",
    headline: "19 days to decide",
    role: "problem",
    render: () => (
      <Slide footer={footer} layout="split" className="deck-demo-problem">
        <div className="deck-demo-problem__copy">
          <h2 className="uipack-deck-heading">19 days to decide</h2>
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
          <p className="uipack-deck-label">Median of 13 buried-answer reviews</p>
        </div>
      </Slide>
    ),
    notes: {
      say: cues(
        "Meeting 1 ends: what do you need from us?",
        "Meeting 2 ends: which one do you recommend?",
        "Meeting 3: decided. Median 19 days, 13 reviews.",
        "Source: the platform review log.",
      ),
      delivery: "Point at the 19 and hold it. The next slide moves it.",
      next: "The 19 becomes one row",
    },
  },
  {
    id: "evidence",
    title: "Decided in 6 days",
    headline: "Decided in 6 days",
    role: "evidence",
    // The same 19 days travels into its row: the morph says "this number, compared".
    transition: "morph",
    render: () => (
      <Slide footer={footer} className="deck-demo-evidence">
        <h2 className="uipack-deck-heading">Decided in 6 days</h2>
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
      say: cues(
        "Answer first: 11 reviews, 1 meeting, 6 days.",
        "Buried: 13 reviews, 3 meetings, 19 days.",
        "Every same-team pair: answer first decided sooner.",
        "Caveat: can't prove the order caused all of it.",
        "Source: the platform review log, median per group.",
      ),
      delivery: "Trace the two bars, then the meetings column.",
      next: "How to check a review before you give it",
    },
  },
  {
    id: "ghost",
    title: "Which titles fail?",
    headline: "Which titles fail?",
    role: "demo",
    render: () => (
      <Slide footer={footer} className="deck-demo-ghost">
        <h2 className="uipack-deck-heading">Which titles fail?</h2>
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
      say: cues(
        "Live: press G, then Storyline.",
        "The search team's first draft, titles only.",
        "Three flags: a sentence to read out, a plan with no date, an ask with no owner.",
        "Each one is a second meeting.",
      ),
      delivery: "Read the six titles in order, then point at slide 2.",
      next: "Inside slide 2",
    },
  },
  {
    id: "fix",
    title: "Three edits",
    headline: "Three edits",
    role: "mechanism",
    // The ghost deck's flagged card opens into the slide it stands for: the same slide, closer.
    transition: { zoom: "flagged" },
    render: () => (
      <Slide footer={footer} className="deck-demo-fix">
        <h2 className="uipack-deck-heading">Three edits</h2>
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
      say: cues(
        "Title: a label you talk from. Say the 18% aloud.",
        "Proof: one pair of numbers, 50 cents to 41.",
        "Source: the search cost dashboard.",
        "A minute each.",
      ),
      delivery: "Next for the proof, then the source. Back one slide shows the zoom reversing.",
      next: "How we'll try it",
    },
  },
  {
    id: "plan",
    title: "Three pilots by 30 November",
    headline: "Three pilots by 30 November",
    role: "plan",
    invert: true,
    render: () => (
      <Slide footer={footer} className="deck-demo-plan">
        <h2 className="uipack-deck-heading">Three pilots by 30 November</h2>
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
          <span className="uipack-deck-label">Done when</span> pilot median under 10 days (today: 19)
        </p>
      </Slide>
    ),
    notes: {
      say: cues(
        "6 Nov: titles in. 13 Nov: three teams present.",
        "30 Nov: Developer Experience counts days to a decision.",
        "Under 10 days: keep it. Otherwise we stop, and I say so at the next leads' meeting.",
      ),
      delivery: "Read the three dates, then the done-when line.",
      next: "The one thing I need",
    },
  },
  {
    id: "ask",
    title: "Send your titles by 6 November",
    headline: "Send your titles by 6 November",
    role: "ask",
    tone: "accent",
    points: ["Team leads", "Your next review, answer first", "Three rewrites back in 2 working days"],
    render: () => (
      <Slide footer={footer} layout="center">
        <h2 className="uipack-deck-title deck-demo-cover-title">Send your titles by 6{"\u00a0"}November</h2>
        <ul className="uipack-deck-points deck-demo-cover-points">
          <li>Team leads</li>
          <li>Your next review, answer first</li>
          <li>Three rewrites back in 2 working days</li>
        </ul>
        <p className="uipack-deck-label deck-demo-keys">
          ← → or swipe · G for all slides and the Storyline · S for the speaker view · F for full screen
        </p>
      </Slide>
    ),
    notes: {
      say: cues(
        "Just the titles, in order. That's where the argument lives.",
        "Friday 6 November leaves a week to rewrite before the 13 November reviews.",
        "Already answer first? Send it anyway. It becomes the example.",
      ),
      delivery: "End on the date. Leave it up for questions.",
    },
  },
];
