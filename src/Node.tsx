import type { ReactNode } from "react";
import { useFigureHover, hoverAttrs, isPointer, flowList, type Flow } from "./hover";
import { icons, type IconName } from "./icons";
import { useFontFloor } from "./scale";

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
  /** Flow names this node takes part in; hovering it highlights the flow. */
  flow?: Flow;
  /** Native tooltip. */
  hint?: string;
  /** Makes the node a link with a focus ring. */
  href?: string;
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
  flow,
  hint,
  href,
  size: size0 = 14,
  subSize: subSize0 = 11,
  id,
}: NodeProps) {
  const hover = useFigureHover();
  const size = useFontFloor(size0);
  const subSize = useFontFloor(subSize0);
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  const glyph = typeof icon === "string" ? icons[icon as IconName] : icon;
  const pad = 14;
  const tx = align === "center" ? x + w / 2 : x + pad + (glyph ? 26 : 0);
  const anchor = align === "center" ? "middle" : "start";
  const ty = sub ? y + h / 2 - 3 : y + h / 2 + size * 0.35;
  const flows = flowList(flow);
  const handlers = flows.length
    ? {
        onPointerEnter: (e: React.PointerEvent) => isPointer(e) && hover.setFlow(flows[0]),
        onPointerLeave: (e: React.PointerEvent) => isPointer(e) && hover.setFlow(null),
      }
    : {};
  const body = (
    <g id={id} data-uipack="node" {...hoverAttrs(flow, undefined, hover)} {...handlers}>
      {hint ? <title>{hint}</title> : null}
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
  return href ? (
    <a href={href} className="uipack__link" aria-label={label}>
      {body}
    </a>
  ) : (
    body
  );
}
