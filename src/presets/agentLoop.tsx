import { Bus, busStub } from "../Bus";
import { Connector } from "../Connector";
import { Defs } from "../Defs";
import { Group } from "../Group";
import { Label } from "../Label";
import { Lane } from "../Lane";
import { Node } from "../Node";
import { Packet } from "../Packet";
import type { Point } from "../geometry";
import { Stack, stackHeight, presetFigure, NARROW_W, type FigureMeta, type Item, type PresetParts } from "./shared";

export interface AgentLoopSpec {
  figure: FigureMeta;
  user: Item;
  agent: Item;
  tools: Item[];
  /** The deterministic check between the agent and what the user sees. */
  boundary: Item;
  output: Item;
  laneTitles?: [string, string, string];
}

export const defaultAgentLoop: AgentLoopSpec = {
  figure: {
    number: "Figure 01",
    eyebrow: "Agent loop",
    title: "Tools answer, the boundary decides",
    caption: "The agent plans, calls tools, and drafts. Nothing reaches the user until a deterministic check passes the draft against what the tools recorded.",
    alt: "A user sends a request to an agent, the agent calls three tools and gets results back, then its draft passes through a deterministic boundary before becoming the output.",
  },
  user: { label: "User", icon: "user" },
  agent: { label: "Agent", sub: "plan · call · draft", icon: "agent" },
  tools: [
    { label: "Search", sub: "tool", icon: "browser" },
    { label: "Database", sub: "tool", icon: "db" },
    { label: "Calculator", sub: "tool", icon: "tool" },
  ],
  boundary: { label: "Deterministic boundary", sub: "facts recorded → fields checked", icon: "lock" },
  output: { label: "Output", sub: "only what the facts support", icon: "doc" },
};

const ASK = "ask";
const TOOLS = "tools";
const CHECK = "check";

