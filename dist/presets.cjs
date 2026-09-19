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

// src/presets/index.ts
var presets_exports = {};
__export(presets_exports, {
  NARROW_W: () => NARROW_W,
  PRESETS: () => PRESETS,
  PresetFigure: () => PresetFigure,
  Stack: () => Stack,
  agentLoop: () => agentLoop,
  agentLoopParts: () => agentLoopParts,
  beforeAfter: () => beforeAfter,
  beforeAfterParts: () => beforeAfterParts,
  defaultAgentLoop: () => defaultAgentLoop,
  defaultBeforeAfter: () => defaultBeforeAfter,
  defaultPipeline: () => defaultPipeline,
  defaultRagPipeline: () => defaultRagPipeline,
  defaultServiceMap: () => defaultServiceMap,
  defaultSkillLifecycle: () => defaultSkillLifecycle,
  defaultSyncLoop: () => defaultSyncLoop,
  pipeline: () => pipeline,
  pipelineParts: () => pipelineParts,
  presetFigure: () => presetFigure,
  ragPipeline: () => ragPipeline,
  ragPipelineParts: () => ragPipelineParts,
  serviceMap: () => serviceMap,
  serviceMapParts: () => serviceMapParts,
  skillLifecycle: () => skillLifecycle,
  skillLifecycleParts: () => skillLifecycleParts,
  stackHeight: () => stackHeight,
  syncLoop: () => syncLoop,
  syncLoopParts: () => syncLoopParts,
  toFigure: () => toFigure
});
module.exports = __toCommonJS(presets_exports);

// src/presets/shared.tsx
var import_react9 = require("react");

// src/hover.tsx
var import_react = require("react");
var noop = () => {
};
var FigureHoverContext = (0, import_react.createContext)({ flow: null, kind: null, setFlow: noop, setKind: noop });
function useFigureHover() {
  return (0, import_react.useContext)(FigureHoverContext);
}
var flowList = (flow) => flow == null ? [] : Array.isArray(flow) ? flow : [flow];
function hoverAttrs(flow, kind, hover) {
  const flows = flowList(flow);
  const attrs = {};
  if (flows.length) attrs["data-flow"] = flows.join(" ");
  if (kind) attrs["data-kind"] = kind;
  let state;
  if (hover.flow) state = flows.includes(hover.flow) ? "hit" : "dim";
  else if (hover.kind && kind) state = kind === hover.kind ? "hit" : "dim";
  if (state) attrs["data-state"] = state;
  return attrs;
}
var isPointer = (e) => e.pointerType !== "touch";

// src/geometry.ts
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
function polylineLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  return total;
}
function trim(points, start = 0, end = 0) {
  if (points.length < 2) return points;
  const total = polylineLength(points);
  if (start + end >= total) {
    const m = pointAlong(points, 0.5);
    return [m, m];
  }
  const cut = (pts, by) => {
    let left = by;
    let i = 0;
    while (i < pts.length - 1) {
      const [ax, ay] = pts[i];
      const [bx, by2] = pts[i + 1];
      const l = Math.hypot(bx - ax, by2 - ay);
      if (left < l || left === l && i === pts.length - 2) {
        const k = l === 0 ? 0 : left / l;
        const r3 = (v) => Math.round(v * 1e3) / 1e3;
        return [[r3(ax + (bx - ax) * k), r3(ay + (by2 - ay) * k)], ...pts.slice(i + 1)];
      }
      left -= l;
      i++;
    }
    return pts.slice(-1);
  };
  let out = start > 0 ? cut(points, start) : points;
  if (end > 0) out = cut([...out].reverse(), end).reverse();
  return out;
}

// src/Connector.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function connectorStroke(kind) {
  if (!kind) return "currentColor";
  return kind === "accent" ? "var(--uipack-accent)" : `var(--uipack-token-${kind})`;
}
function Connector({ points, defs, arrow = true, dashed, kind, flow, id, radius = 6, strokeWidth = 1.25, inset = 2 }) {
  const hover = useFigureHover();
  const [s, e] = Array.isArray(inset) ? inset : [inset, inset];
  const d = pathFromPoints(trim(points, s, arrow ? e + 2 : e), radius);
  const head = defs ? `url(#${defs}-head${kind ? `-${kind}` : ""})` : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "path",
    {
      id,
      "data-uipack": "connector",
      ...hoverAttrs(flow, kind, hover),
      d,
      fill: "none",
      stroke: connectorStroke(kind),
      strokeOpacity: kind ? 1 : 0.6,
      strokeWidth,
      strokeDasharray: dashed ? "5 4" : void 0,
      markerEnd: arrow ? head : void 0
    }
  );
}

// src/Defs.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function Defs({ id }) {
  const head = (suffix, fill) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "marker",
    {
      id: `${id}-head${suffix}`,
      markerWidth: "8",
      markerHeight: "8",
      refX: "7",
      refY: "4",
      orient: "auto-start-reverse",
      markerUnits: "userSpaceOnUse",
      children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M0,0 L8,4 L0,8 z", fill })
    }
  );
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("defs", { children: [
    head("", "currentColor"),
    head("-accent", "var(--uipack-accent)"),
    head("-request", "var(--uipack-token-request)"),
    head("-response", "var(--uipack-token-response)"),
    head("-change", "var(--uipack-token-change)")
  ] });
}

// src/CanvasView.tsx
var import_react3 = require("react");

// src/canvas-gestures.ts
var import_react2 = require("react");
var useBrowserLayoutEffect = typeof window === "undefined" ? import_react2.useEffect : import_react2.useLayoutEffect;
function useCanvasGestures(ref, open, zoom) {
  const latest = (0, import_react2.useRef)(zoom);
  latest.current = zoom;
  const pending = (0, import_react2.useRef)();
  const queued = (0, import_react2.useRef)(zoom.value);
  const frame = (0, import_react2.useRef)(0);
  useBrowserLayoutEffect(() => {
    queued.current = zoom.value;
    const anchor = pending.current;
    if (!anchor) return;
    const rect = anchor.surface.getBoundingClientRect();
    const ratio = zoom.value / anchor.scale;
    anchor.surface.scrollLeft = anchor.x * ratio + anchor.inset.x - (anchor.point.x - rect.left);
    anchor.surface.scrollTop = anchor.y * ratio + anchor.inset.y - (anchor.point.y - rect.top);
    pending.current = void 0;
  }, [zoom.value]);
  const change = (value, point, surface) => {
    const config = latest.current;
    const next = Math.max(config.min, Math.min(config.max, value));
    if (next === queued.current) return;
    const viewport = surface?.matches(".uipack__canvas") ? surface : void 0;
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      const focal = point ?? {
        x: rect.left + viewport.clientWidth / 2,
        y: rect.top + viewport.clientHeight / 2
      };
      const drawing = viewport.querySelector("svg").getBoundingClientRect();
      pending.current = {
        surface: viewport,
        x: focal.x - drawing.left,
        y: focal.y - drawing.top,
        point: focal,
        scale: config.value,
        inset: {
          x: drawing.left - rect.left + viewport.scrollLeft,
          y: drawing.top - rect.top + viewport.scrollTop
        }
      };
    }
    queued.current = next;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(
      () => config.onChange(queued.current)
    );
  };
  const changeRef = (0, import_react2.useRef)(change);
  changeRef.current = change;
  (0, import_react2.useEffect)(() => {
    const host = ref.current;
    if (!open || !host) return;
    let safariScale = null;
    let pinch = null;
    let suppressClickUntil = 0;
    const surfaceAt = (target) => {
      if (!(target instanceof Element) || target.closest("select, input, textarea"))
        return null;
      return target.closest(
        ".uipack__canvas, .uipack-slide-scene"
      );
    };
    const wheel = (event) => {
      const surface = surfaceAt(event.target);
      if (!event.ctrlKey || !surface) return;
      event.preventDefault();
      if (safariScale !== null || pinch) return;
      const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? host.clientHeight : 1;
      const delta = Math.max(-100, Math.min(100, event.deltaY * units));
      changeRef.current(
        queued.current * Math.exp(-delta * 8e-3),
        { x: event.clientX, y: event.clientY },
        surface
      );
    };
    const gestureStart = (raw) => {
      if (!surfaceAt(raw.target)) return;
      raw.preventDefault();
      if (!pinch) safariScale = queued.current;
    };
    const gestureChange = (raw) => {
      const surface = surfaceAt(raw.target);
      if (!surface) return;
      raw.preventDefault();
      if (safariScale === null || pinch) return;
      const event = raw;
      if (Number.isFinite(event.scale) && event.scale > 0)
        changeRef.current(
          safariScale * event.scale,
          { x: event.clientX, y: event.clientY },
          surface
        );
    };
    const gestureEnd = () => {
      safariScale = null;
    };
    const distance = (touches) => Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
    const touchStart = (event) => {
      const surface = surfaceAt(event.target);
      if (event.touches.length !== 2 || !surface) return;
      event.preventDefault();
      safariScale = null;
      suppressClickUntil = performance.now() + 400;
      pinch = {
        distance: Math.max(1, distance(event.touches)),
        scale: queued.current,
        surface
      };
    };
    const touchMove = (event) => {
      if (!pinch || event.touches.length !== 2) return;
      event.preventDefault();
      suppressClickUntil = performance.now() + 400;
      changeRef.current(
        pinch.scale * distance(event.touches) / pinch.distance,
        {
          x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
          y: (event.touches[0].clientY + event.touches[1].clientY) / 2
        },
        pinch.surface
      );
    };
    const touchEnd = () => {
      if (pinch) suppressClickUntil = performance.now() + 400;
      pinch = null;
    };
    const click = (event) => {
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    host.addEventListener("wheel", wheel, { passive: false });
    host.addEventListener("gesturestart", gestureStart, { passive: false });
    host.addEventListener("gesturechange", gestureChange, { passive: false });
    host.addEventListener("gestureend", gestureEnd);
    host.addEventListener("touchstart", touchStart, { passive: false });
    host.addEventListener("touchmove", touchMove, { passive: false });
    host.addEventListener("touchend", touchEnd);
    host.addEventListener("touchcancel", touchEnd);
    host.addEventListener("click", click, true);
    host.addEventListener("pointerup", click, true);
    return () => {
      cancelAnimationFrame(frame.current);
      pending.current = void 0;
      host.removeEventListener("wheel", wheel);
      host.removeEventListener("gesturestart", gestureStart);
      host.removeEventListener("gesturechange", gestureChange);
      host.removeEventListener("gestureend", gestureEnd);
      host.removeEventListener("touchstart", touchStart);
      host.removeEventListener("touchmove", touchMove);
      host.removeEventListener("touchend", touchEnd);
      host.removeEventListener("touchcancel", touchEnd);
      host.removeEventListener("click", click, true);
      host.removeEventListener("pointerup", click, true);
    };
  }, [open, ref]);
  return {
    step: (factor) => change(
      zoom.value * factor,
      void 0,
      ref.current?.querySelector(".uipack__canvas") ?? void 0
    ),
    reset: () => {
      cancelAnimationFrame(frame.current);
      pending.current = void 0;
      queued.current = 1;
      zoom.onChange(1);
      ref.current?.querySelectorAll(".uipack__canvas").forEach((el) => el.scrollTo(0, 0));
    }
  };
}

