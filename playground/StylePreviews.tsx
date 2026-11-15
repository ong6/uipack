import { Connector, Defs, Figure, Label, Node } from "../src";
import { GateMachine } from "../src/mechanism";
import "../src/mechanism/mechanism.css";

type Theme = "light" | "dark";

// One preview per style card on /styles, drawn by the style itself where that is cheap (SVG and
// CSS) and a still where it is not (the 3D ink line art is live WebGL; its stills are regenerated
// by scripts/style-stills.mjs). Every preview is decorative: the card's heading and
// description carry the meaning, so the wrapper is aria-hidden and nothing inside takes focus.

function TechnicalPreview({ theme }: { theme: Theme }) {
  return (
    <Figure viewBox="0 0 360 180" theme={theme} controls={false} expandable={false} alt="" background="dots">
      <Defs id="style-technical" />
      <Label x={20} y={48} text="Request · response" />
      <Node x={20} y={64} w={88} h={52} label="Client" />
      <Node x={136} y={64} w={88} h={52} label="Gateway" accent />
      <Node x={252} y={64} w={88} h={52} label="Store" />
      <Connector
        points={[
          [108, 82],
          [136, 82],
        ]}
        defs="style-technical"
        kind="request"
      />
      <Connector
        points={[
          [224, 82],
          [252, 82],
        ]}
        defs="style-technical"
        kind="request"
      />
      <Connector
        points={[
          [252, 100],
          [224, 100],
        ]}
        defs="style-technical"
        kind="response"
      />
      <Connector
        points={[
          [136, 100],
          [108, 100],
        ]}
        defs="style-technical"
        kind="response"
      />
      <Label x={20} y={148} text="Shape and colour name each flow" />
    </Figure>
  );
}

function MechanismPreview({ theme }: { theme: Theme }) {
  return <GateMachine pose="pass" theme={theme} interactive={false} alt="" className="style-preview__machine" />;
}

export function StylePreview({ id, theme }: { id: string; theme: Theme }) {
  // Vite resolves this template to the hashed asset URLs at build time.
  const still = id === "ink" ? new URL(`./assets/styles/ink-${theme}.jpg`, import.meta.url).href : undefined;
  return (
    <div className="style-preview" data-style={id} aria-hidden="true">
      {id === "technical" ? (
        <TechnicalPreview theme={theme} />
      ) : id === "mechanism" ? (
        <MechanismPreview theme={theme} />
      ) : still ? (
        <img src={still} alt="" width={720} height={360} loading="lazy" decoding="async" />
      ) : null}
    </div>
  );
}
