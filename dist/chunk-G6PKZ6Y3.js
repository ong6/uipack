// src/context.tsx
import { createContext, useContext, useEffect, useState } from "react";
var noop = () => {
};
var FigureMotionContext = createContext({
  playing: true,
  reduced: false,
  cycle: 0,
  toggle: noop,
  replay: noop
});
function useFigureMotion() {
  return useContext(FigureMotionContext);
}
var QUERY = "(prefers-reduced-motion: reduce)";
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
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
import { jsx } from "react/jsx-runtime";
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
  if (s === "circle") return /* @__PURE__ */ jsx("circle", { cx, cy, r, ...common });
  if (s === "diamond") {
    const d = r * 1.2;
    return /* @__PURE__ */ jsx("path", { d: `M${cx},${cy - d} L${cx + d},${cy} L${cx},${cy + d} L${cx - d},${cy} Z`, ...common });
  }
  return /* @__PURE__ */ jsx("rect", { x: cx - r, y: cy - r, width: r * 2, height: r * 2, rx: 1.5, ...common });
}

// src/scale.tsx
import { createContext as createContext2, useContext as useContext2 } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var FigureScaleContext = createContext2({ floor: 0 });
var DEFAULT_RENDER_WIDTH = 1088;
function fontFloor(vbWidth, renderWidth, minFont) {
  if (!vbWidth || !renderWidth || !minFont) return 0;
  return minFont * vbWidth / renderWidth;
}
function FigureScaleProvider({ floor, children }) {
  return /* @__PURE__ */ jsx2(FigureScaleContext.Provider, { value: { floor }, children });
}
function useFontFloor(size) {
  const { floor } = useContext2(FigureScaleContext);
  return Math.max(size, floor);
}

export {
  FigureMotionContext,
  useFigureMotion,
  usePrefersReducedMotion,
  TOKEN_SHAPE,
  tokenColor,
  Token,
  FigureScaleContext,
  DEFAULT_RENDER_WIDTH,
  fontFloor,
  FigureScaleProvider,
  useFontFloor
};
//# sourceMappingURL=chunk-G6PKZ6Y3.js.map