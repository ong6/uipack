import * as react from 'react';
import { ReactNode } from 'react';

type SpanStatusKind = "acquired" | "pending" | "licensed" | "shutdown";
/** One column of the stack. Columns run left (bottom of the stack) to right (top). */
interface SpanLayer {
    id: string;
    label: string;
    /** Three-letter code used when the full labels do not fit, e.g. "INF". */
    abbr: string;
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
    /** Image URL for the logo tile; missing gives a monogram tile. */
    logo?: string;
    /** The item's website. */
    href?: string;
    /** One sentence shown when the row is opened. */
    note?: string;
    status?: SpanStatus;
    /** Short mono tags shown after the name, e.g. "voice". */
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
/** Interface text. `{n}`, `{total}`, `{layer}`, `{size}` and `{date}` are replaced where noted. */
interface SpanChartLabels {
    /** First-column header while no layer filter is active. */
    company: string;
    /** Expand control, `{n}` = all items. */
    showAll: string;
    /** Collapse control, `{n}` = featured items. */
    showFeatured: string;
    /** First-column header while a layer filter is active; it clears the layer filter. */
    allLayers: string;
    /** Legend and screen-reader name for the primary layer. */
    main: string;
    /** Legend and screen-reader name for the other layers. */
    also: string;
    /** Accessible name of the layer filter. */
    filter: string;
    /** Name of the size filter and of the size in the screen-reader sentence. */
    size: string;
    /** First size chip; it clears the size filter. */
    allSizes: string;
    /** Legend text beside a sample value label. */
    valueLegend: string;
    /** Footer line while filtered by layer, `{n}`, `{total}`, `{layer}`. */
    showing: string;
    /** Footer line while filtered by size, `{n}`, `{total}`, `{size}`. */
    showingSize: string;
    /** Footer line while filtered by both, `{n}`, `{total}`, `{layer}`, `{size}`. */
    showingBoth: string;
    /** Shown in place of rows when the filters match nothing. */
    empty: string;
    /** Footer date line, `{date}`. */
    asOf: string;
    website: string;
    source: string;
    /** Status sentences, `{label}` = the status label. */
    acquired: string;
    pending: string;
    licensed: string;
    shutdown: string;
    /** Legend text for the → badge and the shut badge. */
    legendChange: string;
    legendShutdown: string;
}
declare const DEFAULT_LABELS: SpanChartLabels;
interface SpanChartInput {
    id: string;
    layers: SpanLayer[];
    zones?: SpanZone[];
    items: SpanItem[];
    /** Size tiers, largest first. Adds the size filter. */
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
    monogram: string;
    sentence: string;
    statusText: string | null;
    badge: string | null;
}
/** A filter state: a layer id or null (all layers), a tier id or null (all sizes). */
type SpanFilter = readonly [layer: string | null, tier: string | null];
interface SpanGroupModel {
    /** The primary layer, or null when `groupBy` is "none". */
    layer: SpanLayer | null;
    index: number;
    rows: SpanRowModel[];
    featured: number;
    layerIds: string[];
    tierIds: string[];
    /** "layer|tier" pairs present in the group, for the combined filter. */
    pairs: string[];
    /** Matching rows per filter state, keyed by `filterKey`; only non-zero entries. */
    counts: Map<string, number>;
}
interface SpanZoneSpan {
    zone: SpanZone;
    start: number;
    end: number;
}
interface SpanChartModel {
    id: string;
    layers: SpanLayer[];
    tiers: SpanTier[];
    zones: SpanZoneSpan[];
    groups: SpanGroupModel[];
    total: number;
    featured: number;
    /** Every filter state except "all, all", with its matching row count. */
    filters: {
        filter: SpanFilter;
        key: string;
        count: number;
    }[];
    hasToggle: boolean;
    initialAll: boolean;
    labels: SpanChartLabels;
    /** Container width at which the full column labels fit on two lines at 11px. */
    fullLabelsAt: number;
    /** Container width at which they fit at 12px. */
    largeLabelsAt: number;
    hasChange: boolean;
    hasShutdown: boolean;
    /** The largest item's value label, shown as the legend's example. */
    valueSample: string | null;
}
declare function buildSpanModel(input: SpanChartInput): SpanChartModel;
/**
 * The chart's own rules, scoped by its id. Choosing layer L marks its column
 * and hides rows and groups that do not touch L; choosing tier T hides rows
 * and groups outside T; with both, a group stays only if one row matches both.
 * Each filter state shows its own counts, and the empty message when nothing
 * matches. Also switches the column headers to full labels once the
 * container is wide enough for them.
 */
declare function spanChartCss(model: SpanChartModel): string;

interface SpanChartProps extends SpanChartInput {
    /** Unique on the page. Prefixes the input ids and scopes the chart's own rules. */
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
    /** Heading level of the title; group headings sit one level below it. Default 3. */
    headingLevel?: 2 | 3 | 4 | 5;
}
/**
 * A sideways bar chart that places items on the ordered layers of a stack.
 * Every behaviour (expand, layer and size filters, row detail) is native form
 * state and CSS, so `renderToStaticMarkup` output works without JavaScript.
 * `enhanceSpanChart` optionally adds repeat-to-clear and Escape.
 */
declare function SpanChart(props: SpanChartProps): react.JSX.Element;

interface StackZone {
    id: string;
    label: string;
}
interface StackLayer {
    id: string;
    label: string;
    /** Zone id; layers of one zone must be consecutive. */
    zone: string;
    /** One line: the constraint this layer lives under. */
    summary: string;
    metric?: {
        value: string;
        label: string;
    };
    /** Shown when the band is opened, e.g. a self-test question. */
    detail?: string;
    /** The article section about this layer. */
    href?: string;
}
/** A cross-cutting column beside the stack, spanning a contiguous range of layers. */
interface StackRail {
    id: string;
    label: string;
    /** Lowest layer id the rail covers. */
    from: string;
    /** Highest layer id the rail covers. */
    to: string;
    summary?: string;
    href?: string;
}
/** A side annotation over a contiguous range of layers. */
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
    /** Heading of the opened band's detail. */
    check: string;
    /** Link to the band's section. */
    read: string;
    /** Caption over the rail chips on narrow screens. */
    rails: string;
}
declare const LAYER_STACK_LABELS: LayerStackLabels;
interface LayerStackProps {
    /** Unique on the page; prefixes element ids. */
    id: string;
    title?: ReactNode;
    caption?: ReactNode;
    zones: StackZone[];
    /** Bottom to top: the first layer is drawn at the bottom of the stack. */
    layers: StackLayer[];
    rails?: StackRail[];
    brackets?: StackBracket[];
    labels?: Partial<LayerStackLabels>;
    /** Heading level of the title; zone headings sit one level below it. Default 3. */
    headingLevel?: 2 | 3 | 4 | 5;
}
interface Placed {
    /** Wide grid: first row and row count. */
    wide: [number, number];
    /** Narrow grid: row. */
    narrow: number;
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
        rails: string;
    };
    layers: {
        layer: StackLayer;
        number: string;
        tone: number;
        place: Placed;
    }[];
    zones: {
        place: Placed;
        /** A bracket label sits directly above this zone heading on narrow screens. */
        afterBracket: boolean;
        zone: StackZone;
        tone: number;
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
    railsCaptionRow: number;
    brackets: {
        place: Placed;
        bracket: StackBracket;
        lo: number;
        hi: number;
    }[];
};
/**
 * A stacked-layer diagram for walking a stack bottom-up. Each band opens to
 * show its detail and a link to the section; rails beside the stack link to
 * cross-cutting topics; brackets annotate ranges. Works as static HTML.
 */
