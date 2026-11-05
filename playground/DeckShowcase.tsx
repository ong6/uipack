import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DeckPlayer } from "../src/deck";
// Every style's slide faces are self-hosted (src/web/fonts.css): Technical's IBM Plex Sans and
// Mono (Plex for Landing and Graphical too), so slide fit is the same on every machine.
import "../src/styles/landing.css";
import "../src/styles/graphical.css";
import "../src/web/fonts.css";
import "../src/deck/deck.css";
import "../src/deck/bento.css";
import "../src/deck/consulting/consulting.css";
import "../src/mechanism/mechanism.css";
import { useShowcaseNote, useShowcaseStyle, useShowcaseTheme } from "./ShowcaseShell";
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
 * The narrowest slide the side layout may give. A wide but short window (a browser docked over an
 * editor panel) used to pick the side layout and get a slide a few hundred pixels wide or less,
 * because the side column is sized from the window height left under the title; below this width
 * the slide stacks under the intro at full width instead, and the page scrolls.
 */
const MIN_SIDE_SLIDE = 560;
/** Presenting, the window keeps only the controls' row under the slide (with their gap and a margin). */
const PRESENT_CHROME = 44 + 14 + 12;

/**
 * Keeps the slide and its controls on the first screen: the stage may be as tall as the viewport
 * leaves below the page header and the controls (deck.css reads --deck-chrome).
 *
 * Under the intro on a wide, short window (a laptop), the slide would be height-bound and leave a
 * third of the column empty beside it. There the page takes its side layout (`data-layout="side"`,
 * deck-showcase.css): the slide starts right under the title, as wide as the window's height allows,
 * with the intro beside it and the reference tables under it. The choice reads only the window and
 * the column, never the layout it makes, so it cannot flip back and forth. The controls' measured
 * height is counted too, should they wrap.
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
    // The window size at which the side layout was tried and came out too narrow.
    let rejected: string | null = null;
    const ro = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(() => fit());
    const fit = () => {
      const controls = el.querySelector<HTMLElement>(".uipack-deck-controls");
      if (ro && controls && controls !== watched) {
        if (watched) ro.unobserve(watched);
        ro.observe((watched = controls));
      }
      const column = main.clientWidth;
      const stacked = Math.min(column, ((window.innerHeight - (presenting ? PRESENT_CHROME : STACKED_CHROME)) * 16) / 9);
      // The slide the side layout would give: as main's grid sizes it (100svh less --deck-chrome),
      // from where the deck would start, right under the title.
      const h1 = main.querySelector(".showcase-title > h1");
      const sideTop =
        el.dataset.layout === "side"
          ? (el.querySelector(".uipack-deck") ?? el).getBoundingClientRect().top
          : (h1?.getBoundingClientRect().bottom ?? 0) + 24;
      const sideSlide = Math.min(column - SIDE_COLUMN, ((window.innerHeight - sideTop - (44 + 14 + 22)) * 16) / 9);
      const size = `${window.innerWidth}x${window.innerHeight}`;
      let side =
        rejected !== size &&
        window.innerWidth >= 960 &&
        stacked <= column - SIDE_COLUMN &&
        sideSlide >= MIN_SIDE_SLIDE &&
        sideSlide > stacked;
      // The estimate can't know whether the controls wrap in the narrower column; if the side layout
      // came out too narrow after all, stack and don't try it again until the window changes size.
      if (side && el.dataset.layout === "side") {
        const actual = (el.querySelector(".uipack-deck") ?? el).getBoundingClientRect().width;
        if (actual > 0 && actual < MIN_SIDE_SLIDE) {
          rejected = size;
          side = false;
        }
      }
      if ((el.dataset.layout === "side") !== side) {
        if (side) el.dataset.layout = "side";
        else delete el.dataset.layout;
      }
      // The deck, not the section: in the side layout the section has no box of its own.
      const deck = el.querySelector(".uipack-deck") ?? el;
      const top = presenting ? 0 : deck.getBoundingClientRect().top + window.scrollY;
      // On main, whose grid sizes the slide's column from it in the side layout. One row of controls
      // first; if they still wrap at the width that gives, their measured height. (Trying one row
      // each time means a window made taller gets the larger slide back once the row fits again.)
      const chrome = (controlsHeight: number) =>
        main.style.setProperty("--deck-chrome", `${Math.round(top + controlsHeight + 14 + (presenting ? 12 : 22))}px`);
      chrome(44);
      if (controls && controls.offsetHeight > 48) chrome(controls.offsetHeight);
    };
    fit();
    // Presenting from the first load: bring the stage to the top of the window if the slide and its
    // controls don't already fit under the header. (Present pressed in the read view scrolls the deck
    // into view itself.)
    // (Not on a phone, whose slide is as wide as the page anyway.)
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

export default function DeckShowcase() {
  const { theme } = useShowcaseTheme();
  // The style switcher in the shell's context line (?style=): the same slides, other tokens.
  const style = useShowcaseStyle(resolvePage("deck", location.search));
  // Presenting: opened with ?view=present, or switched to from the read view.
  const [presenting, setPresenting] = useState(view === "present" && params.get("view") === "present");
  const fitRef = useFitBelowHeader(presenting);
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
          uiStyle={style}
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
          uiStyle={style}
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
          uiStyle={style}
          motion={motion}
          view={view}
          onViewChange={(v) => setPresenting(v === "present")}
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
