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
  /** Print every slide, one per 16:9 page; the browser's dialog also saves a PDF. */
  onPrint: () => void;
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
  onPrint,
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
        {mode === "audience" && (
          <button type="button" onClick={onPrint} title="Download as PDF or print: one slide per 16:9 page">
            <Label long="PDF / Print" short="PDF" />
          </button>
        )}
        <button type="button" ref={overviewButtonRef} onClick={onOverview} aria-keyshortcuts="G">
          <Label long="All slides" short="Slides" />
        </button>
        {mode === "audience" && (
          <button type="button" onClick={onPresenter} aria-keyshortcuts="S">
            <Label long="Speaker view" short="Speaker" />
          </button>
        )}
        {canFullscreen && (
          <button type="button" onClick={onFullscreen} aria-keyshortcuts="F" aria-pressed={fullscreen}>
            {fullscreen ? <Label long="Exit full screen" short="Exit" /> : "Full screen"}
          </button>
        )}
      </span>
    </div>
  );
}

/**
 * A tool's name, with a shorter form for a narrow bar (deck.css swaps them by the bar's width), so
 * the tools keep to the counter's row under a laptop-sized slide. The full name stays the button's
 * accessible name, and it contains the short one, so voice control finds it by what it shows.
 */
function Label({ long, short }: { long: string; short: string }) {
  return (
    <>
      <span className="uipack-deck-tool-long">{long}</span>
      <span className="uipack-deck-tool-short" aria-hidden="true">
        {short}
      </span>
    </>
  );
}
