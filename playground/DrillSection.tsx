import { useEffect, useState } from "react";
import {
  Connector,
  Defs,
  DrillFigure,
  DrillNode,
  Group,
  Label,
  Node,
  Packet,
  drillBox,
  type DrillLevel,
  type DrillRenderContext,
  type IconName,
  type Point,
  type TokenKind,
} from "../src";

// A generic, illustrative agent harness in three levels. No real system is
// described: the names are the usual parts of any harness.

const W = 1120;
const H = 480;
const NW = 360;
const NH = 600;

type Kind = Exclude<TokenKind, "neutral">;

interface Step {
  label: string;
  sub?: string;
  icon?: IconName;
  hint?: string;
  /** Kind of the link into this step. */
  kind?: Kind;
  drill?: string;
  accent?: boolean;
  dashed?: boolean;
  flow?: string;
}

/** The narrow drawing: one centred column, a connector and packet into each step. */
function Column({ steps, ctx }: { steps: Step[]; ctx: DrillRenderContext }) {
  const SX = 16;
  const SW = 328;
  const SH = 56;
  const GAP = 32;
  const total = steps.length * SH + (steps.length - 1) * GAP;
  const y0 = Math.round((NH - total) / 2 / 8) * 8;
  return (
    <>
      <Defs id={ctx.id} />
      {steps.map((s, i) => {
        const y = y0 + i * (SH + GAP);
        const prev = steps[i - 1];
        // A drillable box draws 4 units taller each way; links meet its drawn edge.
        const top = s.drill ? drillBox({ x: SX, y, w: SW, h: SH }).y : y;
        const prevBottom = prev ? (prev.drill ? drillBox({ x: SX, y: y - SH - GAP, w: SW, h: SH }).y + SH + 8 : y - GAP) : 0;
        const into: Point[] = [
          [SX + SW / 2, prevBottom],
          [SX + SW / 2, top],
        ];
        const box = {
          x: SX,
          y,
          w: SW,
          h: SH,
          label: s.label,
          sub: s.sub,
          icon: s.icon,
          hint: s.hint,
          size: 14,
          subSize: 11,
          accent: s.accent,
          dashed: s.dashed,
          flow: s.flow,
        };
        return (
          <g key={s.label}>
            {i > 0 ? (
              <>
                <Connector points={into} defs={ctx.id} kind={s.kind ?? "request"} flow={s.flow} />
                <Packet points={into} kind={s.kind ?? "request"} dur={1.4} delay={-i * 0.35} r={4} flow={s.flow} />
              </>
            ) : null}
            {s.drill ? <DrillNode {...box} drill={s.drill} /> : <Node {...box} />}
          </g>
        );
      })}
    </>
  );
}

// ── Level 1: the harness ────────────────────────────────────────────────
const CY = 216;
const row = (x: number, w = 176) => ({ x, y: CY - 28, w, h: 56 });
const user = row(24, 152);
const context = row(232);
const model = row(464);
const checks = row(696);
const checksDrawn = drillBox(checks);
const answer = row(928, 168);
const tools = { x: 464, y: 336, w: 176, h: 56 };

function harnessWide(ctx: DrillRenderContext) {
  const id = ctx.id;
  const ask: Point[] = [
    [user.x + user.w, CY],
    [context.x, CY],
  ];
  const toModel: Point[] = [
    [context.x + context.w, CY],
    [model.x, CY],
  ];
  const toChecks: Point[] = [
    [model.x + model.w, CY],
    [checksDrawn.x, CY],
  ];
  const ship: Point[] = [
    [checksDrawn.x + checksDrawn.w, CY],
    [answer.x, CY],
  ];
  const call: Point[] = [
    [528, model.y + model.h],
    [528, tools.y],
  ];
  const result: Point[] = [
    [576, tools.y],
    [576, model.y + model.h],
  ];
  const revise: Point[] = [
    [784, checksDrawn.y],
    [784, 128],
    [552, 128],
    [552, model.y],
  ];
  return (
    <>
      <Defs id={id} />
      <Group x={216} y={88} w={672} h={328} title="Harness" variant="dashed" />
      <Node {...user} label="Request" sub="from a person" icon="user" flow="ask" hint="What someone asked for, in their words" />
      <Node
        {...context}
        label="Context"
        sub="prompt · memory"
        icon="doc"
        flow="ask"
        hint="What the model is told before it starts"
      />
      <Node
        {...model}
        label="Model"
        sub="plan · draft"
        icon="model"
        flow={["ask", "tools"]}
        hint="Plans, calls tools and drafts an answer"
      />
      <Node
        {...tools}
        label="Tools"
        sub="search · code"
        icon="tool"
        flow="tools"
        hint="Do the work the model asks for and report back"
      />
      <DrillNode {...checks} drill="checks" sub="before it ships" icon="lock" flow="ship" />
      <Node {...answer} label="Answer" sub="only what passed" icon="doc" flow="ship" />
      <Connector points={ask} defs={id} kind="request" flow="ask" />
      <Packet points={ask} kind="request" dur={1.6} flow="ask" />
      <Connector points={toModel} defs={id} kind="request" flow="ask" />
      <Packet points={toModel} kind="request" dur={1.6} delay={-0.5} flow="ask" />
      <Connector points={call} defs={id} kind="change" flow="tools" />
      <Packet points={call} kind="change" dur={1.4} flow="tools" r={4} />
      <Connector points={result} defs={id} kind="response" flow="tools" />
      <Packet points={result} kind="response" dur={1.4} delay={-0.7} flow="tools" r={4} />
      <Connector points={toChecks} defs={id} kind="request" flow="ship" />
      <Packet points={toChecks} kind="request" dur={1.6} delay={-1} flow="ship" />
      <Connector points={ship} defs={id} kind="accent" flow="ship" />
      <Packet points={ship} kind="accent" dur={1.6} delay={-0.3} flow="ship" />
      <Connector points={revise} defs={id} dashed flow="ship" />
      <Label x={668} y={120} text="send back" anchor="middle" />
      <Label x={532} y={300} text="call" anchor="end" />
      <Label x={596} y={300} text="result" />
    </>
  );
}

