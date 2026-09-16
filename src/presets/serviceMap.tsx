import { Bus, busStub } from "../Bus";
import { Connector } from "../Connector";
import { Defs } from "../Defs";
import { Group } from "../Group";
import { Lane } from "../Lane";
import { Node } from "../Node";
import { Packet } from "../Packet";
import { route, type Point } from "../geometry";
import { Stack, stackHeight, presetFigure, NARROW_W, type FigureMeta, type Item, type PresetParts } from "./shared";

export interface ServiceMapSpec {
  figure: FigureMeta;
  /** Left lane. */
  clients: Item[];
  /** The boxed platform in the middle: a title, cells three per row, an optional full-width footer cell. */
  platform: { title: string; cells: Item[]; footer?: Item };
  /** Right lane. */
  resources: Item[];
  /** Optional change stream under the platform fanning out to sinks. */
  sinks?: { via: Item; items: Item[] };
  laneTitles?: [string, string, string];
}

export const defaultServiceMap: ServiceMapSpec = {
  figure: {
    number: "Figure 01",
    eyebrow: "Service map",
    title: "One gateway in front of every store",
    caption: "Clients call one platform; the platform owns auth, routing and caching, and is the only thing that talks to storage. Changes stream out to the warehouse.",
    alt: "Four clients on the left call a gateway platform in the middle, which reads and writes three stores on the right; a change stream under the platform feeds a warehouse and search.",
  },
  clients: [
    { label: "Web app", icon: "client" },
    { label: "Mobile", icon: "client" },
    { label: "CLI", icon: "service" },
    { label: "Partners", icon: "more" },
  ],
  platform: {
    title: "Gateway",
    cells: [
      { label: "Auth", sub: "Sessions · keys" },
      { label: "Rate limit", sub: "Per tenant" },
      { label: "Routing", sub: "Schema lookup" },
      { label: "Caching", sub: "Read-through" },
      { label: "Encryption", sub: "At rest · in flight" },
      { label: "Audit", sub: "Every write" },
    ],
  },
  resources: [
    { label: "Postgres", sub: "Primary", icon: "db" },
    { label: "Redis", sub: "Cache", icon: "cache" },
    { label: "Object store", sub: "Blobs", icon: "blob" },
  ],
  sinks: {
    via: { label: "Change stream", sub: "CDC", icon: "queue" },
    items: [
      { label: "Warehouse", icon: "db" },
      { label: "Search", icon: "service" },
    ],
  },
};

const READ = "read";
const CDC = "cdc";

