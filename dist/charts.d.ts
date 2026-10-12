import * as react from 'react';
import { ReactNode } from 'react';

type SpanStatusKind = "acquired" | "pending" | "licensed" | "shutdown";
/** One column of the stack. Columns run left (bottom of the stack) to right (top). */
interface SpanLayer {
    id: string;
    label: string;
    /** Three-letter code for phone widths, e.g. "INF". */
    abbr: string;
    /** One word for mid widths, e.g. "Inference" or "Post-train". Defaults to `abbr`. */
    short?: string;
    /** Zone id; layers of one zone must be consecutive. */
    zone?: string;
}
/** An optional header band across consecutive columns. */
interface SpanZone {
    id: string;
    label: string;
}
/** A size tier. The consumer assigns items to tiers; the chart displays and filters. */
interface SpanTier {
    id: string;
    /** Chip text, e.g. "Large". */
    label: string;
    /** What the tier means, shown beside the label, e.g. "$50B+". */
    range?: string;
}
interface SpanStatus {
    kind: SpanStatusKind;
    /** The counterparty and year, e.g. "Stripe, 2026". Optional for `shutdown`. */
    label?: string;
}
interface SpanItem {
    id: string;
    name: string;
    /** The layer the item is mainly in. Rows are grouped by it. */
    primary: string;
    /** Other layers the item also covers. */
    also?: string[];
    /** Image URL for the logo tile; missing gives a two-letter monogram. */
    logo?: string;
    /** The item's website. */
    href?: string;
    /** One sentence shown when the row is opened. */
    note?: string;
    /** A deal or shutdown. Any kind but `shutdown` counts as a deal for the Deals filter. */
    status?: SpanStatus;
    /** Short tags shown under the name, e.g. "voice"; explained by `labels.tagLegend`. */
    tags?: string[];
    /** Part of the initial subset. */
    featured?: boolean;
    /** URL backing the placement, linked as "Source" in the opened row. */
    source?: string;
    /** Size tier id, one of the chart's `tiers`. */
    tier?: string;
    /** Sort key within a group, largest first, e.g. valuation in USD billions. */
    value?: number;
    /** Short display text for the size, e.g. "$17.5B". */
    valueLabel?: string;
}
/** Interface text. `{n}`, `{total}` and `{date}` are replaced where noted. */
interface SpanChartLabels {
    /** First-column header. */
    company: string;
    /** Expand control, `{n}` = all items. */
    showAll: string;
    /** Collapse control, `{n}` = featured items. */
    showFeatured: string;
    /** Line above the list, `{n}` shown of `{total}`. */
    shown: string;
    /** Name of the layer filter and its chip row. */
    layer: string;
    /** The "all" layer chip. */
    allLayers: string;
    /** Name of the size filter and its chip row. */
    size: string;
    /** The "all" size chip. */
    allSizes: string;
    /** The deals toggle: items with a status other than shutdown. */
    deals: string;
    /** Prefix of the active-filter row in the sticky header. */
    showing: string;
    /** Short reset control in the sticky header. */
    clear: string;
    /** Reset control's accessible name, and the empty state's control. */
    clearFilters: string;
    /** Narrow screens: the disclosure holding the key and filters. */
    filtersAndKey: string;
    /** Shown in place of rows when the filters match nothing. */
    empty: string;
    /** Legend and screen-reader name for the primary layer. */
    main: string;
    /** Legend and screen-reader name for the other layers. */
    also: string;
    /** Key: section labels (shown uppercase) and the two bar swatches. */
    keyBars: string;
    keyDeals: string;
    keySize: string;
    keyType: string;
    keyMain: string;
    keyAlso: string;
    /** Key text beside a sample value label, e.g. "market cap or valuation". */
    valueLegend: string;
    /** Key text beside a sample tag, e.g. "model type". */
    tagLegend: string;
    /** Key words inside each badge sample. */
    legendAcquired: string;
    legendPending: string;
    legendLicensed: string;
    legendShutdown: string;
    /** In the column header's corner, where headers carry names: how to filter by layer. */
    layerHint: string;
    /** The same hint on touch screens. */
    layerHintTouch: string;
    /** The search field (shown by enhanceSpanChart). */
    find: string;
    /** Empty search result, `{q}` = the query. */
    noMatch: string;
    /** Clears the search. */
    clearSearch: string;
    /** Footer date line, `{date}`. */
    asOf: string;
    website: string;
    source: string;
    /** Status sentences, `{label}` = the status label. */
    acquired: string;
    pending: string;
    licensed: string;
    shutdown: string;
}
declare const DEFAULT_LABELS: SpanChartLabels;
interface SpanChartInput {
    id: string;
    layers: SpanLayer[];
    zones?: SpanZone[];
    items: SpanItem[];
    /** Size tiers, largest first. Adds the size filter. Any number. */
    tiers?: SpanTier[];
    initial?: "featured" | "all";
    groupBy?: "primary" | "none";
    labels?: Partial<SpanChartLabels>;
}
/** A contiguous run of covered columns, inclusive; `main` is the primary column inside it, if any. */
interface SpanRun {
    start: number;
    end: number;
    main: number | null;
}
interface SpanRowModel {
    item: SpanItem;
    /** Covered column indices, ascending. */
    columns: number[];
    runs: SpanRun[];
    layerIds: string[];
    /** Main layer first, then the others in column order. */
    layerLabels: string[];
    primaryIndex: number;
    tier: SpanTier | null;
    /** Has a status other than shutdown. */
    deal: boolean;
    monogram: string;
    sentence: string;
    statusText: string | null;
    badge: string | null;
}
/** A filter state: a layer id, a tier id and the deals toggle; null means inactive. */
interface SpanFilter {
    layer: string | null;
    tier: string | null;
    deals: boolean;
}
interface SpanGroupModel {
    /** The primary layer, or null when `groupBy` is "none". */
    layer: SpanLayer | null;
    index: number;
    rows: SpanRowModel[];
    featured: number;
    layerIds: string[];
    tierIds: string[];
    hasDeal: boolean;
    /** Combined-filter keys present in this group, only those a rule tests. */
    keys: string[];
}
interface SpanZoneSpan {
    zone: SpanZone;
    start: number;
    end: number;
}
/** Container widths at which the layout and the column labels change. */
interface SpanThresholds {
    /** Below this the codes alternate between two lines so neighbours do not touch. */
    stagger: number;
    /** Name column beside the bars from here; stacked rows below. */
    wide: number;
    /** Short labels from here; codes below. */
    short: number;
    /** Full labels at 11px from here. */
    full: number;
    /** Full labels at 12px from here. */
    large: number;
}
interface SpanChartModel {
    id: string;
    layers: SpanLayer[];
    tiers: SpanTier[];
    zones: SpanZoneSpan[];
    groups: SpanGroupModel[];
    total: number;
    featured: number;
    deals: number;
    /** Rows per tier, in tier order. */
    tierCounts: number[];
    /** Rows that touch each layer, in column order. */
    layerCounts: number[];
    hasToggle: boolean;
    initialAll: boolean;
    labels: SpanChartLabels;
    thresholds: SpanThresholds;
    /** Multi-filter states that need a group rule, and their keys. */
    groupRules: {
        filter: SpanFilter;
        key: string;
    }[];
    /** The smallest filter states that match no rows. */
    emptyStates: SpanFilter[];
    /** Legend samples: a value and a tag from the data, and the badge kinds present. */
    samples: {
        value: string | null;
        tag: string | null;
        badges: SpanStatusKind[];
    };
}
declare function spanThresholds(layers: SpanLayer[]): SpanThresholds;
declare function buildSpanModel(input: SpanChartInput): SpanChartModel;
/**
 * The chart's own rules, keyed by its id.
 *
 * - Choosing layer L marks every label for L (`--sp-sel`), shows its name in
 *   the active-filter row (`--sp-now`), tints its column (`--sp-active`) and
 *   hides rows and groups that do not touch L. Tiers work the same way.
 * - Where filters combine, a group stays only if one row passes them all; a
 *   combination that matches nothing shows the empty state.
 * - The layout switches to a name column beside the bars at `wide`, and the
 *   column labels go from codes to short words to full labels as they fit.
 */
