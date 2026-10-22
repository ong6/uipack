import type { ReactNode } from "react";
import type { LegendItem } from "../Legend";

/** What a level's `render` receives. */
export interface DrillRenderContext {
  /** Prefix for every SVG id in this drawing (`<Defs id={ctx.id}>`). Unique while mounted, ghosts included. */
  id: string;
  /** Which drawing is being rendered: the wide one, or the authored narrow one below 720px. */
  variant: "wide" | "narrow";
  /** True when the drawing is the faint preview inside a drillable node of the level above. */
  ghost: boolean;
  level: DrillLevel;
}

/** One figure in a drill-down stack. */
export interface DrillLevel {
  /** Stable id; `DrillNode drill="<id>"` opens it and the path is a list of these. */
  id: string;
  /** Short name: the breadcrumb, the drillable node's accessible name, the announcement. */
  label: string;
  /** Heading while the level is open. Defaults to `label`. */
  title?: string;
  caption?: string;
  /** Accessible description of the drawing. */
  alt: string;
  legend?: LegendItem[];
  /** "3 parts inside". Read in the drillable node's name; counted from the drawing when omitted. */
  summary?: string;
  /** This level's viewBox. Defaults to the figure's; a different aspect is fitted (letterboxed). */
  viewBox?: string;
  narrowViewBox?: string;
  /** The wide drawing. */
  render: (ctx: DrillRenderContext) => ReactNode;
  /** Optional narrow drawing shown below 720px. Give every level one, or none. */
  narrow?: (ctx: DrillRenderContext) => ReactNode;
}

export type DrillPath = readonly string[];

export type DrillAction =
  { type: "open"; id: string } | { type: "up" } | { type: "to"; depth: number } | { type: "set"; path: DrillPath };

/**
 * Keep the valid prefix of `path`: it starts at the root, names known levels,
 * and never revisits one. Anything after the first bad entry is dropped.
 */
export function normalizePath(path: DrillPath | undefined, ids: ReadonlySet<string> | readonly string[], root: string): string[] {
  const known = ids instanceof Set ? ids : new Set(ids as readonly string[]);
  const out = [root];
  if (!path?.length) return out;
  const rest = path[0] === root ? path.slice(1) : path;
  for (const id of rest) {
    if (!known.has(id) || out.includes(id)) break;
    out.push(id);
  }
  return out;
}

/** The path stack. Pure: same input, same output; unchanged input returns the same array. */
export function drillReducer(
  path: DrillPath,
  action: DrillAction,
  ids: ReadonlySet<string> | readonly string[],
  root: string = path[0],
): DrillPath {
  switch (action.type) {
    case "open": {
      const known = ids instanceof Set ? ids.has(action.id) : (ids as readonly string[]).includes(action.id);
      if (!known || path.includes(action.id)) return path;
      return [...path, action.id];
    }
    case "up":
      return path.length > 1 ? path.slice(0, -1) : path;
    case "to": {
      const depth = Math.max(0, Math.min(path.length - 1, Math.floor(action.depth)));
      return depth === path.length - 1 ? path : path.slice(0, depth + 1);
    }
    case "set": {
      const next = normalizePath(action.path, ids, root);
      return samePath(next, path) ? path : next;
    }
  }
}

export const samePath = (a: DrillPath, b: DrillPath) => a.length === b.length && a.every((id, i) => id === b[i]);

export type DrillMove = "none" | "in" | "out" | "jump";

/** One level down is "in", one level up is "out"; anything else crossfades. */
export function drillMove(from: DrillPath, to: DrillPath): DrillMove {
  if (samePath(from, to)) return "none";
  if (to.length === from.length + 1 && samePath(from, to.slice(0, -1))) return "in";
  if (from.length === to.length + 1 && samePath(to, from.slice(0, -1))) return "out";
  return "jump";
}

export type DrillFocus = { kind: "heading" } | { kind: "node"; drill: string };

/**
 * Where focus goes once a move settles. Going down lands on the new level's
 * heading. Going up returns to the node in the now-open level that leads back
 * toward where you were, so Enter takes you straight back in.
 */
export function drillFocusTarget(from: DrillPath, to: DrillPath): DrillFocus {
  const upward = to.length < from.length && samePath(to, from.slice(0, to.length));
  return upward ? { kind: "node", drill: from[to.length] } : { kind: "heading" };
}

/** Polite announcement for a move. */
export function drillAnnouncement(from: DrillPath, to: DrillPath, labelOf: (id: string) => string): string {
  const trail = to.map(labelOf).join(" › ");
  const here = labelOf(to[to.length - 1]);
  if (to.length > from.length) return `Opened ${here}. ${trail}`;
  if (to.length < from.length) return `Back to ${here}. ${trail}`;
  return `Showing ${here}. ${trail}`;
}

/** "a:b" → "ab": ids from useId are not valid in url(#…) references. */
export const cleanId = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "");

export const vbSize = (viewBox: string) => {
  const [, , w, h] = viewBox.split(/[\s,]+/).map(Number);
  return { w: w || 0, h: h || 0 };
};

/**
 * Text floor (user units) for a level drawn with `meet` into a stage `stageW`
 * pixels wide whose aspect is `frame`.
 */
export function levelFloor(levelViewBox: string, frame: string, stageW: number, minFont: number): number {
  const l = vbSize(levelViewBox);
  const f = vbSize(frame);
  if (!l.w || !l.h || !f.w || !stageW || !minFont) return 0;
  const stageH = (stageW * f.h) / f.w;
  const scale = Math.min(stageW / l.w, stageH / l.h);
  return minFont / scale;
}

/** Size step for drillable nodes: grow the box about its centre, `grow` units taller. */
export function drillBox<B extends { x: number; y: number; w: number; h: number }>(box: B, grow = DRILL_GROW): B {
  return { ...box, y: box.y - grow / 2, h: box.h + grow };
}

/** Default height step of a drillable node, in user units (56 → 64, +14%). */
export const DRILL_GROW = 8;
