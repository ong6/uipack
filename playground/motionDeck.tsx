import { CountUp, LetterReveal, Polyhedra, Slide, type DeckSlide } from "../src/deck";
// The Motion style's value set, loaded with the deck that uses it (main.tsx loads Technical's only).
import "../src/styles/motion.css";
import "./motion-deck.css";

/*
 * The Motion style's example deck: a short talk about the style itself, presented in it. Every
 * number is a fact about uipack (the deck's clock in src/deck/transitions.ts, the style's parts);
 * only the closing ask (who, by when) is illustrative. Each slide arrives by a different whole-slide
 * move, so the deck is also the reference for them; a real talk would pick one or two.
 */

const footer = "The Motion style · uipack/deck";
const cues = (...lines: string[]) => lines.join("\n");
/** Where the clock's numbers live, for the talk track's source line. */
const clockSource = "Source: https://github.com/ong6/uipack/blob/main/src/deck/transitions.ts (deckMotion).";

/** The six whole-slide moves, what each says, and its clock. */
const moves = [
  ["push", "Next in a sequence", "560 ms"],
  ["flip", "The other side of the same thing", "760 ms"],
  ["cube", "A new face of the topic", "760 ms"],
  ["shutter", "A reveal: the answer behind the question", "560 ms"],
  ["blinds", "A list arriving, left to right", "560 ms"],
  ["rise", "A statement coming into focus", "560 ms"],
] as const;

/** The deck's one clock (deckMotion), in milliseconds. */
const clock = [
  [160, "quick", "the outgoing slide is gone"],
  [320, "base", "blocks settle"],
  [560, "slow", "a slide pushes, opens or rises"],
  [760, "morph", "a slide turns: flip and cube"],
] as const;

/** The style's parts, as the second slide counts them. */
const parts = [
  [6, "whole-slide moves", "push, flip, cube, shutter, blinds, rise"],
  [3, "kinetic parts", "CountUp, LetterReveal, Polyhedra"],
  [1, "accent", "vermilion orange; red stays a data colour"],
] as const;

/** The deck's backdrop: the style's one ambient effect. */
export const motionBackdrop = <Polyhedra count={10} seed={7} />;

const coverPoints = ["uipack/deck", "Motion style", "6 moves, 560–760 ms each"];

