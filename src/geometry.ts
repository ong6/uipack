export type Point = [number, number];
export type Side = "top" | "right" | "bottom" | "left";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A point on a box edge. `t` slides along the edge, 0..1, default centre. */
export function anchor(box: Box, side: Side, t = 0.5): Point {
  const { x, y, w, h } = box;
  switch (side) {
    case "top":
      return [x + w * t, y];
    case "bottom":
      return [x + w * t, y + h];
    case "left":
      return [x, y + h * t];
    case "right":
      return [x + w, y + h * t];
  }
}

/**
 * Orthogonal route between two points. `via` picks the elbow: "h" goes
 * horizontal first, "v" vertical first, a number is an absolute x (for "h")
 * or y (for "v") where the turn happens. Straight lines get no elbow.
 */
export function route(from: Point, to: Point, via: "h" | "v" | number = "h", axis: "h" | "v" = "h"): Point[] {
  const [x1, y1] = from;
  const [x2, y2] = to;
  if (x1 === x2 || y1 === y2) return [from, to];
  if (typeof via === "number") {
    return axis === "h"
      ? [from, [via, y1], [via, y2], to]
      : [from, [x1, via], [x2, via], to];
  }
  if (via === "h") {
    const mx = (x1 + x2) / 2;
    return [from, [mx, y1], [mx, y2], to];
  }
  const my = (y1 + y2) / 2;
  return [from, [x1, my], [x2, my], to];
}

/** SVG path data through the points with rounded corners of `radius`. */
export function pathFromPoints(points: Point[], radius = 6): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const inLen = Math.hypot(cx - px, cy - py);
    const outLen = Math.hypot(nx - cx, ny - cy);
    const r = Math.min(radius, inLen / 2, outLen / 2);
    if (r <= 0) {
      d += ` L${cx},${cy}`;
      continue;
    }
    const ax = cx - ((cx - px) / inLen) * r;
    const ay = cy - ((cy - py) / inLen) * r;
    const bx = cx + ((nx - cx) / outLen) * r;
    const by = cy + ((ny - cy) / outLen) * r;
    d += ` L${ax},${ay} Q${cx},${cy} ${bx},${by}`;
  }
  const [lx, ly] = points[points.length - 1];
  d += ` L${lx},${ly}`;
  return d;
}

/** Total length of a polyline and the point `t` (0..1) of the way along it. */
export function pointAlong(points: Point[], t: number): Point {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const l = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    segs.push(l);
    total += l;
  }
  let target = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i] || i === segs.length - 1) {
      const k = segs[i] === 0 ? 0 : target / segs[i];
      const [ax, ay] = points[i];
      const [bx, by] = points[i + 1];
      return [ax + (bx - ax) * k, ay + (by - ay) * k];
    }
    target -= segs[i];
  }
  return points[points.length - 1];
}

/** Length of a polyline in user units. */
export function polylineLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  return total;
}

/**
 * Shorten a polyline by `start` units at its first point and `end` units at
 * its last, walking along the segments. Used so an arrowhead stops short of a
 * node border and a packet stops short of the arrowhead. Never inverts: if the
 * trims meet, the polyline collapses to its midpoint.
 */
export function trim(points: Point[], start = 0, end = 0): Point[] {
  if (points.length < 2) return points;
  const total = polylineLength(points);
  if (start + end >= total) {
    const m = pointAlong(points, 0.5);
    return [m, m];
  }
  const cut = (pts: Point[], by: number): Point[] => {
    let left = by;
    let i = 0;
    while (i < pts.length - 1) {
      const [ax, ay] = pts[i];
      const [bx, by2] = pts[i + 1];
      const l = Math.hypot(bx - ax, by2 - ay);
      if (left < l || (left === l && i === pts.length - 2)) {
        const k = l === 0 ? 0 : left / l;
        return [[ax + (bx - ax) * k, ay + (by2 - ay) * k], ...pts.slice(i + 1)];
      }
      left -= l;
      i++;
    }
    return pts.slice(-1);
  };
  let out = start > 0 ? cut(points, start) : points;
  if (end > 0) out = cut([...out].reverse(), end).reverse();
  return out;
}

/** Snap a value to the 8px grid. */
export const grid = (v: number, step = 8): number => Math.round(v / step) * step;
