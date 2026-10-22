import { Connector, Defs, Figure, Group, Label, Node, Packet, type IconName, type Point } from "../../src";

// A pipeline where any stage can fail, and every failure lands in one place.
// The work moves left to right inside an accent "async" boundary; each stage
// drops a dashed stub to one failure rail under the row, which ends in a
// dead-letter queue. Generic upload processing; no real system is described.

const DOC = "document";
const FAIL = "failure";

interface Stage {
  label: string;
  sub: string;
  icon: IconName;
  hint: string;
}

const STAGES: Stage[] = [
  { label: "Fingerprint", sub: "skip if seen", icon: "key", hint: "A content hash: uploading the same file twice does nothing" },
  { label: "Fetch", sub: "raw file", icon: "cloud", hint: "Downloads the original from storage" },
  { label: "Extract", sub: "plain text", icon: "doc", hint: "Turns the file into text the later stages can read" },
  { label: "Redact", sub: "remove PII", icon: "lock", hint: "Personal data comes out before anything is indexed" },
  { label: "Index", sub: "embed, write", icon: "db", hint: "Writes the searchable form, then marks the job done" },
];

// ── Wide: stages left to right, the rail underneath ─────────────────────
const CY = 144;
const SW = 112;
const SH = 56;
const STEP = 152;
const sx = (i: number) => 208 + i * STEP; // stage centres 264, 416, 568, 720, 872: on the 8px grid
const upload = { x: 16, y: CY - 28, w: 152, h: 56 }; // wide enough that "file received" clears the edge
const ready = { x: 960, y: CY - 28, w: 152, h: 56 };
const RAIL = 272;
const dlq = { x: 960, y: RAIL - 28, w: 152, h: 56 };

function Wide() {
  const id = "fig-rail";
  const hops: Point[][] = STAGES.slice(1).map((_, i) => [
    [sx(i) + SW, CY],
    [sx(i + 1), CY],
  ]);
  const queued: Point[] = [[upload.x + upload.w, CY], [sx(0), CY]];
  const done: Point[] = [[sx(STAGES.length - 1) + SW, CY], [ready.x, CY]];
  const rail: Point[] = [[sx(0) + SW / 2, RAIL], [dlq.x, RAIL]];
  return (
    <>
      <Defs id={id} />
      <Group x={184} y={64} w={768} h={136} title="Async job" variant="dashed" accent flow={DOC} hint="Runs off the request path, one checkpoint per stage" />
      <Node {...upload} label="Upload" sub="file received" icon="user" flow={DOC} hint="The request returns as soon as the job is queued" />
      <Connector points={queued} defs={id} kind="accent" flow={DOC} />
      <Packet points={queued} kind="change" dur={1.4} r={4} flow={DOC} />
      {STAGES.map((s, i) => (
        <Node key={s.label} x={sx(i)} y={CY - SH / 2} w={SW} h={SH} label={s.label} sub={s.sub} hint={s.hint} flow={[DOC, FAIL]} />
      ))}
      {hops.map((p, i) => (
        <g key={i}>
          <Connector points={p} defs={id} kind="change" flow={DOC} />
          <Packet points={p} kind="change" dur={1} delay={-i * 0.25} r={4} flow={DOC} />
        </g>
      ))}
      <Connector points={done} defs={id} kind="change" flow={DOC} />
      <Packet points={done} kind="change" dur={1.4} delay={-0.7} r={4} flow={DOC} />
      <Node {...ready} label="Ready" sub="searchable" icon="doc" flow={DOC} hint="Shown as ready once the last stage has written" />

      {/* Every stage can drop out: a dashed stub down to one rail. */}
      {STAGES.map((s, i) => (
        <Connector key={s.label} points={[[sx(i) + SW / 2, CY + SH / 2], [sx(i) + SW / 2, RAIL]]} arrow={false} dashed inset={[2, 0]} flow={FAIL} />
      ))}
      <Connector points={rail} defs={id} dashed flow={FAIL} />
      <Packet points={rail} kind="neutral" dur={6} r={4} flow={FAIL} />
      <Label x={sx(0) + SW / 2 + 8} y={RAIL + 24} text="on failure, from any stage" />
      <Node {...dlq} label="Dead letters" sub="retry from step" icon="queue" dashed flow={FAIL} hint="Failed jobs keep their payload and error, and rerun from the stage that failed" />
    </>
  );
}

