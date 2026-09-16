import { useFontFloor } from "./scale";

export interface LabelProps {
  x: number;
  y: number;
  text: string;
  anchor?: "start" | "middle" | "end";
  accent?: boolean;
  size?: number;
  /** Mono is the default; sans for a sentence. */
  font?: "mono" | "sans";
}

/** Text with a page-coloured underlay so it can sit on a connector. */
export function Label({ x, y, text, anchor = "start", accent, size: size0 = 11, font = "mono" }: LabelProps) {
  const size = useFontFloor(size0);
  const w = text.length * size * (font === "mono" ? 0.62 : 0.55) + 8;
  const rx = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w + 4 : x - 4;
  return (
    <g data-uipack="label">
      <rect x={rx} y={y - size + 1} width={w} height={size + 5} fill="var(--uipack-bg)" />
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        fontSize={size}
        fontFamily={font === "mono" ? "var(--uipack-mono)" : undefined}
        letterSpacing={font === "mono" ? ".06em" : undefined}
        fill={accent ? "var(--uipack-accent)" : "currentColor"}
        fillOpacity={accent ? 1 : 0.8}>
        {font === "mono" ? text.toUpperCase() : text}
      </text>
    </g>
  );
}
