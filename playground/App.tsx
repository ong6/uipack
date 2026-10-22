import { ShowcaseShell, useShowcaseTheme } from "./ShowcaseShell";
import { HabitatFigure } from "../examples/Habitat";
import { Badge, Bus, Chip, Connector, Defs, Figure, Group, Label, Lane, Node, Packet, icons, marks, route, type IconName, type MarkName } from "../src";
import { PRESETS, type PresetName } from "../src/presets";
import { AssetBrowser } from "../src/browser";
import manifest from "../assets/manifest.json";
import "../src/browser/browser.css";
import { useEffect, useRef } from "react";
import { LayerStack, SpanChart, enhanceLayerStack, enhanceSpanChart } from "../src/charts";
import { aiStack, aiStackDiagram } from "../examples/aiStack";
import { chartEntries } from "./catalog";
import "../src/charts/charts.css";

declare const __UIPACK_ROOT__: string;

const iconNames = Object.keys(icons) as IconName[];
const markNames = Object.keys(marks) as MarkName[];

// Every part once, on the 8px grid. The ids feed the browser tests.
function Parts() {
  const a = route([288, 64], [560, 144], "h");
  const b = route([288, 144], [560, 64], 424, "h");
  const c: [number, number][] = [
    [288, 224],
    [560, 224],
  ];
  return (
    <Figure
      number="Figure 02"
      eyebrow="Every part"
      title="Nodes, groups, chips, connectors, packets"
      caption="One of each. Connectors carry one arrowhead, in the request direction; the response is the same points ridden backwards. Hover a node or a legend item."
      legend={[
        { label: "Request", kind: "request" },
        { label: "Response", kind: "response" },
        { label: "Change", kind: "change" },
        { label: "Neutral", kind: "neutral" },
      ]}
      viewBox="0 0 1120 400"
      alt="A sampler of every uipack component.">
      <Defs id="parts" />
      <Lane x={16} w={240} y={24} title="Nodes" />
      <Node x={16} y={40} w={240} h={40} label="Plain" flow="alpha" id="e2e-node-alpha" hint="Hover: highlights flow alpha" />
      <Node x={16} y={96} w={240} h={56} label="With sub" sub="mono second line" align="left" icon="service" flow="beta" id="e2e-node-beta" />
      <Node x={16} y={168} w={240} h={40} label="Accent" accent flow="alpha" />
      <Node x={16} y={224} w={240} h={40} label="Link" dashed href="#link" hint="A node with href is a link" />
      <Badge cx={256} cy={40} text="1" />
      <Badge cx={256} cy={168} text="A" accent />

      <Lane x={288} w={272} y={24} title="Connectors + packets" />
      <Connector points={a} defs="parts" kind="request" id="e2e-conn" flow="alpha" />
      <Packet points={a} kind="request" dur={2} id="e2e-packet" flow="alpha" />
      <Packet points={a} kind="response" dur={2} delay={-1} reverse flow="alpha" />
      <Connector points={b} defs="parts" kind="response" dashed flow="beta" />
      <Packet points={b} kind="response" dur={2.5} delay={-1} flow="beta" />
      <Connector points={c} defs="parts" kind="change" id="e2e-conn-change" flow="beta" />
      <Packet points={c} kind="change" dur={2} flow="beta" id="e2e-packet-change" />
      <Connector points={[[288, 288], [560, 288]]} defs="parts" />
      <Packet points={[[288, 288], [560, 288]]} kind="neutral" dur={3} />
      <Label x={424} y={280} text="plain connector" anchor="middle" />
      <Label x={424} y={324} text="Label with underlay, sans" anchor="middle" font="sans" size={12} />

      <Lane x={592} w={512} y={24} title="Groups, chips, bus" />
      <Group x={592} y={40} w={512} h={104} title="Solid group">
        <Chip x={608} y={80} w={72} label="A1" />
        <Chip x={688} y={80} w={72} label="B2" kind="request" />
        <Chip x={768} y={80} w={72} label="busy" kind="accent" />
        <Chip x={848} y={80} w={72} dashed />
        <Chip x={928} y={80} w={160} h={24} label="overloaded" kind="change" size={9} />
      </Group>
      <Group x={592} y={168} w={240} h={96} title="Dashed boundary" variant="dashed" accent flow="alpha">
        <Node x={608} y={208} w={96} h={40} label="In" icon="agent" size={12} flow="alpha" />
        <Node x={720} y={208} w={96} h={40} label="Tenant" icon="db" size={12} flow="alpha" />
      </Group>
      <Node x={864} y={168} w={96} h={32} label="a" size={12} flow="beta" />
      <Node x={864} y={216} w={96} h={32} label="b" size={12} flow="beta" />
      <Node x={1008} y={192} w={96} h={32} label="svc" size={12} flow="beta" id="e2e-node-svc" />
      <Bus axis="v" at={984} from={184} to={232} stubs={[{ at: 184, to: 960, flow: "beta" }, { at: 232, to: 960, flow: "beta" }, { at: 208, to: 1008, arrow: true, flow: "beta" }]} defs="parts" flow="beta" />
      <Packet points={[[984, 208], [1008, 208]]} kind="request" dur={1.2} r={4} flow="beta" />

      <Lane x={16} w={240} y={344} title="Icons" />
      {iconNames.map((n, i) => (
        <g key={n} transform={`translate(${16 + (i % 25) * 28}, 360)`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <title>{n}</title>
          {icons[n]}
        </g>
      ))}
      <Lane x={760} w={344} y={344} title="Marks" />
      {markNames.map((n, i) => (
        <g key={n} transform={`translate(${760 + i * 40}, 356)`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <title>{n}</title>
          <g transform="scale(0.75)">{marks[n]}</g>
        </g>
      ))}
    </Figure>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPreset(name: PresetName, number: string) {
  const { render, spec } = PRESETS[name] as { render: (s: any) => JSX.Element; spec: { figure: object } };
  return render({ ...spec, figure: { ...spec.figure, number, headingLevel: 4 } });
}

function Presets() {
  return (
    <>
      {(Object.keys(PRESETS) as PresetName[]).map((name, i) => (
        <div key={name} data-preset={name}>
          <h3 className="showcase-subhead">{PRESETS[name].name}</h3>
          {renderPreset(name, `Figure ${String(i + 3).padStart(2, "0")}`)}
        </div>
      ))}
    </>
  );
}

// Client-rendered here; the same markup works as static HTML. The playground
// opts into the optional enhancement (repeat activation and Escape clear).
function SpanChartDemo() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current?.querySelector<HTMLElement>(".uipack-span");
    return root ? enhanceSpanChart(root) : undefined;
  }, []);
  return (
    <div ref={ref}>
      <SpanChart {...aiStack} />
    </div>
  );
}

// The stack's optional enhancement: band and rail links scroll smoothly.
function LayerStackDemo() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current?.querySelector<HTMLElement>(".uipack-stack");
    return root ? enhanceLayerStack(root) : undefined;
  }, []);
  return (
    <div ref={ref}>
      <LayerStack {...aiStackDiagram} />
    </div>
  );
}

