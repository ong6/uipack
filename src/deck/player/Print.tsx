import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { DeckSlide, DeckTheme } from "../types";
import { notesOf, pad } from "./format";
import { Layer } from "./Layer";

/**
 * Every slide as a 16:9 page (1280×720 CSS px, the 13.33×7.5 in PowerPoint page), fully built and
 * still: what the browser prints, and what "Save as PDF" saves. The canvas scale is fixed in CSS
 * (2/3, or 1/2 beside notes) rather than measured, because print layout never runs resize observers.
 */
export function Printout({ slides, theme, notes = false }: { slides: DeckSlide[]; theme: DeckTheme; notes?: boolean }) {
  return (
    <div className="uipack-deck-print" data-notes={notes ? "" : undefined}>
      {slides.map((s, i) => {
        const talk = notesOf(s);
        return (
          <section key={s.id} className="uipack-deck-print__page" data-tone={s.tone ?? "paper"} aria-label={`${pad(i + 1)}: ${s.title}`}>
            <div className="uipack-deck-print__slide">
              <div className="uipack-deck-canvas">
                <Layer slide={s} index={i} count={slides.length} step={Infinity} active={false} thumbnail theme={theme} reducedMotion />
              </div>
            </div>
            {notes && (
              <div className="uipack-deck-print__notes">
                <h3>
                  <span>{pad(i + 1)}</span> {s.headline ?? s.title}
                </h3>
                {talk?.say && <p>{talk.say}</p>}
              </div>
            )}
          </section>
        );
      })}
    </div>
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
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    let cancelled = false;
    const previous = document.title;
    const finish = () => {
      window.removeEventListener("afterprint", finish);
      window.removeEventListener("focus", finish);
      document.title = previous;
      if (!cancelled) done.current();
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
  }, [title]);
  return createPortal(
    <div className="uipack-deck-print-root">
      <div className="uipack-deck" data-theme={theme}>
        <Printout slides={slides} theme={theme} notes={notes} />
      </div>
    </div>,
    document.body,
  );
}
