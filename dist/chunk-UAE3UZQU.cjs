'use strict';

var jsxRuntime = require('react/jsx-runtime');
var react = require('react');

// src/tokens.tsx
var TOKEN_SHAPE = {
  request: "square",
  response: "circle",
  change: "diamond",
  accent: "ring",
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
  if (s === "circle") return /* @__PURE__ */ jsxRuntime.jsx("circle", { cx, cy, r, ...common });
  if (s === "ring")
    return /* @__PURE__ */ jsxRuntime.jsx("circle", { cx, cy, r: r * 0.78, fill: "var(--uipack-bg)", stroke: fill, strokeWidth: r * 0.5, style });
  if (s === "diamond") {
    const d = r * 1.2;
    return /* @__PURE__ */ jsxRuntime.jsx("path", { d: `M${cx},${cy - d} L${cx + d},${cy} L${cx},${cy + d} L${cx - d},${cy} Z`, ...common });
  }
  return /* @__PURE__ */ jsxRuntime.jsx("rect", { x: cx - r, y: cy - r, width: r * 2, height: r * 2, rx: 1.5, ...common });
}
var FigureScaleContext = /* @__PURE__ */ react.createContext({ floor: 0 });
var DEFAULT_RENDER_WIDTH = 1088;
function fontFloor(vbWidth, renderWidth, minFont) {
  if (!vbWidth || !renderWidth || !minFont) return 0;
  return minFont * vbWidth / renderWidth;
}
function FigureScaleProvider({ floor, children }) {
  return /* @__PURE__ */ jsxRuntime.jsx(FigureScaleContext.Provider, { value: { floor }, children });
}
function useFontFloor(size) {
  const { floor } = react.useContext(FigureScaleContext);
  return Math.max(size, floor);
}
var TOUCH_TARGET_PX = 44;
var UNMEASURED_TARGET = 54;
function useTouchTarget(w, h) {
  const { unitsPerPx } = react.useContext(FigureScaleContext);
  const min = unitsPerPx ? (TOUCH_TARGET_PX + 1) * unitsPerPx : 0;
  return { w: Math.max(w, min), h: Math.max(h, UNMEASURED_TARGET, min) };
}

exports.DEFAULT_RENDER_WIDTH = DEFAULT_RENDER_WIDTH;
exports.FigureScaleContext = FigureScaleContext;
exports.FigureScaleProvider = FigureScaleProvider;
exports.TOKEN_SHAPE = TOKEN_SHAPE;
exports.Token = Token;
exports.fontFloor = fontFloor;
exports.tokenColor = tokenColor;
exports.useFontFloor = useFontFloor;
exports.useTouchTarget = useTouchTarget;
