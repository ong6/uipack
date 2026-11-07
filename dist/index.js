import { useLayerFlight, zoomSamples, zoomFrame } from './chunk-H33EHDSS.js';
export { innerClipStart, zoomFrame, zoomSamples } from './chunk-H33EHDSS.js';
import { useFigureHover, hoverAttrs, connectorStroke, flowList, useItemSelection, FocusRing, Node, nodeName, SelectionContext, isPointer, useRovingFocus, FigureHoverContext, Legend, ReplayGlyph, PauseGlyph, PlayGlyph, placeNote } from './chunk-2LRCXHQS.js';
export { Bus, Chip, Connector, Defs, FIGURE_GRID, Figure, FigureHoverContext, Group, Label, Lane, Legend, Node, PACKET_POP, PACKET_SINK, Packet, anchor, busStub, busStubs, connectorStroke, flowList, grid, hoverAttrs, icons, isPointer, packetScaleKeys, pathFromPoints, pointAlong, polylineLength, route, trim, useFigureHover } from './chunk-2LRCXHQS.js';
import { useFontFloor, FigureScaleContext } from './chunk-OBRYIOBM.js';
export { DEFAULT_RENDER_WIDTH, FigureScaleProvider, TOKEN_SHAPE, Token, fontFloor, tokenColor, useFontFloor } from './chunk-OBRYIOBM.js';
import { CanvasView } from './chunk-MKST5NJE.js';
export { isUiStyle, readStyle, sectionOrder, sharedSectionOrder, styleBootPlugin, styleBootScript, uiStyles } from './chunk-D5NPU7EV.js';
import { smoothstep } from './chunk-V4CVL4FJ.js';
export { easeInOutCubic, smoothstep } from './chunk-V4CVL4FJ.js';
import { FigureMotionContext } from './chunk-63XCOWAV.js';
export { FigureChromeContext, FigureLayoutWidthContext, FigureMotionContext, useFigureMotion } from './chunk-63XCOWAV.js';
import { usePrefersReducedMotion, useLatest, useIsoLayoutEffect } from './chunk-LWCZ6GEJ.js';
export { usePrefersReducedMotion } from './chunk-LWCZ6GEJ.js';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useId, useRef, useState, useEffect, createContext, useMemo, useCallback, createElement, useContext, memo } from 'react';

