"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }

var _chunkYMPVJRTJcjs = require('./chunk-YMPVJRTJ.cjs');

// src/browser/index.tsx
var _react = require('react');
var _jsxruntime = require('react/jsx-runtime');
var ALL = "All";
async function copy(text) {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e2) {
  }
  return false;
}
function categories(assets) {
  const seen = /* @__PURE__ */ new Map();
  for (const a of assets) seen.set(a.category, (_nullishCoalesce(seen.get(a.category), () => ( 0))) + 1);
  return [{ name: ALL, count: assets.length }, ...[...seen].map(([name, count]) => ({ name, count }))];
}
function filterAssets(assets, category, query) {
  const q = query.trim().toLowerCase();
  return assets.filter((a) => (category === ALL || a.category === category) && (!q || a.name.toLowerCase().includes(q) || a.id.includes(q) || (_nullishCoalesce(a.tags, () => ( []))).some((t) => t.includes(q))));
}
function Preview({ src, still, scheme }) {
  const img = /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "img", { src, alt: "", loading: "lazy", "data-scheme": scheme });
  if (!still) return img;
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "picture", { "data-scheme": scheme, children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "source", { media: "(prefers-reduced-motion: reduce)", srcSet: still }),
    img
  ] });
}
function AssetBrowser({ manifest, initialCategory = ALL, onAction, actionLabel = "Copy", base, className }) {
  const [category, setCategory] = _react.useState.call(void 0, initialCategory);
  const [query, setQuery] = _react.useState.call(void 0, "");
  const [flash, setFlash] = _react.useState.call(void 0, null);
  const timer = _react.useRef.call(void 0, void 0);
  const cats = _react.useMemo.call(void 0, () => categories(manifest.assets), [manifest.assets]);
  const shown = _react.useMemo.call(void 0, () => filterAssets(manifest.assets, category, query), [manifest.assets, category, query]);
  const prefix = _nullishCoalesce(_nullishCoalesce(base, () => ( manifest.base)), () => ( ""));
  _react.useEffect.call(void 0, () => () => window.clearTimeout(timer.current), []);
  const act = async (a) => {
    if (onAction) await onAction(a);
    else await copy(a.source);
    setFlash(a.id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFlash(null), 1400);
  };
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: ["uipack-browser", _nullishCoalesce(className, () => ( ""))].join(" ").trim(), "data-category": category, children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "nav", { className: "uipack-browser__side", "aria-label": "Asset categories", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "ul", { role: "list", onFocus: _chunkYMPVJRTJcjs.keepFocusedInView, children: cats.map((c) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "li", { children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "button", { type: "button", className: "uipack-browser__cat", "aria-pressed": category === c.name, onClick: () => setCategory(c.name), children: [
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { children: c.name }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-browser__count", "aria-label": `${c.count} assets`, children: c.count })
    ] }) }, c.name)) }) }),
    /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-browser__main", children: [
      /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-browser__bar", children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "label", { className: "uipack-browser__search", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-browser__sr", children: "Search assets" }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "input", { type: "search", placeholder: "Search", value: query, onChange: (e) => setQuery(e.target.value) })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "uipack-browser__status", role: "status", children: [
          shown.length,
          " ",
          shown.length === 1 ? "asset" : "assets",
          category !== ALL ? ` in ${category}` : ""
        ] })
      ] }),
      /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "ul", { className: "uipack-browser__grid", role: "list", children: shown.map((a) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "li", { className: "uipack-browser__card", "data-kind": a.kind, "data-id": a.id, children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-browser__tile", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Preview, { src: `${prefix}${a.preview}`, still: a.previewStatic && `${prefix}${a.previewStatic}`, scheme: "light" }),
          a.previewDark ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Preview, { src: `${prefix}${a.previewDark}`, still: a.previewStaticDark && `${prefix}${a.previewStaticDark}`, scheme: "dark" }) : null
        ] }),
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-browser__row", children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-browser__name", children: a.name }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "button", { type: "button", className: "uipack-browser__action", onClick: () => act(a), "aria-label": `${actionLabel} ${a.name}`, "data-flash": flash === a.id ? "true" : void 0, children: flash === a.id ? "Copied" : actionLabel })
        ] })
      ] }, a.id)) }),
      shown.length === 0 ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "uipack-browser__empty", children: "Nothing matches." }) : null
    ] })
  ] });
}





exports.ALL = ALL; exports.AssetBrowser = AssetBrowser; exports.categories = categories; exports.filterAssets = filterAssets;
