// SimGrid: a playable simulation drawn as a grid of identical cells (writers, jobs, agents) that
// start and finish at different times, with live counters and the designs it compares on one
// control. The caller supplies the simulation (per-cell start and end times, seeded); this owns the
// frame, the playback and the drawing. The drawing is one SVG path per state, so 5,000 cells are
// three elements; the loop rewrites them only when a count changes and writes the counters in place,
// without a React render per frame. Its resting frame is the finished run (server HTML, reduced
// motion, `static`); as it nears the viewport it rewinds and plays once, and it pauses off screen.
import { createElement, useContext, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CanvasView } from "../CanvasView";
import { FigureChromeContext } from "../context";
import { useFigureEntrance } from "../entrance";
import { useIsoLayoutEffect, useLatest, usePrefersReducedMotion } from "../env";
import { PauseGlyph, PlayGlyph, ReplayGlyph } from "../Figure";
import { isPointer } from "../hover";
import type { UiStyleId } from "../style";
import {
  cellMarks,
  formatCount,
  formatSeconds,
  gridColumns,
  gridViewBox,
  prepareRun,
  SIM_STATES,
  simAt,
  statePaths,
  type PreparedRun,
  type SimChoice,
  type SimRun,
  type SimState,
} from "./model";

/** The words SimGrid shows, all the site's. Any left out keep their default. */
export interface SimGridLabels {
  /** Legend entry for a cell that has not started. Default "Waiting". */
  waiting: string;
  /** Legend entry for a cell at work. Default "Running". */
  running: string;
  /** Legend entry for a finished cell. Default "Done". */
  done: string;
  /** Counter: the simulated clock. Default "Simulated time". */
  time: string;
  /** Counter: mean (end - start) over the cells done so far. Default "Mean time to done". */
  mean: string;
  /** Counter: cells done out of all. Default "Done". */
  count: string;
  /** Name of the design control. Default "Design". */
  designs: string;
}

const DEFAULT_LABELS: SimGridLabels = {
  waiting: "Waiting",
  running: "Running",
  done: "Done",
  time: "Simulated time",
  mean: "Mean time to done",
  count: "Done",
  designs: "Design",
};

export interface SimGridProps {
  /** The designs compared, on one control (radio buttons); the first is shown first. One design: no control. */
  designs: readonly { readonly id: string; readonly label: string }[];
  /** Checkboxes that change the simulation's inputs (jitter, a slow disk). `checked` is the starting state. */
  options?: readonly { readonly id: string; readonly label: string; readonly checked?: boolean }[];
  /**
   * The simulation: a pure, seeded function from the reader's choice to each cell's start and end
   * times. Called once per choice shown; pass a stable function (module scope or useCallback).
   */
  simulate: (choice: SimChoice) => SimRun;
  /**
   * Real seconds the first design (with the starting options) takes to play. Every design plays at
   * that same speed, so a slower design takes longer. Default 8.
   */
  duration?: number;
  labels?: Partial<SimGridLabels>;
  /** Formats a simulated time (the clock and the mean). Default one decimal and " s". */
  formatTime?: (t: number) => string;
  /** "Figure 01". Rendered mono, uppercase, before the eyebrow. */
  number?: string;
  eyebrow?: string;
  title?: string;
  /** Heading element for the title. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5;
  caption?: string;
  /** Accessible description of what the grid shows. */
  alt: string;
  theme?: "light" | "dark";
  uiStyle?: UiStyleId;
  /** Hold the finished run: no autoplay, no Play or Reset. The design and option controls stay. */
  static?: boolean;
  className?: string;
  id?: string;
}

/** Longest real frame the clock advances by, in seconds: a stalled tab never jumps the run. */
const MAX_STEP = 0.05;

const glyphs: Record<SimState, string> = {
  waiting: "M1.5 1.5h9v9h-9z",
  running: "M3.5 3.5h5v5h-5z",
  done: "M1 1h10v10h-10z",
};

