"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

var _chunkYEVVKV3Jcjs = require('./chunk-YEVVKV3J.cjs');






var _chunkVGPFDDCPcjs = require('./chunk-VGPFDDCP.cjs');

































var _chunkGKZXXH6Kcjs = require('./chunk-GKZXXH6K.cjs');











var _chunkAF2HLZ75cjs = require('./chunk-AF2HLZ75.cjs');


var _chunkA5PZXIEWcjs = require('./chunk-A5PZXIEW.cjs');



var _chunkXPCOQ7NOcjs = require('./chunk-XPCOQ7NO.cjs');

// src/Badge.tsx
var _jsxruntime = require('react/jsx-runtime');
function Badge({ cx, cy, text, accent, r = 9, size: size0 = 10 }) {
  const size = _chunkAF2HLZ75cjs.useFontFloor.call(void 0, size0);
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "g", { "data-uipack": "badge", children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "circle", { cx, cy, r, fill: "var(--uipack-bg)", stroke, strokeOpacity: accent ? 1 : 0.6, strokeWidth: 1.25 }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "text", { x: cx, y: cy + size * 0.35, textAnchor: "middle", fontSize: size, fontFamily: "var(--uipack-mono)", fontWeight: 700, fill: stroke, children: text })
  ] });
}

// src/Wall.tsx

function wallSegments(from, to, holes = [], gap = 9) {
  const segs = [];
  let s = from;
  for (const c of [...holes].sort((a, b) => a - b)) {
    if (c - gap > s) segs.push([s, c - gap]);
    s = Math.max(s, c + gap);
  }
  if (to > s) segs.push([s, to]);
  return segs;
}
function Wall({ at, from, to, holes = [], axis = "v", thickness: t = 16, gap = 9, flow }) {
  const hover = _chunkGKZXXH6Kcjs.useFigureHover.call(void 0, );
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "g", { "data-uipack": "wall", ..._chunkGKZXXH6Kcjs.hoverAttrs.call(void 0, flow, void 0, hover), children: wallSegments(from, to, holes, gap).map(([a, b]) => {
    const r = axis === "v" ? { x: at - t / 2, y: a, width: t, height: b - a } : { x: a, y: at - t / 2, width: b - a, height: t };
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "rect", { ...r, rx: 2, fill: "var(--uipack-surface-raised)", stroke: "currentColor", strokeOpacity: 0.55, strokeWidth: 1.25 }, a);
  }) });
}

// src/Cross.tsx

function Cross({ x, y, r = 5, kind }) {
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "g", { "data-uipack": "cross", stroke: _chunkGKZXXH6Kcjs.connectorStroke.call(void 0, kind), strokeOpacity: kind ? 1 : 0.8, strokeWidth: 1.75, strokeLinecap: "round", "aria-hidden": "true", children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "line", { x1: x - r, y1: y - r, x2: x + r, y2: y + r }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "line", { x1: x - r, y1: y + r, x2: x + r, y2: y - r })
  ] });
}

// src/marks/index.tsx

var marks = {
  uipack: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "rect", { x: "4", y: "4", width: "10", height: "10", rx: "2" }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "rect", { x: "18", y: "4", width: "10", height: "10", rx: "2" }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "rect", { x: "4", y: "18", width: "10", height: "10", rx: "2" }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "rect", { x: "18", y: "18", width: "10", height: "10", rx: "5", fill: "currentColor" })
  ] }),
  groundplane: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M4 22h24" }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M8 22V10l8-4 8 4v12" }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M8 16h16", strokeDasharray: "2 2" })
  ] }),
  jobforge: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M6 24h20" }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M10 24V14h12v10" }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M13 14V9h6v5M16 4v5" })
  ] }),
  skillsmith: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _jsxruntime.Fragment, { children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M16 4l3.5 7 7.5 1-5.5 5.3 1.3 7.7L16 21.4 9.2 25l1.3-7.7L5 12l7.5-1z" }) }),
  deckforge: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "rect", { x: "4", y: "7", width: "24", height: "15", rx: "2" }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M12 26h8M16 22v4M9 13h8M9 17h5" })
  ] }),
  proofpack: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M8 4h11l5 5v19H8z" }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M19 4v5h5" }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M12 18l3 3 5-6" })
  ] }),
  fieldpack: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "rect", { x: "5", y: "10", width: "22", height: "16", rx: "3" }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M11 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3M5 16h22" })
  ] }),
  skillpack: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "rect", { x: "5", y: "6", width: "22", height: "20", rx: "3" }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M10 12h12M10 16h12M10 20h7" })
  ] })
};
function Wordmark({ size = 24 }) {
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "svg", { viewBox: "0 0 140 32", width: size * 140 / 32, height: size, role: "img", "aria-label": "uipack", style: { display: "block" }, children: [
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "g", { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: marks.uipack }),
    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "text", { x: "40", y: "22", fontSize: "18", fontWeight: 700, fontFamily: "var(--uipack-mono, ui-monospace, monospace)", letterSpacing: ".02em", fill: "currentColor", children: "uipack" })
  ] });
}

// src/drill/DrillFigure.tsx









var _react = require('react');

