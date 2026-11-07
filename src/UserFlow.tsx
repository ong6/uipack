// User-flow parts: who is acting, what they see, what they do, where the flow branches and where it
// lands. Drawn from the theme tokens (--uipack-*) like every other part, so a user flow sits beside
// a system figure in the same theme. Promoted from junxiong.dev's components/diagrams/userflow.js.
//
//   Actor     circle + person glyph, mono role label   (who)
//   Screen    mini window: title bar, title, lines     (what they see)
//   Action    pill                                     (what they do)
//   Decision  diamond                                  (where it branches)
//   Outcome   stadium with a check, accent             (where it lands)
//   LaneRule  faint dotted rule between two lanes
import type { PointerEvent } from "react";
import { useFigureHover, hoverAttrs, isPointer, flowList, type Flow } from "./hover";
import { icons } from "./icons";
import { useFontFloor } from "./scale";

/** A part's 1.25 stroke at 70% ink: the Node edge. */
const EDGE = { stroke: "currentColor", strokeOpacity: 0.7, strokeWidth: 1.25 } as const;

/** Hover attributes and handlers for a part that names a flow: hovering it traces the flow. */
function useFlowHover(flow?: Flow) {
  const hover = useFigureHover();
  const flows = flowList(flow);
  const handlers = flows.length
    ? {
        onPointerEnter: (e: PointerEvent) => isPointer(e) && hover.setFlow(flows[0]),
        onPointerLeave: (e: PointerEvent) => isPointer(e) && hover.setFlow(null),
      }
    : {};
  return { ...hoverAttrs(flow, undefined, hover), ...handlers };
}

export interface ActorProps {
  cx: number;
  cy: number;
  /** Circle radius. Default 28. */
  r?: number;
  /** Who: drawn in mono caps. */
  role: string;
  /** A second mono line: "per tenant", "staff". */
  sub?: string;
  /** Label under the circle (default) or to its right. */
  labelSide?: "below" | "right";
  flow?: Flow;
}

/** Who acts: a circle with a person glyph and a mono role label. */
export function Actor({ cx, cy, r = 28, role, sub, labelSide = "below", flow }: ActorProps) {
  const size = useFontFloor(11);
  const subSize = useFontFloor(11);
  const s = (r * 1.25) / 16;
  const below = labelSide === "below";
  const tx = below ? cx : cx + r + 14;
  const ty = below ? cy + r + 22 : cy - 2;
  return (
    <g data-uipack="actor" {...useFlowHover(flow)}>
      <circle cx={cx} cy={cy} r={r} fill="var(--uipack-surface-raised, var(--uipack-surface))" {...EDGE} />
      <g
        transform={`translate(${cx - 8 * s}, ${cy - 8 * s}) scale(${s})`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5 / s}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {icons.user}
      </g>
      <text
        x={tx}
        y={ty}
        textAnchor={below ? "middle" : "start"}
        fontFamily="var(--uipack-mono)"
        fontSize={size}
        fontWeight={700}
        letterSpacing=".08em"
        fill="currentColor"
      >
        {role.toUpperCase()}
      </text>
      {sub ? (
        <text
          x={tx}
          y={ty + subSize + 6}
          textAnchor={below ? "middle" : "start"}
          fontFamily="var(--uipack-mono)"
          fontSize={subSize}
          fill="currentColor"
          fillOpacity={0.7}
        >
          {sub}
        </text>
      ) : null}
    </g>
  );
}

export interface ScreenProps {
  x: number;
  y: number;
  w: number;
  /** Default 128. */
  h?: number;
  title: string;
  /** Mono lines under the title: what the screen shows. */
  lines?: string[];
  /** The one accent screen of the figure. */
  accent?: boolean;
  flow?: Flow;
}

/** What they see: a mini window with a title bar, a title, mono lines and a progress stub. */
export function Screen({ x, y, w, h = 128, title, lines = [], accent, flow }: ScreenProps) {
  const titleSize = useFontFloor(13);
  const lineSize = useFontFloor(11);
  const bar = 22;
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  return (
    <g data-uipack="screen" {...useFlowHover(flow)}>
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
      />
      <line x1={x} y1={y + bar} x2={x + w} y2={y + bar} stroke={stroke} strokeOpacity={0.35} strokeWidth={1} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x + 12 + i * 9} cy={y + bar / 2} r={2.5} fill="currentColor" fillOpacity={0.35} />
      ))}
      <text
        x={x + 14}
        y={y + bar + 24}
        fontSize={titleSize}
        fontWeight={600}
        fill={accent ? "var(--uipack-accent-ink)" : "currentColor"}
      >
        {title}
      </text>
      {lines.map((t, i) => (
        <text
          key={`${i}-${t}`}
          x={x + 14}
          y={y + bar + 46 + i * (lineSize + 7)}
          fontFamily="var(--uipack-mono)"
          fontSize={lineSize}
          fill="currentColor"
          fillOpacity={0.75}
        >
          {t}
        </text>
      ))}
      <rect x={x + 14} y={y + h - 16} width={(w - 28) * 0.55} height={5} rx={2.5} fill="currentColor" fillOpacity={0.12} />
    </g>
  );
}