// src/CanvasView.tsx
var import_react_dom = require("react-dom");
var import_jsx_runtime3 = require("react/jsx-runtime");
function CanvasView({
  open,
  onClose,
  title,
  children,
  zoom,
  theme,
  restoreFocus
}) {
  const content = (0, import_react3.useRef)(null);
  const gestures = useCanvasGestures(content, open, zoom);
  const dialog = (0, import_react3.useRef)(null);
  const actions = (0, import_react3.useRef)(gestures);
  actions.current = gestures;
  (0, import_react3.useEffect)(() => {
    if (!open) return;
    const keyboard = (event) => {
      const target = event.target;
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || target.isContentEditable || target.closest("input, select, textarea"))
        return;
      if (!dialog.current?.contains(target) && target !== document.body) return;
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        actions.current.step(1.25);
      }
      if (event.key === "-") {
        event.preventDefault();
        actions.current.step(0.8);
      }
      if (event.key === "0") {
        event.preventDefault();
        actions.current.reset();
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => document.removeEventListener("keydown", keyboard);
  }, [open]);
  const close = (0, import_react3.useRef)(onClose);
  close.current = onClose;
  (0, import_react3.useEffect)(() => {
    if (!open) return;
    const opener = document.activeElement;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.showModal();
    return () => {
      document.body.style.overflow = previous;
      requestAnimationFrame(
        () => restoreFocus ? restoreFocus() : opener?.focus()
      );
    };
  }, [open]);
  if (!open || typeof document === "undefined") return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_jsx_runtime3.Fragment, { children });
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
      "dialog",
      {
        ref: dialog,
        className: "uipack-canvas-dialog",
        "data-theme": theme ?? document.documentElement.dataset.theme,
        "aria-label": title,
        onCancel: (e) => {
          e.preventDefault();
          close.current();
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "uipack-canvas-toolbar", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "button",
                {
                  type: "button",
                  "aria-label": "Zoom out",
                  title: "Zoom out (\u2212)",
                  disabled: zoom.value <= zoom.min,
                  onClick: () => gestures.step(0.8),
                  children: "\u2212"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
                "span",
                {
                  role: "meter",
                  "aria-label": "Zoom level",
                  "aria-valuemin": zoom.min * 100,
                  "aria-valuemax": zoom.max * 100,
                  "aria-valuenow": Math.round(zoom.value * 100),
                  "aria-valuetext": `${Math.round(zoom.value * 100)}%`,
                  children: [
                    Math.round(zoom.value * 100),
                    "%"
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "button",
                {
                  type: "button",
                  "aria-label": "Zoom in",
                  title: "Zoom in (+)",
                  disabled: zoom.value >= zoom.max,
                  onClick: () => gestures.step(1.25),
                  children: "+"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", title: "Reset view (0)", onClick: gestures.reset, children: "Fit" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", onClick: onClose, autoFocus: true, children: "Close canvas" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "uipack-canvas-hint", children: "Pinch to zoom \xB7 Two-finger scroll \xB7 + / \u2212 to zoom \xB7 0 to reset" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { ref: content, className: "uipack-canvas-content", children })
        ]
      }
    ),
    document.body
  );
}

// src/selection.tsx
var import_react4 = require("react");
var SelectionContext = (0, import_react4.createContext)({ enabled: false, selected: null, select: () => {
} });
function useItemSelection(label, detail, flow, enabled = true) {
  const id = (0, import_react4.useId)();
  const context = (0, import_react4.useContext)(SelectionContext);
  if (!context.enabled || !enabled) return {};
  const selected = context.selected?.id === id;
  const toggle = () => context.select(selected ? null : { id, label, detail, flow });
  return {
    role: "button",
    tabIndex: 0,
    "aria-label": label,
    "aria-pressed": selected,
    "data-selected": selected ? "true" : void 0,
    onClick: (event) => {
      event.stopPropagation();
      toggle();
    },
    onKeyDown: (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        toggle();
      }
    }
  };
}

// src/Figure.tsx
var import_react7 = require("react");

// src/context.tsx
var import_react5 = require("react");
var noop2 = () => {
};
var FigureMotionContext = (0, import_react5.createContext)({
  playing: true,
  reduced: false,
  cycle: 0,
  toggle: noop2,
  replay: noop2
});
function useFigureMotion() {
  return (0, import_react5.useContext)(FigureMotionContext);
}
var QUERY = "(prefers-reduced-motion: reduce)";
function usePrefersReducedMotion() {
  const [reduced, setReduced] = (0, import_react5.useState)(false);
  (0, import_react5.useEffect)(() => {
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
var import_jsx_runtime4 = require("react/jsx-runtime");
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
  if (s === "circle") return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx, cy, r, ...common });
  if (s === "diamond") {
    const d = r * 1.2;
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("path", { d: `M${cx},${cy - d} L${cx + d},${cy} L${cx},${cy + d} L${cx - d},${cy} Z`, ...common });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("rect", { x: cx - r, y: cy - r, width: r * 2, height: r * 2, rx: 1.5, ...common });
}

// src/Legend.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
function Legend({ items }) {
  const hover = useFigureHover();
  if (!items.length) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ul", { className: "uipack__legend", "aria-label": "Legend", children: items.map((it) => {
    const kind = it.kind ?? "neutral";
    const hoverable = kind !== "neutral";
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
      "li",
      {
        "data-kind": kind,
        "data-state": hover.kind ? hover.kind === kind ? "hit" : "dim" : void 0,
        onPointerEnter: hoverable ? (e) => isPointer(e) && hover.setKind(kind) : void 0,
        onPointerLeave: hoverable ? (e) => isPointer(e) && hover.setKind(null) : void 0,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { viewBox: "-8 -8 16 16", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Token, { kind, shape: it.shape, r: 5.5 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: it.label })
        ]
      },
      it.label
    );
  }) });
}

// src/scale.tsx
var import_react6 = require("react");
var import_jsx_runtime6 = require("react/jsx-runtime");
var FigureScaleContext = (0, import_react6.createContext)({ floor: 0 });
var DEFAULT_RENDER_WIDTH = 1088;
function fontFloor(vbWidth2, renderWidth, minFont) {
  if (!vbWidth2 || !renderWidth || !minFont) return 0;
  return minFont * vbWidth2 / renderWidth;
}
function useFontFloor(size) {
  const { floor } = (0, import_react6.useContext)(FigureScaleContext);
  return Math.max(size, floor);
}

// src/Figure.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
var vbWidth = (viewBox) => Number(viewBox.split(/\s+/)[2]) || 0;
function useRenderedWidth(ref, fixed, layoutKey) {
  const [w, setW] = (0, import_react7.useState)(fixed ?? DEFAULT_RENDER_WIDTH);
  (0, import_react7.useEffect)(() => {
    if (fixed != null) return;
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const read = () => {
      const width = el.getBoundingClientRect().width;
      if (width > 0) setW(width);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, fixed, layoutKey]);
  return fixed ?? w;
}
var PauseGlyph = () => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("svg", { viewBox: "0 0 12 12", "aria-hidden": "true", children: [
  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("rect", { x: "2", y: "1.5", width: "3", height: "9", rx: "0.5" }),
  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("rect", { x: "7", y: "1.5", width: "3", height: "9", rx: "0.5" })
] });
var PlayGlyph = () => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("svg", { viewBox: "0 0 12 12", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("path", { d: "M3 1.5 L10.5 6 L3 10.5 Z" }) });
var ReplayGlyph = () => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("svg", { viewBox: "0 0 12 12", "aria-hidden": "true", children: [
  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    "path",
    {
      d: "M6 1.5a4.5 4.5 0 1 1-4.2 2.9",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.6",
      strokeLinecap: "round"
    }
  ),
  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("path", { d: "M1.5 1.5v3h3z" })
] });
function Figure({
  expandable = true,
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
  background = "dots",
  minFont = 11,
  measuredWidth,
  id
}) {
  const opener = (0, import_react7.useRef)(null);
  const auto = (0, import_react7.useId)();
  const figId = id ?? `uipack-${auto.replace(/:/g, "")}`;
  const reduced = usePrefersReducedMotion();
  const [playing, setPlaying] = (0, import_react7.useState)(true);
  const [cycle, setCycle] = (0, import_react7.useState)(0);
  const [expanded, setExpanded] = (0, import_react7.useState)(false);
  const [zoom, setZoom] = (0, import_react7.useState)(1);
  const [selected, select] = (0, import_react7.useState)(null);
  const [hoverFlow, setHoverFlow] = (0, import_react7.useState)(null);
  const [hoverKind, setHoverKind] = (0, import_react7.useState)(null);
  const hover = (0, import_react7.useMemo)(
    () => ({
      flow: selected?.flow ?? hoverFlow,
      kind: hoverKind,
      setFlow: setHoverFlow,
      setKind: setHoverKind
    }),
    [hoverFlow, hoverKind, selected]
  );
  const wideRef = (0, import_react7.useRef)(null);
  const narrowRef = (0, import_react7.useRef)(null);
  const wideW = useRenderedWidth(wideRef, measuredWidth, expanded);
  const narrowW = useRenderedWidth(narrowRef, measuredWidth, expanded);
  const wideScale = (0, import_react7.useMemo)(
    () => ({ floor: fontFloor(vbWidth(viewBox), wideW, minFont) }),
    [viewBox, wideW, minFont]
  );
  const narrowScale = (0, import_react7.useMemo)(
    () => ({
      floor: fontFloor(vbWidth(narrowViewBox ?? viewBox), narrowW, minFont)
    }),
    [narrowViewBox, viewBox, narrowW, minFont]
  );
  const svgs = () => [wideRef.current, narrowRef.current].filter(Boolean);
  (0, import_react7.useEffect)(() => {
    for (const s of svgs()) {
      if (typeof s.pauseAnimations !== "function") continue;
      if (playing) s.unpauseAnimations();
      else s.pauseAnimations();
    }
  }, [playing, expanded]);
  const toggle = (0, import_react7.useCallback)(() => setPlaying((p) => !p), []);
  const replay = (0, import_react7.useCallback)(() => {
    for (const s of svgs()) {
      if (typeof s.setCurrentTime === "function") s.setCurrentTime(0);
      if (typeof s.unpauseAnimations === "function") s.unpauseAnimations();
    }
    setPlaying(true);
    setCycle((c) => c + 1);
  }, []);
  const motion = (0, import_react7.useMemo)(
    () => ({ playing: playing && !reduced, reduced, cycle, toggle, replay }),
    [playing, reduced, cycle, toggle, replay]
  );
  const showControls = controls && !reduced;
  const hasHead = expandable || selected || number || eyebrow || title || caption || legend.length || showControls;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    CanvasView,
    {
      restoreFocus: () => opener.current?.focus(),
      open: expanded,
      onClose: () => {
        setExpanded(false);
        setZoom(1);
        select(null);
      },
      title: title ?? eyebrow ?? "Figure canvas",
      theme,
      zoom: { value: zoom, min: 1, max: 3, onChange: setZoom },
      children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(SelectionContext.Provider, { value: { enabled: true, selected, select }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(FigureMotionContext.Provider, { value: motion, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(FigureHoverContext.Provider, { value: hover, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
        "figure",
        {
          id: figId,
          className: [
            "uipack",
            narrow ? "uipack--has-narrow" : "",
            expanded ? "uipack--expanded" : "",
            className ?? ""
          ].join(" ").trim(),
          "data-theme": theme,
          "data-hover-flow": hoverFlow ?? void 0,
          "data-hover-kind": hoverKind ?? void 0,
          onKeyDown: (e) => {
            if (e.key === "Escape") select(null);
          },
          style: {
            margin: 0,
            "--figure-width": `${vbWidth(viewBox)}px`
          },
          children: [
            hasHead ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "uipack__head", children: [
              number || eyebrow ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { className: "uipack__eyebrow", children: [
                number,
                number && eyebrow ? " \xB7 " : "",
                eyebrow
              ] }) : null,
              title ? (0, import_react7.createElement)(
                `h${headingLevel}`,
                { className: "uipack__title" },
                title
              ) : null,
              caption ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: "uipack__caption", children: caption }) : null,
              showControls || expandable ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "uipack__controls", children: [
                expandable && !expanded && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
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
                ),
                showControls && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
                    "button",
                    {
                      type: "button",
                      className: "uipack__ctl uipack__ctl--motion",
                      onClick: replay,
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ReplayGlyph, {}),
                        " Replay"
                      ]
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
                    "button",
                    {
                      type: "button",
                      className: "uipack__ctl uipack__ctl--motion",
                      onClick: toggle,
                      "aria-pressed": !playing,
                      children: [
                        playing ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(PauseGlyph, {}) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(PlayGlyph, {}),
                        " ",
                        playing ? "Pause" : "Play"
                      ]
                    }
                  )
                ] })
              ] }) : null,
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Legend, { items: legend })
            ] }) : null,
            selected && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "uipack__selection", role: "status", children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("strong", { children: selected.label }),
                selected.detail && ` \xB7 ${selected.detail}`
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", onClick: () => select(null), children: "Clear selection" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
              "div",
              {
                className: `uipack__canvas uipack__canvas--${background}`,
                onClick: () => select(null),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                    "svg",
                    {
                      ref: wideRef,
                      className: "uipack--wide",
                      style: expanded ? { width: `max(${zoom * 100}%, ${800 * zoom}px)` } : void 0,
                      viewBox,
                      role: "group",
                      "aria-label": alt,
                      children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(FigureScaleContext.Provider, { value: wideScale, children })
                    }
                  ),
                  narrow ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                    "svg",
                    {
                      ref: narrowRef,
                      className: "uipack--narrow",
                      viewBox: narrowViewBox ?? viewBox,
                      role: "group",
                      "aria-label": alt,
                      children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(FigureScaleContext.Provider, { value: narrowScale, children: narrow })
                    }
                  ) : null
                ]
              }
            )
          ]
        }
      ) }) }) })
    }
  );
}

