import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useIsoLayoutEffect } from "../env";
import type { DocsTocItem } from "./DocsLayout";

/**
 * The location markers of the docs shell: a paper plane or the uipack square mark that travels to
 * where the reader is, on "On this page" (to the heading being read) and in the sidebar (to the
 * current page, from the page the reader came from). The plane flies a dotted path; the mark hops
 * like a game piece. Geometry and playback live here; DocsLayout places them. Reduced motion:
 * every move is a jump.
 */
export type DocsMarkerShape = "plane" | "mark";

/** A cell of the square mark in reading order: top left, top right, bottom left, bottom right. */
export type DocsMarkerCell = 0 | 1 | 2 | 3;

/** The mark's cells as centres, drawn for a 14px marker: 5px squares on a 1.25px line (docs.css). */
const MARK_CELLS = [
  [-3.65, -3.65],
  [3.65, -3.65],
  [-3.65, 3.65],
  [3.65, 3.65],
] as const;

/** Half the mark's height: a landing squashes it onto its bottom edge. */
const MARK_FOOT = 6.8;

/**
 * The marker's drawing, centred on 0,0; the plane points along +x. Colour: currentColor. The mark
 * is three outlined squares and a dot on the `live` cell (default the bottom right); each cell
 * carries `data-cell` and the dot `data-live`.
 */
export function MarkerGlyph({ shape, live = 3 }: { shape: DocsMarkerShape; live?: DocsMarkerCell }) {
  if (shape === "mark")
    return (
      <g className="uipack-docs__marker-mark">
        {MARK_CELLS.map(([cx, cy], cell) => (
          <rect
            key={cell}
            data-cell={cell}
            data-live={cell === live ? "" : undefined}
            x={cx - 2.5}
            y={cy - 2.5}
            width="5"
            height="5"
            rx={cell === live ? 2.5 : 1}
          />
        ))}
      </g>
    );
  return (
    <g className="uipack-docs__marker-plane">
      <path className="uipack-docs__marker-body" d="M7 0-6.5-6-3.2 0-6.5 6Z" />
      <path className="uipack-docs__marker-fold" d="M-3.2 0H6" />
    </g>
  );
}

export interface Point {
  x: number;
  y: number;
}