const harnessNarrow = (ctx: DrillRenderContext) => (
  <Column
    ctx={ctx}
    steps={[
      { label: "Request", sub: "from a person", icon: "user", hint: "What someone asked for, in their words" },
      { label: "Context", sub: "prompt · memory", icon: "doc" },
      { label: "Model", sub: "plan · draft", icon: "model" },
      { label: "Tools", sub: "search · code", icon: "tool", kind: "change" },
      { label: "Checks", sub: "before it ships", icon: "lock", drill: "checks", kind: "response" },
      { label: "Answer", sub: "only what passed", icon: "doc", kind: "accent" },
    ]}
  />
);

// ── Level 2: checks ─────────────────────────────────────────────────────
const C2 = 240;
const draft = { x: 48, y: C2 - 28, w: 168, h: 56 };
const lane = (y: number) => ({ x: 328, y, w: 208, h: 56 });
const schema = lane(C2 - 28 - 96);
const policy = lane(C2 - 28);
const policyDrawn = drillBox(policy);
const evidence = lane(C2 - 28 + 96);
const verdict = { x: 648, y: C2 - 28, w: 176, h: 56 };
const shipBox = { x: 896, y: C2 - 28 - 64, w: 176, h: 56 };
const back = { x: 896, y: C2 - 28 + 64, w: 176, h: 56 };

function checksWide(ctx: DrillRenderContext) {
  const id = ctx.id;
  const fx = 272;
  const mx = 592;
  const out = (b: { y: number; h: number }): Point[] => [
    [fx, C2],
    [fx, b.y + b.h / 2],
    [schema.x, b.y + b.h / 2],
  ];
  const merge = (b: { y: number; h: number }, right = schema.x + schema.w): Point[] => [
    [right, b.y + b.h / 2],
    [mx, b.y + b.h / 2],
    [mx, C2],
    [verdict.x, C2],
  ];
  const toShip: Point[] = [
    [verdict.x + verdict.w, C2],
    [860, C2],
    [860, shipBox.y + 28],
    [shipBox.x, shipBox.y + 28],
  ];
  const toBack: Point[] = [
    [verdict.x + verdict.w, C2],
    [860, C2],
    [860, back.y + 28],
    [back.x, back.y + 28],
  ];
  return (
    <>
      <Defs id={id} />
      <Node {...draft} label="Draft" sub="from the model" icon="doc" flow="in" hint="The answer the model wants to give" />
      <Connector
        points={[
          [draft.x + draft.w, C2],
          [fx, C2],
        ]}
        defs={id}
        arrow={false}
        kind="request"
        flow="in"
      />
      <Connector points={out(schema)} defs={id} kind="request" flow="schema" />
      <Connector
        points={[
          [fx, C2],
          [policyDrawn.x, C2],
        ]}
        defs={id}
        kind="request"
        flow="policy"
      />
      <Connector points={out(evidence)} defs={id} kind="request" flow="evidence" />
      <Packet
        points={[
          [draft.x + draft.w, C2],
          [fx, C2],
          [policyDrawn.x, C2],
        ]}
        kind="request"
        dur={1.8}
        flow="policy"
      />
      <Node
        {...schema}
        label="Schema"
        sub="shape and types"
        icon="queue"
        flow="schema"
        hint="Is every field present and well formed?"
      />
      <DrillNode {...policy} drill="policy" sub="rules that must hold" icon="lock" flow="policy" />
      <Node
        {...evidence}
        label="Evidence"
        sub="cited and recorded"
        icon="db"
        flow="evidence"
        hint="Does every claim point at something the tools recorded?"
      />
      <Connector points={merge(schema)} defs={id} kind="response" flow="schema" />
      <Connector points={merge(policyDrawn, policyDrawn.x + policyDrawn.w)} defs={id} kind="response" flow="policy" />
      <Connector points={merge(evidence)} defs={id} kind="response" flow="evidence" />
      <Packet points={merge(evidence)} kind="response" dur={1.8} delay={-0.6} flow="evidence" r={4} />
      <Node
        {...verdict}
        label="Verdict"
        sub="all three agree"
        icon="key"
        accent
        flow={["schema", "policy", "evidence"]}
        hint="Passes only when every check passes"
      />
      <Connector points={toShip} defs={id} kind="accent" flow="ship" />
      <Packet points={toShip} kind="accent" dur={1.6} flow="ship" r={4} />
      <Connector points={toBack} defs={id} dashed flow="back" />
      <Node {...shipBox} label="Ship" sub="to the person" icon="user" flow="ship" />
      <Node {...back} label="Send back" sub="with the reason" icon="model" dashed flow="back" />
      <Label x={872} y={C2 - 8} text="pass" accent />
      <Label x={872} y={C2 + 22} text="fail" />
    </>
  );
}

