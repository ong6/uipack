// The small numeric helpers every entry shares: clamping, interpolation and easing curves. Pure,
// no DOM. Internal: entries import from here; the root entry re-exports smoothstep and
// easeInOutCubic (through zoom-math.ts) and uipack/web re-exports easeOutExpo.

/** `value` held within [low, high] (0..1 by default). */
export const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));

/** Where `value` falls between `start` and `end`, as 0..1, clamped: 0 before start, 1 after end. */
export const progress = (value: number, start: number, end: number) => clamp((value - start) / (end - start));

/** The point `t` of the way from `a` to `b` (not clamped). */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Hermite step from 0 at `edge0` to 1 at `edge1`: zero slope at both ends. */
export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = progress(x, edge0, edge1);
  return t * t * (3 - 2 * t);
};

/** Perlin's smootherstep over 0..1: zero slope and zero curvature at both ends, so a move settles. */
export const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** Cubic ease-out over 0..1: fast start, soft landing. */
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Cubic ease-in-out over 0..1. */
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Exponential ease-out over 0..1, exact at both ends: fast start, long soft landing. */
export function easeOutExpo(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(2, -10 * t);
}
