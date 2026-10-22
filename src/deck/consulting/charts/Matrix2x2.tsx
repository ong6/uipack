import { useChartSize } from "../hooks";
import { CX_TYPE, bubbleRadius, linearScale, textWidth, wrapToWidth } from "../scale";
import { type Format, defaultFormat, type ChartSize, fill, Frame, growStyle, Text } from "./shared";
import { Annotation, type ChartCallout } from "./Annotation";

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
  alt?: string;
}

/** A 2×2: labelled axes, quadrant names, sized bubbles and direct labels. */
export function Matrix2x2({
  x: xa,
  y: ya,
  points,
  quadrants,
  focus,
  maxRadius = 46,
  callout,
  alt,
  width,
  height,
}: Matrix2x2Props) {
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
    alt ??
    `2 by 2 matrix: ${xa.label} against ${ya.label}. ${points.map((p) => `${p.label}: ${fx(p.x)}, ${fy(p.y)}${p.size !== undefined ? `, size ${p.size}` : ""}`).join("; ")}.`;
  const sorted = [...points].sort((a, b) => (b.size ?? 1) - (a.size ?? 1));
  return (
    <Frame size={size} label={label}>
      {focus && (
        <rect
          className="uipack-cx-quad-focus"
          {...{ x: quads[focus].x, y: quads[focus].y, width: quads[focus].w, height: quads[focus].h }}
        />
      )}
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
        <Text
          key={`x${t}`}
          x={xs(t)}
          y={bottom + 24}
          size={CX_TYPE.tick}
          anchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}
          muted
          className="uipack-cx-tabular"
        >
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
            <Text
              x={lx}
              y={ly}
              anchor={at === "right" ? "start" : at === "left" ? "end" : "middle"}
              weight={p.highlight ? 600 : undefined}
              halo
            >
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
