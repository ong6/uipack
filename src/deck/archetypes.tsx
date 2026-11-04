import type { ReactNode } from "react";
import { Slide } from "./parts";
import type { DeckSlide } from "./types";

/*
 * Four slide archetypes over the shared region map (docs/system/layout.md, "Slides"): the eyebrow,
 * the headline and the footer sit where they sit on every slide; each archetype fills only the
 * body region its own way. Colours, faces and radii come from the deck tokens, so each one
 * renders in every style. Content is data: the factories (`sectionSlide`…) take typed words and
 * return a `DeckSlide` whose slots `lintDeck` checks against `SLOT_BUDGETS`.
 */

interface Frame {
  /** The section this slide sits in, 1–4 words. */
  eyebrow: string;
  /** The claim, one sentence. */
  headline: string;
  footer?: ReactNode;
}

export interface SectionSlideProps extends Frame {
  /** The part number, e.g. "02". */
  number: string;
  /** One sentence on what this part proves. */
  lede?: string;
}

/** Section: a divider that still makes a claim. The part number fills the body, large, in the accent. */
export function SectionSlide({ eyebrow, headline, number, lede, footer }: SectionSlideProps) {
  return (
    <Slide eyebrow={eyebrow} footer={footer} layout="section">
      <h2 className="uipack-deck-heading">{headline}</h2>
      {lede && <p className="uipack-deck-lede">{lede}</p>}
      <p className="uipack-deck-section-number" aria-hidden="true">
        {number}
      </p>
    </Slide>
  );
}

export interface QuoteSlideProps extends Frame {
  /** What someone said, at most two sentences. */
  quote: string;
  /** Who said it, by role ("Payments lead, review 7"). */
  attribution: string;
}

/** Quote: the headline states what the quote proves; the body holds the words, in the display face. */
export function QuoteSlide({ eyebrow, headline, quote, attribution, footer }: QuoteSlideProps) {
  return (
    <Slide eyebrow={eyebrow} footer={footer} layout="quote">
      <h2 className="uipack-deck-heading">{headline}</h2>
      <figure className="uipack-deck-quote">
        <blockquote>
          <p>{quote}</p>
        </blockquote>
        <figcaption className="uipack-deck-label">{attribution}</figcaption>
      </figure>
    </Slide>
  );
}

export interface FactSlideProps extends Frame {
  /** The one number, at most six characters ("198", "$8.40"). */
  value: string;
  /** What it counts ("ms at p95"). */
  unit?: string;
  /** The comparison and window ("from 412 ms in Q2"). */
  baseline: string;
  /** The named artifact behind it. */
  source?: string;
}

/** Fact: one number with its unit and baseline, read from across the room. */
export function FactSlide({ eyebrow, headline, value, unit, baseline, source, footer }: FactSlideProps) {
  return (
    <Slide eyebrow={eyebrow} footer={footer} layout="fact">
      <h2 className="uipack-deck-heading">{headline}</h2>
      <div className="uipack-deck-fact">
        <p className="uipack-deck-number">
          {value}
          {unit && <span className="uipack-deck-fact__unit">{unit}</span>}
        </p>
        <p className="uipack-deck-fact__baseline">{baseline}</p>
      </div>
      {source && <p className="uipack-deck-label uipack-deck-fact__source">{source}</p>}
    </Slide>
  );
}

export interface EndSlideProps extends Frame {
  /** The decision or action asked for. */
  action: string;
  /** Who decides or acts: a team or a role. */
  owner: string;
  /** A calendar date. */
  date: string;
  lede?: string;
}

/** End: the ask as a claim, then its three parts in a row: the action, the owner and the date. */
export function EndSlide({ eyebrow, headline, action, owner, date, lede, footer }: EndSlideProps) {
  return (
    <Slide eyebrow={eyebrow} footer={footer} layout="end">
      <h2 className="uipack-deck-heading">{headline}</h2>
      {lede && <p className="uipack-deck-lede">{lede}</p>}
      <dl className="uipack-deck-end">
        <div>
          <dt className="uipack-deck-label">Decision</dt>
          <dd>{action}</dd>
        </div>
        <div>
          <dt className="uipack-deck-label">Owner</dt>
          <dd>{owner}</dd>
        </div>
        <div>
          <dt className="uipack-deck-label">By</dt>
          <dd>{date}</dd>
        </div>
      </dl>
    </Slide>
  );
}

/** What every factory takes besides its archetype's slots: the slide's identity, role and talk. */
type SlideMeta = Omit<DeckSlide, "render" | "headline" | "eyebrow" | "lede" | "slots" | "source">;

/** A section divider as a `DeckSlide`, its words as data. */
export function sectionSlide({ eyebrow, headline, number, lede, footer, ...meta }: SlideMeta & SectionSlideProps): DeckSlide {
  return {
    ...meta,
    headline,
    eyebrow,
    lede,
    slots: { number },
    render: () => <SectionSlide eyebrow={eyebrow} headline={headline} number={number} lede={lede} footer={footer} />,
  };
}

/** A quote slide as a `DeckSlide`. */
export function quoteSlide({ eyebrow, headline, quote, attribution, footer, ...meta }: SlideMeta & QuoteSlideProps): DeckSlide {
  return {
    ...meta,
    headline,
    eyebrow,
    slots: { quote, attribution },
    render: () => <QuoteSlide eyebrow={eyebrow} headline={headline} quote={quote} attribution={attribution} footer={footer} />,
  };
}

/** A fact slide as a `DeckSlide`. Its `source` also satisfies the number-source check. */
export function factSlide({
  eyebrow,
  headline,
  value,
  unit,
  baseline,
  source,
  footer,
  ...meta
}: SlideMeta & FactSlideProps): DeckSlide {
  return {
    ...meta,
    headline,
    eyebrow,
    source,
    slots: { value, baseline, ...(unit ? { unit } : {}), ...(source ? { source } : {}) },
    render: () => (
      <FactSlide
        eyebrow={eyebrow}
        headline={headline}
        value={value}
        unit={unit}
        baseline={baseline}
        source={source}
        footer={footer}
      />
    ),
  };
}

/** An end slide (the ask) as a `DeckSlide`. */
export function endSlide({
  eyebrow,
  headline,
  action,
  owner,
  date,
  lede,
  footer,
  ...meta
}: SlideMeta & EndSlideProps): DeckSlide {
  return {
    ...meta,
    headline,
    eyebrow,
    lede,
    slots: { action, owner, date },
    render: () => (
      <EndSlide eyebrow={eyebrow} headline={headline} action={action} owner={owner} date={date} lede={lede} footer={footer} />
    ),
  };
}
