// Browser-environment helpers shared by every entry. SSR-safe; no React context.
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";

/** useLayoutEffect in the browser (measure before paint), useEffect on the server (no warning). */
export const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * A ref holding the latest `value`, for handlers, timers and loops that outlive the render that made
 * them. Synced in a layout effect, not during render (React may render without committing), so call
 * it before any layout effect of the same component that reads it.
 */
export function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value);
  useIsoLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}

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
 * False in server HTML and while hydrating it, true on the client after that (and from the first
 * render of a client-only mount): for markup that should exist only with JavaScript running, so
 * server HTML stays the plain, final version. No effect and no extra state.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeToNothing, clientSnapshot, serverSnapshot);
}
const subscribeToNothing = () => () => {};
const clientSnapshot = () => true;

/**
 * onFocus for a horizontally scrolling row: browsers leave a half-visible item where it is when
 * it takes keyboard focus, so its ring is cut off. This brings the focused item fully into view.
 */
export function keepFocusedInView(event: { target: EventTarget | null }) {
  (event.target as Element | null)?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}
