import type { ReactNode } from "react";
import { icons, type IconName } from "./icons";

export interface NodeProps {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  /** Mono second line: a role, a count, a path. */
  sub?: string;
  /** An icon name from uipack/icons or any SVG fragment drawn in a 16×16 box. */
  icon?: IconName | ReactNode;
  /** Centre the text instead of left-aligning it after the icon. */
  align?: "left" | "center";
  /** Accent border and title. */
  accent?: boolean;
  dashed?: boolean;
  size?: number;
  subSize?: number;
  id?: string;
}

export function Node({
  x,
  y,
  w,
  h,
  label,
  sub,
  icon,
  align = icon ? "left" : "center",
  accent,
  dashed,
  size = 14,
  subSize = 11,
  id,
}: NodeProps) {
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  const glyph = typeof icon === "string" ? icons[icon as IconName] : icon;
  const pad = 14;
  const tx = align === "center" ? x + w / 2 : x + pad + (glyph ? 26 : 0);
  const anchor = align === "center" ? "middle" : "start";
  const ty = sub ? y + h / 2 - 3 : y + h / 2 + size * 0.35;
  return (
    <g id={id} data-uipack="node">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill="var(--uipack-surface)"
        stroke={stroke}
        strokeOpacity={accent ? 1 : 0.7}
        strokeWidth={1.25}
        strokeDasharray={dashed ? "4 4" : undefined}
      />
      {glyph ? (
        <g transform={`translate(${x + pad}, ${y + h / 2 - 8})`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          {glyph}
        </g>
      ) : null}
      <text x={tx} y={ty} textAnchor={anchor} fontSize={size} fontWeight={600} fill={accent ? "var(--uipack-accent)" : "currentColor"}>
        {label}
      </text>
      {sub ? (
        <text x={tx} y={y + h / 2 + subSize + 2} textAnchor={anchor} fontSize={subSize} fontFamily="var(--uipack-mono)" fill="currentColor" fillOpacity={0.75}>
          {sub}
        </text>
      ) : null}
    </g>
  );
}