// src/drill/animate.ts
var drillMotion = {
  zoom: 1e3,
  fade: 320,
  reduced: 160
};
function findDrillNode(layer, id) {
  const all = Array.from(layer.querySelectorAll(`[data-drill="${cssEscape(id)}"]`));
  return _nullishCoalesce(_nullishCoalesce(all.find((el) => el.getBoundingClientRect().width > 0), () => ( all[0])), () => ( null));
}
var cssEscape = (s) => typeof CSS !== "undefined" && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, "\\$&");
var boxOf = (node) => _nullishCoalesce(node.querySelector('[data-uipack="node"] > rect'), () => ( node));
var faceOf = (node) => Array.from(
  node.querySelectorAll(
    '[data-uipack="node"] > :not(rect):not(.uipack__touch-target), .uipack-drill-node__mark'
  )
);
function paintInner(inner, canvas) {
  if (!canvas) return;
  const cs = getComputedStyle(canvas);
  const c = canvas.getBoundingClientRect();
  const l = inner.getBoundingClientRect();
  inner.style.backgroundColor = cs.backgroundColor;
  inner.style.backgroundImage = cs.backgroundImage;
  inner.style.backgroundSize = cs.backgroundSize;
  inner.style.backgroundPosition = `${(c.left + canvas.clientLeft - l.left).toFixed(2)}px ${(c.top + canvas.clientTop - l.top).toFixed(2)}px`;
}
function clearLayer(el) {
  el.style.removeProperty("z-index");
  el.style.removeProperty("background-color");
  el.style.removeProperty("background-image");
  el.style.removeProperty("background-size");
  el.style.removeProperty("background-position");
  delete el.dataset.role;
}
function runDrill(opts) {
  const { from, to, stage, canvas, reduced } = opts;
  if (typeof from.animate !== "function") return [];
  const anims = [];
  const play = (el, keyframes, timing2) => {
    anims.push(el.animate(keyframes, { fill: "both", ...timing2 }));
  };
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  let kind = reduced ? "fade" : opts.kind;
  let samples = null;
  let local = null;
  let k = 1;
  if (kind !== "fade" && opts.target) {
    const s = stage.getBoundingClientRect();
    const boxEl = boxOf(opts.target);
    const r = boxEl.getBoundingClientRect();
    local = { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
    const userW = _optionalChain([boxEl, 'access', _ => _.width, 'optionalAccess', _2 => _2.baseVal, 'optionalAccess', _3 => _3.value]);
    if (userW) k = r.width / userW;
    samples = _chunkVGPFDDCPcjs.zoomSamples.call(void 0, local, kind === "in", W, H, { samples: 32, radius: 6 * k });
  }
  if (!samples || !local) kind = "fade";
  if (kind === "fade") {
    to.dataset.role = "inner";
    to.style.zIndex = "2";
    paintInner(to, canvas);
    const timing2 = { duration: reduced ? drillMotion.reduced : drillMotion.fade, easing: "ease" };
    play(to, [{ opacity: 0 }, { opacity: 1 }], timing2);
    play(from, [{ opacity: 1 }, { opacity: 0 }], timing2);
    return anims;
  }
  const forward = kind === "in";
  const outer = forward ? from : to;
  const inner = forward ? to : from;
  const frame = _chunkVGPFDDCPcjs.zoomFrame.call(void 0, local, W, H);
  const origin = `${frame.fx.toFixed(2)}px ${frame.fy.toFixed(2)}px`;
  inner.dataset.role = "inner";
  inner.style.zIndex = "2";
  paintInner(inner, canvas);
  const timing = { duration: _nullishCoalesce(opts.duration, () => ( drillMotion.zoom)), easing: "linear" };
  play(
    outer,
    samples.map((s) => ({ offset: s.offset, transform: s.outer, transformOrigin: origin, opacity: 1 - _chunkVGPFDDCPcjs.smoothstep.call(void 0, 0.88, 0.99, s.p) })),
    timing
  );
  play(
    inner,
    samples.map((s) => ({ offset: s.offset, transform: s.inner, transformOrigin: origin, clipPath: s.clip, opacity: s.innerOpacity })),
    timing
  );
  for (const part of faceOf(opts.target)) {
    play(part, samples.map((s) => ({ offset: s.offset, opacity: 1 - s.innerOpacity })), timing);
  }
  const halo = opts.target.querySelector(".uipack-drill-node__halo");
  if (halo) play(halo, samples.map((s) => ({ offset: s.offset, opacity: 1 - _chunkVGPFDDCPcjs.smoothstep.call(void 0, 0, 0.25, s.p) })), timing);
  return anims;
}

// src/drill/context.tsx

var DrillContext = _react.createContext.call(void 0, null);
var useDrill = () => _react.useContext.call(void 0, DrillContext);

// src/drill/model.ts
function normalizePath(path, ids, root) {
  const known = ids instanceof Set ? ids : new Set(ids);
  const out = [root];
  if (!_optionalChain([path, 'optionalAccess', _4 => _4.length])) return out;
  const rest = path[0] === root ? path.slice(1) : path;
  for (const id of rest) {
    if (!known.has(id) || out.includes(id)) break;
    out.push(id);
  }
  return out;
}
function drillReducer(path, action, ids, root = path[0]) {
  switch (action.type) {
    case "open": {
      const known = ids instanceof Set ? ids.has(action.id) : ids.includes(action.id);
      if (!known || path.includes(action.id)) return path;
      return [...path, action.id];
    }
    case "up":
      return path.length > 1 ? path.slice(0, -1) : path;
    case "to": {
      const depth = Math.max(0, Math.min(path.length - 1, Math.floor(action.depth)));
      return depth === path.length - 1 ? path : path.slice(0, depth + 1);
    }
    case "set": {
      const next = normalizePath(action.path, ids, root);
      return samePath(next, path) ? path : next;
    }
  }
}
var samePath = (a, b) => a.length === b.length && a.every((id, i) => id === b[i]);
function drillMove(from, to) {
  if (samePath(from, to)) return "none";
  if (to.length === from.length + 1 && samePath(from, to.slice(0, -1))) return "in";
  if (from.length === to.length + 1 && samePath(to, from.slice(0, -1))) return "out";
  return "jump";
}
function drillFocusTarget(from, to) {
  const upward = to.length < from.length && samePath(to, from.slice(0, to.length));
  return upward ? { kind: "node", drill: from[to.length] } : { kind: "heading" };
}
function drillAnnouncement(from, to, labelOf) {
  const trail = to.map(labelOf).join(" \u203A ");
  const here = labelOf(to[to.length - 1]);
  if (to.length > from.length) return `Opened ${here}. ${trail}`;
  if (to.length < from.length) return `Back to ${here}. ${trail}`;
  return `Showing ${here}. ${trail}`;
}
var cleanId = (s) => s.replace(/[^a-zA-Z0-9_-]/g, "");
var vbSize = (viewBox) => {
  const [, , w, h] = viewBox.split(/[\s,]+/).map(Number);
  return { w: w || 0, h: h || 0 };
};
function levelFloor(levelViewBox, frame, stageW, minFont) {
  const l = vbSize(levelViewBox);
  const f = vbSize(frame);
  if (!l.w || !l.h || !f.w || !stageW || !minFont) return 0;
  const stageH = stageW * f.h / f.w;
  const scale = Math.min(stageW / l.w, stageH / l.h);
  return minFont / scale;
}
function drillBox(box, grow = DRILL_GROW) {
  return { ...box, y: box.y - grow / 2, h: box.h + grow };
}
var DRILL_GROW = 8;

// src/drill/static.tsx

function drillStatic(props, path) {
  const levels = new Map(props.levels.map((l) => [l.id, l]));
  const root = _nullishCoalesce(_nullishCoalesce(props.root, () => ( _optionalChain([props, 'access', _5 => _5.levels, 'access', _6 => _6[0], 'optionalAccess', _7 => _7.id]))), () => ( ""));
  const p = normalizePath(_nullishCoalesce(_nullishCoalesce(path, () => ( props.path)), () => ( props.defaultPath)), new Set(levels.keys()), root);
  const level = levels.get(p[p.length - 1]);
  const trail = p.length > 1 ? p.map((id) => _nullishCoalesce(_optionalChain([levels, 'access', _8 => _8.get, 'call', _9 => _9(id), 'optionalAccess', _10 => _10.label]), () => ( id))).join(" \u203A ") : "";
  const lid = `static-${cleanId(level.id)}`;
  return {
    children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
      DrillContext.Provider,
      {
        value: { levels, frame: { wide: props.viewBox, narrow: props.narrowViewBox }, idPrefix: lid, variant: "wide", interactive: false, ghost: false },
        children: level.render({ id: lid, variant: "wide", ghost: false, level })
      }
    ),
    viewBox: _nullishCoalesce(level.viewBox, () => ( props.viewBox)),
    legend: level.legend,
    number: props.number,
    eyebrow: [props.eyebrow, trail].filter(Boolean).join(" \xB7 ") || void 0,
    title: _nullishCoalesce(level.title, () => ( level.label)),
    caption: level.caption,
    alt: level.alt,
    background: props.background
  };
}

