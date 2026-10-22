import { useLayerFlight } from './chunk-5GCY6KJP.js';
import { zoomSamples, zoomFrame, smoothstep } from './chunk-VZ4PJUMF.js';
export { easeInOutCubic, innerClipStart, smoothstep, zoomFrame, zoomSamples } from './chunk-VZ4PJUMF.js';
import { useFigureHover, hoverAttrs, connectorStroke, Node, nodeName, SelectionContext, FigureHoverContext, ReplayGlyph, PauseGlyph, PlayGlyph, Legend, placeNote } from './chunk-L6SV5FWH.js';
export { Bus, Chip, Connector, Defs, Figure, FigureHoverContext, Group, Label, Lane, Legend, Node, Packet, anchor, busStub, busStubs, connectorStroke, flowList, grid, hoverAttrs, icons, pathFromPoints, pointAlong, polylineLength, route, trim, useFigureHover } from './chunk-L6SV5FWH.js';
import { useFontFloor, FigureMotionContext, FigureScaleContext } from './chunk-3R6VZY52.js';
export { DEFAULT_RENDER_WIDTH, FigureMotionContext, FigureScaleContext, FigureScaleProvider, TOKEN_SHAPE, Token, fontFloor, tokenColor, useFigureMotion, useFontFloor } from './chunk-3R6VZY52.js';
import { CanvasView } from './chunk-WTI575DG.js';
import { usePrefersReducedMotion, useIsoLayoutEffect } from './chunk-KYO6UXHN.js';
export { usePrefersReducedMotion } from './chunk-KYO6UXHN.js';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useId, useRef, useState, useEffect, createContext, useMemo, useCallback, createElement, useContext, memo } from 'react';

function Badge({ cx, cy, text, accent, r = 9, size: size0 = 10 }) {
  const size = useFontFloor(size0);
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  return /* @__PURE__ */ jsxs("g", { "data-uipack": "badge", children: [
    /* @__PURE__ */ jsx("circle", { cx, cy, r, fill: "var(--uipack-bg)", stroke, strokeOpacity: accent ? 1 : 0.6, strokeWidth: 1.25 }),
    /* @__PURE__ */ jsx("text", { x: cx, y: cy + size * 0.35, textAnchor: "middle", fontSize: size, fontFamily: "var(--uipack-mono)", fontWeight: 700, fill: stroke, children: text })
  ] });
}
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
  const hover = useFigureHover();
  return /* @__PURE__ */ jsx("g", { "data-uipack": "wall", ...hoverAttrs(flow, void 0, hover), children: wallSegments(from, to, holes, gap).map(([a, b]) => {
    const r = axis === "v" ? { x: at - t / 2, y: a, width: t, height: b - a } : { x: a, y: at - t / 2, width: b - a, height: t };
    return /* @__PURE__ */ jsx("rect", { ...r, rx: 2, fill: "var(--uipack-surface-raised)", stroke: "currentColor", strokeOpacity: 0.55, strokeWidth: 1.25 }, a);
  }) });
}
function Cross({ x, y, r = 5, kind }) {
  return /* @__PURE__ */ jsxs("g", { "data-uipack": "cross", stroke: connectorStroke(kind), strokeOpacity: kind ? 1 : 0.8, strokeWidth: 1.75, strokeLinecap: "round", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsx("line", { x1: x - r, y1: y - r, x2: x + r, y2: y + r }),
    /* @__PURE__ */ jsx("line", { x1: x - r, y1: y + r, x2: x + r, y2: y - r })
  ] });
}
var marks = {
  uipack: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("rect", { x: "4", y: "4", width: "10", height: "10", rx: "2" }),
    /* @__PURE__ */ jsx("rect", { x: "18", y: "4", width: "10", height: "10", rx: "2" }),
    /* @__PURE__ */ jsx("rect", { x: "4", y: "18", width: "10", height: "10", rx: "2" }),
    /* @__PURE__ */ jsx("rect", { x: "18", y: "18", width: "10", height: "10", rx: "5", fill: "currentColor" })
  ] }),
  groundplane: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("path", { d: "M4 22h24" }),
    /* @__PURE__ */ jsx("path", { d: "M8 22V10l8-4 8 4v12" }),
    /* @__PURE__ */ jsx("path", { d: "M8 16h16", strokeDasharray: "2 2" })
  ] }),
  jobforge: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("path", { d: "M6 24h20" }),
    /* @__PURE__ */ jsx("path", { d: "M10 24V14h12v10" }),
    /* @__PURE__ */ jsx("path", { d: "M13 14V9h6v5M16 4v5" })
  ] }),
  skillsmith: /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("path", { d: "M16 4l3.5 7 7.5 1-5.5 5.3 1.3 7.7L16 21.4 9.2 25l1.3-7.7L5 12l7.5-1z" }) }),
  deckforge: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("rect", { x: "4", y: "7", width: "24", height: "15", rx: "2" }),
    /* @__PURE__ */ jsx("path", { d: "M12 26h8M16 22v4M9 13h8M9 17h5" })
  ] }),
  proofpack: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("path", { d: "M8 4h11l5 5v19H8z" }),
    /* @__PURE__ */ jsx("path", { d: "M19 4v5h5" }),
    /* @__PURE__ */ jsx("path", { d: "M12 18l3 3 5-6" })
  ] }),
  fieldpack: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("rect", { x: "5", y: "10", width: "22", height: "16", rx: "3" }),
    /* @__PURE__ */ jsx("path", { d: "M11 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3M5 16h22" })
  ] }),
  skillpack: /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("rect", { x: "5", y: "6", width: "22", height: "20", rx: "3" }),
    /* @__PURE__ */ jsx("path", { d: "M10 12h12M10 16h12M10 20h7" })
  ] })
};
function Wordmark({ size = 24 }) {
  return /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 140 32", width: size * 140 / 32, height: size, role: "img", "aria-label": "uipack", style: { display: "block" }, children: [
    /* @__PURE__ */ jsx("g", { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: marks.uipack }),
    /* @__PURE__ */ jsx("text", { x: "40", y: "22", fontSize: "18", fontWeight: 700, fontFamily: "var(--uipack-mono, ui-monospace, monospace)", letterSpacing: ".02em", fill: "currentColor", children: "uipack" })
  ] });
}

