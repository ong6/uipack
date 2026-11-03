import { useHydrated } from "./env";
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
  /**
   * Pop out at the start of each trip and shrink away at the end, as if the
   * token leaves one box and is drawn into the next. Default true; false
   * keeps a constant size.
   */
  emerge?: boolean;
  id?: string;
}

/** Seconds of the pop at the start of a trip and of the shrink at its end. */
export const PACKET_POP = 0.28;
export const PACKET_SINK = 0.32;

/**
 * The scale keyframes of one trip, as SMIL attributes: 0 to a slight
 * overshoot and back to 1 (ease out), a hold, then an accelerating shrink to
 * 0. The pop and the shrink last the same seconds whatever the trip's length,
 * capped at a fifth of the trip each so a short hop still travels.
 */
export function packetScaleKeys(dur: number) {
  const pop = Math.min(PACKET_POP / dur, 0.2);
  const sink = Math.min(PACKET_SINK / dur, 0.2);
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return {
    values: "0;1.2;1;1;0",
    keyTimes: `0;${r(pop * 0.6)};${r(pop)};${r(1 - sink)};1`,
    keySplines: "0.2 0.9 0.3 1;0.4 0 0.6 1;0 0 1 1;0.6 0 0.9 0.4",
  };
}

/**
 * A token moving along a polyline with SMIL `animateMotion`. It pops out as
 * it leaves and shrinks away as it arrives (`emerge`), on the same clock as
 * the motion. Under
 * prefers-reduced-motion it renders once at `at` and never moves. Pause and
 * Replay come from the enclosing Figure, which drives the SVG timeline
 * (pauseAnimations, setCurrentTime), so offsets survive a replay.
 */
export function Packet({
  points,
  kind = "request",
  shape,
  dur = 3,
  delay = 0,
  at,
  r = 5,
  reverse,
  radius = 6,
  flow,
  trim: t,
  emerge = true,
  id,
}: PacketProps) {
  const { reduced, prerender } = useFigureMotion();
  const hover = useFigureHover();
  const [ts, te] = t ?? [r + 2, 12];
  const trimmed = trim(points, ts, te);
  const pts = reverse ? [...trimmed].reverse() : trimmed;
  const staticAt = at ?? (((0.5 + delay / dur) % 1) + 1) % 1;
  const d = pathFromPoints(pts, radius);
  const mounted = useHydrated();
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
      {emerge ? (
        <g>
          <Token kind={kind} shape={shape} r={r} />
          <animateTransform
            attributeName="transform"
            type="scale"
            dur={`${dur}s`}
            begin={`${delay}s`}
            repeatCount="indefinite"
            calcMode="spline"
            {...packetScaleKeys(dur)}
          />
        </g>
      ) : (
        <Token kind={kind} shape={shape} r={r} />
      )}
      <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" path={d} calcMode="linear" />
    </g>
  );
}
