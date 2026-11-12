import "../src/web/fonts.css";
import "../src/theme.css";
import "../src/canvas.css";
import "./diagram-themes-demo.css";
import {
  Action,
  Activation,
  Actor,
  Connector,
  Decision,
  Defs,
  DiagramThemeScope,
  Figure,
  Label,
  LaneRule,
  Lifeline,
  Lost,
  Message,
  Node,
  Note,
  Outcome,
  Packet,
  Screen,
  SelfLoop,
  type DiagramMode,
  type DiagramTheme,
} from "../src";
import { siteBlueprint, terracotta, warmPaper } from "./diagramThemes";

/*
 * Diagram theme demos (docs/components/diagrams.md): one figure in three themes and both modes,
 * and the user-flow and sequence parts once each. They show; the Markdown explains.
 */

// Blueprint is shown as this site draws it: on the site's charcoal in dark (diagramThemes.ts).
const THEMES: DiagramTheme[] = [siteBlueprint, warmPaper, terracotta];
const MODES: DiagramMode[] = ["light", "dark"];

/** The same drawing every theme paints: an app, a worker, a store, one accent path, an outcome. */
function Sample({ id }: { id: string }) {
  const ask: [number, number][] = [
    [144, 92],
    [192, 92],
  ];
  const answer: [number, number][] = [
    [320, 92],
    [368, 92],
  ];
  return (
    <>
      <Defs id={id} />
      <Node x={16} y={64} w={128} h={56} label="Web app" sub="page" strip="window" flow="ask" />
      <Connector points={ask} defs={id} kind="request" flow="ask" />
      <Packet points={ask} kind="request" dur={1.6} r={4} flow="ask" />
      <Node x={192} y={64} w={128} h={56} label="Worker" sub="job" strip="terminal" accent flow="ask" />
      <Connector points={answer} defs={id} kind="accent" flow="ask" />
      <Packet points={answer} kind="accent" dur={1.6} delay={-0.8} r={4} flow="ask" />
      <Outcome x={368} y={68} w={136} h={48} label="Answered" sub="cited" flow="ask" />
      <Node x={192} y={160} w={128} h={48} label="Store" strip="store" />
      <Connector
        points={[
          [256, 120],
          [256, 160],
        ]}
        defs={id}
        kind="change"
        dashed
      />
      <Label x={264} y={144} text="async" />
      <Connector
        points={[
          [80, 120],
          [80, 184],
          [192, 184],
        ]}
        defs={id}
        kind="response"
      />
    </>
  );
}

/** One figure, every theme, light and dark: only colours, faces and the canvas ground change. */
export function DiagramThemes() {
  return (
    <div className="diagram-themes-demo" data-demo="diagram-themes">
      {THEMES.map((theme) =>
        MODES.map((mode) => (
          <DiagramThemeScope key={`${theme.name}-${mode}`} theme={theme} mode={mode}>
            <Figure
              eyebrow={`${theme.name} · ${mode}`}
              title="The same figure"
              viewBox="0 0 520 224"
              alt={`A small figure in the ${theme.name} theme, ${mode}: a web app asks a worker, the worker answers along the one accent path and writes to a store.`}
              expandable={false}
              controls={false}
              static
            >
              <Sample id={`dt-${theme.name}-${mode}`} />
            </Figure>
          </DiagramThemeScope>
        )),
      )}
    </div>
  );
}

/** The user-flow and sequence parts, once each, in the page's theme. */
export function FlowParts() {
  const id = "flow-parts";
  return (
    <Figure
      eyebrow="User-flow and sequence parts"
      title="Who acts, what they see, and the messages between them"
      viewBox="0 0 1120 432"
      alt="Left: a user flow from an Actor through an Action, a Screen and a Decision to an Outcome, with a LaneRule under it. Right: a sequence with three lifelines, numbered messages, an activation, a self-loop, a lost message and a note."
      legend={[
        { label: "Request", kind: "request" },
        { label: "Response", kind: "response" },
        { label: "Change", kind: "change" },
      ]}
    >
      <Defs id={id} />
      {/* user flow */}
      <Actor cx={48} cy={96} role="User" sub="staff" flow="uf" />
      <Connector
        points={[
          [76, 96],
          [112, 96],
        ]}
        defs={id}
        flow="uf"
      />
      <Action x={112} y={74} w={120} label="Sign in" sub="SSO" flow="uf" />
      <Connector
        points={[
          [232, 96],
          [256, 96],
        ]}
        defs={id}
        flow="uf"
      />
      <Screen x={256} y={32} w={144} title="Dashboard" lines={["three tiles", "one alert"]} flow="uf" />
      <Connector
        points={[
          [400, 96],
          [424, 96],
        ]}
        defs={id}
        flow="uf"
      />
      <Decision cx={464} cy={96} label="Alert?" flow="uf" />
      <Label x={464} y={168} text="yes" anchor="middle" />
      <Connector
        points={[
          [464, 136],
          [464, 192],
        ]}
        defs={id}
        flow="uf"
      />
      <Outcome x={392} y={192} w={144} h={48} label="Resolved" sub="logged" flow="uf" />
      <LaneRule x1={16} x2={544} y={272} />
      <Label x={16} y={312} text="Actor · Action · Screen · Decision · Outcome · LaneRule" font="sans" size={12} />

      {/* sequence */}
      <Node x={600} y={24} w={128} h={40} label="Client" align="center" />
      <Node x={792} y={24} w={128} h={40} label="API" align="center" />
      <Node x={984} y={24} w={128} h={40} label="Worker" align="center" />
      <Lifeline x={664} y1={64} y2={400} />
      <Lifeline x={856} y1={64} y2={400} />
      <Lifeline x={1048} y1={64} y2={400} />
      <Activation x={856} y1={96} y2={176} />
      <Message id={id} from={664} to={856} y={112} n={1} label="submit" kind="request" packet />
      <Message id={id} from={856} to={1048} y={160} n={2} label="enqueue" kind="change" packet={{ delay: -0.6 }} />
      <SelfLoop id={id} x={1048} y={200} h={40} n={3} kind="change" />
      <Lost id={id} from={1048} to={664} y={280} n={4} label="progress" labelX={952} />
      <Message id={id} from={856} to={664} y={336} n={5} label="result" kind="response" dashed />
      <Note x={880} y={312} w={216} h={64} title="Budget" lines={["30 s per job", "then retried"]} />
    </Figure>
  );
}
