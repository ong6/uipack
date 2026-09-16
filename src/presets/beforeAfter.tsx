import { Connector } from "../Connector";
import { Defs } from "../Defs";
import { Group } from "../Group";
import { Node } from "../Node";
import { Packet } from "../Packet";
import type { Point } from "../geometry";
import { Stack, stackHeight, toFigure, NARROW_W, type FigureMeta, type Item, type PresetParts } from "./shared";

export interface BeforeAfterPanel {
  title: string;
  stages: Item[];
  /** Indices of stages that are new or changed; their inbound edge is accented. */
  changed?: number[];
}

export interface BeforeAfterSpec {
  figure: FigureMeta;
  before: BeforeAfterPanel;
  after: BeforeAfterPanel;
}

export const defaultBeforeAfter: BeforeAfterSpec = {
  figure: {
    number: "Figure 01",
    eyebrow: "Before and after",
    title: "One check between the model and the reader",
    caption: "Before, the model's draft went straight to the customer. After, a deterministic check reads the recorded facts and raises on the first unsupported claim.",
    alt: "Two stacked panels. Before: tools, model, draft, customer in a line. After: the same line with a deterministic check inserted between the draft and the customer, highlighted.",
  },
  before: {
    title: "Before",
    stages: [
      { label: "Tools", sub: "results", icon: "tool" },
      { label: "Model", sub: "drafts prose", icon: "model" },
      { label: "Draft", sub: "trusted as-is", icon: "doc" },
      { label: "Customer", sub: "reads it", icon: "user" },
    ],
  },
  after: {
    title: "After",
    stages: [
      { label: "Tools", sub: "facts recorded", icon: "tool" },
      { label: "Model", sub: "fills fields", icon: "model" },
      { label: "Check", sub: "facts vs fields", icon: "lock" },
      { label: "Customer", sub: "reads what passed", icon: "user" },
    ],
    changed: [2],
  },
};

export function beforeAfterParts(spec: BeforeAfterSpec = defaultBeforeAfter, id = "ba"): PresetParts {
  const stage = { w: 136, h: 48, step: 176 };
  const panelH = 120;
  const panel = (p: BeforeAfterPanel, y: number, flow: string, pid: string) => {
    const n = p.stages.length;
    const w = 48 + n * stage.step - (stage.step - stage.w) + 48;
    const x0 = 24;
    const sy = y + 48;
    const cy = sy + stage.h / 2;
    const changed = new Set(p.changed ?? []);
    return (
      <Group x={x0} y={y} w={w} h={panelH} title={p.title} variant="dashed" flow={flow} accent={changed.size > 0}>
        {p.stages.map((s, i) => {
          const x = x0 + 24 + i * stage.step;
          const into: Point[] = [
            [x - stage.step + stage.w, cy],
            [x, cy],
          ];
          const hot = changed.has(i);
          return (
            <g key={s.label + i}>
              {i > 0 ? (
                <>
                  <Connector points={into} defs={id} kind={hot ? "accent" : "request"} flow={flow} />
                  <Packet points={into} kind={hot ? "accent" : "request"} dur={1.2} delay={-i * 0.4} flow={flow} r={4} id={`${pid}-p${i}`} />
                </>
              ) : null}
              <Node x={x} y={sy} w={stage.w} h={stage.h} label={s.label} sub={s.sub} icon={s.icon} accent={hot} flow={flow} size={13} subSize={10} />
            </g>
          );
        })}
      </Group>
    );
  };
  const afterY = 24 + panelH + 32;
  const height = afterY + panelH + 24;
  const panelW = (p: BeforeAfterPanel) => 48 + p.stages.length * stage.step - (stage.step - stage.w) + 48;
  const width = Math.max(panelW(spec.before), panelW(spec.after)) + 48;
  const wide = (
    <>
      <Defs id={id} />
      {panel(spec.before, 24, "before", `${id}-b`)}
      {panel(spec.after, afterY, "after", `${id}-a`)}
    </>
  );
  const changed = new Set(spec.after.changed ?? []);
  const steps = [
    ...spec.before.stages.map((s, i) => ({ ...s, sub: i === 0 ? spec.before.title.toLowerCase() : s.sub, flow: "before" })),
    ...spec.after.stages.map((s, i) => ({ ...s, sub: i === 0 ? spec.after.title.toLowerCase() : s.sub, flow: "after", accent: changed.has(i), kind: changed.has(i) ? ("accent" as const) : i === 0 ? ("neutral" as const) : ("request" as const) })),
  ];
  return {
    wide,
    narrow: <Stack steps={steps} id={`${id}-n`} />,
    viewBox: `0 0 ${Math.max(width, 640)} ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Unchanged", kind: "request" },
      { label: "Changed", kind: "accent" },
    ],
  };
}

export const beforeAfter = (spec: BeforeAfterSpec = defaultBeforeAfter, id?: string) => toFigure(spec.figure, beforeAfterParts(spec, id), id);
