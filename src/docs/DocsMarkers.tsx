import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useIsoLayoutEffect } from "../env";
import type { DocsTocItem } from "./DocsLayout";

/**
 * The location markers of the docs shell: a paper plane or the uipack square mark that travels a
 * dotted path to where the reader is, on "On this page" (to the heading being read) and in the
 * sidebar (to the current page, from the page the reader came from). Geometry and playback live
 * here; DocsLayout places them. Reduced motion: every move is a jump.
 */
export type DocsMarkerShape = "plane" | "mark";

/** The marker's drawing, centred on 0,0; the plane points along +x. Colour: currentColor. */
export function MarkerGlyph({ shape }: { shape: DocsMarkerShape }) {
  if (shape === "mark")
    return (
      <g className="uipack-docs__marker-mark">
        <rect x="-5.5" y="-5.5" width="4.6" height="4.6" />
        <rect x="0.9" y="-5.5" width="4.6" height="4.6" />
        <rect x="-5.5" y="0.9" width="4.6" height="4.6" />
        <circle cx="3.2" cy="3.2" r="2.6" />
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
 * "On this page" with a dotted path: one dot column for h2s, a step right for h3s, the done part
 * of the path in the accent, and the marker gliding to the current heading as the reader scrolls
 * or picks a heading. The list is ordinary links; the drawing is decorative.
 */
export function ContentsRail({
  items,
  current,
  shape,
  onPick,
}: {
  items: DocsTocItem[];
  current: string | null;
  shape: DocsMarkerShape;
  onPick: (id: string, event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const base = useRef<SVGPathElement>(null);
  const done = useRef<SVGPathElement>(null);
  const glyph = useRef<SVGGElement>(null);
  const state = useRef({ line: polyline([]), stops: [] as number[], at: null as number | null, dir: 1, frame: 0 });
  const index = items.findIndex((item) => item.id === current);

  const draw = useCallback(() => {
    const s = state.current;
    if (s.at === null || !glyph.current || !done.current) return;
    const p = s.line.at(s.at);
    const deg = (p.angle * 180) / Math.PI + (s.dir < 0 ? 180 : 0);
    glyph.current.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${deg.toFixed(1)})`);
    done.current.setAttribute("d", s.line.slice(0, s.at));
  }, []);

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

  // Glide to the current heading.
  useEffect(() => {
    const s = state.current;
    const target = s.stops[index];
    if (target === undefined) return;
    cancelAnimationFrame(s.frame);
    if (s.at === null || prefersReducedMotion()) {
      s.at = target;
      draw();
      return;
    }
    const from = s.at;
    const delta = target - from;
    if (Math.abs(delta) < 0.5) {
      s.at = target;
      draw();
      return;
    }
    s.dir = delta > 0 ? 1 : -1;
    const duration = Math.min(950, 320 + Math.abs(delta) * 1.6);
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      // Aim at the stop as it is now: the rail can re-lay out mid-glide (the current link turns
      // bold and wraps, fonts arrive), and a target read once would land on the old position.
      const to = s.stops[index] ?? target;
      s.at = from + (to - from) * easeInOut(t);
      draw();
      if (t < 1) s.frame = requestAnimationFrame(step);
    };
    s.frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(s.frame);
  }, [index, draw]);

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
          <MarkerGlyph shape={shape} />
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

/**
 * Plays one sidebar trip: the marker flies the route, a short dotted trail behind it, then turns
 * to face the link it docks beside. `onPass(y)` fires as it passes each y (the host opens the
 * section it arrives in). Returns a cancel function.
 */
export function flyNavMarker(
  route: Point[],
  shape: DocsMarkerShape,
  draw: (x: number, y: number, deg: number, trail: string) => void,
  onDone: () => void,
  onFrame?: (y: number) => void,
) {
  const line = polyline(route);
  const duration = Math.min(1150, 420 + line.total * 1.1);
  const t0 = performance.now();
  let frame = 0;
  const dir = route.length > 1 && route[route.length - 1].y < route[0].y ? -1 : 1;
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / duration);
    const l = line.total * easeInOut(t);
    const p = line.at(l);
    let deg: number;
    if (shape === "mark") deg = easeInOut(t) * 360 * dir;
    else {
      // Along the path, turning to face the link over the last fifth.
      const along = (p.angle * 180) / Math.PI;
      const turn = Math.max(0, (t - 0.8) / 0.2);
      deg = along * (1 - turn);
    }
    draw(p.x, p.y, deg, line.slice(l - 64, l));
    onFrame?.(p.y);
    if (t < 1) frame = requestAnimationFrame(step);
    else onDone();
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

/** Whether the marker setting is one of the two shapes. */
export const isMarkerShape = (value: unknown): value is DocsMarkerShape => value === "plane" || value === "mark";
