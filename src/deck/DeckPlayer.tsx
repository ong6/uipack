import { useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../env";
import { useLayerFlight } from "../flight";
import { Controls } from "./player/Controls";
import { useNextCue } from "./player/cue";
import { Layer, useCanvasScale } from "./player/Layer";
import { Overview } from "./player/Overview";
import { Presenter } from "./player/Presenter";
import { PrintJob, Printout } from "./player/Print";
import { Reader } from "./player/Reader";
import { useDeckKeys, useSwipe } from "./player/useDeckKeys";
import { useDeckSync } from "./player/useDeckSync";
import { useFullscreen } from "./player/useFullscreen";
import { startIndexOf, useDeckPosition } from "./player/usePosition";
import { useDeckTransition } from "./player/useTransition";
import { lintDeck, type LintOptions } from "./storyline";
import type { DeckPosition, DeckSlide, DeckTheme, DeckTransition } from "./types";

export interface DeckPlayerProps {
  slides: DeckSlide[];
  /** Stable deck ID. Windows showing the same ID stay in step (audience and speaker view). */
  id: string;
  /** Accessible name of the deck. */
  title: string;
  theme?: DeckTheme;
  /** Default transition for slides that do not set one. */
  transition?: DeckTransition;
  motion?: "auto" | "none";
  /** `presenter` shows the current slide, the next slide, the talk track and a clock. */
  mode?: "audience" | "presenter";
  /** Slide ID or index to open on, and the build step. */
  initial?: { slide?: string | number; step?: number };
  onPositionChange?: (position: DeckPosition & { id: string }) => void;
  /** Where the Speaker button opens. Defaults to this page with `presenter=1`. */
  presenterHref?: string;
  /** `focus`: keys work while the deck has focus. `global`: anywhere on the page. */
  keyboard?: "focus" | "global";
  /**
   * `read` stacks every slide, fully built, with its talk track: for phones and for decks read alone.
   * `print` lays every slide out as a 16:9 page for printing or saving as PDF.
   */
  view?: "present" | "read" | "print";
  /** Print each slide's headline and talk track beside it (the PDF / Print button and `view="print"`). */
  printNotes?: boolean;
  /** Run the storyline checks and show findings in the overview's Storyline tab. For authoring, not for the audience. */
  lint?: boolean | LintOptions;
  /**
   * Speaking budget in minutes. The speaker view paces against it (elapsed against where each slide
   * should start). Defaults to `lint.minutes`, else the talk tracks' own length at 135 words a minute.
   */
  minutes?: number;
  className?: string;
}

/**
 * Plays a deck: one transition grammar, build steps, keyboard, touch and buttons, an overview,
 * full screen and a synced speaker view. Slides are authored on a 1920×1080 canvas.
 */
export function DeckPlayer(props: DeckPlayerProps) {
  // An empty deck (still loading, or filtered to nothing) gets an empty stage, not a crash.
  if (props.slides.length === 0) return <EmptyDeck {...props} />;
  return <Player {...props} />;
}

function EmptyDeck({ title, theme = "light", className }: DeckPlayerProps) {
  return (
    <div
      className={["uipack-deck", className].filter(Boolean).join(" ")}
      data-theme={theme}
      role="region"
      aria-label={title}
      aria-roledescription="slide deck"
    >
      <div className="uipack-deck-stage uipack-deck-empty">
        <p>No slides</p>
      </div>
    </div>
  );
}

function Player({
  slides,
  id,
  title,
  theme = "light",
  transition = "advance",
  motion = "auto",
  mode = "audience",
  initial,
  onPositionChange,
  presenterHref,
  keyboard = "focus",
  view: initialView = "present",
  printNotes = false,
  lint = false,
  minutes,
  className,
}: DeckPlayerProps) {
  const count = slides.length;
  const [overview, setOverview] = useState(false);
  const [reading, setReading] = useState(initialView === "read");
  // How the reader opens: at the current slide when a link named one, focused when the viewer
  // switched from presenting (so Read keeps their place); at the top otherwise.
  const [readOpen, setReadOpen] = useState<{ focus: boolean } | null>(() =>
    startIndexOf(slides, initial?.slide) > 0 ? { focus: false } : null,
  );
  const [printing, setPrinting] = useState(false);
  // The viewer's setting (shared with every entry) or the deck's own motion="none".
  const prefersReduced = usePrefersReducedMotion();
  const reducedMotion = motion === "none" || prefersReduced;
  const { ref: stageRef, el: stageEl, scale } = useCanvasScale();
  const rootRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);
  const overviewButtonRef = useRef<HTMLButtonElement>(null);
  // The storyline findings, run while the overview is open and only again when the slides or the
  // options change. Options are keyed by value, so an inline `lint={{ template }}` doesn't rerun them.
  const lintKey = lint ? JSON.stringify(lint === true ? {} : lint) : "";
  const findings = useMemo(
    () => (overview && lintKey ? lintDeck(slides, JSON.parse(lintKey) as LintOptions) : undefined),
    [overview, slides, lintKey],
  );

  const { settle, fly } = useLayerFlight(() =>
    stageEl.current?.querySelectorAll<HTMLElement>(".uipack-deck-layer").forEach((el) => {
      el.style.zIndex = "";
      el.style.visibility = "";
    }),
  );
  const { view, viewRef, commit, go, next, prev, maxStep } = useDeckPosition({ slides, initial, toRef, settle });
  const cue = useNextCue(mode === "presenter", toRef, view.index, view.step, maxStep, slides);
  useDeckTransition({ view, viewRef, commit, fromRef, toRef, scale, slides, transition, reducedMotion, fly, settle });
  useDeckSync({ id, view, viewRef, commit, go, slides, onPositionChange });
  const fullscreen = useFullscreen(rootRef);

  const openPresenter = () => {
    let href = presenterHref;
    if (!href) {
      const url = new URL(location.href);
      url.searchParams.set("presenter", "1");
      url.searchParams.set("slide", slides[view.index].id);
      href = url.toString();
    }
    window.open(href, `uipack-deck-speaker-${id}`, "popup,width=1280,height=820");
  };

  const openReader = () => {
    setReadOpen({ focus: true });
    setReading(true);
  };

  const closeOverview = () => {
    setOverview(false);
    requestAnimationFrame(() => overviewButtonRef.current?.focus());
  };

  const onKeyDown = useDeckKeys({
    rootRef,
    keyboard,
    enabled: !overview && !reading,
    actions: {
      next,
      prev,
      first: () => go(0, 0),
      last: () => go(count - 1, Infinity),
      overview: () => setOverview(true),
      fullscreen: fullscreen.toggle,
      presenter: mode === "presenter" ? undefined : openPresenter,
    },
  });
  const swipe = useSwipe(next, prev);

  const current = slides[view.index];
  const from = view.from ? slides[view.from.index] : null;
  const stepNow = Math.min(view.step, maxStep);
  const atStart = view.index === 0 && stepNow === 0;
  const atEnd = view.index === count - 1 && view.step >= maxStep;

  const stage = (
    <div ref={stageRef} className="uipack-deck-stage" data-tone={current.tone ?? "paper"} {...swipe}>
      <div className="uipack-deck-canvas" style={{ transform: `scale(${scale})`, visibility: scale ? undefined : "hidden" }}>
        {from && view.from && (
          <Layer
            key={`layer-${view.from.index}`}
            ref={fromRef}
            slide={from}
            index={view.from.index}
            count={count}
            step={view.from.step}
            active={false}
            theme={theme}
            reducedMotion={reducedMotion}
          />
        )}
        <Layer
          key={`layer-${view.index}`}
          ref={toRef}
          slide={current}
          index={view.index}
          count={count}
          step={view.step}
          active
          theme={theme}
          reducedMotion={reducedMotion}
        />
      </div>
    </div>
  );

  const controls = (
    <Controls
      slides={slides}
      index={view.index}
      atStart={atStart}
      atEnd={atEnd}
      mode={mode}
      canFullscreen={fullscreen.available}
      fullscreen={fullscreen.fullscreen}
      overviewButtonRef={overviewButtonRef}
      onPrev={prev}
      onNext={next}
      onRead={openReader}
      onPrint={() => setPrinting(true)}
      onOverview={() => setOverview(true)}
      onPresenter={openPresenter}
      onFullscreen={fullscreen.toggle}
    />
  );

  return (
    <div
      ref={rootRef}
      className={["uipack-deck", className].filter(Boolean).join(" ")}
      data-theme={theme}
      data-mode={mode}
      data-motion={reducedMotion ? "none" : "auto"}
      data-index={view.index}
      data-step={Number.isFinite(view.step) ? view.step : "all"}
      data-transitioning={view.from ? "" : undefined}
      role="region"
      aria-label={title}
      aria-roledescription="slide deck"
      aria-keyshortcuts="ArrowLeft ArrowRight Space Home End G F S"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {initialView === "print" ? (
        <Printout slides={slides} theme={theme} notes={printNotes} inPlace />
      ) : reading ? (
        <Reader
          slides={slides}
          theme={theme}
          index={view.index}
          open={readOpen}
          onPresent={(i) => {
            setReading(false);
            go(i, 0);
            requestAnimationFrame(() => {
              const root = rootRef.current;
              if (!root) return;
              root.focus({ preventScroll: true });
              // The reader was scrolled (a phone reads far down the page): bring the stage up with it.
              const { top, bottom } = root.getBoundingClientRect();
              if (top < 0 || bottom > window.innerHeight)
                root.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
            });
          }}
        />
      ) : (
        <>
          {mode === "audience" && (
            // Shown on a phone only (deck.css): a 1920px slide is drawn at a fifth of its size there.
            <p className="uipack-deck-phone-hint">
              Slides are small on a phone; the read view is easier.{" "}
              <button type="button" onClick={openReader}>
                Read view
              </button>
            </p>
          )}
          {mode === "presenter" ? (
            <Presenter
              slides={slides}
              index={view.index}
              theme={theme}
              stage={stage}
              cue={cue}
              minutes={minutes ?? (typeof lint === "object" ? lint.minutes : undefined)}
            />
          ) : (
            stage
          )}
          {controls}
        </>
      )}
      {printing && (
        <PrintJob
          slides={slides}
          theme={theme}
          title={title}
          notes={printNotes}
          onDone={() => {
            setPrinting(false);
            rootRef.current?.focus({ preventScroll: true });
          }}
        />
      )}
      <p className="uipack-deck-sr" aria-live="polite">
        Slide {view.index + 1} of {count}: {current.title}
      </p>
      {overview && (
        <Overview
          slides={slides}
          index={view.index}
          theme={theme}
          findings={findings}
          onPick={(i) => {
            go(i, 0);
            // Focus the deck, not the All slides button, so Space and the arrows move through the
            // picked slide instead of reopening the overview.
            setOverview(false);
            requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true }));
          }}
          onClose={closeOverview}
        />
      )}
    </div>
  );
}
