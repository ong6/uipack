/* SpanChart data model: validation, grouping, sorting, runs, counts and the
   scoped filter rules. Pure functions, so a static build and a client render
   produce the same markup, and bad data fails the consumer's build. */

export type SpanStatusKind = "acquired" | "pending" | "licensed" | "shutdown";

/** One column of the stack. Columns run left (bottom of the stack) to right (top). */
export interface SpanLayer {
  id: string;
  label: string;
  /** Three-letter code used when the full labels do not fit, e.g. "INF". */
  abbr: string;
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
export interface SpanChartLabels {
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

export const DEFAULT_LABELS: SpanChartLabels = {
  company: "Company",
  showAll: "Show all {n} companies",
  showFeatured: "Show the {n} featured",
  allLayers: "All layers",
  main: "Main layer",
  also: "Also in",
  filter: "Filter by layer",
  size: "Size",
  allSizes: "All sizes",
  valueLegend: "Size, largest first in each layer",
  showing: "{n} of {total} in {layer}",
  showingSize: "{n} of {total} · {size}",
  showingBoth: "{n} of {total} in {layer} · {size}",
  empty: "Nothing matches both filters.",
  asOf: "As of {date}",
  website: "Website",
  source: "Source",
  acquired: "Acquired by {label}",
  pending: "Sale agreed to {label}",
  licensed: "Technology licensed to {label}",
  shutdown: "Shut down",
  legendChange: "Acquired, being sold or licensed to",
  legendShutdown: "Shut down",
};

export interface SpanChartInput {
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
  monogram: string;
  sentence: string;
  statusText: string | null;
  badge: string | null;
}

/** A filter state: a layer id or null (all layers), a tier id or null (all sizes). */
export type SpanFilter = readonly [layer: string | null, tier: string | null];

export interface SpanGroupModel {
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

export interface SpanZoneSpan {
  zone: SpanZone;
  start: number;
  end: number;
}

export interface SpanChartModel {
  id: string;
  layers: SpanLayer[];
  tiers: SpanTier[];
  zones: SpanZoneSpan[];
  groups: SpanGroupModel[];
  total: number;
  featured: number;
  /** Every filter state except "all, all", with its matching row count. */
  filters: { filter: SpanFilter; key: string; count: number }[];
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

export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));

export const filterKey = ([layer, tier]: SpanFilter) => `${layer ?? "*"}|${tier ?? "*"}`;

const fail = (chart: string, message: string): never => {
  throw new Error(`SpanChart "${chart}": ${message}`);
};

const NO_SPACE = /^\S+$/;
const STATUS_KINDS: SpanStatusKind[] = ["acquired", "pending", "licensed", "shutdown"];

/** One or two initials: words, hyphen parts and camelCase humps ("OpenRouter" → "OR"). */
export function monogram(name: string) {
  const words = name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[\s-]+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+/u, ""))
    .filter(Boolean);
  const letters = words.map((w) => w[0]);
  return (letters.length >= 2 ? letters[0] + letters[1] : letters[0] ?? "?").toUpperCase();
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
   against SF Pro at 12px. Enough to place the breakpoint where the two-line
   column labels fit; a wider host font wraps a label to a third line rather
   than clipping it. */
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

/** Narrowest width a label needs to fit on at most two lines at `px`. */
export function twoLineWidth(label: string, px = 12) {
  const words = label.split(/\s+/).filter(Boolean);
  let best = textWidth(label, px);
  for (let i = 1; i < words.length; i++) {
    const a = textWidth(words.slice(0, i).join(" "), px);
    const b = textWidth(words.slice(i).join(" "), px);
    best = Math.min(best, Math.max(a, b));
  }
  return Math.max(best, ...words.map((w) => textWidth(w, px)));
}

/* Layout constants shared with charts.css. */
export const NAME_WIDTH = 220;
export const SIDE_PADDING = 24;
export const NARROW_BELOW = 640;
/** Least space between two neighbouring centred column labels. */
const LABEL_GAP = 8;

/** Column width at which every label fits on two lines without crowding its neighbour. */
export function fullLabelColumn(labels: string[], px = 12) {
  const w = labels.map((l) => twoLineWidth(l, px));
  return Math.max(...w.map((x, i) => Math.max(x + 2, i ? (x + w[i - 1]) / 2 + LABEL_GAP : 0)));
}

const matches = (row: SpanRowModel, [layer, tier]: SpanFilter) =>
  (layer === null || row.layerIds.includes(layer)) && (tier === null || row.tier?.id === tier);

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

  // Every filter state except "all layers, all sizes".
  const states: SpanFilter[] = [];
  for (const layer of [null, ...layers.map((l) => l.id)]) {
    for (const tier of [null, ...tiers.map((t) => t.id)]) if (layer !== null || tier !== null) states.push([layer, tier]);
  }

