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

type TransitionDocument = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };

/** The document when View Transitions are available and the viewer allows motion; otherwise undefined. */
function transitionDocument(): TransitionDocument | undefined {
  const doc = typeof document === "undefined" ? undefined : (document as TransitionDocument);
  const reduced = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return doc?.startViewTransition && !reduced ? doc : undefined;
}

/**
 * Run a DOM update inside a View Transition when the browser supports it and the viewer
 * has not asked for reduced motion; otherwise run it directly. In React, wrap the state
 * change in flushSync so the DOM is updated inside the callback.
 */
export function withViewTransition(update: () => void): Promise<void> {
  const doc = transitionDocument();
  if (!doc?.startViewTransition) {
    update();
    return Promise.resolve();
  }
  return doc.startViewTransition(update).finished.catch(() => undefined);
}

export interface PaintTransitionOptions {
  /** Milliseconds for the pour. Default 1300: theme changes are rare, so this is delight budget. */
  duration?: number;
}

// Paint poured down the page. The new view-transition layer is masked by one sheet (a rect
// growing from the top) plus, per drip, a body (rect) and a bead at the tip (circle). Every
// call rolls new drips, so no two pours match:
//
//   sheet  y(t) eases in and out from the top to past the bottom edge
//   drip   starts at its own moment, falls ahead of the sheet under its own gravity
//          (wider = heavier = faster) and slows as it thins out:
//          len(t) = max · (1 − e^(−½·g·t² / max))
//
// The motion is sampled into keyframes (mask-position / mask-size lists), so it runs on the
// compositor like any CSS animation.
const PAINT_STEPS = 48;

interface Drip {
  x: number;
  w: number;
  start: number;
  g: number;
  max: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const smooth = (t: number) => t * t * (3 - 2 * t);
const px = (v: number) => `${Math.round(v * 10) / 10}px`;

function rollDrips(width: number, height: number, duration: number): Drip[] {
  const count = Math.max(7, Math.min(26, Math.round(width / 56)));
  const slot = width / count;
  return Array.from({ length: count }, (_, i) => {
    const w = rand(5, 18);
    return {
      x: i * slot + rand(0, slot - w),
      w,
      start: rand(0, 0.4) * duration, // ms after the pour begins
      g: (w / 13) * rand(1200, 3400) * (height / 900), // px/s², heavier falls faster
      max: rand(0.08, 0.5) * height, // how far it can run before it thins out
    };
  });
}

function paintFrame(t: number, width: number, height: number, drips: Drip[], duration: number): string {
  const sheet = smooth(Math.min(1, t / (duration * 0.9))) * (height + 40);
  const pos = ["0px 0px"];
  const size = [`${px(width)} ${px(sheet)}`];
  for (const d of drips) {
    const dt = Math.max(0, t - d.start) / 1000;
    const len = d.max * (1 - Math.exp(-(0.5 * d.g * dt * dt) / d.max));
    // Body overlaps the sheet by 1px so the joint never shows a seam.
    pos.push(`${px(d.x)} ${px(sheet - 1)}`);
    size.push(`${px(d.w)} ${px(len + 1)}`);
    // Paint gathers at the end of a drip: the tip is a bead wider than the body.
    const bead = d.w * 1.35;
    pos.push(`${px(d.x - (bead - d.w) / 2)} ${px(sheet + len - bead / 2)}`);
    size.push(`${px(bead)} ${px(bead)}`);
  }
  return `mask-position: ${pos.join(", ")}; mask-size: ${size.join(", ")};`;
}

let paintCount = 0;

/** The stylesheet for one pour: a fresh keyframe animation masking the new root layer. Exported for tests. */
export function paintTransitionCss(width: number, height: number, duration = 1300): string {
  const drips = rollDrips(width, height, duration);
  const name = `uipack-paint-${Date.now().toString(36)}-${(paintCount++).toString(36)}`;
  const solid = "linear-gradient(#000, #000)";
  const tip = "radial-gradient(circle closest-side, #000 96%, transparent)";
  const images = [solid, ...drips.flatMap(() => [solid, tip])].join(", ");
  const keyframes = Array.from({ length: PAINT_STEPS + 1 }, (_, i) => {
    const t = (i / PAINT_STEPS) * duration;
    return `${Math.round((i / PAINT_STEPS) * 10000) / 100}% { ${paintFrame(t, width, height, drips, duration)} }`;
  }).join("\n");
  return `
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
::view-transition-new(root) {
  mask-image: ${images};
  mask-repeat: no-repeat;
  animation: ${name} ${duration}ms linear both;
}
@keyframes ${name} {
${keyframes}
}`;
}

/**
 * Run a DOM update (typically a theme change) as paint poured down the page: a sheet
 * with drips that start, accelerate and thin out on their own, new every call. The
 * keyframes live in a <style> added for this transition and removed when it finishes.
 * Falls back to calling update() directly without View Transitions or under reduced
 * motion. In React, wrap the state change in flushSync.
 */
export function withPaintTransition(update: () => void, { duration = 1300 }: PaintTransitionOptions = {}): Promise<void> {
  const doc = transitionDocument();
  if (!doc?.startViewTransition) {
    update();
    return Promise.resolve();
  }
  const style = doc.createElement("style");
  style.dataset.uipackPaint = "";
  style.textContent = paintTransitionCss(window.innerWidth, window.innerHeight, duration);
  doc.head.appendChild(style);
  let transition: { finished: Promise<void> };
  try {
    transition = doc.startViewTransition(update);
  } catch (error) {
    style.remove();
    throw error;
  }
  return transition.finished.catch(() => undefined).finally(() => style.remove());
}
