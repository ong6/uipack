import type { ReactNode } from "react";
import { Figure, Node } from "../../src";
import { PRESETS } from "../../src/presets";
import { HabitatFigure } from "../../examples/Habitat";
import { DrillExample } from "../DrillSection";
import { PartsFigure } from "./parts";
import { LoopsFigure } from "./loops";
import { DecisionTreeFigure } from "./decisionTree";
import { FanOutFanInFigure } from "./fanOutFanIn";
import { FailureRailFigure } from "./failureRail";
import { QueueCalloutsFigure } from "./queueCallouts";
import { SequenceFigure } from "./sequence";
import { NestedGroupsFigure } from "./nestedGroups";
import { NumberedStepsFigure } from "./numberedSteps";
import { LayeredChecksFigure } from "./layeredChecks";
import { FlowVolumesFigure } from "./flowVolumes";

/** One section of the diagrams page. Its h2 is the catalog title of the same id (`figureEntries`). */
export interface FigureSection {
  id: string;
  /** "Use when…", then the parts it is built from. */
  intro: string;
  /** Set when the figure is a preset, so tests and screenshots can find it. */
  preset?: keyof typeof PRESETS;
  render: (number: string) => ReactNode;
}

// The presets render from their default spec; `figure` overrides only the header,
// and `spec` replaces content that names a real system with neutral content.
function preset(name: keyof typeof PRESETS, number: string, figure: object, spec: object = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { render, spec: base } = PRESETS[name] as { render: (s: any) => ReactNode; spec: { figure: object } };
  return render({ ...base, ...spec, figure: { ...base.figure, ...figure, number } });
}

