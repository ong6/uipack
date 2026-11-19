import { useEffect, useMemo, useRef, useState } from "react";
import type { PresentationTheme, SlideStarterData } from "./types";
import { renderSlideSvgWithFloor } from "./renderSlideSvg";
import { DEFAULT_RENDER_WIDTH } from "../scale";
import { SpeakerGuide } from "./SpeakerGuide";
import type { UiStyleId } from "../style";

export interface SlideStarterProps {
  slide: SlideStarterData;
  theme?: PresentationTheme;
  /** The style it is painted in (sets data-ui-style); omitted, the nearest ancestor's, else Technical. */
  uiStyle?: UiStyleId;
  showSpeech?: boolean;
  className?: string;
  onCopySpeech?: (text: string) => void;
}

/** Mono labels at 12px and up (docs/system/spec-settings.md): no text in the preview renders smaller. */
const MIN_TEXT_PX = 12;
const SLIDE_UNITS = 1200;

/** Slide units for 12px at a preview `width` CSS px wide, whole so a resize re-renders only on a step. */
const textFloor = (width: number) => Math.ceil((MIN_TEXT_PX * SLIDE_UNITS) / width);

export function SlideStarter({
  slide,
  theme = "light",
  uiStyle,
  showSpeech = true,
  className = "",
  onCopySpeech,
}: SlideStarterProps) {
  const preview = useRef<HTMLDivElement>(null);
  // The server, and the first client render, assume the width a Figure does; the effect measures.
  const [floor, setFloor] = useState(() => textFloor(DEFAULT_RENDER_WIDTH));
  useEffect(() => {
    const el = preview.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    // clientWidth is the layout width inside the border, untouched by a scaling transform.
    const read = () => {
      if (el.clientWidth > 0) setFloor(textFloor(el.clientWidth));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const svg = useMemo(() => renderSlideSvgWithFloor(slide, { theme, paint: "css" }, floor), [slide, theme, floor]);
  return (
    <section
      className={`uipack-slide-starter ${className}`.trim()}
      data-theme={theme}
      data-ui-style={uiStyle}
      data-layout={slide.layout}
    >
      <figure className="uipack-slide-starter__figure">
        <div ref={preview} className="uipack-slide-starter__preview" dangerouslySetInnerHTML={{ __html: svg }} />
        <figcaption>
          <strong>{slide.title}</strong>
          <span>{slide.description}</span>
        </figcaption>
      </figure>
      {showSpeech && <SpeakerGuide speech={slide.speech} slideTitle={slide.title} theme={theme} onCopy={onCopySpeech} />}
    </section>
  );
}
