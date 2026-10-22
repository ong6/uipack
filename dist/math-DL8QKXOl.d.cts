/** Hermite step from 0 at `edge0` to 1 at `edge1`: zero slope at both ends. */
declare const smoothstep: (edge0: number, edge1: number, x: number) => number;
/** Cubic ease-in-out over 0..1. */
declare const easeInOutCubic: (t: number) => number;
/** Exponential ease-out over 0..1, exact at both ends: fast start, long soft landing. */
declare function easeOutExpo(t: number): number;

export { easeOutExpo as a, easeInOutCubic as e, smoothstep as s };