function Badge({ cx, cy, text, accent, r = 9, size: size0 = 10 }) {
  const size = useFontFloor(size0);
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  return /* @__PURE__ */ jsxs("g", { "data-uipack": "badge", children: [
    /* @__PURE__ */ jsx("circle", { cx, cy, r, fill: "var(--uipack-bg)", stroke, strokeOpacity: accent ? 1 : 0.6, strokeWidth: 1.25 }),
    /* @__PURE__ */ jsx(
      "text",
      {
        x: cx,
        y: cy + size * 0.35,
        textAnchor: "middle",
        fontSize: size,
        fontFamily: "var(--uipack-mono)",
        fontWeight: 600,
        fill: stroke,
        children: text
      }
    )
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
    return /* @__PURE__ */ jsx(
      "rect",
      {
        ...r,
        rx: 2,
        fill: "var(--uipack-surface-raised)",
        stroke: "currentColor",
        strokeOpacity: 0.55,
        strokeWidth: 1.25
      },
      a
    );
  }) });
}
function Cross({ x, y, r = 5, kind }) {
  return /* @__PURE__ */ jsxs(
    "g",
    {
      "data-uipack": "cross",
      stroke: connectorStroke(kind),
      strokeOpacity: kind ? 1 : 0.8,
      strokeWidth: 1.75,
      strokeLinecap: "round",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsx("line", { x1: x - r, y1: y - r, x2: x + r, y2: y + r }),
        /* @__PURE__ */ jsx("line", { x1: x - r, y1: y + r, x2: x + r, y2: y - r })
      ]
    }
  );
}
function TreeRail({ x, y, rows, to }) {
  if (!rows.length) return null;
  const end = Math.max(...rows);
  const d = [`M${x},${y} V${end}`, ...rows.map((r, i) => `M${x},${r} H${Array.isArray(to) ? to[i] : to}`)].join(" ");
  return /* @__PURE__ */ jsxs("g", { "data-uipack": "tree-rail", children: [
    /* @__PURE__ */ jsx("path", { d, fill: "none", stroke: "currentColor", strokeOpacity: 0.8, strokeWidth: 1.25 }),
    rows.map((r) => /* @__PURE__ */ jsx("circle", { "data-uipack": "junction", cx: x, cy: r, r: 2.5, fill: "currentColor", fillOpacity: 0.7 }, r))
  ] });
}
var wash = { fill: "var(--uipack-accent)", fillOpacity: 0.16 };
var paper = { fill: "var(--uipack-surface)" };
function FolderMark({ x, y, size = 22, tint = true }) {
  const w = size;
  const h = Math.round(size * 0.72);
  const t = y - h / 2;
  const tab = w * 0.38;
  const d = `M${x + 2},${t} H${x + tab} L${x + tab + 3},${t + 3} H${x + w - 2} Q${x + w},${t + 3} ${x + w},${t + 5} V${t + h - 2} Q${x + w},${t + h} ${x + w - 2},${t + h} H${x + 2} Q${x},${t + h} ${x},${t + h - 2} V${t + 2} Q${x},${t} ${x + 2},${t} Z`;
  return /* @__PURE__ */ jsx(
    "path",
    {
      "data-uipack": "folder-mark",
      d,
      ...tint ? wash : paper,
      stroke: "currentColor",
      strokeWidth: 1.25,
      strokeLinejoin: "round"
    }
  );
}
function FileMark({ x, y, size = 16, tint = false }) {
  const w = size;
  const h = Math.round(size * 1.25);
  const t = y - h / 2;
  const f = w * 0.34;
  const d = `M${x},${t} H${x + w - f} L${x + w},${t + f} V${t + h} H${x} Z M${x + w - f},${t} V${t + f} H${x + w}`;
  return /* @__PURE__ */ jsx(
    "path",
    {
      "data-uipack": "file-mark",
      d,
      ...tint ? wash : paper,
      stroke: "currentColor",
      strokeWidth: 1.25,
      strokeLinejoin: "round"
    }
  );
}
function Sheet({
  x,
  y,
  w,
  h,
  name,
  title,
  note,
  titleX = 20,
  head: head0,
  accent,
  children,
  size: size0 = 16,
  flow,
  hint
}) {
  const hover = useFigureHover();
  const flows = flowList(flow);
  const label = title ?? name ?? "File";
  const selection = useItemSelection(label, hint, flows[0], true, name || title ? null : label);
  const handlers = flows.length ? {
    onPointerEnter: (e) => isPointer(e) && hover.setFlow(flows[0]),
    onPointerLeave: (e) => isPointer(e) && hover.setFlow(null)
  } : {};
  const size = useFontFloor(size0);
  const eyebrow = useFontFloor(12);
  const noteSize = useFontFloor(size0 - 2);
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  const head = head0 ?? (name ? 76 : 52);
  const pad = 20;
  const top = name ? 30 : 0;
  const rowY = (children ? y + top + (head - top) / 2 : y + top + (h - top) / 2) - (name ? 2 : 0);
  return /* @__PURE__ */ jsxs("g", { "data-uipack": "sheet", ...hoverAttrs(flow, void 0, hover), ...handlers, ...selection, children: [
    /* @__PURE__ */ jsx(
      "rect",
      {
        x,
        y,
        width: w,
        height: h,
        rx: 6,
        fill: "var(--uipack-surface)",
        stroke,
        strokeOpacity: accent ? 1 : 0.8,
        strokeWidth: 1.25
      }
    ),
    selection.role ? /* @__PURE__ */ jsx(FocusRing, { x, y, w, h, rx: 6 }) : null,
    name ? /* @__PURE__ */ jsx(
      "text",
      {
        x: x + pad,
        y: y + 24,
        fontSize: eyebrow,
        fontFamily: "var(--uipack-mono)",
        letterSpacing: ".08em",
        fontWeight: 600,
        fill: stroke,
        fillOpacity: accent ? 1 : 0.75,
        children: name.toUpperCase()
      }
    ) : null,
    title || note ? /* @__PURE__ */ jsxs("text", { x: x + titleX, y: rowY + size * 0.36, fontSize: size, fontWeight: 600, fill: "currentColor", children: [
      title,
      note ? /* @__PURE__ */ jsx("tspan", { dx: title ? 12 : 0, fontSize: noteSize, fontWeight: 400, fillOpacity: 0.72, children: note }) : null
    ] }) : null,
    children ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "line",
        {
          x1: x + pad,
          x2: x + w - pad,
          y1: y + head,
          y2: y + head,
          stroke: "currentColor",
          strokeOpacity: 0.35,
          strokeWidth: 1.25,
          strokeDasharray: "2 4"
        }
      ),
      children
    ] }) : null
  ] });
}
var r1 = (n) => Math.round(n * 10) / 10;
function curveSegments(pts) {
  const n = pts.length;
  const d = pts.slice(0, -1).map((p, i) => (pts[i + 1][1] - p[1]) / (pts[i + 1][0] - p[0] || 1));
  const m = pts.map((_, i) => i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return pts.slice(0, -1).map((p, i) => {
    const q = pts[i + 1];
    const h = (q[0] - p[0]) / 3;
    return [p, [p[0] + h, p[1] + m[i] * h], [q[0] - h, q[1] - m[i + 1] * h], q];
  });
}
var cubic = (a, b, c, d, t) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d;
function curveAt(pts, x) {
  const segs = curveSegments(pts);
  const seg = segs.find((s) => x <= s[3][0]) ?? segs[segs.length - 1];
  const t = Math.min(1, Math.max(0, (x - seg[0][0]) / (seg[3][0] - seg[0][0] || 1)));
  return cubic(seg[0][1], seg[1][1], seg[2][1], seg[3][1], t);
}
function Pin({
  x,
  y,
  rise,
  label,
  accent,
  back,
  right,
  size
}) {
  const ink = accent ? "var(--uipack-accent)" : "currentColor";
  const text = label.toUpperCase();
  const tw = text.length * size * 0.62 + text.length * size * 0.08;
  const left = back || x + 10 + tw > right;
  const ty = y - rise;
  const tx = left ? x - 10 : x + 10;
  return /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx(
      "path",
      {
        d: `M${x},${y} V${ty} H${left ? x - 6 : x + 6}`,
        fill: "none",
        stroke: ink,
        strokeOpacity: accent ? 1 : 0.6,
        strokeWidth: 1
      }
    ),
    /* @__PURE__ */ jsx("rect", { x: left ? tx - tw - 4 : tx - 4, y: ty - size * 0.7, width: tw + 8, height: size * 1.4, fill: "var(--uipack-bg)" }),
    /* @__PURE__ */ jsx(
      "text",
      {
        x: tx,
        y: ty + size * 0.36,
        textAnchor: left ? "end" : "start",
        fontSize: size,
        fontFamily: "var(--uipack-mono)",
        letterSpacing: ".08em",
        fontWeight: 600,
        fill: ink,
        children: text
      }
    )
  ] });
}
function CurvePlot({ x, y, w, h, points, xTitle, yTitle, xEnds, notes = [], measure, size: size0 = 14 }) {
  const small = useFontFloor(size0 - 2);
  const bottom = y + h;
  const px = (u) => r1(x + u * w);
  const py = (v) => r1(bottom - v * h);
  const segs = curveSegments(points);
  const d = `M${px(points[0][0])},${py(points[0][1])} ` + segs.map(([, c1, c2, p]) => `C${px(c1[0])},${py(c1[1])} ${px(c2[0])},${py(c2[1])} ${px(p[0])},${py(p[1])}`).join(" ");
  const head = 6;
  const tracked = { fontFamily: "var(--uipack-mono)", letterSpacing: ".1em", fontWeight: 400 };
  return /* @__PURE__ */ jsxs("g", { "data-uipack": "curve-plot", children: [
    /* @__PURE__ */ jsx(
      "path",
      {
        d: `M${x},${y - 12} V${bottom} H${x + w + 12} M${x - head / 1.4},${y - 12 + head} L${x},${y - 12} L${x + head / 1.4},${y - 12 + head} M${x + w + 12 - head},${bottom - head / 1.4} L${x + w + 12},${bottom} L${x + w + 12 - head},${bottom + head / 1.4}`,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.25,
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }
    ),
    yTitle ? /* @__PURE__ */ jsx(
      "text",
      {
        transform: `translate(${x - 18}, ${y + h / 2}) rotate(-90)`,
        textAnchor: "middle",
        fontSize: small,
        fill: "currentColor",
        ...tracked,
        children: yTitle.toUpperCase()
      }
    ) : null,
    xTitle ? /* @__PURE__ */ jsx("text", { x: x + w / 2, y: bottom + 26, textAnchor: "middle", fontSize: small, fill: "currentColor", ...tracked, children: xTitle.toUpperCase() }) : null,
    xEnds ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("text", { x, y: bottom + 26, fontSize: small, fill: "currentColor", fillOpacity: 0.8, children: xEnds[0] }),
      /* @__PURE__ */ jsx("text", { x: x + w + 12, y: bottom + 26, textAnchor: "end", fontSize: small, fill: "currentColor", fillOpacity: 0.8, children: xEnds[1] })
    ] }) : null,
    /* @__PURE__ */ jsx("path", { d, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" }),
    measure ? (() => {
      const mx = px(measure.at);
      const top = py(curveAt(points, measure.at)) + 3;
      const end = bottom - 1;
      const cap = 5;
      return /* @__PURE__ */ jsxs("g", { "data-uipack": "curve-measure", children: [
        /* @__PURE__ */ jsx(
          "path",
          {
            d: `M${mx},${top} V${end} M${mx - cap},${top} H${mx + cap} M${mx - cap},${end} H${mx + cap}`,
            fill: "none",
            stroke: "var(--uipack-accent)",
            strokeWidth: 1.5
          }
        ),
        /* @__PURE__ */ jsx(Pin, { x: mx, y: top - 6, rise: 22, label: measure.label, accent: true, right: x + w + 12, size: small })
      ] });
    })() : null,
    notes.map((n) => {
      const cx = px(n.at);
      const cy = py(curveAt(points, n.at));
      return /* @__PURE__ */ jsxs("g", { "data-uipack": "curve-note", children: [
        /* @__PURE__ */ jsx(
          Pin,
          {
            x: cx,
            y: cy - (n.accent ? 9 : 4),
            rise: Math.abs(n.dy ?? 24),
            label: n.label,
            accent: n.accent,
            back: (n.dx ?? 1) < 0,
            right: x + w + 12,
            size: small
          }
        ),
        n.accent ? /* @__PURE__ */ jsx("circle", { cx, cy, r: 5, fill: "var(--uipack-bg)", stroke: "var(--uipack-accent)", strokeWidth: 3 }) : null
      ] }, n.label);
    })
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
    /* @__PURE__ */ jsx(
      "text",
      {
        x: "40",
        y: "22",
        fontSize: "18",
        fontWeight: 600,
        fontFamily: "var(--uipack-mono, var(--ui-font-label, ui-monospace, monospace))",
        letterSpacing: ".02em",
        fill: "currentColor",
        children: "uipack"
      }
    )
  ] });
}
var BackGlyph = () => /* @__PURE__ */ jsx("svg", { viewBox: "0 0 12 12", "aria-hidden": "true", children: /* @__PURE__ */ jsx(
  "path",
  {
    d: "M7.5 2.5 4 6l3.5 3.5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }
) });
function DrillCrumbs({
  crumbs,
  labelOf,
  navigate,
  currentRef
}) {
  const depth = crumbs.length - 1;
  return /* @__PURE__ */ jsx("nav", { className: "uipack-drill__crumbs", "aria-label": "Figure levels", children: /* @__PURE__ */ jsx("ol", { children: crumbs.map((lid, i) => /* @__PURE__ */ jsxs("li", { children: [
    i > 0 ? /* @__PURE__ */ jsx("span", { className: "uipack-drill__sep", "aria-hidden": "true", children: "\u203A" }) : null,
    i < depth ? /* @__PURE__ */ jsx("button", { type: "button", className: "uipack-drill__crumb", onClick: () => navigate(crumbs.slice(0, i + 1)), children: labelOf(lid) }) : /* @__PURE__ */ jsx("span", { className: "uipack-drill__here", "aria-current": "location", tabIndex: -1, ref: currentRef, children: labelOf(lid) })
  ] }, lid)) }) });
}
function DrillControls({ parentLabel, onBack, onOpen, openerRef, motion }) {
  return /* @__PURE__ */ jsxs("div", { className: "uipack__controls", children: [
    parentLabel !== null ? /* @__PURE__ */ jsxs("button", { type: "button", className: "uipack__ctl uipack-drill__back", "aria-label": `Back to ${parentLabel}`, onClick: onBack, children: [
      /* @__PURE__ */ jsx(BackGlyph, {}),
      " Back"
    ] }) : null,
    onOpen ? /* @__PURE__ */ jsx("button", { type: "button", className: "uipack__ctl", ref: openerRef, onClick: onOpen, children: "Open canvas" }) : null,
    motion ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("button", { type: "button", className: "uipack__ctl uipack__ctl--motion", onClick: motion.replay, children: [
        /* @__PURE__ */ jsx(ReplayGlyph, {}),
        " Replay"
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: "uipack__ctl uipack__ctl--motion",
          onClick: motion.toggle,
          "aria-pressed": !motion.playing,
          children: [
            motion.playing ? /* @__PURE__ */ jsx(PauseGlyph, {}) : /* @__PURE__ */ jsx(PlayGlyph, {}),
            " ",
            motion.playing ? "Pause" : "Play"
          ]
        }
      )
    ] }) : null
  ] });
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
var DrillLayer = /* @__PURE__ */ memo(function DrillLayer2({
  level,
  figId,
  frame,
  floorWide,
  floorNarrow,
  levels,
  open,
  current
}) {
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
function useDrillPath({ levels, root, path, defaultPath, onPathChange, onNavigate }) {
  const levelMap = useMemo(() => new Map(levels.map((l) => [l.id, l])), [levels]);
  const ids = useMemo(() => new Set(levelMap.keys()), [levelMap]);
  const rootId = root ?? levels[0]?.id ?? "";
  const labelOf = useCallback((lid) => levelMap.get(lid)?.label ?? lid, [levelMap]);
  const [own, setOwn] = useState(() => normalizePath(defaultPath, ids, rootId));
  const requestedKey = JSON.stringify(normalizePath(path ?? own, ids, rootId));
  const requested = useMemo(() => JSON.parse(requestedKey), [requestedKey]);
  const latestRef = useLatest({ requested, path, onPathChange, onNavigate });
  const navigate = useCallback(
    (next) => {
      const { requested: requested2, path: path2, onPathChange: onPathChange2, onNavigate: onNavigate2 } = latestRef.current;
      if (samePath(next, requested2)) return;
      onNavigate2();
      if (path2 === void 0) setOwn(next);
      onPathChange2?.([...next]);
    },
    [latestRef]
  );
  const up = useCallback(
    () => navigate(drillReducer(latestRef.current.requested, { type: "up" }, ids)),
    [navigate, ids, latestRef]
  );
  const openFrom = useCallback(
    (from, child) => {
      const cur = latestRef.current.requested;
      const at = cur.indexOf(from);
      if (at < 0) return;
      navigate(drillReducer(cur.slice(0, at + 1), { type: "open", id: child }, ids));
    },
    [navigate, ids, latestRef]
  );
  const canGoUp = useCallback(() => latestRef.current.requested.length > 1, [latestRef]);
  return { levelMap, labelOf, requested, navigate, up, openFrom, canGoUp };
}
function useStageWidth(stageRef, expanded) {
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
  }, [stageRef, expanded]);
  return stageW;
}
var drawings = (stage) => Array.from(stage?.querySelectorAll(":scope > .uipack-drill__layer > svg") ?? []);
function useDrillMotion(stageRef, reduced, expanded, view) {
  const [playing, setPlaying] = useState(true);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    for (const s of drawings(stageRef.current)) {
      if (typeof s.pauseAnimations !== "function") continue;
      if (playing) s.unpauseAnimations();
      else s.pauseAnimations();
    }
  }, [stageRef, playing, expanded, view]);
  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const replay = useCallback(() => {
    for (const s of drawings(stageRef.current)) {
      if (typeof s.setCurrentTime === "function") s.setCurrentTime(0);
      if (typeof s.unpauseAnimations === "function") s.unpauseAnimations();
    }
    setPlaying(true);
    setCycle((c) => c + 1);
  }, [stageRef]);
  return useMemo(
    () => ({ playing: playing && !reduced, reduced, cycle, toggle, replay }),
    [playing, reduced, cycle, toggle, replay]
  );
}
function useNotePlacement(canvasRef, noteRef, note, zoom, expanded) {
  const [notePos, setNotePos] = useState(null);
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
  }, [canvasRef, noteRef, note, zoom, expanded]);
  return notePos;
}
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
        value: {
          levels,
          frame: { wide: props.viewBox, narrow: props.narrowViewBox },
          idPrefix: lid,
          variant: "wide",
          interactive: false,
          ghost: false
        },
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
  node.querySelectorAll('[data-uipack="node"] > :not(rect):not(.uipack__touch-target), .uipack-drill-node__mark')
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
    samples.map((s) => ({
      offset: s.offset,
      transform: s.outer,
      transformOrigin: origin,
      opacity: 1 - smoothstep(0.88, 0.99, s.p)
    })),
    timing
  );
  play(
    inner,
    samples.map((s) => ({
      offset: s.offset,
      transform: s.inner,
      transformOrigin: origin,
      clipPath: s.clip,
      opacity: s.innerOpacity
    })),
    timing
  );
  for (const part of faceOf(opts.target)) {
    play(
      part,
      samples.map((s) => ({ offset: s.offset, opacity: 1 - s.innerOpacity })),
      timing
    );
  }
  const halo = opts.target.querySelector(".uipack-drill-node__halo");
  if (halo)
    play(
      halo,
      samples.map((s) => ({ offset: s.offset, opacity: 1 - smoothstep(0, 0.25, s.p) })),
      timing
    );
  return anims;
}

