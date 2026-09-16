import { Bus, Connector, Defs, Figure, Group, Label, Lane, Node, Packet, busStub, route, type Point } from "../src";

// The overview figure from OpenAI's Habitat post, redrawn with uipack. Three
// lanes, one boxed platform, a CDC row underneath, packets on every path.
// Connector rule: one head per line, in the request direction; responses are
// reversed packets on the same points; bus stubs join with a dot, no head.

const CLIENTS = [
  ["ChatGPT", "client"],
  ["API", "service"],
  ["Codex", "agent"],
  ["Internal services", "queue"],
  ["And more", "more"],
] as const;

const PLATFORM = [
  ["Caching", "Caches"],
  ["ACL policies", "Authorization"],
  ["Placement & residency", "Data residency"],
  ["Encryption", "Data security"],
  ["Isolation", "Multi-tenancy"],
  ["Rate limiting", "Request shaping"],
] as const;

const STORES = [
  ["Azure Cosmos DB", "Online storage", "db"],
  ["Nanobase", "Online storage", "db"],
  ["Valkey", "Caches", "cache"],
  ["Blob storage", "Storage resources", "blob"],
] as const;

const SINKS = ["Databricks", "Rockset", "Kafka", "And more"];

const ID = "habitat";
const READ = "read";
const CDC = "cdc";

export function HabitatWide() {
  const platform = { x: 328, y: 64, w: 600, h: 272 };
  const client = { x: 24, w: 176, h: 48, step: 56, y0: 96 };
  const store = { x: 1024, w: 200, h: 48, step: 64, y0: 96 };
  const busX = 232; // client bus
  const storeBusX = 1000;
  const trunkY = 200; // where the client bus enters the platform
  const cdc = { x: 528, y: 384, w: 200, h: 56 };

  const clientY = (i: number) => client.y0 + i * client.step + client.h / 2; // 120, 176, 232, 288, 344
  const storeY = (i: number) => store.y0 + i * store.step + store.h / 2; // 120, 184, 248, 312

  const clientBus = {
    axis: "v" as const,
    at: busX,
    stubs: [
      ...CLIENTS.map((_, i) => ({ at: clientY(i), to: client.x + client.w, flow: READ })),
      { at: trunkY, to: platform.x, arrow: true, flow: READ },
    ],
  };
  const storeBus = {
    axis: "v" as const,
    at: storeBusX,
    stubs: [...STORES.map((_, i) => ({ at: storeY(i), to: store.x, arrow: true, flow: READ })), { at: trunkY, to: platform.x + platform.w, flow: READ }],
  };
  const clientStubs = CLIENTS.map((_, i) => busStub(clientBus, clientBus.stubs[i]));
  const toPlatform = busStub(clientBus, clientBus.stubs[CLIENTS.length]);
  const storeStubs = STORES.map((_, i) => busStub(storeBus, storeBus.stubs[i]));
  const fromPlatform = busStub(storeBus, storeBus.stubs[STORES.length]);

  const cdcPath: Point[] = [
    [platform.x + platform.w / 2, platform.y + platform.h],
    [cdc.x + cdc.w / 2, cdc.y],
  ];
  const sinkX = (i: number) => 392 + i * 152;
  const sinkPaths: Point[][] = SINKS.map((_, i) => route([cdc.x + cdc.w / 2, cdc.y + cdc.h], [sinkX(i) + 64, 480], 464, "v"));

  return (
    <>
      <Defs id={ID} />
      <Lane x={client.x} w={client.w} y={44} title="Clients" />
      <Lane x={platform.x} w={platform.w} y={44} title="Online storage platform" />
      <Lane x={store.x} w={store.w} y={44} title="Storage resources" />

      {CLIENTS.map(([label, icon], i) => (
        <Node key={label} x={client.x} y={client.y0 + i * client.step} w={client.w} h={client.h} label={label} icon={icon} flow={READ} hint={`${label} reads and writes through Habitat`} />
      ))}

      <Group {...platform} title="Habitat" flow={[READ, CDC]}>
        {PLATFORM.map(([label, sub], i) => (
          <Node key={label} x={platform.x + 24 + (i % 3) * 192} y={platform.y + 44 + Math.floor(i / 3) * 72} w={168} h={56} label={label} sub={sub} align="left" flow={READ} />
        ))}
        <Node x={platform.x + 24} y={platform.y + 188} w={552} h={56} label="Routing" sub="Schema lookup · Data residency" align="left" flow={READ} />
      </Group>

      {STORES.map(([label, sub, icon], i) => (
        <Node key={label} x={store.x} y={store.y0 + i * store.step} w={store.w} h={store.h} label={label} sub={sub} icon={icon} flow={READ} />
      ))}

      <Bus {...clientBus} from={clientY(0)} to={clientY(CLIENTS.length - 1)} defs={ID} />
      <Bus {...storeBus} from={storeY(0)} to={storeY(STORES.length - 1)} defs={ID} />

      <Packet points={toPlatform} kind="request" dur={2.4} flow={READ} />
      <Packet points={toPlatform} kind="request" dur={2.4} delay={-1.2} flow={READ} />
      <Packet points={toPlatform} kind="response" dur={2.4} delay={-0.6} reverse flow={READ} />
      <Packet points={fromPlatform} kind="request" dur={2.4} delay={-0.3} reverse flow={READ} />
      <Packet points={fromPlatform} kind="response" dur={2.4} delay={-1.5} flow={READ} />
      {clientStubs.map((p, i) => (
        <Packet key={i} points={p} kind={i % 2 ? "response" : "request"} dur={1.6} delay={-i * 0.4} reverse={i % 2 === 0} r={4} flow={READ} />
      ))}
      {storeStubs.map((p, i) => (
        <Packet key={i} points={p} kind={i % 2 ? "response" : "request"} dur={1.6} delay={-i * 0.5} reverse={i % 2 === 1} r={4} flow={READ} />
      ))}

      <Connector points={cdcPath} defs={ID} kind="change" flow={CDC} />
      <Packet points={cdcPath} kind="change" dur={2} flow={CDC} />
      <Node {...cdc} label="CDC Services" sub="Change Data Capture" icon="queue" flow={CDC} hint="Streams every change out of the platform" />
      {sinkPaths.map((p, i) => (
        <Connector key={i} points={p} defs={ID} kind="change" flow={CDC} />
      ))}
      {sinkPaths.map((p, i) => (
        <Packet key={i} points={p} kind="change" dur={2.2} delay={-i * 0.55} flow={CDC} />
      ))}
      {SINKS.map((label, i) => (
        <Node key={label} x={sinkX(i)} y={480} w={128} h={40} label={label} icon={i === 3 ? "more" : "service"} flow={CDC} />
      ))}
      <Label x={platform.x + platform.w / 2 + 12} y={platform.y + platform.h + 30} text="changes" />
    </>
  );
}