declare function spanChartCss(model: SpanChartModel): string;

/** A heading level, or "none"/false to render titles and group labels as plain text with group roles. */
type ChartHeadingLevel = 2 | 3 | 4 | 5 | "none" | false;
interface SpanChartProps extends SpanChartInput {
    /** Unique on the page, no spaces. Prefixes the input ids and keys the chart's own rules. */
    id: string;
    title?: ReactNode;
    caption?: ReactNode;
    /** Date the placements were checked, shown in the footer, e.g. "2026-10". */
    asOf?: string;
    /** "featured" (the default when any item is featured) or "all". */
    initial?: "featured" | "all";
    /** "primary" groups rows under their main layer in column order; "none" is one list. */
    groupBy?: "primary" | "none";
    labels?: Partial<SpanChartLabels>;
    /**
     * Heading level of the title; group headings sit one level below it.
     * Default 3. "none" (or false) renders them as text, with each group a
     * `role="group"` named by its label, for charts placed before the page's
     * first heading.
     */
    headingLevel?: ChartHeadingLevel;
}
/**
 * A sideways bar chart that places items on the ordered layers of a stack.
 * Every behaviour (expand, layer, size and deals filters, row detail) is
 * native form state and CSS, so `renderToStaticMarkup` output works without
 * JavaScript. `enhanceSpanChart` optionally adds repeat-to-clear, Escape,
 * live counts, scroll restoration and find-in-page for hidden rows.
 */
