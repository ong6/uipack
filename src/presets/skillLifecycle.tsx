import { Bus, busStub } from "../Bus";
import { Chip } from "../Chip";
import { Connector } from "../Connector";
import { Defs } from "../Defs";
import { Label } from "../Label";
import { Lane } from "../Lane";
import { Node } from "../Node";
import { Packet } from "../Packet";
import type { Point } from "../geometry";
import { Stack, stackHeight, presetFigure, NARROW_W, type FigureMeta, type Item, type PresetParts } from "./shared";

export interface SkillLifecycleSpec {
  figure: FigureMeta;
  author: Item;
  evaluate: Item & { baseline: string };
  version: Item;
  consumers: Item[];
  feedback: Item;
}

export const defaultSkillLifecycle: SkillLifecycleSpec = {
  figure: {
    number: "Figure 01",
    eyebrow: "Skill lifecycle",
    title: "A skill earns its place, then flows back",
    caption: "A candidate skill is scored against a no-skill baseline before it gets a version. Versions install into every consumer; what breaks in use comes back as feedback to the author.",
    alt: "An author writes a skill, an evaluator scores it against a baseline, a version is cut and installed into three consumer repos, and feedback loops from the consumers back to the author.",
  },
  author: { label: "Author", sub: "SKILL.md · examples", icon: "user" },
  evaluate: { label: "Evaluate", sub: "frozen cases · scored", icon: "chart", baseline: "no-skill run" },
  version: { label: "Version", sub: "immutable revision", icon: "git" },
  consumers: [
    { label: "Store", sub: "subtree", icon: "git" },
    { label: "Site", sub: "plugin", icon: "browser" },
    { label: "Agent box", sub: "plugin", icon: "robot" },
  ],
  feedback: { label: "Feedback", sub: "what broke in use", icon: "warning" },
};

const FWD = "forward";
const BACK = "feedback";

export function skillLifecycleParts(spec: SkillLifecycleSpec = defaultSkillLifecycle, id: string): PresetParts {
  const y = 96;
  const author = { x: 24, y, w: 176, h: 48 };
  const evaluate = { x: 264, y: y - 4, w: 192, h: 56 };
  const version = { x: 520, y, w: 176, h: 48 };
  const con = { x: 808, w: 176, h: 48, step: 56, y0: 96 };
  const n = spec.consumers.length;
  const conY = (i: number) => con.y0 + i * con.step + con.h / 2;
  const busX = 760;
  const cy = y + 24;
  const bus = {
    axis: "v" as const,
    at: busX,
    stubs: [...spec.consumers.map((_, i) => ({ at: conY(i), to: con.x, arrow: true, flow: FWD })), { at: cy, to: version.x + version.w, flow: FWD }],
  };
  const a2e: Point[] = [
    [author.x + author.w, cy],
    [evaluate.x, cy],
  ];
  const e2v: Point[] = [
    [evaluate.x + evaluate.w, cy],
    [version.x, cy],
  ];
  const trunkEnd = Math.max(conY(n - 1), cy);
  const loopY = trunkEnd + 64;
  const back: Point[] = [
    [busX, trunkEnd],
    [busX, loopY],
    [author.x + author.w / 2, loopY],
    [author.x + author.w / 2, author.y + author.h],
  ];
  const height = loopY + 40;

  const wide = (
    <>
      <Defs id={id} />
      <Lane x={author.x} w={author.w} y={44} title="Author" />
      <Lane x={evaluate.x} w={evaluate.w} y={44} title="Evaluate" />
      <Lane x={version.x} w={version.w} y={44} title="Version" />
      <Lane x={con.x} w={con.w} y={44} title="Consumers" />
      <Node {...author} label={spec.author.label} sub={spec.author.sub} icon={spec.author.icon ?? "user"} flow={[FWD, BACK]} />
      <Connector points={a2e} defs={id} kind="request" flow={FWD} />
      <Packet points={a2e} kind="request" dur={1.4} flow={FWD} r={4} />
      <Node {...evaluate} label={spec.evaluate.label} sub={spec.evaluate.sub} icon={spec.evaluate.icon ?? "chart"} flow={FWD} hint={`Scored against: ${spec.evaluate.baseline}`} />
      <Chip x={evaluate.x} y={evaluate.y + evaluate.h + 12} w={evaluate.w} h={20} label={`baseline · ${spec.evaluate.baseline}`} size={9} dashed />
      <Connector points={e2v} defs={id} kind="accent" flow={FWD} />
      <Packet points={e2v} kind="accent" dur={1.4} delay={-0.7} flow={FWD} r={4} />
      <Label x={(e2v[0][0] + e2v[1][0]) / 2} y={cy - 10} text="passes" anchor="middle" accent />
      <Node {...version} label={spec.version.label} sub={spec.version.sub} icon={spec.version.icon ?? "git"} flow={FWD} />
      <Bus {...bus} from={Math.min(conY(0), cy)} to={trunkEnd} defs={id} />
      <Packet points={busStub(bus, bus.stubs[n])} kind="request" dur={1.2} flow={FWD} r={4} />
      {spec.consumers.map((c, i) => (
        <g key={c.label}>
          <Packet points={busStub(bus, bus.stubs[i])} kind="request" dur={1.2} delay={-i * 0.4} flow={FWD} r={4} />
          <Node x={con.x} y={con.y0 + i * con.step} w={con.w} h={con.h} label={c.label} sub={c.sub} icon={c.icon} flow={[FWD, BACK]} />
        </g>
      ))}
      <Label x={(version.x + version.w + busX) / 2} y={cy - 10} text="install" anchor="middle" />
      <Connector points={back} defs={id} kind="change" flow={BACK} dashed />
      <Packet points={back} kind="change" dur={3.2} flow={BACK} />
      <Packet points={back} kind="change" dur={3.2} delay={-1.6} flow={BACK} />
      <Label x={(busX + author.x) / 2} y={loopY - 10} text={`${spec.feedback.label} · ${spec.feedback.sub ?? ""}`.trim()} anchor="middle" />
    </>
  );

  const steps = [
    { ...spec.author, icon: spec.author.icon ?? ("user" as const), flow: FWD },
    { ...spec.evaluate, sub: `${spec.evaluate.sub ?? ""} · vs ${spec.evaluate.baseline}`.replace(/^ · /, ""), icon: spec.evaluate.icon ?? ("chart" as const), flow: FWD },
    { ...spec.version, icon: spec.version.icon ?? ("git" as const), kind: "accent" as const, flow: FWD },
    { label: spec.consumers.map((c) => c.label).join(" · "), sub: "consumers", icon: "git" as const, flow: FWD },
    { ...spec.feedback, icon: spec.feedback.icon ?? ("warning" as const), kind: "change" as const, flow: BACK, dashed: true },
  ];

  return {
    wide,
    narrow: <Stack steps={steps} id={`${id}-n`} />,
    viewBox: `0 0 1120 ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Candidate", kind: "request" },
      { label: "Passes baseline", kind: "accent" },
      { label: "Feedback", kind: "change" },
    ],
  };
}

export const skillLifecycle = (spec: SkillLifecycleSpec = defaultSkillLifecycle, id?: string) => presetFigure(spec, skillLifecycleParts, id);
