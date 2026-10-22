import { Badge, Connector, Defs, Figure, Group, Label, Lane, Node, Packet, type Point } from "../../src";

// Numbered steps: one path across column lanes, read in order. Ported from the
// structure of the homepage case-study figures (column Lanes, Groups per area,
// numbered Badges on the path, one flow name so hover lights the whole path,
// a pass/fail branch and a long elbow back to the start). Generic content.

type Box = { x: number; y: number; w: number; h: number };
const ORDER = "order";
const RECEIPT = "receipt";
const DECLINED = "declined";

// ── Wide ──────────────────────────────────────────────────────────────────
const checkout: Box = { x: 40, y: 104, w: 176, h: 56 };
const validate: Box = { x: 280, y: 104, w: 160, h: 56 };
const reserve: Box = { x: 520, y: 104, w: 192, h: 56 };
const charge: Box = { x: 520, y: 200, w: 192, h: 56 };
const stock: Box = { x: 800, y: 104, w: 256, h: 56 };
const orders: Box = { x: 800, y: 200, w: 256, h: 56 };
const declined: Box = { x: 520, y: 320, w: 192, h: 48 };
const receipt: Box = { x: 800, y: 392, w: 256, h: 56 };

const cy = (b: Box) => b.y + b.h / 2;
const cx = (b: Box) => b.x + b.w / 2;
const right = (a: Box, b: Box): Point[] => [
  [a.x + a.w, cy(a)],
  [b.x, cy(b)],
];
const below = (a: Box, b: Box, x = cx(a)): Point[] => [
  [x, a.y + a.h],
  [x, b.y],
];

function Wide() {
  const id = "steps";
  const p1 = right(checkout, validate);
  const p2 = right(validate, reserve);
  const hold = right(reserve, stock);
  const p3 = below(reserve, charge);
  const paid = right(charge, orders);
  const p5 = below(orders, receipt);
  const no = below(charge, declined);
  const back: Point[] = [
    [receipt.x, cy(receipt)],
    [cx(checkout), cy(receipt)],
    [cx(checkout), checkout.y + checkout.h],
  ];
  return (
    <>
      <Defs id={id} />
      <Lane x={40} w={176} y={40} title="Client" />
      <Lane x={264} w={192} y={40} title="Edge" />
      <Lane x={504} w={224} y={40} title="Background" />
      <Lane x={776} w={304} y={40} title="Data and notify" />

      <Group x={264} y={56} w={192} h={128} title="API" flow={ORDER} hint="Answers fast: checks the order and queues it" />
      <Group x={504} y={56} w={224} h={224} title="Workers" flow={ORDER} hint="Do the slow work off the request path" />
      <Group x={776} y={56} w={304} h={224} title="Database · one writer" flow={ORDER} hint="Only the workers write here" />

      <Node
        {...checkout}
        label="Checkout"
        sub="cart · address"
        icon="user"
        flow={[ORDER, RECEIPT]}
        hint="Where the order starts and where the receipt lands"
      />
      <Node
        {...validate}
        label="Validate"
        sub="schema · limits"
        icon="lock"
        size={13}
        flow={ORDER}
        hint="Rejects a bad order before anything is held"
      />
      <Node
        {...reserve}
        label="Reserve stock"
        sub="hold for 10 min"
        icon="queue"
        size={13}
        flow={ORDER}
        hint="Holds the items so two orders cannot take the last one"
      />
      <Node
        {...charge}
        label="Charge card"
        sub="payment provider"
        icon="key"
        size={13}
        flow={[ORDER, DECLINED]}
        hint="The only step that can say no after the order is accepted"
      />
      <Node {...stock} label="stock" sub="held items" icon="db" size={13} flow={ORDER} />
      <Node
        {...orders}
        label="orders"
        sub="paid, with the receipt id"
        icon="db"
        size={13}
        flow={ORDER}
        hint="Written once the payment succeeds"
      />
      <Node
        {...declined}
        label="Declined"
        sub="hold released"
        icon="warning"
        size={13}
        dashed
        flow={DECLINED}
        hint="The hold is released and the client is told"
      />
      <Node
        {...receipt}
        label="Send receipt"
        sub="email · push"
        icon="doc"
        size={13}
        flow={[ORDER, RECEIPT]}
        hint="Goes back to the client who placed the order"
      />

      <Badge cx={checkout.x} cy={checkout.y} text="1" accent />
      <Badge cx={validate.x} cy={validate.y} text="2" accent />
      <Badge cx={reserve.x} cy={reserve.y} text="3" accent />
      <Badge cx={charge.x} cy={charge.y} text="4" accent />
      <Badge cx={orders.x} cy={orders.y} text="5" accent />
      <Badge cx={receipt.x} cy={receipt.y} text="6" accent />

      <Connector points={p1} defs={id} kind="request" flow={ORDER} />
      <Packet points={p1} kind="request" dur={1.4} flow={ORDER} r={4} />
      <Connector points={p2} defs={id} kind="request" flow={ORDER} />
      <Packet points={p2} kind="request" dur={1.4} delay={-0.4} flow={ORDER} r={4} />
      <Label x={480} y={cy(validate) - 10} text="queue" anchor="middle" />
      <Connector points={hold} defs={id} flow={ORDER} />
      <Label x={756} y={cy(reserve) - 10} text="hold" anchor="middle" />
      <Connector points={p3} defs={id} kind="request" flow={ORDER} />
      <Connector points={paid} defs={id} kind="request" flow={ORDER} />
      <Packet points={paid} kind="request" dur={1.4} delay={-0.8} flow={ORDER} r={4} />
      <Label x={756} y={cy(charge) - 10} text="paid" anchor="middle" accent />
      <Connector points={no} defs={id} dashed flow={DECLINED} />
      <Label x={cx(charge) + 12} y={292} text="declined" />
      <Connector points={p5} defs={id} kind="request" flow={ORDER} />
      <Connector points={back} defs={id} kind="response" flow={RECEIPT} />
      <Packet points={back} kind="response" dur={3.6} flow={RECEIPT} r={4} />
      <Label x={cx(checkout) + 12} y={cy(receipt) - 10} text="receipt" />
    </>
  );
}

