import type { PresentationTheme, SlideStarterData } from "./types";
import { renderSlideSvg } from "./renderSlideSvg";
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

export function SlideStarter({
  slide,
  theme = "light",
  uiStyle,
  showSpeech = true,
  className = "",
  onCopySpeech,
}: SlideStarterProps) {
  return (
    <section
      className={`uipack-slide-starter ${className}`.trim()}
      data-theme={theme}
      data-ui-style={uiStyle}
      data-layout={slide.layout}
    >
      <figure className="uipack-slide-starter__figure">
        <div
          className="uipack-slide-starter__preview"
          dangerouslySetInnerHTML={{
            __html: renderSlideSvg(slide, { theme, paint: "css" }),
          }}
        />
        <figcaption>
          <strong>{slide.title}</strong>
          <span>{slide.description}</span>
        </figcaption>
      </figure>
      {showSpeech && <SpeakerGuide speech={slide.speech} slideTitle={slide.title} theme={theme} onCopy={onCopySpeech} />}
    </section>
  );
}
