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

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Badge: () => Badge,
  Chip: () => Chip,
  Connector: () => Connector,
  Defs: () => Defs,
  Figure: () => Figure,
  FigureMotionContext: () => FigureMotionContext,
  Group: () => Group,
  Label: () => Label,
  Lane: () => Lane,
  Legend: () => Legend,
  Node: () => Node,
  Packet: () => Packet,
  TOKEN_SHAPE: () => TOKEN_SHAPE,
  Token: () => Token,
  anchor: () => anchor,
  connectorStroke: () => connectorStroke,
  icons: () => icons,
  pathFromPoints: () => pathFromPoints,
  pointAlong: () => pointAlong,
  route: () => route,
  tokenColor: () => tokenColor,
  useFigureMotion: () => useFigureMotion,
  usePrefersReducedMotion: () => usePrefersReducedMotion
});
module.exports = __toCommonJS(index_exports);

// src/Figure.tsx
var import_react2 = require("react");

// src/context.tsx
var import_react = require("react");
var noop = () => {
};
var FigureMotionContext = (0, import_react.createContext)({
  playing: true,
  reduced: false,
  cycle: 0,
  toggle: noop,
  replay: noop
});
function useFigureMotion() {
  return (0, import_react.useContext)(FigureMotionContext);
}
var QUERY = "(prefers-reduced-motion: reduce)";
function usePrefersReducedMotion() {
  const [reduced, setReduced] = (0, import_react.useState)(
    () => typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(QUERY).matches : false
  );
  (0, import_react.useEffect)(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(QUERY);
    const onChange = (e) => setReduced(e.matches);
    setReduced(mq.matches);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);
  return reduced;
}

// src/tokens.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var TOKEN_SHAPE = {
  request: "square",
  response: "circle",
  change: "diamond",
  accent: "square",
  neutral: "circle"
};
function tokenColor(kind) {
  switch (kind) {
    case "request":
      return "var(--uipack-token-request)";
    case "response":
      return "var(--uipack-token-response)";
    case "change":
      return "var(--uipack-token-change)";
    case "accent":
      return "var(--uipack-accent)";
    default:
      return "currentColor";
  }
}
function Token({ shape, kind = "neutral", r = 5, cx = 0, cy = 0, style }) {
  const s = shape ?? TOKEN_SHAPE[kind];
  const fill = tokenColor(kind);
  const common = { fill, stroke: "var(--uipack-bg)", strokeWidth: 1.5, style };
  if (s === "circle") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx, cy, r, ...common });
  if (s === "diamond") {
    const d = r * 1.2;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: `M${cx},${cy - d} L${cx + d},${cy} L${cx},${cy + d} L${cx - d},${cy} Z`, ...common });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: cx - r, y: cy - r, width: r * 2, height: r * 2, rx: 1.5, ...common });
}

// src/Legend.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function Legend({ items }) {
  if (!items.length) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: "uipack__legend", "aria-label": "Legend", children: items.map((it) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { viewBox: "-8 -8 16 16", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Token, { kind: it.kind ?? "neutral", shape: it.shape, r: 5.5 }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: it.label })
  ] }, it.label)) });
}