/** A polyline with its arc lengths, sampled by distance along it. */
export function polyline(points: Point[]) {
  const cum = [0];
  for (let i = 1; i < points.length; i++)
    cum.push(cum[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  const total = cum[cum.length - 1] ?? 0;
  /** The point at distance `l`, the index of the segment it is on, and that segment's direction. */
  const at = (l: number) => {
    if (points.length < 2) return { x: points[0]?.x ?? 0, y: points[0]?.y ?? 0, i: 1, angle: Math.PI / 2 };
    for (let i = 1; i < points.length; i++) {
      if (l <= cum[i] || i === points.length - 1) {
        const a = points[i - 1];
        const b = points[i];
        const seg = cum[i] - cum[i - 1] || 1;
        const t = Math.max(0, Math.min(1, (l - cum[i - 1]) / seg));
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, i, angle: Math.atan2(b.y - a.y, b.x - a.x) };
      }
    }
    return { x: 0, y: 0, i: 1, angle: 0 };
  };
  /** The path from distance `from` to `to` as SVG path data. */
  const slice = (from: number, to: number) => {
    const a = at(Math.max(0, from));
    const b = at(Math.min(total, to));
    const mid = points.slice(a.i, b.i);
    return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}${mid.map((q) => `L${q.x} ${q.y}`).join("")}L${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  };
  return { points, cum, total, at, slice };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const prefersReducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * How many hops the mark takes over `length` px in `duration` ms: one per 40px (a neighbouring
 * link is one hop), no hop shorter than 220ms, five at most.
 */
export const hopCount = (length: number, duration: number) =>
  Math.max(1, Math.min(5, Math.round(length / 40), Math.floor(duration / 220)));

/** The share of a hop spent in the air; the rest is the landing, a squash and its recovery. */
const HOP_FLIGHT = 0.78;

/**
 * The mark's pose at `t` (0 to 1) of a trip of `hops` equal hops over `length` px: how far along
 * (0 to 1), how far off the line it has lifted (px), its squash, and which hop it is on. In the air
 * it travels evenly on a parabola, a little stretched; on landing it squashes and recovers.
 */
export function hopPose(t: number, hops: number, length: number) {
  if (t >= 1) return { hop: hops - 1, along: 1, lift: 0, sx: 1, sy: 1 };
  const scaled = Math.max(0, t) * hops;
  const hop = Math.min(hops - 1, Math.floor(scaled));
  const u = scaled - hop;
  const height = Math.max(5, Math.min(9, (length / hops) * 0.3));
  if (u < HOP_FLIGHT) {
    const f = u / HOP_FLIGHT;
    const arc = 4 * f * (1 - f);
    return { hop, along: (hop + f) / hops, lift: height * arc, sx: 1 - 0.05 * arc, sy: 1 + 0.07 * arc };
  }
  const squash = Math.sin((Math.PI * (u - HOP_FLIGHT)) / (1 - HOP_FLIGHT));
  return { hop, along: (hop + 1) / hops, lift: 0, sx: 1 + 0.16 * squash, sy: 1 - 0.18 * squash };
}

/** The marker's transform: the plane turned along its path, the mark squashed onto its bottom edge. */
export function markerTransform(x: number, y: number, deg: number, sx = 1, sy = 1) {
  if (sx === 1 && sy === 1) return `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${deg.toFixed(1)})`;
  return `translate(${x.toFixed(2)} ${(y + (1 - sy) * MARK_FOOT).toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`;
}

/**
 * "On this page" with a dotted path: one dot column for h2s, a step right for h3s, the done part
 * of the path in the accent, and the marker travelling to the current heading as the reader
 * scrolls or picks a heading: the plane glides, the mark hops (from wherever it is to the latest
 * heading, never a queue of hops). The list is ordinary links; the drawing is decorative.
 */
export function ContentsRail({
  items,
  current,
  shape,
  live,
  onPick,
}: {
  items: DocsTocItem[];
  current: string | null;
  shape: DocsMarkerShape;
  live?: DocsMarkerCell;
  onPick: (id: string, event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const base = useRef<SVGPathElement>(null);
  const done = useRef<SVGPathElement>(null);
  const glyph = useRef<SVGGElement>(null);
  const state = useRef({
    line: polyline([]),
    stops: [] as number[],
    at: null as number | null,
    dir: 1,
    frame: 0,
    // The mark's hop: how far off the path it is, and its squash.
    lift: 0,
    sx: 1,
    sy: 1,
  });
  const index = items.findIndex((item) => item.id === current);

  const draw = useCallback(() => {
    const s = state.current;
    if (s.at === null || !glyph.current || !done.current) return;
    const p = s.line.at(s.at);
    // The plane points along the path; the mark stays upright (its dot's cell means something).
    const deg = shape === "mark" ? 0 : (p.angle * 180) / Math.PI + (s.dir < 0 ? 180 : 0);
    glyph.current.setAttribute("transform", markerTransform(p.x + s.lift, p.y, deg, s.sx, s.sy));
    done.current.setAttribute("d", s.line.slice(0, s.at));
  }, [shape]);

  const layout = useCallback(() => {
    const el = box.current;
    if (!el || !el.offsetParent || !svg.current || !base.current) return;
    const top = el.getBoundingClientRect().top;
    const links = [...el.querySelectorAll<HTMLAnchorElement>(".uipack-docs__toc-list a")];
    if (!links.length) return;
    const pts = links.map((a) => {
      const r = a.getBoundingClientRect();
      return { x: a.parentElement?.dataset.level === "3" ? 20 : 8, y: r.top - top + r.height / 2 };
    });
    const poly: Point[] = [{ x: pts[0].x, y: Math.max(0, pts[0].y - 14) }];
    const stopAt: number[] = [];
    pts.forEach((pt, i) => {
      const prev = pts[i - 1];
      if (prev && prev.x !== pt.x) {
        const d = pt.y - prev.y;
        poly.push({ x: prev.x, y: prev.y + d * 0.3 }, { x: pt.x, y: prev.y + d * 0.7 });
      }
      stopAt.push(poly.length);
      poly.push(pt);
    });
    const last = pts[pts.length - 1];
    poly.push({ x: last.x, y: last.y + 14 });
    const line = polyline(poly);
    const s = state.current;
    s.line = line;
    s.stops = stopAt.map((i) => line.cum[i]);
    const h = Math.ceil(el.getBoundingClientRect().height);
    svg.current.setAttribute("height", String(h));
    svg.current.setAttribute("viewBox", `0 0 32 ${h}`);
    base.current.setAttribute("d", line.slice(0, line.total));
    if (index >= 0) {
      s.at = s.stops[index];
      draw();
    }
  }, [draw, index]);

  // Lay out when the list or the box's size changes (fonts, wrapping, the theme, a resize).
  useIsoLayoutEffect(() => {
    layout();
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => layout());
    observer.observe(el);
    return () => observer.disconnect();
    // `layout` changes with the index; the observer only needs the box.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Travel to the current heading: the plane glides; the mark hops, from wherever it is.
  useEffect(() => {
    const s = state.current;
    const target = s.stops[index];
    if (target === undefined) return;
    cancelAnimationFrame(s.frame);
    const rest = () => {
      s.at = target;
      s.lift = 0;
      s.sx = s.sy = 1;
      draw();
    };
    if (s.at === null || prefersReducedMotion()) return rest();
    const from = s.at;
    const delta = target - from;
    if (Math.abs(delta) < 0.5) return rest();
    s.dir = delta > 0 ? 1 : -1;
    const duration = Math.min(950, 320 + Math.abs(delta) * 1.6);
    const hops = hopCount(Math.abs(delta), duration);
    // A hop cut short by the next heading: what was left of its lift eases out under the new hop.
    const carried = s.lift;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      if (shape === "mark") {
        const pose = hopPose(t, hops, Math.abs(delta));
        s.at = from + delta * pose.along;
        s.lift = Math.max(pose.lift, carried * Math.max(0, 1 - (now - t0) / 120));
        s.sx = pose.sx;
        s.sy = pose.sy;
      } else s.at = from + delta * easeInOut(t);
      draw();
      if (t < 1) s.frame = requestAnimationFrame(step);
    };
    s.frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(s.frame);
  }, [index, draw, shape]);

  return (
    <div className="uipack-docs__rail" ref={box} data-marker={shape}>
      <svg className="uipack-docs__rail-track" ref={svg} aria-hidden="true" focusable="false">
        <path className="uipack-docs__rail-base" ref={base} />
        <path className="uipack-docs__rail-done" ref={done} />
        <g
          className="uipack-docs__marker"
          ref={glyph}
          data-at={index >= 0 ? items[index].id : undefined}
          visibility={index >= 0 ? undefined : "hidden"}
        >
          <MarkerGlyph shape={shape} live={live} />
        </g>
      </svg>
      <ol className="uipack-docs__toc-list">
        {items.map((item) => (
          <li key={item.id} data-level={item.level}>
            <a
              href={`#${item.id}`}
              aria-current={item.id === current ? "location" : undefined}
              onClick={(event) => onPick(item.id, event)}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** What the sidebar's marker remembers between page loads (sessionStorage, under the host's key). */
export interface NavMemory {
  href: string;
  open: string[];
  scroll: number;
  /** The mark's live cell and its dot's colour on the page being left: the next page's mark sets off as that. */
  live?: DocsMarkerCell;
  dot?: string;
}

export function readNavMemory(key: string | undefined): NavMemory | null {
  if (!key || typeof sessionStorage === "undefined") return null;
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? "null") as NavMemory | null;
    return value && typeof value.href === "string" && Array.isArray(value.open) ? value : null;
  } catch {
    return null;
  }
}

export function writeNavMemory(key: string | undefined, memory: NavMemory) {
  if (!key || typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(memory));
  } catch {
    /* storage full or blocked: the marker just docks without travelling */
  }
}

/** The sidebar dock columns: beside a page's link, and on the tree line of its sub-pages (docs.css matches them). */
export const NAV_DOCK_X = 16;
export const NAV_SUB_DOCK_X = 46;

/** The route between two docks: across to the page column, along it, and out to a sub-page's tree line. */
export function navRoute(from: Point, to: Point): Point[] {
  const dy = to.y - from.y;
  const dir = Math.sign(dy) || 1;
  const step = Math.min(12, Math.abs(dy) / 3);
  const pts: Point[] = [from];
  if (Math.abs(dy) < 1) return [from, to];
  if (from.x !== NAV_DOCK_X) pts.push({ x: NAV_DOCK_X, y: from.y + dir * step });
  if (to.x !== NAV_DOCK_X) pts.push({ x: NAV_DOCK_X, y: to.y - dir * step });
  else pts.push({ x: NAV_DOCK_X, y: to.y });
  if (to.x !== NAV_DOCK_X) pts.push(to);
  return pts;
}

/** How long a sidebar trip along `route` takes, in ms: the same for either shape. */
export const navTripDuration = (route: Point[]) => Math.min(1150, 420 + polyline(route).total * 1.1);

/**
 * Plays one sidebar trip. The plane flies the route, a short dotted trail behind it, then turns to
 * face the link it docks beside. The mark hops it, a few arcs to the right of the route (`hopCount`),
 * landing each with a squash, in the same time, the same trail on the route beneath it; `onLastHop` fires as its final
 * hop leaves the ground. `onFrame(y)` fires as it passes each y (the host opens the section it
 * arrives in). Returns a cancel function.
 */
export function flyNavMarker(
  route: Point[],
  shape: DocsMarkerShape,
  draw: (x: number, y: number, deg: number, trail: string, sx?: number, sy?: number) => void,
  onDone: () => void,
  onFrame?: (y: number) => void,
  onLastHop?: () => void,
) {
  const line = polyline(route);
  const duration = navTripDuration(route);
  const hops = hopCount(line.total, duration);
  const t0 = performance.now();
  let frame = 0;
  let last = false;
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / duration);
    if (shape === "mark") {
      const pose = hopPose(t, hops, line.total);
      const p = line.at(line.total * pose.along);
      if (!last && pose.hop === hops - 1) {
        last = true;
        onLastHop?.();
      }
      // The trail stays on the route, under the arcs: the ground the mark has just covered.
      const l = line.total * pose.along;
      draw(p.x + pose.lift, p.y, 0, line.slice(l - 64, l), pose.sx, pose.sy);
      onFrame?.(p.y);
    } else {
      const l = line.total * easeInOut(t);
      const p = line.at(l);
      // Along the path, turning to face the link over the last fifth.
      const along = (p.angle * 180) / Math.PI;
      const turn = Math.max(0, (t - 0.8) / 0.2);
      draw(p.x, p.y, along * (1 - turn), line.slice(l - 64, l));
      onFrame?.(p.y);
    }
    if (t < 1) frame = requestAnimationFrame(step);
    else onDone();
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

/** Whether the marker setting is one of the two shapes. */
export const isMarkerShape = (value: unknown): value is DocsMarkerShape => value === "plane" || value === "mark";
