"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }// src/context.tsx
var _react = require('react');
var noop = () => {
};
var FigureMotionContext = _react.createContext.call(void 0, {
  playing: true,
  reduced: false,
  cycle: 0,
  toggle: noop,
  replay: noop
});
function useFigureMotion() {
  return _react.useContext.call(void 0, FigureMotionContext);
}

// src/tokens.tsx
var _jsxruntime = require('react/jsx-runtime');
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
  const s = _nullishCoalesce(shape, () => ( TOKEN_SHAPE[kind]));
  const fill = tokenColor(kind);
  const common = { fill, stroke: "var(--uipack-bg)", strokeWidth: 1.5, style };
  if (s === "circle") return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "circle", { cx, cy, r, ...common });
  if (s === "ring")
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "circle", { cx, cy, r: r * 0.78, fill: "var(--uipack-bg)", stroke: fill, strokeWidth: r * 0.5, style });
  if (s === "diamond") {
    const d = r * 1.2;
    return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "path", { d: `M${cx},${cy - d} L${cx + d},${cy} L${cx},${cy + d} L${cx - d},${cy} Z`, ...common });
  }
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, "rect", { x: cx - r, y: cy - r, width: r * 2, height: r * 2, rx: 1.5, ...common });
}

// src/scale.tsx


var FigureScaleContext = _react.createContext.call(void 0, { floor: 0 });
var DEFAULT_RENDER_WIDTH = 1088;
function fontFloor(vbWidth, renderWidth, minFont) {
  if (!vbWidth || !renderWidth || !minFont) return 0;
  return minFont * vbWidth / renderWidth;
}
function FigureScaleProvider({ floor, children }) {
  return /* @__PURE__ */ _jsxruntime.jsx.call(void 0, FigureScaleContext.Provider, { value: { floor }, children });
}
function useFontFloor(size) {
  const { floor } = _react.useContext.call(void 0, FigureScaleContext);
  return Math.max(size, floor);
}












exports.FigureMotionContext = FigureMotionContext; exports.useFigureMotion = useFigureMotion; exports.TOKEN_SHAPE = TOKEN_SHAPE; exports.tokenColor = tokenColor; exports.Token = Token; exports.FigureScaleContext = FigureScaleContext; exports.DEFAULT_RENDER_WIDTH = DEFAULT_RENDER_WIDTH; exports.fontFloor = fontFloor; exports.FigureScaleProvider = FigureScaleProvider; exports.useFontFloor = useFontFloor;
//# sourceMappingURL=chunk-AF2HLZ75.cjs.map