// src/Figure.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var PauseGlyph = () => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { viewBox: "0 0 12 12", "aria-hidden": "true", children: [
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "2", y: "1.5", width: "3", height: "9", rx: "0.5" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "7", y: "1.5", width: "3", height: "9", rx: "0.5" })
] });
var PlayGlyph = () => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { viewBox: "0 0 12 12", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M3 1.5 L10.5 6 L3 10.5 Z" }) });
var ReplayGlyph = () => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { viewBox: "0 0 12 12", "aria-hidden": "true", children: [
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M6 1.5a4.5 4.5 0 1 1-4.2 2.9", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round" }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M1.5 1.5v3h3z" })
] });
function Figure({
  number,
  eyebrow,
  title,
  headingLevel = 3,
  caption,
  legend = [],
  controls = true,
  viewBox,
  children,
  narrow,
  narrowViewBox,
  alt,
  className,
  theme,
  id
}) {
  const auto = (0, import_react2.useId)();
  const figId = id ?? `uipack-${auto.replace(/:/g, "")}`;
  const reduced = usePrefersReducedMotion();
  const [playing, setPlaying] = (0, import_react2.useState)(true);
  const [cycle, setCycle] = (0, import_react2.useState)(0);
  const wideRef = (0, import_react2.useRef)(null);
  const narrowRef = (0, import_react2.useRef)(null);
  const svgs = () => [wideRef.current, narrowRef.current].filter(Boolean);
  (0, import_react2.useEffect)(() => {
    for (const s of svgs()) {
      if (typeof s.pauseAnimations !== "function") continue;
      if (playing) s.unpauseAnimations();
      else s.pauseAnimations();
    }
  }, [playing]);
  const toggle = (0, import_react2.useCallback)(() => setPlaying((p) => !p), []);
  const replay = (0, import_react2.useCallback)(() => {
    for (const s of svgs()) {
      if (typeof s.setCurrentTime === "function") s.setCurrentTime(0);
      if (typeof s.unpauseAnimations === "function") s.unpauseAnimations();
    }
    setPlaying(true);
    setCycle((c) => c + 1);
  }, []);
  const motion = (0, import_react2.useMemo)(
    () => ({ playing: playing && !reduced, reduced, cycle, toggle, replay }),
    [playing, reduced, cycle, toggle, replay]
  );
  const showControls = controls && !reduced;
  const hasHead = number || eyebrow || title || caption || legend.length || showControls;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FigureMotionContext.Provider, { value: motion, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "figure",
    {
      id: figId,
      className: ["uipack", narrow ? "uipack--has-narrow" : "", className ?? ""].join(" ").trim(),
      "data-theme": theme,
      style: { margin: 0 },
      children: [
        hasHead ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "uipack__head", children: [
          number || eyebrow ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { className: "uipack__eyebrow", children: [
            number,
            number && eyebrow ? " \xB7 " : "",
            eyebrow
          ] }) : null,
          title ? (0, import_react2.createElement)(`h${headingLevel}`, { className: "uipack__title" }, title) : null,
          caption ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "uipack__caption", children: caption }) : null,
          showControls ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "uipack__controls", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "uipack__ctl uipack__ctl--motion", onClick: replay, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(ReplayGlyph, {}),
              " Replay"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", className: "uipack__ctl uipack__ctl--motion", onClick: toggle, "aria-pressed": !playing, children: [
              playing ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PauseGlyph, {}) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PlayGlyph, {}),
              " ",
              playing ? "Pause" : "Play"
            ] })
          ] }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Legend, { items: legend })
        ] }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "uipack__canvas", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { ref: wideRef, className: "uipack--wide", viewBox, role: "img", "aria-label": alt, children }),
          narrow ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { ref: narrowRef, className: "uipack--narrow", viewBox: narrowViewBox ?? viewBox, role: "img", "aria-label": alt, children: narrow }) : null
        ] })
      ]
    }
  ) });
}

// src/Lane.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function Lane({ x, w, y, title, h, size = 11 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("g", { "data-uipack": "lane", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("text", { x: x + w / 2, y, textAnchor: "middle", fontSize: size, fontWeight: 700, fontFamily: "var(--uipack-mono)", letterSpacing: ".08em", fill: "currentColor", children: title.toUpperCase() }),
    h ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("line", { x1: x + w, y1: y + 12, x2: x + w, y2: y + h, stroke: "currentColor", strokeOpacity: 0.15, strokeDasharray: "2 6" }) : null
  ] });
}

