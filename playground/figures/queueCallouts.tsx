import { Connector, Defs, Figure, Group, Label, Node, Packet } from "../../src";

// A pipeline that narrows. Packets leave the first step fast on three lanes,
// pile up as a still queue in front of the one slow step (accented), and only
// one at a time moves on. Underneath, dashed callouts name what would widen
// each step. Conceptual figure: no numbers anywhere.

const F = "work";

// A packet on a zero-length path holds still: the queue is drawn in the same token as the moving work.
const held = (x: number, y: number, key: number) => <Packet key={key} points={[[x, y], [x, y]]} kind="request" r={6} trim={[0, 0]} at={0} flow={F} />;

// ── Wide ────────────────────────────────────────────────────────────────
const CY = 160;
const LANES = [CY - 40, CY, CY + 40];
// A 5 × 3 pile of still packets packed against the slow step.
const QUEUE = [0, 1, 2, 3, 4].flatMap((c) => [-16, 0, 16].map((d) => [608 + c * 16, CY + d] as const));

function Wide() {
  const id = "fig-queue";
  return (
    <>
      <Defs id={id} />
      <Node x={64} y={72} w={160} h={176} label="Draft" sub="many writers" icon="user" size={16} subSize={12} hint="Changes are written faster than they can be approved" />
      {LANES.map((y, i) => (
        <g key={y}>
          <Connector points={[[224, y], [296, y]]} defs={id} kind="request" />
          <Packet points={[[224, y], [296, y]]} kind="request" dur={0.9} delay={-i * 0.3} r={4} />
        </g>
      ))}
      <Node x={296} y={104} w={160} h={112} label="Check" sub="tests · lint" icon="terminal" size={16} subSize={12} hint="Automated, so it keeps up with the writers" />
      <Connector points={[[456, CY], [704, CY]]} defs={id} kind="request" flow={F} />
      <Packet points={[[456, CY], [592, CY]]} kind="request" dur={0.9} r={4} trim={[6, 4]} flow={F} />
      <Packet points={[[456, CY], [592, CY]]} kind="request" dur={0.9} delay={-0.45} r={4} trim={[6, 4]} flow={F} />
      {QUEUE.map(([x, y], i) => held(x, y, i))}
      <Label x={640} y={CY - 36} text="waiting for approval" anchor="middle" size={12} />
      <Node x={704} y={CY - 28} w={152} h={56} label="Approve" sub="one approver" icon="user" accent flow={F} hint="The narrow step: every change waits here" />
      <Connector points={[[856, CY], [904, CY]]} defs={id} kind="request" flow={F} />
      <Packet points={[[856, CY], [904, CY]]} kind="request" dur={3.2} r={4} flow={F} />
      <Node x={904} y={CY - 28} w={160} h={56} label="Release" sub="approver's pace" icon="git" flow={F} hint="Ships only as fast as the slowest step" />

      <Group x={32} y={280} w={1056} h={128} variant="dashed" accent>
        <Label x={1056} y={356} text="what widens each step" anchor="end" size={12} accent />
        <Node x={64} y={320} w={176} h={64} label="Shared checklist" sub="definition of done" icon="doc" dashed hint="Writers hand over work that is already complete" />
        <Connector points={[[144, 320], [144, 248]]} defs={id} dashed />
        <Node x={280} y={320} w={192} h={64} label="Faster checks" sub="anyone can run them" icon="terminal" dashed hint="Problems are caught before they reach a person" />
        <Connector points={[[376, 320], [376, 216]]} defs={id} dashed />
        <Node x={640} y={320} w={216} h={64} label="Risk tiers" sub="skim low-risk changes" icon="lock" dashed hint="The approver reads evidence first and spends time where risk is" />
        <Connector points={[[780, 320], [780, 188]]} defs={id} dashed />
      </Group>
    </>
  );
}

// ── Narrow: top to bottom, callouts in a column on the right ────────────
const MX = 112; // spine
const MQ = [0, 1, 2, 3, 4].flatMap((r) => [-16, 0, 16].map((d) => [MX + d, 296 + r * 16] as const));

function Narrow() {
  const id = "fig-queue-n";
  return (
    <>
      <Defs id={id} />
      <Label x={292} y={28} text="what widens it" anchor="middle" size={12} accent />
      <Node x={16} y={48} w={192} h={56} label="Draft" sub="many writers" icon="user" />
      {[56, 112, 168].map((x, i) => (
        <g key={x}>
          <Connector points={[[x, 104], [x, 152]]} defs={id} kind="request" />
          <Packet points={[[x, 104], [x, 152]]} kind="request" dur={0.9} delay={-i * 0.3} r={4} />
        </g>
      ))}
      <Node x={32} y={152} w={160} h={56} label="Check" sub="tests · lint" icon="terminal" />
      <Connector points={[[MX, 208], [MX, 392]]} defs={id} kind="request" flow={F} />
      <Packet points={[[MX, 208], [MX, 280]]} kind="request" dur={0.9} r={4} trim={[6, 4]} flow={F} />
      <Packet points={[[MX, 208], [MX, 280]]} kind="request" dur={0.9} delay={-0.45} r={4} trim={[6, 4]} flow={F} />
      {MQ.map(([x, y], i) => held(x, y, i))}
      <Label x={144} y={324} text="waiting for" size={12} />
      <Label x={144} y={342} text="approval" size={12} />
      <Node x={32} y={392} w={160} h={56} label="Approve" sub="one approver" icon="user" accent flow={F} />
      <Connector points={[[MX, 448], [MX, 496]]} defs={id} kind="request" flow={F} />
      <Packet points={[[MX, 448], [MX, 496]]} kind="request" dur={3.2} r={4} flow={F} />
      <Node x={16} y={496} w={192} h={56} label="Release" sub="approver's pace" icon="git" flow={F} />

      <Node x={232} y={52} w={112} h={48} label="Checklist" size={13} align="center" dashed />
      <Connector points={[[232, 76], [208, 76]]} defs={id} dashed />
      <Node x={232} y={156} w={112} h={48} label="Fast checks" size={13} align="center" dashed />
      <Connector points={[[232, 180], [192, 180]]} defs={id} dashed />
      <Node x={232} y={396} w={112} h={48} label="Risk tiers" size={13} align="center" dashed />
      <Connector points={[[232, 420], [192, 420]]} defs={id} dashed />
    </>
  );
}

export function QueueCalloutsFigure({ number }: { number: string }) {
  return (
    <Figure
      number={number}
      eyebrow="Queue and callouts"
      title="The team ships at the speed of its slowest step"
      caption="Notice the still packets: work that left the fast steps is drawn as a queue in front of the one accented step, and only one packet at a time moves on. The dashed callouts underneath point at the step each change would widen."
      legend={[
        { label: "Change", kind: "request" },
        { label: "Slowest step", kind: "accent" },
      ]}
      viewBox="0 0 1120 424"
      narrow={<Narrow />}
      narrowViewBox="0 0 360 568"
      alt="A pipeline from left to right: Draft, Check, Approve, Release. Many writers send changes out on three lanes; Check passes them on; they pile up in a queue in front of Approve, the narrowest step with one approver; only one change at a time reaches Release. Underneath, what widens each step: a shared checklist under Draft, faster checks under Check, and risk tiers under Approve.">
      <Wide />
    </Figure>
  );
}
