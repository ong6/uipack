import { useChartSize } from "../hooks";
import { CX_TYPE, bandLayout, barPath, linearScale, stackSegments, textWidth, wrapToWidth } from "../scale";
import { type Format, defaultFormat, type ChartSize, fill, Frame, growStyle, Text, Lines } from "./shared";

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
  alt?: string;
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
  alt,
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
  const fmtSeg = (s: { value: number; share: number }) =>
    percent ? `${Math.round(s.share * 100)}%` : (segmentFormat ?? format)(s.value);
  const label =
    alt ??
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
              <Lines
                x={labelW - 16}
                y={b.centre}
                lines={wrapToWidth(c.label, CX_TYPE.label, labelW - 20, 2)}
                anchor="end"
                weight={c.highlight ? 600 : undefined}
              />
              <g className="uipack-cx-grow" data-axis="x" style={growStyle("0% 50%", i * 40)}>
                {stacks[i].map((s, k) => {
                  const x0 = x(s.from) + (k > 0 ? 1 : 0);
                  const x1 = x(s.to) - (k < stacks[i].length - 1 ? 1 : 0);
                  if (x1 - x0 <= 0.5) return null;
                  return (
                    <g key={k}>
                      <rect style={{ fill: fill.series(k) }} x={x0} y={b.markStart} width={x1 - x0} height={b.mark}>
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
                      <path style={{ fill: fill.series(k) }} d={barPath("vertical", y0, y1, b.markStart, b.mark)}>
                        <title>{`${c.label}, ${series[k]}: ${fmtSeg(s)}`}</title>
                      </path>
                    ) : (
                      <rect style={{ fill: fill.series(k) }} x={b.markStart} y={y1} width={b.mark} height={y0 - y1}>
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
