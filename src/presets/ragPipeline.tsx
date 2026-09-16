import { Bus, busStub } from "../Bus";
import { Connector } from "../Connector";
import { Defs } from "../Defs";
import { Label } from "../Label";
import { Lane } from "../Lane";
import { Node } from "../Node";
import { Packet } from "../Packet";
import type { Point } from "../geometry";
import { Stack, stackHeight, toFigure, NARROW_W, type FigureMeta, type Item, type PresetParts } from "./shared";

export interface RagPipelineSpec {
  figure: FigureMeta;
  sources: Item[];
  /** Ingest stages, left to right, ending in the index. */
  ingest: Item[];
  index: Item;
  query: Item;
  /** Query stages, left to right; the first one reads the index. */
  stages: Item[];
  answer: Item;
}

export const defaultRagPipeline: RagPipelineSpec = {
  figure: {
    number: "Figure 01",
    eyebrow: "RAG pipeline",
    title: "Two lanes, one index",
    caption: "Ingest chunks and embeds documents into the index on its own schedule. A query retrieves from the same index, reranks, and generates. The lanes never block each other.",
    alt: "Three document sources feed an ingest lane of chunk, embed and upsert stages into a vector index; below, a user query passes through retrieve, rerank and generate stages, with retrieve reading the index, and ends in an answer.",
  },
  sources: [
    { label: "Docs", icon: "doc" },
    { label: "Tickets", icon: "queue" },
    { label: "Wiki", icon: "browser" },
  ],
  ingest: [
    { label: "Chunk", sub: "800 tokens · overlap" },
    { label: "Embed", sub: "batch · model", icon: "model" },
    { label: "Upsert", sub: "id · hash · version" },
  ],
  index: { label: "Vector index", sub: "HNSW · metadata", icon: "db" },
  query: { label: "Query", icon: "user" },
  stages: [
    { label: "Retrieve", sub: "top-k · filters" },
    { label: "Rerank", sub: "cross-encoder", icon: "model" },
    { label: "Generate", sub: "cited answer", icon: "agent" },
  ],
  answer: { label: "Answer", sub: "with citations", icon: "doc" },
};

const INGEST = "ingest";
const QUERY = "query";