declare function SpanChart(props: SpanChartProps): react.JSX.Element;

interface StackZone {
    id: string;
    label: string;
    /** A short phrase after the label, e.g. "built once per model". */
    note?: string;
}
interface StackLayer {
    id: string;
    label: string;
    /** Zone id; layers of one zone must be consecutive. */
    zone: string;
    /** One line: the constraint this layer lives under. */
    summary: string;
    /** Optional figure at the band's right edge; nothing is drawn without it. */
    metric?: {
        value: string;
        label: string;
    };
    /** Optional: makes the band open to show this text (e.g. a self-test question) and a link to the section. */
    detail?: string;
    /** The article section about this layer: the whole band links to it. */
    href?: string;
}
/** A cross-cutting topic beside the stack, spanning a contiguous range of layers. */
interface StackRail {
    id: string;
    label: string;
    /** A shorter label for the bracket beside the stack, e.g. "Gateways"; screen readers and the phone list use `label`. */
    short?: string;
    /** Lowest layer id the rail covers. */
    from: string;
    /** Highest layer id the rail covers. */
    to: string;
    summary?: string;
    href?: string;
}
/** A side annotation over a contiguous range of layers (a left column from 1000px, a label above the zone below that). */
interface StackBracket {
    label: string;
    from: string;
    to: string;
}
interface LayerStackLabels {
    /** Prefix read before each band's number. */
    layer: string;
    /** Rail range word, e.g. "layers 7–10". */
    layers: string;
    /** Singular of `layers`, for a one-layer range. */
    layerOne: string;
    /** Lead-in of an opened band's detail (only for layers with `detail`). */
    check: string;
    /** Link to the section inside an opened band (only for layers with `detail`). */
    read: string;
    /** Right-aligned affordance on a linked band; phones show only the arrow. */
    go: string;
    /** Heading of the rail list that replaces the brackets on phones. */
    rails: string;
}
declare const LAYER_STACK_LABELS: LayerStackLabels;
interface LayerStackProps {
    /** Unique on the page; prefixes element ids. */
    id: string;
    title?: ReactNode;
    caption?: ReactNode;
    zones: StackZone[];
    /** Bottom to top: the first layer is drawn at the bottom of the stack and numbered 01. */
    layers: StackLayer[];
    rails?: StackRail[];
    brackets?: StackBracket[];
    labels?: Partial<LayerStackLabels>;
    /**
     * Heading level of the title; zone and rail-list headings sit one level
     * below it. Default 3. "none" (or false) renders them as text, each zone a
     * `role="group"` named by its label.
     */
    headingLevel?: ChartHeadingLevel;
}
/** Grid rows: `wide` from 1000px with a bracket column; `compact` below, with bracket labels above zones. */
interface Placed {
    wide: [number, number];
    compact: [number, number];
}
/** Validates the stack and assigns grid rows. Exported for tests. */
declare function buildLayerStack(props: LayerStackProps): {
    id: string;
    labels: {
        layer: string;
        layers: string;
        layerOne: string;
        check: string;
        read: string;
        go: string;
        rails: string;
    };
    zones: {
        place: Placed;
        box: Placed;
        endRow: Placed;
        layers: {
            layer: StackLayer;
            i: number;
            number: string;
            place: Placed;
        }[];
        brackets: {
            place: Placed;
            bracket: StackBracket;
            lo: number;
            hi: number;
        }[];
        zone: StackZone;
        start: number;
        end: number;
    }[];
    rails: {
        place: Placed;
        rail: StackRail;
        lo: number;
        hi: number;
        span: string;
    }[];
    brackets: number;
};
/**
 * A stacked-layer diagram for walking a stack bottom-up. Each band is a node
 * that links to its section (or opens, when it has `detail`); zones are dashed
 * group boxes; rails are bracket connectors beside the stack, replaced on
 * phones by a list under it. Works as static HTML; `enhanceLayerStack` adds
 * smooth scrolling to the sections.
 */
