import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';

// src/env.ts
var useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
function useLatest(value) {
  const ref = useRef(value);
  useIsoLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
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
function useHydrated() {
  return useSyncExternalStore(subscribeToNothing, clientSnapshot, serverSnapshot);
}
var subscribeToNothing = () => () => {
};
var clientSnapshot = () => true;
function keepFocusedInView(event) {
  event.target?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}

export { keepFocusedInView, onReducedMotionChange, prefersReducedMotion, useHydrated, useIsoLayoutEffect, useLatest, usePrefersReducedMotion };
