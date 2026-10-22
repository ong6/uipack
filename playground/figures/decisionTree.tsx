import { Bus, Connector, Defs, Figure, Label, Node, Packet, busStub, type Point } from "../../src";

// A two-level decision tree: one question at the root, three answers, one of
// which is a second question with three answers of its own. Elbow connectors,
// a label on every branch, accent leaves for the outcomes. Ported from the
// decision-tree figure in the notes site, with neutral content.

const KEY = "key";
const QUERY = "query";
const FILES = "files";
const ONE = "one";
const MANY = "many";
const LOG = "log";

// ── Wide ────────────────────────────────────────────────────────────────
const root = { x: 448, y: 24, w: 224, h: 56 };
const level = (cx: number) => ({ x: cx - 152, y: 160, w: 304, h: 72 });
const cache = level(200);
const size = level(560);
const objects = level(920);
const leaf = (cx: number) => ({ x: cx - 128, y: 344, w: 256, h: 72 });
const relational = leaf(272);
const sharded = leaf(560);
const eventLog = leaf(848);

const elbow = (x0: number, y0: number, mid: number, x1: number, y1: number): Point[] =>
  x0 === x1 ? [[x0, y0], [x1, y1]] : [[x0, y0], [x0, mid], [x1, mid], [x1, y1]];

function Wide() {
  const id = "tree";
  const toCache = elbow(560, root.y + root.h, 120, 200, cache.y);
  const toSize = elbow(560, root.y + root.h, 120, 560, size.y);
  const toObjects = elbow(560, root.y + root.h, 120, 920, objects.y);
  const second = (x: number) => elbow(560, size.y + size.h, 288, x, relational.y);
  return (
    <>
      <Defs id={id} />
      <Node {...root} label="How is it read?" icon="service" flow={[KEY, QUERY, FILES]} hint="Start from the access pattern, not the product" />

      <Connector points={toCache} defs={id} kind="accent" flow={KEY} />
      <Packet points={toCache} kind="accent" dur={2} r={4} flow={KEY} />
      <Label x={380} y={112} text="by key, very often" anchor="middle" />
      <Connector points={toSize} defs={id} kind="request" flow={QUERY} />
      <Packet points={toSize} kind="request" dur={1.4} delay={-0.4} r={4} flow={QUERY} />
      <Label x={576} y={144} text="by query" />
      <Connector points={toObjects} defs={id} kind="accent" flow={FILES} />
      <Packet points={toObjects} kind="accent" dur={2} delay={-1} r={4} flow={FILES} />
      <Label x={740} y={112} text="as whole files" anchor="middle" />

      <Node {...cache} label="Key-value cache" sub="in memory · expires" icon="cache" accent flow={KEY} hint="Fast reads of the same keys; losing it is fine" />
      <Node {...size} label="How much data?" sub="now and in a year" icon="chart" flow={[QUERY, ONE, MANY, LOG]} hint="A second question only on this branch" />
      <Node {...objects} label="Object store" sub="blobs · by path" icon="blob" accent flow={FILES} hint="Large files read whole, never queried" />

      {[
        [relational, ONE, "fits one machine", 0],
        [sharded, MANY, "outgrows one", 1],
        [eventLog, LOG, "append-only", 2],
      ].map(([b, flow, text, i]) => {
        const box = b as typeof relational;
        const pts = second(box.x + box.w / 2);
        const x = box.x + box.w / 2;
        return (
          <g key={flow as string}>
            <Connector points={pts} defs={id} kind="accent" flow={[QUERY, flow as string]} />
            <Packet points={pts} kind="accent" dur={1.8} delay={-(i as number) * 0.6} r={4} flow={[QUERY, flow as string]} />
            <Label x={x === 560 ? x + 16 : x} y={x === 560 ? 320 : 280} text={text as string} anchor={x === 560 ? "start" : "middle"} />
          </g>
        );
      })}
      <Node {...relational} label="Relational database" sub="one primary · joins" icon="db" accent flow={ONE} hint="One machine, transactions and joins" />
      <Node {...sharded} label="Sharded store" sub="partitioned by key" icon="region" accent flow={MANY} hint="Spread across machines once one is not enough" />
      <Node {...eventLog} label="Event log" sub="ordered · replayable" icon="queue" accent flow={LOG} hint="Writes only append; readers replay from an offset" />
    </>
  );
}

// ── Narrow: an indented outline, one trunk per question ─────────────────
const NH = 48;
const rows = [
  { y: 104, x: 72, label: "Key-value cache", branch: "by key, very often", icon: "cache", flow: KEY, leaf: true },
  { y: 192, x: 72, label: "How much data?", branch: "by query", icon: "chart", flow: QUERY, leaf: false },
  { y: 280, x: 136, label: "Relational DB", branch: "fits one machine", icon: "db", flow: ONE, leaf: true },
  { y: 368, x: 136, label: "Sharded store", branch: "outgrows one", icon: "region", flow: MANY, leaf: true },
  { y: 456, x: 136, label: "Event log", branch: "append-only", icon: "queue", flow: LOG, leaf: true },
  { y: 544, x: 72, label: "Object store", branch: "as whole files", icon: "blob", flow: FILES, leaf: true },
] as const;

function Narrow() {
  const id = "tree-n";
  const outer = rows.filter((r) => r.x === 72);
  const inner = rows.filter((r) => r.x === 136);
  const trunk = { axis: "v" as const, at: 40, stubs: outer.map((r) => ({ at: r.y + NH / 2, to: r.x, arrow: true, flow: r.flow })) };
  const trunk2 = { axis: "v" as const, at: 104, stubs: inner.map((r) => ({ at: r.y + NH / 2, to: r.x, arrow: true, flow: r.flow })) };
  return (
    <>
      <Defs id={id} />
      <Node x={16} y={16} w={328} h={48} label="How is it read?" icon="service" size={15} flow={[KEY, QUERY, FILES]} />
      <Bus {...trunk} from={64} to={trunk.stubs[trunk.stubs.length - 1].at} defs={id} kind="accent" />
      <Bus {...trunk2} from={192 + NH} to={trunk2.stubs[trunk2.stubs.length - 1].at} defs={id} kind="accent" />
      {[...trunk.stubs, ...trunk2.stubs].map((s, i) => {
        const p = busStub(i < trunk.stubs.length ? trunk : trunk2, s);
        return <Packet key={i} points={p} kind="accent" dur={1.2} delay={-i * 0.3} r={4} flow={s.flow} />;
      })}
      {rows.map((r) => (
        <g key={r.label}>
          <Label x={r.x} y={r.y - 8} text={r.branch} size={12} />
          <Node x={r.x} y={r.y} w={344 - r.x} h={NH} label={r.label} icon={r.icon} accent={r.leaf} size={15} flow={r.flow} />
        </g>
      ))}
    </>
  );
}

export function DecisionTreeFigure({ number }: { number: string }) {
  return (
    <Figure
      number={number}
      eyebrow="Decision tree"
      title="Where should this data live?"
      caption="Notice that only one branch asks a second question; the others answer at once. Every branch is labelled with the answer that leads down it, and every outcome is an accent leaf."
      legend={[
        { label: "Next question", kind: "request" },
        { label: "Leads to an answer", kind: "accent" },
      ]}
      viewBox="0 0 1120 440"
      narrow={<Narrow />}
      narrowViewBox="0 0 360 608"
      alt="A decision tree. How is the data read? By key, very often: a key-value cache. As whole files: an object store. By query: a second question, how much data? If it fits one machine, a relational database; if it outgrows one, a sharded store; if it is append-only, an event log.">
      <Wide />
    </Figure>
  );
}
