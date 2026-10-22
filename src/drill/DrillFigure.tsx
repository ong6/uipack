import {
  createElement,
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { CanvasView } from "../CanvasView";
import { useIsoLayoutEffect, usePrefersReducedMotion } from "../env";
import { useLayerFlight } from "../flight";
import { PauseGlyph, PlayGlyph, ReplayGlyph, placeNote } from "../Figure";
import { Legend } from "../Legend";
import { FigureMotionContext, type FigureMotion } from "../context";
import { FigureHoverContext, type FigureHover } from "../hover";
import { FigureScaleContext } from "../scale";
import { useRovingFocus } from "../roving";
import { SelectionContext, type SelectedItem } from "../selection";
import { clearLayer, findDrillNode, runDrill } from "./animate";
import { drillStatic } from "./static";
import { DrillContext, type DrillContextValue } from "./context";
import {
  cleanId,
  drillAnnouncement,
  drillFocusTarget,
  drillMove,
  drillReducer,
  levelFloor,
  normalizePath,
  samePath,
  vbSize,
  type DrillLevel,
  type DrillPath,
} from "./model";

export interface DrillFigureProps {
  /** Every level, flat. The first is the root unless `root` says otherwise. */
  levels: DrillLevel[];
  root?: string;
  /** The stage frame every level is drawn into (and the default level viewBox). */
  viewBox: string;
  /** Stage frame below 720px, when levels have narrow drawings. */
  narrowViewBox?: string;
  /** Controlled path of level ids from the root, e.g. ["harness", "checks"]. */
  path?: DrillPath;
  /** Starting path when uncontrolled. */
  defaultPath?: DrillPath;
  /** Called with the next path on every drill, back or breadcrumb jump. */
  onPathChange?: (path: string[]) => void;
  number?: string;
  /** Short mono topic after the number. */
  eyebrow?: string;
  headingLevel?: 2 | 3 | 4 | 5;
  /** Allow opening a zoomable canvas of the current level. */
  expandable?: boolean;
  /** Show Pause and Replay. Hidden automatically under reduced motion. */
  controls?: boolean;
  theme?: "light" | "dark";
  background?: "dots" | "plain" | "ruled";
  /** Smallest rendered text size in CSS px, as on Figure. Default 11. */
  minFont?: number;
  /** Zoom duration in ms. Default 1000. Reduced motion always crossfades in 160ms. */
  duration?: number;
  className?: string;
  id?: string;
}

interface Flight {
  /** Path being left. The destination is the view's path. */
  from: DrillPath;
  kind: "in" | "out" | "fade";
  seq: number;
}

interface View {
  path: DrillPath;
  flight: Flight | null;
}

const last = (p: DrillPath) => p[p.length - 1];

const BackGlyph = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <path d="M7.5 2.5 4 6l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface LayerProps {
  level: DrillLevel;
  figId: string;
  frame: { wide: string; narrow?: string };
  floorWide: number;
  floorNarrow: number;
  levels: ReadonlyMap<string, DrillLevel>;
  open: (from: string, id: string) => void;
  current: boolean;
}

/** One level's drawings. Memoised: a move re-renders the head, not the drawings. */
const DrillLayer = /*#__PURE__*/ memo(function DrillLayer({ level, figId, frame, floorWide, floorNarrow, levels, open, current }: LayerProps) {
  const lid = `${figId}-${cleanId(level.id)}`;
  const ctx = (variant: "wide" | "narrow"): DrillContextValue => ({
    levels,
    frame,
    idPrefix: `${lid}-${variant[0]}`,
    variant,
    interactive: true,
    ghost: false,
    open: (id) => open(level.id, id),
  });
  const draw = (variant: "wide" | "narrow", render: DrillLevel["render"], vb: string, floor: number): ReactNode => (
    <svg
      className={`uipack-drill__${variant}`}
      viewBox={vb}
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label={level.alt}
    >
      <DrillContext.Provider value={ctx(variant)}>
        <FigureScaleContext.Provider value={{ floor }}>
          {render({ id: variant === "wide" ? lid : `${lid}-n`, variant, ghost: false, level })}
        </FigureScaleContext.Provider>
      </DrillContext.Provider>
    </svg>
  );
  return (
    <div className="uipack-drill__layer" data-level={level.id} data-current={current ? "true" : undefined}>
      {draw("wide", level.render, level.viewBox ?? frame.wide, floorWide)}
      {frame.narrow ? draw("narrow", level.narrow ?? level.render, level.narrowViewBox ?? frame.narrow, floorNarrow) : null}
    </div>
  );
});