// src/drill/DrillFigure.tsx

var last = (p) => p[p.length - 1];
var BackGlyph = () => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { viewBox: "0 0 12 12", "aria-hidden": "true", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M7.5 2.5 4 6l3.5 3.5", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }) });
var DrillLayer = _react.memo.call(void 0, function DrillLayer2({ level, figId, frame, floorWide, floorNarrow, levels, open, current }) {
  const lid = `${figId}-${cleanId(level.id)}`;
  const ctx = (variant) => ({
    levels,
    frame,
    idPrefix: `${lid}-${variant[0]}`,
    variant,
    interactive: true,
    ghost: false,
    open: (id) => open(level.id, id)
  });
  const draw = (variant, render, vb, floor) => /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    "svg",
    {
      className: `uipack-drill__${variant}`,
      viewBox: vb,
      preserveAspectRatio: "xMidYMid meet",
      role: "group",
      "aria-label": level.alt,
      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DrillContext.Provider, { value: ctx(variant), children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkAF2HLZ75cjs.FigureScaleContext.Provider, { value: { floor }, children: render({ id: variant === "wide" ? lid : `${lid}-n`, variant, ghost: false, level }) }) })
    }
  );
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack-drill__layer", "data-level": level.id, "data-current": current ? "true" : void 0, children: [
    draw("wide", level.render, _nullishCoalesce(level.viewBox, () => ( frame.wide)), floorWide),
    frame.narrow ? draw("narrow", _nullishCoalesce(level.narrow, () => ( level.render)), _nullishCoalesce(level.narrowViewBox, () => ( frame.narrow)), floorNarrow) : null
  ] });
});
function DrillFigure({
  levels,
  root,
  viewBox,
  narrowViewBox,
  path,
  defaultPath,
  onPathChange,
  number,
  eyebrow,
  headingLevel = 3,
  expandable = true,
  controls = true,
  theme,
  background = "dots",
  minFont = 11,
  duration,
  className,
  id
}) {
  const auto = _react.useId.call(void 0, );
  const figId = _nullishCoalesce(id, () => ( `uipack-drill-${cleanId(auto)}`));
  const levelMap = _react.useMemo.call(void 0, () => new Map(levels.map((l) => [l.id, l])), [levels]);
  const ids = _react.useMemo.call(void 0, () => new Set(levelMap.keys()), [levelMap]);
  const rootId = _nullishCoalesce(_nullishCoalesce(root, () => ( _optionalChain([levels, 'access', _11 => _11[0], 'optionalAccess', _12 => _12.id]))), () => ( ""));
  const labelOf = _react.useCallback.call(void 0, (lid) => _nullishCoalesce(_optionalChain([levelMap, 'access', _13 => _13.get, 'call', _14 => _14(lid), 'optionalAccess', _15 => _15.label]), () => ( lid)), [levelMap]);
  const [own, setOwn] = _react.useState.call(void 0, () => normalizePath(defaultPath, ids, rootId));
  const requestedRaw = normalizePath(_nullishCoalesce(path, () => ( own)), ids, rootId);
  const requestedKey = requestedRaw.join("\0");
  const requested = _react.useMemo.call(void 0, () => requestedRaw, [requestedKey]);
  const requestedRef = _react.useRef.call(void 0, requested);
  requestedRef.current = requested;
  const [view, setView] = _react.useState.call(void 0, () => ({ path: requested, flight: null }));
  const viewRef = _react.useRef.call(void 0, view);
  viewRef.current = view;
  const seq = _react.useRef.call(void 0, 0);
  const focusIntent = _react.useRef.call(void 0, false);
  const pendingFocus = _react.useRef.call(void 0, null);
  const [announcement, setAnnouncement] = _react.useState.call(void 0, "");
  const reduced = _chunkXPCOQ7NOcjs.usePrefersReducedMotion.call(void 0, );
  const [playing, setPlaying] = _react.useState.call(void 0, true);
  const [cycle, setCycle] = _react.useState.call(void 0, 0);
  const [expanded, setExpanded] = _react.useState.call(void 0, false);
  const [zoom, setZoom] = _react.useState.call(void 0, 1);
  const [selected, select] = _react.useState.call(void 0, null);
  const [hoverFlow, setHoverFlow] = _react.useState.call(void 0, null);
  const [hoverKind, setHoverKind] = _react.useState.call(void 0, null);
  const hover = _react.useMemo.call(void 0, 
    () => ({ flow: _nullishCoalesce(_optionalChain([selected, 'optionalAccess', _16 => _16.flow]), () => ( hoverFlow)), kind: hoverKind, setFlow: setHoverFlow, setKind: setHoverKind }),
    [hoverFlow, hoverKind, selected]
  );
  const opener = _react.useRef.call(void 0, null);
  const headingRef = _react.useRef.call(void 0, null);
  const currentCrumbRef = _react.useRef.call(void 0, null);
  const canvasRef = _react.useRef.call(void 0, null);
  const stageRef = _react.useRef.call(void 0, null);
  const noteRef = _react.useRef.call(void 0, null);
  const [notePos, setNotePos] = _react.useState.call(void 0, null);
  const [stageW, setStageW] = _react.useState.call(void 0, 1088);
  _react.useEffect.call(void 0, () => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const read = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setStageW(w);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded]);
  const frame = _react.useMemo.call(void 0, () => ({ wide: viewBox, narrow: narrowViewBox }), [viewBox, narrowViewBox]);
  const controlled = _react.useRef.call(void 0, { path, onPathChange });
  controlled.current = { path, onPathChange };
  const navigate = _react.useCallback.call(void 0, (next) => {
    if (samePath(next, requestedRef.current)) return;
    focusIntent.current = true;
    if (controlled.current.path === void 0) setOwn(next);
    _optionalChain([controlled, 'access', _17 => _17.current, 'access', _18 => _18.onPathChange, 'optionalCall', _19 => _19([...next])]);
  }, []);
  const up = _react.useCallback.call(void 0, () => navigate(drillReducer(requestedRef.current, { type: "up" }, ids)), [navigate, ids]);
  const openFrom = _react.useCallback.call(void 0, 
    (from, child) => {
      const cur = requestedRef.current;
      const at = cur.indexOf(from);
      if (at < 0) return;
      navigate(drillReducer(cur.slice(0, at + 1), { type: "open", id: child }, ids));
    },
    [navigate, ids]
  );
  const layerEl = (lid) => _nullishCoalesce(_optionalChain([stageRef, 'access', _20 => _20.current, 'optionalAccess', _21 => _21.querySelector, 'call', _22 => _22(`:scope > [data-level="${typeof CSS !== "undefined" && CSS.escape ? CSS.escape(lid) : lid}"]`)]), () => ( null));
  const { anims, settle, fly } = _chunkYEVVKV3Jcjs.useLayerFlight.call(void 0, 
    () => _optionalChain([stageRef, 'access', _23 => _23.current, 'optionalAccess', _24 => _24.querySelectorAll, 'call', _25 => _25(":scope > .uipack-drill__layer"), 'access', _26 => _26.forEach, 'call', _27 => _27(clearLayer)])
  );
  const finish = (n) => {
    const v = viewRef.current;
    if (!v.flight || v.flight.seq !== n) return;
    const leaving = layerEl(last(v.flight.from));
    if (leaving) leaving.style.visibility = "hidden";
    settle();
    setView({ path: v.path, flight: null });
  };
  _chunkXPCOQ7NOcjs.useIsoLayoutEffect.call(void 0, () => {
    const v = viewRef.current;
    if (samePath(requested, v.path)) return;
    select(null);
    setHoverFlow(null);
    setHoverKind(null);
    setAnnouncement(drillAnnouncement(v.path, requested, labelOf));
    pendingFocus.current = focusIntent.current ? { from: v.path, to: requested } : null;
    focusIntent.current = false;
    if (v.flight && anims.current.length && samePath(requested, v.flight.from)) {
      for (const a of anims.current) a.reverse();
      setView({ path: requested, flight: { ...v.flight, from: v.path } });
      return;
    }
    if (v.flight) settle();
    const from = v.path;
    const canAnimate = typeof _optionalChain([stageRef, 'access', _28 => _28.current, 'optionalAccess', _29 => _29.animate]) === "function" && last(from) !== last(requested);
    if (!canAnimate) {
      setView({ path: requested, flight: null });
      return;
    }
    const move = drillMove(from, requested);
    seq.current += 1;
    setView({ path: requested, flight: { from, kind: move === "in" ? "in" : move === "out" ? "out" : "fade", seq: seq.current } });
  }, [requested]);
  const flightSeq = _optionalChain([view, 'access', _30 => _30.flight, 'optionalAccess', _31 => _31.seq]);
  _chunkXPCOQ7NOcjs.useIsoLayoutEffect.call(void 0, () => {
    const f = viewRef.current.flight;
    const stage = stageRef.current;
    if (!f || !stage) return;
    const fromEl = layerEl(last(f.from));
    const toEl = layerEl(last(viewRef.current.path));
    if (!fromEl || !toEl) {
      finish(f.seq);
      return;
    }
    const target = f.kind === "in" ? findDrillNode(fromEl, last(viewRef.current.path)) : f.kind === "out" ? findDrillNode(toEl, last(f.from)) : null;
    const run = runDrill({ kind: f.kind, from: fromEl, to: toEl, target, stage, canvas: canvasRef.current, reduced, duration });
    fly(run, () => finish(f.seq));
  }, [flightSeq]);
  _chunkXPCOQ7NOcjs.useIsoLayoutEffect.call(void 0, () => {
    if (view.flight || !pendingFocus.current) return;
    const { from, to } = pendingFocus.current;
    pendingFocus.current = null;
    const t = drillFocusTarget(from, to);
    if (t.kind === "node") {
      const layer = layerEl(last(to));
      const node = layer && findDrillNode(layer, t.drill);
      if (node) {
        node.focus({ preventScroll: true });
        return;
      }
    }
    const heading = headingRef.current;
    if (heading && getComputedStyle(heading).display !== "none") heading.focus({ preventScroll: true });
    else _optionalChain([currentCrumbRef, 'access', _32 => _32.current, 'optionalAccess', _33 => _33.focus, 'call', _34 => _34({ preventScroll: true })]);
  }, [view]);
  const svgs = () => Array.from(_nullishCoalesce(_optionalChain([stageRef, 'access', _35 => _35.current, 'optionalAccess', _36 => _36.querySelectorAll, 'call', _37 => _37(":scope > .uipack-drill__layer > svg")]), () => ( [])));
  _react.useEffect.call(void 0, () => {
    for (const s of svgs()) {
      if (typeof s.pauseAnimations !== "function") continue;
      if (playing) s.unpauseAnimations();
      else s.pauseAnimations();
    }
  }, [playing, expanded, view]);
  const toggle = _react.useCallback.call(void 0, () => setPlaying((p) => !p), []);
  const replay = _react.useCallback.call(void 0, () => {
    for (const s of svgs()) {
      if (typeof s.setCurrentTime === "function") s.setCurrentTime(0);
      if (typeof s.unpauseAnimations === "function") s.unpauseAnimations();
    }
    setPlaying(true);
    setCycle((c) => c + 1);
  }, []);
  const motion = _react.useMemo.call(void 0, 
    () => ({ playing: playing && !reduced, reduced, cycle, toggle, replay }),
    [playing, reduced, cycle, toggle, replay]
  );
  const note = _optionalChain([selected, 'optionalAccess', _38 => _38.detail]) ? selected : null;
  _chunkXPCOQ7NOcjs.useIsoLayoutEffect.call(void 0, () => {
    setNotePos(null);
    const canvas = canvasRef.current;
    const el = noteRef.current;
    const anchor2 = _optionalChain([note, 'optionalAccess', _39 => _39.anchor]);
    if (!canvas || !el || !anchor2) return;
    const place = () => {
      if (anchor2.isConnected) setNotePos(_chunkGKZXXH6Kcjs.placeNote.call(void 0, canvas, el, anchor2));
    };
    place();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(place);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [note, zoom, expanded]);
  const current = levelMap.get(last(view.path));
  if (!current) return null;
  const crumbs = view.path;
  const depth = crumbs.length - 1;
  const parentLabel = depth > 0 ? labelOf(crumbs[depth - 1]) : "";
  const trail = crumbs.map(labelOf).join(" \u203A ");
  const fw = vbSize(viewBox);
  const fn = narrowViewBox ? vbSize(narrowViewBox) : null;
  const mounted = view.flight ? [last(view.flight.from), last(view.path)] : [last(view.path)];
  mounted.sort((a, b) => {
    const order = view.flight && view.flight.from.length > view.path.length ? view.flight.from : view.path;
    return order.indexOf(a) - order.indexOf(b);
  });
  const showControls = controls && !reduced;
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
    _chunkA5PZXIEWcjs.CanvasView,
    {
      restoreFocus: () => _optionalChain([opener, 'access', _40 => _40.current, 'optionalAccess', _41 => _41.focus, 'call', _42 => _42()]),
      open: expanded,
      onClose: () => {
        setExpanded(false);
        setZoom(1);
        select(null);
      },
      title: trail,
      theme,
      layout: "figure",
      zoom: { value: zoom, min: 1, max: 3, onChange: setZoom },
      children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkGKZXXH6Kcjs.SelectionContext.Provider, { value: { enabled: true, selected, select }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkAF2HLZ75cjs.FigureMotionContext.Provider, { value: motion, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkGKZXXH6Kcjs.FigureHoverContext.Provider, { value: hover, children: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
        "figure",
        {
          id: figId,
          className: [
            "uipack",
            "uipack-drill",
            narrowViewBox ? "uipack--has-narrow" : "",
            expanded ? "uipack--expanded" : "",
            _nullishCoalesce(className, () => ( ""))
          ].filter(Boolean).join(" "),
          "data-theme": theme,
          "data-level": current.id,
          "data-depth": depth,
          "data-hover-flow": _nullishCoalesce(hoverFlow, () => ( void 0)),
          "data-hover-kind": _nullishCoalesce(hoverKind, () => ( void 0)),
          onKeyDown: (e) => {
            if (e.defaultPrevented) return;
            const t = e.target;
            if (_optionalChain([t, 'access', _43 => _43.closest, 'optionalCall', _44 => _44("input, select, textarea, [contenteditable='true']")])) return;
            if (e.key === "Escape") {
              if (selected) {
                select(null);
                return;
              }
              if (expanded || requestedRef.current.length < 2) return;
              e.preventDefault();
              up();
            } else if (e.key === "Backspace" && requestedRef.current.length > 1) {
              e.preventDefault();
              up();
            }
          },
          style: {
            margin: expanded ? "auto 0" : 0,
            "--figure-width": `${fw.w}px`,
            "--drill-aspect": `${fw.w} / ${fw.h}`,
            "--drill-aspect-narrow": fn ? `${fn.w} / ${fn.h}` : void 0
          },
          children: [
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack__head", children: [
              number || eyebrow ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "p", { className: "uipack__eyebrow", children: [
                number,
                number && eyebrow ? " \xB7 " : "",
                eyebrow
              ] }) : null,
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "nav", { className: "uipack-drill__crumbs", "aria-label": "Figure levels", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "ol", { children: crumbs.map((lid, i) => /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "li", { children: [
                i > 0 ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-drill__sep", "aria-hidden": "true", children: "\u203A" }) : null,
                i < depth ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "button", { type: "button", className: "uipack-drill__crumb", onClick: () => navigate(crumbs.slice(0, i + 1)), children: labelOf(lid) }) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { className: "uipack-drill__here", "aria-current": "location", tabIndex: -1, ref: currentCrumbRef, children: labelOf(lid) })
              ] }, lid)) }) }),
              _react.createElement.call(void 0, 
                `h${headingLevel}`,
                { className: "uipack__title", tabIndex: -1, ref: headingRef },
                _nullishCoalesce(current.title, () => ( current.label))
              ),
              current.caption ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "uipack__caption", children: current.caption }) : null,
              /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { className: "uipack__controls", children: [
                depth > 0 ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "button", { type: "button", className: "uipack__ctl uipack-drill__back", "aria-label": `Back to ${parentLabel}`, onClick: up, children: [
                  /* @__PURE__ */ _jsxruntime.jsx.call(void 0, BackGlyph, {}),
                  " Back"
                ] }) : null,
                expandable && !expanded ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                  "button",
                  {
                    type: "button",
                    className: "uipack__ctl",
                    ref: opener,
                    onClick: () => {
                      select(null);
                      setExpanded(true);
                    },
                    children: "Open canvas"
                  }
                ) : null,
                showControls ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, _jsxruntime.Fragment, { children: [
                  /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "button", { type: "button", className: "uipack__ctl uipack__ctl--motion", onClick: replay, children: [
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkGKZXXH6Kcjs.ReplayGlyph, {}),
                    " Replay"
                  ] }),
                  /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "button", { type: "button", className: "uipack__ctl uipack__ctl--motion", onClick: toggle, "aria-pressed": !playing, children: [
                    playing ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkGKZXXH6Kcjs.PauseGlyph, {}) : /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkGKZXXH6Kcjs.PlayGlyph, {}),
                    " ",
                    playing ? "Pause" : "Play"
                  ] })
                ] }) : null
              ] }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkGKZXXH6Kcjs.Legend, { items: _nullishCoalesce(current.legend, () => ( [])) })
            ] }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "uipack__sr", role: "status", children: note ? `${note.label}: ${note.detail}` : "" }),
            /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "p", { className: "uipack__sr", "aria-live": "polite", "data-drill-announce": "", children: announcement }),
            /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "div", { ref: canvasRef, className: `uipack__canvas uipack__canvas--${background}`, onClick: () => select(null), children: [
              note ? /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
                "div",
                {
                  ref: noteRef,
                  className: "uipack__note",
                  "aria-hidden": "true",
                  "data-placed": notePos ? "true" : void 0,
                  style: _nullishCoalesce(notePos, () => ( void 0)),
                  onClick: (e) => e.stopPropagation(),
                  children: [
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "strong", { children: note.label }),
                    /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "span", { children: note.detail })
                  ]
                }
              ) : null,
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                "div",
                {
                  ref: stageRef,
                  className: "uipack-drill__stage",
                  "data-flight": view.flight ? view.flight.kind : void 0,
                  style: expanded ? { width: `max(${zoom * 100}%, ${800 * zoom}px)` } : void 0,
                  children: mounted.map((lid) => {
                    const lvl = levelMap.get(lid);
                    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                      DrillLayer,
                      {
                        level: lvl,
                        figId,
                        frame,
                        floorWide: levelFloor(_nullishCoalesce(lvl.viewBox, () => ( viewBox)), viewBox, stageW, minFont),
                        floorNarrow: narrowViewBox ? levelFloor(_nullishCoalesce(lvl.narrowViewBox, () => ( narrowViewBox)), narrowViewBox, stageW, minFont) : 0,
                        levels: levelMap,
                        open: openFrom,
                        current: lid === current.id
                      },
                      lid
                    );
                  })
                }
              )
            ] })
          ]
        }
      ) }) }) })
    }
  );
}
DrillFigure.toStatic = (props) => drillStatic(props);