export interface ActionProps {
  x: number;
  y: number;
  w: number;
  /** Default 44. */
  h?: number;
  label: string;
  /** A mono note under the pill: "OAuth", "names what's missing". */
  sub?: string;
  flow?: Flow;
}

/** What they do: a pill with a verb phrase. */
export function Action({ x, y, w, h = 44, label, sub, flow }: ActionProps) {
  const size = useFontFloor(13);
  const subSize = useFontFloor(11);
  return (
    <g data-uipack="action" {...useFlowHover(flow)}>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill="var(--uipack-surface-raised, var(--uipack-surface))" {...EDGE} />
      <text x={x + w / 2} y={y + h / 2 + size * 0.35} textAnchor="middle" fontSize={size} fontWeight={600} fill="currentColor">
        {label}
      </text>
      {sub ? (
        <text
          x={x + w / 2}
          y={y + h + subSize + 6}
          textAnchor="middle"
          fontFamily="var(--uipack-mono)"
          fontSize={subSize}
          fill="currentColor"
          fillOpacity={0.7}
        >
          {sub}
        </text>
      ) : null}
    </g>
  );
}

export interface DecisionProps {
  cx: number;
  cy: number;
  /** Half the diagonal. Default 40. */
  r?: number;
  /** The question, short: "Failed?", "≥ 0.35?". */
  label: string;
  flow?: Flow;
}

/** Where it branches: a diamond with a short mono question. Label the branches with `Label`. */
export function Decision({ cx, cy, r = 40, label, flow }: DecisionProps) {
  const size = useFontFloor(11);
  return (
    <g data-uipack="decision" {...useFlowHover(flow)}>
      <path
        d={`M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`}
        fill="var(--uipack-surface)"
        {...EDGE}
        strokeLinejoin="round"
      />
      <text
        x={cx}
        y={cy + size * 0.35}
        textAnchor="middle"
        fontFamily="var(--uipack-mono)"
        fontSize={size}
        fontWeight={700}
        fill="currentColor"
      >
        {label}
      </text>
    </g>
  );
}

export interface OutcomeProps {
  x: number;
  y: number;
  w: number;
  /** Default 56. */
  h?: number;
  label: string;
  sub?: string;
  flow?: Flow;
}

/** Where it lands: an accent stadium with a check. One per lane at most; it is the accent's job. */
export function Outcome({ x, y, w, h = 56, label, sub, flow }: OutcomeProps) {
  const size = useFontFloor(13);
  const subSize = useFontFloor(11);
  const cx = x + 22;
  const cy = y + h / 2;
  return (
    <g data-uipack="outcome" {...useFlowHover(flow)}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={h / 2}
        fill="var(--uipack-surface)"
        stroke="var(--uipack-accent)"
        strokeWidth={1.5}
      />
      <circle cx={cx} cy={cy} r={10} fill="none" stroke="var(--uipack-accent)" strokeWidth={1.5} />
      <path
        d={`M ${cx - 4.5} ${cy} l 3 3 l 6 -6`}
        fill="none"
        stroke="var(--uipack-accent)"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x={x + 42} y={sub ? cy - 3 : cy + size * 0.35} fontSize={size} fontWeight={600} fill="var(--uipack-accent-ink)">
        {label}
      </text>
      {sub ? (
        <text
          x={x + 42}
          y={cy + subSize + 2}
          fontFamily="var(--uipack-mono)"
          fontSize={subSize}
          fill="currentColor"
          fillOpacity={0.75}
        >
          {sub}
        </text>
      ) : null}
    </g>
  );
}

export interface LaneRuleProps {
  x1: number;
  x2: number;
  y: number;
}

/** A faint dotted rule between two lanes (an admin lane above a user lane). */
export function LaneRule({ x1, x2, y }: LaneRuleProps) {
  return (
    <line
      data-uipack="lane-rule"
      x1={x1}
      y1={y}
      x2={x2}
      y2={y}
      stroke="currentColor"
      strokeOpacity={0.18}
      strokeWidth={1}
      strokeDasharray="2 6"
    />
  );
}
