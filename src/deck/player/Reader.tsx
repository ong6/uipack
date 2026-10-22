import type { DeckSlide, DeckTheme } from "../types";
import { notesOf, pad } from "./format";
import { SlideThumbnail } from "./Layer";

/** Every slide, fully built, with its talk track underneath. Reads like a document. */
export function Reader({
  slides,
  theme,
  onPresent,
}: {
  slides: DeckSlide[];
  theme: DeckTheme;
  onPresent: (index: number) => void;
}) {
  return (
    <div className="uipack-deck-read">
      <div className="uipack-deck-read__head">
        <p>Reading · {slides.length} slides</p>
        <button type="button" onClick={() => onPresent(0)}>
          Present
        </button>
      </div>
      <ol>
        {slides.map((s, i) => {
          const notes = notesOf(s);
          return (
            <li key={s.id}>
              <SlideThumbnail slide={s} index={i} count={slides.length} theme={theme} />
              <div className="uipack-deck-read__notes">
                <h3>
                  <span>{pad(i + 1)}</span> {s.title}
                </h3>
                {notes?.say && <p>{notes.say}</p>}
                <button type="button" onClick={() => onPresent(i)} aria-label={`Present from slide ${i + 1}: ${s.title}`}>
                  Present from here
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
