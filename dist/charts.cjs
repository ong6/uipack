"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from2, except, desc) => {
  if (from2 && typeof from2 === "object" || typeof from2 === "function") {
    for (let key of __getOwnPropNames(from2))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from2[key], enumerable: !(desc = __getOwnPropDesc(from2, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/charts/index.ts
var charts_exports = {};
__export(charts_exports, {
  LAYER_STACK_LABELS: () => LAYER_STACK_LABELS,
  LayerStack: () => LayerStack,
  SPAN_CHART_LABELS: () => DEFAULT_LABELS,
  SpanChart: () => SpanChart,
  buildLayerStack: () => buildLayerStack,
  buildSpanModel: () => buildSpanModel,
  enhanceLayerStack: () => enhanceLayerStack,
  enhanceSpanChart: () => enhanceSpanChart,
  spanChartCss: () => spanChartCss,
  spanThresholds: () => spanThresholds
});
module.exports = __toCommonJS(charts_exports);

// src/charts/model.ts
var DEFAULT_LABELS = {
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
  keyBars: "Bars",
  keyDeals: "Deals",
  keySize: "Size",
  keyType: "Type",
  keyMain: "Main",
  keyAlso: "Also in",
  valueLegend: "largest first",
  tagLegend: "tag",
  legendAcquired: "acquired",
  legendPending: "pending",
  legendLicensed: "licensed",
  legendShutdown: "shut down",
  layerHint: "Click a column to filter",
  layerHintTouch: "Tap a column to filter",
  find: "Find a company",
  noMatch: "No company matches \u201C{q}\u201D",
  clearSearch: "Clear",
  asOf: "As of {date}",
  website: "Website",
  source: "Source",
  acquired: "Acquired by {label}",
  pending: "Sale agreed to {label}",
  licensed: "Technology licensed to {label}",
  shutdown: "Shut down"
};
var fill = (template, values) => template.replace(/\{(\w+)\}/g, (match, key) => key in values ? String(values[key]) : match);
var filterKey = ({ layer, tier, deals }) => `${layer ?? "*"}|${tier ?? "*"}|${deals ? "d" : "*"}`;
var fail = (chart, message) => {
  throw new Error(`SpanChart "${chart}": ${message}`);
};
var NO_SPACE = /^\S+$/;
var STATUS_KINDS = ["acquired", "pending", "licensed", "shutdown"];
function monogram(name) {
  const words = name.replace(/([a-z])([A-Z])/g, "$1 $2").split(/[\s-]+/).map((w) => w.replace(/^[^\p{L}\p{N}]+/u, "")).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  const word = words[0] ?? "?";
  return word[0].toUpperCase() + (word[1] ?? "");
}
function spanRuns(columns, main) {
  const runs = [];
  for (const c of columns) {
    const last = runs[runs.length - 1];
    if (last && c === last.end + 1) last.end = c;
    else runs.push({ start: c, end: c, main: null });
  }
  for (const run of runs) if (main >= run.start && main <= run.end) run.main = main;
  return runs;
}
var statusShort = (label = "") => label.split(",")[0].trim();
function statusBadge(status) {
  if (status.kind === "shutdown") return "shut";
  const who = statusShort(status.label);
  return `${status.kind === "licensed" ? "\u219D" : "\u2192"} ${who}`;
}
function statusSentence(status, labels) {
  if (status.kind === "shutdown") return status.label ? `${labels.shutdown}, ${status.label}` : labels.shutdown;
  return fill(labels[status.kind], { label: status.label ?? "" });
}
var ADVANCE = {
  11: "7r98eai1i1qwk98wb7b7dei18wde8w8wi6dihbhzighriagtifia8w8wi1i1i1etprjfirkakjgygal1l683fpiyg7orl1lqi6lqipi8i0kvjbrfjiiviob78wb7i1fre2fuhkfzhkgbaphfgx7e7efs7lowgsguhghgbheuargsfmmdf9frfeb77qb7i1",
  12: "7l92e4hwhwqqk38qb1b1d8hw8qd88q8qi0dch5htiahli4goi9i48q8qhwhwhwenplj9ilk4kdgsg5kvl07xfjisg1olkvlki0lkiji2hvkpj5r9jcipijb18qb1hwfldwfoheftheg5ajhagr7878fn7forgmgphbhabbeoalgmfgm7f3flf8b17kb1hw"
};
var advance = (px) => {
  const table = ADVANCE[px <= 11 ? 11 : 12];
  return (ch) => {
    const i = ch.charCodeAt(0) - 32;
    return i >= 0 && i < 95 ? parseInt(table.slice(i * 2, i * 2 + 2), 36) / 1e3 : 0.6;
  };
};
function textWidth(text, px, tracking = 0) {
  const em = advance(px);
  let w = 0;
  for (const ch of text) w += em(ch) + tracking;
  return w * px;
}
function twoLineWidth(label, px = 12, tracking = 0) {
  const words = label.split(/(?<=-)|\s+/).filter(Boolean);
  const join = (parts) => parts.join(" ").replace(/- /g, "-");
  const w = (t) => textWidth(t, px, tracking);
  let best = w(label);
  for (let i = 1; i < words.length; i++) best = Math.min(best, Math.max(w(join(words.slice(0, i))), w(join(words.slice(i)))));
  return Math.max(best, ...words.map(w));
}
function fullLabelColumn(labels, px = 12, gap = LABEL_GAP, tracking = 0) {
  const w = labels.map((l) => twoLineWidth(l, px, tracking));
  return Math.max(...w.map((x, i) => Math.max(x + 2, i ? (x + w[i - 1]) / 2 + gap : 0)));
}
var NARROW_BELOW = 640;
var ROOMY_FROM = 1e3;
var NAME_WIDTH = [216, 240];
var SIDE_PADDING = [0, 0];
var SHORT_MIN = 48;
var LABEL_GAP = 8;
var SHORT_TRACKING = -0.01;
function columnWidth(c, layers, wide) {
  const roomy = c >= ROOMY_FROM ? 1 : 0;
  return (c - 2 * SIDE_PADDING[roomy] - (wide ? NAME_WIDTH[roomy] : 0)) / layers;
}
function from(ok, floor = 0) {
  let w = 2400;
  for (let c = 2400; c >= floor; c--) {
    if (!ok(c)) break;
    w = c;
  }
  return w;
}
function spanThresholds(layers) {
  const n = layers.length;
  const shortCol = Math.max(SHORT_MIN, fullLabelColumn(layers.map((l) => (l.short ?? l.abbr).replace(/-/g, "- ")), 11, LABEL_GAP, SHORT_TRACKING));
  const wide = from((c) => columnWidth(c, n, true) >= shortCol, NARROW_BELOW);
  const col = (c) => columnWidth(c, n, c >= wide);
  const full = fullLabelColumn(layers.map((l) => l.label), 11);
  const large = fullLabelColumn(layers.map((l) => l.label), 12);
  const short = from((c) => col(c) >= shortCol, 200);
  const codeCol = Math.max(...layers.map((l) => l.abbr.length)) * 6.6 + LABEL_GAP;
  const stagger = from((c) => col(c) >= codeCol, 200);
  const fullAt = Math.max(short, from((c) => col(c) >= full, 200));
  return { stagger, wide, short, full: fullAt, large: Math.max(fullAt, from((c) => col(c) >= large, 200)) };
}
var matches = (row, f) => (f.layer === null || row.layerIds.includes(f.layer)) && (f.tier === null || row.tier?.id === f.tier) && (!f.deals || row.deal);
function buildSpanModel(input) {
  const { id, layers, items } = input;
  if (typeof id !== "string" || !NO_SPACE.test(id)) fail(String(id), "`id` must be a non-empty string without spaces");
  if (!Array.isArray(layers) || layers.length === 0) fail(id, "`layers` must list at least one layer");
  if (!Array.isArray(items)) fail(id, "`items` must be an array");
  const labels = { ...DEFAULT_LABELS, ...input.labels };
  const layerIndex = /* @__PURE__ */ new Map();
  layers.forEach((layer, i) => {
    if (!layer || typeof layer.id !== "string" || !NO_SPACE.test(layer.id)) fail(id, `layer ${i} needs an \`id\` without spaces`);
    if (layerIndex.has(layer.id)) fail(id, `layer id "${layer.id}" is used twice`);
    if (!layer.label) fail(id, `layer "${layer.id}" needs a \`label\``);
    if (!layer.abbr) fail(id, `layer "${layer.id}" needs an \`abbr\` (a short code such as "INF")`);
    layerIndex.set(layer.id, i);
  });
  const known = () => [...layerIndex.keys()].join(", ");
  const tiers = input.tiers ?? [];
  const tierById = /* @__PURE__ */ new Map();
  tiers.forEach((tier, i) => {
    if (!tier || typeof tier.id !== "string" || !NO_SPACE.test(tier.id)) fail(id, `tier ${i} needs an \`id\` without spaces`);
    if (tierById.has(tier.id)) fail(id, `tier id "${tier.id}" is used twice`);
    if (!tier.label) fail(id, `tier "${tier.id}" needs a \`label\``);
    tierById.set(tier.id, tier);
  });
  const zoneById = /* @__PURE__ */ new Map();
  for (const zone of input.zones ?? []) {
    if (!zone || !zone.id) fail(id, "every zone needs an `id`");
    if (zoneById.has(zone.id)) fail(id, `zone id "${zone.id}" is used twice`);
    zoneById.set(zone.id, zone);
  }
  const zones = [];
  layers.forEach((layer, i) => {
    if (layer.zone === void 0) return;
    const zone = zoneById.get(layer.zone);
    if (!zone) fail(id, `layer "${layer.id}" names unknown zone "${layer.zone}"`);
    const last = zones[zones.length - 1];
    if (last && last.zone.id === layer.zone && last.end === i - 1) last.end = i;
    else if (zones.some((z) => z.zone.id === layer.zone)) fail(id, `zone "${layer.zone}" must cover consecutive layers; "${layer.id}" is separated from the rest`);
    else zones.push({ zone, start: i, end: i });
  });
  const seen = /* @__PURE__ */ new Set();
  const rows = items.map((item, i) => {
    if (!item || typeof item.id !== "string" || !item.id) fail(id, `item ${i} needs an \`id\``);
    if (seen.has(item.id)) fail(id, `item id "${item.id}" is used twice`);
    seen.add(item.id);
    if (!item.name) fail(id, `item "${item.id}" needs a \`name\``);
    const primaryIndex = layerIndex.get(item.primary);
    if (primaryIndex === void 0) fail(id, `item "${item.id}" has unknown primary layer "${item.primary}". Known layers: ${known()}`);
    for (const extra of item.also ?? []) {
      if (!layerIndex.has(extra)) fail(id, `item "${item.id}" lists unknown layer "${extra}" in \`also\`. Known layers: ${known()}`);
    }
    if (item.status) {
      if (!STATUS_KINDS.includes(item.status.kind)) fail(id, `item "${item.id}" has unknown status kind "${item.status.kind}"`);
      if (item.status.kind !== "shutdown" && !item.status.label) fail(id, `item "${item.id}" needs a status \`label\` naming the counterparty`);
    }
    if (item.tier !== void 0 && !tierById.has(item.tier)) {
      fail(id, tiers.length ? `item "${item.id}" has unknown tier "${item.tier}". Known tiers: ${[...tierById.keys()].join(", ")}` : `item "${item.id}" has a tier but the chart has no \`tiers\``);
    }
    if (item.value !== void 0 && !Number.isFinite(item.value)) fail(id, `item "${item.id}" has a non-numeric \`value\``);
    const tier = item.tier !== void 0 ? tierById.get(item.tier) : null;
    const columns = [.../* @__PURE__ */ new Set([primaryIndex, ...(item.also ?? []).map((l) => layerIndex.get(l))])].sort((a, b) => a - b);
    const alsoLabels = columns.filter((c) => c !== primaryIndex).map((c) => layers[c].label);
    const statusText = item.status ? statusSentence(item.status, labels) : null;
    const size = [item.valueLabel, tier?.label].filter(Boolean).join(", ");
    const sentence = [
      `${item.name}.`,
      `${labels.main}: ${layers[primaryIndex].label}.`,
      alsoLabels.length ? `${labels.also}: ${alsoLabels.join(", ")}.` : "",
      size ? `${labels.size}: ${size}.` : "",
      statusText ? `${statusText}.` : "",
      item.tags?.length ? `${item.tags.join(", ")}.` : ""
    ].filter(Boolean).join(" ");
    return {
      item,
      columns,
      runs: spanRuns(columns, primaryIndex),
      layerIds: columns.map((c) => layers[c].id),
      layerLabels: [layers[primaryIndex].label, ...alsoLabels],
      primaryIndex,
      tier,
      deal: Boolean(item.status && item.status.kind !== "shutdown"),
      monogram: monogram(item.name),
      sentence,
      statusText,
      badge: item.status ? statusBadge(item.status) : null
    };
  });
  const byName = new Intl.Collator("en", { sensitivity: "base", numeric: true });
  const order = (a, b) => (b.item.value ?? -Infinity) - (a.item.value ?? -Infinity) || byName.compare(a.item.name, b.item.name);
  const unique = (values) => [...new Set(values)];
  const groups = (input.groupBy === "none" ? rows.length ? [{ layer: null, index: -1, members: rows }] : [] : layers.map((layer, i) => ({ layer, index: i, members: rows.filter((r) => r.primaryIndex === i) })).filter((g) => g.members.length)).map(({ layer, index, members }) => ({
    layer,
    index,
    rows: [...members].sort(order),
    featured: members.filter((r) => r.item.featured).length,
    layerIds: unique(members.flatMap((r) => r.layerIds)).sort((a, b) => layerIndex.get(a) - layerIndex.get(b)),
    tierIds: tiers.map((t) => t.id).filter((t) => members.some((r) => r.tier?.id === t)),
    hasDeal: members.some((r) => r.deal),
    keys: []
  }));
  const dealOptions = rows.some((r) => r.deal) ? [false, true] : [false];
  const states = [];
  for (const layer of [null, ...layers.map((l) => l.id)])
    for (const tier of [null, ...tiers.map((t) => t.id)])
      for (const deals of dealOptions) if (layer !== null || tier !== null || deals) states.push({ layer, tier, deals });
  const active = (f) => Number(f.layer !== null) + Number(f.tier !== null) + Number(f.deals);
  const passesEach = (g, f) => (f.layer === null || g.layerIds.includes(f.layer)) && (f.tier === null || g.tierIds.includes(f.tier)) && (!f.deals || g.hasDeal);
  const groupRules = [];
  for (const f of states) {
    if (active(f) < 2) continue;
    const lacking = groups.filter((g) => passesEach(g, f) && !g.rows.some((r) => matches(r, f)));
    if (!lacking.length) continue;
    const key = filterKey(f);
    groupRules.push({ filter: f, key });
    for (const g of groups) if (g.rows.some((r) => matches(r, f))) g.keys.push(key);
  }
  const empty = states.filter((f) => !rows.some((r) => matches(r, f)));
  const within = (a, b) => (a.layer === null || a.layer === b.layer) && (a.tier === null || a.tier === b.tier) && (!a.deals || b.deals) && filterKey(a) !== filterKey(b);
  const emptyStates = empty.filter((f) => !empty.some((g) => within(g, f)));
  const featured = rows.filter((r) => r.item.featured).length;
  const hasToggle = featured > 0 && featured < rows.length;
  return {
    id,
    layers,
    tiers,
    zones,
    groups,
    total: rows.length,
    featured,
    deals: rows.filter((r) => r.deal).length,
    tierCounts: tiers.map((t) => rows.filter((r) => r.tier?.id === t.id).length),
    layerCounts: layers.map((l) => rows.filter((r) => r.layerIds.includes(l.id)).length),
    hasToggle,
    initialAll: !hasToggle || input.initial === "all",
    labels,
    thresholds: spanThresholds(layers),
    groupRules,
    emptyStates,
    samples: {
      value: rows.filter((r) => r.item.valueLabel && r.item.value !== void 0).sort((a, b) => b.item.value - a.item.value)[0]?.item.valueLabel ?? null,
      tag: rows.find((r) => r.item.tags?.length)?.item.tags[0] ?? null,
      badges: STATUS_KINDS.filter((kind) => rows.some((r) => r.item.status?.kind === kind))
    }
  };
}
var cssIdent = (value) => value.replace(/[^a-zA-Z0-9_\u00a0-\uffff-]/g, (c) => `\\${c.codePointAt(0).toString(16)} `).replace(/^(-?)(\d)/, (_, dash, d) => `${dash}\\3${d} `);
var cssString = (value) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/</g, "\\3c ").replace(/\n/g, "\\a ")}"`;
var inputId = {
  layer: (chart, layer) => `${chart}-layer-${layer}`,
  layerAll: (chart) => `${chart}-layer-all`,
  tier: (chart, tier) => `${chart}-tier-${tier}`,
  tierAll: (chart) => `${chart}-tier-all`,
  deals: (chart) => `${chart}-deals`,
  expand: (chart) => `${chart}-all`
};
function spanChartCss(model) {
  const id = model.id;
  const root = `#${cssIdent(id)}`;
  const on = (input, pseudo = "checked") => `:has(#${cssIdent(input)}:${pseudo})`;
  const state = (f) => `${root}${f.layer !== null ? on(inputId.layer(id, f.layer)) : ""}${f.tier !== null ? on(inputId.tier(id, f.tier)) : ""}${f.deals ? on(inputId.deals(id)) : ""}`;
  const rules = [];
  model.layers.forEach((layer, k) => {
    const input = inputId.layer(id, layer.id);
    const value = cssString(layer.id);
    rules.push(`${root}${on(input)}{--sp-active:${k}}`);
    rules.push(`${root}${on(input)} [data-l=${value}]{--sp-sel:1;--sp-now:inline-flex;--sp-now-text:inline}`);
    rules.push(`${root}${on(input, "focus-visible")} [data-l=${value}]{--sp-focus:1}`);
    rules.push(`${root}${on(input)} .uipack-span__item:not([data-layers~=${value}]),${root}${on(input)} .uipack-span__group:not([data-layers~=${value}]){display:none}`);
  });
  for (const tier of model.tiers) {
    const input = inputId.tier(id, tier.id);
    const value = cssString(tier.id);
    rules.push(`${root}${on(input)} [data-t=${value}]{--sp-sel:1;--sp-now:inline-flex;--sp-now-text:inline}`);
    rules.push(`${root}${on(input, "focus-visible")} [data-t=${value}]{--sp-focus:1}`);
    rules.push(`${root}${on(input)} .uipack-span__item:not([data-tier=${value}]),${root}${on(input)} .uipack-span__group:not([data-tiers~=${value}]){display:none}`);
  }
  rules.push(
    `@media (hover: hover) and (pointer: fine){${model.layers.map((layer, k) => `${root}:has(.uipack-span__col[data-l=${cssString(layer.id)}]:hover){--sp-hover:${k};--sp-hover-on:block}`).join("")}}`
  );
  for (const { filter, key } of model.groupRules) rules.push(`${state(filter)} .uipack-span__group:not([data-k~=${cssString(key)}]){display:none}`);
  for (const f of model.emptyStates) rules.push(`${state(f)} .uipack-span__empty{display:grid}`);
  const t = model.thresholds;
  const container = (w, body) => `@container uipack-span (min-width: ${w}px){${body}}`;
  rules.push(
    `@container uipack-span (max-width: ${t.stagger - 0.02}px){${root} .uipack-span__col:nth-child(odd){padding-bottom:22px}${root} .uipack-span__col>span{white-space:nowrap}}`,
    container(
      t.wide,
      `${root} .uipack-span__form{--sp-name-col:var(--sp-name);--sp-wide:block;--sp-stacked:none;--sp-line-cols:var(--sp-name) minmax(0,1fr);--sp-label-grow:1;--sp-line-pad:0;--sp-line-min:44px;--sp-name-pad:4px 12px 4px 0;--sp-detail-margin:0 8px 10px 56px;--sp-ccount:block}`
    ),
    // Where headers carry words the key and toolbar sit open; with codes the
    // drawer holds them, its layer chips doubling as the code key.
    container(t.short, `${root} .uipack-span__form{--sp-label-abbr:none;--sp-label-short:block;--sp-open:flex;--sp-closed:none;--sp-all-ring:2px;--sp-hint-toolbar:block;--sp-find-max:280px}`),
    // No size or deals control: the search field sits on the key's row.
    container(
      t.short,
      `${root}[data-lean] .uipack-span__head{grid-template-columns:minmax(0,1fr) auto}${root}[data-lean] .uipack-span__head>*{grid-column:1/-1}${root}[data-lean] .uipack-span__panel{grid-column:1;align-self:center}${root}[data-lean] .uipack-span__toolbar{grid-column:2}${root}[data-lean] .uipack-span__find:not([hidden]){flex:none;width:260px}`
    ),
    // With the name column the hint sits in the header's corner instead.
    container(t.wide, `${root} .uipack-span__form{--sp-hint-toolbar:none}`),
    container(t.full, `${root} .uipack-span__form{--sp-label-short:none;--sp-label-full:block}`),
    container(t.large, `${root} .uipack-span__form{--sp-label-size:12px}`)
  );
  return rules.join("\n");
}

// src/charts/caseSafe.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function CaseSafe({ text, keep }) {
  const parts = text.split(/(\s+)/);
  if (!parts.some(mangled)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: text });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: parts.map(
    (part, i) => mangled(part) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: keep, children: part }, i) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: part }, i)
  ) });
}
var mangled = (word) => /\d/.test(word) && /[a-z]/.test(word) || /[a-z]/.test(word) && /^.+[A-Z]/u.test(word.replace(/^[^A-Za-z]*/, ""));

