import { Chip } from "../Chip";
import { Connector } from "../Connector";
import { Defs } from "../Defs";
import { Group } from "../Group";
import { Lane } from "../Lane";
import { Node } from "../Node";
import { Packet } from "../Packet";
import type { Point } from "../geometry";
import { Stack, stackHeight, toFigure, NARROW_W, type FigureMeta, type Item, type PresetParts } from "./shared";

export interface PipelineSpec {
  figure: FigureMeta;
  stages: Item[];
  /** A queue drawn after stage `after` (0-based), with `depth` waiting slots. */
  queue?: Item & { after: number; depth?: number };
  laneTitle?: string;
}

export const defaultPipeline: PipelineSpec = {
  figure: {
    number: "Figure 01",
    eyebrow: "Pipeline",
    title: "Fast in front, slow behind a queue",
    caption: "Validation and enrichment run inline. Embedding is slow and bursty, so it sits behind a queue; the writer drains at its own pace.",
    alt: "Five stages in a line: receive, validate, enrich, then a queue with three slots, then embed and write.",
  },
  stages: [
    { label: "Receive", sub: "HTTP · 2 ms", icon: "gateway" },
    { label: "Validate", sub: "schema · 1 ms", icon: "lock" },
    { label: "Enrich", sub: "lookups · 8 ms", icon: "service" },
    { label: "Embed", sub: "model · 120 ms", icon: "model" },
    { label: "Write", sub: "batched", icon: "db" },
  ],
  queue: { label: "Queue", sub: "at-least-once", icon: "queue", after: 2, depth: 3 },
};

const FLOW = "job";

export function pipelineParts(spec: PipelineSpec = defaultPipeline, id = "pipe"): PresetParts {
  const stage = { w: 136, h: 48, step: 176, y: 96 };
  const cy = stage.y + stage.h / 2;
  const slots: ("stage" | "queue")[] = [];
  spec.stages.forEach((_, i) => {
    slots.push("stage");
    if (spec.queue && spec.queue.after === i) slots.push("queue");
  });
  const x = (slot: number) => 24 + slot * stage.step;
  const width = 24 + slots.length * stage.step - (stage.step - stage.w) + 24;
  let si = 0;
  const nodes = slots.map((kind, slot) => {
    const into: Point[] = [
      [x(slot - 1) + stage.w, cy],
      [x(slot), cy],
    ];
    const edge =
      slot > 0 ? (
        <>
          <Connector points={into} defs={id} kind={kind === "queue" || slots[slot - 1] === "queue" ? "change" : "request"} flow={FLOW} />
          <Packet points={into} kind={kind === "queue" || slots[slot - 1] === "queue" ? "change" : "request"} dur={1.2} delay={-slot * 0.35} flow={FLOW} r={4} />
        </>
      ) : null;
    if (kind === "queue") {
      const q = spec.queue!;
      const depth = q.depth ?? 3;
      const cw = (stage.w - 16 - (depth - 1) * 6) / depth;
      return (
        <g key="queue">
          {edge}
          <Group x={x(slot)} y={stage.y - 16} w={stage.w} h={stage.h + 32} title={q.label} flow={FLOW} accent>
            {Array.from({ length: depth }).map((_, k) => (
              <Chip key={k} x={x(slot) + 8 + k * (cw + 6)} y={stage.y + 24} w={cw} h={18} label={k < depth - 1 ? String(k + 1) : ""} kind={k < depth - 1 ? "change" : undefined} dashed={k === depth - 1} size={9} flow={FLOW} />
            ))}
          </Group>
        </g>
      );
    }
    const s = spec.stages[si++];
    return (
      <g key={s.label}>
        {edge}
        <Node x={x(slot)} y={stage.y} w={stage.w} h={stage.h} label={s.label} sub={s.sub} icon={s.icon} flow={FLOW} size={13} subSize={10} />
      </g>
    );
  });

  const wide = (
    <>
      <Defs id={id} />
      <Lane x={24} w={width - 48} y={44} title={spec.laneTitle ?? "Stages, left to right"} />
      {nodes}
    </>
  );
  const steps = [
    ...spec.stages.slice(0, (spec.queue?.after ?? spec.stages.length - 1) + 1).map((s) => ({ ...s, flow: FLOW })),
    ...(spec.queue ? [{ label: spec.queue.label, sub: spec.queue.sub, icon: spec.queue.icon ?? ("queue" as const), kind: "change" as const, accent: true, flow: FLOW }] : []),
    ...spec.stages.slice((spec.queue?.after ?? spec.stages.length - 1) + 1).map((s) => ({ ...s, kind: "change" as const, flow: FLOW })),
  ];
  return {
    wide,
    narrow: <Stack steps={steps} id={`${id}-n`} />,
    viewBox: `0 0 ${Math.max(width, 640)} ${stage.y + stage.h + 48}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Inline", kind: "request" },
      { label: "Queued", kind: "change" },
    ],
  };
}

export const pipeline = (spec: PipelineSpec = defaultPipeline, id?: string) => toFigure(spec.figure, pipelineParts(spec, id), id);