// src/drill/useDrillFlight.ts
var lastOf = (p) => p[p.length - 1];
function useDrillFlight({
  requested,
  labelOf,
  focusIntentRef,
  stageRef,
  canvasRef,
  headingRef,
  currentCrumbRef,
  reduced,
  duration,
  onLeave
}) {
  const [view, setView] = useState(() => ({ path: requested, flight: null }));
  const [announcement, setAnnouncement] = useState("");
  const seq = useRef(0);
  const pendingFocus = useRef(null);
  const latestRef = useLatest({ view, labelOf, reduced, duration, onLeave });
  const layerEl = useCallback(
    (lid) => stageRef.current?.querySelector(
      `:scope > [data-level="${typeof CSS !== "undefined" && CSS.escape ? CSS.escape(lid) : lid}"]`
    ) ?? null,
    [stageRef]
  );
  const { anims, settle, fly } = useLayerFlight(
    () => stageRef.current?.querySelectorAll(":scope > .uipack-drill__layer").forEach(clearLayer)
  );
  const finish = useCallback(
    (n) => {
      const v = latestRef.current.view;
      if (!v.flight || v.flight.seq !== n) return;
      const leaving = layerEl(lastOf(v.flight.from));
      if (leaving) leaving.style.visibility = "hidden";
      settle();
      setView({ path: v.path, flight: null });
    },
    [layerEl, settle, latestRef]
  );
  useIsoLayoutEffect(() => {
    const { view: v, labelOf: labelOf2, onLeave: onLeave2 } = latestRef.current;
    if (samePath(requested, v.path)) return;
    onLeave2();
    setAnnouncement(drillAnnouncement(v.path, requested, labelOf2));
    pendingFocus.current = focusIntentRef.current ? { from: v.path, to: requested } : null;
    focusIntentRef.current = false;
    if (v.flight && anims.current.length && samePath(requested, v.flight.from)) {
      for (const a of anims.current) a.reverse();
      setView({ path: requested, flight: { ...v.flight, from: v.path } });
      return;
    }
    if (v.flight) settle();
    const from = v.path;
    const canAnimate = typeof stageRef.current?.animate === "function" && lastOf(from) !== lastOf(requested);
    if (!canAnimate) {
      setView({ path: requested, flight: null });
      return;
    }
    const move = drillMove(from, requested);
    seq.current += 1;
    setView({
      path: requested,
      flight: { from, kind: move === "in" ? "in" : move === "out" ? "out" : "fade", seq: seq.current }
    });
  }, [requested, anims, focusIntentRef, settle, stageRef, latestRef]);
  const flightSeq = view.flight?.seq;
  useIsoLayoutEffect(() => {
    const { view: v, reduced: reduced2, duration: duration2 } = latestRef.current;
    const f = v.flight;
    const stage = stageRef.current;
    if (!f || !stage) return;
    const fromEl = layerEl(lastOf(f.from));
    const toEl = layerEl(lastOf(v.path));
    if (!fromEl || !toEl) {
      finish(f.seq);
      return;
    }
    const target = f.kind === "in" ? findDrillNode(fromEl, lastOf(v.path)) : f.kind === "out" ? findDrillNode(toEl, lastOf(f.from)) : null;
    const run = runDrill({ kind: f.kind, from: fromEl, to: toEl, target, stage, canvas: canvasRef.current, reduced: reduced2, duration: duration2 });
    fly(run, () => finish(f.seq));
  }, [flightSeq, canvasRef, finish, fly, layerEl, stageRef, latestRef]);
  useIsoLayoutEffect(() => {
    if (view.flight || !pendingFocus.current) return;
    const { from, to } = pendingFocus.current;
    pendingFocus.current = null;
    const t = drillFocusTarget(from, to);
    if (t.kind === "node") {
      const layer = layerEl(lastOf(to));
      const node = layer && findDrillNode(layer, t.drill);
      if (node) {
        node.focus({ preventScroll: true });
        return;
      }
    }
    const heading = headingRef.current;
    if (heading && getComputedStyle(heading).display !== "none") heading.focus({ preventScroll: true });
    else currentCrumbRef.current?.focus({ preventScroll: true });
  }, [view, currentCrumbRef, headingRef, layerEl]);
  return { view, announcement };
}
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
  const reduced = usePrefersReducedMotion();
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
  const focusIntentRef = useRef(false);
  const { levelMap, labelOf, requested, navigate, up, openFrom, canGoUp } = useDrillPath({
    levels,
    root,
    path,
    defaultPath,
    onPathChange,
    onNavigate: () => {
      focusIntentRef.current = true;
    }
  });
  const { view, announcement } = useDrillFlight({
    requested,
    labelOf,
    focusIntentRef,
    stageRef,
    canvasRef,
    headingRef,
    currentCrumbRef,
    reduced,
    duration,
    onLeave: () => {
      select(null);
      setHoverFlow(null);
      setHoverKind(null);
    }
  });
  const stageW = useStageWidth(stageRef, expanded);
  const motion = useDrillMotion(stageRef, reduced, expanded, view);
  const note = selected?.detail ? selected : null;
  const notePos = useNotePlacement(canvasRef, noteRef, note, zoom, expanded);
  const frame = useMemo(() => ({ wide: viewBox, narrow: narrowViewBox }), [viewBox, narrowViewBox]);
  useRovingFocus(canvasRef, expanded);
  const openCanvas = useCallback(() => {
    select(null);
    setExpanded(true);
  }, []);
  const current = levelMap.get(lastOf(view.path));
  if (!current) return null;
  const crumbs = view.path;
  const depth = crumbs.length - 1;
  const trail = crumbs.map(labelOf).join(" \u203A ");
  const fw = vbSize(viewBox);
  const fn = narrowViewBox ? vbSize(narrowViewBox) : null;
  const mounted = view.flight ? [lastOf(view.flight.from), lastOf(view.path)] : [lastOf(view.path)];
  mounted.sort((a, b) => {
    const order = view.flight && view.flight.from.length > view.path.length ? view.flight.from : view.path;
    return order.indexOf(a) - order.indexOf(b);
  });
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
              if (expanded || !canGoUp()) return;
              e.preventDefault();
              up();
            } else if (e.key === "Backspace" && canGoUp()) {
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
              /* @__PURE__ */ jsx(DrillCrumbs, { crumbs, labelOf, navigate, currentRef: currentCrumbRef }),
              createElement(
                `h${headingLevel}`,
                { className: "uipack__title", tabIndex: -1, ref: headingRef },
                current.title ?? current.label
              ),
              current.caption ? /* @__PURE__ */ jsx("p", { className: "uipack__caption", children: current.caption }) : null,
              /* @__PURE__ */ jsx(
                DrillControls,
                {
                  parentLabel: depth > 0 ? labelOf(crumbs[depth - 1]) : null,
                  onBack: up,
                  onOpen: expandable && !expanded ? openCanvas : null,
                  openerRef: opener,
                  motion: controls && !reduced ? motion : null
                }
              ),
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
var PREVIEW_SHARE = 1 / 3;
var SANS_ADVANCE = 0.6;
var MONO_ADVANCE = 0.6;
function labelRight(box, label, { sub, icon, align, size = 14, subSize = 11 }) {
  const width = Math.max(label.length * size * SANS_ADVANCE, (sub?.length ?? 0) * subSize * MONO_ADVANCE);
  return (align ?? (icon ? "left" : "center")) === "center" ? box.x + box.w / 2 + width / 2 : box.x + 14 + (icon ? 26 : 0) + width;
}
function Ghost({
  child,
  ctx,
  box,
  uid,
  clearOf
}) {
  const narrow = ctx.variant === "narrow" && !!ctx.frame.narrow;
  const frame = narrow ? ctx.frame.narrow : ctx.frame.wide;
  const render = narrow && child.narrow ? child.narrow : child.render;
  const levelVb = (narrow ? child.narrowViewBox : child.viewBox) ?? frame;
  const f = vbSize(frame);
  const inner = { ...ctx, ghost: true, interactive: false, open: void 0 };
  const left = box.x + box.w * (1 - PREVIEW_SHARE);
  const port = { x: left, y: box.y + 26, width: box.x + box.w - 12 - left, height: box.h - 32, viewBox: `0 0 ${f.w} ${f.h}` };
  const fade = clearOf + 12 > left ? { from: clearOf + 10, to: Math.min(clearOf + 30, port.x + port.width) } : null;
  return /* @__PURE__ */ jsxs("g", { mask: fade ? `url(#${uid}-fade)` : void 0, children: [
    fade ? /* @__PURE__ */ jsxs("mask", { id: `${uid}-fade`, maskUnits: "userSpaceOnUse", x: port.x, y: port.y, width: port.width, height: port.height, children: [
      /* @__PURE__ */ jsxs("linearGradient", { id: `${uid}-fade-g`, gradientUnits: "userSpaceOnUse", x1: fade.from, x2: fade.to, y1: 0, y2: 0, children: [
        /* @__PURE__ */ jsx("stop", { offset: "0", stopColor: "white", stopOpacity: "0" }),
        /* @__PURE__ */ jsx("stop", { offset: "1", stopColor: "white" })
      ] }),
      /* @__PURE__ */ jsx("rect", { x: port.x, y: port.y, width: port.width, height: port.height, fill: `url(#${uid}-fade-g)` })
    ] }) : null,
    /* @__PURE__ */ jsx("svg", { ...port, preserveAspectRatio: "xMaxYMid meet", overflow: "hidden", children: /* @__PURE__ */ jsx("svg", { width: f.w, height: f.h, viewBox: levelVb, preserveAspectRatio: "xMidYMid meet", children: /* @__PURE__ */ jsx(SelectionContext.Provider, { value: noSelection, children: /* @__PURE__ */ jsx(FigureMotionContext.Provider, { value: stillMotion, children: /* @__PURE__ */ jsx(FigureScaleContext.Provider, { value: { floor: 0 }, children: /* @__PURE__ */ jsx(DrillContext.Provider, { value: inner, children: render({ id: `${ctx.idPrefix}-g${uid}`, variant: narrow ? "narrow" : "wide", ghost: true, level: child }) }) }) }) }) }) })
  ] });
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
              /* @__PURE__ */ jsx(
                "rect",
                {
                  className: "uipack-drill-node__wash",
                  x: box.x,
                  y: box.y,
                  width: box.w,
                  height: box.h,
                  fill: "var(--uipack-accent)",
                  fillOpacity: 0.035
                }
              ),
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
              preview ? /* @__PURE__ */ jsx("g", { ref: ghostRef, className: "uipack-drill-node__ghost", opacity: 0.16, children: /* @__PURE__ */ jsx(Ghost, { child, ctx, box, uid, clearOf: labelRight(box, text, node) }) }) : null
            ] })
          }
        ) }),
        interactive ? /* @__PURE__ */ jsx(FocusRing, { x: box.x, y: box.y, w: box.w, h: box.h, rx: RADIUS }) : null,
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

export { Badge, Cross, CurvePlot, DRILL_GROW, DrillFigure, DrillNode, FileMark, FolderMark, Sheet, TreeRail, Wall, Wordmark, curveAt, curveSegments, drillAnnouncement, drillBox, drillFocusTarget, drillMotion, drillMove, drillReducer, drillStatic, marks, normalizePath as normalizeDrillPath, wallSegments };
