import type { ReactNode } from "react";

export interface GroupProps {
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
  /** "solid" draws a boxed region with a centred title (a service); "dashed" an environment or boundary. */
  variant?: "solid" | "dashed";
  accent?: boolean;
  titleSize?: number;
  children?: ReactNode;
}

export function Group({ x, y, w, h, title, variant = "solid", accent, titleSize, children }: GroupProps) {
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  const dashed = variant === "dashed";
  const ts = titleSize ?? (dashed ? 11 : 14);
  return (
    <g data-uipack="group">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={dashed ? 10 : 6}
        fill={dashed ? "none" : "var(--uipack-surface)"}
        fillOpacity={dashed ? undefined : 0.6}
        stroke={stroke}
        strokeOpacity={accent ? 1 : dashed ? 0.4 : 0.8}
        strokeWidth={1.25}
        strokeDasharray={dashed ? "4 4" : undefined}
      />
      {title ? (
        dashed ? (
          <text x={x + 16} y={y + 22} fontSize={ts} fontFamily="var(--uipack-mono)" letterSpacing=".08em" fill={stroke} fillOpacity={accent ? 1 : 0.75}>
            {title.toUpperCase()}
          </text>
        ) : (
          <text x={x + w / 2} y={y + 24} textAnchor="middle" fontSize={ts} fontWeight={600} fill={stroke}>
            {title}
          </text>
        )
      ) : null}
      {children}
    </g>
  );
}