// src/icons/index.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
var icons = {
  db: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("ellipse", { cx: "8", cy: "3.5", rx: "6", ry: "2.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M2 3.5v9c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-9" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M2 8c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" })
  ] }),
  cache: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_jsx_runtime8.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z" }) }),
  queue: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: "1.5", y: "4", width: "13", height: "8", rx: "1.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M5 4v8M9 4v8" })
  ] }),
  service: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: "2", y: "2", width: "12", height: "12", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M5 8h6M8 5v6" })
  ] }),
  client: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: "1.5", y: "3", width: "13", height: "8", rx: "1.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M5.5 14h5M8 11v3" })
  ] }),
  blob: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M8 1.5 14 5v6l-6 3.5L2 11V5z" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M8 8l6-3M8 8 2 5M8 8v6.5" })
  ] }),
  agent: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "8", cy: "5", r: "3" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M2.5 14.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M8 1v1" })
  ] }),
  doc: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M4 1.5h5.5L13 5v9.5H4z" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M9.5 1.5V5H13M6 8h4M6 11h4" })
  ] }),
  model: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: "2", y: "4", width: "12", height: "8", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "5.5", cy: "8", r: "1", fill: "currentColor" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "8", cy: "8", r: "1", fill: "currentColor" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "10.5", cy: "8", r: "1", fill: "currentColor" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M8 1.5V4M8 12v2.5" })
  ] }),
  tool: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_jsx_runtime8.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M10.5 2a3.5 3.5 0 0 0-3.3 4.7L2 11.9l2.1 2.1 5.2-5.2A3.5 3.5 0 0 0 14 5.5L11.8 7.7 9.3 6.2l-1-2.4z" }) }),
  gateway: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M2 8h12M2 8l3-3M2 8l3 3M14 8l-3-3M14 8l-3 3" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: "6", y: "5.5", width: "4", height: "5", rx: "1", fill: "var(--uipack-surface, #fff)" })
  ] }),
  lock: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: "3", y: "7", width: "10", height: "7.5", rx: "1.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M5.5 7V5a2.5 2.5 0 0 1 5 0v2" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "8", cy: "10.75", r: "1", fill: "currentColor" })
  ] }),
  key: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "5.5", cy: "8", r: "3" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M8.5 8H14M12 8v2.5M10 8v2" })
  ] }),
  clock: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "8", cy: "8", r: "6" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M8 4.5V8l2.5 1.5" })
  ] }),
  cron: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "8", cy: "8.5", r: "5" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M8 5.5v3l2 1M5 2l-2.5 2M11 2l2.5 2" })
  ] }),
  browser: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: "1.5", y: "2.5", width: "13", height: "11", rx: "1.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M1.5 6h13M4 4.25h.01M6 4.25h.01" })
  ] }),
  terminal: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: "1.5", y: "2.5", width: "13", height: "11", rx: "1.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M4.5 6l2.5 2-2.5 2M8.5 10.5h3" })
  ] }),
  git: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "4.5", cy: "3.5", r: "1.75" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "4.5", cy: "12.5", r: "1.75" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "11.5", cy: "5.5", r: "1.75" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M4.5 5.25v5.5M11.5 7.25c0 2.5-2 3-4 3.25a3 3 0 0 0-3 .5" })
  ] }),
  cloud: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_jsx_runtime8.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M4.5 13a3 3 0 0 1-.4-6A4 4 0 0 1 12 6.5a3.25 3.25 0 0 1 0 6.5z" }) }),
  region: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M8 14.5s4.5-4.2 4.5-8A4.5 4.5 0 0 0 3.5 6.5c0 3.8 4.5 8 4.5 8z" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "8", cy: "6.5", r: "1.5" })
  ] }),
  user: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "8", cy: "5.5", r: "3" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M2.5 14.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" })
  ] }),
  robot: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: "3", y: "5", width: "10", height: "8", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M8 2v3M6 13v1.5M10 13v1.5M1.5 8.5v2M14.5 8.5v2" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "6", cy: "8.5", r: "1", fill: "currentColor" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "10", cy: "8.5", r: "1", fill: "currentColor" })
  ] }),
  chart: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_jsx_runtime8.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M2 14h12M4 11V7M8 11V4M12 11V8.5" }) }),
  warning: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M8 2 14.5 13.5h-13z" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M8 6.5v3.5M8 12.25h.01" })
  ] }),
  more: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "3", cy: "8", r: "1", fill: "currentColor" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "8", cy: "8", r: "1", fill: "currentColor" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: "13", cy: "8", r: "1", fill: "currentColor" })
  ] })
};

// src/Node.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
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
  flow,
  hint,
  href,
  size: size0 = 14,
  subSize: subSize0 = 11,
  id
}) {
  const hover = useFigureHover();
  const size = useFontFloor(size0);
  const subSize = useFontFloor(subSize0);
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  const glyph = typeof icon === "string" ? icons[icon] : icon;
  const pad = 14;
  const tx = align === "center" ? x + w / 2 : x + pad + (glyph ? 26 : 0);
  const anchor = align === "center" ? "middle" : "start";
  const ty = sub ? y + h / 2 - 3 : y + h / 2 + size * 0.35;
  const flows = flowList(flow);
  const handlers = flows.length ? {
    onPointerEnter: (e) => isPointer(e) && hover.setFlow(flows[0]),
    onPointerLeave: (e) => isPointer(e) && hover.setFlow(null)
  } : {};
  const selection = useItemSelection(label, sub ?? hint, flows[0], !href);
  const body = /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
    "g",
    {
      id,
      "data-uipack": "node",
      ...hoverAttrs(flow, void 0, hover),
      ...handlers,
      ...selection,
      children: [
        hint ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("title", { children: hint }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("path", { className: "uipack__touch-target", d: `M ${x} ${y - Math.max(0, 54 - h) / 2} h ${w} v ${Math.max(h, 54)} h ${-w} Z`, fill: "transparent", stroke: "none", "aria-hidden": "true" }),
        glyph ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "g",
          {
            transform: `translate(${x + pad}, ${y + h / 2 - 8})`,
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 1.5,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            children: glyph
          }
        ) : null,
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "text",
          {
            x: tx,
            y: ty,
            textAnchor: anchor,
            fontSize: size,
            fontWeight: 600,
            fill: accent ? "var(--uipack-accent)" : "currentColor",
            children: label
          }
        ),
        sub ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "text",
          {
            x: tx,
            y: y + h / 2 + subSize + 2,
            textAnchor: anchor,
            fontSize: subSize,
            fontFamily: "var(--uipack-mono)",
            fill: "currentColor",
            fillOpacity: 0.75,
            children: sub
          }
        ) : null
      ]
    }
  );
  return href ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("a", { href, className: "uipack__link", "aria-label": label, children: body }) : body;
}

