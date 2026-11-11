import { Badge, Bus, Connector, Defs, Figure, Label, Node, Token, useFigureMotion, type Point } from "../../src";
import { useHydrated } from "../../src/env";
import { READ_ORDER } from "./content";
import "../../src/theme.css";

/*
 * The landing hero's figure: the agent read order (docs/agents/README.md) as a live uipack figure.
 * Four numbered sources feed one page through a bus; on a 10-second loop each source lights in turn,
 * a request token rides from it to the page, and the page gains what that source gives it: the
 * section outline (the skill's order of work), the look (the spec), the layout and words (the core
 * rules), then the parts (the component docs). Pause and Replay are the Figure's; under reduced
 * motion, and before the first paint, the page is drawn finished and nothing moves.
 *
 * Two authored drawings: the wide one beside the hero copy, and a narrow one below 720px that keeps
 * every label at the figure's 11px floor on a 390px phone.
 */

type Box = { x: number; y: number; w: number; h: number };
const CYCLE = 10;
const cy = (b: Box) => b.y + b.h / 2;

/** Each step's window on the loop, as fractions of CYCLE: when its source lights and its token rides. */
const at = (i: number) => {
  const s = 0.2 * i;
  return { on: s + 0.01, ride: s + 0.02, arrive: s + 0.14, off: s + 0.18 };
};
const f = (n: number) => Math.min(1, Math.max(0, Number(n.toFixed(3))));

/** An opacity loop: hidden until `from`, shown until the loop's end (0.94), then reset. */
function Appear({ from }: { from: number }) {
  return (
    <animate
      attributeName="opacity"
      dur={`${CYCLE}s`}
      repeatCount="indefinite"
      values="0;0;1;1;0"
      keyTimes={`0;${f(from)};${f(from + 0.03)};0.94;1`}
    />
  );
}

/** The page being built, drawn in `box` (inside a window node's body). Stage `i` appears with step `i`. */
function PageBuild({ box, live }: { box: Box; live: boolean }) {
  const { x, y, w, h } = box;
  const px = (n: number) => x + n * w;
  const py = (n: number) => y + n * h;
  const stage = (i: number) => (live ? { opacity: 0, children: <Appear from={at(i).arrive - 0.01} /> } : null);
  const line = { fill: "var(--uipack-muted)", opacity: 0.45 };
  const ink = { fill: "var(--uipack-fg)" };
  const accent = { fill: "var(--uipack-accent)" };
  const dash = { fill: "none", stroke: "var(--uipack-muted)", strokeDasharray: "3 3", strokeWidth: 1 };
  const comp = { fill: "none", stroke: "var(--uipack-token-request)", strokeWidth: 1 };
  const s1 = stage(0);
  const s2 = stage(1);
  const s3 = stage(2);
  const s4 = stage(3);
  return (
    <g aria-hidden="true">
      {/* 1 · The skill: the order of work, as empty section outlines. */}
      <g opacity={s1?.opacity}>
        {s1?.children}
        <rect x={px(0)} y={py(0)} width={w} height={h * 0.07} {...dash} />
        <rect x={px(0)} y={py(0.11)} width={w} height={h * 0.36} {...dash} />
        <rect x={px(0)} y={py(0.51)} width={w} height={h * 0.49} {...dash} />
      </g>
      {/* 2 · The spec: the site's look, on the header. */}
      <g opacity={s2?.opacity}>
        {s2?.children}
        <rect x={px(0)} y={py(0)} width={w} height={h * 0.07} {...ink} />
        <rect x={px(0.03)} y={py(0.02)} width={h * 0.03} height={h * 0.03} {...accent} />
        <rect x={px(0.68)} y={py(0.025)} width={w * 0.1} height={h * 0.02} fill="var(--uipack-bg)" opacity={0.75} />
        <rect x={px(0.82)} y={py(0.025)} width={w * 0.1} height={h * 0.02} fill="var(--uipack-bg)" opacity={0.75} />
      </g>
      {/* 3 · The core rules: the layout floors and the words: a headline, a lead, one action. */}
      <g opacity={s3?.opacity}>
        {s3?.children}
        <rect x={px(0.05)} y={py(0.15)} width={w * 0.66} height={h * 0.035} {...ink} />
        <rect x={px(0.05)} y={py(0.2)} width={w * 0.47} height={h * 0.035} {...ink} />
        <rect x={px(0.05)} y={py(0.255)} width={w * 0.15} height={h * 0.008} {...accent} />
        <rect x={px(0.05)} y={py(0.29)} width={w * 0.84} height={h * 0.014} {...line} />
        <rect x={px(0.05)} y={py(0.32)} width={w * 0.77} height={h * 0.014} {...line} />
        <rect x={px(0.05)} y={py(0.35)} width={w * 0.54} height={h * 0.014} {...line} />
        <rect x={px(0.05)} y={py(0.39)} width={w * 0.25} height={h * 0.04} {...accent} />
      </g>
      {/* 4 · The component docs: the parts, a figure and a row of cards. */}
      <g opacity={s4?.opacity}>
        {s4?.children}
        <rect x={px(0.05)} y={py(0.54)} width={w * 0.9} height={h * 0.22} {...comp} />
        <Token kind="request" cx={px(0.18)} cy={py(0.65)} r={Math.max(3, w * 0.025)} />
        <Token kind="response" cx={px(0.5)} cy={py(0.65)} r={Math.max(3, w * 0.025)} />
        <Token kind="change" cx={px(0.82)} cy={py(0.65)} r={Math.max(3, w * 0.025)} />
        <path
          d={`M${px(0.23)} ${py(0.65)}H${px(0.44)}M${px(0.56)} ${py(0.65)}H${px(0.76)}`}
          stroke="var(--uipack-muted)"
          strokeWidth={1}
        />
        {[0, 1, 2].map((c) => (
          <g key={c}>
            <rect x={px(0.05 + c * 0.31)} y={py(0.8)} width={w * 0.28} height={h * 0.17} {...comp} />
            <rect x={px(0.09 + c * 0.31)} y={py(0.9)} width={w * 0.18} height={h * 0.012} {...line} />
          </g>
        ))}
      </g>
    </g>
  );
}