// src/charts/SpanChart.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var vars = (values) => values;
var breakable = (text) => text.split(/(?<=-)/).map((part, i, parts) => i < parts.length - 1 ? [part, /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("wbr", {}, i)] : part);
function Row({ row, labels }) {
  const { item } = row;
  const meta = [
    `${labels.main}: ${row.layerLabels[0]}`,
    row.layerLabels.length > 1 ? `${labels.also}: ${row.layerLabels.slice(1).join(", ")}` : null,
    item.valueLabel || row.tier ? `${labels.size}: ${[item.valueLabel, row.tier?.label].filter(Boolean).join(", ")}` : null,
    row.statusText
  ].filter(Boolean);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "li",
    {
      className: "uipack-span__item",
      "data-item": item.id,
      "data-layers": row.layerIds.join(" "),
      "data-tier": row.tier?.id,
      "data-deal": row.deal ? "" : void 0,
      "data-featured": item.featured ? "" : void 0,
      children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("summary", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__sr", children: row.sentence }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-span__line", "aria-hidden": "true", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-span__name", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("i", {}),
              item.logo ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__logo", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("img", { src: item.logo, alt: "", width: 20, height: 20, loading: "lazy", decoding: "async" }) }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__logo uipack-span__logo--mono", children: row.monogram }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-span__nv", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { title: item.name.length > 18 ? item.name : void 0, children: item.name }),
                item.valueLabel ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("em", { title: item.valueLabel.length > 8 ? item.valueLabel : void 0, children: item.valueLabel }) : null
              ] }),
              row.badge || item.tags?.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-span__sub", children: [
                row.badge && item.status ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__badge", "data-kind": item.status.kind, children: row.badge }) : null,
                item.tags?.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__tag", children: tag }, tag))
              ] }) : null
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__track", children: row.runs.map((run) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: vars({ "--a": run.start + 1, "--n": run.end - run.start + 1 }), children: run.main !== null ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: vars({ "--at": run.main - run.start }) }) : null }, run.start)) })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-span__detail", children: [
          item.note ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: item.note }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "uipack-span__meta", children: [
            meta.map((text) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: text }, text)),
            item.href ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("a", { href: item.href, children: labels.website }) }) : null,
            item.source ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("a", { href: item.source, children: labels.source }) }) : null
          ] })
        ] })
      ] })
    }
  );
}
function withCount(template, n) {
  const [before, after = ""] = template.split("{n}");
  return template.includes("{n}") ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    before,
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__num", children: n }),
    after
  ] }) : template;
}
function Key({ model }) {
  const { labels, samples } = model;
  const word = (kind) => labels[`legend${kind[0].toUpperCase()}${kind.slice(1)}`];
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("ul", { className: "uipack-span__key", role: "list", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__key-label", children: labels.keyBars }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-span__key-item", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__swatch uipack-span__swatch--main", "aria-hidden": "true" }),
        labels.keyMain
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-span__key-item", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__swatch uipack-span__swatch--also", "aria-hidden": "true" }),
        labels.keyAlso
      ] })
    ] }),
    samples.badges.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__key-label", children: labels.keyDeals }),
      samples.badges.map((kind) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__badge", "data-kind": kind, children: kind === "shutdown" ? word(kind) : `${kind === "licensed" ? "\u219D" : "\u2192"} ${word(kind)}` }, kind))
    ] }) : null,
    samples.value ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__key-label", children: labels.keySize }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-span__key-item", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("em", { className: "uipack-span__sample", children: samples.value }),
        labels.valueLegend
      ] })
    ] }) : null,
    samples.tag ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__key-label", children: labels.keyType }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-span__key-item", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__tag", children: samples.tag }),
        labels.tagLegend
      ] })
    ] }) : null
  ] });
}
function SizeControl({ model }) {
  const { id, labels, tiers } = model;
  if (!tiers.length) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-span__seg", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__seg-label", children: labels.size }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { htmlFor: inputId.tierAll(id), className: "uipack-span__chip uipack-span__chip--all", "data-t": "*", children: [
      labels.allSizes,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__num", children: model.total })
    ] }),
    tiers.map((tier, k) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { htmlFor: inputId.tier(id, tier.id), className: "uipack-span__chip", "data-t": tier.id, title: tier.range, children: [
      tier.label,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__num", children: model.tierCounts[k] })
    ] }, tier.id))
  ] });
}
function DealsToggle({ model }) {
  return model.deals ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { htmlFor: inputId.deals(model.id), className: "uipack-span__chip uipack-span__chip--toggle", "data-d": "", "aria-hidden": "true", children: [
    model.labels.deals,
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__num", children: model.deals })
  ] }) : null;
}
function LayerChips({ model }) {
  const { id, labels, layers } = model;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-span__wrap", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__seg-label", children: labels.layer }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: inputId.layerAll(id), className: "uipack-span__chip uipack-span__chip--all", "data-l": "*", children: labels.allLayers }),
    layers.map((layer) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { htmlFor: inputId.layer(id, layer.id), className: "uipack-span__chip", "data-l": layer.id, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__code", children: layer.abbr }),
      layer.short ?? layer.label
    ] }, layer.id))
  ] });
}
function SpanChart(props) {
  const model = buildSpanModel(props);
  const { id, labels, layers, tiers } = model;
  const level = props.headingLevel ?? 3;
  const plain = level === "none" || level === false;
  const Title = plain ? "p" : `h${level}`;
  const GroupHead = plain ? "p" : `h${props.title ? Math.min(level + 1, 6) : level}`;
  const zoneStarts = new Set(model.zones.slice(1).map((z) => z.start));
  const toggle = (where) => model.hasToggle ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { htmlFor: inputId.expand(id), className: `uipack-span__toggle uipack-span__toggle--${where}`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__more", children: withCount(labels.showAll, model.total) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__less", children: withCount(labels.showFeatured, model.featured) })
  ] }) : null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "section",
    {
      className: "uipack-span",
      id,
      "aria-labelledby": props.title ? `${id}-title` : void 0,
      "data-group-by": props.groupBy === "none" ? "none" : "primary",
      "data-lean": !tiers.length && !model.deals ? "" : void 0,
      style: vars({ "--sp-cols": layers.length }),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("style", { dangerouslySetInnerHTML: { __html: spanChartCss(model) } }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("form", { className: "uipack-span__form", method: "dialog", id: `${id}-form`, "data-shown": labels.shown, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-span__head", children: [
            props.title ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Title, { className: "uipack-span__title", id: `${id}-title`, children: props.title }) : null,
            props.caption ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "uipack-span__caption", children: props.caption }) : null,
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "uipack-span__panel", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Key, { model }) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: "uipack-span__drawer", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("summary", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__drawer-title", children: labels.filtersAndKey }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__now-text", "data-l": "*", children: labels.allLayers }),
                layers.map((layer) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__now-text", "data-l": layer.id, children: layer.short ?? layer.label }, layer.id)),
                tiers.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__now-text", "data-t": "*", children: labels.allSizes }) : null,
                tiers.map((tier) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__now-text", "data-t": tier.id, children: tier.label }, tier.id)),
                model.deals ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__now-text", "data-d": "", children: labels.deals }) : null
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Key, { model }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-span__filters", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(LayerChips, { model }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-span__wrap", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SizeControl, { model }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DealsToggle, { model })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "uipack-span__keyline", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__swatch uipack-span__swatch--main", "aria-hidden": "true" }),
                labels.keyMain
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__swatch uipack-span__swatch--also", "aria-hidden": "true" }),
                labels.keyAlso
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DealsToggle, { model })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-span__toolbar", children: [
              tiers.length || model.deals ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-span__inputs", children: [
                tiers.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { role: "radiogroup", "aria-label": labels.size, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "radio", className: "uipack-span__tier-all", name: `${id}-tier`, id: inputId.tierAll(id), value: "*", defaultChecked: true, "aria-label": labels.allSizes }),
                  tiers.map((tier) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "input",
                    {
                      type: "radio",
                      className: "uipack-span__tier-input",
                      name: `${id}-tier`,
                      id: inputId.tier(id, tier.id),
                      value: tier.id,
                      "aria-label": tier.range ? `${tier.label}, ${tier.range}` : tier.label
                    },
                    tier.id
                  ))
                ] }) : null,
                model.deals ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "checkbox", className: "uipack-span__deals-input", id: inputId.deals(id), "aria-label": `${labels.deals}, ${model.deals}` }) : null
              ] }) : null,
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SizeControl, { model }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DealsToggle, { model }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "uipack-span__hint uipack-span__hint--toolbar", "aria-hidden": "true", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: labels.layerHint }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: labels.layerHintTouch })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "uipack-span__find", hidden: true, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__sr", children: labels.find }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "search", placeholder: labels.find, autoComplete: "off", spellCheck: false, "data-span-search": "" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-span__chart", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-span__header", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-span__now-row", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__now-label", children: labels.showing }),
                layers.map((layer) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { htmlFor: inputId.layerAll(id), className: "uipack-span__now", "data-l": layer.id, children: [
                  layer.short ?? layer.label,
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: "\xD7" })
                ] }, layer.id)),
                tiers.map((tier) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { htmlFor: inputId.tierAll(id), className: "uipack-span__now", "data-t": tier.id, children: [
                  tier.label,
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: "\xD7" })
                ] }, tier.id)),
                model.deals ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { htmlFor: inputId.deals(id), className: "uipack-span__now", "data-d": "", children: [
                  labels.deals,
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: "\xD7" })
                ] }) : null,
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "reset", className: "uipack-span__clear", "aria-label": labels.clearFilters, children: labels.clear })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-span__inputs", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { role: "radiogroup", "aria-label": labels.layer, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "radio", className: "uipack-span__all-input", name: `${id}-layer`, id: inputId.layerAll(id), value: "*", defaultChecked: true, "aria-label": labels.allLayers }),
                  layers.map((layer) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "radio", className: "uipack-span__layer-input", name: `${id}-layer`, id: inputId.layer(id, layer.id), value: layer.id, "aria-label": layer.label }, layer.id))
                ] }),
                model.hasToggle ? (
                  // Outside the form, so "Clear filters" does not collapse the list.
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    "input",
                    {
                      type: "checkbox",
                      className: "uipack-span__expand",
                      id: inputId.expand(id),
                      form: `${id}-keep`,
                      defaultChecked: model.initialAll,
                      "aria-label": fill(labels.showAll, { n: model.total })
                    }
                  )
                ) : null
              ] }),
              model.zones.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "uipack-span__zones", "aria-hidden": "true", children: model.zones.map(({ zone, start, end }) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "data-zone-start": zoneStarts.has(start) ? "" : void 0, style: { gridColumn: `${start + 2} / ${end + 3}` }, title: zone.label, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CaseSafe, { text: zone.label, keep: "uipack-span__keep" }) }) }, zone.id)) }) : null,
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-span__cols", "aria-hidden": "true", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-span__corner", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-span__hint", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: labels.layerHint }),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: labels.layerHintTouch })
                  ] }),
                  labels.company
                ] }),
                layers.map((layer, k) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                  "label",
                  {
                    htmlFor: inputId.layer(id, layer.id),
                    className: "uipack-span__col",
                    "data-l": layer.id,
                    "data-zone-start": zoneStarts.has(k) ? "" : void 0,
                    style: { gridColumn: String(k + 2) },
                    title: layer.label,
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__abbr", children: layer.abbr }),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__short", children: breakable(layer.short ?? layer.abbr) }),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__full", children: layer.label }),
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__ccount", children: model.layerCounts[k] })
                    ]
                  },
                  layer.id
                ))
              ] })
            ] }),
            model.hasToggle ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "uipack-span__top", children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__more", children: fill(labels.shown, { n: model.featured, total: model.total }) }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__less", children: fill(labels.shown, { n: model.total, total: model.total }) }),
              toggle("top")
            ] }) : null,
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-span__body", children: [
              model.zones.slice(1).map(({ zone, start }) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__rule", "aria-hidden": "true", style: vars({ "--k": start }) }, zone.id)),
              model.groups.map((group) => {
                const headId = `${id}-g-${group.layer?.id ?? "all"}`;
                return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                  "div",
                  {
                    className: "uipack-span__group",
                    "data-layers": group.layerIds.join(" "),
                    "data-tiers": group.tierIds.length ? group.tierIds.join(" ") : void 0,
                    "data-deals": group.hasDeal ? "" : void 0,
                    "data-k": group.keys.length ? group.keys.join(" ") : void 0,
                    "data-featured": group.featured ? "" : void 0,
                    role: plain && group.layer ? "group" : void 0,
                    "aria-labelledby": plain && group.layer ? headId : void 0,
                    children: [
                      group.layer ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(GroupHead, { className: "uipack-span__group-head", id: headId, children: [
                        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CaseSafe, { text: group.layer.label, keep: "uipack-span__keep" }) }),
                        model.hasToggle ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "uipack-span__count uipack-span__count--featured", children: [
                          group.featured,
                          " of ",
                          group.rows.length
                        ] }) : null,
                        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__count uipack-span__count--total", children: group.rows.length }),
                        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__count uipack-span__count--live", "data-span-count": "" }),
                        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__mark", "aria-hidden": "true", style: vars({ "--k": group.index }) })
                      ] }) : null,
                      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: "uipack-span__rows", role: "list", children: group.rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { row, labels }, row.item.id)) })
                    ]
                  },
                  group.layer?.id ?? "all"
                );
              }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-span__empty", children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: labels.empty }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "reset", className: "uipack-span__clear", children: labels.clearFilters })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-span__nomatch", hidden: true, "data-span-nomatch": labels.noMatch, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", {}),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "uipack-span__clear", "data-span-clear-search": "", children: labels.clearSearch })
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "uipack-span__foot", children: [
              toggle("foot"),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__status", "data-span-status": "" }),
              props.asOf ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "uipack-span__asof", children: fill(labels.asOf, { date: props.asOf }) }) : null
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "uipack-span__sr", "aria-live": "polite", "data-span-live": "" })
      ]
    }
  );
}

