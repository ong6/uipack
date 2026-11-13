// Live previews of parts, mounted as they near the viewport and optionally scaled down from a design
// width: the Assets gallery's cards (GalleryShowcase.tsx) and the landing page's parts bento
// (LandingShowcase.tsx). Previews are pictures of parts documented on their own pages: inert and
// hidden from assistive tech unless the caller keeps them live.
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { FigureLayoutWidthContext } from "../src";
import { partMounted, partWasMounted } from "./scroll-memory";

/**
 * Previews still waiting to mount, in page order. Each mounts when it nears the viewport, or,
 * failing that, in idle time, a couple at a time, so a card the reader jumps or scrolls past
 * without the page ever seeing it (a filter, a #link, a fast scroll on a busy page) still fills in.
 */
const waiting: (() => void)[] = [];
let pumping = false;
const whenIdle = (run: () => void) =>
  "requestIdleCallback" in window ? requestIdleCallback(run, { timeout: 400 }) : setTimeout(run, 60);
function mountLater(mount: () => void) {
  waiting.push(mount);
  if (pumping) return;
  pumping = true;
  const step = () => {
    // Two per turn keeps each mount's render a short task.
    waiting.splice(0, 2).forEach((m) => m());
    if (waiting.length) whenIdle(step);
    else pumping = false;
  };
  whenIdle(step);
}

/**
 * Mount children once the box nears the viewport (or in idle time, unless `idle` is false), and
 * keep them. `inert` (the default) makes the box inert, a picture rather than a control. `margin`
 * and `threshold` are the IntersectionObserver's: how near counts, and how much must show.
 * `restored` is for a box that is taller mounted, and names it (unique on its page): Back or Forward
 * to a page the reader left with it mounted mounts it at once (scroll-memory.ts), so the page is as
 * tall as it was and the reader's place in it is the same place.
 */
export function useNearViewport<T extends HTMLElement>({
  inert = true,
  idle = true,
  margin = "800px 0px",
  threshold = 0,
  restored,
}: { inert?: boolean; idle?: boolean; margin?: string; threshold?: number; restored?: string } = {}) {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (inert) el.setAttribute("inert", "");
    if (typeof IntersectionObserver === "undefined") return;
    let live = true;
    const mount = () => {
      if (!live) return;
      live = false;
      io.disconnect();
      if (restored) partMounted(restored);
      setNear(true);
    };
    // A busy page can deliver several entries at once (out of view, in view, out again): any
    // entry in view counts, not just the first.
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && mount(), {
      rootMargin: margin,
      threshold,
    });
    io.observe(el);
    if (restored && partWasMounted(restored)) mount();
    else if (idle) mountLater(mount);
    return () => {
      live = false;
      io.disconnect();
    };
  }, [inert, idle, margin, threshold, restored]);
  return { ref, near };
}

/**
 * Children rendered at `width` CSS px, then scaled into the box: "contain" fits the whole thing in
 * it, "top" fills the width and crops below. Figures inside lay out at the design width
 * (FigureLayoutWidthContext), so their text floor ignores the scale.
 */
export function Scaled({
  width,
  fit,
  ratio = "16 / 10",
  className,
  stageClassName,
  margin,
  idle,
  uiStyle,
  children,
}: {
  width: number;
  fit: "contain" | "top";
  ratio?: string;
  className: string;
  stageClassName: string;
  margin?: string;
  /** Also mount in idle time, not only near the viewport (default true). */
  idle?: boolean;
  /** The style the picture is drawn in (data-ui-style), when it differs from the page's. */
  uiStyle?: string;
  children: ReactNode;
}) {
  const { ref, near } = useNearViewport<HTMLDivElement>({ margin, idle });
  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [natural, setNatural] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    // The stage's own height at its design width: transforms don't change layout size.
    const ro = new ResizeObserver(() => setNatural(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [near]);
  const byWidth = box.w / width;
  const scale = fit === "contain" && natural ? Math.min(byWidth, box.h / natural) : byWidth;
  const left = (box.w - width * scale) / 2;
  const top = fit === "contain" && natural ? Math.max(0, (box.h - natural * scale) / 2) : 0;
  return (
    <div ref={ref} className={className} style={{ aspectRatio: ratio }} aria-hidden="true" data-ui-style={uiStyle}>
      {near && (
        <div
          ref={stage}
          className={stageClassName}
          style={{ width, transform: `translate(${left}px, ${top}px) scale(${scale})`, visibility: box.w ? undefined : "hidden" }}
        >
          <FigureLayoutWidthContext.Provider value={width}>
            <Suspense fallback={null}>{children}</Suspense>
          </FigureLayoutWidthContext.Provider>
        </div>
      )}
    </div>
  );
}
