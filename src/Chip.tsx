import { FocusRing, useItemSelection } from "./selection";
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
  /** One short sentence on what the chip stands for. Makes it selectable inside a Figure. */
  hint?: string;
  /** "pill" (default) for a slot or flag; "tag" is a small-radius box for a symbol, a key or a call (`PARSE()`). */
  shape?: "pill" | "tag";
  /** A lighter wash of `kind`: the older or unchanged one beside a full-tint chip. */
  soft?: boolean;
}

/** Pill: a connection slot, a request in a queue, a status flag. */
export function Chip({ x, y, w, h = 24, label, dashed, kind, flow, size: size0 = 10, hint, shape = "pill", soft }: ChipProps) {
  const hover = useFigureHover();
  const size = useFontFloor(size0);
  const fill = !kind ? "var(--uipack-surface)" : kind === "accent" ? "var(--uipack-accent)" : `var(--uipack-token-${kind})`;
  const selection = useItemSelection(label || "Empty slot", hint);
  const rx = shape === "tag" ? 4 : h / 2;
  const tint = soft ? "var(--uipack-chip-soft, 0.2)" : "var(--uipack-chip-tint, 0.55)";
  return (
    <g data-uipack="chip" {...hoverAttrs(flow, kind === "accent" ? undefined : kind, hover)} {...selection}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={rx}
        fill={fill}
        // A token hue tints the pill: 55% on paper, a 28% wash in dark themes so the pale
        // label keeps its contrast (--uipack-chip-tint, set by the theme).
        style={kind ? { fillOpacity: tint } : undefined}
        stroke="currentColor"
        strokeOpacity={dashed ? 0.5 : 0.8}
        strokeWidth={1.25}
        strokeDasharray={dashed ? "3 3" : undefined}
      />
      {selection.role ? <FocusRing x={x} y={y} w={w} h={h} rx={rx} /> : null}
      {label ? (
        <text
          x={x + w / 2}
          y={y + h / 2 + size * 0.36}
          textAnchor="middle"
          fontSize={size}
          fontWeight={shape === "tag" ? 500 : 700}
          fontFamily="var(--uipack-mono)"
          letterSpacing={shape === "tag" ? ".06em" : undefined}
          fill="currentColor"
        >
          {label.toUpperCase()}
        </text>
      ) : null}
    </g>
  );
}
