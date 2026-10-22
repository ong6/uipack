import { useLayoutEffect, useRef } from "react";
import { DeckPlayer } from "../src/deck";
import "../src/deck/deck.css";
import "../src/deck/bento.css";
import "../src/deck/consulting/consulting.css";
import "../src/mechanism/mechanism.css";
import { ShowcaseShell, useShowcaseTheme } from "./ShowcaseShell";
import { deckEntries } from "./catalog";
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
  ["morph", "Same thing, new place", "Elements wrapped in Morph with the same id on both slides travel and resize; the rest fades."],
  ["{ zoom: id }", "Look inside", "The camera flies into the Morph element on the previous slide, which opens into this one. Back reverses it."],
  ["fade / none", "Jumps", "Overview jumps and Home/End crossfade. none cuts."],
];

/**
 * Keeps the slide and its controls on the first screen: the stage may be as tall as the viewport
 * leaves below the page header (deck.css reads --deck-chrome).
 */
function useFitBelowHeader() {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => el.style.setProperty("--deck-chrome", `${Math.round(el.getBoundingClientRect().top + window.scrollY) + 80}px`);
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return ref;
}

export default function DeckShowcase() {
  const { theme, flip } = useShowcaseTheme();
  const fitRef = useFitBelowHeader();
  const initial = { slide: params.get("slide") ?? undefined, step: Number(params.get("step") ?? 0) || 0 };

  if (view === "print") {
    return (
      <main className="deck-print-page" data-theme={theme}>
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
    <ShowcaseShell active="deck" theme={theme} flip={flip}>
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
    </ShowcaseShell>
  );
}
