import { useEffect, useState, type ReactNode } from "react";
import { SLIDE_ROLES } from "../storyline";
import type { DeckSlide, DeckTheme } from "../types";
import { notesOf, pad } from "./format";
import { SlideThumbnail } from "./Layer";

/** The speaker view: the live stage, the next slide, a clock and the talk track. */
export function Presenter({
  slides,
  index,
  theme,
  stage,
}: {
  slides: DeckSlide[];
  index: number;
  theme: DeckTheme;
  stage: ReactNode;
}) {
  const [started, setStarted] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - started) / 1000));
  const notes = notesOf(slides[index]);
  const upcoming = slides[index + 1];
  const role = slides[index].role;
  return (
    <div className="uipack-deck-presenter">
      <div className="uipack-deck-presenter__current">{stage}</div>
      <aside className="uipack-deck-presenter__side">
        <section className="uipack-deck-presenter__next">
          <h3>Next</h3>
          {upcoming ? (
            <SlideThumbnail slide={upcoming} index={index + 1} count={slides.length} theme={theme} />
          ) : (
            <p className="uipack-deck-presenter__end">End of deck</p>
          )}
        </section>
        <section className="uipack-deck-presenter__clock">
          <span aria-label="Elapsed time">
            {pad(Math.floor(elapsed / 60))}:{pad(elapsed % 60)}
          </span>
          <button
            type="button"
            onClick={() => {
              setStarted(Date.now());
              setNow(Date.now());
            }}
          >
            Reset clock
          </button>
        </section>
        <section className="uipack-deck-presenter__notes">
          {role && (
            <p className="uipack-deck-presenter__role">
              <b>{SLIDE_ROLES[role].label}</b> answers “{SLIDE_ROLES[role].question}”
            </p>
          )}
          <h3>Say</h3>
          <p>{notes?.say ?? "No talk track for this slide."}</p>
          {notes?.delivery && (
            <>
              <h3>Delivery</h3>
              <p>{notes.delivery}</p>
            </>
          )}
          {notes?.next && (
            <>
              <h3>Bridge</h3>
              <p>{notes.next}</p>
            </>
          )}
        </section>
      </aside>
    </div>
  );
}
