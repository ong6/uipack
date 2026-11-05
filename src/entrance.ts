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

/** The whole drawing is revealed within this window, top edge first, in ms. */
export const ENTRANCE_SWEEP = 240;
/** Longest single part transition (theme.css), plus slack, before cleanup, in ms. */
const SETTLE_MS = ENTRANCE_SWEEP + 520;

/**
 * Scroll-in entrance for a figure's canvas, layered on a drawing that is always there. The
 * finished drawing is what paints first, whatever happens next: a full-page capture, a jump
 * straight to the bottom, a slow scroll or no scroll at all. Only a canvas that starts below the
 * fold animates, and only once its first pixel reaches the viewport: then each top-level part of
 * its drawing gets a delay from where its top edge sits (`--uipack-d`, 0 at the top to
 * ENTRANCE_SWEEP at the bottom), `data-enter="in"` plays a one-off keyframe that washes the
 * drawing in from the top down, and the attribute and the delays are removed once it settles so
 * hover transitions take over again. Nothing is ever hidden while waiting, so a missed or late
 * IntersectionObserver callback costs the animation, never the drawing. Nothing happens under
 * reduced motion, without IntersectionObserver, for a canvas already on screen, or when the host
 * turned it off (`entranceOff`).
 */
export function useFigureEntrance(ref: RefObject<HTMLElement>, disabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || disabled || typeof IntersectionObserver === "undefined" || typeof window === "undefined") return;
    if (entranceOff()) return;
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) return;
    let parts: SVGElement[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clear = () => {
      el.removeAttribute("data-enter");
      for (const p of parts) p.style.removeProperty("--uipack-d");
    };
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      parts = [...el.querySelectorAll<SVGElement>(":scope > svg > *")];
      const svg = el.querySelector(":scope > svg")?.getBoundingClientRect();
      for (const p of parts) {
        const r = p.getBoundingClientRect();
        const at = svg && svg.height > 0 ? Math.min(1, Math.max(0, (r.top - svg.top) / svg.height)) : 0;
        p.style.setProperty("--uipack-d", `${Math.round(at * ENTRANCE_SWEEP)}ms`);
      }
      el.setAttribute("data-enter", "in");
      timer = setTimeout(clear, SETTLE_MS);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
      clear();
    };
  }, [ref, disabled]);
}
