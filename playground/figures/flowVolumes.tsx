import { Figure, Lane, hoverAttrs, useFigureHover } from "../../src";

// A small Sankey: band thickness is the count. There is no Sankey primitive,
// so the bars and bands are drawn here on the theme's token colours (they
// follow light and dark), inside a Figure for the frame, legend and canvas.
// Ported from the job-search Sankey in the notes site, with neutral data.

type Channel = "chat" | "email" | "phone";
type Tone = "ink" | Channel | "solved" | "open";

interface Item {
  id: string;
  col: number;
  n: number;
  label: string;
  /** Shorter name for the narrow drawing. */
  short?: string;
  tone: Tone;
}

const ITEMS: Item[] = [
  { id: "all", col: 0, n: 100, label: "tickets", tone: "ink" },
  { id: "chat", col: 1, n: 55, label: "Chat", tone: "chat" },
  { id: "email", col: 1, n: 30, label: "Email", tone: "email" },
  { id: "phone", col: 1, n: 15, label: "Phone", tone: "phone" },
  { id: "bot", col: 2, n: 20, label: "Solved by the bot", short: "Bot solved", tone: "solved" },
  { id: "first", col: 2, n: 50, label: "Solved on first reply", short: "First reply", tone: "solved" },
  { id: "esc", col: 2, n: 18, label: "Escalated", tone: "open" },
  { id: "none", col: 2, n: 12, label: "No reply yet", short: "No reply", tone: "open" },
];

// [from, to, count]; the channel colours every band it feeds.
const LINKS: [string, string, number][] = [
  ["all", "chat", 55], ["all", "email", 30], ["all", "phone", 15],
  ["chat", "bot", 20], ["chat", "first", 25], ["chat", "esc", 6], ["chat", "none", 4],
  ["email", "first", 15], ["email", "esc", 8], ["email", "none", 7],
  ["phone", "first", 10], ["phone", "esc", 4], ["phone", "none", 1],
];

const KIND: Record<Channel, "request" | "change" | "response"> = { chat: "request", email: "change", phone: "response" };
const FILL: Record<Tone, string> = {
  ink: "var(--uipack-fg)",
  chat: "var(--uipack-token-request)",
  email: "var(--uipack-token-change)",
  phone: "var(--uipack-token-response)",
  solved: "var(--uipack-fg)",
  open: "var(--uipack-muted)",
};
const ORDER = Object.fromEntries(ITEMS.map((n, i) => [n.id, i]));
const BY_ID = Object.fromEntries(ITEMS.map((n) => [n.id, n]));
const channelOf = (from: string, to: string): Channel => (from === "all" ? (to as Channel) : (from as Channel));

interface Spec {
  /** Bar x per column; undefined drops the column. */
  xs: (number | undefined)[];
  /** Units per item. */
  k: number;
  /** Gap between bars, per column. */
  gaps: number[];
  /** Vertical centre of every column. */
  mid: number;
  bar: number;
}

function layout(s: Spec) {
  const items = ITEMS.filter((n) => s.xs[n.col] !== undefined);
  const keep = new Set(items.map((n) => n.id));
  const links = LINKS.filter(([a, b]) => keep.has(a) && keep.has(b));
  const pos = new Map<string, { x: number; y0: number; y1: number }>();
  for (const col of [0, 1, 2]) {
    const nodes = items.filter((n) => n.col === col);
    if (!nodes.length) continue;
    const total = nodes.reduce((t, n) => t + n.n * s.k, 0) + s.gaps[col] * (nodes.length - 1);
    let y = Math.round(s.mid - total / 2);
    for (const n of nodes) {
      pos.set(n.id, { x: s.xs[col]!, y0: y, y1: y + n.n * s.k });
      y += n.n * s.k + s.gaps[col];
    }
  }
  // A band leaves its source in target order and enters its target in source order.
  const outY = new Map<string, number>();
  const inY = new Map<string, number>();
  const start = new Map<(typeof links)[number], number>();
  for (const l of [...links].sort((p, q) => ORDER[p[0]] - ORDER[q[0]] || ORDER[p[1]] - ORDER[q[1]])) {
    const y = outY.get(l[0]) ?? pos.get(l[0])!.y0;
    outY.set(l[0], y + l[2] * s.k);
    start.set(l, y);
  }
  const bands = [...links]
    .sort((p, q) => ORDER[p[1]] - ORDER[q[1]] || ORDER[p[0]] - ORDER[q[0]])
    .map((l) => {
      const b0 = inY.get(l[1]) ?? pos.get(l[1])!.y0;
      inY.set(l[1], b0 + l[2] * s.k);
      const a0 = start.get(l)!;
      const h = l[2] * s.k;
      const x0 = pos.get(l[0])!.x + s.bar;
      const x1 = pos.get(l[1])!.x;
      const xm = (x0 + x1) / 2;
      const d = `M ${x0} ${a0} C ${xm} ${a0}, ${xm} ${b0}, ${x1} ${b0} L ${x1} ${b0 + h} C ${xm} ${b0 + h}, ${xm} ${a0 + h}, ${x0} ${a0 + h} Z`;
      return { d, from: l[0], to: l[1], n: l[2], channel: channelOf(l[0], l[1]) };
    });
  return { items, pos, bands };
}