/**
 * A stack of figures in the Figure style. A `DrillNode` inside a level opens
 * its child level: the parent zooms into the node while the child opens from a
 * clip shaped like the node box, and Back reverses the same path. The header
 * carries a breadcrumb, a Back control, Open canvas and the motion controls.
 */
function DrillFigureRoot({
  levels,
  root,
  viewBox,
  narrowViewBox,
  path,
  defaultPath,
  onPathChange,
  number,
  eyebrow,
  headingLevel = 3,
  expandable = true,
  controls = true,
  theme,
  background = "dots",
  minFont = 11,
  duration,
  className,
  id,
}: DrillFigureProps) {
  const auto = useId();
  const figId = id ?? `uipack-drill-${cleanId(auto)}`;
  const levelMap = useMemo(() => new Map(levels.map((l) => [l.id, l])), [levels]);
  const ids = useMemo(() => new Set(levelMap.keys()), [levelMap]);
  const rootId = root ?? levels[0]?.id ?? "";
  const labelOf = useCallback((lid: string) => levelMap.get(lid)?.label ?? lid, [levelMap]);

  // Requested path: the prop when controlled, else our own.
  const [own, setOwn] = useState<DrillPath>(() => normalizePath(defaultPath, ids, rootId));
  const requestedRaw = normalizePath(path ?? own, ids, rootId);
  const requestedKey = requestedRaw.join("\u0000");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const requested = useMemo(() => requestedRaw, [requestedKey]);
  const requestedRef = useRef(requested);
  requestedRef.current = requested;

  const [view, setView] = useState<View>(() => ({ path: requested, flight: null }));
  const viewRef = useRef(view);
  viewRef.current = view;
  const seq = useRef(0);
  const focusIntent = useRef(false);
  const pendingFocus = useRef<{ from: DrillPath; to: DrillPath } | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const reduced = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selected, select] = useState<SelectedItem | null>(null);
  const [hoverFlow, setHoverFlow] = useState<string | null>(null);
  const [hoverKind, setHoverKind] = useState<string | null>(null);
  const hover = useMemo<FigureHover>(
    () => ({ flow: selected?.flow ?? hoverFlow, kind: hoverKind, setFlow: setHoverFlow, setKind: setHoverKind }),
    [hoverFlow, hoverKind, selected],
  );

  const opener = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const currentCrumbRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const [notePos, setNotePos] = useState<{ left: number; top: number } | null>(null);
  const [stageW, setStageW] = useState(1088);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const read = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setStageW(w);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded]);

  const frame = useMemo(() => ({ wide: viewBox, narrow: narrowViewBox }), [viewBox, narrowViewBox]);

  const controlled = useRef({ path, onPathChange });
  controlled.current = { path, onPathChange };
  const navigate = useCallback((next: DrillPath) => {
    if (samePath(next, requestedRef.current)) return;
    focusIntent.current = true;
    if (controlled.current.path === undefined) setOwn(next);
    controlled.current.onPathChange?.([...next]);
  }, []);
  const up = useCallback(() => navigate(drillReducer(requestedRef.current, { type: "up" }, ids)), [navigate, ids]);
  const openFrom = useCallback(
    (from: string, child: string) => {
      const cur = requestedRef.current;
      const at = cur.indexOf(from);
      if (at < 0) return;
      navigate(drillReducer(cur.slice(0, at + 1), { type: "open", id: child }, ids));
    },
    [navigate, ids],
  );

  const layerEl = (lid: string) =>
    stageRef.current?.querySelector<HTMLElement>(`:scope > [data-level="${typeof CSS !== "undefined" && CSS.escape ? CSS.escape(lid) : lid}"]`) ?? null;

  const { anims, settle, fly } = useLayerFlight(() =>
    stageRef.current?.querySelectorAll<HTMLElement>(":scope > .uipack-drill__layer").forEach(clearLayer),
  );

  const finish = (n: number) => {
    const v = viewRef.current;
    if (!v.flight || v.flight.seq !== n) return;
    const leaving = layerEl(last(v.flight.from));
    // Hidden before the animations let go, so the leaving layer never flashes at rest.
    if (leaving) leaving.style.visibility = "hidden";
    settle();
    setView({ path: v.path, flight: null });
  };

  // A new requested path: start, reverse or redirect a move.
  useIsoLayoutEffect(() => {
    const v = viewRef.current;
    if (samePath(requested, v.path)) return;
    select(null);
    setHoverFlow(null);
    setHoverKind(null);
    setAnnouncement(drillAnnouncement(v.path, requested, labelOf));
    pendingFocus.current = focusIntent.current ? { from: v.path, to: requested } : null;
    focusIntent.current = false;
    if (v.flight && anims.current.length && samePath(requested, v.flight.from)) {
      // Back while flying in (or forward while flying out): play the same path backwards.
      for (const a of anims.current) a.reverse();
      setView({ path: requested, flight: { ...v.flight, from: v.path } });
      return;
    }
    if (v.flight) settle();
    const from = v.path;
    const canAnimate = typeof stageRef.current?.animate === "function" && last(from) !== last(requested);
    if (!canAnimate) {
      setView({ path: requested, flight: null });
      return;
    }
    const move = drillMove(from, requested);
    seq.current += 1;
    setView({ path: requested, flight: { from, kind: move === "in" ? "in" : move === "out" ? "out" : "fade", seq: seq.current } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested]);

  // Both layers are mounted: measure the node and run the move before paint.
  const flightSeq = view.flight?.seq;
  useIsoLayoutEffect(() => {
    const f = viewRef.current.flight;
    const stage = stageRef.current;
    if (!f || !stage) return;
    const fromEl = layerEl(last(f.from));
    const toEl = layerEl(last(viewRef.current.path));
    if (!fromEl || !toEl) {
      finish(f.seq);
      return;
    }
    const target =
      f.kind === "in"
        ? findDrillNode(fromEl, last(viewRef.current.path))
        : f.kind === "out"
          ? findDrillNode(toEl, last(f.from))
          : null;
    const run = runDrill({ kind: f.kind, from: fromEl, to: toEl, target, stage, canvas: canvasRef.current, reduced, duration });
    fly(run, () => finish(f.seq));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightSeq]);

  // Settled: move focus where the person's attention should be.
  useIsoLayoutEffect(() => {
    if (view.flight || !pendingFocus.current) return;
    const { from, to } = pendingFocus.current;
    pendingFocus.current = null;
    const t = drillFocusTarget(from, to);
    if (t.kind === "node") {
      const layer = layerEl(last(to));
      const node = layer && findDrillNode(layer, t.drill);
      if (node) {
        (node as SVGElement).focus({ preventScroll: true });
        return;
      }
    }
    const heading = headingRef.current;
    // The canvas header hides the title; the current breadcrumb stands in.
    if (heading && getComputedStyle(heading).display !== "none") heading.focus({ preventScroll: true });
    else currentCrumbRef.current?.focus({ preventScroll: true });
  }, [view]);

  // Motion controls drive every mounted drawing's SMIL timeline.
  const svgs = () => Array.from(stageRef.current?.querySelectorAll<SVGSVGElement>(":scope > .uipack-drill__layer > svg") ?? []);
  useEffect(() => {
    for (const s of svgs()) {
      if (typeof s.pauseAnimations !== "function") continue;
      if (playing) s.unpauseAnimations();
      else s.pauseAnimations();
    }
  }, [playing, expanded, view]);
  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const replay = useCallback(() => {
    for (const s of svgs()) {
      if (typeof s.setCurrentTime === "function") s.setCurrentTime(0);
      if (typeof s.unpauseAnimations === "function") s.unpauseAnimations();
    }
    setPlaying(true);
    setCycle((c) => c + 1);
  }, []);
  const motion = useMemo<FigureMotion>(
    () => ({ playing: playing && !reduced, reduced, cycle, toggle, replay }),
    [playing, reduced, cycle, toggle, replay],
  );

  const note = selected?.detail ? selected : null;
  useIsoLayoutEffect(() => {
    setNotePos(null);
    const canvas = canvasRef.current;
    const el = noteRef.current;
    const anchor = note?.anchor;
    if (!canvas || !el || !anchor) return;
    const place = () => {
      if (anchor.isConnected) setNotePos(placeNote(canvas, el, anchor));
    };
    place();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(place);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [note, zoom, expanded]);

  // Each level's drawing is one Tab stop; the arrow keys move between its parts.
  useRovingFocus(canvasRef, expanded);

  const current = levelMap.get(last(view.path));
  if (!current) return null;
  const crumbs = view.path;
  const depth = crumbs.length - 1;
  const parentLabel = depth > 0 ? labelOf(crumbs[depth - 1]) : "";
  const trail = crumbs.map(labelOf).join(" › ");
  const fw = vbSize(viewBox);
  const fn = narrowViewBox ? vbSize(narrowViewBox) : null;

  // Mounted layers, parent first; the inner one is raised while it flies.
  const mounted = view.flight ? [last(view.flight.from), last(view.path)] : [last(view.path)];
  mounted.sort((a, b) => {
    const order = view.flight && view.flight.from.length > view.path.length ? view.flight.from : view.path;
    return order.indexOf(a) - order.indexOf(b);
  });

  const showControls = controls && !reduced;

  return (
    <CanvasView
      restoreFocus={() => opener.current?.focus()}
      open={expanded}
      onClose={() => {
        setExpanded(false);
        setZoom(1);
        select(null);
      }}
      title={trail}
      theme={theme}
      layout="figure"
      zoom={{ value: zoom, min: 1, max: 3, onChange: setZoom }}
    >
      <SelectionContext.Provider value={{ enabled: true, selected, select }}>
        <FigureMotionContext.Provider value={motion}>
          <FigureHoverContext.Provider value={hover}>
            <figure
              id={figId}
              className={[
                "uipack",
                "uipack-drill",
                narrowViewBox ? "uipack--has-narrow" : "",
                expanded ? "uipack--expanded" : "",
                className ?? "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-theme={theme}
              data-level={current.id}
              data-depth={depth}
              data-hover-flow={hoverFlow ?? undefined}
              data-hover-kind={hoverKind ?? undefined}
              onKeyDown={(e) => {
                if (e.defaultPrevented) return;
                const t = e.target as Element;
                if (t.closest?.("input, select, textarea, [contenteditable='true']")) return;
                if (e.key === "Escape") {
                  if (selected) {
                    select(null);
                    return;
                  }
                  // In the canvas, Escape keeps closing the canvas.
                  if (expanded || requestedRef.current.length < 2) return;
                  e.preventDefault();
                  up();
                } else if (e.key === "Backspace" && requestedRef.current.length > 1) {
                  e.preventDefault();
                  up();
                }
              }}
              style={
                {
                  margin: expanded ? "auto 0" : 0,
                  "--figure-width": `${fw.w}px`,
                  "--drill-aspect": `${fw.w} / ${fw.h}`,
                  "--drill-aspect-narrow": fn ? `${fn.w} / ${fn.h}` : undefined,
                } as CSSProperties
              }
            >
              <div className="uipack__head">
                {number || eyebrow ? (
                  <p className="uipack__eyebrow">
                    {number}
                    {number && eyebrow ? " · " : ""}
                    {eyebrow}
                  </p>
                ) : null}
                <nav className="uipack-drill__crumbs" aria-label="Figure levels">
                  <ol>
                    {crumbs.map((lid, i) => (
                      <li key={lid}>
                        {i > 0 ? (
                          <span className="uipack-drill__sep" aria-hidden="true">
                            ›
                          </span>
                        ) : null}
                        {i < depth ? (
                          <button type="button" className="uipack-drill__crumb" onClick={() => navigate(crumbs.slice(0, i + 1))}>
                            {labelOf(lid)}
                          </button>
                        ) : (
                          <span className="uipack-drill__here" aria-current="location" tabIndex={-1} ref={currentCrumbRef}>
                            {labelOf(lid)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
                {createElement(
                  `h${headingLevel}`,
                  { className: "uipack__title", tabIndex: -1, ref: headingRef },
                  current.title ?? current.label,
                )}
                {current.caption ? <p className="uipack__caption">{current.caption}</p> : null}
                <div className="uipack__controls">
                  {depth > 0 ? (
                    <button type="button" className="uipack__ctl uipack-drill__back" aria-label={`Back to ${parentLabel}`} onClick={up}>
                      <BackGlyph /> Back
                    </button>
                  ) : null}
                  {expandable && !expanded ? (
                    <button
                      type="button"
                      className="uipack__ctl"
                      ref={opener}
                      onClick={() => {
                        select(null);
                        setExpanded(true);
                      }}
                    >
                      Open canvas
                    </button>
                  ) : null}
                  {showControls ? (
                    <>
                      <button type="button" className="uipack__ctl uipack__ctl--motion" onClick={replay}>
                        <ReplayGlyph /> Replay
                      </button>
                      <button type="button" className="uipack__ctl uipack__ctl--motion" onClick={toggle} aria-pressed={!playing}>
                        {playing ? <PauseGlyph /> : <PlayGlyph />} {playing ? "Pause" : "Play"}
                      </button>
                    </>
                  ) : null}
                </div>
                <Legend items={current.legend ?? []} />
              </div>
              <p className="uipack__sr" role="status">
                {note ? `${note.label}: ${note.detail}` : ""}
              </p>
              <p className="uipack__sr" aria-live="polite" data-drill-announce="">
                {announcement}
              </p>
              <div ref={canvasRef} className={`uipack__canvas uipack__canvas--${background}`} onClick={() => select(null)}>
                {note ? (
                  <div
                    ref={noteRef}
                    className="uipack__note"
                    aria-hidden="true"
                    data-placed={notePos ? "true" : undefined}
                    style={notePos ?? undefined}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <strong>{note.label}</strong>
                    <span>{note.detail}</span>
                  </div>
                ) : null}
                <div
                  ref={stageRef}
                  className="uipack-drill__stage"
                  data-flight={view.flight ? view.flight.kind : undefined}
                  style={expanded ? { width: `max(${zoom * 100}%, ${800 * zoom}px)` } : undefined}
                >
                  {mounted.map((lid) => {
                    const lvl = levelMap.get(lid)!;
                    return (
                      <DrillLayer
                        key={lid}
                        level={lvl}
                        figId={figId}
                        frame={frame}
                        floorWide={levelFloor(lvl.viewBox ?? viewBox, viewBox, stageW, minFont)}
                        floorNarrow={narrowViewBox ? levelFloor(lvl.narrowViewBox ?? narrowViewBox, narrowViewBox, stageW, minFont) : 0}
                        levels={levelMap}
                        open={openFrom}
                        current={lid === current.id}
                      />
                    );
                  })}
                </div>
              </div>
            </figure>
          </FigureHoverContext.Provider>
        </FigureMotionContext.Provider>
      </SelectionContext.Provider>
    </CanvasView>
  );
}

/**
 * A stack of figures in the Figure style; see `DrillFigureRoot`.
 * `renderStatic(<DrillFigure …/>)` draws the level at the figure's path. `toStatic` is attached
 * through a pure `Object.assign`, not a top-level property write, so bundlers can drop an unused figure.
 */
export const DrillFigure = /*#__PURE__*/ Object.assign(DrillFigureRoot, {
  displayName: "DrillFigure",
  toStatic: (props: DrillFigureProps) => drillStatic(props),
});
