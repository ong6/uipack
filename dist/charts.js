// src/charts/model.ts
var DEFAULT_LABELS = {
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
  showingSize: "{n} of {total} \xB7 {size}",
  showingBoth: "{n} of {total} in {layer} \xB7 {size}",
  empty: "Nothing matches both filters.",
  asOf: "As of {date}",
  website: "Website",
  source: "Source",
  acquired: "Acquired by {label}",
  pending: "Sale agreed to {label}",
  licensed: "Technology licensed to {label}",
  shutdown: "Shut down",
  legendChange: "Acquired, being sold or licensed to",
  legendShutdown: "Shut down"
};
var fill = (template, values) => template.replace(/\{(\w+)\}/g, (match, key) => key in values ? String(values[key]) : match);
var filterKey = ([layer, tier]) => `${layer ?? "*"}|${tier ?? "*"}`;
var fail = (chart, message) => {
  throw new Error(`SpanChart "${chart}": ${message}`);
};
var NO_SPACE = /^\S+$/;
var STATUS_KINDS = ["acquired", "pending", "licensed", "shutdown"];
function monogram(name) {
  const words = name.replace(/([a-z])([A-Z])/g, "$1 $2").split(/[\s-]+/).map((w) => w.replace(/^[^\p{L}\p{N}]+/u, "")).filter(Boolean);
  const letters = words.map((w) => w[0]);
  return (letters.length >= 2 ? letters[0] + letters[1] : letters[0] ?? "?").toUpperCase();
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
  if (status.kind === "pending") return `\u2192 ${who} (pending)`;
  if (status.kind === "licensed") return `\u2192 ${who} (licensed)`;
  return `\u2192 ${who}`;
}
function statusSentence(status, labels) {
  if (status.kind === "shutdown") return status.label ? `${labels.shutdown}, ${status.label}` : labels.shutdown;
  return fill(labels[status.kind], { label: status.label ?? "" });
}
var EM = {};
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
  ["wW", 0.78]
])
  for (const ch of chars) EM[ch] = w;