// src/Group.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
function Group({ x, y, w, h, title, variant = "solid", accent, titleSize, children }) {
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  const dashed = variant === "dashed";
  const ts = titleSize ?? (dashed ? 11 : 14);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("g", { "data-uipack": "group", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "rect",
      {
        x,
        y,
        width: w,
        height: h,
        rx: dashed ? 10 : 6,
        fill: dashed ? "none" : "var(--uipack-surface)",
        fillOpacity: dashed ? void 0 : 0.6,
        stroke,
        strokeOpacity: accent ? 1 : dashed ? 0.4 : 0.8,
        strokeWidth: 1.25,
        strokeDasharray: dashed ? "4 4" : void 0
      }
    ),
    title ? dashed ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("text", { x: x + 16, y: y + 22, fontSize: ts, fontFamily: "var(--uipack-mono)", letterSpacing: ".08em", fill: stroke, fillOpacity: accent ? 1 : 0.75, children: title.toUpperCase() }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("text", { x: x + w / 2, y: y + 24, textAnchor: "middle", fontSize: ts, fontWeight: 600, fill: stroke, children: title }) : null,
    children
  ] });
}

// src/icons/index.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
var icons = {
  db: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("ellipse", { cx: "8", cy: "3.5", rx: "6", ry: "2.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M2 3.5v9c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-9" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M2 8c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" })
  ] }),
  cache: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_jsx_runtime6.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z" }) }),
  queue: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("rect", { x: "1.5", y: "4", width: "13", height: "8", rx: "1.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M5 4v8M9 4v8" })
  ] }),
  service: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("rect", { x: "2", y: "2", width: "12", height: "12", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M5 8h6M8 5v6" })
  ] }),
  client: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("rect", { x: "1.5", y: "3", width: "13", height: "8", rx: "1.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M5.5 14h5M8 11v3" })
  ] }),
  blob: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M8 1.5 14 5v6l-6 3.5L2 11V5z" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M8 8l6-3M8 8 2 5M8 8v6.5" })
  ] }),
  agent: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx: "8", cy: "5", r: "3" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M2.5 14.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M8 1v1" })
  ] }),
  doc: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M4 1.5h5.5L13 5v9.5H4z" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M9.5 1.5V5H13M6 8h4M6 11h4" })
  ] }),
  more: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx: "3", cy: "8", r: "1", fill: "currentColor" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx: "8", cy: "8", r: "1", fill: "currentColor" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx: "13", cy: "8", r: "1", fill: "currentColor" })
  ] })
};

// src/Node.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
function Node({
  x,
  y,
  w,
  h,
  label,
  sub,
  icon,
  align = icon ? "left" : "center",
  accent,
  dashed,
  size = 14,
  subSize = 11,
  id
}) {
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  const glyph = typeof icon === "string" ? icons[icon] : icon;
  const pad = 14;
  const tx = align === "center" ? x + w / 2 : x + pad + (glyph ? 26 : 0);
  const anchor2 = align === "center" ? "middle" : "start";
  const ty = sub ? y + h / 2 - 3 : y + h / 2 + size * 0.35;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("g", { id, "data-uipack": "node", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      "rect",
      {
        x,
        y,
        width: w,
        height: h,
        rx: 6,
        fill: "var(--uipack-surface)",
        stroke,
        strokeOpacity: accent ? 1 : 0.7,
        strokeWidth: 1.25,
        strokeDasharray: dashed ? "4 4" : void 0
      }
    ),
    glyph ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("g", { transform: `translate(${x + pad}, ${y + h / 2 - 8})`, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", children: glyph }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("text", { x: tx, y: ty, textAnchor: anchor2, fontSize: size, fontWeight: 600, fill: accent ? "var(--uipack-accent)" : "currentColor", children: label }),
    sub ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("text", { x: tx, y: y + h / 2 + subSize + 2, textAnchor: anchor2, fontSize: subSize, fontFamily: "var(--uipack-mono)", fill: "currentColor", fillOpacity: 0.75, children: sub }) : null
  ] });
}

