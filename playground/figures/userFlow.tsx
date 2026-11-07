import {
  Action,
  Actor,
  Connector,
  Decision,
  Defs,
  Figure,
  Label,
  LaneRule,
  Outcome,
  Packet,
  Screen,
  type ConnectorKind,
  type Point,
} from "../../src";

// A user flow from the user-flow parts: two actor lanes (an admin who fills a library, a member
// who searches it), screens with window chrome, action pills, decision diamonds with yes and no
// branches, a retry loop, outcome stadiums and one dashed cross-lane dependency as the accent.
// Composition after junxiong.dev's Compoze user flow; the product copy is generic.

const ADMIN = "admin";
const MEMBER = "member";
const LINK = "link";

const hop = (x1: number, x2: number, y: number): Point[] => [
  [x1, y],
  [x2, y],
];

function Hop({
  id,
  pts,
  kind,
  flow,
  delay = 0,
  packet = true,
}: {
  id: string;
  pts: Point[];
  kind: ConnectorKind;
  flow: string;
  delay?: number;
  packet?: boolean;
}) {
  return (
    <>
      <Connector points={pts} defs={id} flow={flow} />
      {packet ? <Packet points={pts} kind={kind} dur={1.1} delay={delay} r={4} flow={flow} /> : null}
    </>
  );
}

// ── Wide ────────────────────────────────────────────────────────────────
const A = 168; // admin lane centre line
const U = 488; // member lane centre line
const linkPath: Point[] = [
  [936, A + 28],
  [936, 392],
  [912, 392],
  [912, U - 64],
];

function Wide() {
  const id = "fig-uf";
  return (
    <>
      <Defs id={id} />
      {/* admin lane */}
      <Actor cx={92} cy={A} role="Admin" sub="per team" flow={ADMIN} />
      <Hop id={id} pts={hop(120, 184, A)} kind="change" flow={ADMIN} />
      <Action x={184} y={A - 22} w={160} label="Connect a source" sub="OAuth" flow={ADMIN} />
      <Hop id={id} pts={hop(344, 376, A)} kind="change" flow={ADMIN} delay={-0.3} />
      <Screen x={376} y={A - 64} w={152} title="Library" lines={["pick folders", "owner per file"]} flow={ADMIN} />
      <Hop id={id} pts={hop(528, 560, A)} kind="change" flow={ADMIN} delay={-0.6} />
      <Screen x={560} y={A - 64} w={152} title="Import status" lines={["queued → ready", "failures counted"]} flow={ADMIN} />
      <Hop id={id} pts={hop(712, 736, A)} kind="change" flow={ADMIN} packet={false} />
      <Decision cx={776} cy={A} label="Failed?" flow={ADMIN} />
      <Connector
        points={[
          [776, A + 40],
          [776, 256],
        ]}
        defs={id}
      />
      <Label x={786} y={236} text="yes" />
      <Action x={712} y={256} w={128} h={40} label="Retry the file" />
      <Connector
        points={[
          [712, 276],
          [636, 276],
          [636, 232],
        ]}
        defs={id}
        dashed
      />
      <Hop id={id} pts={hop(816, 848, A)} kind="change" flow={ADMIN} delay={-0.9} />
      <Label x={832} y={A - 10} text="no" anchor="middle" />
      <Outcome x={848} y={A - 28} w={176} label="Ready to search" sub="indexed" flow={[ADMIN, LINK]} />

      <LaneRule x1={24} x2={1176} y={336} />

      {/* member lane */}
      <Actor cx={92} cy={U} role="Member" sub="staff" flow={MEMBER} />
      <Hop id={id} pts={hop(120, 184, U)} kind="request" flow={MEMBER} />
      <Screen x={184} y={U - 64} w={152} title="Pick a space" lines={["four spaces", "own sources each"]} flow={MEMBER} />
      <Hop id={id} pts={hop(336, 368, U)} kind="request" flow={MEMBER} delay={-0.3} />
      <Screen x={368} y={U - 64} w={152} title="Empty state" lines={["example questions", "sources listed"]} flow={MEMBER} />
      <Hop id={id} pts={hop(520, 552, U)} kind="request" flow={MEMBER} delay={-0.6} />
      <Action x={552} y={U - 22} w={144} label="Ask a question" flow={MEMBER} />
      <Hop id={id} pts={hop(696, 720, U)} kind="request" flow={MEMBER} packet={false} />
      <Decision cx={760} cy={U} label="Found?" flow={MEMBER} />
      <Connector
        points={[
          [760, U + 40],
          [760, 576],
        ]}
        defs={id}
      />
      <Label x={770} y={556} text="no" />
      <Action x={696} y={576} w={128} h={40} label="Says so" sub="names what's missing" />
      <Hop id={id} pts={hop(800, 832, U)} kind="request" flow={MEMBER} delay={-0.9} />
      <Label x={816} y={U - 10} text="yes" anchor="middle" />
      <Screen
        x={832}
        y={U - 64}
        w={160}
        title="Cited answer"
        lines={["sources inline", "scores shown"]}
        accent
        flow={[MEMBER, LINK]}
      />
      <Connector points={hop(992, 1024, U)} defs={id} kind="response" flow={MEMBER} />
      <Packet points={hop(992, 1024, U)} kind="response" dur={1.1} r={4} flow={MEMBER} />
      <Outcome x={1024} y={U - 28} w={152} label="Opens a source" sub="then trusts it" flow={MEMBER} />

      {/* the admin's outcome is what the member's search reads: the one accent path */}
      <Connector points={linkPath} defs={id} kind="accent" dashed flow={LINK} />
      <Packet points={linkPath} kind="accent" dur={2.4} r={4} flow={LINK} />
      <Label x={948} y={300} text="searchable" accent />
    </>
  );
}

