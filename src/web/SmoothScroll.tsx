import { useEffect, useMemo, useRef } from "react";

/* ------------------------------------------------------------------ Pure math (tested) */

/**
 * Rate, per second, of an exponential follow that closes `lerp` of the remaining gap every
 * 1/60 s. Time-based, so a 120 Hz screen takes two smaller steps and lands at the same moment.
 */
export function followRate(lerp: number): number {
  const l = Math.min(0.999, Math.max(0.001, lerp));
  return -Math.log(1 - l) * 60;
}

/** One frame of the follow: the gap to the target shrinks by e^(−rate·dt), whatever dt is. */
export function followStep(current: number, target: number, rate: number, dt: number): number {
  return target + (current - target) * Math.exp(-rate * Math.max(0, dt));
}

/** Ease for a fixed-duration scrollTo: fast start, long soft landing (exponential out). */
export function easeOutExpo(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(2, -10 * t);
}

/** Pixels per wheel "line" (deltaMode 1, e.g. Firefox with a mouse wheel). */
export const WHEEL_LINE_PX = 40;
/** A wheel "page" (deltaMode 2) is the viewport less the overlap browsers keep on Page Down. */
export const WHEEL_PAGE_FRACTION = 0.875;

export interface WheelLike {
  deltaX: number;
  deltaY: number;
  deltaMode: number;
}

