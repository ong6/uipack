import { Bus, Connector, Defs, Figure, Group, Label, Node, Packet, busStub, type Point } from "../../src";

// One request split across parallel workers by a bus, the partial results
// merged by a second bus, then a two-way branch on the merged result. Ported
// from the fan-out query flow on the homepage and the fan-in figure in the
// notes site, with neutral content.

const ASK = "ask";
const PART = "partial";
const OK = "enough";
const WIDER = "wider";

const SHARDS = ["Shard 1", "Shard 2", "Shard 3", "Shard 4"];

// ── Wide ────────────────────────────────────────────────────────────────
const CY = 216;
const request = { x: 16, y: CY - 32, w: 152, h: 64 };
const split = { x: 208, y: CY - 32, w: 160, h: 64 };
const OUT = 400; // fan-out trunk
const worker = { x: 448, w: 168, h: 48 };
const wy = (i: number) => 96 + i * 80; // centres 96, 176, 256, 336
const IN = 656; // fan-in trunk
const merge = { x: 696, y: CY - 32, w: 160, h: 64 };
const FORK = 888;
const answer = { x: 920, y: 104, w: 184, h: 64 };
const wider = { x: 920, y: 264, w: 184, h: 64 };

function Wide() {
  const id = "fan";
  const out = {
    axis: "v" as const,
    at: OUT,
    stubs: [{ at: CY, to: split.x + split.w, flow: ASK }, ...SHARDS.map((_, i) => ({ at: wy(i), to: worker.x, arrow: true, flow: [ASK, `s${i}`] }))],
  };
  const inn = {
    axis: "v" as const,
    at: IN,
    stubs: [...SHARDS.map((_, i) => ({ at: wy(i), to: worker.x + worker.w, flow: [PART, `s${i}`] })), { at: CY, to: merge.x, arrow: true, flow: PART }],
  };
  const toSplit: Point[] = [
    [request.x + request.w, CY],
    [split.x, CY],
  ];
  const fanOut = (i: number): Point[] => [busStub(out, out.stubs[0])[1], [OUT, CY], [OUT, wy(i)], [worker.x, wy(i)]];
  const fanIn = (i: number): Point[] => [[worker.x + worker.w, wy(i)], [IN, wy(i)], [IN, CY], [merge.x, CY]];
  const toAnswer: Point[] = [[merge.x + merge.w, CY], [FORK, CY], [FORK, answer.y + 32], [answer.x, answer.y + 32]];
  const toWider: Point[] = [[merge.x + merge.w, CY], [FORK, CY], [FORK, wider.y + 32], [wider.x, wider.y + 32]];
  return (
    <>
      <Defs id={id} />
      <Node {...request} label="Request" sub="one search" icon="user" flow={ASK} hint="One question from one caller" />
      <Connector points={toSplit} defs={id} kind="request" flow={ASK} />
      <Packet points={toSplit} kind="request" dur={1.2} r={4} flow={ASK} />
      <Node {...split} label="Split" sub="one per shard" icon="gateway" flow={ASK} hint="Sends the same query to every shard at once" />

      <Group x={432} y={32} w={200} h={352} title="Parallel · 4 shards" variant="dashed" flow={[ASK, PART]} />
      <Bus {...out} from={wy(0)} to={wy(SHARDS.length - 1)} defs={id} kind="request" />
      {SHARDS.map((label, i) => (
        <Node key={label} x={worker.x} y={wy(i) - worker.h / 2} w={worker.w} h={worker.h} label={label} sub="top 10 matches" icon="db" flow={[ASK, PART, `s${i}`]} hint="Searches only its own slice of the data" />
      ))}
      <Bus {...inn} from={wy(0)} to={wy(SHARDS.length - 1)} defs={id} kind="response" />
      {SHARDS.map((_, i) => (
        <g key={i}>
          <Packet points={fanOut(i)} kind="request" dur={2} delay={-i * 0.25} r={4} flow={ASK} />
          <Packet points={fanIn(i)} kind="response" dur={2} delay={-1 - i * 0.25} r={4} flow={PART} />
        </g>
      ))}

      <Node {...merge} label="Merge" sub="rank · dedupe" icon="service" accent flow={[PART, OK, WIDER]} hint="Waits for every shard, then keeps the best results" />
      <Connector points={toAnswer} defs={id} kind="accent" flow={OK} />
      <Packet points={toAnswer} kind="accent" dur={1.6} r={4} flow={OK} />
      <Label x={876} y={128} text="enough" anchor="end" accent />
      <Connector points={toWider} defs={id} kind="change" flow={WIDER} />
      <Packet points={toWider} kind="change" dur={1.6} delay={-0.8} r={4} flow={WIDER} />
      <Label x={876} y={312} text="too few" anchor="end" />
      <Node {...answer} label="Answer" sub="best 10 overall" icon="doc" flow={OK} hint="Returned as soon as the merge has enough" />
      <Node {...wider} label="Search wider" sub="relax the filters" icon="warning" dashed flow={WIDER} hint="Too few results: try again with looser filters" />
    </>
  );
}