function textWidth(text, px) {
  let w = 0;
  for (const ch of text) w += EM[ch] ?? 0.58;
  return w * px * 1.08;
}
function twoLineWidth(label, px = 12) {
  const words = label.split(/\s+/).filter(Boolean);
  let best = textWidth(label, px);
  for (let i = 1; i < words.length; i++) {
    const a = textWidth(words.slice(0, i).join(" "), px);
    const b = textWidth(words.slice(i).join(" "), px);
    best = Math.min(best, Math.max(a, b));
  }
  return Math.max(best, ...words.map((w) => textWidth(w, px)));
}
var NAME_WIDTH = 220;
var SIDE_PADDING = 24;
var NARROW_BELOW = 640;
var LABEL_GAP = 8;
function fullLabelColumn(labels, px = 12) {
  const w = labels.map((l) => twoLineWidth(l, px));
  return Math.max(...w.map((x, i) => Math.max(x + 2, i ? (x + w[i - 1]) / 2 + LABEL_GAP : 0)));
}
var matches = (row, [layer, tier]) => (layer === null || row.layerIds.includes(layer)) && (tier === null || row.tier?.id === tier);
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
      monogram: monogram(item.name),
      sentence,
      statusText,
      badge: item.status ? statusBadge(item.status) : null
    };
  });
  const byName = new Intl.Collator("en", { sensitivity: "base", numeric: true });
  const order = (a, b) => (b.item.value ?? -Infinity) - (a.item.value ?? -Infinity) || byName.compare(a.item.name, b.item.name);
  const states = [];
  for (const layer of [null, ...layers.map((l) => l.id)]) {
    for (const tier of [null, ...tiers.map((t) => t.id)]) if (layer !== null || tier !== null) states.push([layer, tier]);
  }
  const group = (layer, index, members) => {
    const counts = /* @__PURE__ */ new Map();
    for (const state of states) {
      const n = members.filter((r) => matches(r, state)).length;
      if (n) counts.set(filterKey(state), n);
    }
    const unique = (values) => [...new Set(values)];
    return {
      layer,
      index,
      rows: [...members].sort(order),
      featured: members.filter((r) => r.item.featured).length,
      layerIds: unique(members.flatMap((r) => r.layerIds)).sort((a, b) => layerIndex.get(a) - layerIndex.get(b)),
      tierIds: tiers.map((t) => t.id).filter((t) => members.some((r) => r.tier?.id === t)),
      pairs: unique(members.flatMap((r) => r.tier ? r.layerIds.map((l) => `${l}|${r.tier.id}`) : [])),
      counts
    };
  };
  const groups = input.groupBy === "none" ? rows.length ? [group(null, -1, rows)] : [] : layers.map((layer, i) => group(layer, i, rows.filter((r) => r.primaryIndex === i))).filter((g) => g.rows.length > 0);
  const featured = rows.filter((r) => r.item.featured).length;
  const hasToggle = featured > 0 && featured < rows.length;
  const at = (px) => Math.max(NARROW_BELOW, Math.ceil(SIDE_PADDING * 2 + NAME_WIDTH + fullLabelColumn(layers.map((l) => l.label), px) * layers.length));
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
    valueSample: rows.filter((r) => r.item.valueLabel && r.item.value !== void 0).sort((a, b) => b.item.value - a.item.value)[0]?.item.valueLabel ?? null
  };
}
function filterStatus(model, [layer, tier], count) {
  const values = {
    n: count,
    total: model.total,
    layer: model.layers.find((l) => l.id === layer)?.label ?? "",
    size: model.tiers.find((t) => t.id === tier)?.label ?? ""
  };
  const template = layer && tier ? model.labels.showingBoth : layer ? model.labels.showing : model.labels.showingSize;
  return fill(template, values);
}
var cssString = (value) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/</g, "\\3c ").replace(/\n/g, "\\a ")}"`;
function spanChartCss(model) {
  const root = `.uipack-span[id=${cssString(model.id)}]`;
  const layerOn = (l) => `:has(.uipack-span__layer-input[value=${cssString(l)}]:checked)`;
  const tierOn = (t) => `:has(.uipack-span__tier-input[value=${cssString(t)}]:checked)`;
  const state = ([l, t]) => `${root}${l === null ? ":has(.uipack-span__all-input:checked)" : layerOn(l)}${t === null ? model.tiers.length ? ":has(.uipack-span__tier-all:checked)" : "" : tierOn(t)}`;
  const rules = [];
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
  rules.push(
    `@container uipack-span (min-width: ${model.fullLabelsAt}px){${root} .uipack-span__full{display:block}${root} .uipack-span__abbr{display:none}${root} .uipack-span__key{display:none}}`,
    `@container uipack-span (min-width: ${model.largeLabelsAt}px){${root} .uipack-span__full{font-size:12px;line-height:15px}}`
  );
  return rules.join("\n");
}

