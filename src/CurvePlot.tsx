import { useFontFloor } from "./scale";

// One annotated curve, in the Technical chart treatment: two arrowed axes with
// tracked mono titles and end labels, a single ink curve, pinned callouts, one accent ring for the point the figure is about, and a bracket that
// measures the gap between the curve and the axis. Callouts are pins: a solid
// stem and a tracked mono label, the accent point an accent ring. No grid, no
// ticks: the shape and the callouts carry the reading.

export type CurvePoint = [number, number];

export interface CurveNote {
  /** Where on the curve, 0..1 along the x axis. */
  at: number;
  label: string;
  /** Height of the pin's stem above the point. Default 24. */
  dy?: number;
  /** Negative puts the label left of the stem (it also flips by itself at the plot's right edge). */
  dx?: number;
  /** The figure's one highlighted point: an accent dot and accent text. */
  accent?: boolean;
}

export interface CurveMeasure {
  /** Where, 0..1 along the x axis. */
  at: number;
  label: string;
}

export interface CurvePlotProps {
  /** Plot box: the axes' origin is its bottom-left corner. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Data in 0..1 on both axes, x increasing. Drawn as a smooth curve through every point. */
  points: CurvePoint[];
  xTitle?: string;
  yTitle?: string;
  /** Labels under the two ends of the x axis, e.g. ["None", "All"]. */
  xEnds?: [string, string];
  notes?: CurveNote[];
  measure?: CurveMeasure;
  size?: number;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Monotone cubic (Fritsch–Carlson) through the points as cubic Bézier
 * segments: it never overshoots a plateau or dips past a level stretch, so a
 * flat run stays flat.
 */
export function curveSegments(pts: CurvePoint[]): [CurvePoint, CurvePoint, CurvePoint, CurvePoint][] {
  const n = pts.length;
  const d = pts.slice(0, -1).map((p, i) => (pts[i + 1][1] - p[1]) / (pts[i + 1][0] - p[0] || 1));
  const m = pts.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return pts.slice(0, -1).map((p, i) => {
    const q = pts[i + 1];
    const h = (q[0] - p[0]) / 3;
    return [p, [p[0] + h, p[1] + m[i] * h], [q[0] - h, q[1] - m[i + 1] * h], q];
  });
}

const cubic = (a: number, b: number, c: number, d: number, t: number) =>
  (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d;

/** The curve's y (0..1) at x (0..1). The control points sit at thirds, so x is linear in t. */
export function curveAt(pts: CurvePoint[], x: number): number {
  const segs = curveSegments(pts);
  const seg = segs.find((s) => x <= s[3][0]) ?? segs[segs.length - 1];
  const t = Math.min(1, Math.max(0, (x - seg[0][0]) / (seg[3][0] - seg[0][0] || 1)));
  return cubic(seg[0][1], seg[1][1], seg[2][1], seg[3][1], t);
}

/**
 * A callout as a pin: a solid stem up from the point, a short foot, and a
 * tracked mono label on a page-coloured underlay (as Label draws). It flips to
 * the left when the label would cross `right`.
 */
function Pin({
  x,
  y,
  rise,
  label,
  accent,
  back,
  right,
  size,
}: {
  x: number;
  y: number;
  rise: number;
  label: string;
  accent?: boolean;
  back?: boolean;
  right: number;
  size: number;
}) {
  const ink = accent ? "var(--uipack-accent)" : "currentColor";
  const text = label.toUpperCase();
  const tw = text.length * size * 0.62 + text.length * size * 0.08;
  const left = back || x + 10 + tw > right;
  const ty = y - rise;
  const tx = left ? x - 10 : x + 10;
  return (
    <g>
      <path
        d={`M${x},${y} V${ty} H${left ? x - 6 : x + 6}`}
        fill="none"
        stroke={ink}
        strokeOpacity={accent ? 1 : 0.6}
        strokeWidth={1}
      />
      <rect x={left ? tx - tw - 4 : tx - 4} y={ty - size * 0.7} width={tw + 8} height={size * 1.4} fill="var(--uipack-bg)" />
      <text
        x={tx}
        y={ty + size * 0.36}
        textAnchor={left ? "end" : "start"}
        fontSize={size}
        fontFamily="var(--uipack-mono)"
        letterSpacing=".08em"
        fontWeight={600}
        fill={ink}
      >
        {text}
      </text>
    </g>
  );
}

export function CurvePlot({ x, y, w, h, points, xTitle, yTitle, xEnds, notes = [], measure, size: size0 = 14 }: CurvePlotProps) {
  const small = useFontFloor(size0 - 2);
  const bottom = y + h;
  const px = (u: number) => r1(x + u * w);
  const py = (v: number) => r1(bottom - v * h);
  const segs = curveSegments(points);
  const d =
    `M${px(points[0][0])},${py(points[0][1])} ` +
    segs.map(([, c1, c2, p]) => `C${px(c1[0])},${py(c1[1])} ${px(c2[0])},${py(c2[1])} ${px(p[0])},${py(p[1])}`).join(" ");
  const head = 6;
  const tracked = { fontFamily: "var(--uipack-mono)", letterSpacing: ".1em", fontWeight: 400 } as const;
  return (
    <g data-uipack="curve-plot">
      {/* Axes: from the origin up and to the right, each ending in an open arrowhead. */}
      <path
        d={`M${x},${y - 12} V${bottom} H${x + w + 12} M${x - head / 1.4},${y - 12 + head} L${x},${y - 12} L${x + head / 1.4},${y - 12 + head} M${x + w + 12 - head},${bottom - head / 1.4} L${x + w + 12},${bottom} L${x + w + 12 - head},${bottom + head / 1.4}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {yTitle ? (
        <text
          transform={`translate(${x - 18}, ${y + h / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={small}
          fill="currentColor"
          {...tracked}
        >
          {yTitle.toUpperCase()}
        </text>
      ) : null}
      {xTitle ? (
        <text x={x + w / 2} y={bottom + 26} textAnchor="middle" fontSize={small} fill="currentColor" {...tracked}>
          {xTitle.toUpperCase()}
        </text>
      ) : null}
      {xEnds ? (
        <>
          <text x={x} y={bottom + 26} fontSize={small} fill="currentColor" fillOpacity={0.8}>
            {xEnds[0]}
          </text>
          <text x={x + w + 12} y={bottom + 26} textAnchor="end" fontSize={small} fill="currentColor" fillOpacity={0.8}>
            {xEnds[1]}
          </text>
        </>
      ) : null}
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      {measure
        ? (() => {
            const mx = px(measure.at);
            const top = py(curveAt(points, measure.at)) + 3;
            const end = bottom - 1;
            const cap = 5;
            return (
              <g data-uipack="curve-measure">
                <path
                  d={`M${mx},${top} V${end} M${mx - cap},${top} H${mx + cap} M${mx - cap},${end} H${mx + cap}`}
                  fill="none"
                  stroke="var(--uipack-accent)"
                  strokeWidth={1.5}
                />
                <Pin x={mx} y={top - 6} rise={22} label={measure.label} accent right={x + w + 12} size={small} />
              </g>
            );
          })()
        : null}
      {notes.map((n) => {
        const cx = px(n.at);
        const cy = py(curveAt(points, n.at));
        return (
          <g key={n.label} data-uipack="curve-note">
            <Pin
              x={cx}
              y={cy - (n.accent ? 9 : 4)}
              rise={Math.abs(n.dy ?? 24)}
              label={n.label}
              accent={n.accent}
              back={(n.dx ?? 1) < 0}
              right={x + w + 12}
              size={small}
            />
            {/* The highlighted point is the Technical accent ring, as on a highlighted path. */}
            {n.accent ? (
              <circle cx={cx} cy={cy} r={5} fill="var(--uipack-bg)" stroke="var(--uipack-accent)" strokeWidth={3} />
            ) : null}
          </g>
        );
      })}
    </g>
  );
}
