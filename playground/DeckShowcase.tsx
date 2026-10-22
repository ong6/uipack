import { useEffect, useLayoutEffect, useRef } from "react";
import { DeckPlayer } from "../src/deck";
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

const keys = [
  ["→ ↓ Space PageDown", "Next build, then next slide"],
  ["← ↑ Shift+Space PageUp", "Back"],
  ["Home / End", "First / last slide"],
  ["G", "All slides"],
  ["S", "Speaker view in a second window, kept in step"],
  ["F", "Full screen"],
  ["Swipe", "Next or back on touch screens"],
];

const moves = [
  ["advance", "Default", "The outgoing slide steps aside; the incoming slide's blocks settle in, in reading order."],
  [
    "morph",
    "Same thing, new place",
    "Elements wrapped in Morph with the same id on both slides travel and resize; the rest fades.",
  ],
  [
    "{ zoom: id }",
    "Look inside",
    "The camera flies into the Morph element on the previous slide, which opens into this one. Back reverses it.",
  ],
  ["fade / none", "Jumps", "Overview jumps and Home/End crossfade. none cuts."],
];

/** The width kept for the column beside the slide in the side layout, with the gap before it. */
const SIDE_COLUMN = 340;
/** The page height around a slide that sits under the intro: header, title, intro and controls. */
const STACKED_CHROME = 484;

/**
 * Keeps the slide and its controls on the first screen: the stage may be as tall as the viewport
 * leaves below the page header and the controls (deck.css reads --deck-chrome).
 *
 * Under the intro on a wide, short window (a laptop), the slide would be height-bound and leave a
 * third of the column empty beside it. There the page takes its side layout (`data-layout="side"`,
 * deck-showcase.css): the slide starts right under the title, as wide as the window's height allows,
 * and the intro and the reference tables sit in a column beside it. The choice reads only the
 * window and the column, never the layout it makes, so it cannot flip back and forth. The controls'
 * measured height is counted too, should they wrap.
 */
function useFitBelowHeader() {
  const ref = useRef<HTMLElement>(null);
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
      const column = main.clientWidth;
      const stacked = Math.min(column, ((window.innerHeight - STACKED_CHROME) * 16) / 9);
      const side = window.innerWidth >= 960 && stacked <= column - SIDE_COLUMN;
      if ((el.dataset.layout === "side") !== side) {
        if (side) el.dataset.layout = "side";
        else delete el.dataset.layout;
      }
      // The deck, not the section: in the side layout the section has no box of its own.
      const deck = el.querySelector(".uipack-deck") ?? el;
      const top = deck.getBoundingClientRect().top + window.scrollY;
      // On main, whose grid sizes the slide's column from it in the side layout. One row of controls
      // first; if they still wrap at the width that gives, their measured height. (Trying one row
      // each time means a window made taller gets the larger slide back once the row fits again.)
      const chrome = (controlsHeight: number) =>
        main.style.setProperty("--deck-chrome", `${Math.round(top + controlsHeight + 14 + 22)}px`);
      chrome(44);
      if (controls && controls.offsetHeight > 48) chrome(controls.offsetHeight);
    };
    fit();
    ro?.observe(main);
    window.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
      ro?.disconnect();
      main.style.removeProperty("--deck-chrome");
    };
  }, []);
  return ref;
}

export default function DeckShowcase() {
  const { theme } = useShowcaseTheme();
  const fitRef = useFitBelowHeader();
  const initial = { slide: params.get("slide") ?? undefined, step: Number(params.get("step") ?? 0) || 0 };
  useShowcaseNote(view === "print" || presenter ? null : missingNote);

  if (view === "print") {
    return (
      <main className="deck-print-page" data-theme={theme}>
        <StandaloneHeading name="Print view" />
        <DeckPlayer
          id={deckId}
          title={`${example.name} deck`}
          slides={example.slides}
          theme={theme}
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

  return (
    <>
      <section ref={fitRef} className="deck-showcase" data-catalog-entry={deckEntries[0].id}>
        <DeckPlayer
          id={deckId}
          title="Deck player example"
          slides={example.slides}
          theme={theme}
          motion={motion}
          view={view}
          lint={example.lint ?? true}
          initial={initial}
          onPositionChange={syncUrl}
        />
        <div className="deck-showcase__reference">
          <section>
            <h2>Transitions</h2>
            <table>
              <tbody>
                {moves.map(([code, name, text]) => (
                  <tr key={code}>
                    <th scope="row">
                      <code>{code}</code>
                    </th>
                    <td>
                      <b>{name}.</b> {text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section>
            <h2>Keys</h2>
            <table>
              <tbody>
                {keys.map(([k, v]) => (
                  <tr key={k}>
                    <th scope="row">
                      <kbd>{k}</kbd>
                    </th>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </section>
    </>
  );
}