// src/Packet.tsx
var import_react8 = require("react");
var import_jsx_runtime10 = require("react/jsx-runtime");
function Packet({ points, kind = "request", shape, dur = 3, delay = 0, at, r = 5, reverse, radius = 6, flow, trim: t, id }) {
  const { reduced, prerender } = useFigureMotion();
  const hover = useFigureHover();
  const [ts, te] = t ?? [r + 2, 12];
  const trimmed = trim(points, ts, te);
  const pts = reverse ? [...trimmed].reverse() : trimmed;
  const staticAt = at ?? ((0.5 + delay / dur) % 1 + 1) % 1;
  const d = pathFromPoints(pts, radius);
  const [mounted, setMounted] = (0, import_react8.useState)(false);
  (0, import_react8.useEffect)(() => setMounted(true), []);
  const attrs = hoverAttrs(flow, kind === "neutral" ? void 0 : kind, hover);
  const pre = prerender || globalThis.__UIPACK_PRERENDER__ === true;
  if (reduced || !mounted && !pre) {
    const [cx, cy] = pointAlong(pts, staticAt);
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("g", { id, "data-uipack": "packet", "data-static": "true", ...attrs, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Token, { kind, shape, r, cx, cy }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("g", { id, "data-uipack": "packet", ...attrs, children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Token, { kind, shape, r }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("animateMotion", { dur: `${dur}s`, begin: `${delay}s`, repeatCount: "indefinite", path: d, calcMode: "linear" })
  ] });
}

// src/presets/shared.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");
var clean = (s) => s.replace(/:/g, "");
function PresetFigure({ spec, parts, id }) {
  const auto = (0, import_react9.useId)();
  const fid = id ?? `p${clean(auto)}`;
  return toFigure(spec.figure, parts(spec, fid), fid);
}
function presetFigure(spec, parts, id) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(PresetFigure, { spec, parts, id });
}
function toFigure(meta, parts, id) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
    Figure,
    {
      id,
      number: meta.number,
      eyebrow: meta.eyebrow,
      title: meta.title,
      caption: meta.caption,
      headingLevel: meta.headingLevel,
      legend: parts.legend,
      viewBox: parts.viewBox,
      narrow: parts.narrow,
      narrowViewBox: parts.narrowViewBox,
      alt: meta.alt,
      children: parts.wide
    }
  );
}
function fits(px, size, mono = false) {
  return Math.max(3, Math.floor(px / (size * (mono ? 0.62 : 0.55))));
}
function fit(text, px, size, mono = false) {
  const n = fits(px, size, mono);
  if (text.length <= n) return { text };
  return { text: text.slice(0, Math.max(1, n - 1)).trimEnd() + "\u2026", hint: text };
}
function rows(items, per = 3) {
  const out = [];
  for (let i = 0; i < items.length; i += per) out.push(items.slice(i, i + per));
  return out;
}
var NARROW_W = 360;
var SX = 16;
var SW = 328;
var SH = 48;
var GAP = 40;
var TIGHT = 8;
var STACK_TEXT_W = SW - 14 - 26 - 12;
function stackHeight(n, y0 = 24) {
  return y0 + n * SH + (n - 1) * GAP + 24;
}
function stackLayout(steps, y0 = 24) {
  const ys = [];
  let y = y0;
  steps.forEach((s, i) => {
    if (i > 0) y += SH + (s.link === false ? TIGHT : GAP);
    ys.push(y);
  });
  return { ys, height: (ys[ys.length - 1] ?? y0) + SH + 24 };
}
function stackHeightFor(steps, y0 = 24) {
  return stackLayout(steps, y0).height;
}
function Stack({ steps, id, y0 = 24 }) {
  const { ys } = stackLayout(steps, y0);
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Defs, { id }),
    steps.map((s, i) => {
      const y = ys[i];
      const into = [
        [SX + SW / 2, y - GAP],
        [SX + SW / 2, y]
      ];
      const kind = s.kind ?? "request";
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("g", { children: [
        i > 0 && s.link !== false ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Connector, { points: into, defs: id, kind: kind === "neutral" ? void 0 : kind, flow: s.flow }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Packet, { points: into, kind, dur: 1.4, delay: -i * 0.35, reverse: s.back, flow: s.flow, r: 4 })
        ] }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Node, { x: SX, y, w: SW, h: SH, label: s.label, sub: s.sub, icon: s.icon, hint: s.hint, size: 13, subSize: 10, flow: s.flow, accent: s.accent, dashed: s.dashed })
      ] }, i);
    })
  ] });
}

// src/Bus.tsx
var import_jsx_runtime12 = require("react/jsx-runtime");
function busStub(props, stub) {
  return props.axis === "h" ? [[stub.at, props.at], [stub.at, stub.to]] : [[props.at, stub.at], [stub.to, stub.at]];
}
function Bus({ axis = "v", at, from, to, stubs, kind, flow, defs, dots = true, id }) {
  const hover = useFigureHover();
  const trunk = axis === "h" ? [[from, at], [to, at]] : [[at, from], [at, to]];
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("g", { id, "data-uipack": "bus", ...hoverAttrs(flow, kind, hover), children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Connector, { points: trunk, arrow: false, kind, flow, inset: 0 }),
    stubs.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Connector, { points: busStub({ axis, at }, s), defs, arrow: !!s.arrow, kind, flow: s.flow ?? flow, inset: [0, 2] }, i)),
    dots ? stubs.map((s, i) => {
      const [cx, cy] = axis === "h" ? [s.at, at] : [at, s.at];
      return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("circle", { "data-uipack": "junction", cx, cy, r: 2.5, fill: connectorStroke(kind), fillOpacity: kind ? 1 : 0.7 }, i);
    }) : null
  ] });
}

// src/Group.tsx
var import_jsx_runtime13 = require("react/jsx-runtime");
function Group({
  x,
  y,
  w,
  h,
  title,
  variant = "solid",
  accent,
  flow,
  titleSize,
  children
}) {
  const hover = useFigureHover();
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  const dashed = variant === "dashed";
  const ts = useFontFloor(titleSize ?? (dashed ? 11 : 14));
  const selection = useItemSelection(
    title ?? "Group",
    void 0,
    void 0,
    true
  );
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
    "g",
    {
      "data-uipack": "group",
      ...hoverAttrs(flow, void 0, hover),
      ...selection,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
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
        title ? dashed ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
          "text",
          {
            x: x + 16,
            y: y + 22,
            fontSize: ts,
            fontFamily: "var(--uipack-mono)",
            letterSpacing: ".08em",
            fill: stroke,
            fillOpacity: accent ? 1 : 0.75,
            children: title.toUpperCase()
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
          "text",
          {
            x: x + w / 2,
            y: y + 24,
            textAnchor: "middle",
            fontSize: ts,
            fontWeight: 600,
            fill: stroke,
            children: title
          }
        ) : null,
        children
      ]
    }
  );
}

// src/Lane.tsx
var import_jsx_runtime14 = require("react/jsx-runtime");
function Lane({ x, w, y, title, h, size: size0 = 11 }) {
  const size = useFontFloor(size0);
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("g", { "data-uipack": "lane", children: [
    /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("text", { x: x + w / 2, y, textAnchor: "middle", fontSize: size, fontWeight: 700, fontFamily: "var(--uipack-mono)", letterSpacing: ".08em", fill: "currentColor", children: title.toUpperCase() }),
    h ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("line", { x1: x + w, y1: y + 12, x2: x + w, y2: y + h, stroke: "currentColor", strokeOpacity: 0.15, strokeDasharray: "2 6" }) : null
  ] });
}