// src/Chip.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
function Chip({ x, y, w, h = 24, label, dashed, kind, size = 10 }) {
  const fill = !kind ? "var(--uipack-surface)" : kind === "accent" ? "var(--uipack-accent)" : `var(--uipack-token-${kind})`;
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("g", { "data-uipack": "chip", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      "rect",
      {
        x,
        y,
        width: w,
        height: h,
        rx: h / 2,
        fill,
        fillOpacity: kind ? 0.55 : 1,
        stroke: "currentColor",
        strokeOpacity: dashed ? 0.5 : 0.8,
        strokeWidth: 1.25,
        strokeDasharray: dashed ? "3 3" : void 0
      }
    ),
    label ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("text", { x: x + w / 2, y: y + h / 2 + size * 0.36, textAnchor: "middle", fontSize: size, fontWeight: 700, fontFamily: "var(--uipack-mono)", fill: "currentColor", children: label.toUpperCase() }) : null
  ] });
}

// src/geometry.ts
function anchor(box, side, t = 0.5) {
  const { x, y, w, h } = box;
  switch (side) {
    case "top":
      return [x + w * t, y];
    case "bottom":
      return [x + w * t, y + h];
    case "left":
      return [x, y + h * t];
    case "right":
      return [x + w, y + h * t];
  }
}
function route(from, to, via = "h", axis = "h") {
  const [x1, y1] = from;
  const [x2, y2] = to;
  if (x1 === x2 || y1 === y2) return [from, to];
  if (typeof via === "number") {
    return axis === "h" ? [from, [via, y1], [via, y2], to] : [from, [x1, via], [x2, via], to];
  }
  if (via === "h") {
    const mx = (x1 + x2) / 2;
    return [from, [mx, y1], [mx, y2], to];
  }
  const my = (y1 + y2) / 2;
  return [from, [x1, my], [x2, my], to];
}
function pathFromPoints(points, radius = 6) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const inLen = Math.hypot(cx - px, cy - py);
    const outLen = Math.hypot(nx - cx, ny - cy);
    const r = Math.min(radius, inLen / 2, outLen / 2);
    if (r <= 0) {
      d += ` L${cx},${cy}`;
      continue;
    }
    const ax = cx - (cx - px) / inLen * r;
    const ay = cy - (cy - py) / inLen * r;
    const bx = cx + (nx - cx) / outLen * r;
    const by = cy + (ny - cy) / outLen * r;
    d += ` L${ax},${ay} Q${cx},${cy} ${bx},${by}`;
  }
  const [lx, ly] = points[points.length - 1];
  d += ` L${lx},${ly}`;
  return d;
}
function pointAlong(points, t) {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];
  const segs = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const l = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    segs.push(l);
    total += l;
  }
  let target = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i] || i === segs.length - 1) {
      const k = segs[i] === 0 ? 0 : target / segs[i];
      const [ax, ay] = points[i];
      const [bx, by] = points[i + 1];
      return [ax + (bx - ax) * k, ay + (by - ay) * k];
    }
    target -= segs[i];
  }
  return points[points.length - 1];
}

// src/Connector.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
function connectorStroke(kind) {
  if (!kind) return "currentColor";
  return kind === "accent" ? "var(--uipack-accent)" : `var(--uipack-token-${kind})`;
}
function Connector({ points, defs, arrow = true, dashed, kind, id, radius = 6, strokeWidth = 1.25 }) {
  const d = pathFromPoints(points, radius);
  const head = defs ? `url(#${defs}-head${kind ? `-${kind}` : ""})` : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
    "path",
    {
      id,
      "data-uipack": "connector",
      d,
      fill: "none",
      stroke: connectorStroke(kind),
      strokeOpacity: kind ? 1 : 0.6,
      strokeWidth,
      strokeDasharray: dashed ? "5 4" : void 0,
      markerEnd: arrow ? head : void 0,
      markerStart: arrow === "both" ? head : void 0
    }
  );
}

