import { useChartSize } from "../hooks";
import {
  CX_TYPE,
  bandLayout,
  barPath,
  linearScale,
  waterfallBars,
  wrapToWidth,
  zeroBasedDomain,
  type WaterfallInput,
} from "../scale";
import { type Format, defaultFormat, type ChartSize, fill, Frame, growStyle, Lines } from "./shared";
import { Annotation, type ChartCallout } from "./Annotation";

export interface WaterfallProps extends ChartSize {
  /** Start total → deltas → end total. A total without `value` closes at the running level. */
  steps: readonly WaterfallInput[];
  format?: Format;
  /** Which direction is good: `up` for margin or revenue, `down` for cost. Colours follow it; signs and arrows show direction. */
  goodDirection?: "up" | "down";
  /** Value-axis domain. A start above zero truncates the totals, marked with a break. */
  domain?: [number, number];
  callout?: ChartCallout & { label: string };
  alt?: string;
}

/** A bridge from a start total through signed deltas to an end total. */
export function Waterfall({
  steps,
  format = defaultFormat,
  goodDirection = "up",
  domain,
  callout,
  alt,
  width,
  height,
}: WaterfallProps) {
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
    alt ??
    `Waterfall. ${bars.map((b) => `${b.label}: ${b.kind === "total" ? format(b.value) : (b.value >= 0 ? "+" : "") + format(b.value)}`).join("; ")}.`;
  const show = (b: (typeof bars)[number]) =>
    b.kind === "total" ? format(b.value) : `${b.value > 0 ? "+" : ""}${format(b.value)}`;
  return (
    <Frame size={size} label={label}>
      {bars.map((b, i) => {
        const band = bandsProbe[i];
        const next = bandsProbe[i + 1];
        const good = b.kind !== "total" && b.value >= 0 === (goodDirection === "up");
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
              <line
                className="uipack-cx-connector"
                x1={band.markStart + band.mark}
                x2={next.markStart}
                y1={y(b.to)}
                y2={y(b.to)}
              />
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
          return (
            <Annotation
              x={px}
              y={py}
              tx={px + callout.dx}
              ty={py + callout.dy}
              text={callout.text}
              width={callout.width}
              align={callout.align}
            />
          );
        })()}
    </Frame>
  );
}