export function ragPipelineParts(spec: RagPipelineSpec = defaultRagPipeline, id = "rag"): PresetParts {
  const src = { x: 24, w: 160, h: 48, step: 56, y0: 80 };
  const srcY = (i: number) => src.y0 + i * src.step + src.h / 2;
  const stage = { w: 136, h: 48, step: 176, x0: 248 };
  const ingestY = 80;
  const iy = ingestY + stage.h / 2; // 104
  const index = { x: 944, y: 136, w: 152, h: 64 };
  const queryY = 272;
  const qy = queryY + stage.h / 2; // 296
  const answer = { x: 944, y: queryY, w: 152, h: 48 };
  const busX = 216;
  const bus = {
    axis: "v" as const,
    at: busX,
    stubs: [...spec.sources.map((_, i) => ({ at: srcY(i), to: src.x + src.w, flow: INGEST })), { at: iy, to: stage.x0, arrow: true, flow: INGEST }],
  };
  const sx = (i: number) => stage.x0 + i * stage.step;
  const ingestLast = sx(spec.ingest.length - 1) + stage.w;
  const toIndex: Point[] = [
    [ingestLast, iy],
    [index.x + index.w / 2, iy],
    [index.x + index.w / 2, index.y],
  ];
  const retrieveX = sx(0) + stage.w / 2;
  const read: Point[] = [
    [retrieveX, queryY],
    [retrieveX, index.y + index.h / 2 + 16],
    [index.x, index.y + index.h / 2 + 16],
  ];
  const queryIn: Point[] = [
    [src.x + src.w, qy],
    [sx(0), qy],
  ];
  const toAnswer: Point[] = [
    [sx(spec.stages.length - 1) + stage.w, qy],
    [answer.x, qy],
  ];
  const height = queryY + stage.h + 32;
  const chain = (items: Item[], y: number, kind: "change" | "request", flow: string) =>
    items.slice(1).map((_, i) => {
      const p: Point[] = [
        [sx(i) + stage.w, y],
        [sx(i + 1), y],
      ];
      return (
        <g key={i}>
          <Connector points={p} defs={id} kind={kind} flow={flow} />
          <Packet points={p} kind={kind} dur={1.2} delay={-i * 0.4} r={4} flow={flow} />
        </g>
      );
    });

  const wide = (
    <>
      <Defs id={id} />
      <Lane x={src.x} w={src.w} y={44} title="Sources" />
      <Lane x={stage.x0} w={ingestLast - stage.x0} y={44} title="Ingest" />
      <Lane x={index.x} w={index.w} y={44} title="Index" />
      <Lane x={stage.x0} w={sx(spec.stages.length - 1) + stage.w - stage.x0} y={252} title="Query" />
      {spec.sources.map((s, i) => (
        <Node key={s.label} x={src.x} y={src.y0 + i * src.step} w={src.w} h={src.h} label={s.label} icon={s.icon ?? "doc"} flow={INGEST} size={13} />
      ))}
      <Bus {...bus} from={Math.min(srcY(0), iy)} to={Math.max(srcY(spec.sources.length - 1), iy)} defs={id} kind="change" />
      {spec.sources.map((_, i) => (
        <Packet key={i} points={busStub(bus, bus.stubs[i])} kind="change" dur={1.4} delay={-i * 0.5} reverse r={4} flow={INGEST} />
      ))}
      <Packet points={busStub(bus, bus.stubs[spec.sources.length])} kind="change" dur={1.2} flow={INGEST} r={4} />
      {spec.ingest.map((s, i) => (
        <Node key={s.label} x={sx(i)} y={ingestY} w={stage.w} h={stage.h} label={s.label} sub={s.sub} icon={s.icon} flow={INGEST} size={13} subSize={10} />
      ))}
      {chain(spec.ingest, iy, "change", INGEST)}
      <Connector points={toIndex} defs={id} kind="change" flow={INGEST} />
      <Packet points={toIndex} kind="change" dur={2} flow={INGEST} />
      <Node {...index} label={spec.index.label} sub={spec.index.sub} icon={spec.index.icon ?? "db"} flow={[INGEST, QUERY]} hint="Shared by both lanes" />
      <Node x={src.x} y={queryY} w={src.w} h={stage.h} label={spec.query.label} icon={spec.query.icon ?? "user"} flow={QUERY} size={13} />
      <Connector points={queryIn} defs={id} kind="request" flow={QUERY} />
      <Packet points={queryIn} kind="request" dur={1.2} flow={QUERY} r={4} />
      {spec.stages.map((s, i) => (
        <Node key={s.label} x={sx(i)} y={queryY} w={stage.w} h={stage.h} label={s.label} sub={s.sub} icon={s.icon} flow={QUERY} size={13} subSize={10} />
      ))}
      {chain(spec.stages, qy, "request", QUERY)}
      <Connector points={read} defs={id} kind="request" flow={QUERY} />
      <Packet points={read} kind="request" dur={1.8} flow={QUERY} r={4} />
      <Packet points={read} kind="response" dur={1.8} delay={-0.9} reverse flow={QUERY} r={4} />
      <Label x={(retrieveX + index.x) / 2} y={index.y + index.h / 2 + 6} text="top-k" anchor="middle" />
      <Connector points={toAnswer} defs={id} kind="response" flow={QUERY} />
      <Packet points={toAnswer} kind="response" dur={1.4} flow={QUERY} r={4} />
      <Node {...answer} label={spec.answer.label} sub={spec.answer.sub} icon={spec.answer.icon ?? "doc"} flow={QUERY} size={13} subSize={10} />
    </>
  );

  const steps = [
    { label: spec.sources.map((s) => s.label).join(" · "), sub: "sources", icon: "doc" as const, flow: INGEST },
    ...spec.ingest.map((s) => ({ ...s, kind: "change" as const, flow: INGEST })),
    { ...spec.index, icon: spec.index.icon ?? ("db" as const), kind: "change" as const, flow: [INGEST, QUERY].join(" ") },
    { ...spec.query, icon: spec.query.icon ?? ("user" as const), kind: "request" as const, flow: QUERY },
    ...spec.stages.map((s) => ({ ...s, kind: "request" as const, flow: QUERY })),
    { ...spec.answer, icon: spec.answer.icon ?? ("doc" as const), kind: "response" as const, flow: QUERY },
  ];

  return {
    wide,
    narrow: <Stack steps={steps} id={`${id}-n`} />,
    viewBox: `0 0 1120 ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Write", kind: "change" },
      { label: "Query", kind: "request" },
      { label: "Result", kind: "response" },
    ],
  };
}

export const ragPipeline = (spec: RagPipelineSpec = defaultRagPipeline, id?: string) => toFigure(spec.figure, ragPipelineParts(spec, id), id);
