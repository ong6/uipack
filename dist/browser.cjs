"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/browser/index.tsx
var browser_exports = {};
__export(browser_exports, {
  ALL: () => ALL,
  AssetBrowser: () => AssetBrowser,
  categories: () => categories,
  filterAssets: () => filterAssets
});
module.exports = __toCommonJS(browser_exports);
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
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
function AssetBrowser({ manifest, initialCategory = ALL, onAction, actionLabel = "Copy", base, className }) {
  const [category, setCategory] = (0, import_react.useState)(initialCategory);
  const [query, setQuery] = (0, import_react.useState)("");
  const [flash, setFlash] = (0, import_react.useState)(null);
  const timer = (0, import_react.useRef)(void 0);
  const cats = (0, import_react.useMemo)(() => categories(manifest.assets), [manifest.assets]);
  const shown = (0, import_react.useMemo)(() => filterAssets(manifest.assets, category, query), [manifest.assets, category, query]);
  const prefix = base ?? manifest.base ?? "";
  (0, import_react.useEffect)(() => () => window.clearTimeout(timer.current), []);
  const act = async (a) => {
    if (onAction) await onAction(a);
    else await copy(a.source);
    setFlash(a.id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFlash(null), 1400);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: ["uipack-browser", className ?? ""].join(" ").trim(), "data-category": category, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", { className: "uipack-browser__side", "aria-label": "Asset categories", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { role: "list", children: cats.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "uipack-browser__cat", "aria-pressed": category === c.name, onClick: () => setCategory(c.name), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.name }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "uipack-browser__count", "aria-label": `${c.count} assets`, children: c.count })
    ] }) }, c.name)) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "uipack-browser__main", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "uipack-browser__bar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "uipack-browser__search", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "uipack-browser__sr", children: "Search assets" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "search", placeholder: "Search", value: query, onChange: (e) => setQuery(e.target.value) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "uipack-browser__status", role: "status", children: [
          shown.length,
          " ",
          shown.length === 1 ? "asset" : "assets",
          category !== ALL ? ` in ${category}` : ""
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "uipack-browser__grid", role: "list", children: shown.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { className: "uipack-browser__card", "data-kind": a.kind, "data-id": a.id, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "uipack-browser__tile", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", { src: `${prefix}${a.preview}`, alt: "", loading: "lazy" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "uipack-browser__row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "uipack-browser__name", children: a.name }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "uipack-browser__action", onClick: () => act(a), "aria-label": `${actionLabel} ${a.name}`, "data-flash": flash === a.id ? "true" : void 0, children: flash === a.id ? "Copied" : actionLabel })
        ] })
      ] }, a.id)) }),
      shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "uipack-browser__empty", children: "Nothing matches." }) : null
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ALL,
  AssetBrowser,
  categories,
  filterAssets
});
//# sourceMappingURL=browser.cjs.map