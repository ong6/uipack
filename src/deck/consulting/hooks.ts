import { useEffect, useRef, useState } from "react";
import { useIsoLayoutEffect } from "../../env";
import { useDeckSlide } from "../parts";

/**
 * The layout size of a chart's box in canvas pixels. ResizeObserver reports layout sizes, which
 * ignore the stage's scale transform, so a chart draws at canvas resolution in every view.
 * `fixed` sizes skip measuring (tests, static exports).
 */
export function useChartSize(fixed?: { width?: number; height?: number }, fallback = { width: 640, height: 360 }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({
    width: fixed?.width ?? fallback.width,
    height: fixed?.height ?? fallback.height,
  });
  const fixedW = fixed?.width;
  const fixedH = fixed?.height;
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || (fixedW !== undefined && fixedH !== undefined)) return;
    const measure = () => {
      const w = fixedW ?? el.clientWidth;
      const h = fixedH ?? el.clientHeight;
      if (w > 0 && h > 0)
        setSize((s) => (Math.abs(s.width - w) < 0.5 && Math.abs(s.height - h) < 0.5 ? s : { width: w, height: h }));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fixedW, fixedH]);
  return { ref, ...size };
}

/**
 * Whether a chart's marks are at full size. On the live slide they start collapsed and grow in on
 * the frame after arrival; thumbnails, previews and outgoing copies render grown. Reduced motion is
 * handled in CSS (`data-motion="none"` on the deck turns the growth into a cut).
 */
export function useGrown(): boolean {
  const { active, thumbnail } = useDeckSlide();
  const [grown, setGrown] = useState(!active || thumbnail);
  useEffect(() => {
    if (grown) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setGrown(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return grown;
}
