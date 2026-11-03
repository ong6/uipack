import { useEffect, type RefObject } from "react";

/**
 * A host turns the entrance off for the whole page with
 * `<html data-uipack-entrance="off">` (or `window.__UIPACK_ENTRANCE__ = false`
 * before the figures mount, as the browser tests do).
 */
export function entranceOff(): boolean {
  const g = globalThis as { __UIPACK_ENTRANCE__?: boolean; document?: Document };
  return g.__UIPACK_ENTRANCE__ === false || g.document?.documentElement?.dataset.uipackEntrance === "off";
}

/** Parts that get their own step; later parts share the last delay. */
export const ENTRANCE_STEPS = 14;
/** How long after the last step starts the attribute is cleared, in ms. */
const SETTLE_MS = 1300;

/**
 * Scroll-in entrance for a figure's canvas. Only a canvas that starts below
 * the fold waits: its drawing's top-level parts are numbered (`--uipack-i`)
 * and hidden by `data-enter="wait"`; when a fifth of it is in view it switches
 * to `"in"` and the theme's transition reveals the parts in order, then the
 * attribute and the numbering are removed so hover transitions take over
 * again. Nothing happens under reduced motion, without IntersectionObserver,
 * for a canvas already on screen, or when the host turned it off (`entranceOff`), so server markup, static exports and
 * above-the-fold figures always show the finished drawing.
 */
export function useFigureEntrance(ref: RefObject<HTMLElement>, disabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || disabled || typeof IntersectionObserver === "undefined" || typeof window === "undefined") return;
    if (entranceOff()) return;
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return;
    const parts = [...el.querySelectorAll<SVGElement>(":scope > svg > *")];
    parts.forEach((p, i) => p.style.setProperty("--uipack-i", String(Math.min(i, ENTRANCE_STEPS))));
    el.setAttribute("data-enter", "wait");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clear = () => {
      el.removeAttribute("data-enter");
      for (const p of parts) p.style.removeProperty("--uipack-i");
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        el.setAttribute("data-enter", "in");
        timer = setTimeout(clear, SETTLE_MS);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
      clear();
    };
  }, [ref, disabled]);
}