// src/presets/serviceMap.tsx
var import_jsx_runtime15 = require("react/jsx-runtime");
var defaultServiceMap = {
  figure: {
    number: "Figure 01",
    eyebrow: "Service map",
    title: "One gateway in front of every store",
    caption: "Clients call one platform; the platform owns auth, routing and caching, and is the only thing that talks to storage. Changes stream out to the warehouse.",
    alt: "Four clients on the left call a gateway platform in the middle, which reads and writes three stores on the right; a change stream under the platform feeds a warehouse and search."
  },
  clients: [
    { label: "Web app", icon: "client" },
    { label: "Mobile", icon: "client" },
    { label: "CLI", icon: "service" },
    { label: "Partners", icon: "more" }
  ],
  platform: {
    title: "Gateway",
    cells: [
      { label: "Auth", sub: "Sessions \xB7 keys" },
      { label: "Rate limit", sub: "Per tenant" },
      { label: "Routing", sub: "Schema lookup" },
      { label: "Caching", sub: "Read-through" },
      { label: "Encryption", sub: "At rest \xB7 in flight" },
      { label: "Audit", sub: "Every write" }
    ]
  },
  resources: [
    { label: "Postgres", sub: "Primary", icon: "db" },
    { label: "Redis", sub: "Cache", icon: "cache" },
    { label: "Object store", sub: "Blobs", icon: "blob" }
  ],
  sinks: {
    via: { label: "Change stream", sub: "CDC", icon: "queue" },
    items: [
      { label: "Warehouse", icon: "db" },
      { label: "Search", icon: "service" }
    ]
  }
};
var READ = "read";
var CDC = "cdc";
function serviceMapParts(spec = defaultServiceMap, id) {
  const [lc, lp, lr] = spec.laneTitles ?? ["Clients", "Platform", "Resources"];
  const client = { x: 24, w: 176, h: 48, step: 56, y0: 96 };
  const store = { x: 1024, w: 200, h: 48, step: 64, y0: 96 };
  const rows2 = Math.ceil(spec.platform.cells.length / 3);
  const platform = { x: 328, y: 64, w: 600, h: 44 + rows2 * 72 + (spec.platform.footer ? 72 : 0) };
  const busX = 232;
  const storeBusX = 1e3;
  const clientY = (i) => client.y0 + i * client.step + client.h / 2;
  const storeY = (i) => store.y0 + i * store.step + store.h / 2;
  const trunkY = 200;
  const lanesBottom = Math.max(platform.y + platform.h, client.y0 + spec.clients.length * client.step, store.y0 + spec.resources.length * store.step);
  const clientBus = {
    axis: "v",
    at: busX,
    stubs: [...spec.clients.map((_, i) => ({ at: clientY(i), to: client.x + client.w, flow: READ })), { at: trunkY, to: platform.x, arrow: true, flow: READ }]
  };
  const storeBus = {
    axis: "v",
    at: storeBusX,
    stubs: [...spec.resources.map((_, i) => ({ at: storeY(i), to: store.x, arrow: true, flow: READ })), { at: trunkY, to: platform.x + platform.w, flow: READ }]
  };
  const toPlatform = busStub(clientBus, clientBus.stubs[spec.clients.length]);
  const fromPlatform = busStub(storeBus, storeBus.stubs[spec.resources.length]);
  let height = lanesBottom + 24;
  let sinks = null;
  if (spec.sinks) {
    const via = { x: platform.x + platform.w / 2 - 100, y: platform.y + platform.h + 48, w: 200, h: 56 };
    const n = spec.sinks.items.length;
    const sw = 128;
    const gap = 24;
    const rowW = n * sw + (n - 1) * gap;
    const x0 = platform.x + platform.w / 2 - rowW / 2;
    const sinkY = via.y + via.h + 40;
    const viaPath = [
      [platform.x + platform.w / 2, platform.y + platform.h],
      [via.x + via.w / 2, via.y]
    ];
    const elbow = via.y + via.h + 24;
    sinks = /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Connector, { points: viaPath, defs: id, kind: "change", flow: CDC }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Packet, { points: viaPath, kind: "change", dur: 2, flow: CDC }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Node, { ...via, label: spec.sinks.via.label, sub: spec.sinks.via.sub, icon: spec.sinks.via.icon ?? "queue", flow: CDC }),
      spec.sinks.items.map((s, i) => {
        const p = route([via.x + via.w / 2, via.y + via.h], [x0 + i * (sw + gap) + sw / 2, sinkY], elbow, "v");
        return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("g", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Connector, { points: p, defs: id, kind: "change", flow: CDC }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Packet, { points: p, kind: "change", dur: 2.2, delay: -i * 0.55, flow: CDC }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Node, { x: x0 + i * (sw + gap), y: sinkY, w: sw, h: 40, label: s.label, icon: s.icon, flow: CDC, size: 13 })
        ] }, s.label);
      })
    ] });
    height = sinkY + 40 + 24;
  }
  const wide = /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(import_jsx_runtime15.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Defs, { id }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Lane, { x: client.x, w: client.w, y: 40, title: lc }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Lane, { x: platform.x, w: platform.w, y: 40, title: lp }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Lane, { x: store.x, w: store.w, y: 40, title: lr }),
    spec.clients.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Node, { x: client.x, y: client.y0 + i * client.step, w: client.w, h: client.h, label: c.label, sub: c.sub, icon: c.icon, flow: READ }, c.label)),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(Group, { ...platform, title: spec.platform.title, flow: spec.sinks ? [READ, CDC] : READ, children: [
      spec.platform.cells.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Node, { x: platform.x + 24 + i % 3 * 192, y: platform.y + 44 + Math.floor(i / 3) * 72, w: 168, h: 56, label: c.label, sub: c.sub, align: "left", flow: READ }, c.label)),
      spec.platform.footer ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Node, { x: platform.x + 24, y: platform.y + 44 + rows2 * 72, w: 552, h: 56, label: spec.platform.footer.label, sub: spec.platform.footer.sub, align: "left", flow: READ }) : null
    ] }),
    spec.resources.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Node, { x: store.x, y: store.y0 + i * store.step, w: store.w, h: store.h, label: r.label, sub: r.sub, icon: r.icon, flow: READ }, r.label)),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Bus, { ...clientBus, from: Math.min(clientY(0), trunkY), to: Math.max(clientY(spec.clients.length - 1), trunkY), defs: id }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Bus, { ...storeBus, from: Math.min(storeY(0), trunkY), to: Math.max(storeY(spec.resources.length - 1), trunkY), defs: id }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Packet, { points: toPlatform, kind: "request", dur: 2.4, flow: READ }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Packet, { points: toPlatform, kind: "response", dur: 2.4, delay: -1.2, reverse: true, flow: READ }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Packet, { points: fromPlatform, kind: "request", dur: 2.4, delay: -0.3, reverse: true, flow: READ }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Packet, { points: fromPlatform, kind: "response", dur: 2.4, delay: -1.5, flow: READ }),
    spec.clients.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Packet, { points: busStub(clientBus, clientBus.stubs[i]), kind: i % 2 ? "response" : "request", dur: 1.6, delay: -i * 0.4, reverse: i % 2 === 0, r: 4, flow: READ }, i)),
    spec.resources.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Packet, { points: busStub(storeBus, storeBus.stubs[i]), kind: i % 2 ? "response" : "request", dur: 1.6, delay: -i * 0.5, reverse: i % 2 === 1, r: 4, flow: READ }, i)),
    sinks
  ] });
  const row = (items, sub, icon, flow, kind) => rows(items, 3).map((r, i) => {
    const l = fit(r.map((c) => c.label).join(" \xB7 "), STACK_TEXT_W, 13);
    return { label: l.text, hint: l.hint, sub: i === 0 ? sub : void 0, icon: i === 0 ? icon : void 0, flow, kind, link: i === 0 ? void 0 : false };
  });
  const platformTitle = fit(spec.platform.title, STACK_TEXT_W, 13);
  const steps = [
    ...row(spec.clients, lc, "client", READ),
    { label: platformTitle.text, hint: platformTitle.hint, icon: "service", flow: READ },
    ...row(spec.platform.cells, "", void 0, READ).map((s) => ({ ...s, link: false, icon: void 0, sub: void 0 })),
    ...row(spec.resources, lr, "db", READ),
    ...spec.sinks ? [{ label: fit(spec.sinks.via.label, STACK_TEXT_W, 13).text, icon: "queue", kind: "change", flow: CDC }, ...row(spec.sinks.items, "", void 0, CDC, "change").map((s) => ({ ...s, link: false, icon: void 0, sub: void 0 }))] : []
  ];
  return {
    wide,
    narrow: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Stack, { steps, id: `${id}-n` }),
    viewBox: `0 0 1248 ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeightFor(steps)}`,
    legend: [
      { label: "Request", kind: "request" },
      { label: "Response", kind: "response" },
      ...spec.sinks ? [{ label: "Change", kind: "change" }] : []
    ]
  };
}
var serviceMap = (spec = defaultServiceMap, id) => presetFigure(spec, serviceMapParts, id);