// ── Narrow: top to bottom, four slim workers in a row ───────────────────
const NC = 176;
const xs = [56, 136, 216, 296];
const W = { y: 232, w: 72, h: 48 };

function Narrow() {
  const id = "fan-n";
  const out = { axis: "h" as const, at: 176, stubs: [{ at: NC, to: 144 }, ...xs.map((x) => ({ at: x, to: W.y, arrow: true }))] };
  const inn = { axis: "h" as const, at: 320, stubs: [...xs.map((x) => ({ at: x, to: W.y + W.h })), { at: NC, to: 360, arrow: true }] };
  const toSplit: Point[] = [
    [NC, 64],
    [NC, 96],
  ];
  const toAnswer: Point[] = [[NC, 408], [NC, 432], [92, 432], [92, 480]];
  const toWider: Point[] = [[NC, 408], [NC, 432], [264, 432], [264, 480]];
  return (
    <>
      <Defs id={id} />
      <Node x={56} y={16} w={240} h={48} label="Request" sub="one search" icon="user" size={15} subSize={12} flow={ASK} />
      <Connector points={toSplit} defs={id} kind="request" flow={ASK} />
      <Packet points={toSplit} kind="request" dur={1.2} r={4} flow={ASK} />
      <Node x={56} y={96} w={240} h={48} label="Split" sub="one per shard" icon="gateway" size={15} subSize={12} flow={ASK} />
      <Group x={8} y={200} w={344} h={96} variant="dashed" flow={[ASK, PART]} />
      <Bus {...out} from={xs[0]} to={xs[3]} defs={id} kind="request" flow={ASK} />
      {xs.map((x, i) => (
        <Node key={x} x={x - W.w / 2} y={W.y} w={W.w} h={W.h} label={`Shard ${i + 1}`} size={13} flow={[ASK, PART]} />
      ))}
      <Bus {...inn} from={xs[0]} to={xs[3]} defs={id} kind="response" flow={PART} />
      {xs.map((x, i) => (
        <g key={x}>
          <Packet points={[[NC, 144], [NC, 176], [x, 176], [x, W.y]]} kind="request" dur={2} delay={-i * 0.25} r={4} flow={ASK} />
          <Packet points={[[x, W.y + W.h], [x, 320], [NC, 320], [NC, 360]]} kind="response" dur={2} delay={-1 - i * 0.25} r={4} flow={PART} />
        </g>
      ))}
      <Node x={56} y={360} w={240} h={48} label="Merge" sub="rank · dedupe" icon="service" accent size={15} subSize={12} flow={[PART, OK, WIDER]} />
      <Connector points={toAnswer} defs={id} kind="accent" flow={OK} />
      <Packet points={toAnswer} kind="accent" dur={1.4} r={4} flow={OK} />
      <Connector points={toWider} defs={id} kind="change" flow={WIDER} />
      <Packet points={toWider} kind="change" dur={1.4} delay={-0.7} r={4} flow={WIDER} />
      <Label x={104} y={464} text="enough" size={12} accent />
      <Label x={276} y={464} text="too few" size={12} />
      <Node x={16} y={480} w={152} h={48} label="Answer" icon="doc" size={15} flow={OK} />
      <Node x={184} y={480} w={160} h={48} label="Search wider" size={14} dashed flow={WIDER} />
    </>
  );
}

export function FanOutFanInFigure({ number }: { number: string }) {
  return (
    <Figure
      number={number}
      eyebrow="Fan-out and fan-in"
      title="Ask every shard at once, merge once"
      caption="Notice the two buses: the one on the left splits a single request into four, the one on the right joins four partial results into one. The merge waits for all of them, then branches on what it got."
      legend={[
        { label: "Request", kind: "request" },
        { label: "Partial result", kind: "response" },
        { label: "Merged", kind: "accent" },
        { label: "Retry", kind: "change" },
      ]}
      viewBox="0 0 1120 416"
      narrow={<Narrow />}
      narrowViewBox="0 0 360 544"
      alt="A request goes to a split step, which sends it over a bus to four shards searched in parallel. A second bus joins their partial results into a merge step. If the merge has enough results it returns an answer; if too few, it searches wider.">
      <Wide />
    </Figure>
  );
}