export function agentLoopParts(spec: AgentLoopSpec = defaultAgentLoop, id: string): PresetParts {
  const [lu, la, lt] = spec.laneTitles ?? ["User", "Agent", "Tools"];
  const user = { x: 24, y: 96, w: 176, h: 48 };
  const n = spec.tools.length;
  const tool = { x: 800, w: 176, h: 48, step: 56, y0: 96 };
  const toolY = (i: number) => tool.y0 + i * tool.step + tool.h / 2;
  const agentBox = { x: 328, y: 64, w: 336, h: Math.max(176, tool.y0 - 64 + n * tool.step - 8 + 16) };
  const busX = 744;
  const trunkY = 152;
  const bus = {
    axis: "v" as const,
    at: busX,
    stubs: [...spec.tools.map((_, i) => ({ at: toolY(i), to: tool.x, arrow: true, flow: TOOLS })), { at: trunkY, to: agentBox.x + agentBox.w, flow: TOOLS }],
  };
  const fromAgent = busStub(bus, bus.stubs[n]);
  const ask: Point[] = [
    [user.x + user.w, 120],
    [agentBox.x, 120],
  ];
  const boundary = { x: 328, y: agentBox.y + agentBox.h + 32, w: 336, h: 56 };
  const output = { x: 328, y: boundary.y + boundary.h + 48, w: 336, h: 48 };
  const cx = agentBox.x + agentBox.w / 2;
  const toBoundary: Point[] = [
    [cx, agentBox.y + agentBox.h],
    [cx, boundary.y],
  ];
  const toOutput: Point[] = [
    [cx, boundary.y + boundary.h],
    [cx, output.y],
  ];
  const height = output.y + output.h + 24;

  const wide = (
    <>
      <Defs id={id} />
      <Lane x={user.x} w={user.w} y={40} title={lu} />
      <Lane x={agentBox.x} w={agentBox.w} y={40} title={la} />
      <Lane x={tool.x} w={tool.w} y={40} title={lt} />
      <Node {...user} label={spec.user.label} sub={spec.user.sub} icon={spec.user.icon ?? "user"} flow={ASK} hint="Sends the request, reads the output" />
      <Group {...agentBox} title={spec.agent.label} flow={[ASK, TOOLS, CHECK]}>
        <Node x={agentBox.x + 24} y={agentBox.y + 40} w={agentBox.w - 48} h={56} label={spec.agent.sub ?? "plan · call · draft"} sub="model" icon={spec.agent.icon ?? "agent"} flow={[ASK, TOOLS]} />
        <Node x={agentBox.x + 24} y={agentBox.y + 112} w={agentBox.w - 48} h={40} label="Draft" sub="structured output" icon="doc" flow={CHECK} size={13} subSize={10} />
      </Group>
      {spec.tools.map((t, i) => (
        <Node key={t.label} x={tool.x} y={tool.y0 + i * tool.step} w={tool.w} h={tool.h} label={t.label} sub={t.sub} icon={t.icon ?? "tool"} flow={TOOLS} />
      ))}
      <Connector points={ask} defs={id} kind="request" flow={ASK} />
      <Packet points={ask} kind="request" dur={2} flow={ASK} />
      <Packet points={ask} kind="response" dur={2} delay={-1} reverse flow={ASK} />
      <Bus {...bus} from={Math.min(toolY(0), trunkY)} to={Math.max(toolY(n - 1), trunkY)} defs={id} kind="change" />
      <Packet points={fromAgent} kind="change" dur={1.8} flow={TOOLS} />
      <Packet points={fromAgent} kind="response" dur={1.8} delay={-0.9} reverse flow={TOOLS} />
      {spec.tools.map((_, i) => (
        <Packet key={i} points={busStub(bus, bus.stubs[i])} kind={i % 2 ? "response" : "change"} dur={1.4} delay={-i * 0.45} reverse={i % 2 === 1} r={4} flow={TOOLS} />
      ))}
      <Label x={(agentBox.x + agentBox.w + busX) / 2} y={trunkY - 10} text="tool calls" anchor="middle" />
      <Connector points={toBoundary} defs={id} kind="request" flow={CHECK} />
      <Packet points={toBoundary} kind="request" dur={1.6} flow={CHECK} />
      <Node {...boundary} label={spec.boundary.label} sub={spec.boundary.sub} icon={spec.boundary.icon ?? "lock"} accent dashed flow={CHECK} hint="Code, not a model, decides what passes" />
      <Connector points={toOutput} defs={id} kind="accent" flow={CHECK} />
      <Packet points={toOutput} kind="accent" dur={1.6} delay={-0.8} flow={CHECK} />
      <Label x={cx + 12} y={toOutput[0][1] + 28} text="verdict" accent />
      <Node {...output} label={spec.output.label} sub={spec.output.sub} icon={spec.output.icon ?? "doc"} flow={CHECK} />
    </>
  );

  const steps = [
    { ...spec.user, icon: spec.user.icon ?? ("user" as const), flow: ASK },
    { ...spec.agent, icon: spec.agent.icon ?? ("agent" as const), flow: ASK },
    { label: spec.tools.map((t) => t.label).join(" · "), sub: lt.toLowerCase(), icon: "tool" as const, kind: "change" as const, flow: TOOLS },
    { label: "Tool results", sub: "back to the agent", icon: "doc" as const, kind: "response" as const, flow: TOOLS },
    { ...spec.boundary, icon: spec.boundary.icon ?? ("lock" as const), accent: true, dashed: true, flow: CHECK },
    { ...spec.output, icon: spec.output.icon ?? ("doc" as const), kind: "accent" as const, flow: CHECK },
  ];

  return {
    wide,
    narrow: <Stack steps={steps} id={`${id}-n`} />,
    viewBox: `0 0 1120 ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Request", kind: "request" },
      { label: "Tool call", kind: "change" },
      { label: "Tool result", kind: "response" },
      { label: "Verdict", kind: "accent" },
    ],
  };
}

export const agentLoop = (spec: AgentLoopSpec = defaultAgentLoop, id?: string) => presetFigure(spec, agentLoopParts, id);