// src/Packet.tsx
var import_react3 = require("react");
var import_jsx_runtime10 = require("react/jsx-runtime");
function Packet({ points, kind = "request", shape, dur = 3, delay = 0, at = 0.5, r = 5, reverse, radius = 6, id }) {
  const { reduced } = useFigureMotion();
  const pts = reverse ? [...points].reverse() : points;
  const d = pathFromPoints(pts, radius);
  const [mounted, setMounted] = (0, import_react3.useState)(false);
  (0, import_react3.useEffect)(() => setMounted(true), []);
  if (reduced || !mounted) {
    const [cx, cy] = pointAlong(pts, at);
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("g", { id, "data-uipack": "packet", "data-static": "true", children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Token, { kind, shape, r, cx, cy }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("g", { id, "data-uipack": "packet", children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Token, { kind, shape, r }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("animateMotion", { dur: `${dur}s`, begin: `${delay}s`, repeatCount: "indefinite", path: d, calcMode: "linear" })
  ] });
}

// src/Badge.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");
function Badge({ cx, cy, text, accent, r = 9 }) {
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("g", { "data-uipack": "badge", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("circle", { cx, cy, r, fill: "var(--uipack-bg)", stroke, strokeOpacity: accent ? 1 : 0.6, strokeWidth: 1.25 }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("text", { x: cx, y: cy + 3.5, textAnchor: "middle", fontSize: 10, fontFamily: "var(--uipack-mono)", fontWeight: 700, fill: stroke, children: text })
  ] });
}

// src/Label.tsx
var import_jsx_runtime12 = require("react/jsx-runtime");
function Label({ x, y, text, anchor: anchor2 = "start", accent, size = 11, font = "mono" }) {
  const w = text.length * size * (font === "mono" ? 0.62 : 0.55) + 8;
  const rx = anchor2 === "middle" ? x - w / 2 : anchor2 === "end" ? x - w + 4 : x - 4;
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("g", { "data-uipack": "label", children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { x: rx, y: y - size + 1, width: w, height: size + 5, fill: "var(--uipack-bg)" }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
      "text",
      {
        x,
        y,
        textAnchor: anchor2,
        fontSize: size,
        fontFamily: font === "mono" ? "var(--uipack-mono)" : void 0,
        letterSpacing: font === "mono" ? ".06em" : void 0,
        fill: accent ? "var(--uipack-accent)" : "currentColor",
        fillOpacity: accent ? 1 : 0.8,
        children: font === "mono" ? text.toUpperCase() : text
      }
    )
  ] });
}

// src/Defs.tsx
var import_jsx_runtime13 = require("react/jsx-runtime");
function Defs({ id }) {
  const head = (suffix, fill) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
    "marker",
    {
      id: `${id}-head${suffix}`,
      markerWidth: "8",
      markerHeight: "8",
      refX: "7",
      refY: "4",
      orient: "auto-start-reverse",
      markerUnits: "userSpaceOnUse",
      children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("path", { d: "M0,0 L8,4 L0,8 z", fill })
    }
  );
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("defs", { children: [
    head("", "currentColor"),
    head("-accent", "var(--uipack-accent)"),
    head("-request", "var(--uipack-token-request)"),
    head("-response", "var(--uipack-token-response)"),
    head("-change", "var(--uipack-token-change)")
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Badge,
  Chip,
  Connector,
  Defs,
  Figure,
  FigureMotionContext,
  Group,
  Label,
  Lane,
  Legend,
  Node,
  Packet,
  TOKEN_SHAPE,
  Token,
  anchor,
  connectorStroke,
  icons,
  pathFromPoints,
  pointAlong,
  route,
  tokenColor,
  useFigureMotion,
  usePrefersReducedMotion
});
//# sourceMappingURL=index.cjs.map