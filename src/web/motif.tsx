import { useId } from "react";

/** Default story data: messages handled over a morning (40 in, 3 left). Rising, so it reads as progress. */
export const DEFAULT_STAR_VALUES = [0, 1, 2, 5, 9, 16, 22, 31, 33, 35, 37, 37];

/** Smooth path through values normalised into a w x h box (y grows downward). */
export function curvePath(values: number[], w: number, h: number, pad = 0): string {
  if (values.length < 2) return `M0 ${h}L${w} ${h}`;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    pad + (1 - (v - min) / span) * (h - pad * 2),
  ]);
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += `C${cx.toFixed(1)} ${y0.toFixed(1)} ${cx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
}

export interface StarChartProps {
  /** Values from your product story; the curve is the star of the show. */
  values?: number[];
  className?: string;
}

/** An abstract gradient that reads as a chart. Decorative: aria-hidden. */
export function StarChart({ values = DEFAULT_STAR_VALUES, className = "" }: StarChartProps) {
  const id = useId().replace(/:/g, "");
  const W = 1200;
  const H = 560;
  const line = curvePath(values, W, H, 72);
  return (
    <svg
      className={`uipack-web-star ${className}`.trim()}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--web-accent)" stopOpacity="0.42" />
          <stop offset="0.55" stopColor="var(--web-accent)" stopOpacity="0.14" />
          <stop offset="1" stopColor="var(--web-accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--web-accent)" stopOpacity="0" />
          <stop offset="0.35" stopColor="var(--web-accent)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--web-accent)" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} className="uipack-web-star__rule" />
      ))}
      <path d={`${line}L${W} ${H}L0 ${H}Z`} fill={`url(#${id}-fill)`} className="uipack-web-star__area" />
      <path d={line} fill="none" stroke={`url(#${id}-line)`} className="uipack-web-star__glow" pathLength={1} />
      <path d={line} fill="none" stroke={`url(#${id}-line)`} className="uipack-web-star__line" pathLength={1} />
    </svg>
  );
}

export interface RhymeIconProps {
  /** Which point on the shared curve to mark, 0..1. Icons rhyme by reusing the star's shape. */
  at?: number;
  values?: number[];
  size?: number;
}

/** A small icon built from the hero's curve, so feature icons visually rhyme with the star. */
export function RhymeIcon({ at = 0.5, values = DEFAULT_STAR_VALUES, size = 40 }: RhymeIconProps) {
  const d = curvePath(values, 28, 20, 2);
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const idx = Math.round(Math.max(0, Math.min(1, at)) * (values.length - 1));
  const cx = 6 + (idx / (values.length - 1)) * 28;
  const cy = 10 + 2 + (1 - (values[idx] - min) / span) * 16;
  return (
    <svg className="uipack-web-rhyme" viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" focusable="false">
      <rect x="0.5" y="0.5" width="39" height="39" rx="10" />
      <path d={d} transform="translate(6 10)" />
      <line x1={cx} x2={cx} y1={cy} y2="32" />
      <circle cx={cx} cy={cy} r="3" />
    </svg>
  );
}

/** Quiet depth: an inline feTurbulence noise layer. No image files, no network. */
export function NoiseLayer({ opacity = 0.08 }: { opacity?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className="uipack-web-noise" aria-hidden="true" focusable="false" style={{ opacity }}>
      <filter id={`${id}-n`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id}-n)`} />
    </svg>
  );
}