function Bands({ s }: { s: Spec }) {
  const hover = useFigureHover();
  const { items, pos, bands } = layout(s);
  return (
    <>
      {bands.map((b) => (
        <path
          key={`${b.from}-${b.to}`}
          d={b.d}
          fill={FILL[b.channel]}
          fillOpacity={0.3}
          {...hoverAttrs([b.channel, b.to], KIND[b.channel], hover)}>
          <title>{`${BY_ID[b.from].label} → ${BY_ID[b.to].label}: ${b.n}`}</title>
        </path>
      ))}
      {items.map((n) => {
        const p = pos.get(n.id)!;
        return (
          <rect
            key={n.id}
            x={p.x}
            y={p.y0}
            width={s.bar}
            height={p.y1 - p.y0}
            rx={2}
            fill={FILL[n.tone]}
            {...hoverAttrs(n.col === 1 ? n.id : n.col === 2 ? n.id : undefined, n.col === 1 ? KIND[n.id as Channel] : undefined, hover)}>
            <title>{`${n.label}: ${n.n}`}</title>
          </rect>
        );
      })}
    </>
  );
}

/** A name with its count after it (or under it with `stack`), never on a band. */
function Tag({ x, y, name, n, anchor = "start", stack, size = 14 }: { x: number; y: number; name: string; n: number; anchor?: "start" | "end"; stack?: boolean; size?: number }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={600} fill="var(--uipack-fg)">
      {name}
      {stack ? (
        <tspan x={x} dy={size + 4} fontFamily="var(--uipack-mono)" fontWeight={400} fontSize={size - 1} fill="var(--uipack-muted)">
          {n}
        </tspan>
      ) : (
        <tspan dx={8} fontFamily="var(--uipack-mono)" fontWeight={400} fontSize={size - 1} fill="var(--uipack-muted)">
          {n}
        </tspan>
      )}
    </text>
  );
}

const WIDE: Spec = { xs: [160, 520, 840], k: 3, gaps: [0, 32, 24], mid: 256, bar: 12 };

function Wide() {
  const { pos, items } = layout(WIDE);
  const at = (id: string) => pos.get(id)!;
  return (
    <>
      <Lane x={96} w={152} y={32} title="Opened" />
      <Lane x={456} w={152} y={32} title="Channel" />
      <Lane x={776} w={152} y={32} title="Outcome" />
      <Bands s={WIDE} />
      <Tag x={148} y={(at("all").y0 + at("all").y1) / 2 + 5} name="Tickets" n={100} anchor="end" />
      {items
        .filter((n) => n.col === 1)
        .map((n) => (
          <Tag key={n.id} x={at(n.id).x - 8} y={at(n.id).y0 - 8} name={n.label} n={n.n} anchor="end" />
        ))}
      {items
        .filter((n) => n.col === 2)
        .map((n) => (
          <Tag key={n.id} x={at(n.id).x + 24} y={(at(n.id).y0 + at(n.id).y1) / 2 + 5} name={n.label} n={n.n} />
        ))}
    </>
  );
}

// Narrow: drop the first column, label channels on the left and outcomes on the right.
const NARROW: Spec = { xs: [undefined, 104, 212], k: 4, gaps: [0, 24, 16], mid: 280, bar: 12 };

function Narrow() {
  const { pos, items } = layout(NARROW);
  const at = (id: string) => pos.get(id)!;
  return (
    <>
      <text x={16} y={32} fontSize={13} fontFamily="var(--uipack-mono)" letterSpacing=".06em" fill="var(--uipack-muted)">
        100 TICKETS
      </text>
      <Bands s={NARROW} />
      {items
        .filter((n) => n.col === 1)
        .map((n) => {
          const p = at(n.id);
          return <Tag key={n.id} x={92} y={(p.y0 + p.y1) / 2 - 4} name={n.label} n={n.n} anchor="end" stack size={15} />;
        })}
      {items
        .filter((n) => n.col === 2)
        .map((n) => {
          const p = at(n.id);
          return <Tag key={n.id} x={236} y={(p.y0 + p.y1) / 2 - 4} name={n.short ?? n.label} n={n.n} stack size={14} />;
        })}
    </>
  );
}

export function FlowVolumesFigure({ number }: { number: string }) {
  return (
    <Figure
      number={number}
      eyebrow="Flow volumes"
      title="Most tickets are solved on the first reply"
      caption="Notice that thickness is the count: each band is as wide as the tickets it carries, and the channel colour runs through to the outcome. Labels sit beside the bars, never on a band; solid bars are solved, grey ones are not."
      legend={[
        { label: "Chat", kind: "request" },
        { label: "Email", kind: "change" },
        { label: "Phone", kind: "response" },
      ]}
      viewBox="0 0 1120 464"
      narrow={<Narrow />}
      narrowViewBox="0 0 360 520"
      alt="A Sankey diagram of 100 support tickets. 55 arrive by chat, 30 by email and 15 by phone. 20 are solved by the bot, all from chat; 50 are solved on the first reply (25 chat, 15 email, 10 phone); 18 are escalated (6 chat, 8 email, 4 phone); 12 have no reply yet (4 chat, 7 email, 1 phone).">
      <Wide />
    </Figure>
  );
}
