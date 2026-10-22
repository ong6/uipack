import { createElement, useCallback, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { CanvasView } from "../CanvasView";
import { usePrefersReducedMotion } from "../env";
import { Legend } from "../Legend";
import { FigureMotionContext } from "../context";
import { FigureHoverContext, type FigureHover } from "../hover";
import { useRovingFocus } from "../roving";
import { SelectionContext, type SelectedItem } from "../selection";
import { DrillControls, DrillCrumbs } from "./DrillHead";
import { DrillLayer } from "./DrillLayer";
import { useDrillMotion, useDrillPath, useNotePlacement, useStageWidth } from "./hooks";
import { drillStatic } from "./static";
import { cleanId, levelFloor, vbSize, type DrillLevel, type DrillPath } from "./model";
import { lastOf, useDrillFlight } from "./useDrillFlight";

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
  const reduced = usePrefersReducedMotion();
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
  // Set when a person navigates, so focus follows their move (not a controlled path change).
  const focusIntentRef = useRef(false);

  const { levelMap, labelOf, requested, navigate, up, openFrom, canGoUp } = useDrillPath({
    levels,
    root,
    path,
    defaultPath,
    onPathChange,
    onNavigate: () => {
      focusIntentRef.current = true;
    },
  });
  const { view, announcement } = useDrillFlight({
    requested,
    labelOf,
    focusIntentRef,
    stageRef,
    canvasRef,
    headingRef,
    currentCrumbRef,
    reduced,
    duration,
    onLeave: () => {
      select(null);
      setHoverFlow(null);
      setHoverKind(null);
    },
  });
  const stageW = useStageWidth(stageRef, expanded);
  const motion = useDrillMotion(stageRef, reduced, expanded, view);
  const note = selected?.detail ? selected : null;
  const notePos = useNotePlacement(canvasRef, noteRef, note, zoom, expanded);
  const frame = useMemo(() => ({ wide: viewBox, narrow: narrowViewBox }), [viewBox, narrowViewBox]);

  // Each level's drawing is one Tab stop; the arrow keys move between its parts.
  useRovingFocus(canvasRef, expanded);

  const openCanvas = useCallback(() => {
    select(null);
    setExpanded(true);
  }, []);

  const current = levelMap.get(lastOf(view.path));
  if (!current) return null;
  const crumbs = view.path;
  const depth = crumbs.length - 1;
  const trail = crumbs.map(labelOf).join(" › ");
  const fw = vbSize(viewBox);
  const fn = narrowViewBox ? vbSize(narrowViewBox) : null;

  // Mounted layers, parent first; the inner one is raised while it flies.
  const mounted = view.flight ? [lastOf(view.flight.from), lastOf(view.path)] : [lastOf(view.path)];
  mounted.sort((a, b) => {
    const order = view.flight && view.flight.from.length > view.path.length ? view.flight.from : view.path;
    return order.indexOf(a) - order.indexOf(b);
  });

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
                  if (expanded || !canGoUp()) return;
                  e.preventDefault();
                  up();
                } else if (e.key === "Backspace" && canGoUp()) {
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
                <DrillCrumbs crumbs={crumbs} labelOf={labelOf} navigate={navigate} currentRef={currentCrumbRef} />
                {createElement(
                  `h${headingLevel}`,
                  { className: "uipack__title", tabIndex: -1, ref: headingRef },
                  current.title ?? current.label,
                )}
                {current.caption ? <p className="uipack__caption">{current.caption}</p> : null}
                <DrillControls
                  parentLabel={depth > 0 ? labelOf(crumbs[depth - 1]) : null}
                  onBack={up}
                  onOpen={expandable && !expanded ? openCanvas : null}
                  openerRef={opener}
                  motion={controls && !reduced ? motion : null}
                />
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
                        floorNarrow={
                          narrowViewBox ? levelFloor(lvl.narrowViewBox ?? narrowViewBox, narrowViewBox, stageW, minFont) : 0
                        }
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
