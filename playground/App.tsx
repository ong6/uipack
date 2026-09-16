import { useState } from "react";
import { HabitatFigure } from "../examples/Habitat";
import { Badge, Chip, Connector, Defs, Figure, Group, Label, Lane, Node, Packet, icons, route, type IconName } from "../src";

function useTheme() {
  const [theme, setTheme] = useState<string>(document.documentElement.dataset.theme ?? "light");
  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };
  return { theme, flip };
}

const names = Object.keys(icons) as IconName[];

function Parts() {
  const a = route([120, 60], [360, 140], "h");
  const b = route([120, 140], [360, 60], 240, "h");
  const c = route([440, 40], [600, 160], "v");
  return (
    <Figure
      number="Figure 02"
      eyebrow="Every part"
      title="Nodes, groups, chips, connectors, packets"
      caption="One of each, drawn on the 8px grid. Connectors are orthogonal by default and take a token kind for colour; packets ride the same points."
      legend={[
        { label: "Request", kind: "request" },
        { label: "Response", kind: "response" },
        { label: "Change", kind: "change" },
        { label: "Neutral", kind: "neutral" },
      ]}
      viewBox="0 0 1120 360"
      alt="A sampler of every uipack component.">
      <Defs id="parts" />
      <Lane x={0} w={260} y={20} title="Nodes" />
      <Node x={16} y={40} w={200} h={40} label="Plain" />
      <Node x={16} y={96} w={200} h={56} label="With sub" sub="mono second line" align="left" icon="service" />
      <Node x={16} y={168} w={200} h={40} label="Accent" accent />
      <Node x={16} y={224} w={200} h={40} label="Dashed" dashed />
      <Badge cx={216} cy={40} text="1" />
      <Badge cx={216} cy={168} text="A" accent />

      <Lane x={280} w={380} y={20} title="Connectors + packets" />
      <Connector points={a} defs="parts" kind="request" id="e2e-conn" />
      <Packet points={a} kind="request" dur={2} id="e2e-packet" />
      <Connector points={b} defs="parts" kind="response" dashed />
      <Packet points={b} kind="response" dur={2.5} delay={-1} />
      <Connector points={c} defs="parts" kind="change" arrow="both" />
      <Packet points={c} kind="change" dur={2} />
      <Packet points={c} kind="change" dur={2} delay={-1} reverse />
      <Connector points={[[280, 220], [640, 220]]} defs="parts" />
      <Packet points={[[280, 220], [640, 220]]} kind="neutral" dur={3} />
      <Label x={460} y={212} text="plain connector" anchor="middle" />
      <Label x={460} y={250} text="Label with underlay, sans" anchor="middle" font="sans" size={12} />

      <Lane x={700} w={400} y={20} title="Groups + chips" />
      <Group x={700} y={40} w={400} h={120} title="Solid group">
        <Chip x={716} y={80} w={72} label="A1" />
        <Chip x={796} y={80} w={72} label="B2" kind="request" />
        <Chip x={876} y={80} w={72} label="busy" kind="accent" />
        <Chip x={956} y={80} w={72} dashed />
        <Chip x={716} y={116} w={312} h={20} label="overloaded" kind="change" size={9} />
      </Group>
      <Group x={700} y={184} w={400} h={96} title="Dashed boundary" variant="dashed" accent>
        <Node x={716} y={220} w={176} h={40} label="Inside" icon="agent" />
        <Node x={908} y={220} w={176} h={40} label="Tenant" icon="db" />
      </Group>

      <Lane x={0} w={260} y={300} title="Icons" />
      {names.map((n, i) => (
        <g key={n} transform={`translate(${16 + i * 36}, 316)`} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          {icons[n]}
        </g>
      ))}
    </Figure>
  );
}

export function App() {
  const { theme, flip } = useTheme();
  return (
    <main>
      <h1>
        <span>uipack playground</span>
        <button className="theme" type="button" onClick={flip}>
          {theme === "dark" ? "light" : "dark"} mode
        </button>
      </h1>
      <section>
        <h2>examples/Habitat.tsx</h2>
        <HabitatFigure />
      </section>
      <section>
        <h2>every component</h2>
        <Parts />
      </section>
      <section>
        <h2>bare figure, no header</h2>
        <Figure viewBox="0 0 400 80" alt="A single node." controls={false}>
          <Node x={100} y={20} w={200} h={40} label="Just a canvas" />
        </Figure>
      </section>
    </main>
  );
}
