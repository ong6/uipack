import { useEffect, useLayoutEffect, useSyncExternalStore } from 'react';

// src/env.ts
var useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
var REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function prefersReducedMotion(win = typeof window === "undefined" ? void 0 : window) {
  return typeof win?.matchMedia === "function" && win.matchMedia(REDUCED_MOTION_QUERY).matches;
}
function onReducedMotionChange(listener) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {
  };
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  const changed = () => listener(query.matches);
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", changed);
    return () => query.removeEventListener("change", changed);
  }
  query.addListener(changed);
  return () => query.removeListener(changed);
}
function usePrefersReducedMotion() {
  return useSyncExternalStore(onReducedMotionChange, prefersReducedMotion, serverSnapshot);
}
var serverSnapshot = () => false;
function keepFocusedInView(event) {
  event.target?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}

export { keepFocusedInView, onReducedMotionChange, prefersReducedMotion, useIsoLayoutEffect, usePrefersReducedMotion };
