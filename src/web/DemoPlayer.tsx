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
   * Play from the start once at least a quarter is on screen. Default true. Until then, and
   * without it until Play, the player rests on its finished result.
   */
  autoplay?: boolean;
  /**
   * Hold the finished result with no controls, as under reduced motion: for thumbnails, print or
   * a capture. The default already rests on the result until the demo plays.
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
 * settles back on the result. Reduced motion and `static` hold the result with no controls (the
 * steps stay in the DOM as text, so the window and a second, visible list never repeat the same
 * actions).
 */
export function DemoPlayer({
  steps,
  label,
  address,
  initialMetric,
  metricLabel,
  placeholder = "Ask for something…",
  mode: modeProp,
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
  const reduced = usePrefersReducedMotion() || still;
  const rootRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
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
  const frame = reduced ? finalFrame : demoFrame(steps, elapsed, timing, initialMetric);
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
  // Only real step changes are reported, so the latest callback is read through a ref.
  const stepChangeRef = useLatest(onStepChange);
  useEffect(() => {
    stepChangeRef.current?.(frame.step);
  }, [frame.step, stepChangeRef]);

  const seek = useCallback(
    (i: number) => {
      // The reader took over: no later rewind as it comes into view.
      armed.current = true;
      setElapsed(stepStart(steps, i, timing));
      setPlaying(true);
    },
    [steps, timing],
  );
  const replay = () => seek(0);
  const toggle = () => {
    if (finished) return replay();
    setPlaying((p) => !p);
  };

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next: number | undefined;
    if (e.key in keys) next = (frame.step + keys[e.key] + steps.length) % steps.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = steps.length - 1;
    if (next === undefined) return;
    e.preventDefault();
    seek(next);
    tabsRef.current?.querySelectorAll("button")[next]?.focus();
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
        <div className="uipack-web-demo__body">
          <div className="uipack-web-demo__work">
            {mode === "steps" ? (
              <ol className="uipack-web-demo__log uipack-web-demo__steps" aria-label="Progress">
                {steps.map((s, i) => {
                  const state =
                    i < frame.step || (i === frame.step && frame.settled) ? "done" : i === frame.step ? "running" : "pending";
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
            ) : (
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
            )}
          </div>
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
      {!reduced && (
        <div className="uipack-web-demo__controls">
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
          <div className="uipack-web-demo__buttons">
            <button type="button" onClick={toggle}>
              {playing && !finished ? "Pause" : "Play"}
            </button>
            <button type="button" onClick={replay}>
              Replay
            </button>
            {cta}
          </div>
        </div>
      )}
      {reduced && cta && <div className="uipack-web-demo__buttons">{cta}</div>}
      <p className="uipack-web-demo__caption" id={`${id}-caption`} aria-live="polite">
        <span className="uipack-web-demo__num">
          {String(frame.step + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </span>{" "}
        {step?.title}
      </p>
    </section>
  );
}