// src/charts/SpanChart.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var vars = (values) => values;
function Row({ row, labels }) {
  const { item } = row;
  return /* @__PURE__ */ jsx(
    "li",
    {
      className: "uipack-span__item",
      "data-item": item.id,
      "data-layers": row.layerIds.join(" "),
      "data-tier": row.tier?.id,
      "data-featured": item.featured ? "" : void 0,
      children: /* @__PURE__ */ jsxs("details", { className: "uipack-span__row", children: [
        /* @__PURE__ */ jsxs("summary", { className: "uipack-span__summary", children: [
          /* @__PURE__ */ jsx("span", { className: "uipack-span__sr", children: row.sentence }),
          /* @__PURE__ */ jsxs("span", { className: "uipack-span__line", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxs("span", { className: "uipack-span__name", children: [
              /* @__PURE__ */ jsx("span", { className: "uipack-span__chevron" }),
              item.logo ? /* @__PURE__ */ jsx("span", { className: "uipack-span__logo", children: /* @__PURE__ */ jsx("img", { src: item.logo, alt: "", width: 20, height: 20, loading: "lazy", decoding: "async" }) }) : /* @__PURE__ */ jsx("span", { className: "uipack-span__logo uipack-span__logo--mono", children: row.monogram }),
              /* @__PURE__ */ jsx("span", { className: "uipack-span__label", title: item.name, children: item.name }),
              item.valueLabel ? /* @__PURE__ */ jsx("span", { className: "uipack-span__value", children: item.valueLabel }) : null,
              row.badge || item.tags?.length ? /* @__PURE__ */ jsxs("span", { className: "uipack-span__sub", children: [
                row.badge && item.status ? /* @__PURE__ */ jsx("span", { className: "uipack-span__badge", "data-kind": item.status.kind, title: row.statusText ?? void 0, children: row.badge }) : null,
                item.tags?.map((tag) => /* @__PURE__ */ jsx("span", { className: "uipack-span__tag", children: tag }, tag))
              ] }) : null
            ] }),
            /* @__PURE__ */ jsx("span", { className: "uipack-span__track", children: row.runs.map((run) => /* @__PURE__ */ jsx(
              "span",
              {
                className: "uipack-span__run",
                style: vars({ gridColumn: `${run.start + 1} / ${run.end + 2}`, "--len": run.end - run.start + 1 }),
                children: run.main !== null ? /* @__PURE__ */ jsx("span", { className: "uipack-span__main", style: vars({ "--at": run.main - run.start }) }) : null
              },
              run.start
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "uipack-span__detail", children: [
          /* @__PURE__ */ jsxs("p", { className: "uipack-span__note", children: [
            /* @__PURE__ */ jsx("strong", { children: item.name }),
            item.note ? /* @__PURE__ */ jsxs("span", { children: [
              " \u2014 ",
              item.note
            ] }) : null
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "uipack-span__meta", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              labels.main,
              ": ",
              row.layerLabels[0]
            ] }),
            row.layerLabels.length > 1 ? /* @__PURE__ */ jsxs("span", { children: [
              labels.also,
              ": ",
              row.layerLabels.slice(1).join(", ")
            ] }) : null,
            item.valueLabel || row.tier ? /* @__PURE__ */ jsxs("span", { children: [
              labels.size,
              ": ",
              [item.valueLabel, row.tier?.label].filter(Boolean).join(", ")
            ] }) : null,
            row.statusText ? /* @__PURE__ */ jsx("span", { children: row.statusText }) : null,
            item.href ? /* @__PURE__ */ jsx("a", { href: item.href, children: labels.website }) : null,
            item.source ? /* @__PURE__ */ jsx("a", { href: item.source, children: labels.source }) : null
          ] })
        ] })
      ] })
    }
  );
}
function SpanChart(props) {
  const model = buildSpanModel(props);
  const { id, labels, layers, tiers } = model;
  const level = props.headingLevel ?? 3;
  const Title = `h${level}`;
  const Group = `h${props.title ? Math.min(level + 1, 6) : level}`;
  const zoneStarts = new Set(model.zones.slice(1).map((z) => z.start));
  return /* @__PURE__ */ jsxs(
    "section",
    {
      className: "uipack-span",
      id,
      "aria-labelledby": props.title ? `${id}-title` : void 0,
      "data-group-by": props.groupBy === "none" ? "none" : "primary",
      style: vars({ "--sp-cols": layers.length }),
      children: [
        /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: spanChartCss(model) } }),
        /* @__PURE__ */ jsxs("div", { className: "uipack-span__head", children: [
          props.title ? /* @__PURE__ */ jsx(Title, { className: "uipack-span__title", id: `${id}-title`, children: props.title }) : null,
          props.caption ? /* @__PURE__ */ jsx("p", { className: "uipack-span__caption", children: props.caption }) : null,
          /* @__PURE__ */ jsxs("ul", { className: "uipack-span__legend", role: "list", children: [
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("span", { className: "uipack-span__swatch uipack-span__swatch--main", "aria-hidden": "true" }),
              labels.main
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("span", { className: "uipack-span__swatch uipack-span__swatch--also", "aria-hidden": "true" }),
              labels.also
            ] }),
            model.valueSample ? /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("span", { className: "uipack-span__value", "aria-hidden": "true", children: model.valueSample }),
              labels.valueLegend
            ] }) : null,
            model.hasChange ? /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("span", { className: "uipack-span__badge", "data-kind": "acquired", "aria-hidden": "true", children: "\u2192" }),
              labels.legendChange
            ] }) : null,
            model.hasShutdown ? /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("span", { className: "uipack-span__badge", "data-kind": "shutdown", "aria-hidden": "true", children: "shut" }),
              labels.legendShutdown
            ] }) : null
          ] }),
          tiers.length ? /* @__PURE__ */ jsxs("div", { className: "uipack-span__sizes", role: "radiogroup", "aria-label": labels.size, children: [
            /* @__PURE__ */ jsx("span", { className: "uipack-span__sizes-label", "aria-hidden": "true", children: labels.size }),
            /* @__PURE__ */ jsxs("label", { className: "uipack-span__chip", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "radio",
                  className: "uipack-span__input uipack-span__tier-all",
                  name: `${id}-tier`,
                  id: `${id}-tier-all`,
                  value: "*",
                  defaultChecked: true
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "uipack-span__chip-label", children: labels.allSizes })
            ] }),
            tiers.map((tier) => /* @__PURE__ */ jsxs("label", { className: "uipack-span__chip", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "radio",
                  className: "uipack-span__input uipack-span__tier-input",
                  name: `${id}-tier`,
                  id: `${id}-tier-${tier.id}`,
                  value: tier.id
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "uipack-span__chip-label", children: tier.label }),
              tier.range ? /* @__PURE__ */ jsx("span", { className: "uipack-span__chip-range", children: tier.range }) : null
            ] }, tier.id))
          ] }) : null,
          /* @__PURE__ */ jsx("dl", { className: "uipack-span__key", children: layers.map((layer) => /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("dt", { children: layer.abbr }),
            /* @__PURE__ */ jsx("dd", { children: layer.label })
          ] }, layer.id)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "uipack-span__chart", children: [
          /* @__PURE__ */ jsxs("div", { className: "uipack-span__header", children: [
            model.zones.length ? /* @__PURE__ */ jsx("div", { className: "uipack-span__zones", "aria-hidden": "true", children: model.zones.map(({ zone, start, end }) => /* @__PURE__ */ jsx(
              "span",
              {
                className: "uipack-span__zone",
                "data-zone-start": zoneStarts.has(start) ? "" : void 0,
                style: { gridColumn: `${start + 2} / ${end + 3}` },
                title: zone.label,
                children: /* @__PURE__ */ jsx("span", { children: zone.label })
              },
              zone.id
            )) }) : null,
            /* @__PURE__ */ jsxs("div", { className: "uipack-span__cols", role: "radiogroup", "aria-label": labels.filter, children: [
              /* @__PURE__ */ jsxs("label", { className: "uipack-span__corner", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "radio",
                    className: "uipack-span__input uipack-span__all-input",
                    name: `${id}-layer`,
                    id: `${id}-layer-all`,
                    value: "*",
                    defaultChecked: true,
                    "aria-label": labels.allLayers
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "uipack-span__corner-idle", children: labels.company }),
                /* @__PURE__ */ jsx("span", { className: "uipack-span__corner-reset", children: labels.allLayers })
              ] }),
              layers.map((layer, k) => /* @__PURE__ */ jsxs(
                "label",
                {
                  className: "uipack-span__col",
                  title: layer.label,
                  "data-zone-start": zoneStarts.has(k) ? "" : void 0,
                  style: { gridColumn: String(k + 2) },
                  children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "radio",
                        className: "uipack-span__input uipack-span__layer-input",
                        name: `${id}-layer`,
                        id: `${id}-layer-${layer.id}`,
                        value: layer.id,
                        "aria-label": layer.label
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "uipack-span__full", children: layer.label }),
                    /* @__PURE__ */ jsx("span", { className: "uipack-span__abbr", children: layer.abbr })
                  ]
                },
                layer.id
              ))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "uipack-span__body", children: [
            model.zones.slice(1).map(({ zone, start }) => /* @__PURE__ */ jsx("span", { className: "uipack-span__rule", "aria-hidden": "true", style: vars({ "--k": start }) }, zone.id)),
            model.groups.map((group) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: "uipack-span__group",
                "data-layers": group.layerIds.join(" "),
                "data-tiers": group.tierIds.length ? group.tierIds.join(" ") : void 0,
                "data-pairs": group.pairs.length ? group.pairs.join(" ") : void 0,
                "data-featured": group.featured ? "" : void 0,
                children: [
                  group.layer ? /* @__PURE__ */ jsxs(Group, { className: "uipack-span__group-head", children: [
                    /* @__PURE__ */ jsx("span", { className: "uipack-span__group-name", children: group.layer.label }),
                    /* @__PURE__ */ jsx("span", { className: "uipack-span__count", children: group.rows.length }),
                    [...group.counts.entries()].map(([key, count]) => /* @__PURE__ */ jsx("span", { className: "uipack-span__count", "data-span-key": key, children: count }, key))
                  ] }) : null,
                  /* @__PURE__ */ jsx("ul", { className: "uipack-span__rows", role: "list", children: group.rows.map((row) => /* @__PURE__ */ jsx(Row, { row, labels }, row.item.id)) })
                ]
              },
              group.layer?.id ?? "all"
            )),
            /* @__PURE__ */ jsx("p", { className: "uipack-span__empty", children: labels.empty })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "uipack-span__foot", children: [
            model.hasToggle ? /* @__PURE__ */ jsxs("label", { className: "uipack-span__toggle", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  className: "uipack-span__input uipack-span__expand",
                  id: `${id}-all`,
                  defaultChecked: model.initialAll
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "uipack-span__toggle-icon", "aria-hidden": "true" }),
              /* @__PURE__ */ jsx("span", { className: "uipack-span__more", children: fill(labels.showAll, { n: model.total }) }),
              /* @__PURE__ */ jsx("span", { className: "uipack-span__less", children: fill(labels.showFeatured, { n: model.featured }) })
            ] }) : null,
            /* @__PURE__ */ jsx("span", { className: "uipack-span__status", children: model.filters.map(({ filter, key, count }) => /* @__PURE__ */ jsx("span", { "data-span-key": key, children: filterStatus(model, filter, count) }, key)) }),
            props.asOf ? /* @__PURE__ */ jsx("span", { className: "uipack-span__asof", children: fill(labels.asOf, { date: props.asOf }) }) : null
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "uipack-span__sr", "aria-live": "polite", "data-span-live": "" })
      ]
    }
  );
}

