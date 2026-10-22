import type { ReactNode } from "react";
import { cx, fail, layerIndex, linkDomain } from "./format";

/* The labelled blocks of a long article section: a header strip above the
   heading, the "Learn" terms, a self-test, what changed, and further reading.
   Each is plain markup with one root class; see docs/article.md. */

const present = (node: ReactNode) => node != null && node !== false && node !== "";

export interface LayerHeadProps {
  /** The layer's number; a number is padded to two digits (8 → "08"). */
  index: number | string;
  /** The zone the layer belongs to, e.g. "Serving and product". Drawn uppercase. */
  zone?: ReactNode;
  /** The one number that shows the layer's constraint. */
  metric?: { value: ReactNode; label?: ReactNode };
  /** A link back to the article's diagram; renders "↑ Map" (the arrow is CSS, so the link's name is "Map"). */
  mapHref?: string;
  /** Text of that link. Default "Map". */
  mapLabel?: string;
  /** Read before the number by screen readers. Default "Layer". */
  indexLabel?: string;
  id?: string;
  className?: string;
}

/**
 * A compact strip shown just above a layer's heading. It does not replace the
 * heading, which stays in the page outline. One line from 560px; narrower, the
 * metric moves under the index and zone.
 */
export function LayerHead({
  index,
  zone,
  metric,
  mapHref,
  mapLabel = "Map",
  indexLabel = "Layer",
  id,
  className,
}: LayerHeadProps) {
  if (index == null || index === "") fail("LayerHead", "`index` is required");
  if (metric && !present(metric.value))
    fail(`LayerHead ${layerIndex(index)}`, "`metric.value` is required when `metric` is given");
  return (
    <div id={id} className={cx("uipack-layerhead", className)}>
      <div className="uipack-layerhead__row">
        <p className="uipack-layerhead__where">
          <span className="uipack-layerhead__index">
            <span className="uipack-layerhead__sr">{indexLabel} </span>
            {layerIndex(index)}
          </span>{" "}
          {present(zone) ? <span className="uipack-layerhead__zone">{zone}</span> : null}
        </p>
        {metric ? (
          <p className="uipack-layerhead__metric">
            <span className="uipack-layerhead__value">{metric.value}</span>
            {present(metric.label) ? (
              <>
                {" "}
                <span className="uipack-layerhead__label">{metric.label}</span>
              </>
            ) : null}
          </p>
        ) : null}
        {mapHref ? (
          <a className="uipack-layerhead__map" href={mapHref}>
            {mapLabel}
          </a>
        ) : null}
      </div>
    </div>
  );
}

export interface TermListProps {
  /** The terms to learn, in order. They are not links. */
  terms: ReactNode[];
  /** Default "Learn". */
  label?: ReactNode;
  id?: string;
  className?: string;
}

/** "Learn": a label, then the terms as square tags that wrap. */
export function TermList({ terms, label = "Learn", id, className }: TermListProps) {
  const items = (terms ?? []).filter(present);
  if (!items.length) fail("TermList", "`terms` must list at least one term");
  return (
    <div id={id} className={cx("uipack-terms", className)}>
      <p className="uipack-terms__label">{label}</p>
      <ul className="uipack-terms__list" role="list">
        {items.map((term, i) => (
          <li className="uipack-terms__term" key={typeof term === "string" ? term : i}>
            {term}
          </li>
        ))}
      </ul>
    </div>
  );
}

export type CalloutKind = "selftest" | "note";

export interface CalloutProps {
  /** "selftest": a question to answer before moving on, labelled "Self-test" with a square marker. "note": generic. */
  kind?: CalloutKind;
  /** Overrides the label: default "Self-test" or "Note". */
  label?: ReactNode;
  /** Inline content (text, links, emphasis). */
  children: ReactNode;
  id?: string;
  className?: string;
}

/** A node box with a label: the section's self-test question, or a short aside. */
export function Callout({ kind = "selftest", label, children, id, className }: CalloutProps) {
  if (kind !== "selftest" && kind !== "note") fail("Callout", `unknown kind "${kind}"`);
  if (!present(children)) fail("Callout", "give it some content");
  return (
    <div id={id} className={cx("uipack-callout", `uipack-callout--${kind}`, className)}>
      <p className="uipack-callout__label">{label ?? (kind === "selftest" ? "Self-test" : "Note")}</p>
      <div className="uipack-callout__body">{children}</div>
    </div>
  );
}

export interface ChangeNoteProps {
  /** Default "What changed". */
  label?: ReactNode;
  /** A short span after the label, e.g. "2025–26". */
  kicker?: ReactNode;
  /** Inline content: the owner's paragraph, links and all. */
  children: ReactNode;
  id?: string;
  className?: string;
}

/** "What changed": quieter than a Callout, no fill, a 1.25px rule on the left. */
export function ChangeNote({ label = "What changed", kicker, children, id, className }: ChangeNoteProps) {
  if (!present(children)) fail("ChangeNote", "give it some content");
  return (
    <div id={id} className={cx("uipack-change", className)}>
      <p className="uipack-change__label">
        {label}
        {present(kicker) ? (
          <>
            {" "}
            <span className="uipack-change__kicker">{kicker}</span>
          </>
        ) : null}
      </p>
      <div className="uipack-change__body">{children}</div>
    </div>
  );
}

export interface LinkItem {
  href: string;
  title: ReactNode;
  /** Shown after the title in mono. Default: the href's host name ("arxiv.org"); `false` hides it. */
  domain?: string | false;
}

export interface LinkListProps {
  /** Default "Go deeper". */
  label?: ReactNode;
  links?: LinkItem[];
  /** Inline content after the rows, or instead of them: the fallback when links cannot be split out. */
  children?: ReactNode;
  id?: string;
  className?: string;
}

/** "Go deeper": a label, then compact link rows, each with its domain in mono. */
export function LinkList({ label = "Go deeper", links, children, id, className }: LinkListProps) {
  const rows = links ?? [];
  if (!rows.length && !present(children)) fail("LinkList", "give it `links` or inline children");
  rows.forEach((link, i) => {
    if (!link?.href) fail("LinkList", `link ${i} needs an \`href\``);
    if (!present(link.title)) fail("LinkList", `link ${i} (${link.href}) needs a \`title\``);
  });
  return (
    <div id={id} className={cx("uipack-links", className)}>
      <p className="uipack-links__label">{label}</p>
      {rows.length ? (
        <ul className="uipack-links__list" role="list">
          {rows.map((link, i) => {
            const domain = link.domain === false ? undefined : (link.domain ?? linkDomain(link.href));
            return (
              <li className="uipack-links__item" key={`${link.href}-${i}`}>
                <a className="uipack-links__link" href={link.href}>
                  <span className="uipack-links__title">{link.title}</span>
                  {domain ? (
                    <>
                      {" "}
                      <span className="uipack-links__domain">{domain}</span>
                    </>
                  ) : null}
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
      {present(children) ? <div className="uipack-links__body">{children}</div> : null}
    </div>
  );
}
