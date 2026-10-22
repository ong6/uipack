import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { LintFinding } from "../storyline";
import type { DeckSlide, DeckTheme } from "../types";
import { pad } from "./format";
import { SlideThumbnail } from "./Layer";
import { Storyline } from "./Storyline";

/** The All slides dialog: a grid of thumbnails, or the storyline with its checks. */
export function Overview({
  slides,
  index,
  theme,
  findings,
  onPick,
  onClose,
}: {
  slides: DeckSlide[];
  index: number;
  theme: DeckTheme;
  findings?: LintFinding[];
  onPick: (index: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"slides" | "storyline">("slides");
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus();
  }, []);
  const onKeyDown = (e: ReactKeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    const buttons = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Tab" && buttons.length) {
      if (e.shiftKey && at <= 0) {
        e.preventDefault();
        buttons[buttons.length - 1].focus();
      } else if (!e.shiftKey && at === buttons.length - 1) {
        e.preventDefault();
        buttons[0].focus();
      }
    }
    const tiles = buttons.filter((b) => b.dataset.tile !== undefined);
    const ti = tiles.indexOf(document.activeElement as HTMLButtonElement);
    if (ti >= 0 && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      tiles[Math.min(Math.max(ti + (e.key === "ArrowRight" ? 1 : -1), 0), tiles.length - 1)].focus();
    }
  };
  return (
    <div ref={ref} className="uipack-deck-overview" role="dialog" aria-modal="true" aria-label="All slides" onKeyDown={onKeyDown}>
      <div className="uipack-deck-overview__head">
        <p>All slides · {slides.length}</p>
        <span className="uipack-deck-overview__tabs">
          <button type="button" aria-pressed={tab === "slides"} onClick={() => setTab("slides")}>
            Slides
          </button>
          <button type="button" aria-pressed={tab === "storyline"} onClick={() => setTab("storyline")}>
            Storyline
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </span>
      </div>
      {tab === "storyline" ? (
        <Storyline slides={slides} index={index} findings={findings} onPick={onPick} />
      ) : (
        <ol className="uipack-deck-overview__grid">
          {slides.map((s, i) => (
            <li key={s.id}>
              <button type="button" data-tile="" aria-current={i === index ? "true" : undefined} onClick={() => onPick(i)}>
                <SlideThumbnail slide={s} index={i} count={slides.length} theme={theme} />
                <span>
                  <b>{pad(i + 1)}</b> {s.title}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
