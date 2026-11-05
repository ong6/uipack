import type { CSSProperties, ReactNode } from "react";
import { CtaButton } from "./CtaButton";
import { Body, Eyebrow, Heading } from "./Text";
import { BeforeAfter, type BeforeAfterProps } from "./Worked";

/* The landing page's closing parts: proof (numbers and a quote), pricing, the closing call to
   action and the footer. Each is one layout in every style; the style paints it through roles
   (frame, radius, display face, the band roles), so a swap never moves a box. */

export interface ProofStat {
  value: ReactNode;
  /** What the number measures, in a few words. */
  label: ReactNode;
}

export interface ProofLead extends ProofStat {
  /** The denominator, set small beside the value: "of 1,263". */
  of?: ReactNode;
  /** 0–1: draws a meter under the number (1,240 / 1,263 → 0.982). */
  ratio?: number;
}

export interface ProofQuote {
  /** The quote itself, without quotation marks: the block draws them (the opening one hangs). */
  text: ReactNode;
  name: ReactNode;
  role?: ReactNode;
}

export interface ProofProps {
  /** The headline number: large, with its denominator and an optional meter. */
  lead?: ProofLead;
  /**
   * A measured change instead of (or before) the lead number: two bars to scale ("~2.5 h" before,
   * "9 min" after). Use it when the proof is a before/after, not "x of N".
   */
  compare?: BeforeAfterProps;
  /** Two to four supporting numbers in a ruled row. */
  stats?: ProofStat[];
  quote?: ProofQuote;
  className?: string;
}

/**
 * Proof in one block: the headline number (with what it is out of), supporting numbers, and a
 * named quote in a framed card beside them (stacked below 1024px). Put it inside a `Section`.
 */
