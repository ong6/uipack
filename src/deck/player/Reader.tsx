import { useRef } from "react";
import type { DeckSlide, DeckTheme } from "../types";
import { useDetailStops } from "./details";
import { notesOf, pad } from "./format";
import { SlideThumbnail } from "./Layer";

/**
 * Every slide, fully built, with its claim as the heading and its talk track underneath. Reads
 * like a document. A slide whose camera tour shows detail (a bento) adds a still per detail, so a
 * reader sees what the presenter showed.
 */
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
        {slides.map((s, i) => (
          <ReadItem key={s.id} slide={s} index={i} count={slides.length} theme={theme} onPresent={onPresent} />
        ))}
      </ol>
    </div>
  );
}

function ReadItem({
  slide: s,
  index: i,
  count,
  theme,
  onPresent,
}: {
  slide: DeckSlide;
  index: number;
  count: number;
  theme: DeckTheme;
  onPresent: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const stops = useDetailStops(ref, s);
  const notes = notesOf(s);
  return (
    <li>
      <div ref={ref} className="uipack-deck-read__stills">
        <SlideThumbnail slide={s} index={i} count={count} theme={theme} />
        {stops.map((stop) => (
          <figure key={stop.step} className="uipack-deck-read__detail">
            <SlideThumbnail slide={s} index={i} count={count} theme={theme} step={stop.step} />
            <figcaption>Detail · {stop.label}</figcaption>
          </figure>
        ))}
      </div>
      <div className="uipack-deck-read__notes">
        <p className="uipack-deck-read__title">
          <span>{pad(i + 1)}</span> {s.title}
        </p>
        <h2>{s.headline ?? s.title}</h2>
        {notes?.say && <p>{notes.say}</p>}
        <button type="button" onClick={() => onPresent(i)} aria-label={`Present from slide ${i + 1}: ${s.title}`}>
          Present from here
        </button>
      </div>
    </li>
  );
}
