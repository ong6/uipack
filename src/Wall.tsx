import { useFigureHover, hoverAttrs, type Flow } from "./hover";

export interface WallProps {
  /** Position across the wall's axis: x for a standing wall, y for a lying one. */
  at: number;
  /** Start and end along the wall's axis. */
  from: number;
  to: number;
  /** Centres along the axis where something passes; each opens a gap. */
  holes?: number[];
  /** "v" stands up (x = at), "h" lies across (y = at). Default "v". */
  axis?: "v" | "h";
  /** Slab thickness in user units. Default 16. */
  thickness?: number;
  /** Half the opening at each hole. Default 9. */
  gap?: number;
  /** Flow names for hover highlighting. */
  flow?: Flow;
}

/** The solid runs of a wall between its holes, as [start, end] pairs along the axis. */
export function wallSegments(from: number, to: number, holes: readonly number[] = [], gap = 9): [number, number][] {
  const segs: [number, number][] = [];
  let s = from;
  for (const c of [...holes].sort((a, b) => a - b)) {
    if (c - gap > s) segs.push([s, c - gap]);
    s = Math.max(s, c + gap);
  }
  if (to > s) segs.push([s, to]);
  return segs;
}

/**
 * A wall: solid slabs with a gap wherever an item passes. One layer of a
 * defence-in-depth figure, a filter, a boundary that lets some lines through.
 * Lines that stop at it end short of the slab; lines that pass go through a hole.
 */
export function Wall({ at, from, to, holes = [], axis = "v", thickness: t = 16, gap = 9, flow }: WallProps) {
  const hover = useFigureHover();
  return (
    <g data-uipack="wall" {...hoverAttrs(flow, undefined, hover)}>
      {wallSegments(from, to, holes, gap).map(([a, b]) => {
        const r = axis === "v" ? { x: at - t / 2, y: a, width: t, height: b - a } : { x: a, y: at - t / 2, width: b - a, height: t };
        return <rect key={a} {...r} rx={2} fill="var(--uipack-surface-raised)" stroke="currentColor" strokeOpacity={0.55} strokeWidth={1.25} />;
      })}
    </g>
  );
}
