import { useChartSize } from "../hooks";
import { CX_TYPE, linearScale, niceTicks, spreadLabels, textWidth } from "../scale";
import { type Format, defaultFormat, type ChartSize, fill, Frame, Text } from "./shared";
import { Annotation, type ChartCallout } from "./Annotation";

export interface LineSeries {
  name: string;
  values: readonly (number | null)[];
  /** Draws this series in the accent and the others in grey. */
  highlight?: boolean;
}

export interface LineChartProps extends ChartSize {
  /** Category labels along x (periods). */
  x: readonly string[];
  /** One to four series. */
  series: readonly LineSeries[];
  format?: Format;
  /** Tick format; defaults to `format`. */
  tickFormat?: Format;
  domain?: [number, number];
  /** A reference line, such as the index base or a target. */
  reference?: { value: number; label: string };
  /** One annotated point: series (name or index), the x index, and where the text goes. */
  annotate?: ChartCallout & { series: string | number; index: number };
  alt?: string;
}

/** One to four lines over periods, with end labels, a reference line and one annotated point. */
export function LineChart({
  x: periods,
  series,
  format = defaultFormat,
  tickFormat,
  domain,
  reference,
  annotate,
  alt,
  width,
  height,
}: LineChartProps) {
  const size = useChartSize({ width, height });
  const W = size.width;
  const H = size.height;
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const nice = niceTicks(Math.min(...all, reference?.value ?? Infinity), Math.max(...all, reference?.value ?? -Infinity), 4);
  const dom = domain ?? nice.domain;
  const ticks = domain ? niceTicks(domain[0], domain[1], 4).ticks.filter((t) => t >= domain[0] && t <= domain[1]) : nice.ticks;
  const tf = tickFormat ?? format;
  const emphasis = series.some((s) => s.highlight);
  const stroke = (s: LineSeries, i: number) => (emphasis ? (s.highlight ? fill.accent : fill.context) : fill.series(i));
  const lastOf = (s: LineSeries) => {
    for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] !== null) return i;
    return -1;
  };
  const endText = series.map((s) => {
    const li = lastOf(s);
    return { name: s.name, value: li >= 0 ? format(s.values[li] as number) : "" };
  });
  const endW = Math.max(...endText.map((e) => textWidth(`${e.name} ${e.value}`, CX_TYPE.label, 600))) + 30;
  const tickW = Math.max(...ticks.map((t) => textWidth(tf(t), CX_TYPE.tick))) + 14;
  const left = tickW;
  const right = W - endW;
  const top = 18;
  const bottom = H - CX_TYPE.tick - 22;
  const xs = (i: number) => (periods.length <= 1 ? left : left + (i / (periods.length - 1)) * (right - left - 16) + 8);
  const ys = linearScale(dom, [bottom, top]);
  const label =
    alt ??
    `Line chart, ${periods[0]} to ${periods[periods.length - 1]}. ${series
      .map((s) => `${s.name}: ${s.values.map((v) => (v === null ? "n/a" : format(v))).join(", ")}`)
      .join("; ")}.`;
  const ends = series.map((s) => {
    const li = lastOf(s);
    return li >= 0 ? { x: xs(li), y: ys(s.values[li] as number) } : null;
  });
  const placed = spreadLabels(ends.map((e) => e?.y ?? 0), CX_TYPE.label * 1.3, top, bottom);
  const everyN = Math.max(1, Math.ceil(Math.max(...periods.map((p) => textWidth(p, CX_TYPE.tick))) / Math.max(1, (right - left) / periods.length - 12)));
  return (
    <Frame size={size} label={label}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="uipack-cx-grid" x1={left} x2={right} y1={ys(t)} y2={ys(t)} />
          <Text x={left - 12} y={ys(t)} size={CX_TYPE.tick} anchor="end" muted className="uipack-cx-tabular">
            {tf(t)}
          </Text>
        </g>
      ))}
      {reference && (
        <g className="uipack-cx-ref-line">
          <line x1={left} x2={right} y1={ys(reference.value)} y2={ys(reference.value)} />
          <Text x={left + 8} y={ys(reference.value) - 16} size={CX_TYPE.tick} muted halo>
            {reference.label}
          </Text>
        </g>
      )}
      {periods.map((p, i) =>
        i % everyN === 0 || i === periods.length - 1 ? (
          <Text key={p} x={xs(i)} y={H - 10} size={CX_TYPE.tick} anchor="middle" muted baseline="auto">
            {p}
          </Text>
        ) : null,
      )}
      {series.map((s, si) => {
        const pts = s.values.map((v, i) => (v === null ? null : [xs(i), ys(v)] as const));
        let d = "";
        let pen = false;
        for (const p of pts) {
          if (!p) {
            pen = false;
            continue;
          }
          d += `${pen ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
          pen = true;
        }
        const e = ends[si];
        const ly = placed[si];
        const nudged = e && Math.abs(ly - e.y) > 4;
        return (
          <g key={s.name} data-highlight={s.highlight ? "" : undefined}>
            <path className="uipack-cx-line uipack-cx-draw" pathLength={1} d={d} style={{ stroke: stroke(s, si) }}>
              <title>{`${s.name}: ${s.values.map((v, i) => `${periods[i]} ${v === null ? "n/a" : format(v)}`).join(", ")}`}</title>
            </path>
            {e && (
              <>
                <circle className="uipack-cx-dot" cx={e.x} cy={e.y} r={6} style={{ fill: stroke(s, si) }} />
                {nudged && <line className="uipack-cx-leader" x1={e.x + 9} y1={e.y} x2={e.x + 20} y2={ly} />}
                <text
                  x={e.x + 22}
                  y={ly}
                  fontSize={CX_TYPE.label}
                  dominantBaseline="central"
                  className={["uipack-cx-t", s.highlight || !emphasis ? "uipack-cx-t--strong" : "uipack-cx-t--muted"].join(" ")}
                >
                  {s.name} <tspan className="uipack-cx-t--strong">{endText[si].value}</tspan>
                </text>
              </>
            )}
          </g>
        );
      })}
      {annotate &&
        (() => {
          const si = typeof annotate.series === "number" ? annotate.series : series.findIndex((s) => s.name === annotate.series);
          const v = series[si]?.values[annotate.index];
          if (v === null || v === undefined) return null;
          const px = xs(annotate.index);
          const py = ys(v);
          return <Annotation x={px} y={py} tx={px + annotate.dx} ty={py + annotate.dy} text={annotate.text} width={annotate.width} align={annotate.align} />;
        })()}
    </Frame>
  );
}
