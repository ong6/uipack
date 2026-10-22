// Shared zoom maths: one camera move into a box, used by drill-down figures and
// the deck player's zoom transition (slideZoomFrame/slideZoomSamples in
// uipack/deck). Pure functions, no DOM. Sizes are the pixel size of the surface
// both layers fill.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ZoomFrame {
  /** Scale at which the target fills the surface in its limiting dimension. */
  Z: number;
  /** The fixed point both layers scale about. */
  fx: number;
  fy: number;
}

export const easeInOutCubic = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * A zoom into `target` is a pure scale about one fixed point F, chosen so the
 * target ends centred and as large as the surface allows. The outer layer
 * scales by Z^p and the inner layer by Z^(p-1) about the same point, so the
 * inner layer stays locked inside the target for the whole flight and the zoom
 * feels even (exponential), not accelerating.
 */
export function zoomFrame(target: Rect, width: number, height: number): ZoomFrame | null {
  const Z = Math.min(width / target.w, height / target.h);
  if (!Number.isFinite(Z) || Z < 1.05) return null;
  const cx = target.x + target.w / 2;
  const cy = target.y + target.h / 2;
  return {
    Z,
    fx: (cx * Z - width / 2) / (Z - 1),
    fy: (cy * Z - height / 2) / (Z - 1),
  };
}

/** Where the target lands in the inner layer's own coordinates: the clip the inner layer opens from. */
export function innerClipStart(target: Rect, frame: ZoomFrame, width: number, height: number) {
  const map = (v: number, f: number) => (v - f) * frame.Z + f;
  const left = map(target.x, frame.fx);
  const top = map(target.y, frame.fy);
  const right = width - map(target.x + target.w, frame.fx);
  const bottom = height - map(target.y + target.h, frame.fy);
  return { top, right, bottom, left };
}

/** Map a point through a scale of `s` about (fx, fy). */
export const scaleAbout = (x: number, y: number, s: number, fx: number, fy: number) => ({
  x: (x - fx) * s + fx,
  y: (y - fy) * s + fy,
});

export interface ZoomSample {
  offset: number;
  /** Eased progress 0..1 (forward), the exponent of Z. */
  p: number;
  outer: string;
  inner: string;
  clip: string;
  innerOpacity: number;
}

export interface ZoomSampleOptions {
  samples?: number;
  /** Corner radius of the target box in surface pixels; the clip opens from it. Default 6. */
  radius?: number;
}

/** Sampled keyframes for a zoom. `forward` flies in; backwards plays the same path out. */
export function zoomSamples(
  target: Rect,
  forward: boolean,
  width: number,
  height: number,
  { samples = 24, radius = 6 }: ZoomSampleOptions = {},
): ZoomSample[] | null {
  const frame = zoomFrame(target, width, height);
  if (!frame) return null;
  const start = innerClipStart(target, frame, width, height);
  // In the inner layer's own (unscaled) coordinates the corner is Z times larger.
  const radiusStart = radius * frame.Z;
  const out: ZoomSample[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = easeInOutCubic(forward ? t : 1 - t);
    const clipT = smoothstep(0.15, 0.85, p);
    const inset = (v: number) => (v * (1 - clipT)).toFixed(2);
    out.push({
      offset: t,
      p,
      outer: `scale(${Math.pow(frame.Z, p).toFixed(5)})`,
      inner: `scale(${Math.pow(frame.Z, p - 1).toFixed(5)})`,
      clip: `inset(${inset(start.top)}px ${inset(start.right)}px ${inset(start.bottom)}px ${inset(start.left)}px round ${(radiusStart * (1 - clipT)).toFixed(2)}px)`,
      innerOpacity: smoothstep(0.08, 0.4, p),
    });
  }
  return out;
}