// src/drill/animate.ts
var drillMotion = {
  zoom: 1e3,
  fade: 320,
  reduced: 160
};
function findDrillNode(layer, id) {
  const all = Array.from(layer.querySelectorAll(`[data-drill="${cssEscape(id)}"]`));
  return all.find((el) => el.getBoundingClientRect().width > 0) ?? all[0] ?? null;
}
var cssEscape = (s) => typeof CSS !== "undefined" && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, "\\$&");
var boxOf = (node) => node.querySelector('[data-uipack="node"] > rect') ?? node;
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
    const userW = boxEl.width?.baseVal?.value;
    if (userW) k = r.width / userW;
    samples = zoomSamples(local, kind === "in", W, H, { samples: 32, radius: 6 * k });
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
  const frame = zoomFrame(local, W, H);
  const origin = `${frame.fx.toFixed(2)}px ${frame.fy.toFixed(2)}px`;
  inner.dataset.role = "inner";
  inner.style.zIndex = "2";
  paintInner(inner, canvas);
  const timing = { duration: opts.duration ?? drillMotion.zoom, easing: "linear" };
  play(
    outer,
    samples.map((s) => ({ offset: s.offset, transform: s.outer, transformOrigin: origin, opacity: 1 - smoothstep(0.88, 0.99, s.p) })),
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
  if (halo) play(halo, samples.map((s) => ({ offset: s.offset, opacity: 1 - smoothstep(0, 0.25, s.p) })), timing);
  return anims;
}
var DrillContext = /* @__PURE__ */ createContext(null);
var useDrill = () => useContext(DrillContext);