const entry = (id: string) => chartEntries.find((e) => e.id === id)!;

/* The charts are previewed in a frame at a host's real figure width (the notes
   site's slot is 56rem, 896px), so a layout that only works at 1280px cannot
   hide here. ?frame=896|720|390|320|full picks the width. */
const FRAMES = ["896", "720", "390", "320", "full"] as const;
function useFrame() {
  const value = new URLSearchParams(location.search).get("frame");
  return (FRAMES as readonly string[]).includes(value ?? "") ? (value as (typeof FRAMES)[number]) : "896";
}
function ChartFrame({ children }: { children: React.ReactNode }) {
  const frame = useFrame();
  const pick = (next: string) => {
    const url = new URL(location.href);
    url.searchParams.set("frame", next);
    location.assign(url);
  };
  return (
    <>
      <p className="chart-frame__bar">
        Host width
        {FRAMES.map((f) => (
          <button type="button" key={f} aria-pressed={f === frame} onClick={() => pick(f)}>
            {f === "full" ? "full" : `${f}px`}
          </button>
        ))}
      </p>
      <div className="chart-frame" data-frame={frame} style={{ maxWidth: frame === "full" ? undefined : `${frame}px` }}>
        {children}
      </div>
    </>
  );
}

function Assets() {
  return (
    <section data-route="assets">
      <h2>Browse and copy</h2>
      <p className="showcase-section-intro">
        Filter by category, search by name or tag, then copy the import line or the SVG.
        Diagrams are coded figures, so they live on the Architecture diagrams page instead.
      </p>
      <AssetBrowser manifest={manifest as never} base={`/@fs${__UIPACK_ROOT__}/`} />
    </section>
  );
}

function Charts() {
  return (
    <>
      <section data-catalog-entry="layer-stack" id="layer-stack">
        <h2>{entry("layer-stack").title}</h2>
        <p className="showcase-section-intro">
          A stack of layers that opens band by band, for explaining how a system is built up.
        </p>
        <ChartFrame>
          <LayerStackDemo />
        </ChartFrame>
      </section>
      <section data-catalog-entry="span-chart" id="span-chart">
        <h2>{entry("span-chart").title}</h2>
        <p className="showcase-section-intro">
          A comparison across the same layers, with filters that keep one selection at a time.
        </p>
        <ChartFrame>
          <SpanChartDemo />
        </ChartFrame>
      </section>
    </>
  );
}

function Diagrams() {
  return (
    <>
      <section id="presets" data-section="presets">
        <h2>Presets</h2>
        <p className="showcase-section-intro">
          Seven figures drawn from a small typed spec, each with a wide and a narrow drawing.
        </p>
        <Presets />
      </section>
      <section id="reference-figure" data-section="reference-figure">
        <h2>Reference figure</h2>
        <p className="showcase-section-intro">
          The Habitat drawing, built from the parts by hand. It is the look the rest follows.
        </p>
        <HabitatFigure />
      </section>
      <section id="parts" data-section="parts">
        <h2>Parts</h2>
        <p className="showcase-section-intro">
          Every part once, on the 8px grid: nodes, groups, chips, connectors, packets, icons and marks.
        </p>
        <Parts />
      </section>
      <section id="bare-figure" data-section="bare-figure">
        <h2>Bare figure</h2>
        <p className="showcase-section-intro">
          A figure with no header, controls or caption, on a ruled background.
        </p>
        <Figure viewBox="0 0 400 80" alt="A single node." controls={false} background="ruled">
          <Node x={100} y={20} w={200} h={40} label="Just a canvas" />
        </Figure>
      </section>
    </>
  );
}

export function App() {
  const { theme, flip } = useShowcaseTheme();
  const path = location.pathname.replace(/\/$/, "");
  const active = path === "/assets" ? "assets" : path === "/charts" ? "charts" : "figures";
  return (
    <ShowcaseShell active={active} theme={theme} flip={flip}>
      {active === "assets" ? <Assets /> : active === "charts" ? <Charts /> : <Diagrams />}
    </ShowcaseShell>
  );
}
