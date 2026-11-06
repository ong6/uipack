import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DeckPlayer } from "../src/deck";
// The slide faces are self-hosted (src/web/fonts.css): Technical's IBM Plex Sans and Mono, so
// slide fit is the same on every machine.
import "../src/web/fonts.css";
import "../src/deck/deck.css";
import "../src/deck/bento.css";
import "../src/deck/consulting/consulting.css";
import "../src/mechanism/mechanism.css";
import { useShowcaseNote, useShowcaseTheme } from "./ShowcaseShell";
import { deckEntries, documentTitle, resolvePage } from "./catalog";
import { deckExamples } from "./deckExamples";
import "./deck-showcase.css";

const params = new URLSearchParams(location.search);
const presenter = params.get("presenter") === "1";
const example = deckExamples.find((d) => d.id === params.get("deck")) ?? deckExamples[0];
const deckId = `uipack-deck-${example.id}`;
const motion = params.get("motion") === "none" ? "none" : "auto";
// Phones open the deck as a document; presenting is a desktop or projector job. ?view=print is the
// printable page (one slide per 16:9 page; &notes=1 adds the talk track).
const view =
  params.get("view") === "print"
    ? "print"
    : params.get("view") === "read" || (params.get("view") !== "present" && matchMedia("(max-width: 600px)").matches)
      ? "read"
      : "present";

// A view or slide the address names but the deck lacks is said under the intro, like a bad ?deck=.
const askedView = params.get("view");
const askedSlide = params.get("slide");
const missingNote =
  [
    askedView && !["print", "read", "present"].includes(askedView)
      ? `View “${askedView}” not found, showing the ${view === "read" ? "read" : "present"} view.`
      : null,
    askedSlide && !example.slides.some((s) => s.id === askedSlide) ? `Slide “${askedSlide}” not found, showing slide 1.` : null,
  ]
    .filter(Boolean)
    .join(" ") || null;

/**
 * The printable page and the speaker window stand alone, without the shell: they name themselves
 * in the tab and carry a visually hidden h1, so a screen reader's heading list starts with them.
 */
function StandaloneHeading({ name }: { name: string }) {
  const page = resolvePage("deck", location.search);
  useEffect(() => {
    document.title = `${name} · ${documentTitle(page)}`;
  }, [name, page]);
  return (
    <h1 className="uipack-deck-sr">
      {page.label} deck, {name.toLowerCase()}
    </h1>
  );
}

function syncUrl({ id, step }: { id: string; step: number }) {
  const url = new URL(location.href);
  url.searchParams.set("slide", id);
  if (step > 0 && Number.isFinite(step)) url.searchParams.set("step", String(step));
  else url.searchParams.delete("step");
  history.replaceState(null, "", url);
}

/**
 * Keeps the slide and its controls on the first screen: the stage may be as tall as the viewport
 * leaves below the page header and the controls (deck.css reads --deck-chrome).
 *
 * Presenting (`?view=present`, or Present pressed in the read view), the page header no longer
 * counts: the slide is as large as the window less one row of controls, and the page scrolls past
 * the header to it when it would not fit on the first screen otherwise. The header stays in the page.
 */
function useFitBelowHeader(presenting: boolean) {
  const ref = useRef<HTMLElement>(null);
  // Whether the page opened presenting and hasn't been brought to the slide yet.
  const openedPresenting = useRef(presenting);
  useLayoutEffect(() => {
    const el = ref.current;
    const main = el?.closest("main");
    if (!el || !main) return;
    // The controls are found, and observed, when they appear; main's box changes size then.
    let watched: Element | null = null;
    const ro = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(() => fit());
    const fit = () => {
      const controls = el.querySelector<HTMLElement>(".uipack-deck-controls");
      if (ro && controls && controls !== watched) {
        if (watched) ro.unobserve(watched);
        ro.observe((watched = controls));
      }
      const deck = el.querySelector(".uipack-deck") ?? el;
      const top = presenting ? 0 : deck.getBoundingClientRect().top + window.scrollY;
      // One row of controls first; if they still wrap at the width that gives, their measured height.
      const chrome = (controlsHeight: number) =>
        main.style.setProperty("--deck-chrome", `${Math.round(top + controlsHeight + 14 + (presenting ? 12 : 22))}px`);
      chrome(44);
      if (controls && controls.offsetHeight > 48) chrome(controls.offsetHeight);
    };
    fit();
    // Presenting from the first load: bring the stage to the top of the window if the slide and its
    // controls don't already fit under the header (not on a phone, whose slide is as wide as the page).
    if (presenting && openedPresenting.current && window.innerWidth > 600) {
      openedPresenting.current = false;
      const stage = el.querySelector(".uipack-deck-stage");
      const controls = el.querySelector(".uipack-deck-controls");
      if (stage && controls && controls.getBoundingClientRect().bottom > window.innerHeight)
        window.scrollTo({ top: stage.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
    }
    ro?.observe(main);
    window.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
      ro?.disconnect();
      main.style.removeProperty("--deck-chrome");
    };
  }, [presenting]);
  return ref;
}

/**
 * The printable page (`?view=print`) and the speaker window (`?presenter=1`): documents of their
 * own, rendered by main.tsx without the shell. Every other /deck address is the docs page
 * (docs/deck.md or docs/deck-consulting.md) with `DeckDemo` in it.
 */
export default function DeckShowcase() {
  const { theme } = useShowcaseTheme();
  const initial = { slide: params.get("slide") ?? undefined, step: Number(params.get("step") ?? 0) || 0 };

  if (view === "print") {
    return (
      <main className="deck-print-page" data-theme={theme}>
        <StandaloneHeading name="Print view" />
        <DeckPlayer
          id={deckId}
          title={`${example.name} deck`}
          slides={example.slides}
          theme={theme}
          uiStyle="technical"
          view="print"
          printNotes={params.get("notes") === "1"}
        />
      </main>
    );
  }

  if (presenter) {
    return (
      <main className="deck-speaker-page" data-theme={theme}>
        <StandaloneHeading name="Speaker view" />
        <DeckPlayer
          id={deckId}
          title="Deck player example, speaker view"
          slides={example.slides}
          theme={theme}
          uiStyle="technical"
          motion={motion}
          mode="presenter"
          minutes={example.lint?.minutes}
          keyboard="global"
          initial={initial}
          onPositionChange={syncUrl}
        />
      </main>
    );
  }
  return <DeckDemo />;
}

/**
 * `deck-player` (docs/deck.md, docs/deck-consulting.md): the example deck `?deck=` names, sized to
 * keep the slide and its controls on the first screen, with its position in the address.
 */
export function DeckDemo() {
  const { theme } = useShowcaseTheme();
  // Presenting: opened with ?view=present, or switched to from the read view.
  const [presenting, setPresenting] = useState(view === "present" && params.get("view") === "present");
  const fitRef = useFitBelowHeader(presenting);
  const initial = { slide: params.get("slide") ?? undefined, step: Number(params.get("step") ?? 0) || 0 };
  useShowcaseNote(missingNote);
  return (
    <section
      ref={fitRef}
      className="deck-showcase"
      data-catalog-entry={deckEntries[0].id}
      data-presenting={presenting || undefined}
    >
      <DeckPlayer
        id={deckId}
        title="Deck player example"
        slides={example.slides}
        theme={theme}
        uiStyle="technical"
        motion={motion}
        view={view}
        onViewChange={(v) => setPresenting(v === "present")}
        lint={example.lint ?? true}
        initial={initial}
        onPositionChange={syncUrl}
      />
    </section>
  );
}
