// A first deck in five minutes (docs/deck.md): copy this file into your app, change the two imports
// to "uipack/deck" and "uipack/deck.css", then rewrite it slide by slide. It starts from the
// project-update storyline; change TEMPLATE for another (decision-request, deep-dive, launch-demo,
// postmortem, review-highlights). Every slide below is one example project, a search index
// migration, written over the template's stubs; every number is a placeholder.
//
// It is a presented deck: short titles you talk from, the numbers in 2–4 fragment points, and notes
// as cues (the claim to say, the number to point at, the bridge), not a script. For a deck people
// read without you, lint it with mode "read-alone" and write each title as the full conclusion.
import { DeckPlayer, PointsSlide, lintDeck, starterDeck, type DeckSlide, type StorylineTemplateId } from "../src/deck";
import "../src/deck/deck.css";

const TEMPLATE: StorylineTemplateId = "project-update";
const footer = "Search platform · Index migration update";

// 1. A playable draft: one stub slide per beat of the template, with its example title and points.
const draft = starterDeck(TEMPLATE, { footer });

/** A written slide: a short title and the points that carry its numbers, as data and on screen. */
const written = (title: string, headline: string, points: string[]): Partial<DeckSlide> => ({
  title,
  headline,
  points,
  render: () => <PointsSlide headline={headline} points={points} footer={footer} />,
});

/** Cue lines: one thought each, said in your own words. */
const cues = (...lines: string[]) => lines.join("\n");

// 2. Replace stubs one at a time. Keep each stub's id and role; write the title and points first
//    (read the titles in order: that's the ghost deck), then the cues for what you'll say.
const rewritten: Record<string, Partial<DeckSlide>> = {
  [`${TEMPLATE}-1`]: {
    ...written("On track", "Index migration: on track", ["70% of queries moved", "No regressions", "Cutover 30 May"]),
    notes: {
      say: cues(
        "On track. 70% of queries run on the new index.",
        "No regressions in latency or relevance.",
        "One decision needed from Platform leads: last slide.",
        "Source: the migration dashboard, this morning's traffic split.",
      ),
      delivery: "Say 'on track' first, then the number.",
      next: "The number that matters most",
    },
  },
  [`${TEMPLATE}-2`]: {
    ...written("Freshness", "Freshness: 40 → 6 min", ["Goal: 10 min", "p95, last 14 days, migrated traffic"]),
    notes: {
      say: cues(
        "Freshness is why we're migrating.",
        "An edit shows up in search in 6 minutes. It used to take 40.",
        "Migrated against old traffic: not a controlled test.",
        "Source: the freshness dashboard.",
      ),
      delivery: "Point at the goal, not the old number.",
      next: "Where the plan stands",
    },
  },
  [`${TEMPLATE}-3`]: {
    ...written("Milestones", "Milestones: 4 of 6", [
      "Done: schema, dual writes, shadow reads, 70%",
      "Backfill 2 weeks late: storage quota",
      "Quota raised last Tuesday",
    ]),
    notes: {
      say: cues(
        "Four done. Backfill slipped two weeks on quota.",
        "Quota landed last Tuesday, backfill running again.",
        "We now check quota before every large job.",
        "Source: the migration tracker.",
      ),
      delivery: "Say the slip plainly, with its cause.",
      next: "One risk could still move the date",
    },
  },
  [`${TEMPLATE}-4`]: {
    ...written("Risk", "Could cutover slip?", [
      "Shard rebalancing may run long",
      "Dry run on 12 May",
      "Over six hours: cutover moves a week",
    ]),
    notes: {
      say: cues(
        "One risk: shard rebalancing at cutover.",
        "The 12 May dry run decides. If it moves, you hear on 13 May.",
        "The rest is work we've done on 70% of traffic already.",
      ),
      delivery: "One risk, one tripwire.",
      next: "Three dates",
    },
  },
  [`${TEMPLATE}-5`]: {
    ...written("Next", "Next: cutover 30 May", ["12 May: dry run", "20 May: schema freeze", "June: old cluster retired"]),
    notes: {
      say: cues(
        "Read the dates in order.",
        "Retiring the old cluster saves its running cost from July.",
        "A short note from me after each date.",
      ),
      delivery: "Read the dates in order.",
      next: "The one thing we need from you",
    },
  },
  [`${TEMPLATE}-6`]: {
    ...written("The ask", "Approve a schema freeze", [
      "Platform leads",
      "Two weeks from 20 May",
      "Without it: a second backfill",
    ]),
    notes: {
      say: cues(
        "Platform leads: approve a two-week freeze on index schema changes from 20 May.",
        "Without it, a schema change during cutover costs another backfill.",
      ),
      delivery: "Stop after the ask and wait for an answer.",
    },
  },
};

export const slides: DeckSlide[] = draft.map((s) => ({ ...s, ...rewritten[s.id] }));

// 3. Check the argument while you write; the overview's Storyline tab shows the same findings.
//    Every slide here is written, so the list is empty. Remove the `lint` prop before you present.
export const findings = lintDeck(slides, { template: TEMPLATE });

export default function Talk() {
  return (
    <DeckPlayer id="index-migration" title="Index migration update" slides={slides} lint={{ template: TEMPLATE }} minutes={6} />
  );
}
