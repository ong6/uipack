import type { Ref } from "react";
import type { DeckSlide } from "../types";
import { pad, railAt } from "./format";

export interface ControlsProps {
  slides: DeckSlide[];
  index: number;
  atStart: boolean;
  atEnd: boolean;
  mode: "audience" | "presenter";
  /** Whether to offer the full-screen button. */
  canFullscreen: boolean;
  fullscreen: boolean;
  overviewButtonRef: Ref<HTMLButtonElement>;
  onPrev: () => void;
  onNext: () => void;
  onRead: () => void;
  onOverview: () => void;
  onPresenter: () => void;
  onFullscreen: () => void;
}

/** The bar under the stage: previous and next, the progress rail, the counter and the tools. */
export function Controls({
  slides,
  index,
  atStart,
  atEnd,
  mode,
  canFullscreen,
  fullscreen,
  overviewButtonRef,
  onPrev,
  onNext,
  onRead,
  onOverview,
  onPresenter,
  onFullscreen,
}: ControlsProps) {
  const count = slides.length;
  return (
    <div className="uipack-deck-controls">
      <button type="button" className="uipack-deck-step" onClick={onPrev} disabled={atStart} aria-label="Previous">
        <span aria-hidden="true">←</span>
      </button>
      <div className="uipack-deck-rail" aria-hidden="true">
        {slides.map((s, i) => (
          <span key={s.id} style={{ left: railAt(i, count) }} data-passed={i <= index ? "" : undefined} />
        ))}
        <i style={{ left: railAt(index, count) }} />
      </div>
      <span className="uipack-deck-counter">
        {pad(index + 1)} / {pad(count)}
      </span>
      <button type="button" className="uipack-deck-step" onClick={onNext} disabled={atEnd} aria-label="Next">
        <span aria-hidden="true">→</span>
      </button>
      <span className="uipack-deck-tools">
        {mode === "audience" && (
          <button type="button" onClick={onRead}>
            Read
          </button>
        )}
        <button type="button" ref={overviewButtonRef} onClick={onOverview} aria-keyshortcuts="G">
          All slides
        </button>
        {mode === "audience" && (
          <button type="button" onClick={onPresenter} aria-keyshortcuts="S">
            Speaker view
          </button>
        )}
        {canFullscreen && (
          <button type="button" onClick={onFullscreen} aria-keyshortcuts="F" aria-pressed={fullscreen}>
            {fullscreen ? "Exit full screen" : "Full screen"}
          </button>
        )}
      </span>
    </div>
  );
}