// ── Narrow: each lane as a column, the accent link between them ─────────
function Narrow() {
  const id = "fig-uf-n";
  const L = 92; // admin column centre
  const R = 268; // member column centre
  const down = (x: number, y1: number, y2: number): Point[] => [
    [x, y1],
    [x, y2],
  ];
  return (
    <>
      <Defs id={id} />
      <Actor cx={L} cy={48} r={24} role="Admin" flow={ADMIN} />
      <Hop id={id} pts={down(L, 104, 128)} kind="change" flow={ADMIN} />
      <Action x={L - 76} y={128} w={152} h={40} label="Connect a source" flow={ADMIN} />
      <Hop id={id} pts={down(L, 168, 192)} kind="change" flow={ADMIN} delay={-0.4} />
      <Screen x={L - 76} y={192} w={152} h={112} title="Import status" lines={["queued → ready"]} flow={ADMIN} />
      <Hop id={id} pts={down(L, 304, 328)} kind="change" flow={ADMIN} packet={false} />
      <Decision cx={L} cy={360} r={32} label="Failed?" flow={ADMIN} />
      <Label x={L + 8} y={412} text="no" />
      <Hop id={id} pts={down(L, 392, 432)} kind="change" flow={ADMIN} delay={-0.8} />
      <Outcome x={L - 76} y={432} w={152} h={48} label="Ready" flow={[ADMIN, LINK]} />

      <Actor cx={R} cy={48} r={24} role="Member" flow={MEMBER} />
      <Hop id={id} pts={down(R, 104, 128)} kind="request" flow={MEMBER} />
      <Action x={R - 76} y={128} w={152} h={40} label="Ask a question" flow={MEMBER} />
      <Hop id={id} pts={down(R, 168, 328)} kind="request" flow={MEMBER} packet={false} />
      <Decision cx={R} cy={360} r={32} label="Found?" flow={MEMBER} />
      <Label x={R + 8} y={412} text="yes" />
      <Hop id={id} pts={down(R, 392, 432)} kind="request" flow={MEMBER} delay={-0.4} />
      <Screen x={R - 76} y={432} w={152} h={96} title="Cited answer" accent flow={[MEMBER, LINK]} />

      <Connector
        points={[
          [L, 480],
          [L, 552],
          [R, 552],
          [R, 528],
        ]}
        defs={id}
        kind="accent"
        dashed
        flow={LINK}
      />
      <Label x={180} y={556} text="searchable" anchor="middle" accent />
    </>
  );
}

export function UserFlowFigure({ number }: { number: string }) {
  return (
    <Figure
      number={number}
      eyebrow="User flow"
      title="An admin fills the library, then a member asks it questions"
      caption="Read each lane left to right: who acts, what they see, what they do, where it branches and where it lands. The one dashed accent line is the dependency between the lanes."
      legend={[
        { label: "Admin", kind: "change" },
        { label: "Member", kind: "request" },
        { label: "Answer", kind: "response" },
      ]}
      viewBox="0 0 1200 672"
      narrow={<Narrow />}
      narrowViewBox="0 0 360 576"
      alt="Two lanes. Admin: connects a source, picks folders in the library, watches import status; a failed file is retried, otherwise the library is ready to search. Member: picks a space, starts from example questions, asks; if nothing is found the product says so and names what is missing, otherwise it shows a cited answer and the member opens a source. A dashed accent line shows the admin's ready library feeding the member's cited answer."
    >
      <Wide />
    </Figure>
  );
}
