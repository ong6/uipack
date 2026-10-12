import * as react from 'react';
import { ReactNode } from 'react';

type NoteStatus = "published" | "planned";
interface NoteCardProps {
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
declare function NoteCard({ href, title, description, date, minutes, kicker, status, plannedLabel, minutesLabel, id, className, }: NoteCardProps): react.JSX.Element;
interface NoteClusterProps {
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
declare function NoteCluster({ label, note, notes, children, count, wide, id, className }: NoteClusterProps): react.JSX.Element;

interface LayerHeadProps {
    /** The layer's number; a number is padded to two digits (8 → "08"). */
    index: number | string;
    /** The zone the layer belongs to, e.g. "Serving and product". Drawn uppercase. */
    zone?: ReactNode;
    /** The one number that shows the layer's constraint. */
    metric?: {
        value: ReactNode;
        label?: ReactNode;
    };
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
declare function LayerHead({ index, zone, metric, mapHref, mapLabel, indexLabel, id, className }: LayerHeadProps): react.JSX.Element;
interface TermListProps {
    /** The terms to learn, in order. They are not links. */
    terms: ReactNode[];
    /** Default "Learn". */
    label?: ReactNode;
    id?: string;
    className?: string;
}
/** "Learn": a label, then the terms as square tags that wrap. */
declare function TermList({ terms, label, id, className }: TermListProps): react.JSX.Element;
type CalloutKind = "selftest" | "note";
interface CalloutProps {
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
declare function Callout({ kind, label, children, id, className }: CalloutProps): react.JSX.Element;
interface ChangeNoteProps {
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
declare function ChangeNote({ label, kicker, children, id, className }: ChangeNoteProps): react.JSX.Element;
interface LinkItem {
    href: string;
    title: ReactNode;
    /** Shown after the title in mono. Default: the href's host name ("arxiv.org"); `false` hides it. */
    domain?: string | false;
}
interface LinkListProps {
    /** Default "Go deeper". */
    label?: ReactNode;
    links?: LinkItem[];
    /** Inline content after the rows, or instead of them: the fallback when links cannot be split out. */
    children?: ReactNode;
    id?: string;
    className?: string;
}
/** "Go deeper": a label, then compact link rows, each with its domain in mono. */
declare function LinkList({ label, links, children, id, className }: LinkListProps): react.JSX.Element;

/**
 * "2026-08-30" → "30 Aug 2026": day, short month, year, read as a calendar
 * date (no time zone), the way the notes site prints dates. Anything that is
 * not a valid ISO date is returned unchanged.
 */
declare function formatNoteDate(date: string): string;
/**
 * The host name an absolute http(s) link points to, without "www.":
 * "https://www.anthropic.com/engineering/x" → "anthropic.com". Relative,
 * hash, mailto and malformed links have no domain (undefined).
 */
declare function linkDomain(href: string): string | undefined;
/** 8 → "08"; strings pass through ("8a" stays "8a"). */
declare const layerIndex: (index: number | string) => string;

export { Callout, type CalloutKind, type CalloutProps, ChangeNote, type ChangeNoteProps, LayerHead, type LayerHeadProps, type LinkItem, LinkList, type LinkListProps, NoteCard, type NoteCardProps, NoteCluster, type NoteClusterProps, type NoteStatus, TermList, type TermListProps, formatNoteDate, layerIndex, linkDomain };