export const figureSections: FigureSection[] = [
  {
    id: "bare-figure",
    intro: "Use when the host page frames the drawing itself and needs only the canvas. Built from Figure with controls={false}, expandable={false} and no header, legend or caption, here on a ruled background.",
    render: () => (
      <Figure
        viewBox="0 0 1120 120"
        narrow={<Node x={60} y={20} w={240} h={40} label="Just a canvas" />}
        narrowViewBox="0 0 360 80"
        alt="A single node on a ruled canvas."
        controls={false}
        expandable={false}
        background="ruled">
        <Node x={440} y={40} w={240} h={40} label="Just a canvas" />
      </Figure>
    ),
  },
  {
    id: "parts",
    intro: "The vocabulary every pattern below is built from, one of each on the 8px grid: Node, Badge, Lane, Connector, Packet, Label, Group, Chip, Bus, icons and marks.",
    render: (n) => <PartsFigure number={n} />,
  },
  {
    id: "pipeline",
    preset: "pipeline",
    intro: "Use when work moves through stages in one direction. Built from the pipeline preset: a Lane, a row of Nodes with a Connector and Packet per hop, and a queue drawn as a Group of Chips between two stages.",
    render: (n) =>
      preset("pipeline", n, {
        caption: "Notice the queue: the stages before it run inline, the ones after it drain at their own pace, and the packet colour changes where the work is handed off.",
      }),
  },
  {
    id: "loops",
    intro: "Use when a step repeats, or the end of a flow feeds back to its start. Built from Node, Connector and Packet: a self-loop is a four-point Connector over its node, a return path a Connector under the row (dashed for the slow one).",
    render: (n) => <LoopsFigure number={n} />,
  },
  {
    id: "decision-tree",
    intro: "Use when the answer depends on a few questions asked in order. Built from Nodes joined by elbow Connectors, a Label on every branch and accent leaves for the outcomes; the narrow drawing turns the tree into an indented outline on two Buses.",
    render: (n) => <DecisionTreeFigure number={n} />,
  },
  {
    id: "before-after",
    preset: "beforeAfter",
    intro: "Use when one change to a flow is the whole point. Built from the beforeAfter preset: two dashed Groups holding the same stages, with the changed stage and its inbound edge in accent.",
    render: (n) =>
      preset(
        "beforeAfter",
        n,
        { caption: "Notice that only one stage differs between the panels. It and the edge into it are the accent; everything else is drawn the same so the eye goes to the change." },
        {
          after: {
            ...PRESETS.beforeAfter.spec.after,
            stages: PRESETS.beforeAfter.spec.after.stages.map((s) => (s.label === "Customer" ? { ...s, sub: "reads it" } : s)),
          },
        },
      ),
  },
  {
    id: "fan-out-fan-in",
    intro: "Use when one request is split across parallel workers and the results are merged. Built from a Bus out and a Bus in (junction dots on the 8px grid), Packets with staggered delays, and a Group around the parallel part.",
    render: (n) => <FanOutFanInFigure number={n} />,
  },
  {
    id: "two-way-sync",
    preset: "syncLoop",
    intro: "Use when copies stay in step with one source in both directions. Built from the syncLoop preset: a pair of opposite, labelled Connectors per copy and a dashed one-way read for a consumer that only pulls.",
    render: (n) =>
      preset(
        "syncLoop",
        n,
        {
          title: "Edit where you use it, it flows back",
          caption: "Notice the pair of arrows per copy: one each way, each with its own colour and label. The read-only consumer gets a single dashed arrow.",
          alt: "An upstream repo on the left holds templates, a catalog and a manifest; two consumer repos on the right each merge at start and push at stop, and a package registry reads the upstream one way.",
        },
        {
          upstream: {
            label: "Upstream",
            sub: "one shared repo",
            items: [
              { label: "templates/", sub: "one folder each", icon: "doc" },
              { label: "catalog.yaml", sub: "build fails on drift", icon: "doc" },
              { label: "manifest.json", sub: "what installs read", icon: "tool" },
            ],
          },
          consumers: [
            { label: "web-app", sub: "subtree", icon: "git", hooks: ["on start", "on stop"] },
            { label: "mobile-app", sub: "subtree", icon: "git", hooks: ["on start", "on stop"] },
            { label: "Package registry", sub: "read-only", icon: "cloud", plugin: true },
          ],
        },
      ),
  },
  {
    id: "agent-loop",
    preset: "agentLoop",
    intro: "Use when a model calls tools and a deterministic step decides what leaves. Built from the agentLoop preset: three Lanes, a Group for the agent, one Bus carrying calls out and results back, and an accent dashed boundary Node.",
    render: (n) =>
      preset("agentLoop", n, {
        caption: "Notice the bus to the tools carries both directions: calls go out as diamonds, results come back as circles on the same line. Only the boundary's verdict reaches the output.",
      }),
  },
  {
    id: "failure-rail",
    intro: "Use when any stage of a pipeline can fail and every failure goes to one place. Built from a row of Nodes inside a dashed accent Group, a dashed stub from each stage down to one failure rail, and a dashed dead-letter Node at its end.",
    render: (n) => <FailureRailFigure number={n} />,
  },
  {
    id: "queue-callouts",
    intro: "Use when the point is where work waits. Built from parallel Packet lanes, frozen Packets (a zero-length path with at={0}) stacked into a queue, and dashed callout Nodes with dashed pointers.",
    render: (n) => <QueueCalloutsFigure number={n} />,
  },
  {
    id: "sequence",
    intro: "Use when the order of messages between actors matters more than the topology. Built from a Lane and header Node per actor, dashed lifelines (Connector with arrow={false}), a numbered Badge and Packet per message, a dashed self-loop for a retry and a line ending in ✕ for a lost message.",
    render: (n) => <SequenceFigure number={n} />,
  },
  {
    id: "nested-groups",
    intro: "Use when what runs inside what is the point. Built from Groups inside Groups (dashed for a boundary, solid for a unit you deploy or own) and dashed outlines stacked behind a Node for many identical copies.",
    render: (n) => <NestedGroupsFigure number={n} />,
  },
  {
    id: "numbered-steps",
    intro: "Use when one path crosses several areas and the reader should follow it in order. Built from column Lanes, a Group per area, numbered Badges along the path, a flow name so hovering lights the whole path, and a long elbow back to the start.",
    render: (n) => <NumberedStepsFigure number={n} />,
  },
  {
    id: "service-map",
    intro: "Use for a system overview: who calls the platform, what is inside it, what it stores and where changes go. Built from three Lanes, a Group of cells, a Bus with junction dots on each side and a change stream fanning out below. The serviceMap preset draws the same shape from a typed spec.",
    render: (n) => <HabitatFigure number={n} />,
  },
  {
    id: "layered-checks",
    intro: "Use when several imperfect checks together stop most problems. Built from a numbered Badge over each layer, one Connector per item through walls with gaps (drawn locally; there is no Wall part yet), and the accent on the one item that slips through.",
    render: (n) => <LayeredChecksFigure number={n} />,
  },
  {
    id: "flow-volumes",
    intro: "Use when how many go each way is the point, not just where they go. Built inside a Figure from bars and bands drawn on the theme's token colours, with legend hover by channel; there is no Sankey primitive yet.",
    render: (n) => <FlowVolumesFigure number={n} />,
  },
  {
    id: "drill-figure",
    intro: "Use when one part of a figure has a figure of its own. Built from DrillFigure levels and DrillNode: click, tap or press Enter on a glowing node to zoom into it; Back, Escape or the breadcrumb go up.",
    render: (n) => <DrillExample number={n} />,
  },
];
