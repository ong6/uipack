import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLatest } from "../../env";
import type { DeckSlide, DeckTheme } from "../types";
import { useDetailStops, type DetailStop } from "./details";
import { notesOf, pad } from "./format";
import { Layer } from "./Layer";

/**
 * Every slide as a 16:9 page (1280×720 CSS px, the 13.33×7.5 in PowerPoint page), fully built and
 * still: what the browser prints, and what "Save as PDF" saves. A slide whose camera tour shows
 * detail (a bento) gets a page per detail after it. The canvas scale is fixed in CSS (2/3, or 1/2
 * beside notes) rather than measured, because print layout never runs resize observers.
 */
export function Printout({
  slides,
  theme,
  notes = false,
  inPlace = false,
}: {
  slides: DeckSlide[];
  theme: DeckTheme;
  notes?: boolean;
  /**
   * Shown on the page (`view="print"`), not only printed: the pages scroll sideways in a narrow
   * window, so the box is a named, focusable region that scrolls from the keyboard too.
   */
  inPlace?: boolean;
}) {
  return (
    <div
      className="uipack-deck-print"
      data-notes={notes ? "" : undefined}
      tabIndex={inPlace ? 0 : undefined}
      role={inPlace ? "region" : undefined}
      aria-label={inPlace ? "Printable pages" : undefined}
    >
      {slides.map((s, i) => (
        <PrintSlide key={s.id} slide={s} index={i} count={slides.length} theme={theme} notes={notes} />
      ))}
    </div>
  );
}

function PrintSlide({
  slide: s,
  index: i,
  count,
  theme,
  notes,
}: {
  slide: DeckSlide;
  index: number;
  count: number;
  theme: DeckTheme;
  notes: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const stops = useDetailStops(ref, s);
  const talk = notesOf(s);
  // A detail page's talk track: what the notes say at that stop, else the slide's whole track.
  const sayAt = (stop?: DetailStop) => (stop ? (talk?.stops?.[stop.id] ?? talk?.say) : talk?.say);
  const page = (step: number, stop?: DetailStop) => {
    const detail = stop?.label;
    const say = sayAt(stop);
    return (
      <section
        key={step}
        ref={detail ? undefined : ref}
        className="uipack-deck-print__page"
        data-tone={s.tone ?? "paper"}
        data-detail={detail ? "" : undefined}
        aria-label={`${pad(i + 1)}: ${s.title}${detail ? `, detail: ${detail}` : ""}`}
      >
        <div className="uipack-deck-print__slide">
          <div className="uipack-deck-canvas">
            <Layer slide={s} index={i} count={count} step={step} active={false} thumbnail theme={theme} reducedMotion />
          </div>
        </div>
        {notes && (
          <div className="uipack-deck-print__notes">
            <p className="uipack-deck-print__title">
              <span>{pad(i + 1)}</span> {s.title}
              {detail && <> · detail</>}
            </p>
            {/* Each page's claim is a section heading under the page's h1. */}
            <h2>{detail ?? s.headline ?? s.title}</h2>
            {!detail && talk?.delivery && (
              <p className="uipack-deck-print__cue">
                <b>Delivery</b> {talk.delivery}
              </p>
            )}
            {!detail && talk?.next && (
              <p className="uipack-deck-print__cue">
                <b>Next</b> {talk.next}
              </p>
            )}
          </div>
        )}
        {/* The talk track runs the width of the slide, under it, so the page has no empty band. A
          detail page carries the part said at its stop. */}
        {notes && say && (
          <div className="uipack-deck-print__say">
            <b>Say</b>
            <p>{say}</p>
          </div>
        )}
      </section>
    );
  };
  return (
    <>
      {page(Infinity)}
      {stops.map((stop) => page(stop.step, stop))}
    </>
  );
}

/**
 * Mounts the printout outside the host page (the print stylesheet hides everything else), waits for
 * fonts and a paint, prints, and calls `onDone` when the dialog closes.
 */
export function PrintJob({
  slides,
  theme,
  title,
  notes,
  onDone,
}: {
  slides: DeckSlide[];
  theme: DeckTheme;
  title: string;
  notes?: boolean;
  onDone: () => void;
}) {
  const doneRef = useLatest(onDone);
  useEffect(() => {
    let cancelled = false;
    const previous = document.title;
    const finish = () => {
      window.removeEventListener("afterprint", finish);
      window.removeEventListener("focus", finish);
      document.title = previous;
      if (!cancelled) doneRef.current();
      cancelled = true;
    };
    const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
    void (async () => {
      await (document.fonts?.ready ?? Promise.resolve());
      await frame();
      await frame();
      if (cancelled) return;
      // Browsers name the saved PDF after the document title.
      document.title = title;
      window.addEventListener("afterprint", finish);
      window.print();
      // A browser that skips afterprint still refocuses the page when its dialog closes.
      setTimeout(() => !cancelled && window.addEventListener("focus", finish, { once: true }), 0);
    })();
    return () => {
      cancelled = true;
      window.removeEventListener("afterprint", finish);
      window.removeEventListener("focus", finish);
      document.title = previous;
    };
  }, [title, doneRef]);
  return createPortal(
    <div className="uipack-deck-print-root">
      <div className="uipack-deck" data-theme={theme}>
        <Printout slides={slides} theme={theme} notes={notes} />
      </div>
    </div>,
    document.body,
  );
}
