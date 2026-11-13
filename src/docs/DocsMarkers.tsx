import { useCallback, useEffect, useRef, useSyncExternalStore, type MouseEvent } from "react";
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

const subscribeActivation = (change: () => void) => {
  document.addEventListener("prerenderingchange", change);
  return () => document.removeEventListener("prerenderingchange", change);
};
const isActivated = () => !(document as { prerendering?: boolean }).prerendering;

/**
 * Whether the reader can see the document: false while the browser prerenders it (a page loaded
 * ahead of a click, by a speculation rule), true from the moment it is activated, and always true
 * elsewhere. What a reader should watch from its start (a trip from the page they left) and what
 * reads the visit's sessionStorage (a prerendered page gets the visit's own only when it is
 * activated) waits for it.
 */
export const useActivated = () => useSyncExternalStore(subscribeActivation, isActivated, () => true);

/**
 * How many hops the mark takes over `length` px in `duration` ms: one per 36px (a neighbouring
 * link is one hop), no hop shorter than 100ms, nine at most. Short hops keep the mark close to the
 * trail it leaves.
 */
export const hopCount = (length: number, duration: number) =>
  Math.max(1, Math.min(9, Math.round(length / 36), Math.floor(duration / 100)));

/**
 * How long the mark takes over `length` px, in ms: 300ms and 2ms a pixel, 900ms at most. The trip
 * is decoration on a page that is already there, so it is over within a second.
 */
export const hopDuration = (length: number, most = 900) => Math.min(most, 300 + length * 2);

/** The most a hop's arc leaves the line, in px: to the right, and to the left, where there is less room. */
export const HOP_LIFT = 7;
export const HOP_LIFT_LEFT = 4.2;

/** The share of a hop spent in the air; the rest is the landing, a squash and its recovery. */
const HOP_FLIGHT = 0.8;