// src/Label.tsx
var import_jsx_runtime16 = require("react/jsx-runtime");
function Label({ x, y, text, anchor = "start", accent, size: size0 = 11, font = "mono" }) {
  const size = useFontFloor(size0);
  const w = text.length * size * (font === "mono" ? 0.62 : 0.55) + 8;
  const rx = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w + 4 : x - 4;
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("g", { "data-uipack": "label", children: [
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("rect", { x: rx, y: y - size + 1, width: w, height: size + 5, fill: "var(--uipack-bg)" }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
      "text",
      {
        x,
        y,
        textAnchor: anchor,
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

// src/presets/agentLoop.tsx
var import_jsx_runtime17 = require("react/jsx-runtime");
var defaultAgentLoop = {
  figure: {
    number: "Figure 01",
    eyebrow: "Agent loop",
    title: "Tools answer, the boundary decides",
    caption: "The agent plans, calls tools, and drafts. Nothing reaches the user until a deterministic check passes the draft against what the tools recorded.",
    alt: "A user sends a request to an agent, the agent calls three tools and gets results back, then its draft passes through a deterministic boundary before becoming the output."
  },
  user: { label: "User", icon: "user" },
  agent: { label: "Agent", sub: "plan \xB7 call \xB7 draft", icon: "agent" },
  tools: [
    { label: "Search", sub: "tool", icon: "browser" },
    { label: "Database", sub: "tool", icon: "db" },
    { label: "Calculator", sub: "tool", icon: "tool" }
  ],
  boundary: { label: "Deterministic boundary", sub: "facts recorded \u2192 fields checked", icon: "lock" },
  output: { label: "Output", sub: "only what the facts support", icon: "doc" }
};
var ASK = "ask";
var TOOLS = "tools";
var CHECK = "check";
function agentLoopParts(spec = defaultAgentLoop, id) {
  const [lu, la, lt] = spec.laneTitles ?? ["User", "Agent", "Tools"];
  const user = { x: 24, y: 96, w: 176, h: 48 };
  const n = spec.tools.length;
  const tool = { x: 800, w: 176, h: 48, step: 56, y0: 96 };
  const toolY = (i) => tool.y0 + i * tool.step + tool.h / 2;
  const agentBox = { x: 328, y: 64, w: 336, h: Math.max(176, tool.y0 - 64 + n * tool.step - 8 + 16) };
  const busX = 744;
  const trunkY = 152;
  const bus = {
    axis: "v",
    at: busX,
    stubs: [...spec.tools.map((_, i) => ({ at: toolY(i), to: tool.x, arrow: true, flow: TOOLS })), { at: trunkY, to: agentBox.x + agentBox.w, flow: TOOLS }]
  };
  const fromAgent = busStub(bus, bus.stubs[n]);
  const ask = [
    [user.x + user.w, 120],
    [agentBox.x, 120]
  ];
  const boundary = { x: 328, y: agentBox.y + agentBox.h + 32, w: 336, h: 56 };
  const output = { x: 328, y: boundary.y + boundary.h + 48, w: 336, h: 48 };
  const cx = agentBox.x + agentBox.w / 2;
  const toBoundary = [
    [cx, agentBox.y + agentBox.h],
    [cx, boundary.y]
  ];
  const toOutput = [
    [cx, boundary.y + boundary.h],
    [cx, output.y]
  ];
  const height = output.y + output.h + 24;
  const wide = /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Defs, { id }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Lane, { x: user.x, w: user.w, y: 40, title: lu }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Lane, { x: agentBox.x, w: agentBox.w, y: 40, title: la }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Lane, { x: tool.x, w: tool.w, y: 40, title: lt }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Node, { ...user, label: spec.user.label, sub: spec.user.sub, icon: spec.user.icon ?? "user", flow: ASK, hint: "Sends the request, reads the output" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(Group, { ...agentBox, title: spec.agent.label, flow: [ASK, TOOLS, CHECK], children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Node, { x: agentBox.x + 24, y: agentBox.y + 40, w: agentBox.w - 48, h: 56, label: spec.agent.sub ?? "plan \xB7 call \xB7 draft", sub: "model", icon: spec.agent.icon ?? "agent", flow: [ASK, TOOLS] }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Node, { x: agentBox.x + 24, y: agentBox.y + 112, w: agentBox.w - 48, h: 40, label: "Draft", sub: "structured output", icon: "doc", flow: CHECK, size: 13, subSize: 10 })
    ] }),
    spec.tools.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Node, { x: tool.x, y: tool.y0 + i * tool.step, w: tool.w, h: tool.h, label: t.label, sub: t.sub, icon: t.icon ?? "tool", flow: TOOLS }, t.label)),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Connector, { points: ask, defs: id, kind: "request", flow: ASK }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Packet, { points: ask, kind: "request", dur: 2, flow: ASK }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Packet, { points: ask, kind: "response", dur: 2, delay: -1, reverse: true, flow: ASK }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Bus, { ...bus, from: Math.min(toolY(0), trunkY), to: Math.max(toolY(n - 1), trunkY), defs: id, kind: "change" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Packet, { points: fromAgent, kind: "change", dur: 1.8, flow: TOOLS }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Packet, { points: fromAgent, kind: "response", dur: 1.8, delay: -0.9, reverse: true, flow: TOOLS }),
    spec.tools.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Packet, { points: busStub(bus, bus.stubs[i]), kind: i % 2 ? "response" : "change", dur: 1.4, delay: -i * 0.45, reverse: i % 2 === 1, r: 4, flow: TOOLS }, i)),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Label, { x: (agentBox.x + agentBox.w + busX) / 2, y: trunkY - 10, text: "tool calls", anchor: "middle" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Connector, { points: toBoundary, defs: id, kind: "request", flow: CHECK }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Packet, { points: toBoundary, kind: "request", dur: 1.6, flow: CHECK }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Node, { ...boundary, label: spec.boundary.label, sub: spec.boundary.sub, icon: spec.boundary.icon ?? "lock", accent: true, dashed: true, flow: CHECK, hint: "Code, not a model, decides what passes" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Connector, { points: toOutput, defs: id, kind: "accent", flow: CHECK }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Packet, { points: toOutput, kind: "accent", dur: 1.6, delay: -0.8, flow: CHECK }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Label, { x: cx + 12, y: toOutput[0][1] + 28, text: "verdict", accent: true }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Node, { ...output, label: spec.output.label, sub: spec.output.sub, icon: spec.output.icon ?? "doc", flow: CHECK })
  ] });
  const steps = [
    { ...spec.user, icon: spec.user.icon ?? "user", flow: ASK },
    { ...spec.agent, icon: spec.agent.icon ?? "agent", flow: ASK },
    { label: spec.tools.map((t) => t.label).join(" \xB7 "), sub: lt.toLowerCase(), icon: "tool", kind: "change", flow: TOOLS },
    { label: "Tool results", sub: "back to the agent", icon: "doc", kind: "response", flow: TOOLS },
    { ...spec.boundary, icon: spec.boundary.icon ?? "lock", accent: true, dashed: true, flow: CHECK },
    { ...spec.output, icon: spec.output.icon ?? "doc", kind: "accent", flow: CHECK }
  ];
  return {
    wide,
    narrow: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(Stack, { steps, id: `${id}-n` }),
    viewBox: `0 0 1120 ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Request", kind: "request" },
      { label: "Tool call", kind: "change" },
      { label: "Tool result", kind: "response" },
      { label: "Verdict", kind: "accent" }
    ]
  };
}
var agentLoop = (spec = defaultAgentLoop, id) => presetFigure(spec, agentLoopParts, id);

// src/presets/ragPipeline.tsx
var import_jsx_runtime18 = require("react/jsx-runtime");
var defaultRagPipeline = {
  figure: {
    number: "Figure 01",
    eyebrow: "RAG pipeline",
    title: "Two lanes, one index",
    caption: "Ingest chunks and embeds documents into the index on its own schedule. A query retrieves from the same index, reranks, and generates. The lanes never block each other.",
    alt: "Three document sources feed an ingest lane of chunk, embed and upsert stages into a vector index; below, a user query passes through retrieve, rerank and generate stages, with retrieve reading the index, and ends in an answer."
  },
  sources: [
    { label: "Docs", icon: "doc" },
    { label: "Tickets", icon: "queue" },
    { label: "Wiki", icon: "browser" }
  ],
  ingest: [
    { label: "Chunk", sub: "800 tokens \xB7 overlap" },
    { label: "Embed", sub: "batch \xB7 model", icon: "model" },
    { label: "Upsert", sub: "id \xB7 hash \xB7 version" }
  ],
  index: { label: "Vector index", sub: "HNSW \xB7 metadata", icon: "db" },
  query: { label: "Query", icon: "user" },
  stages: [
    { label: "Retrieve", sub: "top-k \xB7 filters" },
    { label: "Rerank", sub: "cross-encoder", icon: "model" },
    { label: "Generate", sub: "cited answer", icon: "agent" }
  ],
  answer: { label: "Answer", sub: "with citations", icon: "doc" }
};
var INGEST = "ingest";
var QUERY2 = "query";
function ragPipelineParts(spec = defaultRagPipeline, id) {
  const src = { x: 24, w: 160, h: 48, step: 56, y0: 80 };
  const srcY = (i) => src.y0 + i * src.step + src.h / 2;
  const stage = { w: 136, h: 48, step: 176, x0: 248 };
  const ingestY = 80;
  const iy = ingestY + stage.h / 2;
  const index = { x: 944, y: 136, w: 152, h: 64 };
  const queryY = 272;
  const qy = queryY + stage.h / 2;
  const answer = { x: 944, y: queryY, w: 152, h: 48 };
  const busX = 216;
  const bus = {
    axis: "v",
    at: busX,
    stubs: [...spec.sources.map((_, i) => ({ at: srcY(i), to: src.x + src.w, flow: INGEST })), { at: iy, to: stage.x0, arrow: true, flow: INGEST }]
  };
  const sx = (i) => stage.x0 + i * stage.step;
  const ingestLast = sx(spec.ingest.length - 1) + stage.w;
  const toIndex = [
    [ingestLast, iy],
    [index.x + index.w / 2, iy],
    [index.x + index.w / 2, index.y]
  ];
  const retrieveX = sx(0) + stage.w / 2;
  const read = [
    [retrieveX, queryY],
    [retrieveX, index.y + index.h / 2 + 16],
    [index.x, index.y + index.h / 2 + 16]
  ];
  const queryIn = [
    [src.x + src.w, qy],
    [sx(0), qy]
  ];
  const toAnswer = [
    [sx(spec.stages.length - 1) + stage.w, qy],
    [answer.x, qy]
  ];
  const height = queryY + stage.h + 32;
  const chain = (items, y, kind, flow) => items.slice(1).map((_, i) => {
    const p = [
      [sx(i) + stage.w, y],
      [sx(i + 1), y]
    ];
    return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("g", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Connector, { points: p, defs: id, kind, flow }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Packet, { points: p, kind, dur: 1.2, delay: -i * 0.4, r: 4, flow })
    ] }, i);
  });
  const wide = /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Defs, { id }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Lane, { x: src.x, w: src.w, y: 40, title: "Sources" }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Lane, { x: stage.x0, w: ingestLast - stage.x0, y: 40, title: "Ingest" }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Lane, { x: index.x, w: index.w, y: 40, title: "Index" }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Lane, { x: stage.x0, w: sx(spec.stages.length - 1) + stage.w - stage.x0, y: 248, title: "Query" }),
    spec.sources.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Node, { x: src.x, y: src.y0 + i * src.step, w: src.w, h: src.h, label: s.label, icon: s.icon ?? "doc", flow: INGEST, size: 13 }, s.label)),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Bus, { ...bus, from: Math.min(srcY(0), iy), to: Math.max(srcY(spec.sources.length - 1), iy), defs: id, kind: "change" }),
    spec.sources.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Packet, { points: busStub(bus, bus.stubs[i]), kind: "change", dur: 1.4, delay: -i * 0.5, reverse: true, r: 4, flow: INGEST }, i)),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Packet, { points: busStub(bus, bus.stubs[spec.sources.length]), kind: "change", dur: 1.2, flow: INGEST, r: 4 }),
    spec.ingest.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Node, { x: sx(i), y: ingestY, w: stage.w, h: stage.h, label: s.label, sub: s.sub, icon: s.icon, flow: INGEST, size: 13, subSize: 10 }, s.label)),
    chain(spec.ingest, iy, "change", INGEST),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Connector, { points: toIndex, defs: id, kind: "change", flow: INGEST }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Packet, { points: toIndex, kind: "change", dur: 2, flow: INGEST }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Node, { ...index, label: spec.index.label, sub: spec.index.sub, icon: spec.index.icon ?? "db", flow: [INGEST, QUERY2], hint: "Shared by both lanes" }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Node, { x: src.x, y: queryY, w: src.w, h: stage.h, label: spec.query.label, icon: spec.query.icon ?? "user", flow: QUERY2, size: 13 }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Connector, { points: queryIn, defs: id, kind: "request", flow: QUERY2 }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Packet, { points: queryIn, kind: "request", dur: 1.2, flow: QUERY2, r: 4 }),
    spec.stages.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Node, { x: sx(i), y: queryY, w: stage.w, h: stage.h, label: s.label, sub: s.sub, icon: s.icon, flow: QUERY2, size: 13, subSize: 10 }, s.label)),
    chain(spec.stages, qy, "request", QUERY2),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Connector, { points: read, defs: id, kind: "request", flow: QUERY2 }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Packet, { points: read, kind: "request", dur: 1.8, flow: QUERY2, r: 4 }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Packet, { points: read, kind: "response", dur: 1.8, delay: -0.9, reverse: true, flow: QUERY2, r: 4 }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Label, { x: (retrieveX + index.x) / 2, y: index.y + index.h / 2 + 6, text: "top-k", anchor: "middle" }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Connector, { points: toAnswer, defs: id, kind: "response", flow: QUERY2 }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Packet, { points: toAnswer, kind: "response", dur: 1.4, flow: QUERY2, r: 4 }),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Node, { ...answer, label: spec.answer.label, sub: spec.answer.sub, icon: spec.answer.icon ?? "doc", flow: QUERY2, size: 13, subSize: 10 })
  ] });
  const steps = [
    { label: spec.sources.map((s) => s.label).join(" \xB7 "), sub: "sources", icon: "doc", flow: INGEST },
    ...spec.ingest.map((s) => ({ ...s, kind: "change", flow: INGEST })),
    { ...spec.index, icon: spec.index.icon ?? "db", kind: "change", flow: [INGEST, QUERY2].join(" ") },
    { ...spec.query, icon: spec.query.icon ?? "user", kind: "request", flow: QUERY2 },
    ...spec.stages.map((s) => ({ ...s, kind: "request", flow: QUERY2 })),
    { ...spec.answer, icon: spec.answer.icon ?? "doc", kind: "response", flow: QUERY2 }
  ];
  return {
    wide,
    narrow: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(Stack, { steps, id: `${id}-n` }),
    viewBox: `0 0 1120 ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Write", kind: "change" },
      { label: "Query", kind: "request" },
      { label: "Result", kind: "response" }
    ]
  };
}
var ragPipeline = (spec = defaultRagPipeline, id) => presetFigure(spec, ragPipelineParts, id);

// src/Chip.tsx
var import_jsx_runtime19 = require("react/jsx-runtime");
function Chip({
  x,
  y,
  w,
  h = 24,
  label,
  dashed,
  kind,
  flow,
  size: size0 = 10
}) {
  const hover = useFigureHover();
  const size = useFontFloor(size0);
  const fill = !kind ? "var(--uipack-surface)" : kind === "accent" ? "var(--uipack-accent)" : `var(--uipack-token-${kind})`;
  const selection = useItemSelection(
    label ?? "Empty slot",
    void 0,
    void 0,
    true
  );
  return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
    "g",
    {
      "data-uipack": "chip",
      ...hoverAttrs(flow, kind === "accent" ? void 0 : kind, hover),
      ...selection,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
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
        label ? /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
          "text",
          {
            x: x + w / 2,
            y: y + h / 2 + size * 0.36,
            textAnchor: "middle",
            fontSize: size,
            fontWeight: 700,
            fontFamily: "var(--uipack-mono)",
            fill: "currentColor",
            children: label.toUpperCase()
          }
        ) : null
      ]
    }
  );
}

