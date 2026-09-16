import { useState } from "react";
import { HabitatFigure } from "../examples/Habitat";
import { Badge, Bus, Chip, Connector, Defs, Figure, Group, Label, Lane, Node, Packet, Wordmark, icons, marks, route, type IconName, type MarkName } from "../src";
import { PRESETS, type PresetName } from "../src/presets";
import { AssetBrowser } from "../src/browser";
import manifest from "../assets/manifest.json";
import "../src/browser/browser.css";

declare const __UIPACK_ROOT__: string;

function useTheme() {
  const [theme, setTheme] = useState<string>(document.documentElement.dataset.theme ?? "light");
  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };
  return { theme, flip };
}

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
  return render({ ...spec, figure: { ...spec.figure, number } });
}

function Presets() {
  return (
    <>
      {(Object.keys(PRESETS) as PresetName[]).map((name, i) => (
        <section key={name} data-preset={name}>
          <h2>presets.{name}</h2>
          {renderPreset(name, `Figure ${String(i + 3).padStart(2, "0")}`)}
        </section>
      ))}
    </>
  );
}

function Assets() {
  return (
    <section data-route="assets">
      <h2>assets · {manifest.assets.length}</h2>
      <AssetBrowser manifest={manifest as never} base={`/@fs${__UIPACK_ROOT__}/`} />
    </section>
  );
}

export function App() {
  const { theme, flip } = useTheme();
  const route_ = location.pathname.replace(/\/$/, "");
  return (
    <main>
      <h1>
        <Wordmark size={22} />
        <span>
          <a href="/">figures</a> · <a href="/assets">assets</a>
        </span>
        <button className="theme" type="button" onClick={flip}>
          {theme === "dark" ? "light" : "dark"} mode
        </button>
      </h1>
      {route_ === "/assets" ? (
        <Assets />
      ) : (
        <>
          <section>
            <h2>examples/Habitat.tsx</h2>
            <HabitatFigure />
          </section>
          <section>
            <h2>every part</h2>
            <Parts />
          </section>
          <Presets />
          <section>
            <h2>bare figure, no header, ruled background</h2>
            <Figure viewBox="0 0 400 80" alt="A single node." controls={false} background="ruled">
              <Node x={100} y={20} w={200} h={40} label="Just a canvas" />
            </Figure>
          </section>
        </>
      )}
    </main>
  );
}
