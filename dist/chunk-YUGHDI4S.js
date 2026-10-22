// src/env.ts
import { useEffect, useLayoutEffect } from "react";
var useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
var REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function prefersReducedMotion(win = typeof window === "undefined" ? void 0 : window) {
  return typeof win?.matchMedia === "function" && win.matchMedia(REDUCED_MOTION_QUERY).matches;
}
function keepFocusedInView(event) {
  event.target?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}

export {
  useIsoLayoutEffect,
  REDUCED_MOTION_QUERY,
  prefersReducedMotion,
  keepFocusedInView
};
//# sourceMappingURL=chunk-YUGHDI4S.js.map