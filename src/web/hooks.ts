import { useEffect, useState, type RefObject } from "react";

export interface InViewOptions {
  /** Fraction of the element that must be visible. Default 0. */
  threshold?: number;
  /** Stay true after the first time the element is seen. Default false. */
  once?: boolean;
  rootMargin?: string;
}

/**
 * True while the element is on screen. Without IntersectionObserver (old browsers, jsdom)
 * it is always true, so content never waits on an observer that cannot fire.
 * Starts false on the server and first client render, so hydration matches.
 */
export function useInView(ref: RefObject<Element>, { threshold = 0, once = false, rootMargin }: InViewOptions = {}): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) io.disconnect();
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, once, rootMargin]);
  return inView;
}

/** Scroll progress of an element through the viewport: 0 as its top enters the bottom edge, 1 as its bottom leaves the top edge. */
export function scrollProgressOf(rect: { top: number; height: number }, viewport: number): number {
  const total = viewport + rect.height;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, (viewport - rect.top) / total));
}

/**
 * Tracks scrollProgressOf for an element. Listens to scroll only while the element is on
 * screen and coalesces updates into one per animation frame.
 */
export function useScrollProgress(ref: RefObject<Element>): number {
  const inView = useInView(ref);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || typeof window === "undefined") return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      setProgress(scrollProgressOf(el.getBoundingClientRect(), window.innerHeight));
    };
    const schedule = () => {
      if (frame) return;
      frame = typeof requestAnimationFrame === "function" ? requestAnimationFrame(measure) : (setTimeout(measure, 16) as unknown as number);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
    };
  }, [ref, inView]);
  return progress;
}

/** True on devices with a hovering, fine pointer (mouse, trackpad). False on touch and on the server. */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    setFine(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);
  return fine;
}

/**
 * Run a DOM update inside a View Transition when the browser supports it and the viewer
 * has not asked for reduced motion; otherwise run it directly. In React, wrap the state
 * change in flushSync so the DOM is updated inside the callback.
 */
export function withViewTransition(update: () => void): Promise<void> {
  const doc = typeof document === "undefined" ? undefined : (document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } });
  const reduced = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc?.startViewTransition || reduced) {
    update();
    return Promise.resolve();
  }
  return doc.startViewTransition(update).finished.catch(() => undefined);
}
