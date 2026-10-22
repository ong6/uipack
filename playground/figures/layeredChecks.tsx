import type { ReactNode } from "react";
import { Badge, Connector, Defs, Figure, Group, Label, Node, Packet, useFontFloor, type Point } from "../../src";

// Layered checks: a sieve. Ported from the structure of the notes'
// verification-sieve figure: numbered layers, one line per item through walls
// with gaps, each item stopped at a different wall, one slipping through to
// the accent, a check on one of the checks, and an outer frame. Walls and the
// caught marks are drawn here from the theme's variables; there is no Wall part.

/** Text that follows the figure's font floor, for the layer headings. */
function Txt({ x, y, size, children, mono, bold, anchor = "middle", muted }: { x: number; y: number; size: number; children: ReactNode; mono?: boolean; bold?: boolean; anchor?: "start" | "middle" | "end"; muted?: boolean }) {
  const fs = useFontFloor(size);
  return (
    <text x={x} y={y} fontSize={fs} fontFamily={mono ? "var(--uipack-mono)" : "var(--uipack-sans)"} fontWeight={bold ? 600 : 400} textAnchor={anchor} fill="currentColor" fillOpacity={muted ? 0.72 : 1}>
      {children}
    </text>
  );
}

/** A wall: solid slabs with a gap wherever an item passes. `axis` "v" stands up, "h" lies across. */
function Wall({ at, from, to, holes, axis, t = 16, gap = 9 }: { at: number; from: number; to: number; holes: number[]; axis: "v" | "h"; t?: number; gap?: number }) {
  const segs: [number, number][] = [];
  let s = from;
  for (const c of [...holes].sort((a, b) => a - b)) {
    segs.push([s, c - gap]);
    s = c + gap;
  }
  segs.push([s, to]);
  return (
    <g data-figure-part="wall">
      {segs.map(([a, b]) => {
        const r = axis === "v" ? { x: at - t / 2, y: a, width: t, height: b - a } : { x: a, y: at - t / 2, width: b - a, height: t };
        return <rect key={a} {...r} rx={2} fill="var(--uipack-surface-raised)" stroke="currentColor" strokeOpacity={0.55} strokeWidth={1.25} />;
      })}
    </g>
  );
}

/** An item stopped against a wall. */
const Caught = ({ x, y, r = 5 }: { x: number; y: number; r?: number }) => (
  <path d={`M${x},${y - r} L${x + r},${y} L${x},${y + r} L${x - r},${y} z`} fill="var(--uipack-token-change)" fillOpacity={0.6} />
);

const LAYERS: [string, string][] = [
  ["Lint and types", "style · types"],
  ["Unit tests", "logic"],
  ["Code review", "design · intent"],
  ["Staging", "integration"],
  ["Canary", "regressions"],
];
// The wall (1-based) that stops each item, top to bottom; 0 slips through every wall.
const STOPS = [2, 4, 1, 0, 3, 5];
const SLIP = "slip";
const holesAt = (k: number, at: number[]) => at.filter((_, i) => STOPS[i] === 0 || STOPS[i] > k + 1);

// ── Wide: left to right ───────────────────────────────────────────────────
const WX = [272, 400, 528, 656, 784];
const LANES = STOPS.map((_, i) => 200 + i * 40);
const TOP = 168;
const BOT = 432;
const IN_X = 200;
const RB = { x: 880, y: LANES[3] - 32, w: 192, h: 64 };
const SPEED = 150; // units per second, so every item moves at one pace