  const group = (layer: SpanLayer | null, index: number, members: SpanRowModel[]): SpanGroupModel => {
    const counts = new Map<string, number>();
    for (const state of states) {
      const n = members.filter((r) => matches(r, state)).length;
      if (n) counts.set(filterKey(state), n);
    }
    const unique = (values: string[]) => [...new Set(values)];
    return {
      layer,
      index,
      rows: [...members].sort(order),
      featured: members.filter((r) => r.item.featured).length,
      layerIds: unique(members.flatMap((r) => r.layerIds)).sort((a, b) => layerIndex.get(a)! - layerIndex.get(b)!),
      tierIds: tiers.map((t) => t.id).filter((t) => members.some((r) => r.tier?.id === t)),
      pairs: unique(members.flatMap((r) => (r.tier ? r.layerIds.map((l) => `${l}|${r.tier!.id}`) : []))),
      counts,
    };
  };
  const groups =
    input.groupBy === "none"
      ? rows.length
        ? [group(null, -1, rows)]
        : []
      : layers
          .map((layer, i) => group(layer, i, rows.filter((r) => r.primaryIndex === i)))
          .filter((g) => g.rows.length > 0);

  const featured = rows.filter((r) => r.item.featured).length;
  const hasToggle = featured > 0 && featured < rows.length;
  const at = (px: number) =>
    Math.max(NARROW_BELOW, Math.ceil(SIDE_PADDING * 2 + NAME_WIDTH + fullLabelColumn(layers.map((l) => l.label), px) * layers.length));

  return {
    id,
    layers,
    tiers,
    zones,
    groups,
    total: rows.length,
    featured,
    filters: states.map((filter) => ({ filter, key: filterKey(filter), count: rows.filter((r) => matches(r, filter)).length })),
    hasToggle,
    initialAll: !hasToggle || input.initial === "all",
    labels,
    fullLabelsAt: at(11),
    largeLabelsAt: at(12),
    hasChange: rows.some((r) => r.item.status && r.item.status.kind !== "shutdown"),
    hasShutdown: rows.some((r) => r.item.status?.kind === "shutdown"),
    valueSample:
      rows
        .filter((r) => r.item.valueLabel && r.item.value !== undefined)
        .sort((a, b) => b.item.value! - a.item.value!)[0]?.item.valueLabel ?? null,
  };
}

/** The footer line for a filter state. */
export function filterStatus(model: SpanChartModel, [layer, tier]: SpanFilter, count: number) {
  const values = {
    n: count,
    total: model.total,
    layer: model.layers.find((l) => l.id === layer)?.label ?? "",
    size: model.tiers.find((t) => t.id === tier)?.label ?? "",
  };
  const template = layer && tier ? model.labels.showingBoth : layer ? model.labels.showing : model.labels.showingSize;
  return fill(template, values);
}

/** A CSS string literal: safe inside a quoted attribute selector and inside <style>. */
export const cssString = (value: string) =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/</g, "\\3c ").replace(/\n/g, "\\a ")}"`;

/**
 * The chart's own rules, scoped by its id. Choosing layer L marks its column
 * and hides rows and groups that do not touch L; choosing tier T hides rows
 * and groups outside T; with both, a group stays only if one row matches both.
 * Each filter state shows its own counts, and the empty message when nothing
 * matches. Also switches the column headers to full labels once the
 * container is wide enough for them.
 */
export function spanChartCss(model: SpanChartModel) {
  const root = `.uipack-span[id=${cssString(model.id)}]`;
  const layerOn = (l: string) => `:has(.uipack-span__layer-input[value=${cssString(l)}]:checked)`;
  const tierOn = (t: string) => `:has(.uipack-span__tier-input[value=${cssString(t)}]:checked)`;
  const state = ([l, t]: SpanFilter) =>
    `${root}${l === null ? ":has(.uipack-span__all-input:checked)" : layerOn(l)}${t === null ? (model.tiers.length ? ":has(.uipack-span__tier-all:checked)" : "") : tierOn(t)}`;
  const rules: string[] = [];
  model.layers.forEach((layer, k) => {
    const on = `${root}${layerOn(layer.id)}`;
    const value = cssString(layer.id);
    rules.push(`${on}{--sp-active:${k}}`);
    rules.push(`${on} .uipack-span__item:not([data-layers~=${value}]),${on} .uipack-span__group:not([data-layers~=${value}]){display:none}`);
  });
  for (const tier of model.tiers) {
    const on = `${root}${tierOn(tier.id)}`;
    const value = cssString(tier.id);
    rules.push(`${on} .uipack-span__item:not([data-tier=${value}]),${on} .uipack-span__group:not([data-tiers~=${value}]){display:none}`);
    for (const layer of model.layers) {
      rules.push(`${root}${layerOn(layer.id)}${tierOn(tier.id)} .uipack-span__group:not([data-pairs~=${cssString(`${layer.id}|${tier.id}`)}]){display:none}`);
    }
  }
  for (const { filter, key, count } of model.filters) {
    rules.push(`${state(filter)} [data-span-key=${cssString(key)}]{display:inline}`);
    if (count === 0) rules.push(`${state(filter)} .uipack-span__empty{display:block}`);
  }
  // Codes and a key until the full labels fit on two lines: first at 11px, then at 12px.
  rules.push(
    `@container uipack-span (min-width: ${model.fullLabelsAt}px){${root} .uipack-span__full{display:block}${root} .uipack-span__abbr{display:none}${root} .uipack-span__key{display:none}}`,
    `@container uipack-span (min-width: ${model.largeLabelsAt}px){${root} .uipack-span__full{font-size:12px;line-height:15px}}`,
  );
  return rules.join("\n");
}