// src/charts/LayerStack.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var LAYER_STACK_LABELS = {
  layer: "Layer",
  layers: "layers",
  layerOne: "layer",
  check: "Check yourself",
  read: "Read the section",
  go: "Go to section",
  rails: "Across the stack"
};
var fail2 = (chart, message) => {
  throw new Error(`LayerStack "${chart}": ${message}`);
};
var pad = (n) => String(n).padStart(2, "0");
var sentences = (...parts) => parts.filter((p) => Boolean(p)).map((p) => p.trim().replace(/[.!?]$/, "")).join(". ");
function buildLayerStack(props) {
  const { id, layers, zones } = props;
  if (typeof id !== "string" || !/^\S+$/.test(id)) fail2(String(id), "`id` must be a non-empty string without spaces");
  if (!Array.isArray(layers) || !layers.length) fail2(id, "`layers` must list at least one layer");
  const labels = { ...LAYER_STACK_LABELS, ...props.labels };
  const zoneById = /* @__PURE__ */ new Map();
  for (const zone of zones ?? []) {
    if (!zone?.id) fail2(id, "every zone needs an `id`");
    if (zoneById.has(zone.id)) fail2(id, `zone id "${zone.id}" is used twice`);
    zoneById.set(zone.id, zone);
  }
  const index = /* @__PURE__ */ new Map();
  layers.forEach((layer, i) => {
    if (!layer?.id) fail2(id, `layer ${i} needs an \`id\``);
    if (index.has(layer.id)) fail2(id, `layer id "${layer.id}" is used twice`);
    if (!layer.label) fail2(id, `layer "${layer.id}" needs a \`label\``);
    if (!zoneById.has(layer.zone)) fail2(id, `layer "${layer.id}" names unknown zone "${layer.zone}"`);
    index.set(layer.id, i);
  });
  const runs = [];
  layers.forEach((layer, i) => {
    const last = runs[runs.length - 1];
    if (last?.zone.id === layer.zone) last.end = i;
    else if (runs.some((g) => g.zone.id === layer.zone)) fail2(id, `zone "${layer.zone}" must cover consecutive layers; "${layer.id}" is separated from the rest`);
    else runs.push({ zone: zoneById.get(layer.zone), start: i, end: i });
  });
  const range = (kind, name, from2, to) => {
    const a = index.get(from2);
    const b = index.get(to);
    if (a === void 0) fail2(id, `${kind} "${name}" starts at unknown layer "${from2}"`);
    if (b === void 0) fail2(id, `${kind} "${name}" ends at unknown layer "${to}"`);
    return [Math.min(a, b), Math.max(a, b)];
  };
  const railIds = /* @__PURE__ */ new Set();
  const rails = (props.rails ?? []).map((rail) => {
    if (!rail?.id) fail2(id, "every rail needs an `id`");
    if (railIds.has(rail.id)) fail2(id, `rail id "${rail.id}" is used twice`);
    railIds.add(rail.id);
    if (!rail.label) fail2(id, `rail "${rail.id}" needs a \`label\``);
    const [lo, hi] = range("rail", rail.id, rail.from, rail.to);
    const span2 = lo === hi ? `${labels.layerOne} ${lo + 1}` : `${labels.layers} ${lo + 1}\u2013${hi + 1}`;
    return { rail, lo, hi, span: span2 };
  });
  const brackets = (props.brackets ?? []).map((bracket) => {
    if (!bracket?.label) fail2(id, "every bracket needs a `label`");
    const [lo, hi] = range("bracket", bracket.label, bracket.from, bracket.to);
    return { bracket, lo, hi };
  });
  const rows = (compact2) => {
    const at = /* @__PURE__ */ new Map();
    let r = 1;
    for (const g of [...runs].reverse()) {
      if (compact2) brackets.forEach((b, k) => b.hi === g.end && at.set(`bracket:${k}`, r++));
      at.set(`zone:${g.zone.id}`, r++);
      for (let i = g.end; i >= g.start; i--) {
        if (compact2) brackets.forEach((b, k) => b.hi === i && i !== g.end && at.set(`bracket:${k}`, r++));
        at.set(`layer:${i}`, r++);
      }
      at.set(`end:${g.zone.id}`, r++);
    }
    return at;
  };
  const wide = rows(false);
  const compact = rows(true);
  const one = (key) => ({ wide: [wide.get(key) ?? 0, 1], compact: [compact.get(key), 1] });
  const span = (lo, hi, map) => {
    const top = map.get(`layer:${hi}`);
    return [top, map.get(`layer:${lo}`) - top + 1];
  };
  const box = (zone, map) => {
    const top = map.get(`zone:${zone}`);
    return [top, map.get(`end:${zone}`) - top + 1];
  };
  const zonesTopDown = [...runs].reverse().map((g) => {
    return {
      ...g,
      place: one(`zone:${g.zone.id}`),
      box: { wide: box(g.zone.id, wide), compact: box(g.zone.id, compact) },
      endRow: one(`end:${g.zone.id}`),
      layers: layers.map((layer, i) => ({ layer, i, number: pad(i + 1), place: one(`layer:${i}`) })).filter(({ i }) => i >= g.start && i <= g.end).reverse(),
      brackets: brackets.map((b, k2) => ({ ...b, place: { wide: span(b.lo, b.hi, wide), compact: [compact.get(`bracket:${k2}`), 1] } })).filter((b) => b.hi >= g.start && b.hi <= g.end)
    };
  });
  return {
    id,
    labels,
    zones: zonesTopDown,
    rails: rails.map((x) => ({ ...x, place: { wide: span(x.lo, x.hi, wide), compact: span(x.lo, x.hi, compact) } })),
    brackets: brackets.length
  };
}
var place = (p, extra = {}) => ({ "--rw": `${p.wide[0]} / span ${p.wide[1]}`, "--rc": `${p.compact[0]} / span ${p.compact[1]}`, ...extra });
function LayerStack(props) {
  const model = buildLayerStack(props);
  const { id, labels } = model;
  const level = props.headingLevel ?? 3;
  const plain = level === "none" || level === false;
  const Title = plain ? "p" : `h${level}`;
  const Sub = plain ? "p" : `h${props.title ? Math.min(level + 1, 6) : level}`;
  const go = /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "uipack-stack__go-text", "aria-hidden": "true", children: labels.go }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "uipack-stack__go", "aria-hidden": "true", children: "\u2193" })
  ] });
  const arrow = /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "uipack-stack__arrow", "aria-hidden": "true", children: "\u2193" });
  const keep = (text) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CaseSafe, { text, keep: "uipack-stack__keep" });
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "section",
    {
      className: "uipack-stack",
      id,
      "aria-labelledby": props.title ? `${id}-title` : void 0,
      "data-rails": model.rails.length,
      "data-brackets": model.brackets ? "" : void 0,
      style: { "--ls-rails": model.rails.length },
      children: [
        props.title || props.caption ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "uipack-stack__head", children: [
          props.title ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Title, { className: "uipack-stack__title", id: `${id}-title`, children: props.title }) : null,
          props.caption ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "uipack-stack__caption", children: props.caption }) : null
        ] }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "uipack-stack__grid", children: [
          model.zones.map((g) => {
            const headId = `${id}-z-${g.zone.id}`;
            return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "uipack-stack__zone", role: plain ? "group" : void 0, "aria-labelledby": plain ? headId : void 0, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "uipack-stack__box", "aria-hidden": "true", style: place(g.box) }),
              g.brackets.map(({ bracket, lo, hi, place: p }) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "uipack-stack__bracket", "data-inside": hi !== g.end ? "" : void 0, style: place(p), children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: bracket.label }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "uipack-stack__sr", children: [
                  ", ",
                  labels.layers,
                  " ",
                  lo + 1,
                  "\u2013",
                  hi + 1
                ] })
              ] }, `${bracket.label}-${lo}`)),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Sub, { className: "uipack-stack__zone-head", id: headId, style: place(g.place), children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: keep(g.zone.label) }),
                g.zone.note ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "uipack-stack__note", children: keep(g.zone.note) }) : null
              ] }),
              g.layers.map(({ layer, number, place: p }) => {
                const face = /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "uipack-stack__index", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "uipack-stack__sr", children: [
                      labels.layer,
                      " "
                    ] }),
                    number
                  ] }),
                  " ",
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "uipack-stack__text", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("b", { children: [
                      layer.label,
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "uipack-stack__sr", children: ". " })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "uipack-stack__summary", children: layer.summary })
                  ] }),
                  layer.metric ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "uipack-stack__metric", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "uipack-stack__sr", children: ". " }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: layer.metric.value }),
                    " ",
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: layer.metric.label })
                  ] }) : null
                ] });
                const common = { id: `${id}-${layer.id}`, style: place(p) };
                const said = sentences(`${labels.layer} ${number} ${layer.label}`, layer.summary, layer.metric && `${layer.metric.value} ${layer.metric.label}`);
                if (layer.detail) {
                  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { className: "uipack-stack__band", ...common, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("summary", { className: "uipack-stack__face", "aria-label": said, children: [
                      face,
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("i", { "aria-hidden": "true" })
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "uipack-stack__detail", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { children: [
                        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "uipack-stack__check", children: labels.check }),
                        " ",
                        layer.detail
                      ] }),
                      layer.href ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("a", { className: "uipack-stack__read", href: layer.href, children: [
                        labels.read,
                        " ",
                        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { "aria-hidden": "true", children: "\u2193" })
                      ] }) : null
                    ] })
                  ] }, layer.id);
                }
                return layer.href ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("a", { className: "uipack-stack__band uipack-stack__face", href: layer.href, "aria-label": sentences(said, labels.go), ...common, children: [
                  face,
                  go
                ] }, layer.id) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "uipack-stack__band uipack-stack__face", ...common, children: face }, layer.id);
              }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "uipack-stack__end", "aria-hidden": "true", style: place(g.endRow) })
            ] }, g.zone.id);
          }),
          model.rails.map(({ rail, span, place: p }, k) => {
            const style = place(p, { "--cn": k + 2, "--cw": k + 3 });
            const name = `${rail.label}, ${span}`;
            const label = /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "uipack-stack__rail-label", children: [
              keep(rail.short ?? rail.label),
              rail.href ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
                " ",
                arrow
              ] }) : null
            ] });
            return rail.href ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("a", { className: "uipack-stack__rail", href: rail.href, style, "aria-label": name, title: rail.summary, children: label }, rail.id) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "uipack-stack__rail", style, role: "note", "aria-label": name, title: rail.summary, children: label }, rail.id);
          })
        ] }),
        model.rails.length ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "uipack-stack__across", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Sub, { className: "uipack-stack__across-head", id: `${id}-across`, children: labels.rails }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ul", { role: "list", "aria-labelledby": `${id}-across`, children: model.rails.map(({ rail, span }) => {
            const body = /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("b", { children: rail.label }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "uipack-stack__span", children: span }),
              rail.summary ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "uipack-stack__across-summary", children: rail.summary }) : null,
              rail.href ? arrow : null
            ] });
            return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("li", { children: rail.href ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("a", { className: "uipack-stack__node", href: rail.href, children: body }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "uipack-stack__node", children: body }) }, rail.id);
          }) })
        ] }) : null
      ]
    }
  );
}

