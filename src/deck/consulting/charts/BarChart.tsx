import { useChartSize } from "../hooks";
import {
  CX_TYPE,
  bandLayout,
  barPath,
  linearScale,
  textWidth,
  wrapToWidth,
  zeroBasedDomain,
} from "../scale";
import { type Format, defaultFormat, type ChartSize, fill, Frame, growStyle, Text, Lines } from "./shared";
import { Annotation, type ChartCallout } from "./Annotation";

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
  alt?: string;
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
  alt,
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
  const label = alt ?? `Bar chart. ${rows.map((d) => `${d.label}: ${format(d.value)}`).join("; ")}.`;
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