export function HabitatNarrow() {
  const platform = { x: 16, y: 232, w: 328, h: 168 };
  const down: Point[] = [
    [180, 136],
    [180, 232],
  ];
  const toStore: Point[] = [
    [180, 400],
    [180, 428],
    [96, 428],
    [96, 472],
  ];
  return (
    <>
      <Defs id={`${ID}-n`} />
      <Lane x={16} w={328} y={20} title="Clients" />
      {CLIENTS.slice(0, 4).map(([label, icon], i) => (
        <Node key={label} x={16 + (i % 2) * 168} y={40 + Math.floor(i / 2) * 56} w={160} h={40} label={label} icon={icon} size={13} flow={READ} />
      ))}
      <Connector points={down} defs={`${ID}-n`} flow={READ} />
      <Packet points={down} kind="request" dur={1.6} flow={READ} />
      <Packet points={down} kind="response" dur={1.6} delay={-0.8} reverse flow={READ} />
      <Group {...platform} title="Habitat" flow={READ}>
        {PLATFORM.slice(0, 4).map(([label], i) => (
          <Node key={label} x={platform.x + 16 + (i % 2) * 152} y={platform.y + 40 + Math.floor(i / 2) * 56} w={136} h={40} label={label} size={12} flow={READ} />
        ))}
      </Group>
      <Connector points={toStore} defs={`${ID}-n`} flow={READ} />
      <Packet points={toStore} kind="request" dur={1.6} delay={-0.4} flow={READ} />
      <Packet points={toStore} kind="response" dur={1.6} delay={-1.2} reverse flow={READ} />
      <Lane x={16} w={328} y={456} title="Storage" />
      {STORES.slice(0, 2).map(([label, sub, icon], i) => (
        <Node key={label} x={16 + i * 168} y={472} w={160} h={48} label={label} sub={sub} icon={icon} size={12} subSize={10} flow={READ} />
      ))}
    </>
  );
}

export function HabitatFigure() {
  return (
    <Figure
      number="Figure 01"
      eyebrow="What is Habitat?"
      title="Online storage platform"
      caption="Habitat is the online storage platform OpenAI built so its products can quickly and reliably access needed information. Redrawn from the engineering post with uipack."
      legend={[
        { label: "Request", kind: "request" },
        { label: "Response", kind: "response" },
        { label: "Changes (CDC)", kind: "change" },
      ]}
      viewBox="0 0 1248 544"
      narrow={<HabitatNarrow />}
      narrowViewBox="0 0 360 544"
      alt="Clients on the left call Habitat, a boxed platform of caching, ACL, placement, encryption, isolation, rate limiting and routing, which reads and writes four storage resources on the right; a change-data-capture service under the platform fans out to Databricks, Rockset and Kafka.">
      <HabitatWide />
    </Figure>
  );
}
