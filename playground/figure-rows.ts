// Data only, no imports: scripts/docs-sync.ts reads it in Node.
/**
 * Architecture-diagram patterns, rendered on the diagrams page (/components/diagrams) in this order, one section each (h2 = title).
 * The page is the design-system reference for figures: each distinct pattern once, simplest
 * first. Add an entry here and its section in playground/figures/index.tsx together.
 */
export const figureRows = [
  ["bare-figure", "Bare figure: just the canvas", ["Frame", "Canvas"]],
  [
    "parts",
    "Parts: every primitive once",
    ["Node", "Group", "Chip", "Connector", "Packet", "Bus", "Wall", "Cross", "Icon", "Mark"],
  ],
  ["pipeline", "Pipeline: stages in a line", ["Preset", "Pipeline", "Queue"]],
  ["loops", "Loops: repeat a step, return to the start", ["Loop", "Feedback", "Return path"]],
  ["decision-tree", "Decision tree: one question per level", ["Decision", "Branch", "Tree"]],
  ["before-after", "Before and after: the same flow, changed", ["Preset", "Comparison"]],
  ["fan-out-fan-in", "Fan-out and fan-in: parallel work, one merge", ["Bus", "Parallel", "Merge"]],
  ["two-way-sync", "Two-way sync: one source, many copies", ["Preset", "Sync", "Bidirectional"]],
  ["agent-loop", "Agent loop: calls out, results back, a check before output", ["Preset", "Agents", "Tools", "Gate"]],
  ["failure-rail", "Failure rail: every stage fails to one place", ["Vertical", "Errors", "Dead letter"]],
  ["queue-callouts", "Queue and callouts: where work piles up", ["Queue", "Callout", "Bottleneck"]],
  ["sequence", "Sequence: messages between actors, in order", ["Sequence", "Lifeline", "Protocol"]],
  ["user-flow", "User flow: who acts, what they see, where it branches", ["Actor", "Screen", "Decision", "Outcome"]],
  ["nested-groups", "Nested groups: what runs inside what", ["Group", "Containment", "Replicas"]],
  ["numbered-steps", "Numbered steps: one path across column lanes", ["Badge", "Walkthrough", "Lanes"]],
  ["service-map", "Service map: clients, one platform, its stores", ["Reference", "Bus", "Hub", "Lanes"]],
  ["layered-checks", "Layered checks: each layer stops some, one slips through", ["Filter", "Defence in depth"]],
  ["file-tree", "File tree: what is stored where, and what a file holds", ["Tree", "Files", "Storage"]],
  ["flow-volumes", "Flow volumes: where every item ends up", ["Sankey", "Volumes"]],
  ["annotated-curve", "Annotated curve: one trend and the points that matter", ["Chart", "Curve", "Callout"]],
  ["drill-figure", "Drill-down: a figure inside a node", ["Drill-down", "Zoom", "Levels"]],
] as const;