// src/presets/skillLifecycle.tsx
var import_jsx_runtime20 = require("react/jsx-runtime");
var defaultSkillLifecycle = {
  figure: {
    number: "Figure 01",
    eyebrow: "Skill lifecycle",
    title: "A skill earns its place, then flows back",
    caption: "A candidate skill is scored against a no-skill baseline before it gets a version. Versions install into every consumer; what breaks in use comes back as feedback to the author.",
    alt: "An author writes a skill, an evaluator scores it against a baseline, a version is cut and installed into three consumer repos, and feedback loops from the consumers back to the author."
  },
  author: { label: "Author", sub: "SKILL.md \xB7 examples", icon: "user" },
  evaluate: { label: "Evaluate", sub: "frozen cases \xB7 scored", icon: "chart", baseline: "no-skill run" },
  version: { label: "Version", sub: "immutable revision", icon: "git" },
  consumers: [
    { label: "Store", sub: "subtree", icon: "git" },
    { label: "Site", sub: "plugin", icon: "browser" },
    { label: "Agent box", sub: "plugin", icon: "robot" }
  ],
  feedback: { label: "Feedback", sub: "what broke in use", icon: "warning" }
};
var FWD = "forward";
var BACK = "feedback";
function skillLifecycleParts(spec = defaultSkillLifecycle, id) {
  const y = 96;
  const author = { x: 24, y, w: 176, h: 48 };
  const evaluate = { x: 264, y: y - 4, w: 192, h: 56 };
  const version = { x: 520, y, w: 176, h: 48 };
  const con = { x: 808, w: 176, h: 48, step: 56, y0: 96 };
  const n = spec.consumers.length;
  const conY = (i) => con.y0 + i * con.step + con.h / 2;
  const busX = 760;
  const cy = y + 24;
  const bus = {
    axis: "v",
    at: busX,
    stubs: [...spec.consumers.map((_, i) => ({ at: conY(i), to: con.x, arrow: true, flow: FWD })), { at: cy, to: version.x + version.w, flow: FWD }]
  };
  const a2e = [
    [author.x + author.w, cy],
    [evaluate.x, cy]
  ];
  const e2v = [
    [evaluate.x + evaluate.w, cy],
    [version.x, cy]
  ];
  const trunkEnd = Math.max(conY(n - 1), cy);
  const loopY = trunkEnd + 64;
  const back = [
    [busX, trunkEnd],
    [busX, loopY],
    [author.x + author.w / 2, loopY],
    [author.x + author.w / 2, author.y + author.h]
  ];
  const height = loopY + 40;
  const wide = /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(import_jsx_runtime20.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Defs, { id }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Lane, { x: author.x, w: author.w, y: 40, title: "Author" }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Lane, { x: evaluate.x, w: evaluate.w, y: 40, title: "Evaluate" }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Lane, { x: version.x, w: version.w, y: 40, title: "Version" }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Lane, { x: con.x, w: con.w, y: 40, title: "Consumers" }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Node, { ...author, label: spec.author.label, sub: spec.author.sub, icon: spec.author.icon ?? "user", flow: [FWD, BACK] }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Connector, { points: a2e, defs: id, kind: "request", flow: FWD }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Packet, { points: a2e, kind: "request", dur: 1.4, flow: FWD, r: 4 }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Node, { ...evaluate, label: spec.evaluate.label, sub: spec.evaluate.sub, icon: spec.evaluate.icon ?? "chart", flow: FWD, hint: `Scored against: ${spec.evaluate.baseline}` }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Chip, { x: evaluate.x, y: evaluate.y + evaluate.h + 12, w: evaluate.w, h: 20, label: `baseline \xB7 ${spec.evaluate.baseline}`, dashed: true }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Connector, { points: e2v, defs: id, kind: "accent", flow: FWD }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Packet, { points: e2v, kind: "accent", dur: 1.4, delay: -0.7, flow: FWD, r: 4 }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Label, { x: (e2v[0][0] + e2v[1][0]) / 2, y: cy - 10, text: "passes", anchor: "middle", accent: true }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Node, { ...version, label: spec.version.label, sub: spec.version.sub, icon: spec.version.icon ?? "git", flow: FWD }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Bus, { ...bus, from: Math.min(conY(0), cy), to: trunkEnd, defs: id }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Packet, { points: busStub(bus, bus.stubs[n]), kind: "request", dur: 1.2, flow: FWD, r: 4 }),
    spec.consumers.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("g", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Packet, { points: busStub(bus, bus.stubs[i]), kind: "request", dur: 1.2, delay: -i * 0.4, flow: FWD, r: 4 }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Node, { x: con.x, y: con.y0 + i * con.step, w: con.w, h: con.h, label: c.label, sub: c.sub, icon: c.icon, flow: [FWD, BACK] })
    ] }, c.label)),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Label, { x: (version.x + version.w + busX) / 2, y: cy - 10, text: "install", anchor: "middle" }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Connector, { points: back, defs: id, kind: "change", flow: BACK, dashed: true }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Packet, { points: back, kind: "change", dur: 3.2, flow: BACK }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Packet, { points: back, kind: "change", dur: 3.2, delay: -1.6, flow: BACK }),
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Label, { x: (busX + author.x) / 2, y: loopY - 10, text: `${spec.feedback.label} \xB7 ${spec.feedback.sub ?? ""}`.trim(), anchor: "middle" })
  ] });
  const steps = [
    { ...spec.author, icon: spec.author.icon ?? "user", flow: FWD },
    { ...spec.evaluate, sub: `${spec.evaluate.sub ?? ""} \xB7 vs ${spec.evaluate.baseline}`.replace(/^ · /, ""), icon: spec.evaluate.icon ?? "chart", flow: FWD },
    { ...spec.version, icon: spec.version.icon ?? "git", kind: "accent", flow: FWD },
    { label: spec.consumers.map((c) => c.label).join(" \xB7 "), sub: "consumers", icon: "git", flow: FWD },
    { ...spec.feedback, icon: spec.feedback.icon ?? "warning", kind: "change", flow: BACK, dashed: true }
  ];
  return {
    wide,
    narrow: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Stack, { steps, id: `${id}-n` }),
    viewBox: `0 0 1120 ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Candidate", kind: "request" },
      { label: "Passes baseline", kind: "accent" },
      { label: "Feedback", kind: "change" }
    ]
  };
}
var skillLifecycle = (spec = defaultSkillLifecycle, id) => presetFigure(spec, skillLifecycleParts, id);

// src/presets/syncLoop.tsx
var import_jsx_runtime21 = require("react/jsx-runtime");
var defaultSyncLoop = {
  figure: {
    number: "Figure 01",
    eyebrow: "Sync loop",
    title: "Edit where you use it, it flows back",
    caption: "One upstream repo is a subtree inside every consumer. A start hook merges what moved upstream; a stop hook pushes local edits back. A plugin install reads the same repo one way.",
    alt: "An upstream repo on the left holds skills, a catalog and a plugin manifest; three consumer repos on the right each pull at session start and push at session stop, and a plugin marketplace reads the upstream one way."
  },
  upstream: {
    label: "Upstream",
    sub: "ong6/skillpack",
    items: [
      { label: "skills/", sub: "one folder per skill", icon: "doc" },
      { label: "catalog.yaml", sub: "build fails on drift", icon: "doc" },
      { label: ".claude-plugin/", sub: "marketplace + plugin", icon: "tool" }
    ]
  },
  consumers: [
    { label: "private-notes", sub: "subtree", icon: "git", hooks: ["SessionStart", "Stop"] },
    { label: "junxiong-homepage", sub: "subtree", icon: "git", hooks: ["SessionStart", "Stop"] },
    { label: "Plugin marketplace", sub: "read-only", icon: "cloud", plugin: true }
  ],
  pull: "merge at start",
  push: "push at stop"
};
var PULL = "pull";
var PUSH = "push";
function syncLoopParts(spec = defaultSyncLoop, id) {
  const items = spec.upstream.items;
  const n = spec.consumers.length;
  const con = { x: 720, w: 336, h: 64, step: 88, y0: 72 };
  const up = { x: 24, y: 64, w: 320, h: Math.max(48 + items.length * 64 + 8, con.y0 + n * con.step - 64 - 8) };
  const conY = (i) => con.y0 + i * con.step + con.h / 2;
  const height = Math.max(up.y + up.h, con.y0 + n * con.step - 24) + 32;
  const wide = /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Defs, { id }),
    /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Lane, { x: up.x, w: up.w, y: 40, title: "Upstream" }),
    /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Lane, { x: con.x, w: con.w, y: 40, title: "Consumers" }),
    /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Group, { ...up, title: spec.upstream.label, flow: [PULL, PUSH], children: items.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Node, { x: up.x + 16, y: up.y + 40 + i * 64, w: up.w - 32, h: 48, label: it.label, sub: it.sub, icon: it.icon, align: "left", flow: [PULL, PUSH], size: 13, subSize: 10 }, it.label)) }),
    spec.consumers.map((c, i) => {
      const cy = conY(i);
      const pull = [
        [up.x + up.w, cy - 8],
        [con.x, cy - 8]
      ];
      const push = [
        [con.x, cy + 8],
        [up.x + up.w, cy + 8]
      ];
      const single = [
        [up.x + up.w, cy],
        [con.x, cy]
      ];
      return /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("g", { children: [
        c.plugin ? /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Connector, { points: single, defs: id, kind: "request", dashed: true, flow: PULL }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Packet, { points: single, kind: "request", dur: 2.6, delay: -i * 0.5, flow: PULL, r: 4 })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)(import_jsx_runtime21.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Connector, { points: pull, defs: id, kind: "request", flow: PULL }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Packet, { points: pull, kind: "request", dur: 2.4, delay: -i * 0.6, flow: PULL, r: 4 }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Connector, { points: push, defs: id, kind: "change", flow: PUSH }),
          /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Packet, { points: push, kind: "change", dur: 2.4, delay: -i * 0.6 - 1.2, flow: PUSH, r: 4 })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Node, { x: con.x, y: con.y0 + i * con.step, w: con.w, h: con.h, label: c.label, sub: c.hooks ? `${c.sub ?? ""} \xB7 ${c.hooks[0]} \u2192 ${c.hooks[1]}`.replace(/^ · /, "") : c.sub, icon: c.icon, align: "left", flow: c.plugin ? PULL : [PULL, PUSH] })
      ] }, c.label);
    }),
    /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Label, { x: (up.x + up.w + con.x) / 2, y: conY(0) - 16, text: spec.pull ?? "pull", anchor: "middle" }),
    /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Label, { x: (up.x + up.w + con.x) / 2, y: conY(0) + 28, text: spec.push ?? "push", anchor: "middle" })
  ] });
  const steps = [
    { label: spec.upstream.label, sub: spec.upstream.sub ?? items.map((i) => i.label).join(" \xB7 "), icon: "git", flow: [PULL, PUSH].join(" ") },
    ...spec.consumers.map((c) => ({ label: c.label, sub: c.plugin ? "reads one way" : (spec.pull ?? "pull") + " \xB7 " + (spec.push ?? "push"), icon: c.icon ?? "git", flow: c.plugin ? PULL : [PULL, PUSH].join(" "), kind: c.plugin ? "request" : "change", dashed: c.plugin }))
  ];
  return {
    wide,
    narrow: /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Stack, { steps, id: `${id}-n` }),
    viewBox: `0 0 1120 ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: spec.pull ?? "Pull", kind: "request" },
      { label: spec.push ?? "Push", kind: "change" }
    ]
  };
}
var syncLoop = (spec = defaultSyncLoop, id) => presetFigure(spec, syncLoopParts, id);

