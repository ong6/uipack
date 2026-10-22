import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useIsoLayoutEffect, usePrefersReducedMotion } from "../env";
import { Controls } from "./player/Controls";
import { Layer, useCanvasScale } from "./player/Layer";
import { Overview } from "./player/Overview";
import { Presenter } from "./player/Presenter";
import { Reader } from "./player/Reader";
import { lintDeck, type LintOptions } from "./storyline";
import { resolveTransition, runTransition } from "./transitions";
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
  /** `read` stacks every slide, fully built, with its talk track: for phones and for decks read alone. */
  view?: "present" | "read";
  /** Run the storyline checks and show findings in the overview's Storyline tab. For authoring, not for the audience. */
  lint?: boolean | LintOptions;
  className?: string;
}

interface View {
  index: number;
  step: number;
  from: { index: number; step: number } | null;
  seq: number;
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
  lint = false,
  className,
}: DeckPlayerProps) {
  const count = slides.length;
  const startIndex = (() => {
    const s = initial?.slide;
    const i = typeof s === "number" ? s : s ? slides.findIndex((x) => x.id === s) : 0;
    return Math.min(Math.max(i, 0), Math.max(count - 1, 0));
  })();
  const [view, setView] = useState<View>({ index: startIndex, step: initial?.step ?? 0, from: null, seq: 0 });
  const [overview, setOverview] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [reading, setReading] = useState(initialView === "read");
  // The viewer's setting (shared with every entry) or the deck's own motion="none".
  const prefersReduced = usePrefersReducedMotion();
  const reducedMotion = motion === "none" || prefersReduced;
  const { ref: stageRef, scale } = useCanvasScale();
  const rootRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);
  const overviewButtonRef = useRef<HTMLButtonElement>(null);
  const anims = useRef<Animation[]>([]);
  // The current slide's last build step, counted from its DOM after each slide change.
  const [maxStep, setMaxStep] = useState(0);
  // The latest position, updated as soon as it changes, so quick repeated presses (a clicker's
  // double tap) each apply to where the previous one left the deck, not to the last render.
  const viewRef = useRef(view);
  const commit = (next: View) => {
    viewRef.current = next;
    setView(next);
  };

  const settle = () => {
    for (const a of anims.current) a.cancel();
    anims.current = [];
    stageRef.current?.querySelectorAll<HTMLElement>(".uipack-deck-layer").forEach((el) => {
      el.style.zIndex = "";
      el.style.visibility = "";
    });
  };

  const go = useCallback(
    (index: number, step = 0) => {
      const target = Math.min(Math.max(index, 0), count - 1);
      settle();
      const v = viewRef.current;
      commit(
        v.index === target
          ? { ...v, step, from: null }
          : { index: target, step, from: { index: v.index, step: v.step }, seq: v.seq + 1 },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count],
  );

  const next = useCallback(() => {
    const v = viewRef.current;
    if (v.step < maxStep) commit({ ...v, step: v.step + 1 });
    else if (v.index < count - 1) go(v.index + 1, 0);
  }, [count, go, maxStep]);

  const prev = useCallback(() => {
    const v = viewRef.current;
    const step = Math.min(v.step, maxStep);
    if (step > 0) commit({ ...v, step: step - 1 });
    else if (v.index > 0) go(v.index - 1, Infinity);
  }, [go, maxStep]);

  // Count the builds on the current slide.
  useIsoLayoutEffect(() => {
    const layer = toRef.current;
    if (!layer) return;
    // Builds reveal at `data-build`; a part with its own stops (a bento tour) declares `data-steps`.
    setMaxStep(
      Array.from(layer.querySelectorAll("[data-build], [data-steps]")).reduce(
        (m, el) => Math.max(m, Number(el.getAttribute("data-build") ?? el.getAttribute("data-steps")) || 0),
        0,
      ),
    );
  }, [view.index, slides]);

  // Run the transition once both layers are in the DOM, before the browser paints.
  useIsoLayoutEffect(() => {
    if (!view.from) return;
    const from = fromRef.current;
    const to = toRef.current;
    const seq = view.seq;
    const done = () => {
      settle();
      // Hide the outgoing copy until React removes it, so it never flashes back at full opacity.
      if (from) from.style.visibility = "hidden";
      if (viewRef.current.seq === seq) commit({ ...viewRef.current, from: null });
    };
    if (!from || !to || !scale) return done();
    const resolved = resolveTransition(view.from.index, view.index, (i) => slides[i]?.transition, transition);
    const started = runTransition({
      transition: resolved,
      from,
      to,
      direction: view.index > view.from.index ? 1 : -1,
      scale,
      reducedMotion,
    });
    anims.current = started;
    if (!started.length) return done();
    Promise.all(started.map((a) => a.finished)).then(
      () => {
        if (viewRef.current.seq === seq) done();
      },
      () => {},
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.seq]);

  // Unmounting mid-transition: stop the animations, so none outlives the deck or resolves into it.
  useEffect(() => () => anims.current.forEach((a) => a.cancel()), []);

  // Speaker view sync: every window showing this deck ID follows the last one moved.
  const channel = useRef<BroadcastChannel | null>(null);
  const remote = useRef(false);
  // The last position this window reported. Mounting (and StrictMode's second mount) reports nothing,
  // so opening a speaker window never moves the audience window.
  const reported = useRef({ index: view.index, step: view.step });
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(`uipack-deck:${id}`);
    channel.current = ch;
    ch.onmessage = (e: MessageEvent) => {
      const msg = e.data as { type: string; index?: number; step?: number };
      if (msg.type === "hello") {
        const v = viewRef.current;
        ch.postMessage({ type: "go", index: v.index, step: v.step });
      } else if (msg.type === "go" && typeof msg.index === "number") {
        const v = viewRef.current;
        if (v.index === msg.index && v.step === msg.step) return;
        remote.current = true;
        if (v.index === msg.index) commit({ ...v, step: msg.step ?? 0 });
        else go(msg.index, msg.step ?? 0);
      }
    };
    ch.postMessage({ type: "hello" });
    return () => {
      ch.close();
      channel.current = null;
    };
  }, [id, go]);

  useEffect(() => {
    const last = reported.current;
    if (last.index === view.index && last.step === view.step) return;
    reported.current = { index: view.index, step: view.step };
    onPositionChange?.({ index: view.index, step: view.step, id: slides[view.index].id });
    if (remote.current) {
      remote.current = false;
      return;
    }
    channel.current?.postMessage({ type: "go", index: view.index, step: view.step });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.index, view.step]);

  // Known only in the browser, so set after mount: the server and the first client render agree.
  const [canFullscreen, setCanFullscreen] = useState(false);
  useEffect(() => {
    setCanFullscreen(document.fullscreenEnabled !== false);
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen?.();
    else void rootRef.current?.requestFullscreen?.();
    rootRef.current?.focus();
  };

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

  const closeOverview = () => {
    setOverview(false);
    requestAnimationFrame(() => overviewButtonRef.current?.focus());
  };

  const onKeyDown = (e: KeyboardEvent | ReactKeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || overview || reading) return;
    const t = e.target as HTMLElement | null;
    if (t?.closest?.('input, textarea, select, [contenteditable="true"], [contenteditable=""], [data-deck-keys="own"]')) return;
    const onControl = Boolean(t?.closest?.("button, a, summary")) && t !== rootRef.current;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
        next();
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        prev();
        break;
      case " ":
      case "Enter":
        if (onControl) return;
        if (e.shiftKey) prev();
        else next();
        break;
      case "Home":
        go(0, 0);
        break;
      case "End":
        go(count - 1, Infinity);
        break;
      case "g":
      case "G":
      case "o":
        setOverview(true);
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      case "s":
      case "S":
        if (mode === "presenter") return;
        openPresenter();
        break;
      default:
        return;
    }
    e.preventDefault();
  };
  const keyHandler = useRef(onKeyDown);
  keyHandler.current = onKeyDown;
  useEffect(() => {
    if (keyboard !== "global") return;
    const handler = (e: KeyboardEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return; // the root handler already ran
      keyHandler.current(e);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyboard]);

  // Touch: a horizontal swipe on the stage changes slide.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: ReactPointerEvent) => {
    swipe.current = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : prev)();
  };

  const current = slides[view.index];
  const from = view.from ? slides[view.from.index] : null;
  const stepNow = Math.min(view.step, maxStep);
  const atStart = view.index === 0 && stepNow === 0;
  const atEnd = view.index === count - 1 && view.step >= maxStep;

  const stage = (
    <div
      ref={stageRef}
      className="uipack-deck-stage"
      data-tone={current.tone ?? "paper"}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (swipe.current = null)}
    >
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
      canFullscreen={canFullscreen}
      fullscreen={fullscreen}
      overviewButtonRef={overviewButtonRef}
      onPrev={prev}
      onNext={next}
      onRead={() => setReading(true)}
      onOverview={() => setOverview(true)}
      onPresenter={openPresenter}
      onFullscreen={toggleFullscreen}
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
      {reading ? (
        <Reader
          slides={slides}
          theme={theme}
          onPresent={(i) => {
            setReading(false);
            go(i, 0);
            requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true }));
          }}
        />
      ) : (
        <>
          {mode === "presenter" ? <Presenter slides={slides} index={view.index} theme={theme} stage={stage} /> : stage}
          {controls}
        </>
      )}
      <p className="uipack-deck-sr" aria-live="polite">
        Slide {view.index + 1} of {count}: {current.title}
      </p>
      {overview && (
        <Overview
          slides={slides}
          index={view.index}
          theme={theme}
          findings={lint ? lintDeck(slides, lint === true ? {} : lint) : undefined}
          onPick={(i) => {
            go(i, 0);
            closeOverview();
          }}
          onClose={closeOverview}
        />
      )}
    </div>
  );
}
