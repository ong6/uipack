import { forwardRef, useCallback, useRef, useState } from "react";
import { useIsoLayoutEffect } from "../../env";
import { DeckSlideContext } from "../parts";
import { CANVAS_WIDTH } from "../transitions";
import type { DeckSlide, DeckTheme } from "../types";

/**
 * Screen pixels per canvas pixel for a 16:9 box. `ref` is a callback ref, so a box that unmounts
 * and mounts again (the stage after the read view) is measured and observed afresh; `el` holds
 * the current element for code that needs it.
 */
export function useCanvasScale() {
  const el = useRef<HTMLDivElement | null>(null);
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const ref = useCallback((next: HTMLDivElement | null) => {
    el.current = next;
    setNode(next);
  }, []);
  const [scale, setScale] = useState(0);
  useIsoLayoutEffect(() => {
    if (!node) return;
    const measure = () => setScale(node.clientWidth / CANVAS_WIDTH);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [node]);
  return { ref, el, scale };
}

interface LayerProps {
  slide: DeckSlide;
  index: number;
  count: number;
  step: number;
  active: boolean;
  thumbnail?: boolean;
  theme: DeckTheme;
  reducedMotion: boolean;
}

export const Layer = forwardRef<HTMLDivElement, LayerProps>(function Layer(
  { slide, index, count, step, active, thumbnail = false, theme, reducedMotion },
  ref,
) {
  return (
    <div
      ref={ref}
      className="uipack-deck-layer"
      data-tone={slide.tone ?? "paper"}
      data-slide={slide.id}
      role={thumbnail ? undefined : "group"}
      aria-roledescription={thumbnail ? undefined : "slide"}
      aria-label={thumbnail ? undefined : `${index + 1} of ${count}: ${slide.title}`}
      aria-hidden={active ? undefined : true}
      {...(active ? {} : { inert: "" })}
    >
      <div className="uipack-deck-layer__bg" />
      <DeckSlideContext.Provider value={{ step, active, thumbnail, index, count }}>
        {slide.render({ step, active, thumbnail, theme, reducedMotion })}
      </DeckSlideContext.Provider>
    </div>
  );
});

/** A still, scaled copy of one slide, fully built. Used by the overview and the speaker view. */
export function SlideThumbnail({
  slide,
  index,
  count,
  theme = "light",
}: {
  slide: DeckSlide;
  index: number;
  count: number;
  theme?: DeckTheme;
}) {
  const { ref, scale } = useCanvasScale();
  return (
    <div ref={ref} className="uipack-deck-thumb" data-tone={slide.tone ?? "paper"}>
      <div className="uipack-deck-canvas" style={{ transform: `scale(${scale})`, visibility: scale ? undefined : "hidden" }}>
        <Layer slide={slide} index={index} count={count} step={Infinity} active={false} thumbnail theme={theme} reducedMotion />
      </div>
    </div>
  );
}