/** A small seeded generator (mulberry32): the same trip always hops the same way, another trip another way. */
function seeded(seed: number) {
  let a = Math.round(seed) | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * How one hop is taken: a plain arc, a full turn in the air, a lean into the jump, two quick skips
 * or a pop (it swells at the top of its arc). Every kind leaves the line a little.
 */
export type HopKind = "hop" | "flip" | "lean" | "skip" | "pop";
export interface HopStep {
  kind: HopKind;
  /** Which side of the line the arc is on: 1 right, -1 left (the left has less room, so less lift). */
  side: 1 | -1;
  /** The arc's height as a share of the usual one. */
  height: number;
}
const HOP_KINDS: readonly HopKind[] = ["hop", "flip", "lean", "skip", "pop"];
const PLAIN_HOP: HopStep = { kind: "hop", side: 1, height: 1 };

/** A trip's hops, picked from `seed`: never the same kind twice running, about one in three to the left. */
export function hopPlan(seed: number, hops: number): HopStep[] {
  const next = seeded(seed);
  const plan: HopStep[] = [];
  for (let i = 0; i < hops; i++) {
    const kinds = HOP_KINDS.filter((kind) => kind !== plan[i - 1]?.kind);
    plan.push({
      kind: kinds[Math.floor(next() * kinds.length)],
      side: next() < 0.34 ? -1 : 1,
      height: 0.75 + next() * 0.5,
    });
  }
  return plan;
}

const smooth = (f: number) => f * f * (3 - 2 * f);

/**
 * The mark's pose at `t` (0 to 1) of a trip of `hops` equal hops over `length` px: how far along
 * (0 to 1), how far off the line it has lifted (px, negative to the left), its turn (degrees), its
 * squash, and which hop it is on. In the air it eases off and onto the line on an arc 4 to 7px
 * high; on landing it squashes a little and recovers. `plan` (hopPlan) varies each hop.
 */
export function hopPose(t: number, hops: number, length: number, plan?: readonly HopStep[]) {
  if (t >= 1) return { hop: hops - 1, along: 1, lift: 0, deg: 0, sx: 1, sy: 1 };
  const scaled = Math.max(0, t) * hops;
  const hop = Math.min(hops - 1, Math.floor(scaled));
  const u = scaled - hop;
  const step = plan?.[hop] ?? PLAIN_HOP;
  // 4 to 7px by the hop's length, each hop a little higher or lower, never over the most to its side.
  const height = Math.min(
    step.side < 0 ? HOP_LIFT_LEFT : HOP_LIFT,
    Math.max(4, Math.min(HOP_LIFT, (length / hops) * 0.2)) * step.height * (step.side < 0 ? 0.6 : 1),
  );
  if (u < HOP_FLIGHT) {
    const f = u / HOP_FLIGHT;
    const eased = smooth(f);
    const arc = step.kind === "skip" ? 0.8 * Math.abs(Math.sin(2 * Math.PI * f)) : 4 * f * (1 - f);
    const deg = step.kind === "flip" ? 360 * eased * step.side : step.kind === "lean" ? 16 * Math.sin(2 * Math.PI * f) : 0;
    // A pop swells at the top of its arc.
    const swell = step.kind === "pop" ? 0.18 * arc : 0;
    return {
      hop,
      // Half even, half eased: it leaves and meets the line gently without stalling there.
      along: (hop + 0.5 * f + 0.5 * eased) / hops,
      lift: step.side * height * arc,
      deg,
      sx: 1 - 0.04 * arc + swell,
      sy: 1 + 0.05 * arc + swell,
    };
  }
  const squash = Math.sin((Math.PI * (u - HOP_FLIGHT)) / (1 - HOP_FLIGHT));
  return { hop, along: (hop + 1) / hops, lift: 0, deg: 0, sx: 1 + 0.1 * squash, sy: 1 - 0.12 * squash };
}

/**
 * How the mark changes its dot's cell and colour on a trip between sections: "none" (as its last
 * hop lifts), or "portal": it stops before the last hop, a ring opens, the mark turns into it and
 * comes back out changed.
 */
export type DocsMarkerMorph = "none" | "portal";

/** How long the portal takes, in ms. */
export const MORPH_MS = 560;

/**
 * The mark's pose at `m` (0 to 1) of its change in the portal: its scale about its centre, its
 * turn, how far the ring is open (0 to 1) and whether it has changed yet (half-way, while it is
 * out of sight).
 */
export function morphPose(m: number) {
  const ring = m < 0.25 ? smooth(m / 0.25) : m > 0.78 ? 1 - smooth((m - 0.78) / 0.22) : 1;
  const scale =
    m < 0.2
      ? 1
      : m < 0.45
        ? 1 - smooth((m - 0.2) / 0.25)
        : m < 0.55
          ? 0
          : m < 0.8
            ? 1.1 * smooth((m - 0.55) / 0.25)
            : 1.1 - 0.1 * smooth((m - 0.8) / 0.2);
  return { scale, deg: 360 * smooth(Math.min(1, Math.max(0, (m - 0.2) / 0.6))), ring, swapped: m >= 0.5 };
}

/**
 * The marker's transform: the plane turned along its path; the mark turned, and squashed onto its
 * bottom edge (a landing) or scaled about its centre (`centred`, a change between sections).
 */
export function markerTransform(x: number, y: number, deg: number, sx = 1, sy = 1, centred = false) {
  if (sx === 1 && sy === 1) return `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${deg.toFixed(1)})`;
  const at = `translate(${x.toFixed(2)} ${(y + (centred ? 0 : (1 - sy) * MARK_FOOT)).toFixed(2)})`;
  return `${at}${deg ? ` rotate(${deg.toFixed(1)})` : ""} scale(${sx.toFixed(3)} ${sy.toFixed(3)})`;
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
    // The path's two columns: the headings' and, when it steps right for sub-headings, theirs.
    near: 0,
    far: 0,
    // The mark's hop: how far off the path it is, its turn and its squash.
    lift: 0,
    deg: 0,
    sx: 1,
    sy: 1,
  });
  const index = items.findIndex((item) => item.id === current);

  const draw = useCallback(() => {
    const s = state.current;
    if (s.at === null || !glyph.current || !done.current) return;
    const p = s.line.at(s.at);
    // The plane points along the path; the mark stays upright but for a hop's own turn.
    const deg = shape === "mark" ? s.deg : (p.angle * 180) / Math.PI + (s.dir < 0 ? 180 : 0);
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
    s.near = Math.min(...pts.map((pt) => pt.x));
    s.far = Math.max(...pts.map((pt) => pt.x));
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
      s.deg = 0;
      s.sx = s.sy = 1;
      draw();
    };
    if (s.at === null || prefersReducedMotion()) return rest();
    const from = s.at;
    const delta = target - from;
    if (Math.abs(delta) < 0.5) return rest();
    s.dir = delta > 0 ? 1 : -1;
    const duration = shape === "mark" ? hopDuration(Math.abs(delta), 700) : Math.min(950, 320 + Math.abs(delta) * 1.6);
    const hops = hopCount(Math.abs(delta), duration);
    // Each heading-to-heading trip hops its own way, a fresh pick every time.
    const plan = hopPlan(Math.random() * 1e9, hops);
    // A hop cut short by the next heading: what was left of its lift eases out under the new hop.
    const carried = s.lift;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      // Aim at the stop as it is now: the rail can re-lay out mid-trip (the current link turns
      // bold and wraps, fonts arrive), and a target read once would land on the old position.
      const to = s.stops[index] ?? target;
      if (shape === "mark") {
        const pose = hopPose(t, hops, Math.abs(delta), plan);
        s.at = from + (to - from) * pose.along;
        // Where the path has stepped right for a sub-heading, an arc to the right would add to the
        // step: there it leans back toward the headings' column instead (as far as an arc to the
        // left goes), turning over as the mark crosses the step. With what an interrupted hop
        // carried in, it is still never further from the path than one arc.
        const across = s.far > s.near ? (s.line.at(s.at).x - s.near) / (s.far - s.near) : 0;
        const lean = pose.lift > 0 ? pose.lift * (1 - (1 + HOP_LIFT_LEFT / HOP_LIFT) * across) : pose.lift;
        const most = HOP_LIFT * Math.max(0, 1 - across / (HOP_LIFT / (HOP_LIFT + HOP_LIFT_LEFT)));
        s.lift = Math.max(-HOP_LIFT_LEFT, Math.min(most, lean + carried * Math.max(0, 1 - (now - t0) / 120)));
        s.deg = pose.deg;
        s.sx = pose.sx;
        s.sy = pose.sy;
      } else s.at = from + (to - from) * easeInOut(t);
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
  // Between two links on the same line (two pages, or two sub-pages of one tree): straight along it.
  if (Math.abs(dy) < 1 || (from.x === to.x && Math.abs(dy) <= 120)) return [from, to];
  // The step between the page column and a tree line is gentle, so it is no leap of its own.
  const step = Math.min(28, Math.abs(dy) / 2);
  const pts: Point[] = [from];
  if (from.x !== NAV_DOCK_X) pts.push({ x: NAV_DOCK_X, y: from.y + dir * step });
  if (to.x !== NAV_DOCK_X) pts.push({ x: NAV_DOCK_X, y: to.y - dir * step });
  else pts.push({ x: NAV_DOCK_X, y: to.y });
  if (to.x !== NAV_DOCK_X) pts.push(to);
  return pts;
}