// ── Narrow: the same six steps in one column ──────────────────────────────
const NX = 48;
const NW = 296;
const step = (i: number, w = NW): Box => ({ x: NX, y: 24 + i * 80, w, h: 48 });

function Narrow() {
  const id = "steps-n";
  const s = [step(0), step(1), step(2), step(3, 184), step(4), step(5)];
  const no: Box = { x: 264, y: s[3].y, w: 80, h: 48 };
  const labels: [string, string, string][] = [
    ["Checkout", "cart · address", "user"],
    ["Validate", "schema · limits", "lock"],
    ["Reserve stock", "hold for 10 min", "queue"],
    ["Charge card", "provider", "key"],
    ["Write order", "orders table", "db"],
    ["Send receipt", "email · push", "doc"],
  ];
  const X = NX + 112;
  const back: Point[] = [
    [NX, cy(s[5])],
    [24, cy(s[5])],
    [24, cy(s[0])],
    [NX, cy(s[0])],
  ];
  return (
    <>
      <Defs id={id} />
      {s.map((b, i) => {
        const [label, sub, icon] = labels[i];
        const into: Point[] | null = i
          ? [
              [X, s[i - 1].y + 48],
              [X, b.y],
            ]
          : null;
        return (
          <g key={label}>
            {into ? <Connector points={into} defs={id} kind="request" flow={ORDER} /> : null}
            {into && i % 2 ? <Packet points={into} kind="request" dur={1.2} delay={-i * 0.3} flow={ORDER} r={4} /> : null}
            <Node
              {...b}
              label={label}
              sub={sub}
              icon={icon as "user"}
              size={14}
              flow={i === 0 || i === 5 ? [ORDER, RECEIPT] : ORDER}
            />
            <Badge cx={b.x} cy={b.y} text={String(i + 1)} accent />
          </g>
        );
      })}
      <Label x={X + 12} y={s[2].y - 12} text="queue" />
      <Connector points={right(s[3], no)} defs={id} dashed flow={DECLINED} />
      <Node {...no} label="Declined" size={13} dashed flow={DECLINED} align="center" />
      <Connector points={back} defs={id} kind="response" flow={RECEIPT} />
      <Packet points={back} kind="response" dur={3} flow={RECEIPT} r={4} />
    </>
  );
}

export function NumberedStepsFigure({ number }: { number: string }) {
  return (
    <Figure
      number={number}
      eyebrow="Numbered steps"
      title="An order in six steps"
      caption="Notice the numbers: they let the reader follow one path across four areas without arrows doing all the work. Hover any step to light the whole path; the declined branch and the receipt back to the client have flows of their own."
      legend={[
        { label: "Order", kind: "request" },
        { label: "Receipt", kind: "response" },
      ]}
      viewBox="0 0 1120 480"
      narrow={<Narrow />}
      narrowViewBox="0 0 360 496"
      alt="An order goes from checkout (1) to the API's validate step (2), through a queue to a worker that reserves stock (3) and charges the card (4). A paid order is written to the orders table (5) and a receipt is sent (6) back to checkout; a declined charge releases the hold."
    >
      <Wide />
    </Figure>
  );
}