declare function LayerStack(props: LayerStackProps): react.JSX.Element;

/**
 * Optional progressive enhancement for a rendered SpanChart. Without it every
 * behaviour still works through native inputs and CSS; with it:
 *
 * - activating the selected layer or size again (click, tap, Space or Enter)
 *   clears that filter; Enter also selects, like Space; "Clear" returns focus
 *   to the "All layers" control;
 * - Escape clears every filter while focus is in the chart or the chart was
 *   the last thing clicked or tapped (Safari does not focus a radio when its
 *   label is clicked, so focus alone is not enough);
 * - group headings and the footer show live counts under a filter, and a
 *   polite live region announces them;
 * - collapsing the list, or filtering while the chart top is above the
 *   viewport, scrolls the chart top back into view;
 * - rows hidden in the featured view become findable with the browser's
 *   find-in-page where `hidden="until-found"` is supported (and stay hidden
 *   from screen readers until shown); a match expands the list;
 * - group labels stick under the header while their rows scroll past;
 * - a URL hash naming a filter input (e.g. `#ai-stack-layer-control`)
 *   selects it, so an article can link to a filtered view;
 * - the "Find a company" field appears: it matches names, tags and deals,
 *   ignoring case and accents, shows matches whether featured or not, and
 *   combines with the filters; Escape or its clear button resets it;
 * - showing all rows or the featured subset is announced;
 * - on fine pointers, the column under the pointer in the rows shows a faint
 *   band and its header lights up (headers do this without script).
 *
 * Returns a cleanup function that removes every listener.
 */
declare function enhanceSpanChart(root: HTMLElement): () => void;
/**
 * Optional enhancement for a rendered LayerStack. Without it every band and
 * rail is a plain in-page link; with it, following one scrolls smoothly to the
 * section (instantly under reduced motion, where the plain link is left
 * alone), records the hash and moves focus there so Tab continues from the
 * section. Returns a cleanup function.
 */
declare function enhanceLayerStack(root: HTMLElement): () => void;

export { type ChartHeadingLevel, LAYER_STACK_LABELS, LayerStack, type LayerStackLabels, type LayerStackProps, DEFAULT_LABELS as SPAN_CHART_LABELS, SpanChart, type SpanChartLabels, type SpanChartModel, type SpanChartProps, type SpanFilter, type SpanItem, type SpanLayer, type SpanRun, type SpanStatus, type SpanStatusKind, type SpanThresholds, type SpanTier, type SpanZone, type StackBracket, type StackLayer, type StackRail, type StackZone, buildLayerStack, buildSpanModel, enhanceLayerStack, enhanceSpanChart, spanChartCss, spanThresholds };
