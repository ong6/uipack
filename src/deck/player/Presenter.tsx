import { useEffect, useState, type ReactNode } from "react";
import { SLIDE_ROLES, WORDS_PER_MINUTE } from "../storyline";
import type { DeckSlide, DeckTheme } from "../types";
import { notesOf, pad } from "./format";
import { SlideThumbnail } from "./Layer";

const clock = (seconds: number) => `${pad(Math.floor(seconds / 60))}:${pad(Math.round(seconds) % 60)}`;

/**
 * Where each slide should start and end, in seconds, against a budget: each slide's share is its
 * talk track's length, scaled so the deck fills `budget` (unscaled when there is no budget).
 * Appendix slides take no time.
 */
export function slidePlan(slides: DeckSlide[], budget?: number) {
  const own = slides.map((s) =>
    s.role === "appendix" ? 0 : ((notesOf(s)?.say.match(/\S+/g)?.length ?? 0) / WORDS_PER_MINUTE) * 60,
  );
  const total = own.reduce((a, b) => a + b, 0);
  const k = budget && total ? budget / total : 1;
  let at = 0;
  return own.map((sec) => {
    const start = at;
    at += sec * k;
    return { start, end: at };
  });
}

/** The speaker view: the live stage, the next press and the next slide, a paced clock and the talk track. */
export function Presenter({
  slides,
  index,
  theme,
  stage,
  cue,
  minutes,
}: {
  slides: DeckSlide[];
  index: number;
  theme: DeckTheme;
  stage: ReactNode;
  /** What the next press does: a build, a tour stop or the next slide. */
  cue?: string;
  /** The speaking budget; defaults to the talk tracks' own length. */
  minutes?: number;
}) {
  const [started, setStarted] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - started) / 1000));
  const plan = slidePlan(slides, minutes ? minutes * 60 : undefined);
  const budget = plan.length ? plan[plan.length - 1].end : 0;
  const { start, end } = plan[index] ?? { start: 0, end: 0 };
  // Behind when the clock has passed this slide's planned end; ahead when it hasn't reached its start.
  const drift = elapsed > end ? elapsed - end : elapsed < start ? elapsed - start : 0;
  const pace = Math.abs(drift) < 15 ? "on pace" : drift > 0 ? `${clock(drift)} behind` : `${clock(-drift)} ahead`;
  const notes = notesOf(slides[index]);
  const upcoming = slides[index + 1];
  const role = slides[index].role;
  return (
    <div className="uipack-deck-presenter">
      <div className="uipack-deck-presenter__current">{stage}</div>
      <aside className="uipack-deck-presenter__side">
        <section className="uipack-deck-presenter__next">
          <h3>Next press</h3>
          {cue && <p className="uipack-deck-presenter__cue">{cue}</p>}
          <h3>Next slide</h3>
          {upcoming ? (
            <SlideThumbnail slide={upcoming} index={index + 1} count={slides.length} theme={theme} />
          ) : (
            <p className="uipack-deck-presenter__end">End of deck</p>
          )}
        </section>
        <section className="uipack-deck-presenter__clock">
          {/* Visually hidden words name each number; the elapsed clock is a timer (never announced on its own). */}
          <span role="timer">
            <span className="uipack-deck-sr">Elapsed time </span>
            {clock(elapsed)}
          </span>
          {budget > 0 && (
            <span className="uipack-deck-presenter__budget">
              <span>
                <span className="uipack-deck-sr">{minutes ? "Time budget " : "Talk track length "}</span>/ {clock(budget)}
              </span>
              <span
                className="uipack-deck-presenter__pace"
                data-pace={Math.abs(drift) < 15 ? "on" : drift > 0 ? "behind" : "ahead"}
              >
                {pace} · this slide {clock(start)}–{clock(end)}
              </span>
              <span className="uipack-deck-presenter__bar" aria-hidden="true">
                <i style={{ left: `${(start / budget) * 100}%`, width: `${((end - start) / budget) * 100}%` }} />
                <b style={{ left: `${Math.min(1, elapsed / budget) * 100}%` }} />
              </span>
            </span>
          )}
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
