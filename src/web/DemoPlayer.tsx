import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useLatest, usePrefersReducedMotion } from "../env";
import { DEFAULT_TIMING, demoCycle, demoEnd, demoFrame, stepStart, toAction, type DemoStep, type DemoTiming } from "./timeline";

export interface DemoPlayerProps {
  /** The scripted sequence. Content is yours; timing and playback belong to the player. */
  steps: DemoStep[];
  /** Accessible name for the demo region. */
  label: string;
  /** Shown in the window chrome, e.g. "app.example.com/inbox". */
  address?: string;
  /** Metric shown in the result pane before any step changes it (e.g. 40). */
  initialMetric?: number;
  /** Words after the metric, e.g. "in your inbox". */
  metricLabel?: string;
  /** Placeholder for the composer before anything is typed. */
  placeholder?: string;
  /**
   * "agent" (the default when any step has a `prompt`): a composer types the prompt and the log ticks
   * off this step's actions. "steps" (the default otherwise): no composer and no chat; the steps
   * themselves are the checklist on a narrow start column and the result pane is wide, for a
   * product whose output is the point (a rota, a table, a report) shown through each step's `screen`.
   * Either mode rests on its finished result until it plays.
   */
  mode?: "agent" | "steps";
  /**
   * Steps mode only: how the step list is drawn. "compact" (default): one row of numbered step
   * labels over the result, which doubles as the step tabs (also under reduced motion), so the product's
   * output takes the window's full width; below 720px the row moves under the result. "side": the
   * full checklist (titles and action details) in a narrow start column. "none": no visible list
   * (the steps stay in the DOM as text). The page's "How it works" usually lists the same steps,
   * so keep the rail compact or off there.
   */
  rail?: "compact" | "side" | "none";
  /**
   * Play from the start once at least a quarter is on screen. Default true. Until then, and
   * without it until Play, the player rests on its finished result.
   */
  autoplay?: boolean;
  /**
   * Hold the finished result with no controls (reduced motion keeps the step tabs): for
   * thumbnails, print or a capture. The default already rests on the result until the demo plays.
   */
  static?: boolean;
  /** Restart after the last step's hold. Default false: the result stays. */
  loop?: boolean;
  timing?: Partial<DemoTiming>;
  /** Optional call to action beside the controls, e.g. a "Try it yourself" CtaButton. */
  cta?: ReactNode;
  className?: string;
  onStepChange?: (index: number) => void;
}

const TICK_MS = 40;
const DEV = typeof process !== "undefined" && process.env.NODE_ENV !== "production";

