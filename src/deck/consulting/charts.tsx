import type { CSSProperties, ReactNode } from "react";
import { Morph } from "../parts";
import { useChartSize, useGrown } from "./hooks";
import {
  CX_TYPE,
  bandLayout,
  barPath,
  bubbleRadius,
  formatValue,
  linearScale,
  niceTicks,
  spreadLabels,
  stackSegments,
  textWidth,
  waterfallBars,
  wrapToWidth,
  zeroBasedDomain,
  type WaterfallInput,
} from "./scale";

/* ------------------------------------------------------------------------------------------- */
/* Shared pieces                                                                                */
/* ------------------------------------------------------------------------------------------- */

type Format = (value: number) => string;
const defaultFormat: Format = (v) => formatValue(v, { decimals: Number.isInteger(v) ? 0 : 1 });

/** Fixed size for tests or static use; otherwise a chart fills its panel. */
export interface ChartSize {
  width?: number;
  height?: number;
}

/** Fill colours by job. Series slots are validated for CVD separation in both themes. */
const fill = {
  accent: "var(--uipack-cx-accent)",
  context: "var(--uipack-cx-context)",
  total: "var(--uipack-cx-total)",
  good: "var(--uipack-cx-good)",
  bad: "var(--uipack-cx-bad)",
  series: (i: number) => `var(--uipack-cx-s${(i % 4) + 1})`,
  seriesInk: (i: number) => `var(--uipack-cx-s${(i % 4) + 1}-ink)`,
};

