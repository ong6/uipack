import { forwardRef, useRef, useState } from "react";
import { useIsoLayoutEffect } from "../../env";
import { DeckSlideContext } from "../parts";
import { CANVAS_WIDTH } from "../transitions";
import type { DeckSlide, DeckTheme } from "../types";

/** Screen pixels per canvas pixel for a 16:9 box. */
export function useCanvasScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / CANVAS_WIDTH);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, scale };
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