function lastWith<T>(steps: DemoStep[], upTo: number, pick: (s: DemoStep) => T | undefined): T | undefined {
  for (let k = upTo; k >= 0; k--) {
    const v = pick(steps[k]);
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

/**
 * A baked-in product demo: a window frame that types a prompt, ticks through the
 * agent's actions and settles on the result. Its resting state is the result: that is what the
 * server renders and what paints first, so a capture, a reader who jumps past it or one who never
 * scrolls to it sees the outcome, not an empty composer. As it nears the viewport it rewinds to
 * the first frame and plays while a quarter of it is on screen; scrolled fully away mid-play, it
 * settles back on the result. Reduced motion holds the result with no Play, Pause or Replay; its
 * step tabs (the compact rail, or the classic tabs) stay and show each step's finished frame, with
 * nothing moving. `static` holds the result with no controls at all (the steps stay in the DOM as
 * text, so the window and a second, visible list never repeat the same actions).
 */
export function DemoPlayer({
  steps,
  label,
  address,
  initialMetric,
  metricLabel,
  placeholder = "Ask for something…",
  mode: modeProp,
  rail: railProp = "compact",
  autoplay = true,
  static: still = false,
  loop = false,
  timing: timingProp,
  cta,
  className = "",
  onStepChange,
}: DemoPlayerProps) {
  const timing = useMemo(() => ({ ...DEFAULT_TIMING, ...timingProp }), [timingProp]);
  const mode = modeProp ?? (steps.some((s) => s.prompt) ? "agent" : "steps");
  const rail = mode === "steps" ? railProp : undefined;
  const reduced = usePrefersReducedMotion() || still;
  // Under reduced motion (not `static`) the step tabs stay: each shows its step's finished frame,
  // with nothing moving, so a reader can still walk through the demo.
  const stepper = reduced && !still;
  const [held, setHeld] = useState<number | null>(null);
  // The classic tab row (with Play, Pause and Replay) shows unless the compact rail is the tabs.
  const classicTabs = rail !== "compact";
  const controls = !reduced || (stepper && classicTabs);
  const rootRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLOListElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  // The window keeps the tallest height it has shown at this width (the resting result first), so
  // rewinding to a shorter first frame never pulls the sections below it up mid-scroll.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let width = 0;
    let tallest = 0;
    const ro = new ResizeObserver(([entry]) => {
      // min-height applies to the box its box-sizing names, so measure that box.
      const border = getComputedStyle(el).boxSizing === "border-box";
      const box = (border ? entry.borderBoxSize : entry.contentBoxSize)?.[0];
      const w = box ? box.inlineSize : entry.contentRect.width;
      const h = box ? box.blockSize : entry.contentRect.height;
      if (Math.abs(w - width) > 1) {
        // A new width reflows everything: forget the old height and measure again.
        width = w;
        tallest = 0;
        if (el.style.minHeight) {
          el.style.minHeight = "";
          return;
        }
      }
      if (h > tallest + 0.5) {
        tallest = h;
        el.style.minHeight = `${Math.ceil(h)}px`;
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const end = demoEnd(steps, timing);
  const cycle = demoCycle(steps, timing);
  // At rest on the result until it is about to be seen (or Play is pressed).
  const [elapsed, setElapsed] = useState(end);
  const [playing, setPlaying] = useState(autoplay);
  const [inView, setInView] = useState(false);
  const id = useId();
  const armed = useRef(false);
  const playingRef = useLatest(playing);
  const doneRef = useLatest(elapsed >= end);
  // Steps mode exists to show the product's output: with no `screen` on any step its wide result
  // pane is a blank panel, which reads as a placeholder (review 2026-11-05). Say so in development.
  const blank = mode === "steps" && !steps.some((s) => s.screen !== undefined && s.screen !== null);
  useEffect(() => {
    if (DEV && blank)
      console.warn(
        `uipack/web: DemoPlayer "${label}" runs in steps mode with no step \`screen\`, so its result pane is empty. Give the last step the product's real output (a ScheduleGrid, DataTable, FileTable or RecordCard).`,
      );
  }, [blank, label]);

  useEffect(() => {
    const el = rootRef.current;
    if (reduced) return;
    // Rewind to the first frame once, just before it is seen, so it plays from the start.
    const arm = () => {
      if (armed.current || !autoplay) return;
      armed.current = true;
      setElapsed(0);
    };
    if (!el || typeof IntersectionObserver === "undefined") {
      arm();
      setInView(true);
      return;
    }
    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) arm();
      },
      { rootMargin: "0px 0px 25% 0px" },
    );
    const view = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.intersectionRatio >= 0.25);
        // Fully off screen before autoplay reached the end: settle on the result rather than
        // freeze on a half-typed frame, and play from the start again next time it comes near.
        // A reader who paused keeps their place.
        if (!entry.isIntersecting && armed.current && playingRef.current && !loop && !doneRef.current) {
          armed.current = false;
          setElapsed(end);
        }
      },
      { threshold: [0, 0.25] },
    );
    near.observe(el);
    view.observe(el);
    return () => {
      near.disconnect();
      view.disconnect();
    };
  }, [reduced, autoplay, loop, end, playingRef, doneRef]);

  const finalFrame = demoFrame(steps, Infinity, timing, initialMetric);
  const heldFrame =
    held === null || held >= steps.length - 1 ? finalFrame : demoFrame(steps, stepStart(steps, held + 1, timing) - 1, timing, initialMetric);
  const frame = reduced ? heldFrame : demoFrame(steps, elapsed, timing, initialMetric);
  // A play-once demo stops at its last frame: Play then replays it from the start.
  const finished = !loop && frame.done;
  const running = playing && !finished && inView && !reduced;
  useEffect(() => {
    if (!running) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const dt = now - last;
      last = now;
      setElapsed((e) => {
        const next = e + dt;
        if (loop) return next >= cycle ? 0 : next;
        return Math.min(next, end);
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [running, loop, cycle, end]);

  const step = steps[frame.step];
  const stepState = (i: number) =>
    i < frame.step || (i === frame.step && frame.settled) ? "done" : i === frame.step ? "running" : "pending";
  // Only real step changes are reported, so the latest callback is read through a ref.
  const stepChangeRef = useLatest(onStepChange);
  useEffect(() => {
    stepChangeRef.current?.(frame.step);
  }, [frame.step, stepChangeRef]);

  const seek = useCallback(
    (i: number) => {
      if (reduced) return setHeld(i);
      // The reader took over: no later rewind as it comes into view.
      armed.current = true;
      setElapsed(stepStart(steps, i, timing));
      setPlaying(true);
    },
    [steps, timing, reduced],
  );
  const replay = () => seek(0);
  const toggle = () => {
    if (finished) return replay();
    setPlaying((p) => !p);
  };

  const onTabKey = (e: KeyboardEvent<HTMLElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next: number | undefined;
    if (e.key in keys) next = (frame.step + keys[e.key] + steps.length) % steps.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = steps.length - 1;
    if (next === undefined) return;
    e.preventDefault();
    seek(next);
    (railRef.current ?? tabsRef.current)?.querySelectorAll("button")[next]?.focus();
  };

  // The composer shows this step's prompt as it types, or the most recent one in full.
  const promptStep = step?.prompt ? frame.step : lastWith(steps, frame.step, (s) => (s.prompt ? steps.indexOf(s) : undefined));
  const promptText = promptStep === undefined ? "" : steps[promptStep].prompt!;
  const visiblePrompt = promptStep === frame.step ? promptText.slice(0, frame.typed) : promptText;
  const typing = !reduced && promptStep === frame.step && frame.typed < promptText.length;
  // The activity log shows this step's actions, or the most recent step that had any. Before any
  // step has acted, it lists the next step's actions as queued, so the first frame shows the plan
  // rather than an empty pane.
  const pastActionStep = step?.actions?.length
    ? frame.step
    : lastWith(steps, frame.step, (s) => (s.actions?.length ? steps.indexOf(s) : undefined));
  const nextActionStep = steps.findIndex((s, i) => i > frame.step && !!s.actions?.length);
  const queuedOnly = pastActionStep === undefined && nextActionStep >= 0;
  const actionStep = queuedOnly ? nextActionStep : pastActionStep;
  const actions = actionStep === undefined ? [] : (steps[actionStep].actions ?? []).map(toAction);
  const isCurrent = actionStep === frame.step;
  const doneCount = queuedOnly ? 0 : isCurrent ? frame.actionsDone : actions.length;
  const promptDone = !step?.prompt || frame.typed >= (step.prompt?.length ?? 0);
  const runningIdx = isCurrent && promptDone && !frame.settled && frame.actionsDone < actions.length ? frame.actionsDone : -1;
  // The result pane is never empty: before the first step settles it shows the first screen there is.
  const settledScreen = lastWith(steps, frame.settled ? frame.step : frame.step - 1, (s) => s.screen ?? undefined);
  const firstScreen = steps.findIndex((s) => s.screen !== undefined && s.screen !== null);
  const screen = settledScreen ?? (firstScreen >= 0 ? steps[firstScreen].screen : undefined);
  const screenKey = settledScreen !== undefined ? (frame.settled ? frame.step : frame.step - 1) : `first-${firstScreen}`;

  return (
    <section
      ref={rootRef}
      className={`uipack-web-demo ${className}`.trim()}
      aria-label={label}
      data-state={reduced ? "static" : finished ? "finished" : running ? "playing" : "paused"}
      data-step={frame.step}
      data-mode={mode}
      data-rail={rail}
    >
      <div className="uipack-web-demo__window">
        <div className="uipack-web-demo__chrome" aria-hidden="true">
          <span className="uipack-web-demo__dots">
            <i />
            <i />
            <i />
          </span>
          {address && <span className="uipack-web-demo__address">{address}</span>}
        </div>
        <div className="uipack-web-demo__body" ref={bodyRef}>
          {rail === "side" && (
            <div className="uipack-web-demo__work">
              <ol className="uipack-web-demo__log uipack-web-demo__steps" aria-label="Progress">
                {steps.map((s, i) => {
                  const state = stepState(i);
                  const detail = (s.actions ?? []).map(toAction).find((a) => a.detail)?.detail;
                  return (
                    <li key={s.id} data-state={state}>
                      <span className="uipack-web-demo__tick" aria-hidden="true">
                        {state === "done" ? (
                          <svg viewBox="0 0 16 16">
                            <path d="M3.5 8.5l3 3 6-7" />
                          </svg>
                        ) : null}
                      </span>
                      <span>
                        <span className="uipack-web-demo__num">{String(i + 1).padStart(2, "0")}</span> {s.title}
                      </span>
                      {detail && <small>{detail}</small>}
                      {state === "running" && <span className="uipack-web-demo__sr"> (in progress)</span>}
                      {state === "pending" && <span className="uipack-web-demo__sr"> (queued)</span>}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
          {mode === "agent" && (
            <div className="uipack-web-demo__work">
              <>
                <div className="uipack-web-demo__composer" data-typing={typing || undefined}>
                  <span className="uipack-web-demo__sr">{promptText}</span>
                  <span aria-hidden="true" className={visiblePrompt ? "" : "uipack-web-demo__placeholder"}>
                    {visiblePrompt || placeholder}
                  </span>
                  {typing && <span className="uipack-web-demo__caret" aria-hidden="true" />}
                </div>
                <ol className="uipack-web-demo__log" aria-label="Agent actions">
                  {actions.map((a, i) => {
                    const state = i < doneCount ? "done" : i === runningIdx ? "running" : "pending";
                    return (
                      <li key={`${actionStep}-${i}`} data-state={state}>
                        <span className="uipack-web-demo__tick" aria-hidden="true">
                          {state === "done" ? (
                            <svg viewBox="0 0 16 16">
                              <path d="M3.5 8.5l3 3 6-7" />
                            </svg>
                          ) : null}
                        </span>
                        <span>{a.label}</span>
                        {a.detail && <small>{a.detail}</small>}
                        {state === "running" && <span className="uipack-web-demo__sr"> (in progress)</span>}
                        {state === "pending" && <span className="uipack-web-demo__sr"> (queued)</span>}
                      </li>
                    );
                  })}
                </ol>
              </>
            </div>
          )}
          <div className="uipack-web-demo__result">
            {frame.metric !== undefined && (
              <p className="uipack-web-demo__metric">
                <strong data-testid="demo-metric" key={frame.metric}>
                  {frame.metric}
                </strong>
                {metricLabel && <span>{metricLabel}</span>}
              </p>
            )}
            {screen !== undefined && (
              <div className="uipack-web-demo__screen" key={screenKey}>
                {screen}
              </div>
            )}
          </div>
          {rail === "compact" && (
            <ol className="uipack-web-demo__rail" aria-label="Progress" ref={railRef} onKeyDown={onTabKey}>
              {steps.map((s, i) => {
                const state = stepState(i);
                const body = (
                  <>
                    <span className="uipack-web-demo__tick" aria-hidden="true">
                      {state === "done" ? (
                        <svg viewBox="0 0 16 16">
                          <path d="M3.5 8.5l3 3 6-7" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="uipack-web-demo__num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="uipack-web-demo__rail-label">{s.label}</span>
                    {state === "running" && <span className="uipack-web-demo__sr"> (in progress)</span>}
                    {state === "pending" && <span className="uipack-web-demo__sr"> (queued)</span>}
                  </>
                );
                return (
                  <li key={s.id} data-state={state} aria-current={!still && i === frame.step ? "step" : undefined}>
                    {still ? (
                      <span className="uipack-web-demo__rail-item" title={s.title}>
                        {body}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="uipack-web-demo__rail-item"
                        title={s.title}
                        aria-controls={`${id}-caption`}
                        onClick={() => seek(i)}
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      {/* Every step as text, visually hidden: server HTML (what crawlers and answer engines read),
          no-JS readers and screen readers get the whole demo, not just one frame. Under reduced
          motion the window already shows the final state, so a visible list would repeat it. */}
      <div className="uipack-web-demo__sr">
        <ol className="uipack-web-demo__static" aria-label={reduced ? "Demo steps" : "Demo transcript"}>
          {steps.map((s, i) => (
            <li key={s.id}>
              <span className="uipack-web-demo__num">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <strong>
                  {s.label} · {s.title}
                </strong>
                {s.prompt && <p>“{s.prompt}”</p>}
                {!!s.actions?.length && (
                  <ul>
                    {s.actions.map(toAction).map((a) => (
                      <li key={a.label}>
                        {a.label}
                        {a.detail ? ` (${a.detail})` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
        {!reduced && finalFrame.metric !== undefined && (
          <p>{`Result: ${finalFrame.metric}${metricLabel ? ` ${metricLabel}` : ""}.`}</p>
        )}
      </div>
      {controls && (
        <div className="uipack-web-demo__controls">
          {classicTabs && (
            <div className="uipack-web-demo__tabs" role="group" aria-label="Demo steps" ref={tabsRef} onKeyDown={onTabKey}>
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-current={i === frame.step ? "step" : undefined}
                  aria-controls={`${id}-caption`}
                  onClick={() => seek(i)}
                >
                  <span className="uipack-web-demo__num">{String(i + 1).padStart(2, "0")}</span> {s.label}
                </button>
              ))}
            </div>
          )}
          <div className="uipack-web-demo__buttons">
            {!reduced && (
              <>
                <button type="button" onClick={toggle}>
                  {playing && !finished ? "Pause" : "Play"}
                </button>
                <button type="button" onClick={replay}>
                  Replay
                </button>
              </>
            )}
            {cta}
          </div>
        </div>
      )}
      {!controls && cta && <div className="uipack-web-demo__buttons">{cta}</div>}
      {/* The step caption narrates a run. At rest on the result (before it plays, after it ends,
          static or reduced motion) it would read as a frozen carousel and repeat the last step's
          title, so it is visually hidden then (still announced, still the tabs' target). */}
      <p
        className={`uipack-web-demo__caption${reduced || finished ? " uipack-web-demo__sr" : ""}`}
        id={`${id}-caption`}
        aria-live="polite"
      >
        <span className="uipack-web-demo__num">
          {String(frame.step + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </span>{" "}
        {step?.title}
      </p>
    </section>
  );
}
