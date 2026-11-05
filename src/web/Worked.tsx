import type { CSSProperties, ReactNode } from "react";

/* Worked numbers: the mechanism shown as one real calculation (WorkedExample) and a change shown as
   two measured bars (BeforeAfter). Use them instead of an icon flow: the reader sees the input,
   the rule and the result with the product's own numbers. Painted through roles. */

export interface WorkedQuantity {
  value: ReactNode;
  /** The value's unit, set small beside it so "4.8 kg" fits a narrow result column: "kg", "h". */
  unit?: ReactNode;
  /** What the number counts: "covers forecast", "servers". */
  label: ReactNode;
}

export interface WorkedLine {
  /** The rule applied to the input, in words: "one server per 14 covers". */
  rule: ReactNode;
  /** The arithmetic, mono: "84 ÷ 14 = 6". */
  working?: ReactNode;
  result: WorkedQuantity;
}

export interface WorkedExampleProps {
  /** Which case this is: "Friday, 19:00". */
  title?: ReactNode;
  /** The input every line starts from. */
  given: WorkedQuantity;
  /** One line per rule, each ending in a result. */
  lines: WorkedLine[];
  /** One line under the sheet: an exception, a rounding rule, where the input came from. */
  note?: ReactNode;
  /** Accessible name; default the title. */
  label?: string;
  className?: string;
}

/**
 * One worked case of the product's rule: the input on the start edge, a bracket into each rule with
 * its arithmetic, and each result on the end edge. Stacks below 720px.
 */
export function WorkedExample({ title, given, lines, note, label, className = "" }: WorkedExampleProps) {
  return (
    <div
      className={`uipack-web-worked ${className}`.trim()}
      role="group"
      aria-label={label ?? (typeof title === "string" ? title : "Worked example")}
    >
      {title && <p className="uipack-web-worked__title">{title}</p>}
      <div className="uipack-web-worked__sheet" style={{ "--lines": lines.length } as CSSProperties}>
        <div className="uipack-web-worked__given">
          <Value q={given} />
          <span className="uipack-web-worked__label">{given.label}</span>
        </div>
        <ol className="uipack-web-worked__lines">
          {lines.map((l, i) => (
            <li key={i}>
              <span className="uipack-web-worked__rule">
                <span>{l.rule}</span>
                {l.working && <code>{l.working}</code>}
              </span>
              <span className="uipack-web-worked__arrow" aria-hidden="true" />
              <span className="uipack-web-worked__result">
                <Value q={l.result} />
                <span className="uipack-web-worked__label">{l.result.label}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      {note && <p className="uipack-web-worked__note">{note}</p>}
    </div>
  );
}

function Value({ q }: { q: WorkedQuantity }) {
  return (
    <span className="uipack-web-worked__value">
      {q.value}
      {q.unit !== undefined && <small> {q.unit}</small>}
    </span>
  );
}

export interface BeforeAfterSide {
  value: ReactNode;
  /** What the value is and where it came from: "owners' estimate". */
  label: ReactNode;
  /** The value as a plain number in one unit (minutes, pounds), so the bars are to scale. */
  measure: number;
}

export interface BeforeAfterProps {
  before: BeforeAfterSide;
  after: BeforeAfterSide;
  /** The change in a few words, shown as the headline: "16× faster". */
  change?: ReactNode;
  /** The two tags. Default "Before" and "After". */
  tags?: [ReactNode, ReactNode];
  className?: string;
}

/** A measured before/after: two bars drawn to scale, the after one in the accent, and the change. */
export function BeforeAfter({ before, after, change, tags = ["Before", "After"], className = "" }: BeforeAfterProps) {
  const max = Math.max(before.measure, after.measure, Number.EPSILON);
  const side = (s: BeforeAfterSide, tag: ReactNode, key: "before" | "after") => (
    <div className="uipack-web-compare__row" data-side={key}>
      <dt>
        <span className="uipack-web-compare__tag">{tag}</span>
        <span className="uipack-web-compare__label">{s.label}</span>
      </dt>
      <dd>
        <span
          className="uipack-web-compare__bar"
          style={{ "--v": Math.max(0.012, s.measure / max) } as CSSProperties}
          aria-hidden="true"
        />
        <span className="uipack-web-compare__value">{s.value}</span>
      </dd>
    </div>
  );
  return (
    <div className={`uipack-web-compare ${className}`.trim()}>
      {change && <p className="uipack-web-compare__change">{change}</p>}
      <dl>
        {side(before, tags[0], "before")}
        {side(after, tags[1], "after")}
      </dl>
    </div>
  );
}