export const motionDeck: DeckSlide[] = [
  {
    id: "cover",
    title: "The slide moves with the story",
    headline: "The slide moves with the story",
    role: "cover",
    points: coverPoints,
    transition: "rise",
    render: () => (
      <Slide footer={footer} layout="center" className="motion-demo-cover">
        <p className="motion-demo-tag">A talk in the Motion style</p>
        <h2 className="uipack-deck-title motion-demo-cover__title">
          The slide moves <LetterReveal className="uipack-deck-em">with the story</LetterReveal>
        </h2>
        <ul className="motion-demo-meta">
          {coverPoints.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <span className="motion-demo-cover__rule" aria-hidden="true" />
      </Slide>
    ),
    notes: {
      delivery: "Let the rise land, then speak.",
      say: cues("A deck where the slide itself travels.", "Every number here is a fact about uipack.", clockSource),
      next: "What the style brings",
    },
  },
  {
    id: "contents",
    title: "Six moves, three parts",
    headline: "Six moves, three parts",
    role: "answer",
    eyebrow: "The style",
    points: ["6 whole-slide moves, 560–760 ms", "3 kinetic parts", "1 accent: vermilion orange"],
    transition: "push",
    render: () => (
      <Slide footer={footer} eyebrow="The style">
        <h2 className="uipack-deck-heading">Six moves, three parts</h2>
        <div className="motion-demo-cards">
          {parts.map(([n, what, detail], i) => (
            <article key={what} className="motion-demo-card">
              <p className="motion-demo-card__label">
                {String(i + 1).padStart(2, "0")} · {what}
              </p>
              <p className="motion-demo-card__value">
                <CountUp value={n} />
              </p>
              <p className="motion-demo-card__detail">{detail}</p>
            </article>
          ))}
        </div>
      </Slide>
    ),
    notes: {
      delivery: "Point at each card as it lands.",
      say: cues("That is the whole kit.", "Everything after this shows one piece of it at work.", clockSource),
      next: "Why only orange",
    },
  },
  {
    id: "accent",
    title: "One accent",
    headline: "One accent: everything else ink",
    role: "context",
    eyebrow: "Palette",
    transition: "rise",
    render: () => (
      <Slide footer={footer} eyebrow="Palette" layout="center">
        <h2 className="uipack-deck-title motion-demo-statement">
          One accent: <LetterReveal className="uipack-deck-em">everything else ink</LetterReveal>
        </h2>
      </Slide>
    ),
    notes: {
      delivery: "Pause on the orange line.",
      say: cues("Warm grey paper, near-black type.", "Orange marks the single thing the room should look at."),
      next: "Which move, when",
    },
  },
  {
    id: "moves",
    title: "Which move, when?",
    headline: "Which move, when?",
    role: "mechanism",
    eyebrow: "Transitions",
    transition: "flip",
    render: () => (
      <Slide footer={footer} eyebrow="Transitions" layout="split" className="motion-demo-moves">
        <div>
          <h2 className="uipack-deck-heading">Which move, when?</h2>
          <p className="uipack-deck-body motion-demo-muted">Pick the move by what the slide says, then keep to it.</p>
        </div>
        <table className="motion-demo-table">
          <thead>
            <tr>
              <th scope="col">Move</th>
              <th scope="col">Says</th>
              <th scope="col">Clock</th>
            </tr>
          </thead>
          <tbody>
            {moves.map(([name, says, ms]) => (
              <tr key={name} data-current={name === "flip" ? "" : undefined}>
                <th scope="row">{name}</th>
                <td>{says}</td>
                <td>{ms}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Slide>
    ),
    notes: {
      delivery: "Name the highlighted row: this slide arrived by it.",
      say: cues("A move is a sentence the audience feels.", "Choose by meaning, then stay consistent."),
      next: "The count",
    },
  },
  {
    id: "count",
    title: "A number lands in 1,200 ms",
    headline: "A number lands in 1,200 ms",
    role: "evidence",
    eyebrow: "CountUp",
    transition: "cube",
    render: () => (
      <Slide footer={footer} eyebrow="CountUp">
        <h2 className="uipack-deck-heading motion-demo-count">
          A number lands in{" "}
          <span className="motion-demo-big">
            <CountUp value={1200} /> <span className="motion-demo-big__unit">ms</span>
          </span>
        </h2>
        <p className="uipack-deck-label">deckMotion.count · eases out · the final value holds the width</p>
      </Slide>
    ),
    notes: {
      delivery: "Let it finish counting before you speak.",
      say: cues("Long enough to feel, short enough not to wait for.", "Thumbnails and print show the final value.", clockSource),
      next: "Slide or blocks",
    },
  },
  {
    id: "two-kinds",
    title: "Move the slide, or its blocks?",
    headline: "Move the slide, or its blocks?",
    role: "option",
    eyebrow: "Grammar",
    transition: "blinds",
    render: () => (
      <Slide footer={footer} eyebrow="Grammar">
        <h2 className="uipack-deck-heading">Move the slide, or its blocks?</h2>
        <div className="motion-demo-pair">
          <article className="motion-demo-col" data-tone-rule="accent">
            <p className="uipack-deck-label">The slide moves</p>
            <p className="motion-demo-col__title">Whole-slide moves</p>
            <ul className="motion-demo-list">
              <li>push, flip, cube</li>
              <li>shutter, blinds, rise</li>
              <li>for a talk that wants energy</li>
            </ul>
          </article>
          <article className="motion-demo-col" data-tone-rule="ink">
            <p className="uipack-deck-label">The blocks move</p>
            <p className="motion-demo-col__title">Block moves</p>
            <ul className="motion-demo-list">
              <li>advance, morph, zoom</li>
              <li>the same thing on two slides</li>
              <li>for a review that wants calm</li>
            </ul>
          </article>
        </div>
      </Slide>
    ),
    notes: {
      delivery: "Left column first.",
      say: cues("Two grammars in one player.", "A conference talk wants the left; a quarterly review, the right."),
      next: "How fast",
    },
  },
  {
    id: "clock",
    title: "One clock, 160–760 ms",
    headline: "One clock, 160–760 ms",
    role: "evidence",
    eyebrow: "Timing",
    transition: "shutter",
    render: () => (
      <Slide footer={footer} eyebrow="Timing">
        <h2 className="uipack-deck-heading">One clock, 160–760 ms</h2>
        <div className="motion-demo-cards motion-demo-cards--four">
          {clock.map(([ms, name, what]) => (
            <article key={name} className="motion-demo-card">
              <p className="motion-demo-card__label">{name}</p>
              <p className="motion-demo-card__value motion-demo-card__value--ink">
                <CountUp value={ms} suffix=" ms" />
              </p>
              <p className="motion-demo-card__detail">{what}</p>
            </article>
          ))}
        </div>
      </Slide>
    ),
    notes: {
      delivery: "Sweep left to right.",
      say: cues("Shared by every deck in every style.", "A style picks the curves, never the timings.", clockSource),
      next: "Reduced motion",
    },
  },
  {
    id: "reduced",
    title: "Reduced motion: a 160 ms fade",
    headline: "Reduced motion: a 160 ms fade",
    role: "risk",
    eyebrow: "Access",
    invert: true,
    transition: "fade",
    render: () => (
      <Slide footer={footer} eyebrow="Access" layout="center">
        <h2 className="uipack-deck-title motion-demo-statement">
          Reduced motion: <span className="uipack-deck-em">a 160 ms fade</span>
        </h2>
      </Slide>
    ),
    notes: {
      delivery: "Slow down here.",
      say: cues(
        "The viewer's setting wins over the deck's.",
        "The backdrop stops, counts show their value, letters show whole.",
        clockSource,
      ),
      next: "The ask",
    },
  },
  {
    id: "end",
    title: "Try one move by 4 December",
    headline: "Try one move by 4 December",
    role: "ask",
    transition: "cube",
    render: () => (
      <Slide footer={footer} layout="center">
        <h2 className="uipack-deck-title motion-demo-cover__title">
          Try one move <LetterReveal className="uipack-deck-em">by 4 December</LetterReveal>
        </h2>
        <p className="uipack-deck-label motion-demo-code">
          {'<DeckPlayer uiStyle="motion" backdrop={<Polyhedra />} transition="push" />'}
        </p>
      </Slide>
    ),
    notes: {
      delivery: "Leave the line of code on screen for questions.",
      say: cues(
        "Talk owners: pick one move for your next deck by 4 December.",
        "Illustrative ask: the owner and date are an example.",
      ),
      next: "Questions",
    },
  },
];