const checksNarrow = (ctx: DrillRenderContext) => (
  <Column
    ctx={ctx}
    steps={[
      { label: "Draft", sub: "from the model", icon: "doc" },
      { label: "Schema", sub: "shape and types", icon: "queue", hint: "Is every field present and well formed?" },
      { label: "Policy", sub: "rules that must hold", icon: "lock", drill: "policy" },
      { label: "Evidence", sub: "cited and recorded", icon: "db" },
      { label: "Verdict", sub: "all three agree", icon: "key", accent: true, kind: "response" },
      { label: "Ship", sub: "or send back with the reason", icon: "user", kind: "accent" },
    ]}
  />
);

// ── Level 3: policy rules ───────────────────────────────────────────────
const C3 = 200;
const r3 = (x: number, w = 192) => ({ x, y: C3 - 28, w, h: 56 });
const claim = r3(40, 160);
const rule1 = r3(248);
const rule2 = r3(488);
const rule3 = r3(728);
const allow = r3(968, 128);
const block = { x: 368, y: 328, w: 192, h: 56 };
const person = { x: 728, y: 328, w: 192, h: 56 };

function policyWide(ctx: DrillRenderContext) {
  const id = ctx.id;
  const link = (a: { x: number; w: number }, b: { x: number }): Point[] => [
    [a.x + a.w, C3],
    [b.x, C3],
  ];
  const no1: Point[] = [
    [rule1.x + rule1.w / 2, C3 + 28],
    [rule1.x + rule1.w / 2, block.y + 28],
    [block.x, block.y + 28],
  ];
  const no2: Point[] = [
    [rule2.x + rule2.w / 2, C3 + 28],
    [rule2.x + rule2.w / 2, block.y + 28],
    [block.x + block.w, block.y + 28],
  ];
  const high: Point[] = [
    [rule3.x + rule3.w / 2, C3 + 28],
    [rule3.x + rule3.w / 2, person.y],
  ];
  return (
    <>
      <Defs id={id} />
      <Node
        {...claim}
        label="Claim"
        sub="one sentence"
        icon="doc"
        flow="yes"
        hint="Each sentence of the draft is checked on its own"
      />
      <Node
        {...rule1}
        label="Source allowed?"
        sub="rule 1"
        icon="browser"
        flow={["yes", "no"]}
        hint="Only sources on the allow list count"
      />
      <Node
        {...rule2}
        label="Inside scope?"
        sub="rule 2"
        icon="region"
        flow={["yes", "no"]}
        hint="The answer stays inside what was asked"
      />
      <Node
        {...rule3}
        label="Risk level"
        sub="rule 3"
        icon="warning"
        flow={["yes", "high"]}
        hint="High-risk claims always go to a person"
      />
      <Node {...allow} label="Allow" sub="passes" icon="key" accent flow="yes" />
      <Node {...block} label="Block" sub="removed with a reason" icon="lock" dashed flow="no" />
      <Node {...person} label="Ask a person" sub="held for review" icon="user" flow="high" />
      <Connector points={link(claim, rule1)} defs={id} kind="request" flow="yes" />
      <Connector points={link(rule1, rule2)} defs={id} kind="accent" flow="yes" />
      <Connector points={link(rule2, rule3)} defs={id} kind="accent" flow="yes" />
      <Connector points={link(rule3, allow)} defs={id} kind="accent" flow="yes" />
      <Packet
        points={[
          [claim.x + claim.w, C3],
          [allow.x, C3],
        ]}
        kind="accent"
        dur={3}
        flow="yes"
      />
      <Connector points={no1} defs={id} dashed flow="no" />
      <Connector points={no2} defs={id} dashed flow="no" />
      <Connector points={high} defs={id} kind="change" flow="high" />
      <Label x={452} y={C3 - 12} text="yes" anchor="middle" accent />
      <Label x={692} y={C3 - 12} text="yes" anchor="middle" accent />
      <Label x={944} y={C3 - 12} text="low" anchor="middle" accent />
      <Label x={rule1.x + rule1.w / 2 + 8} y={C3 + 64} text="no" />
      <Label x={rule2.x + rule2.w / 2 + 8} y={C3 + 64} text="no" />
      <Label x={rule3.x + rule3.w / 2 + 8} y={C3 + 64} text="high" />
    </>
  );
}

