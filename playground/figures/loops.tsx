import { Connector, Defs, Figure, Label, Node, Packet, type Point } from "../../src";

// Two kinds of loop on one row: a self-loop over the step that repeats, and
// return paths under the row back to an earlier step (a short one on failure,
// a long dashed one that starts the next round). Ported from the loop figures
// in the notes site, with neutral content.

const FWD = "forward";
const REPEAT = "repeat";
const RETRY = "retry";
const ROUND = "round";

// ── Wide ────────────────────────────────────────────────────────────────
const Y = 120;
const H = 72;
const CY = Y + H / 2;
const change = { x: 48, y: Y, w: 200, h: H };
const build = { x: 312, y: Y, w: 208, h: H };
const test = { x: 584, y: Y, w: 200, h: H };
const release = { x: 848, y: Y, w: 224, h: H };

const hop = (a: { x: number; w: number }, b: { x: number }): Point[] => [
  [a.x + a.w, CY],
  [b.x, CY],
];
const selfLoop: Point[] = [
  [464, Y],
  [464, 64],
  [368, 64],
  [368, Y],
];
const retry: Point[] = [
  [648, Y + H],
  [648, 232],
  [456, 232],
  [456, Y + H],
];
const nextRound: Point[] = [
  [960, Y + H],
  [960, 280],
  [148, 280],
  [148, Y + H],
];

function Wide() {
  const id = "loops";
  return (
    <>
      <Defs id={id} />
      <Node {...change} label="Change" sub="one small edit" icon="doc" flow={[FWD, ROUND]} hint="Where every round starts" />
      <Node
        {...build}
        label="Build"
        sub="compile · bundle"
        icon="tool"
        flow={[FWD, REPEAT, RETRY]}
        hint="Repeats on its own while you edit"
      />
      <Node
        {...test}
        label="Test"
        sub="unit · end to end"
        icon="lock"
        flow={[FWD, RETRY]}
        hint="A failure goes straight back to Build"
      />
      <Node
        {...release}
        label="Release"
        sub="ship · watch"
        icon="cloud"
        accent
        flow={[FWD, ROUND]}
        hint="What you learn here starts the next round"
      />

      {[hop(change, build), hop(build, test), hop(test, release)].map((p, i) => (
        <g key={i}>
          <Connector points={p} defs={id} kind="request" flow={FWD} />
          <Packet points={p} kind="request" dur={1.4} delay={-i * 0.45} r={4} flow={FWD} />
        </g>
      ))}

      <Connector points={selfLoop} defs={id} kind="change" flow={REPEAT} />
      <Packet points={selfLoop} kind="change" dur={1.8} delay={-0.6} r={4} flow={REPEAT} />
      <Label x={416} y={52} text="on every save" anchor="middle" />

      <Connector points={retry} defs={id} kind="change" flow={RETRY} />
      <Packet points={retry} kind="change" dur={2} delay={-1} r={4} flow={RETRY} />
      <Label x={552} y={252} text="tests fail" anchor="middle" />

      <Connector points={nextRound} defs={id} kind="response" dashed flow={ROUND} />
      <Packet points={nextRound} kind="response" dur={3.6} delay={-1.4} r={4} flow={ROUND} />
      <Label x={304} y={300} text="next round" anchor="middle" />
    </>
  );
}

// ── Narrow: a spine, the self-loop on the right, both returns on the left ──
const NX = 88;
const NW = 224;
const NH = 64;
const ny = (i: number) => 40 + i * 104;
const steps = [
  { label: "Change", sub: "one small edit", icon: "doc", flow: [FWD, ROUND] },
  { label: "Build", sub: "repeats on save", icon: "tool", flow: [FWD, REPEAT, RETRY] },
  { label: "Test", sub: "unit · end to end", icon: "lock", flow: [FWD, RETRY] },
  { label: "Release", sub: "ship · watch", icon: "cloud", flow: [FWD, ROUND], accent: true },
] as const;

function Narrow() {
  const id = "loops-n";
  const cx = NX + NW / 2;
  const loop: Point[] = [
    [NX + NW, ny(1) + 20],
    [344, ny(1) + 20],
    [344, ny(1) + 44],
    [NX + NW, ny(1) + 44],
  ];
  const back: Point[] = [
    [NX, ny(2) + 32],
    [56, ny(2) + 32],
    [56, ny(1) + 40],
    [NX, ny(1) + 40],
  ];
  const round: Point[] = [
    [cx, ny(3) + NH],
    [cx, 464],
    [24, 464],
    [24, ny(0) + 32],
    [NX, ny(0) + 32],
  ];
  return (
    <>
      <Defs id={id} />
      {steps.map((s, i) => {
        const into: Point[] = [
          [cx, ny(i) - 40],
          [cx, ny(i)],
        ];
        return (
          <g key={s.label}>
            {i > 0 ? (
              <>
                <Connector points={into} defs={id} kind="request" flow={FWD} />
                <Packet points={into} kind="request" dur={1.4} delay={-i * 0.35} r={4} flow={FWD} />
              </>
            ) : null}
            <Node
              x={NX}
              y={ny(i)}
              w={NW}
              h={NH}
              label={s.label}
              sub={s.sub}
              icon={s.icon}
              accent={"accent" in s}
              flow={[...s.flow]}
              size={15}
              subSize={12}
            />
          </g>
        );
      })}
      <Connector points={loop} defs={id} kind="change" flow={REPEAT} />
      <Packet points={loop} kind="change" dur={1.6} r={4} flow={REPEAT} />
      <Connector points={back} defs={id} kind="change" flow={RETRY} />
      <Packet points={back} kind="change" dur={1.8} delay={-0.8} r={4} flow={RETRY} />
      <Connector points={round} defs={id} kind="response" dashed flow={ROUND} />
      <Packet points={round} kind="response" dur={4} delay={-1.5} r={4} flow={ROUND} />
      <Label x={cx} y={488} text="next round" anchor="middle" size={12} />
    </>
  );
}

export function LoopsFigure({ number }: { number: string }) {
  return (
    <Figure
      number={number}
      eyebrow="Loops"
      title="Short loops run often, the long one starts a round"
      caption="Notice the two shapes: the self-loop over Build is drawn on its own node, and the returns run under the row. The shortest return is the most frequent; the dashed one is the slow, deliberate one."
      legend={[
        { label: "Forward", kind: "request" },
        { label: "Repeat or retry", kind: "change" },
        { label: "Next round", kind: "response" },
      ]}
      viewBox="0 0 1120 320"
      narrow={<Narrow />}
      narrowViewBox="0 0 360 504"
      alt="Four steps in a row: change, build, test and release. A self-loop over Build repeats it on every save; a failing test returns to Build; a dashed path from Release back to Change starts the next round."
    >
      <Wide />
    </Figure>
  );
}
