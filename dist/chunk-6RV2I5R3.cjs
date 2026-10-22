'use strict';

var chunkXEK5V7KF_cjs = require('./chunk-XEK5V7KF.cjs');
var chunk5QNGHC2A_cjs = require('./chunk-5QNGHC2A.cjs');
var chunkYMPVJRTJ_cjs = require('./chunk-YMPVJRTJ.cjs');
var react = require('react');
var jsxRuntime = require('react/jsx-runtime');

var noop = () => {
};
var FigureHoverContext = /* @__PURE__ */ react.createContext({
  flow: null,
  kind: null,
  setFlow: noop,
  setKind: noop
});
function useFigureHover() {
  return react.useContext(FigureHoverContext);
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
function Legend({ items }) {
  const hover = useFigureHover();
  if (!items.length) return null;
  return /* @__PURE__ */ jsxRuntime.jsx("ul", { className: "uipack__legend", "aria-label": "Legend", children: items.map((it) => {
    const kind = it.kind ?? "neutral";
    const hoverable = kind !== "neutral";
    return /* @__PURE__ */ jsxRuntime.jsxs(
      "li",
      {
        "data-kind": kind,
        "data-state": hover.kind ? hover.kind === kind ? "hit" : "dim" : void 0,
        onPointerEnter: hoverable ? (e) => isPointer(e) && hover.setKind(kind) : void 0,
        onPointerLeave: hoverable ? (e) => isPointer(e) && hover.setKind(null) : void 0,
        children: [
          /* @__PURE__ */ jsxRuntime.jsx("svg", { viewBox: "-8 -8 16 16", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntime.jsx(chunkXEK5V7KF_cjs.Token, { kind, shape: it.shape, r: 5.5 }) }),
          /* @__PURE__ */ jsxRuntime.jsx("span", { children: it.label })
        ]
      },
      it.label
    );
  }) });
}
var SelectionContext = /* @__PURE__ */ react.createContext({ enabled: false, selected: null, select: () => {
} });
function useItemSelection(label, detail, flow, enabled = true, name = label) {
  const id = react.useId();
  const context = react.useContext(SelectionContext);
  if (!context.enabled || !enabled || !(detail || flow)) return {};
  const selected = context.selected?.id === id;
  const toggle = (anchor2) => context.select(selected ? null : { id, label, detail, flow, anchor: anchor2 });
  return {
    role: "button",
    tabIndex: 0,
    "aria-label": name,
    "aria-pressed": selected,
    "data-selected": selected ? "true" : void 0,
    onClick: (event) => {
      event.stopPropagation();
      toggle(event.currentTarget);
    },
    onKeyDown: (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        toggle(event.currentTarget);
      }
    }
  };
}
var ITEM = 'a[href], [role="button"]';
var DRAWING = 'svg[role="group"]';
var itemsOf = (drawing) => Array.from(drawing.querySelectorAll(ITEM)).filter((el) => el.closest(DRAWING) === drawing);
var shown = (el) => el.getClientRects().length > 0;
function setTabIndex(el, value) {
  if (el.getAttribute("tabindex") !== value) el.setAttribute("tabindex", value);
}
function useRovingFocus(ref, key) {
  react.useEffect(() => {
    const root = ref.current;
    if (!root || typeof MutationObserver === "undefined") return;
    const stops = /* @__PURE__ */ new WeakMap();
    const settle = (drawing, focused) => {
      const items = itemsOf(drawing);
      if (!items.length) return;
      const remembered = focused ?? stops.get(drawing);
      const stop = (remembered && items.includes(remembered) ? remembered : null) ?? items.find((el) => el.getAttribute("aria-pressed") === "true") ?? items[0];
      stops.set(drawing, stop);
      for (const el of items) setTabIndex(el, el === stop ? "0" : "-1");
    };
    const settleAll = () => root.querySelectorAll(DRAWING).forEach((d) => settle(d));
    const itemAt = (target) => {
      const el = target instanceof Element ? target : null;
      const drawing = el?.matches(ITEM) ? el.closest(DRAWING) : null;
      return drawing && root.contains(drawing) ? { el, drawing } : null;
    };
    const onFocusIn = (e) => {
      const at = itemAt(e.target);
      if (at) settle(at.drawing, at.el);
    };
    const onKeyDown = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const at = itemAt(e.target);
      if (!at) return;
      const items = itemsOf(at.drawing).filter(shown);
      const i = items.indexOf(at.el);
      let next;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          next = items[i + 1];
          break;
        case "ArrowLeft":
        case "ArrowUp":
          next = items[i - 1];
          break;
        case "Home":
          next = items[0];
          break;
        case "End":
          next = items[items.length - 1];
          break;
        default:
          return;
      }
      e.preventDefault();
      if (!next || next === at.el) return;
      settle(at.drawing, next);
      next.focus();
    };
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        settleAll();
      });
    });
    settleAll();
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["tabindex", "role", "href"] });
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("keydown", onKeyDown);
    return () => {
      observer.disconnect();
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, key]);
}
var vbWidth = (viewBox) => Number(viewBox.split(/\s+/)[2]) || 0;
var NOTE_GAP = 8;
function placeNote(canvas, note, anchor2) {
  const box = anchor2.querySelector(":scope > rect") ?? anchor2;
  const c = canvas.getBoundingClientRect();
  const a = box.getBoundingClientRect();
  const w = note.offsetWidth;
  const h = note.offsetHeight;
  const x = a.left - c.left - canvas.clientLeft + canvas.scrollLeft;
  const y = a.top - c.top - canvas.clientTop + canvas.scrollTop;
  const minLeft = canvas.scrollLeft + NOTE_GAP;
  const maxLeft = canvas.scrollLeft + canvas.clientWidth - w - NOTE_GAP;
  const left = Math.max(minLeft, Math.min(x + a.width / 2 - w / 2, maxLeft));
  const above = y - NOTE_GAP - h;
  const top = above >= canvas.scrollTop + NOTE_GAP ? above : y + a.height + NOTE_GAP;
  return { left, top };
}
function useRenderedWidth(ref, fixed, layoutKey) {
  const [w, setW] = react.useState(fixed ?? chunkXEK5V7KF_cjs.DEFAULT_RENDER_WIDTH);
  react.useEffect(() => {
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
var PauseGlyph = () => /* @__PURE__ */ jsxRuntime.jsxs("svg", { viewBox: "0 0 12 12", "aria-hidden": "true", children: [
  /* @__PURE__ */ jsxRuntime.jsx("rect", { x: "2", y: "1.5", width: "3", height: "9", rx: "0.5" }),
  /* @__PURE__ */ jsxRuntime.jsx("rect", { x: "7", y: "1.5", width: "3", height: "9", rx: "0.5" })
] });
var PlayGlyph = () => /* @__PURE__ */ jsxRuntime.jsx("svg", { viewBox: "0 0 12 12", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M3 1.5 L10.5 6 L3 10.5 Z" }) });
var ReplayGlyph = () => /* @__PURE__ */ jsxRuntime.jsxs("svg", { viewBox: "0 0 12 12", "aria-hidden": "true", children: [
  /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M6 1.5a4.5 4.5 0 1 1-4.2 2.9", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round" }),
  /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M1.5 1.5v3h3z" })
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
  const opener = react.useRef(null);
  const auto = react.useId();
  const figId = id ?? `uipack-${auto.replace(/:/g, "")}`;
  const reduced = chunkYMPVJRTJ_cjs.usePrefersReducedMotion();
  const [playing, setPlaying] = react.useState(true);
  const [cycle, setCycle] = react.useState(0);
  const [expanded, setExpanded] = react.useState(false);
  const [zoom, setZoom] = react.useState(1);
  const [selected, select] = react.useState(null);
  const [hoverFlow, setHoverFlow] = react.useState(null);
  const [hoverKind, setHoverKind] = react.useState(null);
  const hover = react.useMemo(
    () => ({
      flow: selected?.flow ?? hoverFlow,
      kind: hoverKind,
      setFlow: setHoverFlow,
      setKind: setHoverKind
    }),
    [hoverFlow, hoverKind, selected]
  );
  const canvasRef = react.useRef(null);
  const noteRef = react.useRef(null);
  const [notePos, setNotePos] = react.useState(null);
  const wideRef = react.useRef(null);
  const narrowRef = react.useRef(null);
  const wideW = useRenderedWidth(wideRef, measuredWidth, expanded);
  const narrowW = useRenderedWidth(narrowRef, measuredWidth, expanded);
  const wideScale = react.useMemo(() => ({ floor: chunkXEK5V7KF_cjs.fontFloor(vbWidth(viewBox), wideW, minFont) }), [viewBox, wideW, minFont]);
  const narrowScale = react.useMemo(
    () => ({
      floor: chunkXEK5V7KF_cjs.fontFloor(vbWidth(narrowViewBox ?? viewBox), narrowW, minFont)
    }),
    [narrowViewBox, viewBox, narrowW, minFont]
  );
  const svgs = () => [wideRef.current, narrowRef.current].filter(Boolean);
  react.useEffect(() => {
    for (const s of svgs()) {
      if (typeof s.pauseAnimations !== "function") continue;
      if (playing) s.unpauseAnimations();
      else s.pauseAnimations();
    }
  }, [playing, expanded]);
  const toggle = react.useCallback(() => setPlaying((p) => !p), []);
  const replay = react.useCallback(() => {
    for (const s of svgs()) {
      if (typeof s.setCurrentTime === "function") s.setCurrentTime(0);
      if (typeof s.unpauseAnimations === "function") s.unpauseAnimations();
    }
    setPlaying(true);
    setCycle((c) => c + 1);
  }, []);
  const motion = react.useMemo(
    () => ({ playing: playing && !reduced, reduced, cycle, toggle, replay }),
    [playing, reduced, cycle, toggle, replay]
  );
  const note = selected?.detail ? selected : null;
  chunkYMPVJRTJ_cjs.useIsoLayoutEffect(() => {
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
  useRovingFocus(canvasRef, expanded);
  const showControls = controls && !reduced;
  const hasHead = expandable || number || eyebrow || title || caption || legend.length || showControls;
  return /* @__PURE__ */ jsxRuntime.jsx(
    chunk5QNGHC2A_cjs.CanvasView,
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
      layout: "figure",
      zoom: { value: zoom, min: 1, max: 3, onChange: setZoom },
      children: /* @__PURE__ */ jsxRuntime.jsx(SelectionContext.Provider, { value: { enabled: true, selected, select }, children: /* @__PURE__ */ jsxRuntime.jsx(chunkXEK5V7KF_cjs.FigureMotionContext.Provider, { value: motion, children: /* @__PURE__ */ jsxRuntime.jsx(FigureHoverContext.Provider, { value: hover, children: /* @__PURE__ */ jsxRuntime.jsxs(
        "figure",
        {
          id: figId,
          className: ["uipack", narrow ? "uipack--has-narrow" : "", expanded ? "uipack--expanded" : "", className ?? ""].join(" ").trim(),
          "data-theme": theme,
          "data-hover-flow": hoverFlow ?? void 0,
          "data-hover-kind": hoverKind ?? void 0,
          onKeyDown: (e) => {
            if (e.key === "Escape") select(null);
          },
          style: {
            // Opened, the canvas content is a flex column: auto centres it.
            margin: expanded ? "auto 0" : 0,
            "--figure-width": `${vbWidth(viewBox)}px`
          },
          children: [
            hasHead ? /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "uipack__head", children: [
              number || eyebrow ? /* @__PURE__ */ jsxRuntime.jsxs("p", { className: "uipack__eyebrow", children: [
                number,
                number && eyebrow ? " \xB7 " : "",
                eyebrow
              ] }) : null,
              title ? react.createElement(`h${headingLevel}`, { className: "uipack__title" }, title) : null,
              caption ? /* @__PURE__ */ jsxRuntime.jsx("p", { className: "uipack__caption", children: caption }) : null,
              showControls || expandable ? /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "uipack__controls", children: [
                expandable && !expanded && /* @__PURE__ */ jsxRuntime.jsx(
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
                showControls && /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntime.jsxs("button", { type: "button", className: "uipack__ctl uipack__ctl--motion", onClick: replay, children: [
                    /* @__PURE__ */ jsxRuntime.jsx(ReplayGlyph, {}),
                    " Replay"
                  ] }),
                  /* @__PURE__ */ jsxRuntime.jsxs(
                    "button",
                    {
                      type: "button",
                      className: "uipack__ctl uipack__ctl--motion",
                      onClick: toggle,
                      "aria-pressed": !playing,
                      children: [
                        playing ? /* @__PURE__ */ jsxRuntime.jsx(PauseGlyph, {}) : /* @__PURE__ */ jsxRuntime.jsx(PlayGlyph, {}),
                        " ",
                        playing ? "Pause" : "Play"
                      ]
                    }
                  )
                ] })
              ] }) : null,
              /* @__PURE__ */ jsxRuntime.jsx(Legend, { items: legend })
            ] }) : null,
            /* @__PURE__ */ jsxRuntime.jsx("p", { className: "uipack__sr", role: "status", children: note ? `${note.label}: ${note.detail}` : "" }),
            /* @__PURE__ */ jsxRuntime.jsxs("div", { ref: canvasRef, className: `uipack__canvas uipack__canvas--${background}`, onClick: () => select(null), children: [
              note ? /* @__PURE__ */ jsxRuntime.jsxs(
                "div",
                {
                  ref: noteRef,
                  className: "uipack__note",
                  "aria-hidden": "true",
                  "data-placed": notePos ? "true" : void 0,
                  style: notePos ?? void 0,
                  onClick: (e) => e.stopPropagation(),
                  children: [
                    /* @__PURE__ */ jsxRuntime.jsx("strong", { children: note.label }),
                    /* @__PURE__ */ jsxRuntime.jsx("span", { children: note.detail })
                  ]
                }
              ) : null,
              /* @__PURE__ */ jsxRuntime.jsx(
                "svg",
                {
                  ref: wideRef,
                  className: "uipack--wide",
                  style: expanded ? { width: `max(${zoom * 100}%, ${800 * zoom}px)` } : void 0,
                  viewBox,
                  role: "group",
                  "aria-label": alt,
                  children: /* @__PURE__ */ jsxRuntime.jsx(chunkXEK5V7KF_cjs.FigureScaleContext.Provider, { value: wideScale, children })
                }
              ),
              narrow ? /* @__PURE__ */ jsxRuntime.jsx(
                "svg",
                {
                  ref: narrowRef,
                  className: "uipack--narrow",
                  viewBox: narrowViewBox ?? viewBox,
                  role: "group",
                  "aria-label": alt,
                  children: /* @__PURE__ */ jsxRuntime.jsx(chunkXEK5V7KF_cjs.FigureScaleContext.Provider, { value: narrowScale, children: narrow })
                }
              ) : null
            ] })
          ]
        }
      ) }) }) })
    }
  );
}
function Lane({ x, w, y, title, h, size: size0 = 11 }) {
  const size = chunkXEK5V7KF_cjs.useFontFloor(size0);
  return /* @__PURE__ */ jsxRuntime.jsxs("g", { "data-uipack": "lane", children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      "text",
      {
        x: x + w / 2,
        y,
        textAnchor: "middle",
        fontSize: size,
        fontWeight: 700,
        fontFamily: "var(--uipack-mono)",
        letterSpacing: ".08em",
        fill: "currentColor",
        children: title.toUpperCase()
      }
    ),
    h ? /* @__PURE__ */ jsxRuntime.jsx("line", { x1: x + w, y1: y + 12, x2: x + w, y2: y + h, stroke: "currentColor", strokeOpacity: 0.15, strokeDasharray: "2 6" }) : null
  ] });
}
function Group({ x, y, w, h, title, variant = "solid", accent, flow, titleSize, hint, children }) {
  const hover = useFigureHover();
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  const dashed = variant === "dashed";
  const ts = chunkXEK5V7KF_cjs.useFontFloor(titleSize ?? (dashed ? 11 : 14));
  const selection = useItemSelection(title ?? "Group", hint);
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "g",
    {
      "data-uipack": "group",
      "data-selected": "data-selected" in selection ? selection["data-selected"] : void 0,
      ...hoverAttrs(flow, void 0, hover),
      children: [
        /* @__PURE__ */ jsxRuntime.jsxs("g", { className: "uipack__group-frame", ...selection, children: [
          /* @__PURE__ */ jsxRuntime.jsx(
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
          title ? dashed ? /* @__PURE__ */ jsxRuntime.jsx(
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
          ) : /* @__PURE__ */ jsxRuntime.jsx("text", { x: x + w / 2, y: y + 24, textAnchor: "middle", fontSize: ts, fontWeight: 600, fill: stroke, children: title }) : null
        ] }),
        children
      ]
    }
  );
}
var icons = {
  db: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("ellipse", { cx: "8", cy: "3.5", rx: "6", ry: "2.5" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M2 3.5v9c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-9" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M2 8c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" })
  ] }),
  cache: /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z" }) }),
  queue: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("rect", { x: "1.5", y: "4", width: "13", height: "8", rx: "1.5" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M5 4v8M9 4v8" })
  ] }),
  service: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("rect", { x: "2", y: "2", width: "12", height: "12", rx: "2" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M5 8h6M8 5v6" })
  ] }),
  client: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("rect", { x: "1.5", y: "3", width: "13", height: "8", rx: "1.5" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M5.5 14h5M8 11v3" })
  ] }),
  blob: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 1.5 14 5v6l-6 3.5L2 11V5z" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 8l6-3M8 8 2 5M8 8v6.5" })
  ] }),
  agent: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "8", cy: "5", r: "3" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M2.5 14.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 1v1" })
  ] }),
  doc: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M4 1.5h5.5L13 5v9.5H4z" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M9.5 1.5V5H13M6 8h4M6 11h4" })
  ] }),
  model: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("rect", { x: "2", y: "4", width: "12", height: "8", rx: "2" }),
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "5.5", cy: "8", r: "1", fill: "currentColor" }),
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "8", cy: "8", r: "1", fill: "currentColor" }),
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "10.5", cy: "8", r: "1", fill: "currentColor" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 1.5V4M8 12v2.5" })
  ] }),
  tool: /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M10.5 2a3.5 3.5 0 0 0-3.3 4.7L2 11.9l2.1 2.1 5.2-5.2A3.5 3.5 0 0 0 14 5.5L11.8 7.7 9.3 6.2l-1-2.4z" }) }),
  gateway: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M2 8h12M2 8l3-3M2 8l3 3M14 8l-3-3M14 8l-3 3" }),
    /* @__PURE__ */ jsxRuntime.jsx("rect", { x: "6", y: "5.5", width: "4", height: "5", rx: "1", fill: "var(--uipack-surface, #fff)" })
  ] }),
  lock: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("rect", { x: "3", y: "7", width: "10", height: "7.5", rx: "1.5" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M5.5 7V5a2.5 2.5 0 0 1 5 0v2" }),
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "8", cy: "10.75", r: "1", fill: "currentColor" })
  ] }),
  key: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "5.5", cy: "8", r: "3" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8.5 8H14M12 8v2.5M10 8v2" })
  ] }),
  clock: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "8", cy: "8", r: "6" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 4.5V8l2.5 1.5" })
  ] }),
  cron: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "8", cy: "8.5", r: "5" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 5.5v3l2 1M5 2l-2.5 2M11 2l2.5 2" })
  ] }),
  browser: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("rect", { x: "1.5", y: "2.5", width: "13", height: "11", rx: "1.5" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M1.5 6h13M4 4.25h.01M6 4.25h.01" })
  ] }),
  terminal: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("rect", { x: "1.5", y: "2.5", width: "13", height: "11", rx: "1.5" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M4.5 6l2.5 2-2.5 2M8.5 10.5h3" })
  ] }),
  git: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "4.5", cy: "3.5", r: "1.75" }),
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "4.5", cy: "12.5", r: "1.75" }),
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "11.5", cy: "5.5", r: "1.75" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M4.5 5.25v5.5M11.5 7.25c0 2.5-2 3-4 3.25a3 3 0 0 0-3 .5" })
  ] }),
  cloud: /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M4.5 13a3 3 0 0 1-.4-6A4 4 0 0 1 12 6.5a3.25 3.25 0 0 1 0 6.5z" }) }),
  region: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 14.5s4.5-4.2 4.5-8A4.5 4.5 0 0 0 3.5 6.5c0 3.8 4.5 8 4.5 8z" }),
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "8", cy: "6.5", r: "1.5" })
  ] }),
  user: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "8", cy: "5.5", r: "3" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M2.5 14.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" })
  ] }),
  robot: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("rect", { x: "3", y: "5", width: "10", height: "8", rx: "2" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 2v3M6 13v1.5M10 13v1.5M1.5 8.5v2M14.5 8.5v2" }),
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "6", cy: "8.5", r: "1", fill: "currentColor" }),
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "10", cy: "8.5", r: "1", fill: "currentColor" })
  ] }),
  chart: /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M2 14h12M4 11V7M8 11V4M12 11V8.5" }) }),
  warning: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 2 14.5 13.5h-13z" }),
    /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 6.5v3.5M8 12.25h.01" })
  ] }),
  more: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "3", cy: "8", r: "1", fill: "currentColor" }),
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "8", cy: "8", r: "1", fill: "currentColor" }),
    /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: "13", cy: "8", r: "1", fill: "currentColor" })
  ] })
};
var nodeName = (label, sub) => sub ? `${label}, ${sub}` : label;
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
  id,
  inlay
}) {
  const hover = useFigureHover();
  const size = chunkXEK5V7KF_cjs.useFontFloor(size0);
  const subSize = chunkXEK5V7KF_cjs.useFontFloor(subSize0);
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
  const name = nodeName(label, sub);
  const selection = useItemSelection(label, hint, flows[0], !href && !!label, name);
  const body = /* @__PURE__ */ jsxRuntime.jsxs("g", { id, "data-uipack": "node", ...hoverAttrs(flow, void 0, hover), ...handlers, ...selection, children: [
    hint && !selection.role ? /* @__PURE__ */ jsxRuntime.jsx("title", { children: hint }) : null,
    /* @__PURE__ */ jsxRuntime.jsx(
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
    inlay,
    /* @__PURE__ */ jsxRuntime.jsx(
      "path",
      {
        className: "uipack__touch-target",
        d: `M ${x} ${y - Math.max(0, 54 - h) / 2} h ${w} v ${Math.max(h, 54)} h ${-w} Z`,
        fill: "transparent",
        stroke: "none",
        "aria-hidden": "true"
      }
    ),
    glyph ? /* @__PURE__ */ jsxRuntime.jsx(
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
    /* @__PURE__ */ jsxRuntime.jsx(
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
    sub ? " " : null,
    sub ? /* @__PURE__ */ jsxRuntime.jsx(
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
  ] });
  return href ? /* @__PURE__ */ jsxRuntime.jsx("a", { href, className: "uipack__link", "aria-label": name, children: body }) : body;
}
function Chip({ x, y, w, h = 24, label, dashed, kind, flow, size: size0 = 10, hint }) {
  const hover = useFigureHover();
  const size = chunkXEK5V7KF_cjs.useFontFloor(size0);
  const fill = !kind ? "var(--uipack-surface)" : kind === "accent" ? "var(--uipack-accent)" : `var(--uipack-token-${kind})`;
  const selection = useItemSelection(label || "Empty slot", hint);
  return /* @__PURE__ */ jsxRuntime.jsxs("g", { "data-uipack": "chip", ...hoverAttrs(flow, kind === "accent" ? void 0 : kind, hover), ...selection, children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      "rect",
      {
        x,
        y,
        width: w,
        height: h,
        rx: h / 2,
        fill,
        style: kind ? { fillOpacity: "var(--uipack-chip-tint, 0.55)" } : void 0,
        stroke: "currentColor",
        strokeOpacity: dashed ? 0.5 : 0.8,
        strokeWidth: 1.25,
        strokeDasharray: dashed ? "3 3" : void 0
      }
    ),
    label ? /* @__PURE__ */ jsxRuntime.jsx(
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
function connectorStroke(kind) {
  if (!kind) return "currentColor";
  return kind === "accent" ? "var(--uipack-accent)" : `var(--uipack-token-${kind})`;
}
function Connector({
  points,
  defs,
  arrow = true,
  dashed,
  kind,
  flow,
  id,
  radius = 6,
  strokeWidth = 1.25,
  inset = 2
}) {
  const hover = useFigureHover();
  const [s, e] = Array.isArray(inset) ? inset : [inset, inset];
  const d = pathFromPoints(trim(points, s, arrow ? e + 2 : e), radius);
  const head = defs ? `url(#${defs}-head${kind ? `-${kind}` : ""})` : void 0;
  return /* @__PURE__ */ jsxRuntime.jsx(
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
function busStub(props, stub) {
  return props.axis === "h" ? [
    [stub.at, props.at],
    [stub.at, stub.to]
  ] : [
    [props.at, stub.at],
    [stub.to, stub.at]
  ];
}
function busStubs(props) {
  return props.stubs.map((s) => busStub(props, s));
}
function Bus({ axis = "v", at, from, to, stubs, kind, flow, defs, dots = true, id }) {
  const hover = useFigureHover();
  const trunk = axis === "h" ? [
    [from, at],
    [to, at]
  ] : [
    [at, from],
    [at, to]
  ];
  return /* @__PURE__ */ jsxRuntime.jsxs("g", { id, "data-uipack": "bus", ...hoverAttrs(flow, kind, hover), children: [
    /* @__PURE__ */ jsxRuntime.jsx(Connector, { points: trunk, arrow: false, kind, flow, inset: 0 }),
    stubs.map((s, i) => /* @__PURE__ */ jsxRuntime.jsx(
      Connector,
      {
        points: busStub({ axis, at }, s),
        defs,
        arrow: !!s.arrow,
        kind,
        flow: s.flow ?? flow,
        inset: [0, 2]
      },
      i
    )),
    dots ? stubs.map((s, i) => {
      const [cx, cy] = axis === "h" ? [s.at, at] : [at, s.at];
      return /* @__PURE__ */ jsxRuntime.jsx(
        "circle",
        {
          "data-uipack": "junction",
          cx,
          cy,
          r: 2.5,
          fill: connectorStroke(kind),
          fillOpacity: kind ? 1 : 0.7
        },
        i
      );
    }) : null
  ] });
}
function Packet({
  points,
  kind = "request",
  shape,
  dur = 3,
  delay = 0,
  at,
  r = 5,
  reverse,
  radius = 6,
  flow,
  trim: t,
  id
}) {
  const { reduced, prerender } = chunkXEK5V7KF_cjs.useFigureMotion();
  const hover = useFigureHover();
  const [ts, te] = t ?? [r + 2, 12];
  const trimmed = trim(points, ts, te);
  const pts = reverse ? [...trimmed].reverse() : trimmed;
  const staticAt = at ?? ((0.5 + delay / dur) % 1 + 1) % 1;
  const d = pathFromPoints(pts, radius);
  const [mounted, setMounted] = react.useState(false);
  react.useEffect(() => setMounted(true), []);
  const attrs = hoverAttrs(flow, kind === "neutral" ? void 0 : kind, hover);
  const pre = prerender || globalThis.__UIPACK_PRERENDER__ === true;
  if (reduced || !mounted && !pre) {
    const [cx, cy] = pointAlong(pts, staticAt);
    return /* @__PURE__ */ jsxRuntime.jsx("g", { id, "data-uipack": "packet", "data-static": "true", ...attrs, children: /* @__PURE__ */ jsxRuntime.jsx(chunkXEK5V7KF_cjs.Token, { kind, shape, r, cx, cy }) });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs("g", { id, "data-uipack": "packet", ...attrs, children: [
    /* @__PURE__ */ jsxRuntime.jsx(chunkXEK5V7KF_cjs.Token, { kind, shape, r }),
    /* @__PURE__ */ jsxRuntime.jsx("animateMotion", { dur: `${dur}s`, begin: `${delay}s`, repeatCount: "indefinite", path: d, calcMode: "linear" })
  ] });
}
function Label({ x, y, text, anchor: anchor2 = "start", accent, size: size0 = 11, font = "mono" }) {
  const size = chunkXEK5V7KF_cjs.useFontFloor(size0);
  const w = text.length * size * (font === "mono" ? 0.62 : 0.55) + 8;
  const rx = anchor2 === "middle" ? x - w / 2 : anchor2 === "end" ? x - w + 4 : x - 4;
  return /* @__PURE__ */ jsxRuntime.jsxs("g", { "data-uipack": "label", children: [
    /* @__PURE__ */ jsxRuntime.jsx("rect", { x: rx, y: y - size + 1, width: w, height: size + 5, fill: "var(--uipack-bg)" }),
    /* @__PURE__ */ jsxRuntime.jsx(
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
function Defs({ id }) {
  const head = (suffix, fill) => /* @__PURE__ */ jsxRuntime.jsx(
    "marker",
    {
      id: `${id}-head${suffix}`,
      markerWidth: "8",
      markerHeight: "8",
      refX: "7",
      refY: "4",
      orient: "auto-start-reverse",
      markerUnits: "userSpaceOnUse",
      children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M0,0 L8,4 L0,8 z", fill })
    }
  );
  return /* @__PURE__ */ jsxRuntime.jsxs("defs", { children: [
    head("", "currentColor"),
    head("-accent", "var(--uipack-accent)"),
    head("-request", "var(--uipack-token-request)"),
    head("-response", "var(--uipack-token-response)"),
    head("-change", "var(--uipack-token-change)")
  ] });
}

exports.Bus = Bus;
exports.Chip = Chip;
exports.Connector = Connector;
exports.Defs = Defs;
exports.Figure = Figure;
exports.FigureHoverContext = FigureHoverContext;
exports.Group = Group;
exports.Label = Label;
exports.Lane = Lane;
exports.Legend = Legend;
exports.Node = Node;
exports.Packet = Packet;
exports.PauseGlyph = PauseGlyph;
exports.PlayGlyph = PlayGlyph;
exports.ReplayGlyph = ReplayGlyph;
exports.SelectionContext = SelectionContext;
exports.anchor = anchor;
exports.busStub = busStub;
exports.busStubs = busStubs;
exports.connectorStroke = connectorStroke;
exports.flowList = flowList;
exports.grid = grid;
exports.hoverAttrs = hoverAttrs;
exports.icons = icons;
exports.nodeName = nodeName;
exports.pathFromPoints = pathFromPoints;
exports.placeNote = placeNote;
exports.pointAlong = pointAlong;
exports.polylineLength = polylineLength;
exports.route = route;
exports.trim = trim;
exports.useFigureHover = useFigureHover;
exports.useRovingFocus = useRovingFocus;