const policyNarrow = (ctx: DrillRenderContext) => (
  <Column
    ctx={ctx}
    steps={[
      { label: "Claim", sub: "one sentence", icon: "doc" },
      { label: "Source allowed?", sub: "no → block", icon: "browser", kind: "accent" },
      { label: "Inside scope?", sub: "no → block", icon: "region", kind: "accent" },
      { label: "Risk level", sub: "high → ask a person", icon: "warning", kind: "accent" },
      { label: "Allow", sub: "passes", icon: "key", accent: true, kind: "accent" },
    ]}
  />
);

export const drillLevels: DrillLevel[] = [
  {
    id: "harness",
    label: "Agent harness",
    title: "Checks decide what leaves the harness",
    caption:
      "A request gathers context, the model plans and calls tools, and checks decide what ships. Open Checks to see what it does.",
    alt: "A request flows through context and a model, which calls tools, into a checks stage that either sends the draft back or passes it on as the answer.",
    legend: [
      { label: "Request", kind: "request" },
      { label: "Tool call", kind: "change" },
      { label: "Result", kind: "response" },
      { label: "Passed", kind: "accent" },
    ],
    render: harnessWide,
    narrow: harnessNarrow,
  },
  {
    id: "checks",
    label: "Checks",
    title: "Checks: three questions before anything ships",
    caption:
      "The draft goes to three checks at once. The verdict passes only when all three agree; anything else goes back with the reason.",
    alt: "A draft fans out to schema, policy and evidence checks, which merge into a verdict that either ships the answer or sends it back.",
    legend: [
      { label: "Draft", kind: "request" },
      { label: "Check result", kind: "response" },
      { label: "Pass", kind: "accent" },
    ],
    render: checksWide,
    narrow: checksNarrow,
  },
  {
    id: "policy",
    label: "Policy",
    title: "Policy: three rules in order",
    caption: "Each claim meets the rules in order. Failing a rule blocks it; a high-risk claim waits for a person.",
    alt: "A claim passes three rules in order: allowed source, inside scope, and risk level. Failing either of the first two blocks it; a high risk sends it to a person; otherwise it is allowed.",
    legend: [
      { label: "Claim", kind: "request" },
      { label: "Passes", kind: "accent" },
      { label: "Needs review", kind: "change" },
    ],
    render: policyWide,
    narrow: policyNarrow,
  },
];

const PARAM = "drill";

/** The path in the URL (`?drill=harness/checks`), so a link opens a level. None on the server. */
function useUrlPath(): [string[] | undefined, (p: string[]) => void] {
  const read = () =>
    typeof location === "undefined" ? undefined : new URLSearchParams(location.search).get(PARAM)?.split("/").filter(Boolean);
  const [path, setPath] = useState<string[] | undefined>(read);
  useEffect(() => {
    const onPop = () => setPath(read());
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);
  const set = (p: string[]) => {
    const url = new URL(location.href);
    if (p.length > 1) url.searchParams.set(PARAM, p.join("/"));
    else url.searchParams.delete(PARAM);
    history.replaceState(null, "", url);
    setPath(p);
  };
  return [path, set];
}

/** The drill-down reference figure, mounted in its section on the diagrams page (`#drill-figure`; `/drill` scrolls there). */
export function DrillExample({ number }: { number: string }) {
  const [path, setPath] = useUrlPath();
  return (
    <DrillFigure
      id="drill-main"
      number={number}
      eyebrow="Drill-down"
      levels={drillLevels}
      viewBox={`0 0 ${W} ${H}`}
      narrowViewBox={`0 0 ${NW} ${NH}`}
      path={path ?? ["harness"]}
      onPathChange={setPath}
    />
  );
}