/** A source's highlight: an accent outline that lights during its step. */
function Lit({ box, i }: { box: Box; i: number }) {
  const t = at(i);
  return (
    <rect
      x={box.x}
      y={box.y}
      width={box.w}
      height={box.h}
      rx={6}
      fill="none"
      stroke="var(--uipack-accent)"
      strokeWidth={2}
      opacity={0}
      aria-hidden="true"
    >
      <animate
        attributeName="opacity"
        dur={`${CYCLE}s`}
        repeatCount="indefinite"
        values="0;0;1;1;0;0"
        keyTimes={`0;${f(t.on - 0.005)};${f(t.on)};${f(t.off - 0.02)};${f(t.off)};1`}
      />
    </rect>
  );
}

/** A request token riding from a source to the page during its step (the read order's arrow). */
function Ride({ points, i }: { points: Point[]; i: number }) {
  const t = at(i);
  const d = `M${points.map((p) => p.join(" ")).join("L")}`;
  return (
    <g opacity={0} aria-hidden="true">
      <Token kind="request" r={4} />
      <animateMotion
        dur={`${CYCLE}s`}
        repeatCount="indefinite"
        path={d}
        keyPoints="0;0;1;1"
        keyTimes={`0;${f(t.ride)};${f(t.arrive)};1`}
        calcMode="linear"
      />
      <animate
        attributeName="opacity"
        dur={`${CYCLE}s`}
        repeatCount="indefinite"
        values="0;0;1;1;0;0"
        keyTimes={`0;${f(t.ride - 0.005)};${f(t.ride)};${f(t.arrive - 0.01)};${f(t.arrive)};1`}
      />
    </g>
  );
}

interface Layout {
  id: string;
  sources: Box[];
  bus: number;
  page: Box;
  label: Point;
  into: number;
  badge: number;
}

function Drawing({ id, sources, bus, page, label, into, badge }: Layout) {
  const { reduced } = useFigureMotion();
  // Motion starts after the first paint, as a Packet's does: the finished page shows until then.
  const live = useHydrated() && !reduced;
  const edge = sources[0].x + sources[0].w;
  const body: Box = { x: page.x + 12, y: page.y + 16 + 12, w: page.w - 24, h: page.h - 16 - 24 };
  return (
    <>
      <Defs id={id} />
      <Label x={label[0]} y={label[1]} text="Your page" />
      <Node {...page} label="" strip="window" inlay={<PageBuild box={body} live={live} />} />
      <Bus
        at={bus}
        from={cy(sources[0])}
        to={cy(sources[sources.length - 1])}
        stubs={sources.map((s) => ({ at: cy(s), to: edge }))}
      />
      <Connector
        points={[
          [bus, into],
          [page.x, into],
        ]}
        defs={id}
        kind="request"
      />
      {READ_ORDER.map((step, i) => (
        <g key={step.title}>
          <Node {...sources[i]} label={step.title} sub={step.path} icon={step.icon} size={14} />
          <Badge cx={sources[i].x} cy={sources[i].y} text={String(i + 1)} accent r={badge} />
          {live && <Lit box={sources[i]} i={i} />}
          {live && (
            <Ride
              i={i}
              points={[
                [edge + 4, cy(sources[i])],
                [bus, cy(sources[i])],
                [bus, into],
                [page.x - 10, into],
              ]}
            />
          )}
        </g>
      ))}
    </>
  );
}

const sourceBoxes = (x: number, y0: number, w: number, h: number, gap: number): Box[] =>
  READ_ORDER.map((_, i) => ({ x, y: y0 + i * (h + gap), w, h }));

const WIDE: Layout = {
  id: "landing-read",
  sources: sourceBoxes(20, 40, 196, 56, 24),
  bus: 248,
  page: { x: 292, y: 40, w: 212, h: 296 },
  label: [292, 28],
  into: 188,
  badge: 10,
};

const NARROW: Layout = {
  id: "landing-read-n",
  sources: sourceBoxes(14, 32, 206, 50, 14),
  bus: 236,
  page: { x: 254, y: 32, w: 96, h: 242 },
  label: [254, 20],
  into: 153,
  badge: 11,
};

export default function HeroFigure() {
  return (
    <Figure
      className="landing-hero__figure"
      viewBox="0 0 520 360"
      narrow={<Drawing {...NARROW} />}
      narrowViewBox="0 0 360 290"
      expandable={false}
      caption="The read order an agent follows, and what each step adds to the page."
      alt={`Four sources in reading order feed one page: ${READ_ORDER.map((s, i) => `${i + 1}, ${s.title} (${s.path})`).join("; ")}. The page gains its section outline, then its look, then its layout and words, then its parts.`}
    >
      <Drawing {...WIDE} />
    </Figure>
  );
}
