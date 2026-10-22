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
