import { useEffect, useState } from "react";
import { useFigureMotion } from "./context";
import { pathFromPoints, pointAlong, type Point } from "./geometry";
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
  /** Where the static token sits under reduced motion, 0..1. */
  at?: number;
  r?: number;
  /** Ride the path backwards (a response). */
  reverse?: boolean;
  radius?: number;
  id?: string;
}

/**
 * A token moving along a polyline with SMIL `animateMotion`. Under
 * prefers-reduced-motion it renders once at `at` and never moves. Pause and
 * Replay come from the enclosing Figure, which drives the SVG timeline
 * (pauseAnimations, setCurrentTime), so offsets survive a replay.
 */
export function Packet({ points, kind = "request", shape, dur = 3, delay = 0, at = 0.5, r = 5, reverse, radius = 6, id }: PacketProps) {
  const { reduced } = useFigureMotion();
  const pts = reverse ? [...points].reverse() : points;
  const d = pathFromPoints(pts, radius);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (reduced || !mounted) {
    const [cx, cy] = pointAlong(pts, at);
    return (
      <g id={id} data-uipack="packet" data-static="true">
        <Token kind={kind} shape={shape} r={r} cx={cx} cy={cy} />
      </g>
    );
  }
  return (
    <g id={id} data-uipack="packet">
      <Token kind={kind} shape={shape} r={r} />
      <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" path={d} calcMode="linear" />
    </g>
  );
}