// src/drill/DrillNode.tsx


var noSelection = { enabled: false, selected: null, select: () => {
} };
var stillMotion = { playing: false, reduced: true, cycle: 0, toggle: () => {
}, replay: () => {
} };
var RADIUS = 6;
var MINI_ABOVE = 0.4;
var MINI_SCALE = 0.3;
function Ghost({ child, ctx, box, uid }) {
  const narrow = ctx.variant === "narrow" && !!ctx.frame.narrow;
  const frame = narrow ? ctx.frame.narrow : ctx.frame.wide;
  const render = narrow && child.narrow ? child.narrow : child.render;
  const levelVb = _nullishCoalesce((narrow ? child.narrowViewBox : child.viewBox), () => ( frame));
  const f = vbSize(frame);
  const inner = { ...ctx, ghost: true, interactive: false, open: void 0 };
  const slice = Math.max(box.w / f.w, box.h / f.h);
  const mini = slice > MINI_ABOVE;
  const k = MINI_SCALE;
  const port = mini ? { x: box.x + box.w - f.w * k - 30, y: box.y, width: f.w * k, height: box.h, viewBox: `0 ${(f.h - box.h / k) / 2} ${f.w} ${box.h / k}` } : { x: box.x, y: box.y, width: box.w, height: box.h, viewBox: `0 0 ${f.w} ${f.h}` };
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { ...port, preserveAspectRatio: "xMidYMid slice", overflow: "hidden", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "svg", { width: f.w, height: f.h, viewBox: levelVb, preserveAspectRatio: "xMidYMid meet", children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkGKZXXH6Kcjs.SelectionContext.Provider, { value: noSelection, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkAF2HLZ75cjs.FigureMotionContext.Provider, { value: stillMotion, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkAF2HLZ75cjs.FigureScaleContext.Provider, { value: { floor: 0 }, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, DrillContext.Provider, { value: inner, children: render({ id: `${ctx.idPrefix}-g${uid}`, variant: narrow ? "narrow" : "wide", ghost: true, level: child }) }) }) }) }) }) });
}
function DrillNode({ drill, label, grow = DRILL_GROW, preview = true, ...node }) {
  const ctx = useDrill();
  const uid = cleanId(_react.useId.call(void 0, ));
  const child = _optionalChain([ctx, 'optionalAccess', _45 => _45.levels, 'access', _46 => _46.get, 'call', _47 => _47(drill)]);
  const text = _nullishCoalesce(_nullishCoalesce(label, () => ( _optionalChain([child, 'optionalAccess', _48 => _48.label]))), () => ( drill));
  const ghostRef = _react.useRef.call(void 0, null);
  const [count, setCount] = _react.useState.call(void 0, 0);
  _react.useEffect.call(void 0, () => {
    const g = ghostRef.current;
    if (g) setCount(g.querySelectorAll('[data-uipack="node"]').length);
  }, [drill, _optionalChain([ctx, 'optionalAccess', _49 => _49.variant])]);
  if (!ctx || !child) return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkGKZXXH6Kcjs.Node, { ...node, label: text });
  const box = drillBox({ x: node.x, y: node.y, w: node.w, h: node.h }, grow);
  if (ctx.ghost) return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkGKZXXH6Kcjs.Node, { ...node, ...box, label: text });
  const summary = _nullishCoalesce(child.summary, () => ( (count ? `${count} part${count === 1 ? "" : "s"} inside` : "")));
  const name = `${_chunkGKZXXH6Kcjs.nodeName.call(void 0, text, node.sub)}, open${summary ? `: ${summary}` : ""}`;
  const interactive = ctx.interactive && !!ctx.open;
  const activate = (e) => {
    e.preventDefault();
    e.stopPropagation();
    _optionalChain([ctx, 'access', _50 => _50.open, 'optionalCall', _51 => _51(drill)]);
  };
  const pad = 24;
  const region = { x: box.x - pad, y: box.y - pad, width: box.w + pad * 2, height: box.h + pad * 2 };
  const mx = box.x + box.w - 22;
  const my = box.y + 10;
  return /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, 
    "g",
    {
      className: "uipack-drill-node",
      "data-uipack": "drill-node",
      "data-drill": drill,
      ...interactive ? {
        role: "button",
        tabIndex: 0,
        "aria-label": name,
        onClick: activate,
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") activate(e);
        }
      } : {},
      children: [
        /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "defs", { children: [
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "filter", { id: `${uid}-halo`, filterUnits: "userSpaceOnUse", ...region, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "feGaussianBlur", { stdDeviation: 7 }) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "filter", { id: `${uid}-soft`, filterUnits: "userSpaceOnUse", ...region, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "feGaussianBlur", { stdDeviation: 5 }) }),
          /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "clipPath", { id: `${uid}-clip`, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "rect", { x: box.x, y: box.y, width: box.w, height: box.h, rx: RADIUS }) })
        ] }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          "rect",
          {
            className: "uipack-drill-node__halo",
            x: box.x,
            y: box.y,
            width: box.w,
            height: box.h,
            rx: RADIUS,
            fill: "none",
            stroke: "var(--uipack-accent)",
            strokeWidth: 8,
            strokeOpacity: 0.3,
            filter: `url(#${uid}-halo)`,
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, _chunkGKZXXH6Kcjs.SelectionContext.Provider, { value: noSelection, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          _chunkGKZXXH6Kcjs.Node,
          {
            ...node,
            ...box,
            label: text,
            inlay: /* @__PURE__ */ _jsxruntime.jsxs.call(void 0, "g", { className: "uipack-drill-node__inlay", clipPath: `url(#${uid}-clip)`, "aria-hidden": "true", pointerEvents: "none", children: [
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "rect", { className: "uipack-drill-node__wash", x: box.x, y: box.y, width: box.w, height: box.h, fill: "var(--uipack-accent)", fillOpacity: 0.035 }),
              /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
                "rect",
                {
                  className: "uipack-drill-node__inner",
                  x: box.x,
                  y: box.y,
                  width: box.w,
                  height: box.h,
                  rx: RADIUS,
                  fill: "none",
                  stroke: "var(--uipack-accent)",
                  strokeWidth: 10,
                  strokeOpacity: 0.12,
                  filter: `url(#${uid}-soft)`
                }
              ),
              preview ? /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "g", { ref: ghostRef, className: "uipack-drill-node__ghost", opacity: 0.16, children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, Ghost, { child, ctx, box, uid }) }) : null
            ] })
          }
        ) }),
        /* @__PURE__ */ _jsxruntime.jsx.call(void 0, 
          "g",
          {
            className: "uipack-drill-node__mark",
            transform: `translate(${mx}, ${my})`,
            fill: "none",
            stroke: "var(--uipack-accent)",
            strokeWidth: 1.5,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            "aria-hidden": "true",
            pointerEvents: "none",
            children: /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: "M2.5 9.5 9.5 2.5M5.5 2.5h4v4M2.5 5.5v4h4" })
          }
        )
      ]
    }
  );
}




























