// src/drill/model.ts
function normalizePath(path, ids, root) {
  const known = ids instanceof Set ? ids : new Set(ids);
  const out = [root];
  if (!path?.length) return out;
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
function drillStatic(props, path) {
  const levels = new Map(props.levels.map((l) => [l.id, l]));
  const root = props.root ?? props.levels[0]?.id ?? "";
  const p = normalizePath(path ?? props.path ?? props.defaultPath, new Set(levels.keys()), root);
  const level = levels.get(p[p.length - 1]);
  const trail = p.length > 1 ? p.map((id) => levels.get(id)?.label ?? id).join(" \u203A ") : "";
  const lid = `static-${cleanId(level.id)}`;
  return {
    children: /* @__PURE__ */ jsx(
      DrillContext.Provider,
      {
        value: { levels, frame: { wide: props.viewBox, narrow: props.narrowViewBox }, idPrefix: lid, variant: "wide", interactive: false, ghost: false },
        children: level.render({ id: lid, variant: "wide", ghost: false, level })
      }
    ),
    viewBox: level.viewBox ?? props.viewBox,
    legend: level.legend,
    number: props.number,
    eyebrow: [props.eyebrow, trail].filter(Boolean).join(" \xB7 ") || void 0,
    title: level.title ?? level.label,
    caption: level.caption,
    alt: level.alt,
    background: props.background
  };
}
var last = (p) => p[p.length - 1];
var BackGlyph = () => /* @__PURE__ */ jsx("svg", { viewBox: "0 0 12 12", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "M7.5 2.5 4 6l3.5 3.5", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }) });
var DrillLayer = /* @__PURE__ */ memo(function DrillLayer2({ level, figId, frame, floorWide, floorNarrow, levels, open, current }) {
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
  const draw = (variant, render, vb, floor) => /* @__PURE__ */ jsx(
    "svg",
    {
      className: `uipack-drill__${variant}`,
      viewBox: vb,
      preserveAspectRatio: "xMidYMid meet",
      role: "group",
      "aria-label": level.alt,
      children: /* @__PURE__ */ jsx(DrillContext.Provider, { value: ctx(variant), children: /* @__PURE__ */ jsx(FigureScaleContext.Provider, { value: { floor }, children: render({ id: variant === "wide" ? lid : `${lid}-n`, variant, ghost: false, level }) }) })
    }
  );
  return /* @__PURE__ */ jsxs("div", { className: "uipack-drill__layer", "data-level": level.id, "data-current": current ? "true" : void 0, children: [
    draw("wide", level.render, level.viewBox ?? frame.wide, floorWide),
    frame.narrow ? draw("narrow", level.narrow ?? level.render, level.narrowViewBox ?? frame.narrow, floorNarrow) : null
  ] });
});
function DrillFigureRoot({
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
  const auto = useId();
  const figId = id ?? `uipack-drill-${cleanId(auto)}`;
  const levelMap = useMemo(() => new Map(levels.map((l) => [l.id, l])), [levels]);
  const ids = useMemo(() => new Set(levelMap.keys()), [levelMap]);
  const rootId = root ?? levels[0]?.id ?? "";
  const labelOf = useCallback((lid) => levelMap.get(lid)?.label ?? lid, [levelMap]);
  const [own, setOwn] = useState(() => normalizePath(defaultPath, ids, rootId));
  const requestedRaw = normalizePath(path ?? own, ids, rootId);
  const requestedKey = requestedRaw.join("\0");
  const requested = useMemo(() => requestedRaw, [requestedKey]);
  const requestedRef = useRef(requested);
  requestedRef.current = requested;
  const [view, setView] = useState(() => ({ path: requested, flight: null }));
  const viewRef = useRef(view);
  viewRef.current = view;
  const seq = useRef(0);
  const focusIntent = useRef(false);
  const pendingFocus = useRef(null);
  const [announcement, setAnnouncement] = useState("");
  const reduced = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selected, select] = useState(null);
  const [hoverFlow, setHoverFlow] = useState(null);
  const [hoverKind, setHoverKind] = useState(null);
  const hover = useMemo(
    () => ({ flow: selected?.flow ?? hoverFlow, kind: hoverKind, setFlow: setHoverFlow, setKind: setHoverKind }),
    [hoverFlow, hoverKind, selected]
  );
  const opener = useRef(null);
  const headingRef = useRef(null);
  const currentCrumbRef = useRef(null);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const noteRef = useRef(null);
  const [notePos, setNotePos] = useState(null);
  const [stageW, setStageW] = useState(1088);
  useEffect(() => {
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
  const frame = useMemo(() => ({ wide: viewBox, narrow: narrowViewBox }), [viewBox, narrowViewBox]);
  const controlled = useRef({ path, onPathChange });
  controlled.current = { path, onPathChange };
  const navigate = useCallback((next) => {
    if (samePath(next, requestedRef.current)) return;
    focusIntent.current = true;
    if (controlled.current.path === void 0) setOwn(next);
    controlled.current.onPathChange?.([...next]);
  }, []);
  const up = useCallback(() => navigate(drillReducer(requestedRef.current, { type: "up" }, ids)), [navigate, ids]);
  const openFrom = useCallback(
    (from, child) => {
      const cur = requestedRef.current;
      const at = cur.indexOf(from);
      if (at < 0) return;
      navigate(drillReducer(cur.slice(0, at + 1), { type: "open", id: child }, ids));
    },
    [navigate, ids]
  );
  const layerEl = (lid) => stageRef.current?.querySelector(`:scope > [data-level="${typeof CSS !== "undefined" && CSS.escape ? CSS.escape(lid) : lid}"]`) ?? null;
  const { anims, settle, fly } = useLayerFlight(
    () => stageRef.current?.querySelectorAll(":scope > .uipack-drill__layer").forEach(clearLayer)
  );
  const finish = (n) => {
    const v = viewRef.current;
    if (!v.flight || v.flight.seq !== n) return;
    const leaving = layerEl(last(v.flight.from));
    if (leaving) leaving.style.visibility = "hidden";
    settle();
    setView({ path: v.path, flight: null });
  };
  useIsoLayoutEffect(() => {
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
    const canAnimate = typeof stageRef.current?.animate === "function" && last(from) !== last(requested);
    if (!canAnimate) {
      setView({ path: requested, flight: null });
      return;
    }
    const move = drillMove(from, requested);
    seq.current += 1;
    setView({ path: requested, flight: { from, kind: move === "in" ? "in" : move === "out" ? "out" : "fade", seq: seq.current } });
  }, [requested]);
  const flightSeq = view.flight?.seq;
  useIsoLayoutEffect(() => {
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
  useIsoLayoutEffect(() => {
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
    else currentCrumbRef.current?.focus({ preventScroll: true });
  }, [view]);
  const svgs = () => Array.from(stageRef.current?.querySelectorAll(":scope > .uipack-drill__layer > svg") ?? []);
  useEffect(() => {
    for (const s of svgs()) {
      if (typeof s.pauseAnimations !== "function") continue;
      if (playing) s.unpauseAnimations();
      else s.pauseAnimations();
    }
  }, [playing, expanded, view]);
  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const replay = useCallback(() => {
    for (const s of svgs()) {
      if (typeof s.setCurrentTime === "function") s.setCurrentTime(0);
      if (typeof s.unpauseAnimations === "function") s.unpauseAnimations();
    }
    setPlaying(true);
    setCycle((c) => c + 1);
  }, []);
  const motion = useMemo(
    () => ({ playing: playing && !reduced, reduced, cycle, toggle, replay }),
    [playing, reduced, cycle, toggle, replay]
  );
  const note = selected?.detail ? selected : null;
  useIsoLayoutEffect(() => {
    setNotePos(null);
    const canvas = canvasRef.current;
    const el = noteRef.current;
    const anchor2 = note?.anchor;
    if (!canvas || !el || !anchor2) return;
    const place = () => {
      if (anchor2.isConnected) setNotePos(placeNote(canvas, el, anchor2));
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
  return /* @__PURE__ */ jsx(
    CanvasView,
    {
      restoreFocus: () => opener.current?.focus(),
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
      children: /* @__PURE__ */ jsx(SelectionContext.Provider, { value: { enabled: true, selected, select }, children: /* @__PURE__ */ jsx(FigureMotionContext.Provider, { value: motion, children: /* @__PURE__ */ jsx(FigureHoverContext.Provider, { value: hover, children: /* @__PURE__ */ jsxs(
        "figure",
        {
          id: figId,
          className: [
            "uipack",
            "uipack-drill",
            narrowViewBox ? "uipack--has-narrow" : "",
            expanded ? "uipack--expanded" : "",
            className ?? ""
          ].filter(Boolean).join(" "),
          "data-theme": theme,
          "data-level": current.id,
          "data-depth": depth,
          "data-hover-flow": hoverFlow ?? void 0,
          "data-hover-kind": hoverKind ?? void 0,
          onKeyDown: (e) => {
            if (e.defaultPrevented) return;
            const t = e.target;
            if (t.closest?.("input, select, textarea, [contenteditable='true']")) return;
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
            /* @__PURE__ */ jsxs("div", { className: "uipack__head", children: [
              number || eyebrow ? /* @__PURE__ */ jsxs("p", { className: "uipack__eyebrow", children: [
                number,
                number && eyebrow ? " \xB7 " : "",
                eyebrow
              ] }) : null,
              /* @__PURE__ */ jsx("nav", { className: "uipack-drill__crumbs", "aria-label": "Figure levels", children: /* @__PURE__ */ jsx("ol", { children: crumbs.map((lid, i) => /* @__PURE__ */ jsxs("li", { children: [
                i > 0 ? /* @__PURE__ */ jsx("span", { className: "uipack-drill__sep", "aria-hidden": "true", children: "\u203A" }) : null,
                i < depth ? /* @__PURE__ */ jsx("button", { type: "button", className: "uipack-drill__crumb", onClick: () => navigate(crumbs.slice(0, i + 1)), children: labelOf(lid) }) : /* @__PURE__ */ jsx("span", { className: "uipack-drill__here", "aria-current": "location", tabIndex: -1, ref: currentCrumbRef, children: labelOf(lid) })
              ] }, lid)) }) }),
              createElement(
                `h${headingLevel}`,
                { className: "uipack__title", tabIndex: -1, ref: headingRef },
                current.title ?? current.label
              ),
              current.caption ? /* @__PURE__ */ jsx("p", { className: "uipack__caption", children: current.caption }) : null,
              /* @__PURE__ */ jsxs("div", { className: "uipack__controls", children: [
                depth > 0 ? /* @__PURE__ */ jsxs("button", { type: "button", className: "uipack__ctl uipack-drill__back", "aria-label": `Back to ${parentLabel}`, onClick: up, children: [
                  /* @__PURE__ */ jsx(BackGlyph, {}),
                  " Back"
                ] }) : null,
                expandable && !expanded ? /* @__PURE__ */ jsx(
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
                showControls ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs("button", { type: "button", className: "uipack__ctl uipack__ctl--motion", onClick: replay, children: [
                    /* @__PURE__ */ jsx(ReplayGlyph, {}),
                    " Replay"
                  ] }),
                  /* @__PURE__ */ jsxs("button", { type: "button", className: "uipack__ctl uipack__ctl--motion", onClick: toggle, "aria-pressed": !playing, children: [
                    playing ? /* @__PURE__ */ jsx(PauseGlyph, {}) : /* @__PURE__ */ jsx(PlayGlyph, {}),
                    " ",
                    playing ? "Pause" : "Play"
                  ] })
                ] }) : null
              ] }),
              /* @__PURE__ */ jsx(Legend, { items: current.legend ?? [] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "uipack__sr", role: "status", children: note ? `${note.label}: ${note.detail}` : "" }),
            /* @__PURE__ */ jsx("p", { className: "uipack__sr", "aria-live": "polite", "data-drill-announce": "", children: announcement }),
            /* @__PURE__ */ jsxs("div", { ref: canvasRef, className: `uipack__canvas uipack__canvas--${background}`, onClick: () => select(null), children: [
              note ? /* @__PURE__ */ jsxs(
                "div",
                {
                  ref: noteRef,
                  className: "uipack__note",
                  "aria-hidden": "true",
                  "data-placed": notePos ? "true" : void 0,
                  style: notePos ?? void 0,
                  onClick: (e) => e.stopPropagation(),
                  children: [
                    /* @__PURE__ */ jsx("strong", { children: note.label }),
                    /* @__PURE__ */ jsx("span", { children: note.detail })
                  ]
                }
              ) : null,
              /* @__PURE__ */ jsx(
                "div",
                {
                  ref: stageRef,
                  className: "uipack-drill__stage",
                  "data-flight": view.flight ? view.flight.kind : void 0,
                  style: expanded ? { width: `max(${zoom * 100}%, ${800 * zoom}px)` } : void 0,
                  children: mounted.map((lid) => {
                    const lvl = levelMap.get(lid);
                    return /* @__PURE__ */ jsx(
                      DrillLayer,
                      {
                        level: lvl,
                        figId,
                        frame,
                        floorWide: levelFloor(lvl.viewBox ?? viewBox, viewBox, stageW, minFont),
                        floorNarrow: narrowViewBox ? levelFloor(lvl.narrowViewBox ?? narrowViewBox, narrowViewBox, stageW, minFont) : 0,
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
var DrillFigure = /* @__PURE__ */ Object.assign(DrillFigureRoot, {
  displayName: "DrillFigure",
  toStatic: (props) => drillStatic(props)
});
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
  const levelVb = (narrow ? child.narrowViewBox : child.viewBox) ?? frame;
  const f = vbSize(frame);
  const inner = { ...ctx, ghost: true, interactive: false, open: void 0 };
  const slice = Math.max(box.w / f.w, box.h / f.h);
  const mini = slice > MINI_ABOVE;
  const k = MINI_SCALE;
  const port = mini ? { x: box.x + box.w - f.w * k - 30, y: box.y, width: f.w * k, height: box.h, viewBox: `0 ${(f.h - box.h / k) / 2} ${f.w} ${box.h / k}` } : { x: box.x, y: box.y, width: box.w, height: box.h, viewBox: `0 0 ${f.w} ${f.h}` };
  return /* @__PURE__ */ jsx("svg", { ...port, preserveAspectRatio: "xMidYMid slice", overflow: "hidden", children: /* @__PURE__ */ jsx("svg", { width: f.w, height: f.h, viewBox: levelVb, preserveAspectRatio: "xMidYMid meet", children: /* @__PURE__ */ jsx(SelectionContext.Provider, { value: noSelection, children: /* @__PURE__ */ jsx(FigureMotionContext.Provider, { value: stillMotion, children: /* @__PURE__ */ jsx(FigureScaleContext.Provider, { value: { floor: 0 }, children: /* @__PURE__ */ jsx(DrillContext.Provider, { value: inner, children: render({ id: `${ctx.idPrefix}-g${uid}`, variant: narrow ? "narrow" : "wide", ghost: true, level: child }) }) }) }) }) }) });
}
function DrillNode({ drill, label, grow = DRILL_GROW, preview = true, ...node }) {
  const ctx = useDrill();
  const uid = cleanId(useId());
  const child = ctx?.levels.get(drill);
  const text = label ?? child?.label ?? drill;
  const ghostRef = useRef(null);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const g = ghostRef.current;
    if (g) setCount(g.querySelectorAll('[data-uipack="node"]').length);
  }, [drill, ctx?.variant]);
  if (!ctx || !child) return /* @__PURE__ */ jsx(Node, { ...node, label: text });
  const box = drillBox({ x: node.x, y: node.y, w: node.w, h: node.h }, grow);
  if (ctx.ghost) return /* @__PURE__ */ jsx(Node, { ...node, ...box, label: text });
  const summary = child.summary ?? (count ? `${count} part${count === 1 ? "" : "s"} inside` : "");
  const name = `${nodeName(text, node.sub)}, open${summary ? `: ${summary}` : ""}`;
  const interactive = ctx.interactive && !!ctx.open;
  const activate = (e) => {
    e.preventDefault();
    e.stopPropagation();
    ctx.open?.(drill);
  };
  const pad = 24;
  const region = { x: box.x - pad, y: box.y - pad, width: box.w + pad * 2, height: box.h + pad * 2 };
  const mx = box.x + box.w - 22;
  const my = box.y + 10;
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsxs("defs", { children: [
          /* @__PURE__ */ jsx("filter", { id: `${uid}-halo`, filterUnits: "userSpaceOnUse", ...region, children: /* @__PURE__ */ jsx("feGaussianBlur", { stdDeviation: 7 }) }),
          /* @__PURE__ */ jsx("filter", { id: `${uid}-soft`, filterUnits: "userSpaceOnUse", ...region, children: /* @__PURE__ */ jsx("feGaussianBlur", { stdDeviation: 5 }) }),
          /* @__PURE__ */ jsx("clipPath", { id: `${uid}-clip`, children: /* @__PURE__ */ jsx("rect", { x: box.x, y: box.y, width: box.w, height: box.h, rx: RADIUS }) })
        ] }),
        /* @__PURE__ */ jsx(
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
        /* @__PURE__ */ jsx(SelectionContext.Provider, { value: noSelection, children: /* @__PURE__ */ jsx(
          Node,
          {
            ...node,
            ...box,
            label: text,
            inlay: /* @__PURE__ */ jsxs("g", { className: "uipack-drill-node__inlay", clipPath: `url(#${uid}-clip)`, "aria-hidden": "true", pointerEvents: "none", children: [
              /* @__PURE__ */ jsx("rect", { className: "uipack-drill-node__wash", x: box.x, y: box.y, width: box.w, height: box.h, fill: "var(--uipack-accent)", fillOpacity: 0.035 }),
              /* @__PURE__ */ jsx(
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
              preview ? /* @__PURE__ */ jsx("g", { ref: ghostRef, className: "uipack-drill-node__ghost", opacity: 0.16, children: /* @__PURE__ */ jsx(Ghost, { child, ctx, box, uid }) }) : null
            ] })
          }
        ) }),
        /* @__PURE__ */ jsx(
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
            children: /* @__PURE__ */ jsx("path", { d: "M2.5 9.5 9.5 2.5M5.5 2.5h4v4M2.5 5.5v4h4" })
          }
        )
      ]
    }
  );
}

export { Badge, Cross, DRILL_GROW, DrillFigure, DrillNode, Wall, Wordmark, drillAnnouncement, drillBox, drillFocusTarget, drillMotion, drillMove, drillReducer, drillStatic, marks, normalizePath as normalizeDrillPath, wallSegments };
