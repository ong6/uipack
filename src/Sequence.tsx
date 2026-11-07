// Sequence parts: participants across the top (a Node each), time runs down their lifelines, and
// messages are numbered arrows between them. Built on Connector, Label and Badge, so a sequence is
// the same family as the system figures and follows the theme. Promoted from junxiong.dev's
// components/diagrams/sequence.js.
//
//   Lifeline    faint dashed rule down from a participant
//   Activation  narrow bar while a participant does the work
//   Message     numbered arrow with its label above
//   Lost        a message that never arrives, ending in a Cross
//   SelfLoop    a participant calling itself (a retry)
//   Note        dashed card pinned beside a lifeline
import { Badge } from "./Badge";
import { Connector, type ConnectorKind } from "./Connector";
import { Cross } from "./Cross";
import type { Point } from "./geometry";
import { useFigureHover, hoverAttrs, type Flow } from "./hover";
import { Label } from "./Label";
import { Packet } from "./Packet";
import { useFontFloor } from "./scale";

export interface LifelineProps {
  /** The participant's centre line. */
  x: number;
  y1: number;
  y2: number;
}

/** Time running down from a participant: a faint `3 5` dashed rule. */
export function Lifeline({ x, y1, y2 }: LifelineProps) {
  return (
    <line
      data-uipack="lifeline"
      x1={x}
      y1={y1}
      x2={x}
      y2={y2}
      stroke="currentColor"
      strokeOpacity={0.3}
      strokeWidth={1}
      strokeDasharray="3 5"
    />
  );
}

export interface ActivationProps {
  x: number;
  y1: number;
  y2: number;
  accent?: boolean;
  flow?: Flow;
}

/** While a participant does the work: a 12-wide bar on its lifeline. */
export function Activation({ x, y1, y2, accent, flow }: ActivationProps) {
  const hover = useFigureHover();
  const tone = accent ? "var(--uipack-accent)" : "currentColor";
  return (
    <rect
      data-uipack="activation"
      {...hoverAttrs(flow, undefined, hover)}
      x={x - 6}
      y={y1}
      width={12}
      height={y2 - y1}
      rx={2}
      fill={tone}
      fillOpacity={0.14}
      stroke={tone}
      strokeOpacity={0.6}
      strokeWidth={1}
    />
  );
}

/** A packet riding a message: `true` for the defaults, or its timing. */
export type SequencePacket = boolean | { dur?: number; delay?: number };

function Ride({
  points,
  kind,
  packet,
  flow,
  dur,
}: {
  points: Point[];
  kind: ConnectorKind;
  packet?: SequencePacket;
  flow?: Flow;
  dur: number;
}) {
  if (!packet) return null;
  const t = packet === true ? {} : packet;
  return <Packet points={points} kind={kind} dur={t.dur ?? dur} delay={t.delay ?? 0} r={4} flow={flow} />;
}

export interface MessageProps {
  /** Marker prefix from `<Defs id>`. */
  id: string;
  /** Sender's and receiver's lifeline x. */
  from: number;
  to: number;
  y: number;
  /** Step number, drawn on the sender's lifeline so the numbers read straight down. */
  n?: number | string;
  label: string;
  kind?: Exclude<ConnectorKind, "accent">;
  /** Dashed: an async message or a return. */
  dashed?: boolean;
  /** The figure's one accent path. */
  accent?: boolean;
  labelSize?: number;
  /** Move the label off a lifeline the message crosses. Default the midpoint. */
  labelX?: number;
  /** A packet of the message's kind riding it (claim flows only). */
  packet?: SequencePacket;
  flow?: Flow;
}

/** A numbered arrow between two lifelines, its label centred above. */
export function Message({ id, from, to, y, n, label, kind, dashed, accent, labelSize = 12, labelX, packet, flow }: MessageProps) {
  const dir = to > from ? 1 : -1;
  const points: Point[] = [
    [from + dir * 14, y],
    [to - dir * 8, y],
  ];
  const tone = kind ?? (accent ? "accent" : undefined);
  return (
    <g data-uipack="message">
      <Connector points={points} defs={id} kind={tone} dashed={dashed} flow={flow} />
      {tone ? <Ride points={points} kind={tone} packet={packet} flow={flow} dur={1.8} /> : null}
      <Label x={labelX ?? (from + to) / 2} y={y - 10} text={label} anchor="middle" size={labelSize} accent={!!accent} />
      {n != null ? <Badge cx={from} cy={y} text={String(n)} r={10} size={11} accent={!!accent} /> : null}
    </g>
  );
}

