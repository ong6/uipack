import { Connector, Defs, Figure, Group, Label, Node, Packet, type Point } from "../../src";

// Nested groups: what runs inside what. Ported from the structure of the notes'
// harness-architectures figure (dashed panels holding solid groups, stacked blank
// dashed nodes for "many of these") and the homepage's database > policy nesting.
// Dashed = a boundary you cross; solid = a unit you deploy or own.

type Box = { x: number; y: number; w: number; h: number };

/** A node with two blank dashed outlines behind it: many identical instances. */
function Replicas({ box, step = 8, ...node }: { box: Box; step?: number } & Omit<Parameters<typeof Node>[0], keyof Box>) {
  return (
    <>
      <Node x={box.x + step * 2} y={box.y + step * 2} w={box.w} h={box.h} label="" dashed flow={node.flow} />
      <Node x={box.x + step} y={box.y + step} w={box.w} h={box.h} label="" dashed flow={node.flow} />
      <Node {...box} {...node} />
    </>
  );
}

// ── Wide ──────────────────────────────────────────────────────────────────
const CY = 212;
const row = (x: number, w: number): Box => ({ x, y: CY - 28, w, h: 56 });
const clients = row(24, 144);
const lb = row(224, 144);
const api = row(432, 136);
const worker = row(616, 136);
const policy = row(872, 168);
const tables = { x: 872, y: 272, w: 168, h: 48 };

function Wide() {
  const id = "nested";
  const hop = (a: Box, b: Box): Point[] => [[a.x + a.w, CY], [b.x, CY]];
  const inLb = hop(clients, lb);
  const inApi = hop(lb, api);
  const job = hop(api, worker);
  const query = hop(worker, policy);
  const read: Point[] = [[policy.x + policy.w / 2, policy.y + policy.h], [policy.x + policy.w / 2, tables.y]];
  return (
    <>
      <Defs id={id} />
      <Node {...clients} label="Clients" icon="client" flow="request" hint="Outside every boundary: they only see the load balancer" />

      <Group x={200} y={24} w={896} h={376} title="Region" variant="dashed" hint="A boundary: everything inside fails over together">
        <Node {...lb} label="Load balancer" size={13} icon="gateway" flow="request" hint="The only way into the region" />

        <Group x={392} y={80} w={408} h={288} title="Cluster" hint="A unit you deploy and upgrade as one">
          <Group x={408} y={128} w={376} h={208} title="Namespace · app" variant="dashed" hint="A boundary inside the cluster: its own quotas and access">
            <Replicas box={api} label="API" sub="3 replicas" icon="service" flow={["request", "job"]} hint="Three identical copies behind the load balancer" />
            <Replicas box={worker} label="Worker" sub="3 replicas" icon="tool" flow={["job", "query"]} hint="Picks up jobs; any copy can take any job" />
            <Label x={424} y={312} text="dashed outlines behind a node: more copies of it" size={11} />
          </Group>
        </Group>

        <Group x={840} y={80} w={232} h={288} title="Database" hint="A unit you own: backups, upgrades and access are its own">
          <Group x={856} y={128} w={200} h={216} title="Tenant schema" titleSize={13} hint="One schema per tenant, inside the database">
            <Node {...policy} label="Row policy" sub="tenant = caller" icon="lock" accent flow="query" hint="Every query passes it; a tenant only ever sees its own rows" />
            <Node {...tables} label="Tables" sub="orders · users" icon="db" size={13} flow="query" />
          </Group>
        </Group>
      </Group>

      <Connector points={inLb} defs={id} kind="request" flow="request" />
      <Packet points={inLb} kind="request" dur={1.4} flow="request" r={4} />
      <Connector points={inApi} defs={id} kind="request" flow="request" />
      <Packet points={inApi} kind="request" dur={1.4} delay={-0.5} flow="request" r={4} />
      <Connector points={job} defs={id} kind="change" flow="job" />
      <Packet points={job} kind="change" dur={1.4} delay={-0.2} flow="job" r={4} />
      <Connector points={query} defs={id} kind="request" flow="query" />
      <Packet points={query} kind="request" dur={1.6} delay={-0.8} flow="query" r={4} />
      <Connector points={read} defs={id} kind="request" flow="query" />
      <Label x={814} y={CY - 10} text="query" anchor="middle" />
    </>
  );
}

// ── Narrow: the same nesting, stacked ─────────────────────────────────────
const NX = 56;
const NW = 248;
// The spine runs right of centre so it never crosses a centred group title or a dashed one at the left.
const SPINE = 264;

function Narrow() {
  const id = "nested-n";
  const n = (y: number, h = 48): Box => ({ x: NX, y, w: NW, h });
  const c = { x: 40, y: 16, w: 280, h: 48 };
  const lbN = n(128);
  const apiN = { ...n(280), w: NW - 16 };
  const workerN = { ...n(376), w: NW - 16 };
  const policyN = n(584);
  const tablesN = n(656, 44);
  const down = (a: Box, b: Box, x = SPINE): Point[] => [[x, a.y + a.h], [x, b.y]];
  return (
    <>
      <Defs id={id} />
      <Node {...c} label="Clients" icon="client" flow="request" />
      <Group x={8} y={88} w={344} h={648} title="Region" variant="dashed">
        <Node {...lbN} label="Load balancer" icon="gateway" flow="request" />
        <Group x={24} y={200} w={312} h={280} title="Cluster">
          <Group x={40} y={240} w={280} h={224} title="Namespace · app" variant="dashed">
            <Replicas box={apiN} label="API" sub="3 replicas" icon="service" flow={["request", "job"]} />
            <Replicas box={workerN} label="Worker" sub="3 replicas" icon="tool" flow={["job", "query"]} />
          </Group>
        </Group>
        <Group x={24} y={496} w={312} h={224} title="Database">
          <Group x={40} y={536} w={280} h={176} title="Tenant schema" titleSize={13}>
            <Node {...policyN} label="Row policy" sub="tenant = caller" icon="lock" accent flow="query" />
            <Node {...tablesN} label="Tables" sub="orders · users" icon="db" flow="query" />
          </Group>
        </Group>
      </Group>
      <Connector points={down(c, lbN)} defs={id} kind="request" flow="request" />
      <Packet points={down(c, lbN)} kind="request" dur={1.4} flow="request" r={4} />
      <Connector points={down(lbN, apiN)} defs={id} kind="request" flow="request" />
      <Connector points={down(apiN, workerN)} defs={id} kind="change" flow="job" />
      <Connector points={down(workerN, policyN)} defs={id} kind="request" flow="query" />
      <Packet points={down(workerN, policyN)} kind="request" dur={1.8} delay={-0.6} flow="query" r={4} />
      <Connector points={down(policyN, tablesN)} defs={id} kind="request" flow="query" />
    </>
  );
}

export function NestedGroupsFigure({ number }: { number: string }) {
  return (
    <Figure
      number={number}
      eyebrow="Nested groups"
      title="Boundaries hold units, units hold copies"
      caption="Notice the alternation: dashed boxes are boundaries you cross (region, namespace), solid boxes are units you deploy or own (cluster, database, schema), and dashed outlines behind a node mean many identical copies."
      legend={[
        { label: "Request", kind: "request" },
        { label: "Job", kind: "change" },
      ]}
      viewBox="0 0 1120 424"
      narrow={<Narrow />}
      narrowViewBox="0 0 360 752"
      alt="Clients reach a load balancer inside a region. The region holds a cluster, which holds an app namespace with three API replicas and three worker replicas, and a database, which holds a tenant schema with a row policy in front of its tables. Every worker query passes the row policy.">
      <Wide />
    </Figure>
  );
}