function Wide() {
  const id = "sieve";
  const end = (stop: number) => (stop === 0 ? RB.x : WX[stop - 1] - 6);
  const loop: Point[] = [[448, 512], [400, 512], [400, BOT + 2]];
  return (
    <>
      <Defs id={id} />
      <Group x={16} y={16} w={1088} h={560} title="Every release ships behind a flag" variant="dashed" hint="The last layer: whatever slips through can be switched off" />
      {LAYERS.map(([name, sub], i) => (
        <g key={name}>
          <Badge cx={WX[i]} cy={72} text={String(i + 1)} r={12} size={13} />
          <Txt x={WX[i]} y={112} size={15} bold>{name}</Txt>
          <Txt x={WX[i]} y={136} size={13} mono muted>{sub}</Txt>
        </g>
      ))}
      <Node x={48} y={TOP} w={152} h={BOT - TOP} label="Defects" sub="in one release" align="center" dashed hint="Six defects enter; each line is one of them" />
      {STOPS.map((stop, i) => {
        const pts: Point[] = [[IN_X, LANES[i]], [end(stop), LANES[i]]];
        const slip = stop === 0;
        const dur = (end(stop) - IN_X) / SPEED;
        return (
          <g key={i}>
            <Connector points={pts} defs={id} kind={slip ? "accent" : undefined} arrow={slip} flow={slip ? SLIP : undefined} />
            {slip ? (
              <>
                <Packet points={pts} kind="change" dur={dur} flow={SLIP} />
                <Packet points={pts} kind="change" dur={dur} delay={-dur / 2} flow={SLIP} />
              </>
            ) : (
              <>
                <Caught x={end(stop) - 9} y={LANES[i]} />
                {i % 2 ? <Packet points={pts} kind="change" dur={dur} delay={-i * 0.7} trim={[7, 18]} /> : null}
              </>
            )}
          </g>
        );
      })}
      {WX.map((x, k) => (
        <Wall key={x} at={x} from={TOP} to={BOT} axis="v" holes={holesAt(k, LANES)} />
      ))}
      <Node {...RB} label="Roll back" sub="flag off, no deploy" icon="key" accent flow={SLIP} hint="The one defect no layer caught is switched off, not hot-fixed" />
      <Txt x={RB.x} y={RB.y + 104} size={14} anchor="start" mono muted>no layer is complete;</Txt>
      <Txt x={RB.x} y={RB.y + 124} size={14} anchor="start" mono muted>together they are</Txt>

      <Connector points={loop} defs={id} dashed />
      <Node x={448} y={480} w={272} h={64} label="Tests for the tests" sub="mutants each test must kill" icon="chart" dashed hint="Checks one of the checks: a test that never fails is found here" />
      <Badge cx={448} cy={480} text="6" r={12} size={13} />
      <Label x={392} y={472} text="checks layer 2" anchor="end" />
    </>
  );
}

// ── Narrow: top to bottom, the layer names in a column on the right ───────
const MX = STOPS.map((_, i) => 40 + i * 24);
const MY = [136, 216, 296, 448, 528];
const M_IN = 104;
const M_RB = { x: 24, y: 600, w: 168, h: 56 };

function Narrow() {
  const id = "sieve-n";
  const end = (stop: number) => (stop === 0 ? M_RB.y : MY[stop - 1] - 5);
  const TX = 208;
  return (
    <>
      <Defs id={id} />
      <Group x={8} y={8} w={344} h={672} title="Ships behind a flag" variant="dashed" />
      <Node x={24} y={48} w={168} h={M_IN - 48} label="Defects" sub="one release" align="center" dashed />
      {STOPS.map((stop, i) => {
        const pts: Point[] = [[MX[i], M_IN], [MX[i], end(stop)]];
        const slip = stop === 0;
        const dur = (end(stop) - M_IN) / 120;
        return (
          <g key={i}>
            <Connector points={pts} defs={id} kind={slip ? "accent" : undefined} arrow={slip} flow={slip ? SLIP : undefined} />
            {slip ? <Packet points={pts} kind="change" dur={dur} flow={SLIP} r={4} /> : <Caught x={MX[i]} y={end(stop) - 5} r={4} />}
          </g>
        );
      })}
      {MY.map((y, k) => (
        <Wall key={y} at={y} from={24} to={192} axis="h" t={10} gap={7} holes={holesAt(k, MX)} />
      ))}
      {LAYERS.map(([name, sub], i) => (
        <g key={name}>
          <Badge cx={TX + 11} cy={MY[i] - 12} text={String(i + 1)} r={11} size={13} />
          <Txt x={TX + 28} y={MY[i] - 7} size={14} anchor="start" bold>{name}</Txt>
          <Txt x={TX + 28} y={MY[i] + 13} size={12} anchor="start" mono muted>{sub}</Txt>
        </g>
      ))}
      <Node x={208} y={344} w={136} h={56} label="Tests for" sub="the tests" align="center" dashed />
      <Badge cx={208} cy={344} text="6" r={11} size={13} />
      <Connector points={[[208, 372], [184, 372], [184, MY[1] + 6]]} defs={id} dashed />
      <Node {...M_RB} label="Roll back" sub="flag off" icon="key" accent flow={SLIP} />
    </>
  );
}

export function LayeredChecksFigure({ number }: { number: string }) {
  return (
    <Figure
      number={number}
      eyebrow="Layered checks"
      title="Every layer has gaps; together they stop most"
      caption="Notice the gaps: each wall stops one defect and lets the rest through, so the count falls layer by layer. The one line that finds a gap in every wall is the accent, and it ends at the frame round everything: a flag that can switch it off."
      legend={[
        { label: "Defect", kind: "change" },
        { label: "Slipped through", kind: "accent" },
      ]}
      viewBox="0 0 1120 592"
      narrow={<Narrow />}
      narrowViewBox="0 0 360 688"
      alt="Six defects enter on the left and meet five walls in order: lint and types, unit tests, code review, staging and canary. Each wall has gaps and stops one defect. One defect finds a gap in every wall and reaches roll back, inside a frame that says every release ships behind a flag. A sixth layer, tests for the tests, checks the unit-test wall.">
      <Wide />
    </Figure>
  );
}
