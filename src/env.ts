// Browser-environment helpers shared by every entry. SSR-safe; no React context.
import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";

/** useLayoutEffect in the browser (measure before paint), useEffect on the server (no warning). */
export const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The one media query every part reads for reduced motion. */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** True when the viewer asks for reduced motion right now. False on the server or without matchMedia. */
export function prefersReducedMotion(win: Window | undefined = typeof window === "undefined" ? undefined : window): boolean {
  return typeof win?.matchMedia === "function" && win.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Calls `listener` whenever the reduced-motion setting changes; returns the unsubscribe. A no-op on
 * the server or without matchMedia. For code outside React (createSmoothScroll); components use the hook.
 */
export function onReducedMotionChange(listener: (reduced: boolean) => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  const changed = () => listener(query.matches);
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", changed);
    return () => query.removeEventListener("change", changed);
  }
  query.addListener(changed);
  return () => query.removeListener(changed);
}

/**
 * True when the viewer asks for reduced motion, and re-renders when that changes. The one
 * subscription every part shares. The server render and hydration say false, so they match; the
 * real value follows straight after.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(onReducedMotionChange, prefersReducedMotion, serverSnapshot);
}
const serverSnapshot = () => false;

/**
 * onFocus for a horizontally scrolling row: browsers leave a half-visible item where it is when
 * it takes keyboard focus, so its ring is cut off. This brings the focused item fully into view.
 */
export function keepFocusedInView(event: { target: EventTarget | null }) {
  (event.target as Element | null)?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}