function Frame({
  size,
  label,
  className,
  children,
}: {
  size: ReturnType<typeof useChartSize>;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const grown = useGrown();
  return (
    <div ref={size.ref} className={["uipack-cx-chart", className].filter(Boolean).join(" ")} data-grown={grown ? "" : undefined}>
      <svg
        className="uipack-cx-svg"
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="img"
        aria-label={label}
      >
        {children}
      </svg>
    </div>
  );
}

const growStyle = (origin: string, delay = 0): CSSProperties =>
  ({ transformOrigin: origin, "--uipack-cx-delay": `${delay}ms` }) as CSSProperties;

function Text({
  x,
  y,
  size = CX_TYPE.label,
  anchor = "start",
  weight,
  muted,
  baseline = "central",
  halo,
  children,
  className,
}: {
  x: number;
  y: number;
  size?: number;
  anchor?: "start" | "middle" | "end";
  weight?: 600;
  muted?: boolean;
  baseline?: "central" | "auto" | "hanging";
  /** Paint a surface-coloured outline behind the glyphs, so the text stays legible over lines. */
  halo?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={Math.max(size, CX_TYPE.min)}
      textAnchor={anchor}
      dominantBaseline={baseline}
      className={["uipack-cx-t", muted && "uipack-cx-t--muted", weight && "uipack-cx-t--strong", halo && "uipack-cx-halo", className].filter(Boolean).join(" ")}
    >
      {children}
    </text>
  );
}

/** Multi-line text, centred on (x, y) vertically; lines are tspans. */
function Lines({ x, y, lines, size = CX_TYPE.label, anchor = "middle", weight, muted, top }: {
  x: number;
  y: number;
  lines: string[];
  size?: number;
  anchor?: "start" | "middle" | "end";
  weight?: 600;
  muted?: boolean;
  /** Treat `y` as the top of the first line rather than the block's centre. */
  top?: boolean;
}) {
  const lh = size * 1.2;
  const y0 = top ? y + size * 0.8 : y - ((lines.length - 1) * lh) / 2;
  return (
    <text
      x={x}
      y={y0}
      fontSize={Math.max(size, CX_TYPE.min)}
      textAnchor={anchor}
      dominantBaseline={top ? "auto" : "central"}
      className={["uipack-cx-t", muted && "uipack-cx-t--muted", weight && "uipack-cx-t--strong"].filter(Boolean).join(" ")}
    >
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : lh}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

/* ------------------------------------------------------------------------------------------- */
/* Annotation                                                                                      */
/* ------------------------------------------------------------------------------------------- */

export interface AnnotationGeometry {
  lines: string[];
  box: { x: number; y: number; w: number; h: number };
  /** Leader from the box edge (x1, y1) to the data point (x2, y2). */
  leader: { x1: number; y1: number; x2: number; y2: number };
}

/**
 * Where a callout's text and leader go. The text block's top-left (or top-right with
 * `align: "end"`) sits at (tx, ty); the leader leaves the nearest edge of the block and ends on
 * the data point (x, y).
 */
export function annotationGeometry(
  point: { x: number; y: number },
  at: { x: number; y: number },
  text: string,
  maxWidth = 260,
  align: "start" | "end" = "start",
  size: number = CX_TYPE.callout,
): AnnotationGeometry {
  const lines = wrapToWidth(text, size, maxWidth, 4);
  const w = Math.max(...lines.map((l) => textWidth(l, size)));
  const h = lines.length * size * 1.25;
  const bx = align === "end" ? at.x - w : at.x;
  const box = { x: bx, y: at.y, w, h };
  const gap = 10;
  let x1: number;
  let y1: number;
  if (point.x < box.x - gap) {
    x1 = box.x - gap;
    y1 = Math.min(Math.max(point.y, box.y + size * 0.6), box.y + h - size * 0.6);
  } else if (point.x > box.x + w + gap) {
    x1 = box.x + w + gap;
    y1 = Math.min(Math.max(point.y, box.y + size * 0.6), box.y + h - size * 0.6);
  } else {
    x1 = Math.min(Math.max(point.x, box.x), box.x + w);
    y1 = point.y < box.y ? box.y - gap : box.y + h + gap;
  }
  return { lines, box, leader: { x1, y1, x2: point.x, y2: point.y } };
}

export interface AnnotationProps {
  /** The data point the leader ends on. */
  x: number;
  y: number;
  /** Top-left of the text (top-right with `align="end"`). */
  tx: number;
  ty: number;
  text: string;
  /** Wrap width in canvas pixels. */
  width?: number;
  align?: "start" | "end";
}

/** An annotation inside a chart's SVG: wrapped text, and a leader line that ends on the data point it explains. */
export function Annotation({ x, y, tx, ty, text, width = 260, align = "start" }: AnnotationProps) {
  const g = annotationGeometry({ x, y }, { x: tx, y: ty }, text, width, align);
  const size = CX_TYPE.callout;
  const textX = align === "end" ? g.box.x + g.box.w : g.box.x;
  return (
    <g className="uipack-cx-callout">
      <line className="uipack-cx-callout__leader" x1={g.leader.x1} y1={g.leader.y1} x2={x} y2={y} />
      <circle className="uipack-cx-callout__ring" cx={x} cy={y} r={9} />
      <circle className="uipack-cx-callout__dot" cx={x} cy={y} r={3.5} />
      <text
        x={textX}
        y={g.box.y + size * 0.85}
        fontSize={size}
        textAnchor={align}
        className="uipack-cx-t uipack-cx-callout__text uipack-cx-halo"
      >
        {g.lines.map((l, i) => (
          <tspan key={i} x={textX} dy={i === 0 ? 0 : size * 1.25}>
            {l}
          </tspan>
        ))}
      </text>
    </g>
  );
}

/** Where to annotate a chart: offsets of the text block from the data point. */
export interface ChartCallout {
  text: string;
  /** Text block offset from the point, in canvas px. */
  dx: number;
  dy: number;
  width?: number;
  align?: "start" | "end";
}

/* ------------------------------------------------------------------------------------------- */
/* BarChart                                                                                     */
/* ------------------------------------------------------------------------------------------- */

export interface BarDatum {
  label: string;
  value: number;
  /** Draws this bar in the accent and the rest in context grey. */
  highlight?: boolean;
}

export interface BarChartProps extends ChartSize {
  data: readonly BarDatum[];
  /** `horizontal` ranks with labels on the left; `vertical` columns with labels below. */
  orientation?: "horizontal" | "vertical";
  /** Default: `desc` for horizontal, `none` for vertical. */
  sort?: "desc" | "asc" | "none";
  format?: Format;
  /** Value-axis domain. Default: zero to the largest value. */
  domain?: [number, number];
  /** A reference line, such as an average or a target. */
  reference?: { value: number; label: string };
  /** Annotate one bar (by label). */
  callout?: ChartCallout & { label: string };
  /** Accessible summary. Defaults to the labels and values. */
  ariaLabel?: string;
}

/** Ranked horizontal bars or vertical columns, value at the tip, one optional highlight. */
export function BarChart({
  data,
  orientation = "horizontal",
  sort,
  format = defaultFormat,
  domain,
  reference,
  callout,
  ariaLabel,
  width,
  height,
}: BarChartProps) {
  const size = useChartSize({ width, height });
  const W = size.width;
  const H = size.height;
  const order = sort ?? (orientation === "horizontal" ? "desc" : "none");
  const rows = [...data];
  if (order !== "none") rows.sort((a, b) => (order === "desc" ? b.value - a.value : a.value - b.value));
  const emphasis = rows.some((d) => d.highlight);
  const colour = (d: BarDatum) => (!emphasis || d.highlight ? fill.accent : fill.context);
  const values = rows.map((d) => d.value);
  const dom = domain ?? zeroBasedDomain(reference ? [...values, reference.value] : values);
  const label = ariaLabel ?? `Bar chart. ${rows.map((d) => `${d.label}: ${format(d.value)}`).join("; ")}.`;
  const valueW = Math.max(...rows.map((d) => textWidth(format(d.value), CX_TYPE.value, 600))) + 14;
  const refTop = reference ? 40 : 4;

  if (orientation === "horizontal") {
    const labelW = Math.min(Math.max(...rows.map((d) => textWidth(d.label, CX_TYPE.label))) + 20, W * 0.42);
    const x = linearScale(dom, [labelW, W - valueW]);
    const bands = bandLayout(rows.length, refTop, H - refTop, 0.62, 36);
    const zero = x(Math.max(dom[0], Math.min(0, dom[1])));
    return (
      <Frame size={size} label={label}>
        {reference && (
          <g className="uipack-cx-ref-line">
            <line x1={x(reference.value)} x2={x(reference.value)} y1={refTop - 8} y2={H} />
            <Text x={x(reference.value)} y={14} size={CX_TYPE.tick} anchor="middle" muted halo>
              {reference.label}
            </Text>
          </g>
        )}
        {rows.map((d, i) => {
          const b = bands[i];
          const end = x(d.value);
          const lines = wrapToWidth(d.label, CX_TYPE.label, labelW - 20, 2);
          return (
            <g key={d.label}>
              <Lines x={labelW - 16} y={b.centre} lines={lines} anchor="end" weight={d.highlight ? 600 : undefined} />
              <path
                className="uipack-cx-grow"
                data-axis="x"
                style={{ ...growStyle(d.value >= 0 ? "0% 50%" : "100% 50%", i * 40), fill: colour(d) }}
                d={barPath("horizontal", zero, end, b.markStart, b.mark)}
              >
                <title>{`${d.label}: ${format(d.value)}`}</title>
              </path>
              <Text x={d.value >= 0 ? end + 10 : end - 10} y={b.centre} anchor={d.value >= 0 ? "start" : "end"} weight={600} halo>
                {format(d.value)}
              </Text>
            </g>
          );
        })}
        <line className="uipack-cx-axis" x1={zero} x2={zero} y1={refTop - 4} y2={H} />
        {callout &&
          (() => {
            const i = rows.findIndex((d) => d.label === callout.label);
            if (i < 0) return null;
            const px = x(rows[i].value);
            const py = bands[i].centre;
            return <Annotation x={px} y={py} tx={px + callout.dx} ty={py + callout.dy} text={callout.text} width={callout.width} align={callout.align} />;
          })()}
      </Frame>
    );
  }

  const labelLines = rows.map((d) => d.label);
  const bandsProbe = bandLayout(rows.length, 0, W, 0.56, 64);
  const wrapped = labelLines.map((l) => wrapToWidth(l, CX_TYPE.label, (bandsProbe[0]?.size ?? W) - 8, 2));
  const bottom = Math.max(...wrapped.map((l) => l.length)) * CX_TYPE.label * 1.2 + 14;
  const top = 36;
  const y = linearScale(dom, [H - bottom, top]);
  const zero = y(Math.max(dom[0], Math.min(0, dom[1])));
  return (
    <Frame size={size} label={label}>
      {reference && (
        <g className="uipack-cx-ref-line">
          <line x1={0} x2={W} y1={y(reference.value)} y2={y(reference.value)} />
          <Text x={W} y={y(reference.value) - 16} size={CX_TYPE.tick} anchor="end" muted>
            {reference.label}
          </Text>
        </g>
      )}
      {rows.map((d, i) => {
        const b = bandsProbe[i];
        const end = y(d.value);
        return (
          <g key={d.label}>
            <path
              className="uipack-cx-grow"
              data-axis="y"
              style={{ ...growStyle(d.value >= 0 ? "50% 100%" : "50% 0%", i * 40), fill: colour(d) }}
              d={barPath("vertical", zero, end, b.markStart, b.mark)}
            >
              <title>{`${d.label}: ${format(d.value)}`}</title>
            </path>
            <Text x={b.centre} y={d.value >= 0 ? end - 16 : end + 16} anchor="middle" weight={600} halo>
              {format(d.value)}
            </Text>
            <Lines x={b.centre} y={H - bottom + 12} lines={wrapped[i]} top weight={d.highlight ? 600 : undefined} />
          </g>
        );
      })}
      <line className="uipack-cx-axis" x1={0} x2={W} y1={zero} y2={zero} />
      {callout &&
        (() => {
          const i = rows.findIndex((d) => d.label === callout.label);
          if (i < 0) return null;
          const px = bandsProbe[i].centre;
          const py = y(rows[i].value);
          return <Annotation x={px} y={py} tx={px + callout.dx} ty={py + callout.dy} text={callout.text} width={callout.width} align={callout.align} />;
        })()}
    </Frame>
  );
}

/* ------------------------------------------------------------------------------------------- */
/* Waterfall                                                                                    */
/* ------------------------------------------------------------------------------------------- */

export interface WaterfallProps extends ChartSize {
  /** Start total → deltas → end total. A total without `value` closes at the running level. */
  steps: readonly WaterfallInput[];
  format?: Format;
  /** Which direction is good: `up` for margin or revenue, `down` for cost. Colours follow it; signs and arrows show direction. */
  goodDirection?: "up" | "down";
  /** Value-axis domain. A start above zero truncates the totals, marked with a break. */
  domain?: [number, number];
  callout?: ChartCallout & { label: string };
  ariaLabel?: string;
}

/** A bridge from a start total through signed deltas to an end total. */
export function Waterfall({ steps, format = defaultFormat, goodDirection = "up", domain, callout, ariaLabel, width, height }: WaterfallProps) {
  const size = useChartSize({ width, height });
  const W = size.width;
  const H = size.height;
  const bars = waterfallBars([...steps]);
  const levels = bars.flatMap((b) => [b.from, b.to]);
  const dom = domain ?? zeroBasedDomain(levels);
  const broken = dom[0] > 0;
  const bandsProbe = bandLayout(bars.length, 0, W, 0.62, 76);
  const wrapped = bars.map((b) => wrapToWidth(b.label, CX_TYPE.label, (bandsProbe[0]?.size ?? W) - 6, 2));
  const bottom = Math.max(...wrapped.map((l) => l.length)) * CX_TYPE.label * 1.2 + 14;
  const top = 40;
  const y = linearScale(dom, [H - bottom, top]);
  const base = y(dom[0]);
  const label =
    ariaLabel ??
    `Waterfall. ${bars.map((b) => `${b.label}: ${b.kind === "total" ? format(b.value) : (b.value >= 0 ? "+" : "") + format(b.value)}`).join("; ")}.`;
  const show = (b: (typeof bars)[number]) =>
    b.kind === "total" ? format(b.value) : `${b.value > 0 ? "+" : ""}${format(b.value)}`;
  return (
    <Frame size={size} label={label}>
      {bars.map((b, i) => {
        const band = bandsProbe[i];
        const next = bandsProbe[i + 1];
        const good = b.kind !== "total" && (b.value >= 0) === (goodDirection === "up");
        const colour = b.kind === "total" ? fill.total : good ? fill.good : fill.bad;
        const yTop = y(Math.max(b.from, b.to));
        const yBot = b.kind === "total" ? base : y(Math.min(b.from, b.to));
        const h = Math.max(2, yBot - yTop);
        const labelY = yTop - 18;
        return (
          <g key={`${b.label}-${i}`} data-kind={b.kind}>
            {b.kind === "total" ? (
              <path
                className="uipack-cx-grow"
                data-axis="y"
                style={{ ...growStyle("50% 100%", i * 60), fill: colour }}
                d={barPath("vertical", base, yTop, band.markStart, band.mark)}
              >
                <title>{`${b.label}: ${show(b)}`}</title>
              </path>
            ) : (
              <rect
                className="uipack-cx-grow"
                data-axis="y"
                style={{ ...growStyle(b.kind === "up" ? "50% 100%" : "50% 0%", i * 60), fill: colour }}
                x={band.markStart}
                y={yTop}
                width={band.mark}
                height={h}
                rx={2}
              >
                <title>{`${b.label}: ${show(b)}`}</title>
              </rect>
            )}
            {broken && b.kind === "total" && (
              <path
                className="uipack-cx-break"
                d={`M${band.markStart - 4} ${base - 18}l${band.mark + 8} -10M${band.markStart - 4} ${base - 8}l${band.mark + 8} -10`}
              />
            )}
            {next && (
              <line className="uipack-cx-connector" x1={band.markStart + band.mark} x2={next.markStart} y1={y(b.to)} y2={y(b.to)} />
            )}
            <text
              x={band.centre}
              y={labelY}
              fontSize={CX_TYPE.value}
              textAnchor="middle"
              dominantBaseline="central"
              className="uipack-cx-t uipack-cx-t--strong uipack-cx-halo"
            >
              {b.kind !== "total" && (
                <tspan className="uipack-cx-arrow" aria-hidden="true">
                  {b.value >= 0 ? "▲ " : "▼ "}
                </tspan>
              )}
              {show(b)}
            </text>
            <Lines x={band.centre} y={H - bottom + 12} lines={wrapped[i]} top weight={b.kind === "total" ? 600 : undefined} />
          </g>
        );
      })}
      <line className="uipack-cx-axis" x1={0} x2={W} y1={base} y2={base} />
      {callout &&
        (() => {
          const i = bars.findIndex((b) => b.label === callout.label);
          if (i < 0) return null;
          const b = bars[i];
          const px = bandsProbe[i].centre;
          const py = (y(b.from) + y(b.to)) / 2;
          return <Annotation x={px} y={py} tx={px + callout.dx} ty={py + callout.dy} text={callout.text} width={callout.width} align={callout.align} />;
        })()}
    </Frame>
  );
}

/* ------------------------------------------------------------------------------------------- */
/* StackedBar                                                                                   */
/* ------------------------------------------------------------------------------------------- */

export interface StackedBarProps extends ChartSize {
  /** One entry per bar; `values` follow `series` order. */
  categories: readonly { label: string; values: readonly number[]; highlight?: boolean }[];
  /** Up to four series; fold the rest into "Other". */
  series: readonly string[];
  /** `percent` draws each bar as 100%. */
  mode?: "absolute" | "percent";
  orientation?: "vertical" | "horizontal";
  format?: Format;
  /** Format for values inside segments. Default: `format`. Percent mode shows shares. */
  segmentFormat?: Format;
  /** Show the total above each bar (absolute mode). Default true. */
  totals?: boolean;
  ariaLabel?: string;
}

/** Stacked bars (or 100% bars) with a legend, segment values where they fit and totals on top. */
export function StackedBar({
  categories,
  series,
  mode = "absolute",
  orientation = "vertical",
  format = defaultFormat,
  segmentFormat,
  totals = true,
  ariaLabel,
  width,
  height,
}: StackedBarProps) {
  const size = useChartSize({ width, height });
  const W = size.width;
  const H = size.height;
  const percent = mode === "percent";
  const stacks = categories.map((c) => stackSegments([...c.values], percent));
  const sums = categories.map((c) => c.values.reduce((a, b) => a + Math.max(0, b), 0));
  const max = percent ? 100 : Math.max(...sums, 1);
  const fmtSeg = (s: { value: number; share: number }) => (percent ? `${Math.round(s.share * 100)}%` : (segmentFormat ?? format)(s.value));
  const label =
    ariaLabel ??
    `Stacked bar chart, ${series.join(", ")}. ${categories
      .map((c, i) => `${c.label}: ${stacks[i].map((s, k) => `${series[k]} ${fmtSeg(s)}`).join(", ")}`)
      .join("; ")}.`;

  // Legend: one row of square swatches, the identity channel for every segment.
  const legendH = 36;
  let lx = 0;
  const legend = series.map((name, i) => {
    const item = { name, i, x: lx };
    lx += 18 + 10 + textWidth(name, CX_TYPE.tick) + 28;
    return item;
  });
  const legendEl = (
    <g className="uipack-cx-legend">
      {legend.map((l) => (
        <g key={l.name}>
          <rect x={l.x} y={6} width={18} height={18} rx={2} style={{ fill: fill.series(l.i) }} />
          <Text x={l.x + 28} y={15} size={CX_TYPE.tick}>
            {l.name}
          </Text>
        </g>
      ))}
    </g>
  );
  const segLabel = (s: { value: number; share: number }, k: number, cx: number, cy: number, room: number, thick: number) => {
    const t = fmtSeg(s);
    if (thick < CX_TYPE.value + 8 || textWidth(t, CX_TYPE.value, 600) + 12 > room) return null;
    return (
      <text
        x={cx}
        y={cy}
        fontSize={CX_TYPE.value}
        textAnchor="middle"
        dominantBaseline="central"
        className="uipack-cx-t--strong uipack-cx-seglabel"
        style={{ fill: fill.seriesInk(k) }}
      >
        {t}
      </text>
    );
  };

  if (orientation === "horizontal") {
    const labelW = Math.min(Math.max(...categories.map((c) => textWidth(c.label, CX_TYPE.label))) + 20, W * 0.4);
    const totalW = totals && !percent ? Math.max(...sums.map((s) => textWidth(format(s), CX_TYPE.value, 600))) + 14 : 4;
    const x = linearScale([0, max], [labelW, W - totalW]);
    const bands = bandLayout(categories.length, legendH + 8, H - legendH - 8, 0.62, 44);
    return (
      <Frame size={size} label={label}>
        {legendEl}
        {categories.map((c, i) => {
          const b = bands[i];
          return (
            <g key={c.label}>
              <Lines x={labelW - 16} y={b.centre} lines={wrapToWidth(c.label, CX_TYPE.label, labelW - 20, 2)} anchor="end" weight={c.highlight ? 600 : undefined} />
              <g className="uipack-cx-grow" data-axis="x" style={growStyle("0% 50%", i * 40)}>
              {stacks[i].map((s, k) => {
                const x0 = x(s.from) + (k > 0 ? 1 : 0);
                const x1 = x(s.to) - (k < stacks[i].length - 1 ? 1 : 0);
                if (x1 - x0 <= 0.5) return null;
                return (
                  <g key={k}>
                    <rect
                      style={{ fill: fill.series(k) }}
                      x={x0}
                      y={b.markStart}
                      width={x1 - x0}
                      height={b.mark}
                    >
                      <title>{`${c.label}, ${series[k]}: ${fmtSeg(s)}`}</title>
                    </rect>
                    {segLabel(s, k, (x0 + x1) / 2, b.centre, x1 - x0, b.mark)}
                  </g>
                );
              })}
              </g>
              {totals && !percent && (
                <Text x={x(sums[i]) + 10} y={b.centre} weight={600}>
                  {format(sums[i])}
                </Text>
              )}
            </g>
          );
        })}
        <line className="uipack-cx-axis" x1={labelW} x2={labelW} y1={legendH + 4} y2={H} />
      </Frame>
    );
  }

  const bandsProbe = bandLayout(categories.length, 0, W, 0.56, 88);
  const wrapped = categories.map((c) => wrapToWidth(c.label, CX_TYPE.label, (bandsProbe[0]?.size ?? W) - 8, 2));
  const bottom = Math.max(...wrapped.map((l) => l.length)) * CX_TYPE.label * 1.2 + 14;
  const top = legendH + (totals && !percent ? 40 : 12);
  const y = linearScale([0, max], [H - bottom, top]);
  return (
    <Frame size={size} label={label}>
      {legendEl}
      {categories.map((c, i) => {
        const b = bandsProbe[i];
        return (
          <g key={c.label}>
            <g className="uipack-cx-grow" data-axis="y" style={growStyle("50% 100%", i * 40)}>
            {stacks[i].map((s, k) => {
              const last = k === stacks[i].length - 1;
              const y0 = y(s.from) - (k > 0 ? 1 : 0);
              const y1 = y(s.to) + (last ? 0 : 1);
              if (y0 - y1 <= 0.5) return null;
              return (
                <g key={k}>
                  {last ? (
                    <path
                      style={{ fill: fill.series(k) }}
                      d={barPath("vertical", y0, y1, b.markStart, b.mark)}
                    >
                      <title>{`${c.label}, ${series[k]}: ${fmtSeg(s)}`}</title>
                    </path>
                  ) : (
                    <rect
                      style={{ fill: fill.series(k) }}
                      x={b.markStart}
                      y={y1}
                      width={b.mark}
                      height={y0 - y1}
                    >
                      <title>{`${c.label}, ${series[k]}: ${fmtSeg(s)}`}</title>
                    </rect>
                  )}
                  {segLabel(s, k, b.centre, (y0 + y1) / 2, b.mark, y0 - y1)}
                </g>
              );
            })}
            </g>
            {totals && !percent && (
              <Text x={b.centre} y={y(sums[i]) - 18} anchor="middle" weight={600} halo>
                {format(sums[i])}
              </Text>
            )}
            <Lines x={b.centre} y={H - bottom + 12} lines={wrapped[i]} top weight={c.highlight ? 600 : undefined} />
          </g>
        );
      })}
      <line className="uipack-cx-axis" x1={0} x2={W} y1={H - bottom} y2={H - bottom} />
    </Frame>
  );
}

/* ------------------------------------------------------------------------------------------- */
/* LineChart                                                                                    */
/* ------------------------------------------------------------------------------------------- */

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
  ariaLabel?: string;
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
  ariaLabel,
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
    ariaLabel ??
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

/* ------------------------------------------------------------------------------------------- */
/* KPI tiles and sparkline                                                                      */
/* ------------------------------------------------------------------------------------------- */

/** A 2px trend line in the de-emphasis grey, with the latest point in the accent. */
export function Sparkline({ values, width = 132, height = 44 }: { values: readonly number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const x = (i: number) => 6 + (i / (values.length - 1)) * (width - 12);
  const y = linearScale(lo === hi ? [lo - 1, hi + 1] : [lo, hi], [height - 6, 6]);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  return (
    <svg className="uipack-cx-spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path className="uipack-cx-spark__line" d={d} />
      <circle className="uipack-cx-spark__dot" cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={5} />
    </svg>
  );
}

export interface KpiDelta {
  /** Signed text, as shown: "+22%", "−3.1 pts". */
  text: string;
  direction: "up" | "down" | "flat";
  /** Whether the move is good news. Sets the colour; the arrow and sign carry the direction. */
  sentiment?: "good" | "bad" | "neutral";
  /** Comparison period: "vs FY22". */
  period?: string;
}

export interface KpiItem {
  label: string;
  value: string;
  /** Small unit after the value: "pts", "M". */
  unit?: string;
  delta?: KpiDelta;
  /** A muted line under the value when there is no delta: "Fit-out and site exits". */
  note?: string;
  /** About 6–12 points, oldest first. */
  trend?: readonly number[];
  /** Wraps the value in `Morph as="span"`, so a morph can carry it into the next slide's title. */
  morphId?: string;
  highlight?: boolean;
}

const Arrow = ({ direction }: { direction: KpiDelta["direction"] }) => (
  <svg className="uipack-cx-delta__arrow" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    {direction === "up" && <path d="M9 2 L16 14 H2 Z" />}
    {direction === "down" && <path d="M9 16 L16 4 H2 Z" />}
    {direction === "flat" && <path d="M2 7 H16 V11 H2 Z" />}
  </svg>
);

/** A row of stat tiles: label, value, a signed delta with an arrow, and a sparkline. */
export function KpiTiles({ items, columns }: { items: readonly KpiItem[]; /** Tiles per row. Default: all in one row. */ columns?: number }) {
  const per = Math.max(1, columns ?? items.length);
  return (
    <ul className="uipack-cx-kpis" style={{ gridTemplateColumns: `repeat(${per}, minmax(0, 1fr))` }}>
      {items.map((k, i) => (
        <li
          key={k.label}
          className="uipack-cx-kpi"
          data-highlight={k.highlight ? "" : undefined}
          data-first-col={i % per === 0 ? "" : undefined}
          data-last-col={i % per === per - 1 ? "" : undefined}
          data-next-row={i >= per ? "" : undefined}
        >
          <p className="uipack-cx-kpi__label">{k.label}</p>
          <div className="uipack-cx-kpi__row">
            <p className="uipack-cx-kpi__value">
              {k.morphId ? (
                <Morph id={k.morphId} as="span">
                  {k.value}
                </Morph>
              ) : (
                <span>{k.value}</span>
              )}
              {k.unit && <small>{k.unit}</small>}
            </p>
            {k.trend && <Sparkline values={k.trend} />}
          </div>
          {k.delta && (
            <p className="uipack-cx-delta" data-sentiment={k.delta.sentiment ?? "neutral"}>
              <Arrow direction={k.delta.direction} />
              <b>{k.delta.text}</b>
              {k.delta.period && <span>{k.delta.period}</span>}
            </p>
          )}
          {k.note && <p className="uipack-cx-kpi__note">{k.note}</p>}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------------------------------- */
/* Matrix2x2                                                                                    */
/* ------------------------------------------------------------------------------------------- */

export interface MatrixAxis {
  label: string;
  domain: [number, number];
  /** Where the quadrants split. Default: the middle of the domain. */
  split?: number;
  format?: Format;
}

export interface MatrixPoint {
  label: string;
  x: number;
  y: number;
  /** Bubble area is proportional to size. */
  size?: number;
  highlight?: boolean;
  /** Which side of the bubble the label sits. Default right. */
  labelAt?: "right" | "left" | "top" | "bottom";
}

export interface Matrix2x2Props extends ChartSize {
  x: MatrixAxis;
  y: MatrixAxis;
  points: readonly MatrixPoint[];
  /** Quadrant names: top-left, top-right, bottom-left, bottom-right. */
  quadrants?: [string, string, string, string];
  /** The quadrant the slide is about, tinted. */
  focus?: "tl" | "tr" | "bl" | "br";
  /** Largest bubble radius in canvas px. */
  maxRadius?: number;
  callout?: ChartCallout & { label: string };
  ariaLabel?: string;
}

/** A 2×2: labelled axes, quadrant names, sized bubbles and direct labels. */
export function Matrix2x2({ x: xa, y: ya, points, quadrants, focus, maxRadius = 46, callout, ariaLabel, width, height }: Matrix2x2Props) {
  const size = useChartSize({ width, height });
  const W = size.width;
  const H = size.height;
  const fx = xa.format ?? defaultFormat;
  const fy = ya.format ?? defaultFormat;
  const xSplit = xa.split ?? (xa.domain[0] + xa.domain[1]) / 2;
  const ySplit = ya.split ?? (ya.domain[0] + ya.domain[1]) / 2;
  const yTicks = [ya.domain[0], ySplit, ya.domain[1]];
  const xTicks = [xa.domain[0], xSplit, xa.domain[1]];
  const tickW = Math.max(...yTicks.map((t) => textWidth(fy(t), CX_TYPE.tick))) + 12;
  const left = 34 + tickW;
  const right = W - 8;
  const top = 8;
  const bottom = H - 30 - 34;
  const xs = linearScale(xa.domain, [left, right]);
  const ys = linearScale(ya.domain, [bottom, top]);
  const maxSize = Math.max(...points.map((p) => p.size ?? 1));
  const midX = xs(xSplit);
  const midY = ys(ySplit);
  const quads = {
    tl: { x: left, y: top, w: midX - left, h: midY - top },
    tr: { x: midX, y: top, w: right - midX, h: midY - top },
    bl: { x: left, y: midY, w: midX - left, h: bottom - midY },
    br: { x: midX, y: midY, w: right - midX, h: bottom - midY },
  };
  const label =
    ariaLabel ??
    `2 by 2 matrix: ${xa.label} against ${ya.label}. ${points.map((p) => `${p.label}: ${fx(p.x)}, ${fy(p.y)}${p.size !== undefined ? `, size ${p.size}` : ""}`).join("; ")}.`;
  const sorted = [...points].sort((a, b) => (b.size ?? 1) - (a.size ?? 1));
  return (
    <Frame size={size} label={label}>
      {focus && <rect className="uipack-cx-quad-focus" {...{ x: quads[focus].x, y: quads[focus].y, width: quads[focus].w, height: quads[focus].h }} />}
      <rect className="uipack-cx-plot-edge" x={left} y={top} width={right - left} height={bottom - top} />
      <line className="uipack-cx-split" x1={midX} x2={midX} y1={top} y2={bottom} />
      <line className="uipack-cx-split" x1={left} x2={right} y1={midY} y2={midY} />
      {quadrants &&
        (["tl", "tr", "bl", "br"] as const).map((q, i) => {
          const r = quads[q];
          const atRight = q === "tr" || q === "br";
          const atBottom = q === "bl" || q === "br";
          const lines = wrapToWidth(quadrants[i].toUpperCase(), CX_TYPE.quadrant, r.w * 0.55, 2);
          const lh = CX_TYPE.quadrant * 1.25;
          return (
            <text
              key={q}
              x={atRight ? r.x + r.w - 16 : r.x + 16}
              y={atBottom ? r.y + r.h - 16 - (lines.length - 1) * lh : r.y + 16 + CX_TYPE.quadrant * 0.8}
              fontSize={CX_TYPE.quadrant}
              textAnchor={atRight ? "end" : "start"}
              className="uipack-cx-quad-label"
              data-focus={focus === q ? "" : undefined}
            >
              {lines.map((l, k) => (
                <tspan key={k} x={atRight ? r.x + r.w - 16 : r.x + 16} dy={k === 0 ? 0 : lh}>
                  {l}
                </tspan>
              ))}
            </text>
          );
        })}
      {yTicks.map((t) => (
        <Text key={`y${t}`} x={left - 10} y={ys(t)} size={CX_TYPE.tick} anchor="end" muted className="uipack-cx-tabular">
          {fy(t)}
        </Text>
      ))}
      {xTicks.map((t, i) => (
        <Text key={`x${t}`} x={xs(t)} y={bottom + 24} size={CX_TYPE.tick} anchor={i === 0 ? "start" : i === 2 ? "end" : "middle"} muted className="uipack-cx-tabular">
          {fx(t)}
        </Text>
      ))}
      <Text x={(left + right) / 2} y={H - 12} size={CX_TYPE.tick} anchor="middle" weight={600} baseline="auto">
        {`${xa.label} →`}
      </Text>
      <text
        transform={`translate(14 ${(top + bottom) / 2}) rotate(-90)`}
        fontSize={CX_TYPE.tick}
        textAnchor="middle"
        dominantBaseline="central"
        className="uipack-cx-t uipack-cx-t--strong"
      >
        {`${ya.label} →`}
      </text>
      {sorted.map((p, i) => {
        const cx = xs(p.x);
        const cy = ys(p.y);
        const r = bubbleRadius(p.size ?? 1, maxSize, maxRadius);
        const at = p.labelAt ?? "right";
        const lx = at === "right" ? cx + r + 10 : at === "left" ? cx - r - 10 : cx;
        const ly = at === "top" ? cy - r - 18 : at === "bottom" ? cy + r + 20 : cy;
        return (
          <g key={p.label} data-highlight={p.highlight ? "" : undefined}>
            <circle
              className="uipack-cx-bubble uipack-cx-grow"
              data-axis="both"
              cx={cx}
              cy={cy}
              r={r}
              style={{ ...growStyle("50% 50%", i * 50), fill: p.highlight ? fill.accent : fill.context }}
            >
              <title>{`${p.label}: ${xa.label} ${fx(p.x)}, ${ya.label} ${fy(p.y)}`}</title>
            </circle>
            <Text x={lx} y={ly} anchor={at === "right" ? "start" : at === "left" ? "end" : "middle"} weight={p.highlight ? 600 : undefined} halo>
              {p.label}
            </Text>
          </g>
        );
      })}
      {callout &&
        (() => {
          const p = points.find((q) => q.label === callout.label);
          if (!p) return null;
          const px = xs(p.x);
          const py = ys(p.y);
          return <Annotation x={px} y={py} tx={px + callout.dx} ty={py + callout.dy} text={callout.text} width={callout.width} align={callout.align} />;
        })()}
    </Frame>
  );
}