// src/charts/LayerStack.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var LAYER_STACK_LABELS = {
  layer: "Layer",
  layers: "layers",
  layerOne: "layer",
  check: "Check yourself",
  read: "Read the section",
  rails: "Across layers"
};
var fail2 = (chart, message) => {
  throw new Error(`LayerStack "${chart}": ${message}`);
};
var pad = (n) => String(n).padStart(2, "0");
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
  const groups = [];
  layers.forEach((layer, i) => {
    const last = groups[groups.length - 1];
    if (last?.zone.id === layer.zone) last.end = i;
    else if (groups.some((g) => g.zone.id === layer.zone)) fail2(id, `zone "${layer.zone}" must cover consecutive layers; "${layer.id}" is separated from the rest`);
    else groups.push({ zone: zoneById.get(layer.zone), tone: groups.length % 4, start: i, end: i });
  });
  const zoneOf = (i) => groups.find((g) => i >= g.start && i <= g.end);
  const range = (kind, name, from, to) => {
    const a = index.get(from);
    const b = index.get(to);
    if (a === void 0) fail2(id, `${kind} "${name}" starts at unknown layer "${from}"`);
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
    const span = lo === hi ? `${labels.layerOne} ${lo + 1}` : `${labels.layers} ${lo + 1}\u2013${hi + 1}`;
    return { rail, lo, hi, span };
  });
  const brackets = (props.brackets ?? []).map((bracket) => {
    if (!bracket?.label) fail2(id, "every bracket needs a `label`");
    const [lo, hi] = range("bracket", bracket.label, bracket.from, bracket.to);
    return { bracket, lo, hi };
  });
  const wideRow = /* @__PURE__ */ new Map();
  let r = 1;
  for (const g of [...groups].reverse()) {
    wideRow.set(`zone:${g.zone.id}`, r++);
    for (let i = g.end; i >= g.start; i--) wideRow.set(`layer:${i}`, r++);
  }
  const wideSpan = (lo, hi) => {
    const top = wideRow.get(`layer:${hi}`);
    return [top, wideRow.get(`layer:${lo}`) - top + 1];
  };
  const narrowRow = /* @__PURE__ */ new Map();
  const bracketRows = new Array(brackets.length);
  r = 1;
  for (const g of [...groups].reverse()) {
    brackets.forEach((b, k) => {
      if (b.hi === g.end) bracketRows[k] = r++;
    });
    narrowRow.set(`zone:${g.zone.id}`, r++);
    for (let i = g.end; i >= g.start; i--) {
      brackets.forEach((b, k) => {
        if (b.hi === i && i !== g.end) bracketRows[k] = r++;
      });
      narrowRow.set(`layer:${i}`, r++);
    }
  }
  const railsRow = r + 1;
  return {
    id,
    labels,
    layers: layers.map((layer, i) => ({
      layer,
      number: pad(i + 1),
      tone: zoneOf(i).tone,
      place: { wide: [wideRow.get(`layer:${i}`), 1], narrow: narrowRow.get(`layer:${i}`) }
    })),
    zones: groups.map((g) => {
      const narrow = narrowRow.get(`zone:${g.zone.id}`);
      return {
        ...g,
        place: { wide: [wideRow.get(`zone:${g.zone.id}`), 1], narrow },
        /** A bracket label sits directly above this zone heading on narrow screens. */
        afterBracket: bracketRows.includes(narrow - 1)
      };
    }),
    rails: rails.map((x, k) => ({ ...x, place: { wide: wideSpan(x.lo, x.hi), narrow: railsRow + k } })),
    railsCaptionRow: railsRow - 1,
    brackets: brackets.map((x, k) => ({ ...x, place: { wide: wideSpan(x.lo, x.hi), narrow: bracketRows[k] } }))
  };
}
var place = (p, extra = {}) => ({ "--rw": `${p.wide[0]} / span ${p.wide[1]}`, "--rn": p.narrow, ...extra });
function LayerStack(props) {
  const model = buildLayerStack(props);
  const { id, labels } = model;
  const level = props.headingLevel ?? 3;
  const Title = `h${level}`;
  const Zone = `h${props.title ? Math.min(level + 1, 6) : level}`;
  return /* @__PURE__ */ jsxs2(
    "section",
    {
      className: "uipack-stack",
      id,
      "aria-labelledby": props.title ? `${id}-title` : void 0,
      "data-rails": model.rails.length,
      "data-brackets": model.brackets.length ? "" : void 0,
      style: { "--ls-rails": model.rails.length },
      children: [
        props.title || props.caption ? /* @__PURE__ */ jsxs2("div", { className: "uipack-stack__head", children: [
          props.title ? /* @__PURE__ */ jsx2(Title, { className: "uipack-stack__title", id: `${id}-title`, children: props.title }) : null,
          props.caption ? /* @__PURE__ */ jsx2("p", { className: "uipack-stack__caption", children: props.caption }) : null
        ] }) : null,
        /* @__PURE__ */ jsxs2("div", { className: "uipack-stack__grid", children: [
          model.zones.map((g) => /* @__PURE__ */ jsx2(
            Zone,
            {
              className: "uipack-stack__zone",
              "data-tone": g.tone,
              "data-top-wide": g.place.wide[0] === 1 ? "" : void 0,
              "data-top-narrow": g.place.narrow === 1 ? "" : void 0,
              "data-after-bracket": g.afterBracket ? "" : void 0,
              style: place(g.place),
              children: g.zone.label
            },
            g.zone.id
          )),
          model.layers.map(({ layer, number, tone, place: p }) => {
            const body = /* @__PURE__ */ jsxs2(Fragment, { children: [
              /* @__PURE__ */ jsxs2("span", { className: "uipack-stack__index", children: [
                /* @__PURE__ */ jsxs2("span", { className: "uipack-stack__sr", children: [
                  labels.layer,
                  " "
                ] }),
                number
              ] }),
              /* @__PURE__ */ jsx2("span", { className: "uipack-stack__name", children: layer.label }),
              /* @__PURE__ */ jsx2("span", { className: "uipack-stack__summary", children: layer.summary }),
              layer.metric ? /* @__PURE__ */ jsxs2("span", { className: "uipack-stack__metric", children: [
                /* @__PURE__ */ jsx2("span", { className: "uipack-stack__metric-value", children: layer.metric.value }),
                /* @__PURE__ */ jsx2("span", { className: "uipack-stack__metric-label", children: layer.metric.label })
              ] }) : null
            ] });
            const open = layer.detail || layer.href;
            return open ? /* @__PURE__ */ jsxs2("details", { className: "uipack-stack__band", id: `${id}-${layer.id}`, "data-tone": tone, style: place(p), children: [
              /* @__PURE__ */ jsxs2("summary", { className: "uipack-stack__face", children: [
                body,
                /* @__PURE__ */ jsx2("span", { className: "uipack-stack__chevron", "aria-hidden": "true" })
              ] }),
              /* @__PURE__ */ jsxs2("div", { className: "uipack-stack__detail", children: [
                layer.detail ? /* @__PURE__ */ jsxs2("p", { children: [
                  /* @__PURE__ */ jsx2("span", { className: "uipack-stack__check", children: labels.check }),
                  " ",
                  layer.detail
                ] }) : null,
                layer.href ? /* @__PURE__ */ jsxs2("a", { className: "uipack-stack__read", href: layer.href, children: [
                  labels.read,
                  " ",
                  /* @__PURE__ */ jsx2("span", { "aria-hidden": "true", children: "\u2192" })
                ] }) : null
              ] })
            ] }, layer.id) : /* @__PURE__ */ jsx2("div", { className: "uipack-stack__band", id: `${id}-${layer.id}`, "data-tone": tone, style: place(p), children: /* @__PURE__ */ jsx2("div", { className: "uipack-stack__face", children: body }) }, layer.id);
          }),
          model.brackets.map(({ bracket, lo, hi, place: p }) => /* @__PURE__ */ jsxs2(
            "p",
            {
              className: "uipack-stack__bracket",
              "data-top-narrow": p.narrow === 1 ? "" : void 0,
              style: place(p),
              children: [
                /* @__PURE__ */ jsx2("span", { className: "uipack-stack__bracket-label", children: bracket.label }),
                /* @__PURE__ */ jsxs2("span", { className: "uipack-stack__sr", children: [
                  ", ",
                  labels.layers,
                  " ",
                  lo + 1,
                  "\u2013",
                  hi + 1
                ] })
              ]
            },
            `${bracket.label}-${lo}`
          )),
          model.rails.length ? /* @__PURE__ */ jsx2("p", { className: "uipack-stack__rails-caption", "aria-hidden": "true", style: { "--rn": model.railsCaptionRow }, children: labels.rails }) : null,
          model.rails.map(({ rail, span, place: p }, k) => {
            const inner = /* @__PURE__ */ jsxs2(Fragment, { children: [
              /* @__PURE__ */ jsx2("span", { className: "uipack-stack__rail-label", children: rail.label }),
              /* @__PURE__ */ jsx2("span", { className: "uipack-stack__rail-span", children: span }),
              rail.summary ? /* @__PURE__ */ jsx2("span", { className: "uipack-stack__rail-tip", children: rail.summary }) : null
            ] });
            const style = place(p, { "--c": k + 3 });
            return rail.href ? /* @__PURE__ */ jsx2("a", { className: "uipack-stack__rail", href: rail.href, style, children: inner }, rail.id) : /* @__PURE__ */ jsx2("span", { className: "uipack-stack__rail", style, children: inner }, rail.id);
          })
        ] })
      ]
    }
  );
}

