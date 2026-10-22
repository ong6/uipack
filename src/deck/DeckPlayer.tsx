import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { DeckSlideContext } from "./parts";
import { SLIDE_ROLES, lintDeck, storylineOf, talkSeconds, type LintFinding, type LintOptions } from "./storyline";
import { CANVAS_WIDTH, resolveTransition, runTransition } from "./transitions";
import type { DeckPosition, DeckSlide, DeckTheme, DeckTransition } from "./types";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

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

function usePrefersReducedMotion(motion: "auto" | "none") {
  const [reduced, setReduced] = useState(motion === "none");
  useEffect(() => {
    if (motion === "none") return setReduced(true);
    if (typeof matchMedia === "undefined") return setReduced(false);
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, [motion]);
  return reduced;
}

/** Screen pixels per canvas pixel for a 16:9 box. */
function useCanvasScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / CANVAS_WIDTH);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, scale };
}

const railAt = (i: number, count: number) => `${count > 1 ? (i / (count - 1)) * 100 : 0}%`;
const pad = (n: number) => String(n).padStart(2, "0");
const notesOf = (slide?: DeckSlide) =>
  !slide?.notes ? undefined : typeof slide.notes === "string" ? { say: slide.notes, delivery: "", next: undefined } : slide.notes;

interface LayerProps {
  slide: DeckSlide;
  index: number;
  count: number;
  step: number;
  active: boolean;
  thumbnail?: boolean;
  theme: DeckTheme;
  reducedMotion: boolean;
}

const Layer = forwardRef<HTMLDivElement, LayerProps>(function Layer(
  { slide, index, count, step, active, thumbnail = false, theme, reducedMotion },
  ref,
) {
  return (
    <div
      ref={ref}
      className="uipack-deck-layer"
      data-tone={slide.tone ?? "paper"}
      data-slide={slide.id}
      role={thumbnail ? undefined : "group"}
      aria-roledescription={thumbnail ? undefined : "slide"}
      aria-label={thumbnail ? undefined : `${index + 1} of ${count}: ${slide.title}`}
      aria-hidden={active ? undefined : true}
      {...(active ? {} : { inert: "" })}
    >
      <div className="uipack-deck-layer__bg" />
      <DeckSlideContext.Provider value={{ step, active, thumbnail, index, count }}>
        {slide.render({ step, active, thumbnail, theme, reducedMotion })}
      </DeckSlideContext.Provider>
    </div>
  );
});

/** A still, scaled copy of one slide, fully built. Used by the overview and the speaker view. */
export function SlideThumbnail({
  slide,
  index,
  count,
  theme = "light",
}: {
  slide: DeckSlide;
  index: number;
  count: number;
  theme?: DeckTheme;
}) {
  const { ref, scale } = useCanvasScale();
  return (
    <div ref={ref} className="uipack-deck-thumb" data-tone={slide.tone ?? "paper"}>
      <div className="uipack-deck-canvas" style={{ transform: `scale(${scale})`, visibility: scale ? undefined : "hidden" }}>
        <Layer slide={slide} index={index} count={count} step={Infinity} active={false} thumbnail theme={theme} reducedMotion />
      </div>
    </div>
  );
}

/**
 * Plays a deck: one transition grammar, build steps, keyboard, touch and buttons, an overview,
 * full screen and a synced speaker view. Slides are authored on a 1920×1080 canvas.
 */
