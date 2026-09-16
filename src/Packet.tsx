import { useEffect, useState } from "react";
import { useFigureMotion } from "./context";
import { useFigureHover, hoverAttrs, type Flow } from "./hover";
import { pathFromPoints, pointAlong, trim, type Point } from "./geometry";
import { Token, type TokenKind, type TokenShape } from "./tokens";

export interface PacketProps {
  /** Same points as the Connector it rides. */
  points: Point[];
  kind?: TokenKind;
  shape?: TokenShape;
  /** Seconds for one trip. */
  dur?: number;
  /** Seconds before the first trip; negative starts mid-path. */
  delay?: number;
  /**
   * Where the static token sits under reduced motion or before mount, 0..1
   * along the trip. Default spreads packets that share a path by their
   * `delay`: `(0.5 + delay / dur) mod 1`.
   */
  at?: number;
  r?: number;
  /** Ride the path backwards (a response). */
  reverse?: boolean;
  radius?: number;
  /** Flow names for hover highlighting. */
  flow?: Flow;
  /**
   * Units the trip stops short of the connector's source end and its
   * arrowhead end (in the connector's own direction, whatever `reverse`
   * says), so the token never sits on a node border or an arrowhead.
   * Default `r + 2` and 12.
   */
  trim?: [number, number];
  id?: string;
}

/**
 * A token moving along a polyline with SMIL `animateMotion`. Under
 * prefers-reduced-motion it renders once at `at` and never moves. Pause and
 * Replay come from the enclosing Figure, which drives the SVG timeline
 * (pauseAnimations, setCurrentTime), so offsets survive a replay.
 */
export function Packet({ points, kind = "request", shape, dur = 3, delay = 0, at, r = 5, reverse, radius = 6, flow, trim: t, id }: PacketProps) {
  const { reduced, prerender } = useFigureMotion();
  const hover = useFigureHover();
  const [ts, te] = t ?? [r + 2, 12];
  const trimmed = trim(points, ts, te);
  const pts = reverse ? [...trimmed].reverse() : trimmed;
  const staticAt = at ?? (((0.5 + delay / dur) % 1) + 1) % 1;
  const d = pathFromPoints(pts, radius);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const attrs = hoverAttrs(flow, kind === "neutral" ? undefined : kind, hover);

  // `prerender` comes through context in one bundle. A consumer that loads
  // `uipack` and `uipack/static` as separate CJS files gets two context objects,
  // so renderStatic also raises a process-wide flag for the duration of the render.
  const pre = prerender || (globalThis as { __UIPACK_PRERENDER__?: boolean }).__UIPACK_PRERENDER__ === true;
  if (reduced || (!mounted && !pre)) {
    const [cx, cy] = pointAlong(pts, staticAt);
    return (
      <g id={id} data-uipack="packet" data-static="true" {...attrs}>
        <Token kind={kind} shape={shape} r={r} cx={cx} cy={cy} />
      </g>
    );
  }
  return (
    <g id={id} data-uipack="packet" {...attrs}>
      <Token kind={kind} shape={shape} r={r} />
      <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" path={d} calcMode="linear" />
    </g>
  );
}
