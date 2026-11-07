import { FocusRing, useItemSelection } from "./selection";
import type { ReactNode } from "react";
import { useFigureHover, hoverAttrs, isPointer, flowList, type Flow } from "./hover";
import { icons, type IconName } from "./icons";
import { useFontFloor, useTouchTarget } from "./scale";

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
  /** One short sentence on what the box does. Inside a Figure, selecting the node shows it in a note beside the box; elsewhere it is a native tooltip. */
  hint?: string;
  /** Makes the node a link with a focus ring. */
  href?: string;
  size?: number;
  subSize?: number;
  id?: string;
  /** Drawn inside the box, above its fill and under the icon and text (a drill-down preview). */
  inlay?: ReactNode;
  /**
   * A 16-unit header strip that says what kind of thing the box is: `window` (a UI, app or page),
   * `terminal` (a CLI, job or worker), `file` (a document, config or spec), `store` (data at rest).
   * Optional: use it only where the type adds meaning, one kind per type across a figure. The label
   * and icon centre in the body below it.
   */
  strip?: NodeStrip;
}

export type NodeStrip = "window" | "terminal" | "file" | "store";

/** The strip's height in user units. */
export const NODE_STRIP = 16;

/** The strip's mark, drawn in a 16-unit band from (x, y): muted ink, no text. */
function StripMark({ kind, x, y }: { kind: Exclude<NodeStrip, "store">; x: number; y: number }) {
  const cy = y + NODE_STRIP / 2;
  if (kind === "window")
    return (
      <g fill="currentColor" fillOpacity={0.4}>
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={x + i * 7} cy={cy} r={2} />
        ))}
      </g>
    );
  const line = {
    fill: "none",
    stroke: "currentColor",
    strokeOpacity: 0.5,
    strokeWidth: 1.25,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  if (kind === "terminal") return <path {...line} d={`M ${x - 1} ${cy - 3} l 3 3 l -3 3 M ${x + 5} ${cy + 3} h 6`} />;
  // file: a page with a folded corner.
  return <path {...line} d={`M ${x - 1} ${cy - 4.5} h 5 l 3 3 v 6 h -8 Z M ${x + 4} ${cy - 4.5} v 3 h 3`} />;
}

/** A node's accessible name: its visible label, then its subtitle. Shared by Node and DrillNode. */
export const nodeName = (label: string, sub?: string) => (sub ? `${label}, ${sub}` : label);

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
  inlay,
  strip,
}: NodeProps) {
  const hover = useFigureHover();
  const size = useFontFloor(size0);
  const subSize = useFontFloor(subSize0);
  const hit = useTouchTarget(w, h);
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  const glyph = typeof icon === "string" ? icons[icon as IconName] : icon;
  const pad = 14;
  const tx = align === "center" ? x + w / 2 : x + pad + (glyph ? 26 : 0);
  const anchor = align === "center" ? "middle" : "start";
  // A strip takes the top 16 units; the icon and words centre in the body below it.
  const top = strip ? NODE_STRIP : 0;
  const mid = y + top + (h - top) / 2;
  const ty = sub ? mid - 3 : mid + size * 0.35;
  const flows = flowList(flow);
  const handlers = flows.length
    ? {
        onPointerEnter: (e: React.PointerEvent) => isPointer(e) && hover.setFlow(flows[0]),
        onPointerLeave: (e: React.PointerEvent) => isPointer(e) && hover.setFlow(null),
      }
    : {};
  // The accessible name starts with the visible label and carries the subtitle (WCAG 2.5.3).
  // An unlabelled node is decorative (a replica's shadow, say), never a button.
  const name = nodeName(label, sub);
  const selection = useItemSelection(label, hint, flows[0], !href && !!label, name);
  const body = (
    <g id={id} data-uipack="node" {...hoverAttrs(flow, undefined, hover)} {...handlers} {...selection}>
      {hint && !selection.role ? <title>{hint}</title> : null}
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
      {strip ? (
        <g data-uipack="node-strip" data-strip={strip} aria-hidden="true">
          {strip === "store" ? (
            // A store's strip is the lip of a cylinder: the divider bows, and needs no mark.
            <path
              d={`M ${x} ${y + NODE_STRIP - 4} Q ${x + w / 2} ${y + NODE_STRIP + 4} ${x + w} ${y + NODE_STRIP - 4}`}
              fill="none"
              stroke={stroke}
              strokeOpacity={0.3}
              strokeWidth={1}
            />
          ) : (
            <>
              <line
                x1={x}
                y1={y + NODE_STRIP}
                x2={x + w}
                y2={y + NODE_STRIP}
                stroke={stroke}
                strokeOpacity={0.3}
                strokeWidth={1}
              />
              <StripMark kind={strip} x={x + 10} y={y} />
            </>
          )}
        </g>
      ) : null}
      {selection.role ? <FocusRing x={x} y={y} w={w} h={h} rx={6} /> : null}
      {inlay}
      {/* The hit area on touch: at least 44 CSS px at the drawn scale, centred on the box; invisible, so the drawing and its 8px grid do not change. */}
      <path
        className="uipack__touch-target"
        d={`M ${x - (hit.w - w) / 2} ${y - (hit.h - h) / 2} h ${hit.w} v ${hit.h} h ${-hit.w} Z`}
        fill="transparent"
        stroke="none"
        aria-hidden="true"
      />
      {glyph ? (
        <g
          transform={`translate(${x + pad}, ${mid - 8})`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {glyph}
        </g>
      ) : null}
      <text
        x={tx}
        y={ty}
        textAnchor={anchor}
        fontSize={size}
        fontWeight={600}
        fill={accent ? "var(--uipack-accent-ink)" : "currentColor"}
      >
        {label}
      </text>
      {/* Keeps the words apart for checkers that join text nodes without spaces (axe label-in-name). */}
      {sub ? " " : null}
      {sub ? (
        <text
          x={tx}
          y={mid + subSize + 2}
          textAnchor={anchor}
          fontSize={subSize}
          fontFamily="var(--uipack-mono)"
          fill="currentColor"
          fillOpacity={0.75}
        >
          {sub}
        </text>
      ) : null}
    </g>
  );
  return href ? (
    <a href={href} className="uipack__link" aria-label={name}>
      {body}
    </a>
  ) : (
    body
  );
}
