import {
  Bus,
  Chip,
  Connector,
  Defs,
  Figure,
  FigureHoverContext,
  Group,
  Label,
  Lane,
  Legend,
  Node,
  Packet,
  anchor,
  busStub,
  busStubs,
  connectorStroke,
  flowList,
  grid,
  hoverAttrs,
  icons,
  pathFromPoints,
  pointAlong,
  polylineLength,
  route,
  trim,
  useFigureHover
} from "./chunk-RETWFFK4.js";
import {
  DEFAULT_RENDER_WIDTH,
  FigureScaleContext,
  FigureScaleProvider,
  TOKEN_SHAPE,
  Token,
  fontFloor,
  tokenColor,
  useFontFloor
} from "./chunk-2BHGP5ET.js";
import {
  FigureMotionContext,
  useFigureMotion,
  usePrefersReducedMotion
} from "./chunk-FENTOHP4.js";
import "./chunk-GP5TROIA.js";

// src/Badge.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function Badge({ cx, cy, text, accent, r = 9, size: size0 = 10 }) {
  const size = useFontFloor(size0);
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  return /* @__PURE__ */ jsxs("g", { "data-uipack": "badge", children: [
    /* @__PURE__ */ jsx("circle", { cx, cy, r, fill: "var(--uipack-bg)", stroke, strokeOpacity: accent ? 1 : 0.6, strokeWidth: 1.25 }),
    /* @__PURE__ */ jsx("text", { x: cx, y: cy + size * 0.35, textAnchor: "middle", fontSize: size, fontFamily: "var(--uipack-mono)", fontWeight: 700, fill: stroke, children: text })
  ] });
}

// src/marks/index.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var marks = {
  uipack: /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx2("rect", { x: "4", y: "4", width: "10", height: "10", rx: "2" }),
    /* @__PURE__ */ jsx2("rect", { x: "18", y: "4", width: "10", height: "10", rx: "2" }),
    /* @__PURE__ */ jsx2("rect", { x: "4", y: "18", width: "10", height: "10", rx: "2" }),
    /* @__PURE__ */ jsx2("rect", { x: "18", y: "18", width: "10", height: "10", rx: "5", fill: "currentColor" })
  ] }),
  groundplane: /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx2("path", { d: "M4 22h24" }),
    /* @__PURE__ */ jsx2("path", { d: "M8 22V10l8-4 8 4v12" }),
    /* @__PURE__ */ jsx2("path", { d: "M8 16h16", strokeDasharray: "2 2" })
  ] }),
  jobforge: /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx2("path", { d: "M6 24h20" }),
    /* @__PURE__ */ jsx2("path", { d: "M10 24V14h12v10" }),
    /* @__PURE__ */ jsx2("path", { d: "M13 14V9h6v5M16 4v5" })
  ] }),
  skillsmith: /* @__PURE__ */ jsx2(Fragment, { children: /* @__PURE__ */ jsx2("path", { d: "M16 4l3.5 7 7.5 1-5.5 5.3 1.3 7.7L16 21.4 9.2 25l1.3-7.7L5 12l7.5-1z" }) }),
  deckforge: /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx2("rect", { x: "4", y: "7", width: "24", height: "15", rx: "2" }),
    /* @__PURE__ */ jsx2("path", { d: "M12 26h8M16 22v4M9 13h8M9 17h5" })
  ] }),
  proofpack: /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx2("path", { d: "M8 4h11l5 5v19H8z" }),
    /* @__PURE__ */ jsx2("path", { d: "M19 4v5h5" }),
    /* @__PURE__ */ jsx2("path", { d: "M12 18l3 3 5-6" })
  ] }),
  fieldpack: /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx2("rect", { x: "5", y: "10", width: "22", height: "16", rx: "3" }),
    /* @__PURE__ */ jsx2("path", { d: "M11 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3M5 16h22" })
  ] }),
  skillpack: /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx2("rect", { x: "5", y: "6", width: "22", height: "20", rx: "3" }),
    /* @__PURE__ */ jsx2("path", { d: "M10 12h12M10 16h12M10 20h7" })
  ] })
};
function Wordmark({ size = 24 }) {
  return /* @__PURE__ */ jsxs2("svg", { viewBox: "0 0 140 32", width: size * 140 / 32, height: size, role: "img", "aria-label": "uipack", style: { display: "block" }, children: [
    /* @__PURE__ */ jsx2("g", { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: marks.uipack }),
    /* @__PURE__ */ jsx2("text", { x: "40", y: "22", fontSize: "18", fontWeight: 700, fontFamily: "var(--uipack-mono, ui-monospace, monospace)", letterSpacing: ".02em", fill: "currentColor", children: "uipack" })
  ] });
}
export {
  Badge,
  Bus,
  Chip,
  Connector,
  DEFAULT_RENDER_WIDTH,
  Defs,
  Figure,
  FigureHoverContext,
  FigureMotionContext,
  FigureScaleContext,
  FigureScaleProvider,
  Group,
  Label,
  Lane,
  Legend,
  Node,
  Packet,
  TOKEN_SHAPE,
  Token,
  Wordmark,
  anchor,
  busStub,
  busStubs,
  connectorStroke,
  flowList,
  fontFloor,
  grid,
  hoverAttrs,
  icons,
  marks,
  pathFromPoints,
  pointAlong,
  polylineLength,
  route,
  tokenColor,
  trim,
  useFigureHover,
  useFigureMotion,
  useFontFloor,
  usePrefersReducedMotion
};
//# sourceMappingURL=index.js.map