/** How far inside its scroll box's edge a clipped trip starts, in px: the whole marker shows, with a little air. */
export const NAV_TRIP_INSET = 16;

/**
 * The part of `route` a reader can see: when the route starts above `top` or below `bottom` (the
 * sidebar's visible box, in the route's own coordinates) it is cut where it enters the box, so the
 * marker arrives from the box's edge on its first frame and the trip's length is the distance
 * seen. A route that starts in the box, or never enters it, is returned as it is.
 */
export function visibleRoute(route: Point[], top: number, bottom: number): Point[] {
  const first = route[0];
  if (route.length < 2 || !(top < bottom)) return route;
  const edge = first.y < top ? top : first.y > bottom ? bottom : null;
  if (edge === null) return route;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1];
    const b = route[i];
    if (a.y === b.y || (a.y - edge) * (b.y - edge) > 0) continue;
    const t = (edge - a.y) / (b.y - a.y);
    const rest = route.slice(t >= 1 ? i + 1 : i);
    return rest.length ? [{ x: a.x + (b.x - a.x) * t, y: edge }, ...rest] : route;
  }
  return route;
}

/** How long a sidebar trip along `route` takes, in ms: the plane's flight, or the mark's hops and its change between sections. */
export const navTripDuration = (route: Point[], shape: DocsMarkerShape = "plane", morph: DocsMarkerMorph = "none") =>
  shape === "mark"
    ? hopDuration(polyline(route).total) + (morph === "none" ? 0 : MORPH_MS)
    : Math.min(1150, 420 + polyline(route).total * 1.1);

