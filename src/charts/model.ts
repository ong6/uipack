/* SpanChart data model: validation, grouping, sorting, runs, layout
   thresholds and the scoped filter rules. Pure functions, so a static build
   and a client render produce the same markup, and bad data fails the
   consumer's build. */

export type SpanStatusKind = "acquired" | "pending" | "licensed" | "shutdown";

/** One column of the stack. Columns run left (bottom of the stack) to right (top). */
export interface SpanLayer {
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
export interface SpanZone {
  id: string;
  label: string;
}

/** A size tier. The consumer assigns items to tiers; the chart displays and filters. */
export interface SpanTier {
  id: string;
  /** Chip text, e.g. "Large". */
  label: string;
  /** What the tier means, shown beside the label, e.g. "$50B+". */
  range?: string;
}

export interface SpanStatus {
  kind: SpanStatusKind;
  /** The counterparty and year, e.g. "Stripe, 2026". Optional for `shutdown`. */
  label?: string;
}

export interface SpanItem {
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
export interface SpanChartLabels {
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
  /** Legend text beside a sample value label. */
  valueLegend: string;
  /** Legend text beside a sample tag, e.g. "model type". */
  tagLegend: string;
  /** Legend text beside a sample deal badge. */
  legendChange: string;
  /** Legend text beside the shut badge. */
  legendShutdown: string;
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

export const DEFAULT_LABELS: SpanChartLabels = {
  company: "Company",
  showAll: "Show all {n} companies",
  showFeatured: "Show the {n} featured",
  shown: "{n} of {total} shown",
  layer: "Layer",
  allLayers: "All layers",
  size: "Size",
  allSizes: "All sizes",
  deals: "Deals",
  showing: "Showing",
  clear: "Clear",
  clearFilters: "Clear filters",
  filtersAndKey: "Filters and key",
  empty: "Nothing matches these filters.",
  main: "Main layer",
  also: "Also in",
  valueLegend: "size, largest first in each layer",
  tagLegend: "tag",
  legendChange: "deal: acquired, sale pending or licensed",
  legendShutdown: "shut down",
  asOf: "As of {date}",
  website: "Website",
  source: "Source",
  acquired: "Acquired by {label}",
  pending: "Sale agreed to {label}",
  licensed: "Technology licensed to {label}",
  shutdown: "Shut down",
};

export interface SpanChartInput {
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
export interface SpanRun {
  start: number;
  end: number;
  main: number | null;
}

export interface SpanRowModel {
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
export interface SpanFilter {
  layer: string | null;
  tier: string | null;
  deals: boolean;
}

export interface SpanGroupModel {
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

export interface SpanZoneSpan {
  zone: SpanZone;
  start: number;
  end: number;
}

/** Container widths at which the layout and the column labels change. */
export interface SpanThresholds {
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

export interface SpanChartModel {
  id: string;
  layers: SpanLayer[];
  tiers: SpanTier[];
  zones: SpanZoneSpan[];
  groups: SpanGroupModel[];
  total: number;
  featured: number;
  deals: number;
  hasToggle: boolean;
  initialAll: boolean;
  labels: SpanChartLabels;
  thresholds: SpanThresholds;
  /** Multi-filter states that need a group rule, and their keys. */
  groupRules: { filter: SpanFilter; key: string }[];
  /** The smallest filter states that match no rows. */
  emptyStates: SpanFilter[];
  /** Legend samples taken from the data. */
  samples: { value: string | null; badge: string | null; tag: string | null; shut: boolean };
}

export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));

export const filterKey = ({ layer, tier, deals }: SpanFilter) => `${layer ?? "*"}|${tier ?? "*"}|${deals ? "d" : "*"}`;

const fail = (chart: string, message: string): never => {
  throw new Error(`SpanChart "${chart}": ${message}`);
};

const NO_SPACE = /^\S+$/;
const STATUS_KINDS: SpanStatusKind[] = ["acquired", "pending", "licensed", "shutdown"];

/**
 * Two letters that tell rows apart: the initials of the first two words or
 * camelCase humps ("OpenRouter" → "OR"), else the first two letters ("Groq" → "Gr").
 */
export function monogram(name: string) {
  const words = name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[\s-]+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+/u, ""))
    .filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const word = words[0] ?? "?";
  return word[0].toUpperCase() + (word[1] ?? "");
}

/** Contiguous runs of sorted column indices. */
export function spanRuns(columns: number[], main: number): SpanRun[] {
  const runs: SpanRun[] = [];
  for (const c of columns) {
    const last = runs[runs.length - 1];
    if (last && c === last.end + 1) last.end = c;
    else runs.push({ start: c, end: c, main: null });
  }
  for (const run of runs) if (main >= run.start && main <= run.end) run.main = main;
  return runs;
}

const statusShort = (label = "") => label.split(",")[0].trim();

export function statusBadge(status: SpanStatus) {
  if (status.kind === "shutdown") return "shut";
  const who = statusShort(status.label);
  if (status.kind === "pending") return `→ ${who} (pending)`;
  if (status.kind === "licensed") return `→ ${who} (licensed)`;
  return `→ ${who}`;
}

export function statusSentence(status: SpanStatus, labels: SpanChartLabels) {
  if (status.kind === "shutdown") return status.label ? `${labels.shutdown}, ${status.label}` : labels.shutdown;
  return fill(labels[status.kind], { label: status.label ?? "" });
}

/* Approximate advance widths (em) of a medium-weight system sans, calibrated
   against SF Pro. Enough to place the label breakpoints; a wider host font
   wraps a label to another line rather than clipping it. */
const EM: Record<string, number> = {};
for (const [chars, w] of [
  ["iljI.,:;'|!", 0.24],
  ["frt()- ", 0.34],
  ["sczJ", 0.48],
  ["aekvxy", 0.53],
  ["bdghnopquL", 0.57],
  ["FPTZ", 0.6],
  ["ABEKRSVXY", 0.64],
  ["CDGHNOQU", 0.7],
  ["mM", 0.84],
  ["wW", 0.78],
] as const)
  for (const ch of chars) EM[ch] = w;
function textWidth(text: string, px: number) {
  let w = 0;
  for (const ch of text) w += EM[ch] ?? 0.58;
  return w * px * 1.08;
}

/** Narrowest width a label needs to fit on at most two lines at `px`; lines break at spaces and after hyphens. */
export function twoLineWidth(label: string, px = 12) {
  const words = label.split(/(?<=-)|\s+/).filter(Boolean);
  const join = (parts: string[]) => parts.join(" ").replace(/- /g, "-");
  let best = textWidth(label, px);
  for (let i = 1; i < words.length; i++) {
    best = Math.min(best, Math.max(textWidth(join(words.slice(0, i)), px), textWidth(join(words.slice(i)), px)));
  }
  return Math.max(best, ...words.map((w) => textWidth(w, px)));
}

/** Column width at which every label fits on two lines with `gap` to its neighbour. */
export function fullLabelColumn(labels: string[], px = 12, gap = 8) {
  const w = labels.map((l) => twoLineWidth(l, px));
  return Math.max(...w.map((x, i) => Math.max(x + 2, i ? (x + w[i - 1]) / 2 + gap : 0)));
}

/* Layout constants shared with charts.css. */
export const NARROW_BELOW = 640;
export const ROOMY_FROM = 1000;
/** Name column below and from ROOMY_FROM. */
export const NAME_WIDTH = [192, 220] as const;
/** Chart side padding below and from ROOMY_FROM. */
export const SIDE_PADDING = [16, 24] as const;
/** Short labels need at least this much column. */
const SHORT_MIN = 48;

/** Width of one layer column at container width `c`. */
export function columnWidth(c: number, layers: number, wide: boolean) {
  const roomy = c >= ROOMY_FROM ? 1 : 0;
  return (c - 2 * SIDE_PADDING[roomy] - (wide ? NAME_WIDTH[roomy] : 0)) / layers;
}

/** Smallest container width from which `ok(c)` holds for every wider container. */
function from(ok: (c: number) => boolean, floor = 0) {
  let w = 2400;
  for (let c = 2400; c >= floor; c--) {
    if (!ok(c)) break;
    w = c;
  }
  return w;
}

export function spanThresholds(layers: SpanLayer[]): SpanThresholds {
  const n = layers.length;
  const shortCol = Math.max(SHORT_MIN, fullLabelColumn(layers.map((l) => l.short ?? l.abbr), 11, 4));
  const wide = from((c) => columnWidth(c, n, true) >= shortCol, NARROW_BELOW);
  const col = (c: number) => columnWidth(c, n, c >= wide);
  const full = fullLabelColumn(layers.map((l) => l.label), 11);
  const large = fullLabelColumn(layers.map((l) => l.label), 12);
  const short = from((c) => col(c) >= shortCol, 200);
  // A code needs its own width plus a gap; below that, alternate lines.
  const codeCol = Math.max(...layers.map((l) => l.abbr.length)) * 6.6 + 6;
  const stagger = from((c) => col(c) >= codeCol, 200);
  const fullAt = Math.max(short, from((c) => col(c) >= full, 200));
  return { stagger, wide, short, full: fullAt, large: Math.max(fullAt, from((c) => col(c) >= large, 200)) };
}

const matches = (row: SpanRowModel, f: SpanFilter) =>
  (f.layer === null || row.layerIds.includes(f.layer)) && (f.tier === null || row.tier?.id === f.tier) && (!f.deals || row.deal);

export function buildSpanModel(input: SpanChartInput): SpanChartModel {
  const { id, layers, items } = input;
  if (typeof id !== "string" || !NO_SPACE.test(id)) fail(String(id), "`id` must be a non-empty string without spaces");
  if (!Array.isArray(layers) || layers.length === 0) fail(id, "`layers` must list at least one layer");
  if (!Array.isArray(items)) fail(id, "`items` must be an array");
  const labels: SpanChartLabels = { ...DEFAULT_LABELS, ...input.labels };

  const layerIndex = new Map<string, number>();
  layers.forEach((layer, i) => {
    if (!layer || typeof layer.id !== "string" || !NO_SPACE.test(layer.id)) fail(id, `layer ${i} needs an \`id\` without spaces`);
    if (layerIndex.has(layer.id)) fail(id, `layer id "${layer.id}" is used twice`);
    if (!layer.label) fail(id, `layer "${layer.id}" needs a \`label\``);
    if (!layer.abbr) fail(id, `layer "${layer.id}" needs an \`abbr\` (a short code such as "INF")`);
    layerIndex.set(layer.id, i);
  });
  const known = () => [...layerIndex.keys()].join(", ");

  const tiers = input.tiers ?? [];
  const tierById = new Map<string, SpanTier>();
  tiers.forEach((tier, i) => {
    if (!tier || typeof tier.id !== "string" || !NO_SPACE.test(tier.id)) fail(id, `tier ${i} needs an \`id\` without spaces`);
    if (tierById.has(tier.id)) fail(id, `tier id "${tier.id}" is used twice`);
    if (!tier.label) fail(id, `tier "${tier.id}" needs a \`label\``);
    tierById.set(tier.id, tier);
  });

  // Zones: each used zone must exist and cover consecutive columns.
  const zoneById = new Map<string, SpanZone>();
  for (const zone of input.zones ?? []) {
    if (!zone || !zone.id) fail(id, "every zone needs an `id`");
    if (zoneById.has(zone.id)) fail(id, `zone id "${zone.id}" is used twice`);
    zoneById.set(zone.id, zone);
  }
  const zones: SpanZoneSpan[] = [];
  layers.forEach((layer, i) => {
    if (layer.zone === undefined) return;
    const zone = zoneById.get(layer.zone);
    if (!zone) fail(id, `layer "${layer.id}" names unknown zone "${layer.zone}"`);
    const last = zones[zones.length - 1];
    if (last && last.zone.id === layer.zone && last.end === i - 1) last.end = i;
    else if (zones.some((z) => z.zone.id === layer.zone)) fail(id, `zone "${layer.zone}" must cover consecutive layers; "${layer.id}" is separated from the rest`);
    else zones.push({ zone: zone!, start: i, end: i });
  });

  // Items: unique ids, known layers and tiers.
  const seen = new Set<string>();
  const rows: SpanRowModel[] = items.map((item, i) => {
    if (!item || typeof item.id !== "string" || !item.id) fail(id, `item ${i} needs an \`id\``);
    if (seen.has(item.id)) fail(id, `item id "${item.id}" is used twice`);
    seen.add(item.id);
    if (!item.name) fail(id, `item "${item.id}" needs a \`name\``);
    const primaryIndex = layerIndex.get(item.primary);
    if (primaryIndex === undefined) fail(id, `item "${item.id}" has unknown primary layer "${item.primary}". Known layers: ${known()}`);
    for (const extra of item.also ?? []) {
      if (!layerIndex.has(extra)) fail(id, `item "${item.id}" lists unknown layer "${extra}" in \`also\`. Known layers: ${known()}`);
    }
    if (item.status) {
      if (!STATUS_KINDS.includes(item.status.kind)) fail(id, `item "${item.id}" has unknown status kind "${item.status.kind}"`);
      if (item.status.kind !== "shutdown" && !item.status.label) fail(id, `item "${item.id}" needs a status \`label\` naming the counterparty`);
    }
    if (item.tier !== undefined && !tierById.has(item.tier)) {
      fail(id, tiers.length ? `item "${item.id}" has unknown tier "${item.tier}". Known tiers: ${[...tierById.keys()].join(", ")}` : `item "${item.id}" has a tier but the chart has no \`tiers\``);
    }
    if (item.value !== undefined && !Number.isFinite(item.value)) fail(id, `item "${item.id}" has a non-numeric \`value\``);
    const tier = item.tier !== undefined ? tierById.get(item.tier)! : null;
    const columns = [...new Set([primaryIndex!, ...(item.also ?? []).map((l) => layerIndex.get(l)!)])].sort((a, b) => a - b);
    const alsoLabels = columns.filter((c) => c !== primaryIndex).map((c) => layers[c].label);
    const statusText = item.status ? statusSentence(item.status, labels) : null;
    const size = [item.valueLabel, tier?.label].filter(Boolean).join(", ");
    const sentence = [
      `${item.name}.`,
      `${labels.main}: ${layers[primaryIndex!].label}.`,
      alsoLabels.length ? `${labels.also}: ${alsoLabels.join(", ")}.` : "",
      size ? `${labels.size}: ${size}.` : "",
      statusText ? `${statusText}.` : "",
      item.tags?.length ? `${item.tags.join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
    return {
      item,
      columns,
      runs: spanRuns(columns, primaryIndex!),
      layerIds: columns.map((c) => layers[c].id),
      layerLabels: [layers[primaryIndex!].label, ...alsoLabels],
      primaryIndex: primaryIndex!,
      tier,
      deal: Boolean(item.status && item.status.kind !== "shutdown"),
      monogram: monogram(item.name),
      sentence,
      statusText,
      badge: item.status ? statusBadge(item.status) : null,
    };
  });

  // Largest first (rows without a value last), then name. Expanding reveals
  // the non-featured rows in place, inside their groups.
  const byName = new Intl.Collator("en", { sensitivity: "base", numeric: true });
  const order = (a: SpanRowModel, b: SpanRowModel) =>
    (b.item.value ?? -Infinity) - (a.item.value ?? -Infinity) || byName.compare(a.item.name, b.item.name);

  const unique = (values: string[]) => [...new Set(values)];
  const groups: SpanGroupModel[] = (
    input.groupBy === "none"
      ? rows.length
        ? [{ layer: null, index: -1, members: rows }]
        : []
      : layers.map((layer, i) => ({ layer, index: i, members: rows.filter((r) => r.primaryIndex === i) })).filter((g) => g.members.length)
  ).map(({ layer, index, members }) => ({
    layer,
    index,
    rows: [...members].sort(order),
    featured: members.filter((r) => r.item.featured).length,
    layerIds: unique(members.flatMap((r) => r.layerIds)).sort((a, b) => layerIndex.get(a)! - layerIndex.get(b)!),
    tierIds: tiers.map((t) => t.id).filter((t) => members.some((r) => r.tier?.id === t)),
    hasDeal: members.some((r) => r.deal),
    keys: [],
  }));

  // Every filter state. Single filters hide rows and groups with one rule
  // each; a combination needs its own rule only where a group passes each
  // filter alone but has no row that passes them all.
  const dealOptions = rows.some((r) => r.deal) ? [false, true] : [false];
  const states: SpanFilter[] = [];
  for (const layer of [null, ...layers.map((l) => l.id)])
    for (const tier of [null, ...tiers.map((t) => t.id)])
      for (const deals of dealOptions) if (layer !== null || tier !== null || deals) states.push({ layer, tier, deals });
  const active = (f: SpanFilter) => Number(f.layer !== null) + Number(f.tier !== null) + Number(f.deals);
  const passesEach = (g: SpanGroupModel, f: SpanFilter) =>
    (f.layer === null || g.layerIds.includes(f.layer)) && (f.tier === null || g.tierIds.includes(f.tier)) && (!f.deals || g.hasDeal);
  const groupRules: { filter: SpanFilter; key: string }[] = [];
  for (const f of states) {
    if (active(f) < 2) continue;
    const lacking = groups.filter((g) => passesEach(g, f) && !g.rows.some((r) => matches(r, f)));
    if (!lacking.length) continue;
    const key = filterKey(f);
    groupRules.push({ filter: f, key });
    for (const g of groups) if (g.rows.some((r) => matches(r, f))) g.keys.push(key);
  }
  // Smallest empty states only: a superset of an empty state is empty too.
  const empty = states.filter((f) => !rows.some((r) => matches(r, f)));
  const within = (a: SpanFilter, b: SpanFilter) =>
    (a.layer === null || a.layer === b.layer) && (a.tier === null || a.tier === b.tier) && (!a.deals || b.deals) && filterKey(a) !== filterKey(b);
  const emptyStates = empty.filter((f) => !empty.some((g) => within(g, f)));

  const featured = rows.filter((r) => r.item.featured).length;
  const hasToggle = featured > 0 && featured < rows.length;
  const firstBadge = rows.find((r) => r.item.status?.kind === "acquired") ?? rows.find((r) => r.deal);

  return {
    id,
    layers,
    tiers,
    zones,
    groups,
    total: rows.length,
    featured,
    deals: rows.filter((r) => r.deal).length,
    hasToggle,
    initialAll: !hasToggle || input.initial === "all",
    labels,
    thresholds: spanThresholds(layers),
    groupRules,
    emptyStates,
    samples: {
      value:
        rows
          .filter((r) => r.item.valueLabel && r.item.value !== undefined)
          .sort((a, b) => b.item.value! - a.item.value!)[0]?.item.valueLabel ?? null,
      badge: firstBadge?.badge ?? null,
      tag: rows.find((r) => r.item.tags?.length)?.item.tags![0] ?? null,
      shut: rows.some((r) => r.item.status?.kind === "shutdown"),
    },
  };
}

/** A CSS identifier, escaped like CSS.escape, for ids in selectors. */
export const cssIdent = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9_\u00a0-\uffff-]/g, (c) => `\\${c.codePointAt(0)!.toString(16)} `)
    .replace(/^(-?)(\d)/, (_, dash: string, d: string) => `${dash}\\3${d} `);

/** A CSS string literal: safe inside a quoted attribute selector and inside <style>. */
export const cssString = (value: string) =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/</g, "\\3c ").replace(/\n/g, "\\a ")}"`;

/** Input ids, shared by the component, its rules and the enhancement. */
export const inputId = {
  layer: (chart: string, layer: string) => `${chart}-layer-${layer}`,
  layerAll: (chart: string) => `${chart}-layer-all`,
  tier: (chart: string, tier: string) => `${chart}-tier-${tier}`,
  tierAll: (chart: string) => `${chart}-tier-all`,
  deals: (chart: string) => `${chart}-deals`,
  expand: (chart: string) => `${chart}-all`,
};

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
export function spanChartCss(model: SpanChartModel) {
  const id = model.id;
  const root = `#${cssIdent(id)}`;
  const on = (input: string, pseudo = "checked") => `:has(#${cssIdent(input)}:${pseudo})`;
  const state = (f: SpanFilter) =>
    `${root}${f.layer !== null ? on(inputId.layer(id, f.layer)) : ""}${f.tier !== null ? on(inputId.tier(id, f.tier)) : ""}${f.deals ? on(inputId.deals(id)) : ""}`;
  const rules: string[] = [];
  model.layers.forEach((layer, k) => {
    const input = inputId.layer(id, layer.id);
    const value = cssString(layer.id);
    rules.push(`${root}${on(input)}{--sp-active:${k}}`);
    rules.push(`${root}${on(input)} [data-l=${value}]{--sp-sel:1;--sp-now:inline-flex}`);
    rules.push(`${root}${on(input, "focus-visible")} [data-l=${value}]{--sp-focus:1}`);
    rules.push(`${root}${on(input)} .uipack-span__item:not([data-layers~=${value}]),${root}${on(input)} .uipack-span__group:not([data-layers~=${value}]){display:none}`);
  });
  for (const tier of model.tiers) {
    const input = inputId.tier(id, tier.id);
    const value = cssString(tier.id);
    rules.push(`${root}${on(input)} [data-t=${value}]{--sp-sel:1;--sp-now:inline-flex}`);
    rules.push(`${root}${on(input, "focus-visible")} [data-t=${value}]{--sp-focus:1}`);
    rules.push(`${root}${on(input)} .uipack-span__item:not([data-tier=${value}]),${root}${on(input)} .uipack-span__group:not([data-tiers~=${value}]){display:none}`);
  }
  for (const { filter, key } of model.groupRules) rules.push(`${state(filter)} .uipack-span__group:not([data-k~=${cssString(key)}]){display:none}`);
  for (const f of model.emptyStates) rules.push(`${state(f)} .uipack-span__empty{display:block}`);

  // Layout: the name column, then label tiers, each from its computed width.
  const t = model.thresholds;
  const container = (w: number, body: string) => `@container uipack-span (min-width: ${w}px){${body}}`;
  rules.push(
    `@container uipack-span (max-width: ${t.stagger - 0.02}px){${root} .uipack-span__col:nth-child(odd){padding-bottom:22px}${root} .uipack-span__col>span{white-space:nowrap}}`,
    container(
      t.wide,
      `${root} .uipack-span__form{--sp-name-col:var(--sp-name);--sp-wide:block;--sp-stacked:none;--sp-line-cols:var(--sp-name) minmax(0,1fr);--sp-name-cols:8px 24px minmax(0,1fr) auto;--sp-name-areas:"chev logo label value" "chev logo sub sub";--sp-line-pad:0;--sp-name-pad:6px 12px 6px 0;--sp-detail-pad:2px 8px 12px 56px;--sp-tick-top:19px;--sp-tick-bottom:auto}`,
    ),
    container(t.short, `${root} .uipack-span__form{--sp-label-abbr:none;--sp-label-short:block}`),
    container(t.full, `${root} .uipack-span__form{--sp-label-short:none;--sp-label-full:block}`),
    container(t.large, `${root} .uipack-span__form{--sp-label-size:12px}`),
  );
  return rules.join("\n");
}