export function Proof({ lead, compare, stats = [], quote, className = "" }: ProofProps) {
  const ratio = lead?.ratio === undefined ? undefined : Math.min(1, Math.max(0, lead.ratio));
  return (
    <div className={`uipack-web-proof ${className}`.trim()} data-has-quote={quote ? "" : undefined}>
      {(lead || compare || stats.length > 0) && (
        <div className="uipack-web-proof__numbers">
          {compare && <BeforeAfter {...compare} />}
          {lead && (
            <div className="uipack-web-proof__lead">
              <p className="uipack-web-proof__value">
                <span>{lead.value}</span>
                {lead.of && <small>{lead.of}</small>}
              </p>
              <Body emphasis="medium">{lead.label}</Body>
              {ratio !== undefined && (
                <span
                  className="uipack-web-proof__meter"
                  role="img"
                  aria-label={`${Math.round(ratio * 1000) / 10}%`}
                  style={{ "--ratio": ratio } as CSSProperties}
                />
              )}
            </div>
          )}
          {stats.length > 0 && (
            <dl className="uipack-web-proof__stats">
              {stats.map((s, i) => (
                <div key={i}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
      {quote && (
        <figure className="uipack-web-quote">
          <blockquote>
            <p>{quote.text}</p>
          </blockquote>
          <figcaption>
            <strong>{quote.name}</strong>
            {quote.role && <span>{quote.role}</span>}
          </figcaption>
        </figure>
      )}
    </div>
  );
}

export interface PricingAction {
  label: ReactNode;
  href: string;
}

export interface PricingPlan {
  name: ReactNode;
  /** "$9", "$0", "Free". Set in the display face. */
  price: ReactNode;
  /** "a month", "/month". */
  period?: ReactNode;
  /** One line: who the plan is for. */
  summary?: ReactNode;
  /** What the plan includes, one short line each. */
  features?: ReactNode[];
  /** The plan's button, pinned to the card's foot. */
  action?: PricingAction;
  /** The plan to steer towards: accent frame and the primary button. */
  featured?: boolean;
  /** A short tag on the featured plan: "Unlimited". */
  badge?: ReactNode;
}

export interface PricingPlansProps {
  plans: PricingPlan[];
  /** Fine print under the plans: "Prices in USD. Cancel any time." */
  note?: ReactNode;
  className?: string;
}

const Check = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className="uipack-web-plan__check">
    <path
      d="M3.5 8.5l3 3 6-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Plan cards that share a row and a height: name, price, who it is for, what it includes and its
 * own button at the foot. One to three plans fill the column evenly (one column below 640px).
 */
export function PricingPlans({ plans, note, className = "" }: PricingPlansProps) {
  return (
    <div className={`uipack-web-pricing ${className}`.trim()}>
      <ul className="uipack-web-pricing__plans" style={{ "--plans": Math.min(3, plans.length) } as CSSProperties}>
        {plans.map((p, i) => (
          <li key={i} className="uipack-web-plan" data-featured={p.featured ? "" : undefined}>
            <div className="uipack-web-plan__head">
              <Heading level={3} size={1} className="uipack-web-plan__name">
                {p.name}
              </Heading>
              {p.badge && <span className="uipack-web-plan__badge">{p.badge}</span>}
            </div>
            <p className="uipack-web-plan__price">
              <span>{p.price}</span>
              {p.period && <small>{p.period}</small>}
            </p>
            {p.summary && <Body>{p.summary}</Body>}
            {p.features && p.features.length > 0 && (
              <ul className="uipack-web-plan__features">
                {p.features.map((f, j) => (
                  <li key={j}>
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
            {p.action && (
              <div className="uipack-web-plan__action">
                <CtaButton href={p.action.href} variant={p.featured ? "primary" : "secondary"}>
                  {p.action.label}
                </CtaButton>
              </div>
            )}
          </li>
        ))}
      </ul>
      {note && <p className="uipack-web-pricing__note">{note}</p>}
    </div>
  );
}

export interface ClosingCtaProps {
  title: ReactNode;
  intro?: ReactNode;
  /** The page's one goal, a third time. */
  action: PricingAction;
  /** Small reassurance under the button: "No sign-up. Runs in your browser." */
  note?: ReactNode;
  eyebrow?: ReactNode;
  id?: string;
  className?: string;
}

/**
 * The closing call to action: a full-bleed band painted with the style's band roles (Technical:
 * ink with mint; Graphical: signal orange; Landing: deep indigo), the claim on the start edge and
 * the button beside it (below it on a phone).
 */
export function ClosingCta({ title, intro, action, note, eyebrow, id, className = "" }: ClosingCtaProps) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} className={`uipack-web-closing ${className}`.trim()} aria-labelledby={headingId}>
      <div className="uipack-web-closing__inner">
        <div className="uipack-web-closing__copy">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <Heading level={2} size={5} id={headingId}>
            {title}
          </Heading>
          {intro && <p className="uipack-web-closing__intro">{intro}</p>}
        </div>
        <div className="uipack-web-closing__action">
          <a className="uipack-web-cta uipack-web-closing__cta" data-size="lg" data-variant="primary" href={action.href}>
            {action.label}
          </a>
          {note && <p className="uipack-web-closing__note">{note}</p>}
        </div>
      </div>
    </section>
  );
}

export interface SiteFooterProps {
  /** The wordmark, as in the nav. */
  brand: ReactNode;
  links?: { label: ReactNode; href: string }[];
  /** Fine print: "© 2026 Ledgerline". */
  note?: ReactNode;
  /** Anything else for the footer's end edge (a style or theme switcher). */
  children?: ReactNode;
  className?: string;
}

/** The page's foot: brand and links on one rule, fine print below. The page ends here, not mid-section. */
export function SiteFooter({ brand, links = [], note, children, className = "" }: SiteFooterProps) {
  return (
    <footer className={`uipack-web-footer ${className}`.trim()}>
      <div className="uipack-web-footer__inner">
        <div className="uipack-web-footer__brand">{brand}</div>
        {links.length > 0 && (
          <nav aria-label="Footer" className="uipack-web-footer__nav">
            <ul>
              {links.map((l, i) => (
                <li key={i}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {children && <div className="uipack-web-footer__extra">{children}</div>}
        {note && <p className="uipack-web-footer__note">{note}</p>}
      </div>
    </footer>
  );
}

export interface BrandProps {
  children: ReactNode;
  href?: string;
}

/** A text wordmark in the style's display face (Graphical's caps, Landing's serif, Technical's sans). */
export function Brand({ children, href }: BrandProps) {
  return href ? (
    <a className="uipack-web-brand" href={href}>
      {children}
    </a>
  ) : (
    <span className="uipack-web-brand">{children}</span>
  );
}