// src/charts/enhance.ts
function enhanceSpanChart(root) {
  const form = root.querySelector("form.uipack-span__form");
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const find = (sel) => root.querySelector(sel);
  const all = (sel) => [...root.querySelectorAll(sel)];
  const groups = [
    { all: find(".uipack-span__all-input"), cls: "uipack-span__layer-input" },
    { all: find(".uipack-span__tier-all"), cls: "uipack-span__tier-input" }
  ].flatMap(({ all: allInput, cls }) => allInput ? [{ all: allInput, cls, current: null }] : []);
  if (!form || !groups.length) return () => {
  };
  const deals = find(".uipack-span__deals-input");
  const expand = find(".uipack-span__expand");
  const live = find("[data-span-live]");
  const status = find("[data-span-status]");
  const items = all(".uipack-span__item");
  const total = items.length;
  const findable = typeof root.onbeforematch !== "undefined";
  const search = find("[data-span-search]");
  const noMatch = find("[data-span-nomatch]");
  const fold = (text) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const haystacks = items.map(
    (el) => fold([el.querySelector(".uipack-span__nv > b"), ...el.querySelectorAll(".uipack-span__sub > *")].map((n) => n?.textContent ?? "").join(" "))
  );
  let query = "";
  const sync = () => {
    for (const g of groups) g.current = root.querySelector(`.${g.cls}:checked`)?.value ?? null;
  };
  const filtered = () => groups.some((g) => g.current !== null) || Boolean(deals?.checked) || query !== "";
  const visible = (el) => !el.hidden && el.getClientRects().length > 0;
  const markFindable = () => {
    if (!findable) return;
    const collapsed = Boolean(expand && !expand.checked) && !filtered();
    const mark = (el, hide) => {
      if (hide) {
        el.setAttribute("hidden", "until-found");
        el.setAttribute("aria-hidden", "true");
      } else {
        el.removeAttribute("hidden");
        el.removeAttribute("aria-hidden");
      }
    };
    for (const el of items) mark(el, collapsed && !el.hasAttribute("data-featured"));
    for (const el of all(".uipack-span__group")) mark(el, collapsed && !el.hasAttribute("data-featured"));
  };
  const shownText = (n) => (form.getAttribute("data-shown") ?? "{n} of {total} shown").replace("{n}", String(n)).replace("{total}", String(total));
  const applySearch = () => {
    query = search ? fold(search.value.trim()) : "";
    root.toggleAttribute("data-span-searching", query !== "");
    items.forEach((el, i) => el.toggleAttribute("data-span-miss", query !== "" && !haystacks[i].includes(query)));
    for (const g of all(".uipack-span__group")) {
      g.toggleAttribute("data-span-miss", query !== "" && !g.querySelector(".uipack-span__item:not([data-span-miss])"));
    }
  };
  const update = (announce) => {
    markFindable();
    if (noMatch) noMatch.hidden = true;
    if (!filtered()) {
      if (status) status.textContent = "";
      if (announce && live) live.textContent = groups.map((g) => g.all.getAttribute("aria-label") ?? "").join(", ");
      return;
    }
    for (const group of all(".uipack-span__group")) {
      const count = group.querySelector("[data-span-count]");
      if (count) count.textContent = String([...group.querySelectorAll(".uipack-span__item")].filter(visible).length);
    }
    const shown = items.filter(visible).length;
    const text = shownText(shown);
    if (status) status.textContent = text;
    if (announce && live) live.textContent = text;
    if (noMatch) {
      const emptyShown = Boolean(find(".uipack-span__empty")?.getClientRects().length);
      noMatch.hidden = !(query && shown === 0 && !emptyShown);
      const p = noMatch.querySelector("p");
      if (p && search) p.textContent = (noMatch.getAttribute("data-span-nomatch") ?? "").replace("{q}", search.value.trim());
    }
  };
  const restore = () => {
    if (!win) return;
    const top = root.getBoundingClientRect().top;
    const offset = parseFloat(win.getComputedStyle(root).getPropertyValue("--uipack-span-sticky-top")) || 0;
    if (top < offset) win.scrollBy(0, top - offset);
  };
  const select = (input, checked = true) => {
    input.checked = checked;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const owner = (el) => el instanceof HTMLInputElement ? groups.find((g) => el === g.all || el.classList.contains(g.cls)) : void 0;
  const onClick = (event) => {
    const g = owner(event.target);
    const input = event.target;
    if (g && input !== g.all && input.value === g.current) select(g.all);
  };
  const onChange = (event) => {
    const input = event.target;
    if (input === search) return;
    if (input === expand) {
      update(false);
      if (live) live.textContent = shownText(expand.checked ? total : items.filter((el) => el.hasAttribute("data-featured")).length);
      if (!expand.checked) restore();
      return;
    }
    const g = owner(input);
    if (g && !input.checked) return;
    if (!g && input !== deals) return;
    sync();
    update(true);
    restore();
  };
  const onReset = () => {
    win?.setTimeout(() => {
      sync();
      applySearch();
      update(true);
      restore();
      groups[0].all.focus({ preventScroll: true });
    }, 0);
  };
  const onKeyDown = (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const g = owner(input);
    if (event.key === " " && g && input !== g.all && input.value === g.current) {
      event.preventDefault();
      select(g.all);
      return;
    }
    if (event.key !== "Enter") return;
    if (g && input !== g.all) {
      event.preventDefault();
      select(input.value === g.current ? g.all : input);
    } else if (input === deals || input === expand) {
      event.preventDefault();
      select(input, !input.checked);
    }
  };
  let engaged = false;
  const onPointerDown = (event) => {
    engaged = root.contains(event.target);
  };
  const onDocKeyDown = (event) => {
    if (event.key === "Escape" && search && event.target === search && search.value) {
      event.preventDefault();
      clearSearch(false);
      return;
    }
    if (event.key !== "Escape" || !(engaged || root.contains(event.target)) || !filtered()) return;
    if (search?.value) clearSearch(false);
    for (const g of groups) if (g.current !== null) select(g.all);
    if (deals?.checked) select(deals, false);
  };
  const clearSearch = (focus) => {
    if (!search) return;
    search.value = "";
    applySearch();
    update(true);
    if (focus) search.focus({ preventScroll: true });
  };
  const onSearch = () => {
    applySearch();
    update(true);
  };
  const onSubmit = (event) => event.preventDefault();
  const onClearClick = (event) => {
    if (event.target.closest?.("[data-span-clear-search]")) clearSearch(true);
  };
  const onBeforeMatch = () => {
    if (expand && !expand.checked) select(expand);
  };
  const onHash = () => {
    const hash = win ? decodeURIComponent(win.location.hash.slice(1)) : "";
    const target = hash ? doc.getElementById(hash) : null;
    if (!(target instanceof HTMLInputElement) || !root.contains(target) || target === expand) return;
    if (target.type === "radio") select(target);
    else if (!target.checked) select(target);
    root.scrollIntoView({ block: "start" });
  };
  const cols = all(".uipack-span__col");
  const body = find(".uipack-span__body");
  const fine = win?.matchMedia?.("(hover: hover) and (pointer: fine)");
  let edges = [];
  let hovered = -1;
  const setHover = (k) => {
    if (k === hovered) return;
    cols[hovered]?.removeAttribute("data-span-hover");
    hovered = k;
    if (k < 0) {
      root.style.removeProperty("--sp-hover");
      root.style.removeProperty("--sp-hover-on");
      return;
    }
    cols[k].setAttribute("data-span-hover", "");
    root.style.setProperty("--sp-hover", String(k));
    root.style.setProperty("--sp-hover-on", "block");
  };
  const onBodyMove = (event) => {
    if (event.pointerType !== "mouse" || !fine?.matches) return;
    if (!edges.length) edges = cols.map((c) => c.getBoundingClientRect());
    setHover(edges.findIndex((r) => event.clientX >= r.left && event.clientX < r.right));
  };
  const onBodyLeave = () => {
    edges = [];
    setHover(-1);
  };
  const header = find(".uipack-span__header");
  const measure = () => header && root.style.setProperty("--sp-head-h", `${header.offsetHeight}px`);
  const Observer = win && win.ResizeObserver;
  const observer = Observer && header ? new Observer(measure) : null;
  observer?.observe(header);
  measure();
  root.addEventListener("click", onClick);
  root.addEventListener("click", onClearClick);
  body?.addEventListener("pointermove", onBodyMove);
  body?.addEventListener("pointerleave", onBodyLeave);
  search?.addEventListener("input", onSearch);
  form.addEventListener("submit", onSubmit);
  const searchLabel = search?.closest("label");
  if (searchLabel) searchLabel.hidden = false;
  root.addEventListener("change", onChange);
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("beforematch", onBeforeMatch);
  form.addEventListener("reset", onReset);
  doc.addEventListener("pointerdown", onPointerDown, true);
  doc.addEventListener("keydown", onDocKeyDown);
  win?.addEventListener("hashchange", onHash);
  root.setAttribute("data-span-enhanced", "");
  root.setAttribute("data-span-counting", "");
  if (findable) root.setAttribute("data-span-find", "");
  sync();
  update(false);
  onHash();
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("click", onClearClick);
    body?.removeEventListener("pointermove", onBodyMove);
    body?.removeEventListener("pointerleave", onBodyLeave);
    setHover(-1);
    search?.removeEventListener("input", onSearch);
    if (searchLabel) searchLabel.hidden = true;
    if (search) search.value = "";
    applySearch();
    if (noMatch) noMatch.hidden = true;
    form.removeEventListener("submit", onSubmit);
    root.removeEventListener("change", onChange);
    root.removeEventListener("keydown", onKeyDown);
    root.removeEventListener("beforematch", onBeforeMatch);
    form.removeEventListener("reset", onReset);
    doc.removeEventListener("pointerdown", onPointerDown, true);
    doc.removeEventListener("keydown", onDocKeyDown);
    win?.removeEventListener("hashchange", onHash);
    observer?.disconnect();
    root.style.removeProperty("--sp-head-h");
    for (const el of [...items, ...all(".uipack-span__group")]) {
      el.removeAttribute("hidden");
      el.removeAttribute("aria-hidden");
    }
    root.removeAttribute("data-span-enhanced");
    root.removeAttribute("data-span-counting");
    root.removeAttribute("data-span-find");
  };
}
function enhanceLayerStack(root) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const onClick = (event) => {
    if (!win || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href^="#"]');
    if (!link || !root.contains(link) || win.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const hash = link.getAttribute("href");
    const target = doc.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    win.history.pushState(null, "", hash);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!target.matches("a[href], button, input, select, textarea, summary, [tabindex]")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };
  root.addEventListener("click", onClick);
  root.setAttribute("data-stack-enhanced", "");
  return () => {
    root.removeEventListener("click", onClick);
    root.removeAttribute("data-stack-enhanced");
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LAYER_STACK_LABELS,
  LayerStack,
  SPAN_CHART_LABELS,
  SpanChart,
  buildLayerStack,
  buildSpanModel,
  enhanceLayerStack,
  enhanceSpanChart,
  spanChartCss,
  spanThresholds
});
//# sourceMappingURL=charts.cjs.map