import { useEffect, useRef } from "react";
import type { DeckSlide, DeckTheme } from "../types";
import { useDetailStops } from "./details";
import { notesOf, pad } from "./format";
import { SlideThumbnail } from "./Layer";

/**
 * Every slide, fully built, with its claim as the heading and its talk track underneath. Reads
 * like a document. A slide whose camera tour shows detail (a bento) adds a still per detail, so a
 * reader sees what the presenter showed.
 *
 * `index` is the deck's current slide: the head's Present button starts there. When `open` is set,
 * the reader opens at that slide (scrolled to it), and `open.focus` also focuses its Present from
 * here button, so switching back from presenting keeps the reader's place.
 */
export function Reader({
  slides,
  theme,
  index = 0,
  open,
  onPresent,
}: {
  slides: DeckSlide[];
  theme: DeckTheme;
  index?: number;
  open?: { focus: boolean } | null;
  onPresent: (index: number) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  // Once, on mount: the reader opens where the deck is (a shared ?slide= link, or the slide just presented).
  useEffect(() => {
    if (!open) return;
    // After a frame, so each item's stills (and any detail stills) have their final height.
    const raf = requestAnimationFrame(() => {
      const item = listRef.current?.children[index] as HTMLElement | undefined;
      if (!item) return;
      item.scrollIntoView({ block: "start" });
      if (open.focus) item.querySelector<HTMLButtonElement>(".uipack-deck-read__present")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="uipack-deck-read">
      <div className="uipack-deck-read__head">
        <p>Reading · {slides.length} slides</p>
        <button type="button" onClick={() => onPresent(index)}>
          {index > 0 ? `Present from ${pad(index + 1)}` : "Present"}
        </button>
      </div>
      <ol ref={listRef}>
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
        <button
          type="button"
          className="uipack-deck-read__present"
          onClick={() => onPresent(i)}
          aria-label={`Present from slide ${i + 1}: ${s.title}`}
        >
          Present from here
        </button>
      </div>
    </li>
  );
}