// src/charts/enhance.ts
function enhanceSpanChart(root) {
  const filters = [
    { all: root.querySelector(".uipack-span__all-input"), cls: "uipack-span__layer-input" },
    { all: root.querySelector(".uipack-span__tier-all"), cls: "uipack-span__tier-input" }
  ].flatMap(({ all, cls }) => {
    if (!all) return [];
    const checked = root.querySelector(`.${cls}:checked`);
    return [{ all, cls, current: checked ? checked.value : null }];
  });
  if (!filters.length) return () => {
  };
  const live = root.querySelector("[data-span-live]");
  const owner = (el) => el instanceof HTMLInputElement ? filters.find((f) => el === f.all || el.classList.contains(f.cls)) : void 0;
  const announce = () => {
    if (!live) return;
    const [layer, tier] = [filters.find((f) => f.cls.includes("layer")), filters.find((f) => f.cls.includes("tier"))];
    const key = `${layer?.current ?? "*"}|${tier?.current ?? "*"}`;
    if (key === "*|*") {
      live.textContent = filters.map((f) => f.all.getAttribute("aria-label") ?? f.all.closest("label")?.textContent ?? "").join(", ");
      return;
    }
    const status = [...root.querySelectorAll(".uipack-span__status [data-span-key]")].find(
      (el) => el.getAttribute("data-span-key") === key
    );
    live.textContent = status?.textContent ?? "";
  };
  const select = (input) => {
    input.checked = true;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const onClick = (event) => {
    const filter = owner(event.target);
    const input = event.target;
    if (filter && input !== filter.all && input.value === filter.current) select(filter.all);
  };
  const onChange = (event) => {
    const filter = owner(event.target);
    const input = event.target;
    if (!filter || !input.checked) return;
    filter.current = input === filter.all ? null : input.value;
    announce();
  };
  let engaged = false;
  const doc = root.ownerDocument;
  const onPointerDown = (event) => {
    engaged = root.contains(event.target);
  };
  const onDocKeyDown = (event) => {
    if (event.key !== "Escape" || !(engaged || root.contains(event.target))) return;
    for (const filter of filters) if (filter.current !== null) select(filter.all);
  };
  const onKeyDown = (event) => {
    const filter = owner(event.target);
    const input = event.target;
    if (event.key === "Enter" && filter && input !== filter.all) {
      event.preventDefault();
      select(input.value === filter.current ? filter.all : input);
    }
  };
  root.addEventListener("click", onClick);
  root.addEventListener("change", onChange);
  root.addEventListener("keydown", onKeyDown);
  doc.addEventListener("pointerdown", onPointerDown, true);
  doc.addEventListener("keydown", onDocKeyDown);
  root.setAttribute("data-span-enhanced", "");
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("change", onChange);
    root.removeEventListener("keydown", onKeyDown);
    doc.removeEventListener("pointerdown", onPointerDown, true);
    doc.removeEventListener("keydown", onDocKeyDown);
    root.removeAttribute("data-span-enhanced");
  };
}
export {
  LAYER_STACK_LABELS,
  LayerStack,
  DEFAULT_LABELS as SPAN_CHART_LABELS,
  SpanChart,
  buildLayerStack,
  buildSpanModel,
  enhanceSpanChart,
  spanChartCss
};
//# sourceMappingURL=charts.js.map