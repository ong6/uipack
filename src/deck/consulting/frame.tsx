import { Children, type CSSProperties, type ReactNode } from "react";
import { Morph, useDeckSlide } from "../parts";

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

export interface TrackerProps {
  /** Section names, in deck order. */
  sections: readonly string[];
  /** The current section: its index or its name. */
  current: number | string;
}

/** Section breadcrumb across the top. The current section is marked by a filled square, weight and an underline, not colour alone. */
export function Tracker({ sections, current }: TrackerProps) {
  const at = typeof current === "number" ? current : sections.indexOf(current);
  return (
    <nav className="uipack-cx-tracker" aria-label="Sections">
      <ol>
        {sections.map((s, i) => (
          <li key={s} aria-current={i === at ? "step" : undefined} data-done={i < at ? "" : undefined}>
            <i aria-hidden="true" />
            {s}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export interface ConsultingSlideProps {
  /** Section breadcrumb. Pass `{ sections, current }`. */
  tracker?: TrackerProps;
  /** The action title: one full-sentence takeaway, at most two lines. Wrap a number in `Morph as="span"` to carry it between slides. */
  title: ReactNode;
  /** Unit and period: "Revenue, $M, FY22–FY25". */
  subtitle?: ReactNode;
  /** A stamp at the top right: "Illustrative", "Preliminary", "Draft". */
  sticker?: ReactNode;
  /** A "So what" strip under the body. For a column instead, put a `SoWhat` in the grid. */
  takeaway?: ReactNode;
  takeawayLabel?: ReactNode;
  /** Numbered footnotes. Reference them in the body with `<Ref n={1} />`. */
  notes?: readonly ReactNode[];
  /** The source line, without the "Source:" prefix. */
  source?: ReactNode;
  /** Short deck name in the footer, beside the page number. */
  label?: ReactNode;
  /** Grid rows of the 12-column body, as `grid-template-rows`. Defaults to one row that fills the slide. */
  rows?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * The dense consulting frame on the 1920×1080 canvas: tracker, action title, subtitle, a 12-column
 * body grid of `Panel`s, an optional "So what", a sticker, and a footer with numbered notes, the
 * source and the page number.
 */
export function ConsultingSlide({
  tracker,
  title,
  subtitle,
  sticker,
  takeaway,
  takeawayLabel = "So what",
  notes,
  source,
  label,
  rows,
  className,
  children,
}: ConsultingSlideProps) {
  const { index } = useDeckSlide();
  return (
    <div className={cx("uipack-deck-slide uipack-cx-slide", className)}>
      {(tracker || sticker) && (
        <div className="uipack-cx-top">
          {tracker ? <Tracker {...tracker} /> : <span />}
          {sticker && <p className="uipack-cx-sticker">{sticker}</p>}
        </div>
      )}
      <header className="uipack-cx-head">
        <h2 className="uipack-cx-title">
          {/* Bare strings become spans, so a morph can fade them while a number inside the title travels. */}
          {Children.map(title, (child) => (typeof child === "string" ? <span>{child}</span> : child))}
        </h2>
        {subtitle && <p className="uipack-cx-subtitle">{subtitle}</p>}
      </header>
      <div className="uipack-cx-body" style={rows ? { gridTemplateRows: rows } : undefined}>
        {children}
      </div>
      {takeaway && (
        <aside className="uipack-cx-takeaway" aria-label="So what">
          <b>{takeawayLabel}</b>
          <p>{takeaway}</p>
        </aside>
      )}
      <footer className="uipack-deck-footer uipack-cx-footer">
        <div className="uipack-cx-footer__notes">
          {notes && notes.length > 0 && (
            <ol>
              {notes.map((n, i) => (
                <li key={i}>
                  <span>{i + 1}</span>
                  {n}
                </li>
              ))}
            </ol>
          )}
          {source && (
            <p>
              <b>Source:</b> {source}
            </p>
          )}
        </div>
        <p className="uipack-cx-footer__page">
          {label && <span>{label}</span>}
          <b>{String(index + 1).padStart(2, "0")}</b>
        </p>
      </footer>
    </div>
  );
}

/** A footnote marker, matching a numbered note in the slide footer. */
export function Ref({ n }: { n: number }) {
  return <sup className="uipack-cx-ref">{n}</sup>;
}

export interface GridPlacement {
  /** Columns of the 12-column grid this spans. Default 12. */
  cols?: number;
  /** Rows this spans. Default 1. */
  rows?: number;
  /** Explicit start column (1–12). Default: next free cell. */
  col?: number;
  /** Explicit start row. */
  row?: number;
}

const placement = ({ cols = 12, rows = 1, col, row }: GridPlacement): CSSProperties => ({
  gridColumn: col ? `${col} / span ${cols}` : `span ${cols}`,
  gridRow: row ? `${row} / span ${rows}` : `span ${rows}`,
});

export interface PanelProps extends GridPlacement {
  /** What the panel shows, as a short claim or label. */
  title: ReactNode;
  /** Unit and period line under the title: "$ per order, FY25". */
  unit?: ReactNode;
  /** A short highlighted note at the top right: "Top 2 = 61% of excess". */
  callout?: ReactNode;
  /** Makes the panel a `Morph`, so a `{ zoom: morphId }` slide can open out of it. */
  morphId?: string;
  /** `accent` draws the edge in the accent: the panel the slide is about. */
  emphasis?: boolean;
  className?: string;
  children?: ReactNode;
}

/** A titled container for one chart or table in the slide's 12-column grid. */
export function Panel({ title, unit, callout, morphId, emphasis, className, children, ...grid }: PanelProps) {
  const body = (
    <>
      <header className="uipack-cx-panel__head">
        <div>
          <h3>{title}</h3>
          {unit && <p>{unit}</p>}
        </div>
        {callout && <p className="uipack-cx-panel__callout">{callout}</p>}
      </header>
      <div className="uipack-cx-panel__body">{children}</div>
    </>
  );
  const props = {
    className: cx("uipack-cx-panel", emphasis && "uipack-cx-panel--emphasis", className),
    style: placement(grid),
  };
  return morphId ? (
    <Morph id={morphId} as="section" fit="stretch" {...props}>
      <div className="uipack-cx-panel__inner">{body}</div>
    </Morph>
  ) : (
    <section {...props}>
      <div className="uipack-cx-panel__inner">{body}</div>
    </section>
  );
}

export interface SoWhatProps extends GridPlacement {
  title?: ReactNode;
  children?: ReactNode;
}

/** The "So what" panel: the one conclusion a reader should take from the slide, placed in the grid. */
export function SoWhat({ title = "So what", children, ...grid }: SoWhatProps) {
  return (
    <aside className="uipack-cx-sowhat" style={placement(grid)} aria-label="So what">
      <b>{title}</b>
      <div>{children}</div>
    </aside>
  );
}