declare function LayerStack(props: LayerStackProps): react.JSX.Element;

/**
 * Optional progressive enhancement for a rendered SpanChart. Without it every
 * behaviour still works through native inputs and CSS; with it:
 *
 * - activating the selected column header or size chip again (click, tap,
 *   Space or Enter) clears that filter;
 * - Escape clears both filters while focus is in the chart or the chart was
 *   the last thing clicked or tapped (Safari does not focus a radio when its
 *   label is clicked, so focus alone is not enough);
 * - Enter on an unselected header or chip selects it, like Space;
 * - a polite live region announces the filtered count.
 *
 * Returns a cleanup function that removes every listener.
 */
declare function enhanceSpanChart(root: HTMLElement): () => void;

export { LAYER_STACK_LABELS, LayerStack, type LayerStackLabels, type LayerStackProps, DEFAULT_LABELS as SPAN_CHART_LABELS, SpanChart, type SpanChartLabels, type SpanChartModel, type SpanChartProps, type SpanFilter, type SpanItem, type SpanLayer, type SpanRun, type SpanStatus, type SpanStatusKind, type SpanTier, type SpanZone, type StackBracket, type StackLayer, type StackRail, type StackZone, buildLayerStack, buildSpanModel, enhanceSpanChart, spanChartCss };