/** The breakpoint the frame's CSS uses (theme.css): below it the narrow grid and the stacked counters. */
const NARROW_QUERY = "(max-width: 720px)";
const subscribeNarrow = (changed: () => void) => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener?.("change", changed);
  return () => query.removeEventListener?.("change", changed);
};
const narrowNow = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(NARROW_QUERY).matches;
const wideOnServer = () => false;

/** Writes a counter's text in place, keeping React's own text node. */
function setText(el: HTMLElement | null, text: string) {
  if (!el) return;
  const node = el.firstChild;
  if (node && node.nodeType === 3) {
    if (node.nodeValue !== text) node.nodeValue = text;
  } else el.textContent = text;
}

export function SimGrid({
  designs,
  options = [],
  simulate,
  duration = 8,
  labels: labelsProp,
  formatTime = formatSeconds,
  number,
  eyebrow,
  title,
  headingLevel = 3,
  caption,
  alt,
  theme,
  uiStyle,
  static: still = false,
  className,
  id,
}: SimGridProps) {
  if (!designs.length) throw new Error("SimGrid: give at least one design.");
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const reduced = usePrefersReducedMotion() || still;
  const uid = useId().replace(/:/g, "");
  const rootId = id ?? `uipack-sim-${uid}`;

  const [design, setDesign] = useState(designs[0].id);
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(options.map((o) => [o.id, Boolean(o.checked)])),
  );
  const shownDesign = designs.some((d) => d.id === design) ? design : designs[0].id;
  const optionKey = options.map((o) => `${o.id}=${checked[o.id] ? 1 : 0}`).join("&");
  const run = useMemo(
    () => prepareRun(simulate({ design: shownDesign, options: { ...checked } })),
    // `checked` is read through optionKey, which names exactly the options it holds.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionKey stands in for checked
    [simulate, shownDesign, optionKey],
  );
  // One speed for every design: the first design with its starting options plays in `duration`.
  const firstDesign = designs[0].id;
  const startKey = options.map((o) => `${o.id}=${o.checked ? 1 : 0}`).join("&");
  const baseFinish = useMemo(
    () =>
      prepareRun(simulate({ design: firstDesign, options: Object.fromEntries(options.map((o) => [o.id, Boolean(o.checked)])) }))
        .finish,
    // The first design's id and the starting options are what it reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startKey stands in for options
    [simulate, firstDesign, startKey],
  );
  const speed = baseFinish > 0 ? baseFinish / Math.max(0.1, duration) : 1;

  // Open canvas: the figure in a zoomable dialog (not on a quiet uipack/web page), as Figure does.
  const expandable = useContext(FigureChromeContext) === "full";
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const opener = useRef<HTMLButtonElement>(null);

  // The wide grid by default (and on the server), the narrow one below the frame's 720px breakpoint;
  // the canvas always draws it wide. The drawing's layout width (unaffected by a host's scaling
  // transform) caps the columns, so a cell never shrinks under a 6px pitch: the grid grows taller.
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const narrow = useSyncExternalStore(subscribeNarrow, narrowNow, wideOnServer) && !expanded;
  const [fitWidth, setFitWidth] = useState(Infinity);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || expanded || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry?.contentRect.width ?? 0;
      if (w > 0) setFitWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded]);
  const columns = gridColumns(run.count, narrow, expanded ? Infinity : fitWidth);
  const marks = useMemo(() => cellMarks(run.count, columns), [run.count, columns]);

  // Playback. While it plays, `t` lives in a ref the loop advances, with no React render per frame.
  // At rest React holds the time it stopped at: "end" for a finished run (so another design's run
  // shows finished too), or a simulated time, kept when the design changes so the reader compares
  // designs at the same moment. A layout effect syncs the ref and repaints after every render.
  const [rest, setRest] = useState<number | "end">("end");
  const [playingState, setPlaying] = useState(false);
  const playing = playingState && !reduced;
  const [status, setStatus] = useState("");
  const [hover, setHover] = useState<SimState | null>(null);
  const tRef = useRef(run.finish);
  const armed = useRef(false);
  const visible = useRef(false);
  // `last` is the previous frame's timestamp, -1 before the first.
  const loop = useRef({ frame: 0, last: -1, started: -1, done: -1 });
  const paths = useRef<Record<SimState, SVGPathElement | null>>({ waiting: null, running: null, done: null });
  const timeEl = useRef<HTMLElement>(null);
  const meanEl = useRef<HTMLElement>(null);
  const doneEl = useRef<HTMLElement>(null);
  const latest = useLatest({ run, marks, formatTime, speed, playing, reduced, labels });

  const shown = reduced || rest === "end" ? run.finish : Math.min(rest, run.finish);
  const snap = simAt(run, shown);
  const drawn = useMemo(() => statePaths(run, marks, shown), [run, marks, shown]);
  const meanText = (s: { mean: number | null }) => (s.mean == null ? "–" : formatTime(s.mean));

  /** Paints the grid and the counters at the loop's t. Rewrites the paths only when a count moved. */
  const paint = (force: boolean) => {
    const { run, marks, formatTime } = latest.current;
    const t = tRef.current;
    const s = simAt(run, t);
    const l = loop.current;
    if (force || s.started !== l.started || s.done !== l.done) {
      l.started = s.started;
      l.done = s.done;
      const d = statePaths(run, marks, t);
      for (const state of SIM_STATES) paths.current[state]?.setAttribute("d", d[state]);
    }
    setText(timeEl.current, formatTime(t));
    setText(meanEl.current, s.mean == null ? "–" : formatTime(s.mean));
    setText(doneEl.current, formatCount(s.done));
  };
  const paintRef = useLatest(paint);

  const summary = (run: PreparedRun, t: number) => {
    const s = simAt(run, t);
    const mean = s.mean == null ? "" : `, ${latest.current.labels.mean.toLowerCase()} ${latest.current.formatTime(s.mean)}`;
    return `${formatCount(s.done)} of ${formatCount(run.count)} ${latest.current.labels.count.toLowerCase()} at ${latest.current.formatTime(t)}${mean}.`;
  };

  const stop = () => {
    cancelAnimationFrame(loop.current.frame);
    loop.current.frame = 0;
    loop.current.last = -1;
  };
  const stopRef = useLatest(stop);

  /** Starts the frame loop if it should run: playing, on screen, motion allowed. */
  const start = () => {
    const l = loop.current;
    if (l.frame || !visible.current || !latest.current.playing || latest.current.reduced) return;
    l.last = -1;
    const tick = (now: number) => {
      const { run, speed } = latest.current;
      const dt = l.last >= 0 ? Math.min((now - l.last) / 1000, MAX_STEP) : 0;
      l.last = now;
      tRef.current = Math.min(run.finish, tRef.current + dt * speed);
      paintRef.current(false);
      if (tRef.current >= run.finish) {
        l.frame = 0;
        l.last = -1;
        setPlaying(false);
        setRest("end");
        setStatus(`Finished. ${summary(run, run.finish)}`);
        return;
      }
      l.frame = requestAnimationFrame(tick);
    };
    l.frame = requestAnimationFrame(tick);
  };
  const startRef = useLatest(start);

  // After every render the DOM shows the right t, whatever React last wrote: at rest React's, while
  // playing the loop's (clamped to a new run's end).
  useIsoLayoutEffect(() => {
    tRef.current = playing ? Math.min(tRef.current, run.finish) : shown;
    paintRef.current(true);
  });

  // Run while playing, on screen and allowed to move; stop otherwise (reduced motion holds the end).
  useEffect(() => {
    if (playing) startRef.current();
    else stopRef.current();
  }, [playing, startRef, stopRef]);

  // Rewind once just before it is seen, then play while a quarter of it is on screen; off screen it
  // pauses and picks up where it was when it comes back.
  useEffect(() => {
    const el = rootRef.current;
    const grid = canvasRef.current;
    if (!el || !grid || reduced) return;
    const arm = () => {
      if (armed.current) return;
      armed.current = true;
      tRef.current = 0;
      setRest(0);
      setPlaying(true);
    };
    if (typeof IntersectionObserver === "undefined") {
      visible.current = true;
      arm();
      return;
    }
    const near = new IntersectionObserver(([entry]) => entry?.isIntersecting && arm(), { rootMargin: "0px 0px 25% 0px" });
    const view = new IntersectionObserver(
      ([entry]) => {
        visible.current = Boolean(entry && entry.isIntersecting && entry.intersectionRatio >= 0.25);
        if (visible.current) startRef.current();
        else stopRef.current();
      },
      { threshold: [0, 0.25] },
    );
    near.observe(el);
    // The grid itself, not the frame: on a phone the header alone can fill a quarter of the screen.
    view.observe(grid);
    const l = loop.current;
    return () => {
      near.disconnect();
      view.disconnect();
      cancelAnimationFrame(l.frame);
      l.frame = 0;
    };
    // Opening or closing the canvas moves the figure into or out of the dialog: observe the new nodes.
  }, [reduced, expanded, startRef, stopRef]);

  useFigureEntrance(canvasRef, reduced || expanded);

  const play = () => {
    armed.current = true;
    if (playing) {
      stop();
      setPlaying(false);
      setRest(tRef.current);
      setStatus(`Paused. ${summary(run, tRef.current)}`);
      return;
    }
    if (tRef.current >= run.finish) tRef.current = 0;
    setRest(tRef.current);
    setStatus("Playing.");
    setPlaying(true);
  };
  const reset = () => {
    armed.current = true;
    stop();
    setPlaying(false);
    tRef.current = 0;
    setRest(0);
    setStatus(`Reset. ${summary(run, 0)}`);
  };
  const choose = (next: { design?: string; option?: [string, boolean] }) => {
    armed.current = true;
    if (next.design) setDesign(next.design);
    if (next.option) {
      const [key, value] = next.option;
      setChecked((c) => ({ ...c, [key]: value }));
    }
  };
  // Announce the run a choice brings in, once it is drawn.
  const announced = useRef(run);
  useEffect(() => {
    if (announced.current === run) return;
    announced.current = run;
    const label = designs.find((d) => d.id === shownDesign)?.label ?? shownDesign;
    setStatus(`${label}. ${summary(run, tRef.current)}`);
    // summary reads the latest labels and format through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- announce on a new run only
  }, [run]);

  const motion = !reduced;
  const finishedText = formatTime(run.finish);
  // Reserve each counter's widest text, so nothing shifts while the numbers change.
  // Each value lays its widest text (the finished run's) under the live one, invisible, as
  // NumberTicker does: the value starts flush under its label and nothing beside it moves.
  const ghost = (text: string) => (
    <span className="uipack-sim__ghost" aria-hidden="true">
      {text}
    </span>
  );
  const done = snap.done >= run.count && run.count > 0;

  return (
    <CanvasView
      open={expanded}
      onClose={() => {
        setExpanded(false);
        setZoom(1);
      }}
      restoreFocus={() => opener.current?.focus()}
      title={title ?? eyebrow ?? "Simulation canvas"}
      theme={theme}
      uiStyle={uiStyle}
      layout="figure"
      zoom={{ value: zoom, min: 1, max: 3, onChange: setZoom }}
    >
      <figure
        ref={rootRef}
        id={rootId}
        className={["uipack", "uipack-sim", expanded ? "uipack--expanded" : "", className ?? ""].join(" ").trim()}
        // Opened, the canvas content is a flex column: auto centres it.
        style={{ margin: expanded ? "auto 0" : 0 }}
        data-theme={theme}
        data-ui-style={uiStyle}
        data-sim-state={playing ? "playing" : done ? "finished" : shown === 0 ? "idle" : "paused"}
        aria-labelledby={title ? `${rootId}-title` : undefined}
        aria-label={title ? undefined : alt}
      >
        <div className="uipack__head">
          {number || eyebrow ? (
            <p className="uipack__eyebrow">
              {number}
              {number && eyebrow ? " · " : ""}
              {eyebrow}
            </p>
          ) : null}
          {title ? createElement(`h${headingLevel}`, { className: "uipack__title", id: `${rootId}-title` }, title) : null}
          {caption ? <p className="uipack__caption">{caption}</p> : null}
          <div className="uipack-sim__bar">
            {designs.length > 1 ? (
              <fieldset className="uipack-sim__designs">
                <legend className="uipack-sim__group">{labels.designs}</legend>
                <div className="uipack-sim__segments">
                  {designs.map((d) => (
                    <label key={d.id} className="uipack-sim__segment">
                      <input
                        type="radio"
                        name={`${rootId}-design`}
                        value={d.id}
                        checked={shownDesign === d.id}
                        onChange={() => choose({ design: d.id })}
                      />
                      <span>{d.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            {options.length ? (
              <fieldset className="uipack-sim__options">
                <legend className="uipack__sr">Options</legend>
                {options.map((o) => (
                  <label key={o.id} className="uipack-sim__option">
                    <input
                      type="checkbox"
                      checked={Boolean(checked[o.id])}
                      onChange={(e) => choose({ option: [o.id, e.currentTarget.checked] })}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </fieldset>
            ) : null}
            {motion || (expandable && !expanded) ? (
              <div className="uipack-sim__actions">
                {motion ? (
                  <>
                    <button type="button" className="uipack__ctl" onClick={play}>
                      {playing ? <PauseGlyph /> : <PlayGlyph />} {playing ? "Pause" : "Play"}
                    </button>
                    <button type="button" className="uipack__ctl" onClick={reset}>
                      <ReplayGlyph /> Reset
                    </button>
                  </>
                ) : null}
                {expandable && !expanded ? (
                  <button
                    type="button"
                    className="uipack__ctl"
                    ref={opener}
                    onClick={() => {
                      armed.current = true;
                      setExpanded(true);
                    }}
                  >
                    Open canvas
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
          <ul className="uipack__legend uipack-sim__legend" aria-label="Legend">
            {SIM_STATES.map((state) => (
              <li
                key={state}
                data-sim={state}
                data-state={hover ? (hover === state ? "hit" : "dim") : undefined}
                onPointerEnter={(e) => isPointer(e) && setHover(state)}
                onPointerLeave={(e) => isPointer(e) && setHover(null)}
              >
                <svg viewBox="0 0 12 12" aria-hidden="true">
                  <path d={glyphs[state]} />
                </svg>
                <span>{labels[state]}</span>
              </li>
            ))}
          </ul>
        </div>
        <dl className="uipack-sim__readout">
          <div>
            <dt>{labels.time}</dt>
            <dd>
              {ghost(finishedText)}
              <span className="uipack-sim__live">
                <span ref={timeEl} className="uipack-sim__value">
                  {formatTime(shown)}
                </span>
              </span>
            </dd>
          </div>
          <div>
            <dt>{labels.mean}</dt>
            <dd>
              {ghost(formatTime(run.longest))}
              <span className="uipack-sim__live">
                <span ref={meanEl} className="uipack-sim__value">
                  {meanText(snap)}
                </span>
              </span>
            </dd>
          </div>
          <div>
            <dt>{labels.count}</dt>
            <dd>
              {ghost(`${formatCount(run.count)} / ${formatCount(run.count)}`)}
              <span className="uipack-sim__live">
                <span ref={doneEl} className="uipack-sim__value">
                  {formatCount(snap.done)}
                </span>
                <span className="uipack-sim__total"> / {formatCount(run.count)}</span>
              </span>
            </dd>
          </div>
        </dl>
        <p className="uipack__sr" role="status">
          {status}
        </p>
        <div ref={canvasRef} className="uipack__canvas uipack__canvas--plain uipack-sim__canvas">
          <svg
            viewBox={gridViewBox(run.count, columns)}
            role="img"
            aria-label={alt}
            data-columns={columns}
            // Opened, the drawing is never narrower than 800px, so cells stay large on a phone; pan to see the rest.
            style={expanded ? { width: `max(${zoom * 100}%, ${800 * zoom}px)` } : undefined}
          >
            {SIM_STATES.map((state) => (
              <path
                key={state}
                ref={(el) => {
                  paths.current[state] = el;
                }}
                className="uipack-sim__cells"
                data-sim={state}
                data-state={hover ? (hover === state ? "hit" : "dim") : undefined}
                d={drawn[state]}
              />
            ))}
          </svg>
        </div>
      </figure>
    </CanvasView>
  );
}
