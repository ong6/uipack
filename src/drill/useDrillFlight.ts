// How DrillFigure moves between levels. A new requested path starts a flight (zoom in, zoom out
// or crossfade) with both layers mounted, reverses the running one when the person goes straight
// back, and lands by unmounting the layer left behind. Then focus moves where attention should be,
// and the move is announced.
import { useCallback, useRef, useState, type MutableRefObject, type RefObject } from "react";
import { useIsoLayoutEffect, useLatest } from "../env";
import { useLayerFlight } from "../flight";
import { clearLayer, findDrillNode, runDrill } from "./animate";
import { drillAnnouncement, drillFocusTarget, drillMove, samePath, type DrillPath } from "./model";

interface Flight {
  /** Path being left. The destination is the view's path. */
  from: DrillPath;
  kind: "in" | "out" | "fade";
  seq: number;
}

export interface DrillView {
  path: DrillPath;
  flight: Flight | null;
}

export const lastOf = (p: DrillPath) => p[p.length - 1];

export interface DrillFlightOptions {
  requested: DrillPath;
  labelOf: (id: string) => string;
  /** Set by navigation a person made: only then does focus follow the move. */
  focusIntentRef: MutableRefObject<boolean>;
  stageRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLDivElement | null>;
  headingRef: RefObject<HTMLHeadingElement | null>;
  currentCrumbRef: RefObject<HTMLSpanElement | null>;
  reduced: boolean;
  duration?: number;
  /** A move starts: clear what belonged to the level being left (selection, hover). */
  onLeave: () => void;
}

export function useDrillFlight({
  requested,
  labelOf,
  focusIntentRef,
  stageRef,
  canvasRef,
  headingRef,
  currentCrumbRef,
  reduced,
  duration,
  onLeave,
}: DrillFlightOptions) {
  const [view, setView] = useState<DrillView>(() => ({ path: requested, flight: null }));
  const [announcement, setAnnouncement] = useState("");
  const seq = useRef(0);
  const pendingFocus = useRef<{ from: DrillPath; to: DrillPath } | null>(null);

  // The effects below run once per move, not per render, so they read these through a ref. It is
  // declared first, so it is up to date before any of them runs in the same commit.
  const latestRef = useLatest({ view, labelOf, reduced, duration, onLeave });

  const layerEl = useCallback(
    (lid: string) =>
      stageRef.current?.querySelector<HTMLElement>(
        `:scope > [data-level="${typeof CSS !== "undefined" && CSS.escape ? CSS.escape(lid) : lid}"]`,
      ) ?? null,
    [stageRef],
  );

  const { anims, settle, fly } = useLayerFlight(() =>
    stageRef.current?.querySelectorAll<HTMLElement>(":scope > .uipack-drill__layer").forEach(clearLayer),
  );

  /** Land flight `n`, unless a newer one has replaced it. */
  const finish = useCallback(
    (n: number) => {
      const v = latestRef.current.view;
      if (!v.flight || v.flight.seq !== n) return;
      const leaving = layerEl(lastOf(v.flight.from));
      // Hidden before the animations let go, so the leaving layer never flashes at rest.
      if (leaving) leaving.style.visibility = "hidden";
      settle();
      setView({ path: v.path, flight: null });
    },
    [layerEl, settle, latestRef],
  );

  // A new requested path: start, reverse or redirect a move.
  useIsoLayoutEffect(() => {
    const { view: v, labelOf, onLeave } = latestRef.current;
    if (samePath(requested, v.path)) return;
    onLeave();
    setAnnouncement(drillAnnouncement(v.path, requested, labelOf));
    pendingFocus.current = focusIntentRef.current ? { from: v.path, to: requested } : null;
    focusIntentRef.current = false;
    if (v.flight && anims.current.length && samePath(requested, v.flight.from)) {
      // Back while flying in (or forward while flying out): play the same path backwards.
      for (const a of anims.current) a.reverse();
      setView({ path: requested, flight: { ...v.flight, from: v.path } });
      return;
    }
    if (v.flight) settle();
    const from = v.path;
    const canAnimate = typeof stageRef.current?.animate === "function" && lastOf(from) !== lastOf(requested);
    if (!canAnimate) {
      setView({ path: requested, flight: null });
      return;
    }
    const move = drillMove(from, requested);
    seq.current += 1;
    setView({
      path: requested,
      flight: { from, kind: move === "in" ? "in" : move === "out" ? "out" : "fade", seq: seq.current },
    });
  }, [requested, anims, focusIntentRef, settle, stageRef, latestRef]);

  // Both layers are mounted: measure the node and run the move before paint.
  const flightSeq = view.flight?.seq;
  useIsoLayoutEffect(() => {
    const { view: v, reduced, duration } = latestRef.current;
    const f = v.flight;
    const stage = stageRef.current;
    if (!f || !stage) return;
    const fromEl = layerEl(lastOf(f.from));
    const toEl = layerEl(lastOf(v.path));
    if (!fromEl || !toEl) {
      finish(f.seq);
      return;
    }
    const target =
      f.kind === "in" ? findDrillNode(fromEl, lastOf(v.path)) : f.kind === "out" ? findDrillNode(toEl, lastOf(f.from)) : null;
    const run = runDrill({ kind: f.kind, from: fromEl, to: toEl, target, stage, canvas: canvasRef.current, reduced, duration });
    fly(run, () => finish(f.seq));
  }, [flightSeq, canvasRef, finish, fly, layerEl, stageRef, latestRef]);

  // Settled: move focus where the person's attention should be.
  useIsoLayoutEffect(() => {
    if (view.flight || !pendingFocus.current) return;
    const { from, to } = pendingFocus.current;
    pendingFocus.current = null;
    const t = drillFocusTarget(from, to);
    if (t.kind === "node") {
      const layer = layerEl(lastOf(to));
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
  }, [view, currentCrumbRef, headingRef, layerEl]);

  return { view, announcement };
}