export function serviceMapParts(spec: ServiceMapSpec = defaultServiceMap, id: string): PresetParts {
  const [lc, lp, lr] = spec.laneTitles ?? ["Clients", "Platform", "Resources"];
  const client = { x: 24, w: 176, h: 48, step: 56, y0: 96 };
  const store = { x: 1024, w: 200, h: 48, step: 64, y0: 96 };
  const rows = Math.ceil(spec.platform.cells.length / 3);
  const platform = { x: 328, y: 64, w: 600, h: 44 + rows * 72 + (spec.platform.footer ? 72 : 0) };
  const busX = 232;
  const storeBusX = 1000;
  const clientY = (i: number) => client.y0 + i * client.step + client.h / 2;
  const storeY = (i: number) => store.y0 + i * store.step + store.h / 2;
  const trunkY = 200;
  const lanesBottom = Math.max(platform.y + platform.h, client.y0 + spec.clients.length * client.step, store.y0 + spec.resources.length * store.step);

  const clientBus = {
    axis: "v" as const,
    at: busX,
    stubs: [...spec.clients.map((_, i) => ({ at: clientY(i), to: client.x + client.w, flow: READ })), { at: trunkY, to: platform.x, arrow: true, flow: READ }],
  };
  const storeBus = {
    axis: "v" as const,
    at: storeBusX,
    stubs: [...spec.resources.map((_, i) => ({ at: storeY(i), to: store.x, arrow: true, flow: READ })), { at: trunkY, to: platform.x + platform.w, flow: READ }],
  };
  const toPlatform = busStub(clientBus, clientBus.stubs[spec.clients.length]);
  const fromPlatform = busStub(storeBus, storeBus.stubs[spec.resources.length]);

  let height = lanesBottom + 24;
  let sinks: React.ReactNode = null;
  if (spec.sinks) {
    const via = { x: platform.x + platform.w / 2 - 100, y: platform.y + platform.h + 48, w: 200, h: 56 };
    const n = spec.sinks.items.length;
    const sw = 128;
    const gap = 24;
    const rowW = n * sw + (n - 1) * gap;
    const x0 = platform.x + platform.w / 2 - rowW / 2;
    const sinkY = via.y + via.h + 40;
    const viaPath: Point[] = [
      [platform.x + platform.w / 2, platform.y + platform.h],
      [via.x + via.w / 2, via.y],
    ];
    const elbow = via.y + via.h + 24;
    sinks = (
      <>
        <Connector points={viaPath} defs={id} kind="change" flow={CDC} />
        <Packet points={viaPath} kind="change" dur={2} flow={CDC} />
        <Node {...via} label={spec.sinks.via.label} sub={spec.sinks.via.sub} icon={spec.sinks.via.icon ?? "queue"} flow={CDC} />
        {spec.sinks.items.map((s, i) => {
          const p = route([via.x + via.w / 2, via.y + via.h], [x0 + i * (sw + gap) + sw / 2, sinkY], elbow, "v");
          return (
            <g key={s.label}>
              <Connector points={p} defs={id} kind="change" flow={CDC} />
              <Packet points={p} kind="change" dur={2.2} delay={-i * 0.55} flow={CDC} />
              <Node x={x0 + i * (sw + gap)} y={sinkY} w={sw} h={40} label={s.label} icon={s.icon} flow={CDC} size={13} />
            </g>
          );
        })}
      </>
    );
    height = sinkY + 40 + 24;
  }

  const wide = (
    <>
      <Defs id={id} />
      <Lane x={client.x} w={client.w} y={44} title={lc} />
      <Lane x={platform.x} w={platform.w} y={44} title={lp} />
      <Lane x={store.x} w={store.w} y={44} title={lr} />
      {spec.clients.map((c, i) => (
        <Node key={c.label} x={client.x} y={client.y0 + i * client.step} w={client.w} h={client.h} label={c.label} sub={c.sub} icon={c.icon} flow={READ} />
      ))}
      <Group {...platform} title={spec.platform.title} flow={spec.sinks ? [READ, CDC] : READ}>
        {spec.platform.cells.map((c, i) => (
          <Node key={c.label} x={platform.x + 24 + (i % 3) * 192} y={platform.y + 44 + Math.floor(i / 3) * 72} w={168} h={56} label={c.label} sub={c.sub} align="left" flow={READ} />
        ))}
        {spec.platform.footer ? (
          <Node x={platform.x + 24} y={platform.y + 44 + rows * 72} w={552} h={56} label={spec.platform.footer.label} sub={spec.platform.footer.sub} align="left" flow={READ} />
        ) : null}
      </Group>
      {spec.resources.map((r, i) => (
        <Node key={r.label} x={store.x} y={store.y0 + i * store.step} w={store.w} h={store.h} label={r.label} sub={r.sub} icon={r.icon} flow={READ} />
      ))}
      <Bus {...clientBus} from={Math.min(clientY(0), trunkY)} to={Math.max(clientY(spec.clients.length - 1), trunkY)} defs={id} />
      <Bus {...storeBus} from={Math.min(storeY(0), trunkY)} to={Math.max(storeY(spec.resources.length - 1), trunkY)} defs={id} />
      <Packet points={toPlatform} kind="request" dur={2.4} flow={READ} />
      <Packet points={toPlatform} kind="response" dur={2.4} delay={-1.2} reverse flow={READ} />
      <Packet points={fromPlatform} kind="request" dur={2.4} delay={-0.3} reverse flow={READ} />
      <Packet points={fromPlatform} kind="response" dur={2.4} delay={-1.5} flow={READ} />
      {spec.clients.map((_, i) => (
        <Packet key={i} points={busStub(clientBus, clientBus.stubs[i])} kind={i % 2 ? "response" : "request"} dur={1.6} delay={-i * 0.4} reverse={i % 2 === 0} r={4} flow={READ} />
      ))}
      {spec.resources.map((_, i) => (
        <Packet key={i} points={busStub(storeBus, storeBus.stubs[i])} kind={i % 2 ? "response" : "request"} dur={1.6} delay={-i * 0.5} reverse={i % 2 === 1} r={4} flow={READ} />
      ))}
      {sinks}
    </>
  );

  const steps = [
    { label: spec.clients.map((c) => c.label).join(" · "), sub: lc, icon: "client" as const, flow: READ },
    { label: spec.platform.title, sub: spec.platform.cells.map((c) => c.label).join(" · "), icon: "service" as const, flow: READ },
    { label: spec.resources.map((r) => r.label).join(" · "), sub: lr, icon: "db" as const, flow: READ },
    ...(spec.sinks ? [{ label: spec.sinks.via.label, sub: spec.sinks.items.map((s) => s.label).join(" · "), icon: "queue" as const, kind: "change" as const, flow: CDC }] : []),
  ];

  return {
    wide,
    narrow: <Stack steps={steps} id={`${id}-n`} />,
    viewBox: `0 0 1248 ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Request", kind: "request" },
      { label: "Response", kind: "response" },
      ...(spec.sinks ? [{ label: "Change", kind: "change" as const }] : []),
    ],
  };
}

export const serviceMap = (spec: ServiceMapSpec = defaultServiceMap, id?: string) => presetFigure(spec, serviceMapParts, id);