exports.Badge = Badge; exports.Bus = _chunkGKZXXH6Kcjs.Bus; exports.Chip = _chunkGKZXXH6Kcjs.Chip; exports.Connector = _chunkGKZXXH6Kcjs.Connector; exports.Cross = Cross; exports.DEFAULT_RENDER_WIDTH = _chunkAF2HLZ75cjs.DEFAULT_RENDER_WIDTH; exports.DRILL_GROW = DRILL_GROW; exports.Defs = _chunkGKZXXH6Kcjs.Defs; exports.DrillFigure = DrillFigure; exports.DrillNode = DrillNode; exports.Figure = _chunkGKZXXH6Kcjs.Figure; exports.FigureHoverContext = _chunkGKZXXH6Kcjs.FigureHoverContext; exports.FigureMotionContext = _chunkAF2HLZ75cjs.FigureMotionContext; exports.FigureScaleContext = _chunkAF2HLZ75cjs.FigureScaleContext; exports.FigureScaleProvider = _chunkAF2HLZ75cjs.FigureScaleProvider; exports.Group = _chunkGKZXXH6Kcjs.Group; exports.Label = _chunkGKZXXH6Kcjs.Label; exports.Lane = _chunkGKZXXH6Kcjs.Lane; exports.Legend = _chunkGKZXXH6Kcjs.Legend; exports.Node = _chunkGKZXXH6Kcjs.Node; exports.Packet = _chunkGKZXXH6Kcjs.Packet; exports.TOKEN_SHAPE = _chunkAF2HLZ75cjs.TOKEN_SHAPE; exports.Token = _chunkAF2HLZ75cjs.Token; exports.Wall = Wall; exports.Wordmark = Wordmark; exports.anchor = _chunkGKZXXH6Kcjs.anchor; exports.busStub = _chunkGKZXXH6Kcjs.busStub; exports.busStubs = _chunkGKZXXH6Kcjs.busStubs; exports.connectorStroke = _chunkGKZXXH6Kcjs.connectorStroke; exports.drillAnnouncement = drillAnnouncement; exports.drillBox = drillBox; exports.drillFocusTarget = drillFocusTarget; exports.drillMotion = drillMotion; exports.drillMove = drillMove; exports.drillReducer = drillReducer; exports.drillStatic = drillStatic; exports.easeInOutCubic = _chunkVGPFDDCPcjs.easeInOutCubic; exports.flowList = _chunkGKZXXH6Kcjs.flowList; exports.fontFloor = _chunkAF2HLZ75cjs.fontFloor; exports.grid = _chunkGKZXXH6Kcjs.grid; exports.hoverAttrs = _chunkGKZXXH6Kcjs.hoverAttrs; exports.icons = _chunkGKZXXH6Kcjs.icons; exports.innerClipStart = _chunkVGPFDDCPcjs.innerClipStart; exports.marks = marks; exports.normalizeDrillPath = normalizePath; exports.pathFromPoints = _chunkGKZXXH6Kcjs.pathFromPoints; exports.pointAlong = _chunkGKZXXH6Kcjs.pointAlong; exports.polylineLength = _chunkGKZXXH6Kcjs.polylineLength; exports.route = _chunkGKZXXH6Kcjs.route; exports.smoothstep = _chunkVGPFDDCPcjs.smoothstep; exports.tokenColor = _chunkAF2HLZ75cjs.tokenColor; exports.trim = _chunkGKZXXH6Kcjs.trim; exports.useFigureHover = _chunkGKZXXH6Kcjs.useFigureHover; exports.useFigureMotion = _chunkAF2HLZ75cjs.useFigureMotion; exports.useFontFloor = _chunkAF2HLZ75cjs.useFontFloor; exports.usePrefersReducedMotion = _chunkXPCOQ7NOcjs.usePrefersReducedMotion; exports.wallSegments = wallSegments; exports.zoomFrame = _chunkVGPFDDCPcjs.zoomFrame; exports.zoomSamples = _chunkVGPFDDCPcjs.zoomSamples;
//# sourceMappingURL=index.cjs.map