// A first deck in five minutes (docs/deck.md): copy this file into your app, change the two imports
// to "uipack/deck" and "uipack/deck.css", then rewrite it slide by slide. It starts from the
// project-update storyline; change TEMPLATE for another (decision-request, deep-dive, launch-demo,
// postmortem, review-highlights). Every slide below is one example project, a search index
// migration, written over the template's stubs; every number is a placeholder.
import { DeckPlayer, Slide, lintDeck, starterDeck, type DeckSlide, type StorylineTemplateId } from "../src/deck";
import "../src/deck/deck.css";

const TEMPLATE: StorylineTemplateId = "project-update";
const footer = "Search platform · Index migration update";

// 1. A playable draft: one stub slide per beat of the template, titled with its example claim.
const draft = starterDeck(TEMPLATE, { footer });

/** A written slide: the claim as the heading, then the lines that prove it. */
const page = (eyebrow: string, headline: string, lines: string[]) => () => (
  <Slide eyebrow={eyebrow} footer={footer}>
    <h2 className="uipack-deck-heading">{headline}</h2>
    {lines.map((line) => (
      <p key={line} className="uipack-deck-lede">
        {line}
      </p>
    ))}
  </Slide>
);

// 2. Replace stubs one at a time. Keep each stub's id and role; write the headline first (the
//    claim a reader should repeat), then the slide that proves it, then what you'll say.
const rewritten: Record<string, Partial<DeckSlide>> = {
  [`${TEMPLATE}-1`]: {
    title: "On track",
    headline: "The index migration is on track: 70% of queries moved, no regressions.",
    render: () => (
      <Slide eyebrow="Index migration · status" footer={footer} layout="center">
        <h2 className="uipack-deck-title">The index migration is on track: 70% of queries moved, no regressions.</h2>
        <p className="uipack-deck-lede">Full cutover on 30 May; one decision needed from Platform leads by 20 May.</p>
      </Slide>
    ),
    notes: {
      say: "The migration to the new search index is on track. Seventy percent of queries now run on it, with no regressions in latency or relevance, and full cutover is planned for the thirtieth of May. I need one decision from the Platform leads, which is the last slide. Source: the migration dashboard, traffic split as of this morning.",
      delivery: "Say 'on track' first, then the number.",
      next: "The number that matters most is freshness.",
    },
  },
  [`${TEMPLATE}-2`]: {
    title: "Freshness",
    headline: "Index freshness improved from 40 minutes to 6 against a 10-minute goal",
    render: page("Evidence · freshness", "Index freshness improved from 40 minutes to 6 against a 10-minute goal", [
      "p95 time from a document change to search, last 14 days, migrated traffic.",
    ]),
    notes: {
      say: "Freshness is why we're migrating. A changed document used to take forty minutes to show up in search; on the new index it takes six, against a goal of ten. That's p95 over the last fourteen days, on migrated traffic. For the teams that publish documentation and prices, it means an edit is searchable before anyone thinks to check. Source: the freshness dashboard.",
      delivery: "Point at the goal line, not the old number.",
      next: "Here's where the plan stands.",
    },
  },
  [`${TEMPLATE}-3`]: {
    title: "Milestones",
    headline: "Four of six milestones are done; backfill slipped two weeks on quota",
    render: page("Evidence · plan", "Four of six milestones are done; backfill slipped two weeks on quota", [
      "Done: schema, dual writes, shadow reads, 70% traffic. Left: backfill, cutover.",
    ]),
    notes: {
      say: "Four of six milestones are done: the schema, dual writes, shadow reads, and moving seventy percent of traffic. The backfill slipped two weeks because we hit our storage quota; the quota increase landed last Tuesday and the backfill is running again. We now check quota before every large job, so the same slip can't happen at cutover. Source: the migration tracker.",
      delivery: "Say the slip plainly, with its cause.",
      next: "One risk could still move the date.",
    },
  },
  [`${TEMPLATE}-4`]: {
    title: "Risk",
    headline: "Shard rebalancing could delay cutover; a dry run on 12 May will tell us",
    render: page("Risk", "Shard rebalancing could delay cutover; a dry run on 12 May will tell us", [
      "If the dry run takes over six hours, cutover moves a week and we tell you on 13 May.",
    ]),
    notes: {
      say: "The one risk is shard rebalancing at cutover. If it runs long, cutover moves by a week. A dry run on the twelfth of May will tell us; if it takes more than six hours, we move the date and tell you the next day. Nothing else on the plan depends on luck: the remaining work is the same work we've already done on seventy percent of traffic.",
      delivery: "One risk, one tripwire.",
      next: "So the plan is three dates.",
    },
  },
  [`${TEMPLATE}-5`]: {
    title: "Next",
    headline: "Next: full cutover by 30 May, then the old cluster is retired in June",
    render: page("Plan", "Next: full cutover by 30 May, then the old cluster is retired in June", [
      "12 May dry run · 20 May schema freeze · 30 May cutover · June retirement.",
    ]),
    notes: {
      say: "Next, the dry run on the twelfth of May, a schema freeze from the twentieth, full cutover by the thirtieth, and then we retire the old cluster in June, which saves its running cost from July. Each date has one owner on the search team, and you'll get a short note from me after each one.",
      delivery: "Read the dates in order.",
      next: "The freeze is the one thing we need from you.",
    },
  },
  [`${TEMPLATE}-6`]: {
    title: "The ask",
    headline: "We need Platform leads to approve a two-week schema freeze from 20 May",
    render: page("Decision needed · Platform leads", "We need Platform leads to approve a two-week schema freeze from 20 May", [
      "Without it, schema changes during cutover would need a second backfill.",
    ]),
    notes: {
      say: "One ask, for the Platform leads: approve a two-week freeze on index schema changes from the twentieth of May. Without it, any schema change during cutover means a second backfill and another two weeks.",
      delivery: "Stop after the ask and wait for an answer.",
    },
  },
};

export const slides: DeckSlide[] = draft.map((s) => ({ ...s, ...rewritten[s.id] }));

// 3. Check the argument while you write; the overview's Storyline tab shows the same findings.
//    Every slide here is written, so the list is empty. Remove the `lint` prop before you present.
export const findings = lintDeck(slides, { template: TEMPLATE });

export default function Talk() {
  return <DeckPlayer id="index-migration" title="Index migration update" slides={slides} lint={{ template: TEMPLATE }} minutes={6} />;
}
