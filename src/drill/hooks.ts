// DrillFigure's smaller hooks: the requested path (controlled or not), the stage's width, the
// motion controls over every drawing's SMIL timeline, and placing the selected part's note.
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useIsoLayoutEffect } from "../env";
import { placeNote } from "../Figure";
import type { FigureMotion } from "../context";
import type { SelectedItem } from "../selection";
import { drillReducer, normalizePath, samePath, type DrillLevel, type DrillPath } from "./model";

export interface DrillPathOptions {
  levels: DrillLevel[];
  root?: string;
  path?: DrillPath;
  defaultPath?: DrillPath;
  onPathChange?: (path: string[]) => void;
  /** Called when a person moves (not when the controlling prop changes), so focus can follow them. */
  onNavigate: () => void;
}

/**
 * The path the figure is asked to show: the `path` prop when controlled, else its own state.
 * `requested` keeps its identity while its ids are unchanged, so a parent passing a fresh array
 * with the same ids does not restart a move.
 */
export function useDrillPath({ levels, root, path, defaultPath, onPathChange, onNavigate }: DrillPathOptions) {
  const levelMap = useMemo(() => new Map(levels.map((l) => [l.id, l])), [levels]);
  const ids = useMemo(() => new Set(levelMap.keys()), [levelMap]);
  const rootId = root ?? levels[0]?.id ?? "";
  const labelOf = useCallback((lid: string) => levelMap.get(lid)?.label ?? lid, [levelMap]);

  const [own, setOwn] = useState<DrillPath>(() => normalizePath(defaultPath, ids, rootId));
  const requestedKey = JSON.stringify(normalizePath(path ?? own, ids, rootId));
  const requested = useMemo(() => JSON.parse(requestedKey) as DrillPath, [requestedKey]);

  // Handlers read the latest props and path; synced before any other layout effect reads them.
  const latest = useRef({ requested, path, onPathChange, onNavigate });
  useIsoLayoutEffect(() => {
    latest.current = { requested, path, onPathChange, onNavigate };
  });

  const navigate = useCallback((next: DrillPath) => {
    const { requested, path, onPathChange, onNavigate } = latest.current;
    if (samePath(next, requested)) return;
    onNavigate();
    if (path === undefined) setOwn(next);
    onPathChange?.([...next]);
  }, []);
  const up = useCallback(() => navigate(drillReducer(latest.current.requested, { type: "up" }, ids)), [navigate, ids]);
  const openFrom = useCallback(
    (from: string, child: string) => {
      const cur = latest.current.requested;
      const at = cur.indexOf(from);
      if (at < 0) return;
      navigate(drillReducer(cur.slice(0, at + 1), { type: "open", id: child }, ids));
    },
    [navigate, ids],
  );
  /** Whether a person can go up from where they are now (Escape and Backspace). */
  const canGoUp = useCallback(() => latest.current.requested.length > 1, []);

  return { levelMap, labelOf, requested, navigate, up, openFrom, canGoUp };
}

/** The stage's rendered width, re-measured on resize and when the canvas opens or closes. */
export function useStageWidth(stageRef: RefObject<HTMLDivElement | null>, expanded: boolean) {
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
  }, [stageRef, expanded]);
  return stageW;
}

const drawings = (stage: HTMLElement | null) =>
  Array.from(stage?.querySelectorAll<SVGSVGElement>(":scope > .uipack-drill__layer > svg") ?? []);

/**
 * Pause, Play and Replay for every mounted drawing's SMIL timeline. Drawings mount when the view
 * moves or the canvas opens, so `expanded` and `view` re-apply the paused state to new ones.
 */
export function useDrillMotion(stageRef: RefObject<HTMLDivElement | null>, reduced: boolean, expanded: boolean, view: unknown) {
  const [playing, setPlaying] = useState(true);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    for (const s of drawings(stageRef.current)) {
      if (typeof s.pauseAnimations !== "function") continue;
      if (playing) s.unpauseAnimations();
      else s.pauseAnimations();
    }
  }, [stageRef, playing, expanded, view]);
  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const replay = useCallback(() => {
    for (const s of drawings(stageRef.current)) {
      if (typeof s.setCurrentTime === "function") s.setCurrentTime(0);
      if (typeof s.unpauseAnimations === "function") s.unpauseAnimations();
    }
    setPlaying(true);
    setCycle((c) => c + 1);
  }, [stageRef]);
  return useMemo<FigureMotion>(
    () => ({ playing: playing && !reduced, reduced, cycle, toggle, replay }),
    [playing, reduced, cycle, toggle, replay],
  );
}

/** Where the selected part's note sits beside its anchor; null until measured. Zooming or opening the canvas re-places it. */
export function useNotePlacement(
  canvasRef: RefObject<HTMLDivElement | null>,
  noteRef: RefObject<HTMLDivElement | null>,
  note: SelectedItem | null,
  zoom: number,
  expanded: boolean,
) {
  const [notePos, setNotePos] = useState<{ left: number; top: number } | null>(null);
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
  }, [canvasRef, noteRef, note, zoom, expanded]);
  return notePos;
}