// ── Narrow: the same pipeline top to bottom, the rail down the left ─────
const NX = 72;
const NW = 264;
const NH = 48;
const NC = NX + NW / 2; // 204
const ny = (i: number) => 136 + i * 72;
const N_RAIL = 32;
const nReady = { x: NX, y: 520, w: NW, h: NH };
const nDlq = { x: 16, y: 600, w: 232, h: NH };

function Narrow() {
  const id = "fig-rail-n";
  const queued: Point[] = [[NC, 64], [NC, ny(0)]];
  const done: Point[] = [[NC, ny(STAGES.length - 1) + NH], [NC, nReady.y]];
  const rail: Point[] = [[N_RAIL, ny(0) + NH / 2], [N_RAIL, nDlq.y]];
  return (
    <>
      <Defs id={id} />
      <Node x={NX} y={16} w={NW} h={NH} label="Upload" sub="file received" icon="user" flow={DOC} />
      <Group x={56} y={96} w={296} h={400} title="Async job" variant="dashed" accent flow={DOC} />
      <Connector points={queued} defs={id} kind="accent" flow={DOC} />
      <Packet points={queued} kind="change" dur={1.4} r={4} flow={DOC} />
      {STAGES.map((s, i) => (
        <g key={s.label}>
          <Node x={NX} y={ny(i)} w={NW} h={NH} label={s.label} sub={s.sub} icon={s.icon} hint={s.hint} flow={[DOC, FAIL]} />
          {i > 0 ? (
            <>
              <Connector points={[[NC, ny(i - 1) + NH], [NC, ny(i)]]} defs={id} kind="change" flow={DOC} />
              <Packet points={[[NC, ny(i - 1) + NH], [NC, ny(i)]]} kind="change" dur={1} delay={-i * 0.25} r={4} flow={DOC} />
            </>
          ) : null}
          <Connector points={[[NX, ny(i) + NH / 2], [N_RAIL, ny(i) + NH / 2]]} arrow={false} dashed inset={[2, 0]} flow={FAIL} />
        </g>
      ))}
      <Connector points={done} defs={id} kind="change" flow={DOC} />
      <Node {...nReady} label="Ready" sub="searchable" icon="doc" flow={DOC} />
      <Connector points={rail} defs={id} dashed flow={FAIL} />
      <Packet points={rail} kind="neutral" dur={6} r={4} flow={FAIL} />
      <Node {...nDlq} label="Dead letters" sub="retry from step" icon="queue" dashed flow={FAIL} />
    </>
  );
}

export function FailureRailFigure({ number }: { number: string }) {
  return (
    <Figure
      number={number}
      eyebrow="Failure rail"
      title="Every stage can fail, and every failure lands in one place"
      caption="Notice the dashed stub under each stage: they join one rail to a dead-letter queue, so a reader sees that no failure is lost without a line per error case. The accent boundary marks what runs off the request path."
      legend={[
        { label: "Document", kind: "change" },
        { label: "Failure", kind: "neutral" },
      ]}
      viewBox="0 0 1120 320"
      narrow={<Narrow />}
      narrowViewBox="0 0 360 664"
      alt="An upload is queued into an async job of five stages, fingerprint, fetch, extract, redact and index, that ends with the document ready. Each stage has a dashed line down to one failure rail that ends in a dead-letter queue, where failed jobs retry from the stage that failed.">
      <Wide />
    </Figure>
  );
}
