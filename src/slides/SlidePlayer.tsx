import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { usePrefersReducedMotion } from "../context";
import { clampStop, resolveNodePose, validateSlideStory } from "./model";
import type { SceneRuntime } from "./renderer";
import type { SlideStop, SlideStory, SlideTheme } from "./types";

export interface SlideSceneProps {
  story: SlideStory;
  stopId?: string;
  theme?: SlideTheme;
  /** auto respects the OS preference; none also disables packet motion. */
  motion?: "auto" | "none";
  paused?: boolean;
  /** diagram is also useful for server-rendered or printable views. */
  renderMode?: "auto" | "diagram";
  className?: string;
  onSettled?: (stopId: string) => void;
}
function Diagram({ story, stop }: { story: SlideStory; stop: SlideStop }) {
  const visible = story.nodes.filter(
    (n) => n.kind !== "boundary" && resolveNodePose(n, stop).opacity > 0.25,
  );
  return (
    <div className="uipack-slide-diagram" data-testid="slide-diagram">
      <p className="uipack-slide-diagram__heading">Diagram view</p>
      <div className="uipack-slide-diagram__nodes">
        {visible.map((n) => (
          <div key={n.id} data-tone={n.tone}>
            <strong>{n.label}</strong>
            <span>{n.detail}</span>
          </div>
        ))}
      </div>
      <ul aria-label="Highlighted connections">
        {story.connections
          .filter((c) => stop.activeConnections?.includes(c.id))
          .map((c) => (
            <li key={c.id}>
              {story.nodes.find((n) => n.id === c.from)?.label}{" "}
              <span aria-label="to">→</span>{" "}
              {story.nodes.find((n) => n.id === c.to)?.label}
            </li>
          ))}
      </ul>
    </div>
  );
}
function SceneViewport({
  story,
  stopId,
  theme = "dark",
  motion = "auto",
  paused = false,
  renderMode = "auto",
  className = "",
  onSettled,
}: SlideSceneProps) {
  const host = useRef<HTMLDivElement>(null),
    labels = useRef<HTMLDivElement>(null),
    runtime = useRef<SceneRuntime>();
  const prefersReduced = usePrefersReducedMotion();
  const reduced = motion === "none" || prefersReduced;
  const stop = story.stops.find((s) => s.id === stopId) ?? story.stops[0];
  const latest = useRef({ stop, reduced, paused, onSettled });
  latest.current = { stop, reduced, paused, onSettled };
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">(
    "loading",
  );
  const [failed, setFailed] = useState(false);
  const [settled, setSettled] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (renderMode === "diagram" || failed) {
      setStatus("fallback");
      setTransitioning(false);
      setSettled(latest.current.stop.id);
      return;
    }
    setStatus("loading");
    void import("./renderer")
      .then(({ createSlideScene }) => {
        if (cancelled || !host.current || !labels.current) return;
        try {
          runtime.current = createSlideScene(
            host.current,
            labels.current,
            story,
            latest.current.stop,
            theme,
            latest.current.reduced,
            () => setFailed(true),
            (id) => {
              if (!cancelled) {
                setSettled(id);
                setTransitioning(false);
                latest.current.onSettled?.(id);
              }
            },
          );
          runtime.current.setPaused(latest.current.paused);
          setStatus("ready");
        } catch {
          if (!cancelled) setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      runtime.current?.dispose();
      runtime.current = undefined;
    };
  }, [story, theme, renderMode, failed]);
  useEffect(() => {
    if (renderMode === "diagram" || failed) {
      setSettled(stop.id);
      setTransitioning(false);
      onSettled?.(stop.id);
      return;
    }
    if (runtime.current) {
      setTransitioning(!reduced);
      runtime.current.goTo(stop, reduced);
    }
  }, [stop, renderMode, failed]); // Preference updates are applied without restarting the current stop.
  useEffect(() => {
    runtime.current?.setReducedMotion(reduced);
  }, [reduced]);
  useEffect(() => {
    runtime.current?.setPaused(paused);
  }, [paused]);
  return (
    <div
      className={`uipack-slide-scene ${className}`}
      data-theme={theme}
      data-renderer={status}
      data-stop={stop.id}
      data-settled-stop={settled}
      data-transitioning={transitioning}
      data-motion={reduced ? "reduced" : "full"}
      aria-label={`${story.title}: ${stop.title}`}
    >
      <div
        className="uipack-slide-scene__webgl"
        ref={host}
        aria-hidden="true"
      />
      <div ref={labels} className="uipack-slide-labels" aria-hidden="true">
        {story.nodes.map((n) => (
          <div
            key={n.id}
            data-node={n.id}
            data-tone={n.tone}
            className="uipack-slide-label"
            style={{ visibility: "hidden" }}
          >
            <strong>{n.label}</strong>
            <span>{n.detail}</span>
          </div>
        ))}
      </div>
      {status !== "ready" && <Diagram story={story} stop={stop} />}
      {status === "ready" && (
        <span className="uipack-slide-scene__badge">
          Live 3D <span aria-hidden="true">·</span>{" "}
          {reduced ? "Reduced motion" : "Authored camera"}
        </span>
      )}
      <div className="uipack-slide-sr">
        {story.nodes
          .filter(
            (n) =>
              n.kind !== "boundary" && resolveNodePose(n, stop).opacity > 0.25,
          )
          .map((n) => (
            <p key={n.id}>
              {n.label}: {n.detail}
            </p>
          ))}
      </div>
    </div>
  );
}
/** A persistent 3D scene controlled by a named presentation stop. */
export function SlideScene(props: SlideSceneProps) {
  const errors = validateSlideStory(props.story);
  if (errors.length)
    return (
      <div role="alert" className="uipack-slide-error">
        Invalid slide story: {errors.join(" ")}
      </div>
    );
  return <SceneViewport key={props.story.id} {...props} />;
}
export interface SlidePlayerProps extends SlideSceneProps {
  defaultStopId?: string;
  onStopChange?: (stopId: string) => void;
  /** A footer slot for deck-specific attribution. */
  footer?: ReactNode;
  style?: CSSProperties;
}
function Player({
  story,
  stopId,
  defaultStopId,
  onStopChange,
  theme = "dark",
  motion = "auto",
  paused: externalPaused,
  renderMode,
  footer,
  className = "",
  style,
  onSettled,
}: SlidePlayerProps) {
  const initial = Math.max(
    0,
    story.stops.findIndex((s) => s.id === defaultStopId),
  );
  const [internal, setInternal] = useState(initial),
    [paused, setPaused] = useState(false),
    [present, setPresent] = useState(false),
    [diagram, setDiagram] = useState(false);
  const reduced = usePrefersReducedMotion() || motion === "none";
  const root = useRef<HTMLElement>(null);
  const titleId = useId();
  const index =
    stopId === undefined
      ? clampStop(internal, story.stops.length)
      : Math.max(
          0,
          story.stops.findIndex((s) => s.id === stopId),
        );
  const stop = story.stops[index];
  const navigate = (value: number) => {
    const next = clampStop(value, story.stops.length);
    if (stopId === undefined) setInternal(next);
    if (next !== index) onStopChange?.(story.stops[next].id);
  };
  function keyboard(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (
      target.matches("input, textarea, select") ||
      target.isContentEditable ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const to =
      event.key === "ArrowRight" || event.key === "PageDown"
        ? index + 1
        : event.key === "ArrowLeft" || event.key === "PageUp"
          ? index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? story.stops.length - 1
              : undefined;
    if (to !== undefined) {
      event.preventDefault();
      navigate(to);
    }
    if (event.key === "Escape") setPresent(false);
  }
  useEffect(() => {
    if (!present) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [present]);
  return (
    <section
      ref={root}
      tabIndex={0}
      onKeyDown={keyboard}
      aria-label={`${story.title} presentation`}
      className={`uipack-slide-player ${present ? "uipack-slide-player--present" : ""} ${className}`}
      style={style}
      data-theme={theme}
      data-story={story.id}
      data-stop={stop.id}
    >
      <div className="uipack-slide-player__top">
        <span>{story.title}</span>
        <div>
          <button
            type="button"
            onClick={() => setDiagram((v) => !v)}
            aria-pressed={diagram}
          >
            {diagram ? "3D view" : "Diagram view"}
          </button>
          <button
            type="button"
            disabled={reduced || externalPaused !== undefined}
            onClick={() => setPaused((v) => !v)}
            aria-pressed={paused}
          >
            {paused ? "Resume flow" : "Pause flow"}
          </button>
          <button
            type="button"
            onClick={() => setPresent((v) => !v)}
            aria-pressed={present}
          >
            {present ? "Exit presentation" : "Present"}
          </button>
        </div>
      </div>
      <div className="uipack-slide-player__body">
        <header
          className="uipack-slide-player__copy"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="uipack-slide-player__count">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(story.stops.length).padStart(2, "0")}
          </span>
          <h2 id={titleId}>{stop.title}</h2>
          <p>{stop.caption}</p>
          <div className="uipack-slide-legend" aria-label="Flow colors">
            <span data-tone="request">Request</span>
            <span data-tone="response">Response</span>
            <span data-tone="change">Change</span>
          </div>
        </header>
        <SceneViewport
          story={story}
          stopId={stop.id}
          theme={theme}
          motion={motion}
          paused={externalPaused ?? paused}
          renderMode={diagram ? "diagram" : renderMode}
          onSettled={onSettled}
        />
      </div>
      <nav
        className="uipack-slide-player__navigation"
        aria-label="Presentation stops"
      >
        <button
          type="button"
          aria-label="Previous stop"
          disabled={index === 0}
          onClick={() => navigate(index - 1)}
        >
          ← Previous
        </button>
        <div className="uipack-slide-player__stops">
          {story.stops.map((s, i) => (
            <button
              type="button"
              key={s.id}
              aria-label={`Go to ${s.title}`}
              aria-current={index === i ? "step" : undefined}
              title={s.title}
              onClick={() => navigate(i)}
            >
              {String(i + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Next stop"
          disabled={index === story.stops.length - 1}
          onClick={() => navigate(index + 1)}
        >
          Next →
        </button>
      </nav>
      <footer className="uipack-slide-player__footer">
        <span>{footer ?? "UIPACK / Spatial stories"}</span>
        <span>
          ← → to navigate <span aria-hidden="true">·</span>{" "}
          {reduced ? "Reduced motion" : "Click any stop to jump"}
        </span>
      </footer>
      {stop.notes && (
        <details className="uipack-slide-player__notes">
          <summary>Presenter notes</summary>
          <p>{stop.notes}</p>
        </details>
      )}
    </section>
  );
}
/** Slide chrome, keyboard navigation, progressive fallback, and a persistent scene. */
export function SlidePlayer(props: SlidePlayerProps) {
  const errors = validateSlideStory(props.story);
  if (errors.length)
    return (
      <div role="alert" className="uipack-slide-error">
        Invalid slide story: {errors.join(" ")}
      </div>
    );
  return <Player key={props.story.id} {...props} />;
}
