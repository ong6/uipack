import type { CSSProperties, ReactNode } from "react";
import { useChartSize, useGrown } from "../hooks";
import { CX_TYPE, formatValue } from "../scale";

export type Format = (value: number) => string;
export const defaultFormat: Format = (v) => formatValue(v, { decimals: Number.isInteger(v) ? 0 : 1 });

/** Fixed size for tests or static use; otherwise a chart fills its panel. */
export interface ChartSize {
  width?: number;
  height?: number;
}

/** Fill colours by job. Series slots are validated for CVD separation in both themes. */
export const fill = {
  accent: "var(--uipack-cx-accent)",
  context: "var(--uipack-cx-context)",
  total: "var(--uipack-cx-total)",
  good: "var(--uipack-cx-good)",
  bad: "var(--uipack-cx-bad)",
  series: (i: number) => `var(--uipack-cx-s${(i % 4) + 1})`,
  seriesInk: (i: number) => `var(--uipack-cx-s${(i % 4) + 1}-ink)`,
};

export function Frame({
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

export const growStyle = (origin: string, delay = 0): CSSProperties =>
  ({ transformOrigin: origin, "--uipack-cx-delay": `${delay}ms` }) as CSSProperties;

export function Text({
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
      className={[
        "uipack-cx-t",
        muted && "uipack-cx-t--muted",
        weight && "uipack-cx-t--strong",
        halo && "uipack-cx-halo",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </text>
  );
}

/** Multi-line text, centred on (x, y) vertically; lines are tspans. */
export function Lines({
  x,
  y,
  lines,
  size = CX_TYPE.label,
  anchor = "middle",
  weight,
  muted,
  top,
}: {
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