export function DeckPlayer({
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
  const reducedMotion = usePrefersReducedMotion(motion);
  const { ref: stageRef, scale } = useCanvasScale();
  const rootRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);
  const overviewButtonRef = useRef<HTMLButtonElement>(null);
  const anims = useRef<Animation[]>([]);
  const maxStep = useRef(0);
  const viewRef = useRef(view);
  viewRef.current = view;

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
      setView((v) =>
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
    if (v.step < maxStep.current) setView({ ...v, step: v.step + 1 });
    else if (v.index < count - 1) go(v.index + 1, 0);
  }, [count, go]);

  const prev = useCallback(() => {
    const v = viewRef.current;
    const step = Math.min(v.step, maxStep.current);
    if (step > 0) setView({ ...v, step: step - 1 });
    else if (v.index > 0) go(v.index - 1, Infinity);
  }, [go]);

  // Count the builds on the current slide.
  useIsoLayoutEffect(() => {
    const layer = toRef.current;
    if (!layer) return;
    // Builds reveal at `data-build`; a part with its own stops (a bento tour) declares `data-steps`.
    maxStep.current = Array.from(layer.querySelectorAll("[data-build], [data-steps]")).reduce(
      (m, el) => Math.max(m, Number(el.getAttribute("data-build") ?? el.getAttribute("data-steps")) || 0),
      0,
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
      setView((v) => (v.seq === seq ? { ...v, from: null } : v));
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
    Promise.all(started.map((a) => a.finished)).then(() => {
      if (viewRef.current.seq === seq) done();
    }, () => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.seq]);

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
        if (v.index === msg.index) setView({ ...v, step: msg.step ?? 0 });
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

  useEffect(() => {
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
  const stepNow = Math.min(view.step, maxStep.current);
  const atStart = view.index === 0 && stepNow === 0;
  const atEnd = view.index === count - 1 && view.step >= maxStep.current;

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
    <div className="uipack-deck-controls">
      <button type="button" className="uipack-deck-step" onClick={prev} disabled={atStart} aria-label="Previous">
        <span aria-hidden="true">←</span>
      </button>
      <div className="uipack-deck-rail" aria-hidden="true">
        {slides.map((s, i) => (
          <span key={s.id} style={{ left: railAt(i, count) }} data-passed={i <= view.index ? "" : undefined} />
        ))}
        <i style={{ left: railAt(view.index, count) }} />
      </div>
      <span className="uipack-deck-counter">
        {pad(view.index + 1)} / {pad(count)}
      </span>
      <button type="button" className="uipack-deck-step" onClick={next} disabled={atEnd} aria-label="Next">
        <span aria-hidden="true">→</span>
      </button>
      <span className="uipack-deck-tools">
        {mode === "audience" && (
          <button type="button" onClick={() => setReading(true)}>
            Read
          </button>
        )}
        <button type="button" ref={overviewButtonRef} onClick={() => setOverview(true)} aria-keyshortcuts="G">
          All slides
        </button>
        {mode === "audience" && (
          <button type="button" onClick={openPresenter} aria-keyshortcuts="S">
            Speaker view
          </button>
        )}
        {typeof document !== "undefined" && document.fullscreenEnabled !== false && (
          <button type="button" onClick={toggleFullscreen} aria-keyshortcuts="F" aria-pressed={fullscreen}>
            {fullscreen ? "Exit full screen" : "Full screen"}
          </button>
        )}
      </span>
    </div>
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
          {mode === "presenter" ? (
            <Presenter slides={slides} index={view.index} theme={theme} stage={stage} />
          ) : (
            stage
          )}
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

/** Every slide, fully built, with its talk track underneath. Reads like a document. */
function Reader({
  slides,
  theme,
  onPresent,
}: {
  slides: DeckSlide[];
  theme: DeckTheme;
  onPresent: (index: number) => void;
}) {
  return (
    <div className="uipack-deck-read">
      <div className="uipack-deck-read__head">
        <p>Reading · {slides.length} slides</p>
        <button type="button" onClick={() => onPresent(0)}>
          Present
        </button>
      </div>
      <ol>
        {slides.map((s, i) => {
          const notes = notesOf(s);
          return (
            <li key={s.id}>
              <SlideThumbnail slide={s} index={i} count={slides.length} theme={theme} />
              <div className="uipack-deck-read__notes">
                <h3>
                  <span>{pad(i + 1)}</span> {s.title}
                </h3>
                {notes?.say && <p>{notes.say}</p>}
                <button type="button" onClick={() => onPresent(i)} aria-label={`Present from slide ${i + 1}: ${s.title}`}>
                  Present from here
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Overview({
  slides,
  index,
  theme,
  findings,
  onPick,
  onClose,
}: {
  slides: DeckSlide[];
  index: number;
  theme: DeckTheme;
  findings?: LintFinding[];
  onPick: (index: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"slides" | "storyline">("slides");
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus();
  }, []);
  const onKeyDown = (e: ReactKeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    const buttons = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Tab" && buttons.length) {
      if (e.shiftKey && at <= 0) {
        e.preventDefault();
        buttons[buttons.length - 1].focus();
      } else if (!e.shiftKey && at === buttons.length - 1) {
        e.preventDefault();
        buttons[0].focus();
      }
    }
    const tiles = buttons.filter((b) => b.dataset.tile !== undefined);
    const ti = tiles.indexOf(document.activeElement as HTMLButtonElement);
    if (ti >= 0 && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      tiles[Math.min(Math.max(ti + (e.key === "ArrowRight" ? 1 : -1), 0), tiles.length - 1)].focus();
    }
  };
  return (
    <div ref={ref} className="uipack-deck-overview" role="dialog" aria-modal="true" aria-label="All slides" onKeyDown={onKeyDown}>
      <div className="uipack-deck-overview__head">
        <p>All slides · {slides.length}</p>
        <span className="uipack-deck-overview__tabs">
          <button type="button" aria-pressed={tab === "slides"} onClick={() => setTab("slides")}>
            Slides
          </button>
          <button type="button" aria-pressed={tab === "storyline"} onClick={() => setTab("storyline")}>
            Storyline
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </span>
      </div>
      {tab === "storyline" ? (
        <Storyline slides={slides} index={index} findings={findings} onPick={onPick} />
      ) : (
      <ol className="uipack-deck-overview__grid">
        {slides.map((s, i) => (
          <li key={s.id}>
            <button type="button" data-tile="" aria-current={i === index ? "true" : undefined} onClick={() => onPick(i)}>
              <SlideThumbnail slide={s} index={i} count={slides.length} theme={theme} />
              <span>
                <b>{pad(i + 1)}</b> {s.title}
              </span>
            </button>
          </li>
        ))}
      </ol>
      )}
    </div>
  );
}

const severityLabel = { error: "Fix", warn: "Check", tip: "Tip" } as const;

/** The ghost deck: headlines in order with their roles. Read alone, it should carry the argument. */
function Storyline({
  slides,
  index,
  findings,
  onPick,
}: {
  slides: DeckSlide[];
  index: number;
  findings?: LintFinding[];
  onPick: (index: number) => void;
}) {
  const entries = storylineOf(slides);
  const deckWide = findings?.filter((f) => !f.slideId) ?? [];
  const minutes = Math.round(talkSeconds(slides) / 6) / 10;
  return (
    <div className="uipack-deck-storyline">
      <p className="uipack-deck-storyline__intro">
        Read only the headlines. They should make the whole argument. Talk track ≈ {minutes} min.
      </p>
      {deckWide.length > 0 && (
        <ul className="uipack-deck-storyline__findings" aria-label="Deck checks">
          {deckWide.map((f, i) => (
            <li key={i} data-severity={f.severity}>
              <b>{severityLabel[f.severity]}</b> {f.message}
            </li>
          ))}
        </ul>
      )}
      <ol>
        {entries.map((e, i) => {
          const own = findings?.filter((f) => f.slideId === e.id) ?? [];
          return (
            <li key={e.id} data-appendix={e.appendix ? "" : undefined}>
              <button type="button" data-tile="" aria-current={i === index ? "true" : undefined} onClick={() => onPick(i)}>
                <span className="uipack-deck-storyline__num">{pad(e.number)}</span>
                <span className="uipack-deck-storyline__role">{e.roleLabel ?? "—"}</span>
                <span className="uipack-deck-storyline__title">{e.title}</span>
              </button>
              {own.length > 0 && (
                <ul className="uipack-deck-storyline__findings">
                  {own.map((f, j) => (
                    <li key={j} data-severity={f.severity}>
                      <b>{severityLabel[f.severity]}</b> {f.message}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Presenter({
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
          <button type="button" onClick={() => { setStarted(Date.now()); setNow(Date.now()); }}>
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
