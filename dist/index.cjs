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
var src_exports = {};
__export(src_exports, {
  Badge: () => Badge,
  Bus: () => Bus,
  Chip: () => Chip,
  Connector: () => Connector,
  DEFAULT_RENDER_WIDTH: () => DEFAULT_RENDER_WIDTH,
  Defs: () => Defs,
  Figure: () => Figure,
  FigureHoverContext: () => FigureHoverContext,
  FigureMotionContext: () => FigureMotionContext,
  FigureScaleContext: () => FigureScaleContext,
  FigureScaleProvider: () => FigureScaleProvider,
  Group: () => Group,
  Label: () => Label,
  Lane: () => Lane,
  Legend: () => Legend,
  Node: () => Node,
  Packet: () => Packet,
  TOKEN_SHAPE: () => TOKEN_SHAPE,
  Token: () => Token,
  Wordmark: () => Wordmark,
  anchor: () => anchor,
  busStub: () => busStub,
  busStubs: () => busStubs,
  connectorStroke: () => connectorStroke,
  flowList: () => flowList,
  fontFloor: () => fontFloor,
  grid: () => grid,
  hoverAttrs: () => hoverAttrs,
  icons: () => icons,
  marks: () => marks,
  pathFromPoints: () => pathFromPoints,
  pointAlong: () => pointAlong,
  polylineLength: () => polylineLength,
  route: () => route,
  tokenColor: () => tokenColor,
  trim: () => trim,
  useFigureHover: () => useFigureHover,
  useFigureMotion: () => useFigureMotion,
  useFontFloor: () => useFontFloor,
  usePrefersReducedMotion: () => usePrefersReducedMotion
});
module.exports = __toCommonJS(src_exports);

// src/CanvasView.tsx
var import_react2 = require("react");

// src/canvas-gestures.ts
var import_react = require("react");
var useBrowserLayoutEffect = typeof window === "undefined" ? import_react.useEffect : import_react.useLayoutEffect;
function useCanvasGestures(ref, open, zoom) {
  const latest = (0, import_react.useRef)(zoom);
  latest.current = zoom;
  const pending = (0, import_react.useRef)();
  const queued = (0, import_react.useRef)(zoom.value);
  const frame = (0, import_react.useRef)(0);
  useBrowserLayoutEffect(() => {
    queued.current = zoom.value;
    const anchor2 = pending.current;
    if (!anchor2) return;
    const rect = anchor2.surface.getBoundingClientRect();
    const ratio = zoom.value / anchor2.scale;
    anchor2.surface.scrollLeft = anchor2.x * ratio + anchor2.inset.x - (anchor2.point.x - rect.left);
    anchor2.surface.scrollTop = anchor2.y * ratio + anchor2.inset.y - (anchor2.point.y - rect.top);
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
  const changeRef = (0, import_react.useRef)(change);
  changeRef.current = change;
  (0, import_react.useEffect)(() => {
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
var import_jsx_runtime = require("react/jsx-runtime");
function CanvasView({
  open,
  onClose,
  title,
  children,
  zoom,
  theme,
  restoreFocus
}) {
  const content = (0, import_react2.useRef)(null);
  const gestures = useCanvasGestures(content, open, zoom);
  const dialog = (0, import_react2.useRef)(null);
  const actions = (0, import_react2.useRef)(gestures);
  actions.current = gestures;
  (0, import_react2.useEffect)(() => {
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
  const close = (0, import_react2.useRef)(onClose);
  close.current = onClose;
  (0, import_react2.useEffect)(() => {
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
  if (!open || typeof document === "undefined") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
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
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "uipack-canvas-toolbar", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
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
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
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
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", title: "Reset view (0)", onClick: gestures.reset, children: "Fit" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", onClick: onClose, autoFocus: true, children: "Close canvas" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "uipack-canvas-hint", children: "Pinch to zoom \xB7 Two-finger scroll \xB7 + / \u2212 to zoom \xB7 0 to reset" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: content, className: "uipack-canvas-content", children })
        ]
      }
    ),
    document.body
  );
}

// src/selection.tsx
var import_react3 = require("react");
var SelectionContext = (0, import_react3.createContext)({ enabled: false, selected: null, select: () => {
} });
function useItemSelection(label, detail, flow, enabled = true) {
  const id = (0, import_react3.useId)();
  const context = (0, import_react3.useContext)(SelectionContext);
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
var import_react4 = require("react");
var noop = () => {
};
var FigureMotionContext = (0, import_react4.createContext)({
  playing: true,
  reduced: false,
  cycle: 0,
  toggle: noop,
  replay: noop
});
function useFigureMotion() {
  return (0, import_react4.useContext)(FigureMotionContext);
}
var QUERY = "(prefers-reduced-motion: reduce)";
function usePrefersReducedMotion() {
  const [reduced, setReduced] = (0, import_react4.useState)(false);
  (0, import_react4.useEffect)(() => {
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

// src/hover.tsx
var import_react5 = require("react");
var noop2 = () => {
};
var FigureHoverContext = (0, import_react5.createContext)({ flow: null, kind: null, setFlow: noop2, setKind: noop2 });
function useFigureHover() {
  return (0, import_react5.useContext)(FigureHoverContext);
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

// src/tokens.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
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
  if (s === "circle") return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx, cy, r, ...common });
  if (s === "diamond") {
    const d = r * 1.2;
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: `M${cx},${cy - d} L${cx + d},${cy} L${cx},${cy + d} L${cx - d},${cy} Z`, ...common });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: cx - r, y: cy - r, width: r * 2, height: r * 2, rx: 1.5, ...common });
}

// src/Legend.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function Legend({ items }) {
  const hover = useFigureHover();
  if (!items.length) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ul", { className: "uipack__legend", "aria-label": "Legend", children: items.map((it) => {
    const kind = it.kind ?? "neutral";
    const hoverable = kind !== "neutral";
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
      "li",
      {
        "data-kind": kind,
        "data-state": hover.kind ? hover.kind === kind ? "hit" : "dim" : void 0,
        onPointerEnter: hoverable ? (e) => isPointer(e) && hover.setKind(kind) : void 0,
        onPointerLeave: hoverable ? (e) => isPointer(e) && hover.setKind(null) : void 0,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { viewBox: "-8 -8 16 16", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Token, { kind, shape: it.shape, r: 5.5 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: it.label })
        ]
      },
      it.label
    );
  }) });
}

