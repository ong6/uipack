'use strict';

var chunkYMPVJRTJ_cjs = require('./chunk-YMPVJRTJ.cjs');
var react = require('react');
var jsxRuntime = require('react/jsx-runtime');

var ALL = "All";
async function copy(text) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
  }
  return false;
}
function categories(assets) {
  const seen = /* @__PURE__ */ new Map();
  for (const a of assets) seen.set(a.category, (seen.get(a.category) ?? 0) + 1);
  return [{ name: ALL, count: assets.length }, ...[...seen].map(([name, count]) => ({ name, count }))];
}
function filterAssets(assets, category, query) {
  const q = query.trim().toLowerCase();
  return assets.filter((a) => (category === ALL || a.category === category) && (!q || a.name.toLowerCase().includes(q) || a.id.includes(q) || (a.tags ?? []).some((t) => t.includes(q))));
}
function Preview({ src, still, scheme }) {
  const img = /* @__PURE__ */ jsxRuntime.jsx("img", { src, alt: "", loading: "lazy", "data-scheme": scheme });
  if (!still) return img;
  return /* @__PURE__ */ jsxRuntime.jsxs("picture", { "data-scheme": scheme, children: [
    /* @__PURE__ */ jsxRuntime.jsx("source", { media: "(prefers-reduced-motion: reduce)", srcSet: still }),
    img
  ] });
}
function AssetBrowser({ manifest, initialCategory = ALL, onAction, actionLabel = "Copy", base, className }) {
  const [category, setCategory] = react.useState(initialCategory);
  const [query, setQuery] = react.useState("");
  const [flash, setFlash] = react.useState(null);
  const timer = react.useRef(void 0);
  const cats = react.useMemo(() => categories(manifest.assets), [manifest.assets]);
  const shown = react.useMemo(() => filterAssets(manifest.assets, category, query), [manifest.assets, category, query]);
  const prefix = base ?? manifest.base ?? "";
  react.useEffect(() => () => window.clearTimeout(timer.current), []);
  const act = async (a) => {
    if (onAction) await onAction(a);
    else await copy(a.source);
    setFlash(a.id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFlash(null), 1400);
  };
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: ["uipack-browser", className ?? ""].join(" ").trim(), "data-category": category, children: [
    /* @__PURE__ */ jsxRuntime.jsx("nav", { className: "uipack-browser__side", "aria-label": "Asset categories", children: /* @__PURE__ */ jsxRuntime.jsx("ul", { role: "list", onFocus: chunkYMPVJRTJ_cjs.keepFocusedInView, children: cats.map((c) => /* @__PURE__ */ jsxRuntime.jsx("li", { children: /* @__PURE__ */ jsxRuntime.jsxs("button", { type: "button", className: "uipack-browser__cat", "aria-pressed": category === c.name, onClick: () => setCategory(c.name), children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { children: c.name }),
      /* @__PURE__ */ jsxRuntime.jsx("span", { className: "uipack-browser__count", "aria-label": `${c.count} assets`, children: c.count })
    ] }) }, c.name)) }) }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "uipack-browser__main", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "uipack-browser__bar", children: [
        /* @__PURE__ */ jsxRuntime.jsxs("label", { className: "uipack-browser__search", children: [
          /* @__PURE__ */ jsxRuntime.jsx("span", { className: "uipack-browser__sr", children: "Search assets" }),
          /* @__PURE__ */ jsxRuntime.jsx("input", { type: "search", placeholder: "Search", value: query, onChange: (e) => setQuery(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("p", { className: "uipack-browser__status", role: "status", children: [
          shown.length,
          " ",
          shown.length === 1 ? "asset" : "assets",
          category !== ALL ? ` in ${category}` : ""
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("ul", { className: "uipack-browser__grid", role: "list", children: shown.map((a) => /* @__PURE__ */ jsxRuntime.jsxs("li", { className: "uipack-browser__card", "data-kind": a.kind, "data-id": a.id, children: [
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "uipack-browser__tile", children: [
          /* @__PURE__ */ jsxRuntime.jsx(Preview, { src: `${prefix}${a.preview}`, still: a.previewStatic && `${prefix}${a.previewStatic}`, scheme: "light" }),
          a.previewDark ? /* @__PURE__ */ jsxRuntime.jsx(Preview, { src: `${prefix}${a.previewDark}`, still: a.previewStaticDark && `${prefix}${a.previewStaticDark}`, scheme: "dark" }) : null
        ] }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "uipack-browser__row", children: [
          /* @__PURE__ */ jsxRuntime.jsx("span", { className: "uipack-browser__name", children: a.name }),
          /* @__PURE__ */ jsxRuntime.jsx("button", { type: "button", className: "uipack-browser__action", onClick: () => act(a), "aria-label": `${actionLabel} ${a.name}`, "data-flash": flash === a.id ? "true" : void 0, children: flash === a.id ? "Copied" : actionLabel })
        ] })
      ] }, a.id)) }),
      shown.length === 0 ? /* @__PURE__ */ jsxRuntime.jsx("p", { className: "uipack-browser__empty", children: "Nothing matches." }) : null
    ] })
  ] });
}

exports.ALL = ALL;
exports.AssetBrowser = AssetBrowser;
exports.categories = categories;
exports.filterAssets = filterAssets;
