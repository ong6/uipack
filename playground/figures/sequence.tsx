import { Defs, Figure, Label, Lane, Lifeline, Lost, Message, Node, SelfLoop, type ConnectorKind, type Flow } from "../../src";

// A sequence diagram from the sequence parts (Lifeline, Message, Lost, SelfLoop): actors across the
// top, time runs down their dashed lifelines, and each message is a numbered arrow with a packet.
// A self-loop is a retry; a dashed message ending in ✕ never arrived; a dashed note says why.
// Generic job submission; no real protocol is described.

const SUBMIT = "submit";
const WORK = "work";
const POLL = "poll";

interface Msg {
  from: number;
  to: number;
  y: number;
  n: number;
  label: string;
  kind: Exclude<ConnectorKind, "accent">;
  flow: Flow;
}

const Lifelines = ({ xs, top, bottom }: { xs: number[]; top: number; bottom: number }) => (
  <>
    {xs.map((x) => (
      <Lifeline key={x} x={x} y1={top} y2={bottom} />
    ))}
  </>
);

// ── Wide ────────────────────────────────────────────────────────────────
const CLIENT = 176;
const API = 528;
const WORKER = 880;

function Wide() {
  const id = "fig-seq";
  const msgs: Msg[] = [
    { from: CLIENT, to: API, y: 144, n: 1, label: "submit job", kind: "request", flow: SUBMIT },
    { from: API, to: CLIENT, y: 192, n: 2, label: "202 accepted · job id", kind: "response", flow: SUBMIT },
    { from: API, to: WORKER, y: 240, n: 3, label: "enqueue", kind: "change", flow: [SUBMIT, WORK] },
    { from: CLIENT, to: API, y: 440, n: 6, label: "poll status", kind: "request", flow: POLL },
    { from: API, to: CLIENT, y: 488, n: 7, label: "done · result", kind: "response", flow: POLL },
  ];
  return (
    <>
      <Defs id={id} />
      <Lane x={0} w={352} y={24} title="Caller" />
      <Lane x={352} w={352} y={24} title="Front door" />
      <Lane x={704} w={352} y={24} title="Background" />
      <Node
        x={CLIENT - 88}
        y={40}
        w={176}
        h={48}
        label="Client"
        icon="client"
        flow={[SUBMIT, POLL]}
        hint="Sends the job, then polls for the result"
      />
      <Node
        x={API - 88}
        y={40}
        w={176}
        h={48}
        label="API"
        icon="gateway"
        flow={[SUBMIT, POLL]}
        hint="Answers at once and hands the slow work on"
      />
      <Node
        x={WORKER - 88}
        y={40}
        w={176}
        h={48}
        label="Worker"
        icon="service"
        flow={WORK}
        hint="Does the work outside any request"
      />
      <Lifelines xs={[CLIENT, API, WORKER]} top={88} bottom={512} />
      {msgs.map((m, i) => (
        <Message key={m.n} id={id} {...m} labelSize={11} packet={{ delay: -i * 0.4 }} />
      ))}
      <SelfLoop id={id} x={WORKER} y={288} h={40} w={48} side="right" n={4} kind="change" packet={{ delay: -0.6 }} flow={WORK} />
      <Label x={WORKER + 60} y={312} text="retry on timeout" />
      <Lost
        id={id}
        from={WORKER}
        to={CLIENT}
        y={384}
        n={5}
        label="progress update"
        labelSize={11}
        labelX={(API + WORKER) / 2}
        flow={WORK}
      />
      <Node
        x={16}
        y={360}
        w={144}
        h={48}
        label="Tab closed"
        sub="job keeps running"
        dashed
        size={13}
        hint="The job does not depend on the connection that started it"
      />
    </>
  );
}

// ── Narrow: the same seven messages in three 120-wide columns ───────────
const NC = 60;
const NA = 180;
const NWK = 300;

function Narrow() {
  const id = "fig-seq-n";
  const msgs: Msg[] = [
    { from: NC, to: NA, y: 128, n: 1, label: "submit job", kind: "request", flow: SUBMIT },
    { from: NA, to: NC, y: 176, n: 2, label: "202 · job id", kind: "response", flow: SUBMIT },
    { from: NA, to: NWK, y: 224, n: 3, label: "enqueue", kind: "change", flow: [SUBMIT, WORK] },
    { from: NC, to: NA, y: 416, n: 6, label: "poll status", kind: "request", flow: POLL },
    { from: NA, to: NC, y: 464, n: 7, label: "done · result", kind: "response", flow: POLL },
  ];
  return (
    <>
      <Defs id={id} />
      <Lane x={0} w={120} y={24} title="Caller" />
      <Lane x={120} w={120} y={24} title="Front door" />
      <Lane x={240} w={120} y={24} title="Background" />
      <Node x={NC - 52} y={40} w={104} h={40} label="Client" align="center" flow={[SUBMIT, POLL]} />
      <Node x={NA - 52} y={40} w={104} h={40} label="API" align="center" flow={[SUBMIT, POLL]} />
      <Node x={NWK - 52} y={40} w={104} h={40} label="Worker" align="center" flow={WORK} />
      <Lifelines xs={[NC, NA, NWK]} top={80} bottom={488} />
      {msgs.map((m, i) => (
        <Message key={m.n} id={id} {...m} labelSize={11} packet={{ delay: -i * 0.4 }} />
      ))}
      <SelfLoop id={id} x={NWK} y={264} h={40} w={48} side="right" n={4} kind="change" packet={{ delay: -0.6 }} flow={WORK} />
      <Label x={288} y={280} text="retry on" anchor="end" />
      <Label x={288} y={298} text="timeout" anchor="end" />
      <Lost id={id} from={NWK} to={NC} y={352} n={5} label="progress" labelSize={11} labelX={(NA + NWK) / 2} flow={WORK} />
      <Label x={76} y={374} text="tab closed" />
    </>
  );
}

export function SequenceFigure({ number }: { number: string }) {
  return (
    <Figure
      number={number}
      eyebrow="Sequence"
      title="The job outlives the request that started it"
      caption="Read the numbers down the page: time runs down the dashed lifelines. Notice the self-loop on the worker (a retry), the dashed message that ends in ✕ (never delivered) and the dashed note that says why polling still works."
      legend={[
        { label: "Request", kind: "request" },
        { label: "Response", kind: "response" },
        { label: "Hand-off", kind: "change" },
      ]}
      viewBox="0 0 1120 528"
      narrow={<Narrow />}
      narrowViewBox="0 0 360 504"
      alt="A sequence between a client, an API and a background worker. 1: the client submits a job. 2: the API answers at once with an id. 3: the API enqueues the job for the worker. 4: the worker retries on a timeout. 5: a progress update to the client is lost because the tab was closed, but the job keeps running. 6: the client polls the status. 7: the API returns the result."
    >
      <Wide />
    </Figure>
  );
}