/** A wheel event's deltas in pixels, whichever unit the browser reported them in. */
export function normalizeWheel(e: WheelLike, viewport: { width: number; height: number }): { x: number; y: number } {
  if (e.deltaMode === 1) return { x: e.deltaX * WHEEL_LINE_PX, y: e.deltaY * WHEEL_LINE_PX };
  if (e.deltaMode === 2) return { x: e.deltaX * viewport.width * WHEEL_PAGE_FRACTION, y: e.deltaY * viewport.height * WHEEL_PAGE_FRACTION };
  return { x: e.deltaX, y: e.deltaY };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/* ------------------------------------------------------------------ Controller */

export interface SmoothScrollOptions {
  /** Share of the remaining distance closed per 1/60 s (time-based). Lower is softer. Default 0.1. */
  lerp?: number;
  /** Scales wheel distances. Default 1. */
  wheelMultiplier?: number;
  /** Ease same-page anchor links, landing below a sticky nav. Default true. */
  anchors?: boolean;
}

export interface SmoothScrollToOptions {
  /**
   * Pixels to keep clear above the target. For an element or selector the default is its
   * scroll-margin-top plus the page's scroll-padding-top (web.css sets 5rem on Landing ids,
   * which clears GlassNav); for a number it is 0.
   */
  offset?: number;
  /** Milliseconds for a fixed-length, exponential-out scroll. Omit to use the follow. */
  duration?: number;
  /** Jump with no animation. */
  immediate?: boolean;
}

export type SmoothScrollTarget = number | string | Element;

export interface SmoothScrollController {
  /** Scroll the page to a y position, an element, or a selector ("#pricing"). */
  scrollTo(target: SmoothScrollTarget, options?: SmoothScrollToOptions): void;
  /** Stop an eased scroll where it is. */
  stop(): void;
  /** True while wheel easing is on: a fine pointer and no reduced-motion preference. */
  readonly enabled: boolean;
  /** Remove every listener and give scrolling back to the browser. */
  destroy(): void;
}

/** Marks <html> while easing is on; web.css turns its CSS smooth scrolling off under it. */
export const SMOOTH_SCROLL_ATTR = "data-uipack-smooth-scroll";
/** Put on an element whose wheel events must stay native, like Lenis's data-lenis-prevent. */
export const SMOOTH_SCROLL_PREVENT_ATTR = "data-smooth-scroll-prevent";

const REDUCED = "(prefers-reduced-motion: reduce)";
const SCROLL_KEYS = new Set([" ", "PageUp", "PageDown", "ArrowUp", "ArrowDown", "Home", "End"]);
const FINE = "(hover: hover) and (pointer: fine)";

let active: SmoothScrollController | null = null;

const canUseDom = () => typeof window !== "undefined" && typeof document !== "undefined";
const matches = (q: string) => canUseDom() && typeof window.matchMedia === "function" && window.matchMedia(q).matches;
const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

function safeQuery(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

function resolveTop(target: SmoothScrollTarget, offset: number | undefined): number | null {
  if (typeof target === "number") return target - (offset ?? 0);
  let el: Element | null = null;
  if (typeof target === "string") {
    el = target === "#" || target === "#top" ? document.getElementById("top") : safeQuery(target);
    if (!el && (target === "#" || target === "#top")) return 0;
  } else el = target;
  if (!el) return null;
  const clear =
    offset ??
    (parseFloat(getComputedStyle(el).scrollMarginTop) || 0) + (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
  return el.getBoundingClientRect().top + window.scrollY - clear;
}

/** The browser's own scroll: smooth unless the viewer asked for reduced motion. */
function nativeScrollTo(target: SmoothScrollTarget, { offset, immediate }: SmoothScrollToOptions = {}) {
  if (!canUseDom()) return;
  const y = resolveTop(target, offset);
  if (y === null) return;
  window.scrollTo({ top: clamp(y, 0, maxScroll()), behavior: immediate || matches(REDUCED) ? "auto" : "smooth" });
}

/** True when nothing between the wheel's target and the page can scroll it first. */
function pageOwnsWheel(e: WheelEvent): boolean {
  const root = document.documentElement;
  if (getComputedStyle(root).overflowY === "hidden" || (document.body && getComputedStyle(document.body).overflowY === "hidden")) return false;
  const path = typeof e.composedPath === "function" ? e.composedPath() : [];
  const chain = path.length ? path : [];
  if (!chain.length) for (let n = e.target as Element | null; n; n = n.parentElement) chain.push(n);
  for (const node of chain) {
    if (!(node instanceof Element) || node === root || node === document.body) continue;
    if (node.hasAttribute(SMOOTH_SCROLL_PREVENT_ATTR)) return false;
    if (node instanceof HTMLDialogElement && node.open) return false;
    if (node.scrollHeight > node.clientHeight + 1) {
      const oy = getComputedStyle(node).overflowY;
      if (oy === "auto" || oy === "scroll" || oy === "overlay") return false;
    }
  }
  return true;
}

function focusTarget(el: Element) {
  if (!(el instanceof HTMLElement)) return;
  if (!el.matches("a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]")) {
    el.setAttribute("tabindex", "-1");
    el.addEventListener("blur", () => el.removeAttribute("tabindex"), { once: true });
  }
  el.focus({ preventScroll: true });
}

/**
 * Eases the page's own scroll position toward a wheel target, Lenis style, with no
 * dependencies. The real window scroll moves every frame, so sticky positioning, scroll
 * events, IntersectionObserver, Reveal and ScrollTransform all keep working.
 *
 * - On only for a fine pointer without a reduced-motion preference; it follows changes to
 *   either. Touch, pens on tablets and reduced motion keep native scrolling.
 * - Ctrl/⌘ + wheel (zoom, pinch) and mostly-horizontal or Shift + wheel stay native.
 * - Wheel over anything that can scroll on its own (overflow auto/scroll, an open dialog,
 *   [data-smooth-scroll-prevent]) stays native, and so does a page locked by a modal.
 * - Keyboard scrolling stays native: browsers already animate it and own its focus rules.
 *   A scroll it did not make right after a scroll key, or for three frames running (scrollbar
 *   drag, find in page), stops the easing; a one-off shift (scroll anchoring) is carried along.
 * - Same-page anchor links scroll to their target below a sticky nav (see offset), update the
 *   hash with pushState and move focus there. Handled even while wheel easing is off: natively
 *   smooth on touch, an instant jump under reduced motion.
 * - Stops when the tab is hidden or the scrollbar is grabbed.
 */
export function createSmoothScroll({ lerp = 0.1, wheelMultiplier = 1, anchors = true }: SmoothScrollOptions = {}): SmoothScrollController {
  if (!canUseDom()) {
    return { scrollTo: () => undefined, stop: () => undefined, enabled: false, destroy: () => undefined };
  }
  const root = document.documentElement;
  const rate = followRate(lerp);
  let enabled = false;
  let destroyed = false;
  let frame = 0;
  let last = 0;
  let current = window.scrollY;
  let target = current;
  let lastSet = current;
  let tween: { from: number; to: number; start: number; duration: number } | null = null;
  let savedBehavior = "";
  let streak = 0;
  // An element target is re-measured every frame, so content that resizes above it while the
  // page eases (a playing demo, a late image) cannot make the scroll land short or long.
  let aim: { el: Element; offset?: number } | null = null;
  let keyAt = -Infinity;

  const animating = () => frame !== 0;

  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    streak = 0;
    tween = null;
    aim = null;
    current = target = window.scrollY;
  };

  const tick = (now: number) => {
    frame = 0;
    const dt = last ? Math.min(0.25, (now - last) / 1000) : 1 / 60;
    last = now;
    if (aim?.el.isConnected) {
      const y = resolveTop(aim.el, aim.offset);
      if (y !== null) target = y;
    }
    target = clamp(target, 0, maxScroll());
    if (tween) {
      tween.to = target;
      const t = clamp((now - tween.start) / tween.duration, 0, 1);
      current = tween.from + (tween.to - tween.from) * easeOutExpo(t);
      if (t >= 1) current = tween.to;
    } else {
      current = followStep(current, target, rate, dt);
    }
    if (Math.abs(target - current) < 0.5) current = target;
    window.scrollTo(window.scrollX, current);
    lastSet = window.scrollY;
    if (current === target) {
      last = 0;
      tween = null;
      return;
    }
    frame = requestAnimationFrame(tick);
  };

  const run = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const onWheel = (e: WheelEvent) => {
    if (active !== controller || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const { x, y } = normalizeWheel(e, { width: window.innerWidth, height: window.innerHeight });
    if (y === 0 || Math.abs(x) > Math.abs(y)) return;
    if (maxScroll() <= 0 || !pageOwnsWheel(e)) return;
    e.preventDefault();
    if (!animating() || tween || aim) {
      current = window.scrollY;
      target = current;
      tween = null;
      aim = null;
    }
    target = clamp(target + y * wheelMultiplier, 0, maxScroll());
    run();
  };

  const onScroll = () => {
    const y = window.scrollY;
    if (!animating()) {
      current = target = y;
      return;
    }
    const moved = y - lastSet;
    if (Math.abs(moved) <= 2) {
      streak = 0;
      return;
    }
    // A scroll this controller did not make. Right after a scroll key, or several frames in a
    // row (a dragged scrollbar, find in page), the reader is in control: stop. A one-off shift
    // is the browser keeping content still while something above it resized (scroll
    // anchoring, a late font): carry the easing along by the same amount.
    if (performance.now() - keyAt < 500 || ++streak >= 3) {
      stop();
      return;
    }
    current += moved;
    target = clamp(target + moved, 0, maxScroll());
    lastSet = y;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (SCROLL_KEYS.has(e.key)) keyAt = performance.now();
  };

  const onPointerDown = (e: PointerEvent) => {
    // A classic scrollbar sits outside the root's client area.
    if (animating() && (e.clientX >= root.clientWidth || e.clientY >= root.clientHeight)) stop();
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") stop();
  };

  const onResize = () => {
    target = clamp(target, 0, maxScroll());
  };

  const onClick = (e: MouseEvent) => {
    if (!anchors || active !== controller || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
    if (!(a instanceof HTMLAnchorElement) || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (!url.hash || url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
    let id = url.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      /* keep the raw id */
    }
    const el = id ? document.getElementById(id) : null;
    if (!el && id && id.toLowerCase() !== "top") return;
    e.preventDefault();
    controller.scrollTo(el ?? 0);
    if (location.hash !== url.hash) history.pushState(history.state, "", url.hash);
    if (el) focusTarget(el);
  };

  const attach = () => {
    root.setAttribute(SMOOTH_SCROLL_ATTR, "");
    // Each frame is an instant jump; a page-level scroll-behavior: smooth would fight it.
    savedBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    current = target = lastSet = window.scrollY;
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("keydown", onKeyDown, { passive: true, capture: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
  };

  const detach = () => {
    stop();
    root.removeAttribute(SMOOTH_SCROLL_ATTR);
    root.style.scrollBehavior = savedBehavior;
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("keydown", onKeyDown, { capture: true });
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibility);
  };

  const queries = typeof window.matchMedia === "function" ? [window.matchMedia(REDUCED), window.matchMedia(FINE)] : [];
  const evaluate = () => {
    const next = !destroyed && queries.length === 2 && !queries[0].matches && queries[1].matches;
    if (next === enabled) return;
    enabled = next;
    if (enabled) attach();
    else detach();
  };
  const listen = (mq: MediaQueryList, on: boolean) => {
    if (typeof mq.addEventListener === "function") {
      if (on) mq.addEventListener("change", evaluate);
      else mq.removeEventListener("change", evaluate);
    } else if (on) mq.addListener(evaluate);
    else mq.removeListener(evaluate);
  };

  const controller: SmoothScrollController = {
    scrollTo(t, options = {}) {
      if (!enabled) return nativeScrollTo(t, options);
      const el = typeof t === "string" ? safeQuery(t) : typeof t === "number" ? null : t;
      const y = resolveTop(el ?? t, options.offset);
      if (y === null) return;
      const to = clamp(y, 0, maxScroll());
      if (options.immediate) {
        stop();
        window.scrollTo(window.scrollX, to);
        current = target = lastSet = window.scrollY;
        return;
      }
      if (!animating()) current = lastSet = window.scrollY;
      target = to;
      aim = el ? { el, offset: options.offset } : null;
      tween = options.duration !== undefined && options.duration > 0 ? { from: current, to, start: performance.now(), duration: options.duration } : null;
      run();
    },
    stop,
    get enabled() {
      return enabled;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      queries.forEach((mq) => listen(mq, false));
      document.removeEventListener("click", onClick);
      if (enabled) detach();
      enabled = false;
      if (active === controller) active = null;
    },
  };

  active = controller;
  queries.forEach((mq) => listen(mq, true));
  // Anchors are handled even while wheel easing is off, so every in-page link lands below the
  // nav and moves focus the same way: eased, natively smooth on touch, instant under reduced motion.
  document.addEventListener("click", onClick);
  evaluate();
  return controller;
}

/**
 * Scroll the page through the mounted SmoothScroll, or natively (smooth unless reduced
 * motion) when none is mounted or it is off. Safe to call on the server.
 */
export function smoothScrollTo(target: SmoothScrollTarget, options?: SmoothScrollToOptions): void {
  if (active) active.scrollTo(target, options);
  else nativeScrollTo(target, options);
}

/* ------------------------------------------------------------------ React */

export type SmoothScrollHandle = Omit<SmoothScrollController, "destroy">;

/**
 * Turns on SmoothScroll for the page while the calling component is mounted and returns a
 * stable handle. Mount it once per page. Its scrollTo works before mount and when easing is
 * off, falling back to the browser's own scroll.
 */
export function useSmoothScroll({ lerp = 0.1, wheelMultiplier = 1, anchors = true }: SmoothScrollOptions = {}): SmoothScrollHandle {
  const instance = useRef<SmoothScrollController | null>(null);
  useEffect(() => {
    const c = createSmoothScroll({ lerp, wheelMultiplier, anchors });
    instance.current = c;
    return () => {
      c.destroy();
      if (instance.current === c) instance.current = null;
    };
  }, [lerp, wheelMultiplier, anchors]);
  return useMemo<SmoothScrollHandle>(
    () => ({
      scrollTo: (t, o) => (instance.current ? instance.current.scrollTo(t, o) : nativeScrollTo(t, o)),
      stop: () => instance.current?.stop(),
      get enabled() {
        return instance.current?.enabled ?? false;
      },
    }),
    [],
  );
}

export type SmoothScrollProps = SmoothScrollOptions;

/**
 * Opt-in smooth wheel scrolling for a landing page: render it once, anywhere on the page.
 * Renders nothing. Use smoothScrollTo() (or useSmoothScroll's handle) to scroll from code.
 */
export function SmoothScroll(props: SmoothScrollProps) {
  useSmoothScroll(props);
  return null;
}