// src/scale.tsx
var import_react6 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var FigureScaleContext = (0, import_react6.createContext)({ floor: 0 });
var DEFAULT_RENDER_WIDTH = 1088;
function fontFloor(vbWidth2, renderWidth, minFont) {
  if (!vbWidth2 || !renderWidth || !minFont) return 0;
  return minFont * vbWidth2 / renderWidth;
}
function FigureScaleProvider({ floor, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FigureScaleContext.Provider, { value: { floor }, children });
}
function useFontFloor(size) {
  const { floor } = (0, import_react6.useContext)(FigureScaleContext);
  return Math.max(size, floor);
}

// src/Figure.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
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
var PauseGlyph = () => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("svg", { viewBox: "0 0 12 12", "aria-hidden": "true", children: [
  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("rect", { x: "2", y: "1.5", width: "3", height: "9", rx: "0.5" }),
  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("rect", { x: "7", y: "1.5", width: "3", height: "9", rx: "0.5" })
] });
var PlayGlyph = () => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { viewBox: "0 0 12 12", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M3 1.5 L10.5 6 L3 10.5 Z" }) });
var ReplayGlyph = () => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("svg", { viewBox: "0 0 12 12", "aria-hidden": "true", children: [
  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "path",
    {
      d: "M6 1.5a4.5 4.5 0 1 1-4.2 2.9",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.6",
      strokeLinecap: "round"
    }
  ),
  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M1.5 1.5v3h3z" })
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
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
      children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(SelectionContext.Provider, { value: { enabled: true, selected, select }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(FigureMotionContext.Provider, { value: motion, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(FigureHoverContext.Provider, { value: hover, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
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
            hasHead ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "uipack__head", children: [
              number || eyebrow ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { className: "uipack__eyebrow", children: [
                number,
                number && eyebrow ? " \xB7 " : "",
                eyebrow
              ] }) : null,
              title ? (0, import_react7.createElement)(
                `h${headingLevel}`,
                { className: "uipack__title" },
                title
              ) : null,
              caption ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "uipack__caption", children: caption }) : null,
              showControls || expandable ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "uipack__controls", children: [
                expandable && !expanded && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
                showControls && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
                    "button",
                    {
                      type: "button",
                      className: "uipack__ctl uipack__ctl--motion",
                      onClick: replay,
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ReplayGlyph, {}),
                        " Replay"
                      ]
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
                    "button",
                    {
                      type: "button",
                      className: "uipack__ctl uipack__ctl--motion",
                      onClick: toggle,
                      "aria-pressed": !playing,
                      children: [
                        playing ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PauseGlyph, {}) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PlayGlyph, {}),
                        " ",
                        playing ? "Pause" : "Play"
                      ]
                    }
                  )
                ] })
              ] }) : null,
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Legend, { items: legend })
            ] }) : null,
            selected && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "uipack__selection", role: "status", children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: selected.label }),
                selected.detail && ` \xB7 ${selected.detail}`
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", onClick: () => select(null), children: "Clear selection" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
              "div",
              {
                className: `uipack__canvas uipack__canvas--${background}`,
                onClick: () => select(null),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                    "svg",
                    {
                      ref: wideRef,
                      className: "uipack--wide",
                      style: expanded ? { width: `max(${zoom * 100}%, ${800 * zoom}px)` } : void 0,
                      viewBox,
                      role: "group",
                      "aria-label": alt,
                      children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(FigureScaleContext.Provider, { value: wideScale, children })
                    }
                  ),
                  narrow ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                    "svg",
                    {
                      ref: narrowRef,
                      className: "uipack--narrow",
                      viewBox: narrowViewBox ?? viewBox,
                      role: "group",
                      "aria-label": alt,
                      children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(FigureScaleContext.Provider, { value: narrowScale, children: narrow })
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

// src/Lane.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
function Lane({ x, w, y, title, h, size: size0 = 11 }) {
  const size = useFontFloor(size0);
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("g", { "data-uipack": "lane", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("text", { x: x + w / 2, y, textAnchor: "middle", fontSize: size, fontWeight: 700, fontFamily: "var(--uipack-mono)", letterSpacing: ".08em", fill: "currentColor", children: title.toUpperCase() }),
    h ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("line", { x1: x + w, y1: y + 12, x2: x + w, y2: y + h, stroke: "currentColor", strokeOpacity: 0.15, strokeDasharray: "2 6" }) : null
  ] });
}