export interface LostProps {
  id: string;
  from: number;
  to: number;
  y: number;
  n?: number | string;
  label: string;
  labelSize?: number;
  labelX?: number;
  flow?: Flow;
}

/** A message that never arrives: a dashed line that stops short of the receiver in a `Cross`. */
export function Lost({ id, from, to, y, n, label, labelSize = 12, labelX, flow }: LostProps) {
  const dir = to > from ? 1 : -1;
  const end = to - dir * 16;
  return (
    <g data-uipack="lost">
      <Connector
        points={[
          [from + dir * 14, y],
          [end, y],
        ]}
        defs={id}
        arrow={false}
        dashed
        flow={flow}
      />
      <Cross x={end} y={y} />
      <Label x={labelX ?? (from + to) / 2} y={y - 10} text={label} anchor="middle" size={labelSize} />
      {n != null ? <Badge cx={from} cy={y} text={String(n)} r={10} size={11} /> : null}
    </g>
  );
}

export interface SelfLoopProps {
  id: string;
  /** The participant's lifeline. */
  x: number;
  /** Where the loop leaves the lifeline; it returns `h` lower. */
  y: number;
  /** Default 36. */
  h?: number;
  /** Default 44. */
  w?: number;
  side?: "left" | "right";
  n?: number | string;
  kind?: Exclude<ConnectorKind, "accent">;
  packet?: SequencePacket;
  flow?: Flow;
}

/** A participant calling itself (a retry, a poll): a dashed loop off its lifeline. */
export function SelfLoop({ id, x, y, h = 36, side = "left", w = 44, n, kind, packet, flow }: SelfLoopProps) {
  const dx = side === "left" ? -w : w;
  const off = side === "left" ? -8 : 8;
  const points: Point[] = [
    [x + off, y],
    [x + dx, y],
    [x + dx, y + h],
    [x + off, y + h],
  ];
  return (
    <g data-uipack="self-loop">
      <Connector points={points} defs={id} kind={kind} dashed flow={flow} />
      {kind ? <Ride points={points} kind={kind} packet={packet} flow={flow} dur={2} /> : null}
      {n != null ? <Badge cx={x} cy={y} text={String(n)} r={10} size={11} /> : null}
    </g>
  );
}

export interface NoteProps {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Mono caps title: "Budget", "Idempotent". */
  title: string;
  lines?: string[];
  accent?: boolean;
}

/** A dashed card pinned beside a lifeline: a constraint, a budget, an invariant. */
export function Note({ x, y, w, h, title, lines = [], accent }: NoteProps) {
  const titleSize = useFontFloor(12);
  const lineSize = useFontFloor(11);
  const stroke = accent ? "var(--uipack-accent)" : "currentColor";
  return (
    <g data-uipack="note">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={4}
        fill="var(--uipack-surface)"
        stroke={stroke}
        strokeOpacity={accent ? 0.9 : 0.6}
        strokeWidth={1.25}
        strokeDasharray="4 4"
      />
      <text
        x={x + 12}
        y={y + 20}
        fontFamily="var(--uipack-mono)"
        fontSize={titleSize}
        fontWeight={700}
        letterSpacing=".06em"
        fill={accent ? "var(--uipack-accent-ink)" : "currentColor"}
      >
        {title.toUpperCase()}
      </text>
      {lines.map((t, i) => (
        <text
          key={`${i}-${t}`}
          x={x + 12}
          y={y + 38 + i * (lineSize + 6)}
          fontFamily="var(--uipack-mono)"
          fontSize={lineSize}
          fill="currentColor"
          fillOpacity={0.8}
        >
          {t}
        </text>
      ))}
    </g>
  );
}
