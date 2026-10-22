import { Children, type ReactNode } from "react";
import { cx, fail, formatNoteDate } from "./format";

/* NoteCard and NoteCluster: links to the author's own articles, drawn as the
   diagrams' node boxes, grouped in a dashed box like a diagram group. Plain
   markup with no hooks, so renderToStaticMarkup output works without
   JavaScript; the class contract is documented in docs/article.md. */

export type NoteStatus = "published" | "planned";

export interface NoteCardProps {
  /** The article's URL. Required unless the note is planned. */
  href?: string;
  title: ReactNode;
  /** One or two sentences. Clamped to three lines on screen; the full text stays in the link's name. */
  description: ReactNode;
  /** ISO date, "2026-08-30", shown as "30 Aug 2026". */
  date?: string;
  /** Reading time in minutes, shown as "7 min read". */
  minutes?: number;
  /** A short label above the title, e.g. the layer: "Inference". */
  kicker?: ReactNode;
  /** "planned" draws a dashed box that is not a link and says `plannedLabel`. Default "published". */
  status?: NoteStatus;
  /** What a planned card says instead of its date. Default "Coming next". */
  plannedLabel?: string;
  /** Words after the minutes. Default "min read". */
  minutesLabel?: string;
  id?: string;
  className?: string;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function NoteCard({
  href,
  title,
  description,
  date,
  minutes,
  kicker,
  status = "published",
  plannedLabel = "Coming next",
  minutesLabel = "min read",
  id,
  className,
}: NoteCardProps) {
  const name = typeof title === "string" ? title : "a note";
  if (title == null || title === "") fail("NoteCard", "every note needs a `title`");
  if (status !== "published" && status !== "planned") fail(`NoteCard "${name}"`, `unknown status "${status}"`);
  if (minutes != null && !(Number.isFinite(minutes) && minutes > 0))
    fail(`NoteCard "${name}"`, "`minutes` must be a positive number");
  const planned = status === "planned";
  if (!planned && !href) fail(`NoteCard "${name}"`, 'a published note needs an `href` (or set status="planned")');

  const body = (
    <>
      {/* The spaces keep words apart in the link's accessible name; flex layout ignores them. */}
      {kicker != null && kicker !== "" ? <span className="uipack-notecard__kicker">{kicker}</span> : null}{" "}
      <span className="uipack-notecard__title">{title}</span>{" "}
      {description != null && description !== "" ? <span className="uipack-notecard__desc">{description}</span> : null}{" "}
      <span className="uipack-notecard__meta">
        {planned ? (
          <span className="uipack-notecard__status">{plannedLabel}</span>
        ) : (
          <>
            {date ? (
              <time className="uipack-notecard__date" dateTime={ISO.test(date.trim()) ? date.trim() : undefined}>
                {formatNoteDate(date)}
              </time>
            ) : null}{" "}
            {minutes != null ? (
              <span className="uipack-notecard__time">
                {Math.round(minutes)} {minutesLabel}
              </span>
            ) : null}
            <span className="uipack-notecard__go" aria-hidden="true">
              →
            </span>
          </>
        )}
      </span>
    </>
  );

  return planned ? (
    <div id={id} className={cx("uipack-notecard", "uipack-notecard--planned", className)}>
      {body}
    </div>
  ) : (
    <a id={id} className={cx("uipack-notecard", className)} href={href}>
      {body}
    </a>
  );
}

export interface NoteClusterProps {
  /** The group's name, e.g. "My notes on serving and product". Drawn uppercase. */
  label: ReactNode;
  /** One short line under the label. */
  note?: ReactNode;
  /** The cards, as data. Or pass NoteCard elements as children. */
  notes?: NoteCardProps[];
  children?: ReactNode;
  /** The number after the label. Default: how many cards there are. `false` hides it. */
  count?: number | false;
  /**
   * Break out of the text column to the figure slot: `--uipack-article-wide`,
   * default min(56rem, 100vw − 2.5rem), centred on the column.
   */
  wide?: boolean;
  id?: string;
  className?: string;
}

export function NoteCluster({ label, note, notes, children, count, wide, id, className }: NoteClusterProps) {
  if (label == null || label === "") fail("NoteCluster", "every cluster needs a `label`");
  const cards = notes ? notes.map((n, i) => <NoteCard key={n.href ?? n.id ?? i} {...n} />) : Children.toArray(children);
  if (!cards.length) fail(`NoteCluster "${typeof label === "string" ? label : "cluster"}"`, "give it at least one note");
  const shown = count === false ? null : (count ?? cards.length);

  return (
    <div id={id} className={cx("uipack-cluster", wide && "uipack-cluster--wide", className)}>
      <p className="uipack-cluster__head">
        <span className="uipack-cluster__label">{label}</span>
        {/* The list announces its own length, so the visible count is not read twice. */}
        {shown != null ? (
          <span className="uipack-cluster__count" aria-hidden="true">
            {shown}
          </span>
        ) : null}
      </p>
      {note != null && note !== "" ? <p className="uipack-cluster__note">{note}</p> : null}
      {/* role="list" keeps list semantics in Safari once list-style is removed. */}
      <ul className="uipack-cluster__grid" role="list">
        {cards.map((card, i) => (
          <li className="uipack-cluster__item" key={i}>
            {card}
          </li>
        ))}
      </ul>
    </div>
  );
}