// src/Group.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
    "g",
    {
      "data-uipack": "group",
      ...hoverAttrs(flow, void 0, hover),
      ...selection,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
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
        title ? dashed ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
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
        ) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
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
  const anchor2 = align === "center" ? "middle" : "start";
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
            textAnchor: anchor2,
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
            textAnchor: anchor2,
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

// src/Chip.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
    "g",
    {
      "data-uipack": "chip",
      ...hoverAttrs(flow, kind === "accent" ? void 0 : kind, hover),
      ...selection,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
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
        label ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
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
var grid = (v, step = 8) => Math.round(v / step) * step;

// src/Connector.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");
function connectorStroke(kind) {
  if (!kind) return "currentColor";
  return kind === "accent" ? "var(--uipack-accent)" : `var(--uipack-token-${kind})`;
}
function Connector({ points, defs, arrow = true, dashed, kind, flow, id, radius = 6, strokeWidth = 1.25, inset = 2 }) {
  const hover = useFigureHover();
  const [s, e] = Array.isArray(inset) ? inset : [inset, inset];
  const d = pathFromPoints(trim(points, s, arrow ? e + 2 : e), radius);
  const head = defs ? `url(#${defs}-head${kind ? `-${kind}` : ""})` : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
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

// src/Bus.tsx
var import_jsx_runtime12 = require("react/jsx-runtime");
function busStub(props, stub) {
  return props.axis === "h" ? [[stub.at, props.at], [stub.at, stub.to]] : [[props.at, stub.at], [stub.to, stub.at]];
}
function busStubs(props) {
  return props.stubs.map((s) => busStub(props, s));
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

// src/Packet.tsx
var import_react8 = require("react");
var import_jsx_runtime13 = require("react/jsx-runtime");
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
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("g", { id, "data-uipack": "packet", "data-static": "true", ...attrs, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Token, { kind, shape, r, cx, cy }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("g", { id, "data-uipack": "packet", ...attrs, children: [
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Token, { kind, shape, r }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("animateMotion", { dur: `${dur}s`, begin: `${delay}s`, repeatCount: "indefinite", path: d, calcMode: "linear" })
  ] });
}

// src/Badge.tsx
var import_jsx_runtime14 = require("react/jsx-runtime");
function Badge({ cx, cy, text, accent, r = 9, size: size0 = 10 }) {
  const size = useFontFloor(size0);
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("g", { "data-uipack": "badge", children: [
    /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("circle", { cx, cy, r, fill: "var(--uipack-bg)", stroke, strokeOpacity: accent ? 1 : 0.6, strokeWidth: 1.25 }),
    /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("text", { x: cx, y: cy + size * 0.35, textAnchor: "middle", fontSize: size, fontFamily: "var(--uipack-mono)", fontWeight: 700, fill: stroke, children: text })
  ] });
}

// src/Label.tsx
var import_jsx_runtime15 = require("react/jsx-runtime");
function Label({ x, y, text, anchor: anchor2 = "start", accent, size: size0 = 11, font = "mono" }) {
  const size = useFontFloor(size0);
  const w = text.length * size * (font === "mono" ? 0.62 : 0.55) + 8;
  const rx = anchor2 === "middle" ? x - w / 2 : anchor2 === "end" ? x - w + 4 : x - 4;
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("g", { "data-uipack": "label", children: [
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("rect", { x: rx, y: y - size + 1, width: w, height: size + 5, fill: "var(--uipack-bg)" }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
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
var import_jsx_runtime16 = require("react/jsx-runtime");
function Defs({ id }) {
  const head = (suffix, fill) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
    "marker",
    {
      id: `${id}-head${suffix}`,
      markerWidth: "8",
      markerHeight: "8",
      refX: "7",
      refY: "4",
      orient: "auto-start-reverse",
      markerUnits: "userSpaceOnUse",
      children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("path", { d: "M0,0 L8,4 L0,8 z", fill })
    }
  );
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("defs", { children: [
    head("", "currentColor"),
    head("-accent", "var(--uipack-accent)"),
    head("-request", "var(--uipack-token-request)"),
    head("-response", "var(--uipack-token-response)"),
    head("-change", "var(--uipack-token-change)")
  ] });
}

// src/marks/index.tsx
var import_jsx_runtime17 = require("react/jsx-runtime");
var marks = {
  uipack: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("rect", { x: "4", y: "4", width: "10", height: "10", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("rect", { x: "18", y: "4", width: "10", height: "10", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("rect", { x: "4", y: "18", width: "10", height: "10", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("rect", { x: "18", y: "18", width: "10", height: "10", rx: "5", fill: "currentColor" })
  ] }),
  groundplane: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("path", { d: "M4 22h24" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("path", { d: "M8 22V10l8-4 8 4v12" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("path", { d: "M8 16h16", strokeDasharray: "2 2" })
  ] }),
  jobforge: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("path", { d: "M6 24h20" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("path", { d: "M10 24V14h12v10" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("path", { d: "M13 14V9h6v5M16 4v5" })
  ] }),
  skillforge: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(import_jsx_runtime17.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("path", { d: "M16 4l3.5 7 7.5 1-5.5 5.3 1.3 7.7L16 21.4 9.2 25l1.3-7.7L5 12l7.5-1z" }) }),
  deckforge: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("rect", { x: "4", y: "7", width: "24", height: "15", rx: "2" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("path", { d: "M12 26h8M16 22v4M9 13h8M9 17h5" })
  ] }),
  proofpack: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("path", { d: "M8 4h11l5 5v19H8z" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("path", { d: "M19 4v5h5" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("path", { d: "M12 18l3 3 5-6" })
  ] }),
  fieldpack: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("rect", { x: "5", y: "10", width: "22", height: "16", rx: "3" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("path", { d: "M11 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3M5 16h22" })
  ] }),
  skillpack: /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)(import_jsx_runtime17.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("rect", { x: "5", y: "6", width: "22", height: "20", rx: "3" }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("path", { d: "M10 12h12M10 16h12M10 20h7" })
  ] })
};
function Wordmark({ size = 24 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("svg", { viewBox: "0 0 140 32", width: size * 140 / 32, height: size, role: "img", "aria-label": "uipack", style: { display: "block" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("g", { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: marks.uipack }),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("text", { x: "40", y: "22", fontSize: "18", fontWeight: 700, fontFamily: "var(--uipack-mono, ui-monospace, monospace)", letterSpacing: ".02em", fill: "currentColor", children: "uipack" })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
//# sourceMappingURL=index.cjs.map