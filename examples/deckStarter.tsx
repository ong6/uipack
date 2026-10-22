// A first deck in five minutes (docs/deck.md): copy this file into your app, change the two imports
// to "uipack/deck" and "uipack/deck.css", then rewrite it slide by slide. It starts from the
// project-update storyline; change TEMPLATE for another (decision-request, deep-dive, launch-demo,
// postmortem, review-highlights). Every number below is a placeholder.
import { DeckPlayer, Slide, lintDeck, starterDeck, type DeckSlide, type StorylineTemplateId } from "../src/deck";
import "../src/deck/deck.css";

const TEMPLATE: StorylineTemplateId = "project-update";
const footer = "Search platform · Q3 review";

// 1. A playable draft: one stub slide per beat of the template, titled with its example claim.
const draft = starterDeck(TEMPLATE, { footer });

// 2. Replace stubs one at a time. Keep each stub's id and role; write the headline first (the
//    claim a reader should repeat), then the slide that proves it, then what you'll say.
const rewritten: Record<string, Partial<DeckSlide>> = {
  [`${TEMPLATE}-1`]: {
    title: "Twice as fast",
    headline: "Search got twice as fast this quarter, and cheaper to run.",
    render: () => (
      <Slide eyebrow="Q3 review" footer={footer} layout="center">
        <h2 className="uipack-deck-title">Search got twice as fast this quarter, and cheaper to run.</h2>
        <p className="uipack-deck-lede">p95 latency fell from 412 ms to 198 ms while cost per query dropped 18%.</p>
      </Slide>
    ),
    notes: {
      say: "Search is twice as fast as in Q2 and costs less to serve. Source: the latency and cost dashboards.",
      delivery: "State both numbers slowly.",
      next: "Here's where the speed came from.",
    },
  },
  // …one entry per slide you have rewritten.
};

export const slides: DeckSlide[] = draft.map((s) => ({ ...s, ...rewritten[s.id] }));

// 3. Check the argument while you write; the overview's Storyline tab shows the same findings.
//    Remove the `lint` prop before you present.
export const findings = lintDeck(slides, { template: TEMPLATE, minutes: 10 });

export default function Talk() {
  return <DeckPlayer id="q3-review" title="Q3 search review" slides={slides} lint={{ template: TEMPLATE, minutes: 10 }} />;
}
