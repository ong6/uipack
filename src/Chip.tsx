import { useItemSelection } from "./selection";
import { useFigureHover, hoverAttrs, type Flow } from "./hover";
import { useFontFloor } from "./scale";

export interface ChipProps {
  x: number;
  y: number;
  w: number;
  h?: number;
  label?: string;
  /** Empty slot. */
  dashed?: boolean;
  /** Filled with a token hue (a busy slot, an overloaded flag). */
  kind?: "request" | "response" | "change" | "accent";
  /** Flow names for hover highlighting. */
  flow?: Flow;
  size?: number;
}

/** Pill: a connection slot, a request in a queue, a status flag. */
export function Chip({
  x,
  y,
  w,
  h = 24,
  label,
  dashed,
  kind,
  flow,
  size: size0 = 10,
}: ChipProps) {
  const hover = useFigureHover();
  const size = useFontFloor(size0);
  const fill = !kind
    ? "var(--uipack-surface)"
    : kind === "accent"
      ? "var(--uipack-accent)"
      : `var(--uipack-token-${kind})`;
  const selection = useItemSelection(
    label ?? "Empty slot",
    undefined,
    undefined,
    true,
  );
  return (
    <g
      data-uipack="chip"
      {...hoverAttrs(flow, kind === "accent" ? undefined : kind, hover)}
      {...selection}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={h / 2}
        fill={fill}
        fillOpacity={kind ? 0.55 : 1}
        stroke="currentColor"
        strokeOpacity={dashed ? 0.5 : 0.8}
        strokeWidth={1.25}
        strokeDasharray={dashed ? "3 3" : undefined}
      />
      {label ? (
        <text
          x={x + w / 2}
          y={y + h / 2 + size * 0.36}
          textAnchor="middle"
          fontSize={size}
          fontWeight={700}
          fontFamily="var(--uipack-mono)"
          fill="currentColor"
        >
          {label.toUpperCase()}
        </text>
      ) : null}
    </g>
  );
}