/** When, in ms into a mark's trip along `route`, it changes in its portal (half-way through the stop before its last hop). */
export function navTripChange(route: Point[]) {
  const length = polyline(route).total;
  const duration = hopDuration(length);
  const hops = hopCount(length, duration);
  return (duration * (hops - 1)) / hops + MORPH_MS / 2;
}

/** What a sidebar trip draws each frame: the marker's pose, its trail, and the portal's ring (0 to 1 open). */
export type NavDraw = (
  x: number,
  y: number,
  deg: number,
  trail: string,
  sx?: number,
  sy?: number,
  centred?: boolean,
  ring?: number,
) => void;

/**
 * Plays one sidebar trip. The plane flies the route, a short dotted trail behind it, then turns to
 * face the link it docks beside. The mark hops it (`hopCount` small hops, each its own way:
 * `hopPlan`), the same trail on the route beneath it. `onLastHop` fires when the mark should change
 * to the new page's: as its final hop leaves the ground, or, with a `morph`, halfway through a stop
 * it makes before that hop. `onFrame(y)` fires as it passes each y. Returns a cancel function.
 */
export function flyNavMarker(
  route: Point[],
  shape: DocsMarkerShape,
  draw: NavDraw,
  onDone: () => void,
  onFrame?: (y: number) => void,
  onLastHop?: () => void,
  morph: DocsMarkerMorph = "none",
) {
  const line = polyline(route);
  const stop = shape === "mark" && morph !== "none" ? MORPH_MS : 0;
  const duration = navTripDuration(route, shape);
  const hops = hopCount(line.total, duration);
  // Each trip hops its own way, a fresh pick every time.
  const plan = hopPlan(Math.random() * 1e9, hops);
  // The stop comes before the last hop.
  const stopAt = (duration * (hops - 1)) / hops;
  const t0 = performance.now();
  let frame = 0;
  let last = false;
  const change = () => {
    if (last) return;
    last = true;
    onLastHop?.();
  };
  const step = (now: number) => {
    const elapsed = now - t0;
    let t = Math.min(1, elapsed / duration);
    if (shape === "mark") {
      if (stop && elapsed >= stopAt) {
        if (elapsed < stopAt + stop) {
          const pose = morphPose((elapsed - stopAt) / stop);
          if (pose.swapped) change();
          const l = (line.total * (hops - 1)) / hops;
          const p = line.at(l);
          draw(p.x, p.y, pose.deg, line.slice(l - 40, l), pose.scale, pose.scale, true, pose.ring);
          frame = requestAnimationFrame(step);
          return;
        }
        t = Math.min(1, (elapsed - stop) / duration);
      }
      const pose = hopPose(t, hops, line.total, plan);
      const l = line.total * pose.along;
      const p = line.at(l);
      if (pose.hop === hops - 1) change();
      // The trail stays on the route, under the arcs: the ground the mark has just covered.
      draw(p.x + pose.lift, p.y, pose.deg, line.slice(l - 40, l), pose.sx, pose.sy);
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
  // Drawn where it sets off before its first frame, so the marker is never shown anywhere else.
  const p0 = line.at(0);
  draw(p0.x, p0.y, shape === "mark" ? 0 : (p0.angle * 180) / Math.PI, "");
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

/** Whether the marker setting is one of the two shapes. */
export const isMarkerShape = (value: unknown): value is DocsMarkerShape => value === "plane" || value === "mark";