// src/presets/beforeAfter.tsx
var import_jsx_runtime22 = require("react/jsx-runtime");
var defaultBeforeAfter = {
  figure: {
    number: "Figure 01",
    eyebrow: "Before and after",
    title: "One check between the model and the reader",
    caption: "Before, the model's draft went straight to the customer. After, a deterministic check reads the recorded facts and raises on the first unsupported claim.",
    alt: "Two stacked panels. Before: tools, model, draft, customer in a line. After: the same line with a deterministic check inserted between the draft and the customer, highlighted."
  },
  before: {
    title: "Before",
    stages: [
      { label: "Tools", sub: "results", icon: "tool" },
      { label: "Model", sub: "drafts prose", icon: "model" },
      { label: "Draft", sub: "trusted as-is", icon: "doc" },
      { label: "Customer", sub: "reads it", icon: "user" }
    ]
  },
  after: {
    title: "After",
    stages: [
      { label: "Tools", sub: "facts recorded", icon: "tool" },
      { label: "Model", sub: "fills fields", icon: "model" },
      { label: "Check", sub: "facts vs fields", icon: "lock" },
      { label: "Customer", sub: "reads what passed", icon: "user" }
    ],
    changed: [2]
  }
};
function beforeAfterParts(spec = defaultBeforeAfter, id) {
  const stage = { w: 136, h: 48, step: 176 };
  const panelH = 120;
  const panel = (p, y, flow, pid) => {
    const n = p.stages.length;
    const w = 48 + n * stage.step - (stage.step - stage.w) + 48;
    const x0 = 24;
    const sy = y + 48;
    const cy = sy + stage.h / 2;
    const changed2 = new Set(p.changed ?? []);
    return /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(Group, { x: x0, y, w, h: panelH, title: p.title, variant: "dashed", flow, accent: changed2.size > 0, children: p.stages.map((s, i) => {
      const x = x0 + 24 + i * stage.step;
      const into = [
        [x - stage.step + stage.w, cy],
        [x, cy]
      ];
      const hot = changed2.has(i);
      return /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("g", { children: [
        i > 0 ? /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(import_jsx_runtime22.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(Connector, { points: into, defs: id, kind: hot ? "accent" : "request", flow }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(Packet, { points: into, kind: hot ? "accent" : "request", dur: 1.2, delay: -i * 0.4, flow, r: 4, id: `${pid}-p${i}` })
        ] }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(Node, { x, y: sy, w: stage.w, h: stage.h, label: s.label, sub: s.sub, icon: s.icon, accent: hot, flow, size: 13, subSize: 10 })
      ] }, s.label + i);
    }) });
  };
  const afterY = 24 + panelH + 32;
  const height = afterY + panelH + 24;
  const panelW = (p) => 48 + p.stages.length * stage.step - (stage.step - stage.w) + 48;
  const width = Math.max(panelW(spec.before), panelW(spec.after)) + 48;
  const wide = /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(import_jsx_runtime22.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(Defs, { id }),
    panel(spec.before, 24, "before", `${id}-b`),
    panel(spec.after, afterY, "after", `${id}-a`)
  ] });
  const changed = new Set(spec.after.changed ?? []);
  const steps = [
    ...spec.before.stages.map((s, i) => ({ ...s, sub: i === 0 ? spec.before.title.toLowerCase() : s.sub, flow: "before" })),
    ...spec.after.stages.map((s, i) => ({ ...s, sub: i === 0 ? spec.after.title.toLowerCase() : s.sub, flow: "after", accent: changed.has(i), kind: changed.has(i) ? "accent" : i === 0 ? "neutral" : "request" }))
  ];
  return {
    wide,
    narrow: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(Stack, { steps, id: `${id}-n` }),
    viewBox: `0 0 ${Math.max(width, 640)} ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Unchanged", kind: "request" },
      { label: "Changed", kind: "accent" }
    ]
  };
}
var beforeAfter = (spec = defaultBeforeAfter, id) => presetFigure(spec, beforeAfterParts, id);

// src/presets/pipeline.tsx
var import_jsx_runtime23 = require("react/jsx-runtime");
var defaultPipeline = {
  figure: {
    number: "Figure 01",
    eyebrow: "Pipeline",
    title: "Fast in front, slow behind a queue",
    caption: "Validation and enrichment run inline. Embedding is slow and bursty, so it sits behind a queue; the writer drains at its own pace.",
    alt: "Five stages in a line: receive, validate, enrich, then a queue with three slots, then embed and write."
  },
  stages: [
    { label: "Receive", sub: "HTTP \xB7 2 ms", icon: "gateway" },
    { label: "Validate", sub: "schema \xB7 1 ms", icon: "lock" },
    { label: "Enrich", sub: "lookups \xB7 8 ms", icon: "service" },
    { label: "Embed", sub: "model \xB7 120 ms", icon: "model" },
    { label: "Write", sub: "batched", icon: "db" }
  ],
  queue: { label: "Queue", sub: "at-least-once", icon: "queue", after: 2, depth: 3 }
};
var FLOW = "job";
function pipelineParts(spec = defaultPipeline, id) {
  const stage = { w: 136, h: 48, step: 176, y: 96 };
  const cy = stage.y + stage.h / 2;
  const slots = [];
  spec.stages.forEach((_, i) => {
    slots.push("stage");
    if (spec.queue && spec.queue.after === i) slots.push("queue");
  });
  const x = (slot) => 24 + slot * stage.step;
  const width = 24 + slots.length * stage.step - (stage.step - stage.w) + 24;
  let si = 0;
  const nodes = slots.map((kind, slot) => {
    const into = [
      [x(slot - 1) + stage.w, cy],
      [x(slot), cy]
    ];
    const edge = slot > 0 ? /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(import_jsx_runtime23.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(Connector, { points: into, defs: id, kind: kind === "queue" || slots[slot - 1] === "queue" ? "change" : "request", flow: FLOW }),
      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(Packet, { points: into, kind: kind === "queue" || slots[slot - 1] === "queue" ? "change" : "request", dur: 1.2, delay: -slot * 0.35, flow: FLOW, r: 4 })
    ] }) : null;
    if (kind === "queue") {
      const q = spec.queue;
      const depth = q.depth ?? 3;
      const cw = (stage.w - 16 - (depth - 1) * 6) / depth;
      return /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("g", { children: [
        edge,
        /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(Group, { x: x(slot), y: stage.y - 16, w: stage.w, h: stage.h + 32, title: q.label, flow: FLOW, accent: true, children: Array.from({ length: depth }).map((_, k) => /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(Chip, { x: x(slot) + 8 + k * (cw + 6), y: stage.y + 24, w: cw, h: 18, label: k < depth - 1 ? String(k + 1) : "", kind: k < depth - 1 ? "change" : void 0, dashed: k === depth - 1, flow: FLOW }, k)) })
      ] }, "queue");
    }
    const s = spec.stages[si++];
    return /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)("g", { children: [
      edge,
      /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(Node, { x: x(slot), y: stage.y, w: stage.w, h: stage.h, label: s.label, sub: s.sub, icon: s.icon, flow: FLOW, size: 13, subSize: 10 })
    ] }, s.label);
  });
  const wide = /* @__PURE__ */ (0, import_jsx_runtime23.jsxs)(import_jsx_runtime23.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(Defs, { id }),
    /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(Lane, { x: 24, w: width - 48, y: 40, title: spec.laneTitle ?? "Stages, left to right" }),
    nodes
  ] });
  const steps = [
    ...spec.stages.slice(0, (spec.queue?.after ?? spec.stages.length - 1) + 1).map((s) => ({ ...s, flow: FLOW })),
    ...spec.queue ? [{ label: spec.queue.label, sub: spec.queue.sub, icon: spec.queue.icon ?? "queue", kind: "change", accent: true, flow: FLOW }] : [],
    ...spec.stages.slice((spec.queue?.after ?? spec.stages.length - 1) + 1).map((s) => ({ ...s, kind: "change", flow: FLOW }))
  ];
  return {
    wide,
    narrow: /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(Stack, { steps, id: `${id}-n` }),
    viewBox: `0 0 ${Math.max(width, 640)} ${stage.y + stage.h + 48}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Inline", kind: "request" },
      { label: "Queued", kind: "change" }
    ]
  };
}
var pipeline = (spec = defaultPipeline, id) => presetFigure(spec, pipelineParts, id);

// src/presets/index.ts
var PRESETS = {
  serviceMap: { render: serviceMap, spec: defaultServiceMap, name: "Service map" },
  agentLoop: { render: agentLoop, spec: defaultAgentLoop, name: "Agent loop" },
  ragPipeline: { render: ragPipeline, spec: defaultRagPipeline, name: "RAG pipeline" },
  skillLifecycle: { render: skillLifecycle, spec: defaultSkillLifecycle, name: "Skill lifecycle" },
  syncLoop: { render: syncLoop, spec: defaultSyncLoop, name: "Sync loop" },
  beforeAfter: { render: beforeAfter, spec: defaultBeforeAfter, name: "Before and after" },
  pipeline: { render: pipeline, spec: defaultPipeline, name: "Pipeline" }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NARROW_W,
  PRESETS,
  PresetFigure,
  Stack,
  agentLoop,
  agentLoopParts,
  beforeAfter,
  beforeAfterParts,
  defaultAgentLoop,
  defaultBeforeAfter,
  defaultPipeline,
  defaultRagPipeline,
  defaultServiceMap,
  defaultSkillLifecycle,
  defaultSyncLoop,
  pipeline,
  pipelineParts,
  presetFigure,
  ragPipeline,
  ragPipelineParts,
  serviceMap,
  serviceMapParts,
  skillLifecycle,
  skillLifecycleParts,
  stackHeight,
  syncLoop,
  syncLoopParts,
  toFigure
});
//# sourceMappingURL=presets.cjs.map