// Browser-environment helpers shared by every entry. Pure and SSR-safe; no React context.
import { useEffect, useLayoutEffect } from "react";

/** useLayoutEffect in the browser (measure before paint), useEffect on the server (no warning). */
export const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The one media query every part reads for reduced motion. */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** True when the viewer asks for reduced motion right now. False on the server or without matchMedia. */
export function prefersReducedMotion(win: Window | undefined = typeof window === "undefined" ? undefined : window): boolean {
  return typeof win?.matchMedia === "function" && win.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * onFocus for a horizontally scrolling row: browsers leave a half-visible item where it is when
 * it takes keyboard focus, so its ring is cut off. This brings the focused item fully into view.
 */
export function keepFocusedInView(event: { target: EventTarget | null }) {
  (event.target as Element | null)?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}
