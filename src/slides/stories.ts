import type { SlideStory } from "./types";

export const harnessDive: SlideStory = {
  id: "harness-dive",
  title: "Inside the agent harness",
  description:
    "Enter the boundary. Follow the context, tools, and checks around a model.",
  nodes: [
    {
      id: "harness",
      label: "Agent harness",
      position: [0, 0, 0],
      size: [9, 4, 6],
      kind: "boundary",
    },
    {
      id: "input",
      label: "Request",
      detail: "A goal enters",
      position: [-6.5, 0, 0],
      size: [1.6, 0.65, 1],
      tone: "request",
    },
    {
      id: "context",
      label: "Context",
      detail: "Instructions + state",
      position: [-2.8, 0, 0.5],
      tone: "request",
    },
    {
      id: "model",
      kind: "sphere",
      label: "Model",
      detail: "Proposes the next action",
      position: [0, 0, 0],
      size: [2, 1.3, 1.7],
      tone: "accent",
    },
    {
      id: "memory",
      label: "Memory",
      detail: "Retrieve what matters",
      position: [-2.8, 0, -2],
      kind: "layer",
      tone: "change",
    },
    {
      id: "tools",
      label: "Tools",
      detail: "Bounded capabilities",
      position: [2.8, 0, -2],
      tone: "change",
    },
    {
      id: "checks",
      label: "Checks",
      detail: "Permissions + evidence",
      position: [2.8, 0, 0.8],
      tone: "response",
    },
    {
      id: "output",
      label: "Result",
      detail: "Only after verification",
      position: [6.5, 0, 0],
      size: [1.6, 0.65, 1],
      tone: "response",
    },
  ],
  connections: [
    { id: "request", from: "input", to: "context", tone: "request" },
    { id: "context-model", from: "context", to: "model", tone: "request" },
    { id: "memory-context", from: "memory", to: "context", tone: "change" },
    { id: "model-tools", from: "model", to: "tools", tone: "change" },
    { id: "tools-checks", from: "tools", to: "checks", tone: "response" },
    { id: "model-checks", from: "model", to: "checks", tone: "request" },
    { id: "verified", from: "checks", to: "output", tone: "response" },
  ],
  stops: [
    {
      id: "outside",
      title: "The model lives inside a system.",
      caption:
        "A harness surrounds the model with context, capabilities, and a boundary for what may leave.",
      camera: { position: [14, 10, 20], target: [0, 0, 0] },
      labels: ["input", "model", "output"],
      nodes: {
        context: { opacity: 0.2 },
        memory: { opacity: 0.2 },
        tools: { opacity: 0.2 },
        checks: { opacity: 0.2 },
      },
      notes:
        "Start with the contract. The model is one component, not the entire agent.",
    },
    {
      id: "inside",
      title: "Open the harness.",
      caption:
        "The surrounding machinery becomes visible: context and memory on one side, tools and checks on the other.",
      camera: { position: [8, 9, 13], target: [0, 0, -0.4] },
      labels: ["context", "model", "memory", "tools", "checks"],
      nodes: {
        harness: { opacity: 0.12, scale: 1.12 },
        input: { opacity: 0.12 },
        output: { opacity: 0.12 },
      },
    },
    {
      id: "context",
      title: "Give the model the right context.",
      caption:
        "Instructions and retrieved memory shape the next decision. More context is useful only when it is relevant.",
      camera: { position: [-5, 7, 10], target: [-1.4, 0, -0.6] },
      labels: ["context", "model", "memory"],
      activeConnections: ["memory-context", "context-model"],
      nodes: {
        harness: { opacity: 0.05 },
        input: { opacity: 0.08 },
        output: { opacity: 0.08 },
        tools: { opacity: 0.16 },
        checks: { opacity: 0.16 },
      },
    },
    {
      id: "action",
      title: "A proposal becomes a tool call.",
      caption:
        "The model chooses an action; the harness supplies the capability and records what actually happened.",
      camera: { position: [8, 6, 9], target: [1.2, 0, -0.5] },
      labels: ["model", "tools", "checks"],
      activeConnections: ["model-tools", "tools-checks", "model-checks"],
      nodes: {
        harness: { opacity: 0.05 },
        input: { opacity: 0.08 },
        output: { opacity: 0.12 },
        context: { opacity: 0.14 },
        memory: { opacity: 0.14 },
      },
    },
    {
      id: "result",
      title: "Evidence decides what leaves.",
      caption:
        "A completed action is checked before it becomes a result. The boundary belongs to the harness.",
      camera: { position: [8, 6, 15], target: [3, 0, 0.3] },
      labels: ["model", "checks", "output"],
      activeConnections: ["model-checks", "verified"],
      nodes: {
        harness: { opacity: 0.14 },
        input: { opacity: 0.1 },
        context: { opacity: 0.14 },
        memory: { opacity: 0.14 },
        tools: { opacity: 0.18 },
      },
    },
  ],
};

export const retrievalLayers: SlideStory = {
  id: "retrieval-layers",
  title: "A dive through retrieval",
  description:
    "Explode the knowledge stack, then follow a question into evidence and an answer.",
  nodes: [
    {
      id: "sources",
      label: "Sources",
      detail: "Documents + records",
      position: [0, -2.2, 0],
      size: [7, 0.25, 4.5],
      kind: "layer",
      tone: "neutral",
    },
    {
      id: "index",
      label: "Index",
      detail: "Chunks + embeddings",
      position: [0, -0.9, 0],
      size: [6.3, 0.25, 4],
      kind: "layer",
      tone: "change",
    },
    {
      id: "retrieve",
      label: "Retrieve",
      detail: "Find candidate evidence",
      position: [-2, 0.6, 0],
      tone: "request",
    },
    {
      id: "rank",
      label: "Rerank",
      detail: "Keep the relevant pieces",
      position: [2, 0.6, 0],
      tone: "change",
    },
    {
      id: "question",
      label: "Question",
      detail: "What needs answering?",
      position: [-4.8, 2.1, 0],
      tone: "request",
    },
    {
      id: "answer",
      label: "Answer",
      detail: "Grounded in evidence",
      position: [3, 2.5, 0],
      tone: "response",
    },
  ],
  connections: [
    { id: "ingest", from: "sources", to: "index", tone: "change" },
    { id: "ask", from: "question", to: "retrieve", tone: "request" },
    { id: "lookup", from: "index", to: "retrieve", tone: "response" },
    { id: "rank", from: "retrieve", to: "rank", tone: "change" },
    { id: "answer", from: "rank", to: "answer", tone: "response" },
  ],
  stops: [
    {
      id: "stack",
      title: "Knowledge has layers.",
      caption:
        "Sources, an index, and a retrieval path sit beneath every grounded answer.",
      camera: { position: [12, 9, 17], target: [0, 0, 0] },
      labels: ["sources", "index", "question", "answer"],
    },
    {
      id: "explode",
      title: "Separate storage from selection.",
      caption:
        "The index makes evidence findable. Retrieval and ranking decide what the model will actually see.",
      camera: { position: [11, 7, 15], target: [0, 0.1, 0] },
      nodes: {
        sources: { position: [0, -3.3, 0] },
        index: { position: [0, -1.5, 0] },
        retrieve: { position: [-2.3, 0.7, 0] },
        rank: { position: [2.3, 0.7, 0] },
        question: { opacity: 0.15 },
        answer: { position: [3, 3, 0], opacity: 0.15 },
      },
      labels: ["sources", "index", "retrieve", "rank"],
      activeConnections: ["ingest", "lookup"],
    },
    {
      id: "query",
      title: "Trace one question.",
      caption:
        "A query finds candidates; ranking narrows them to the evidence worth carrying forward.",
      camera: { position: [-8, 7, 13], target: [-0.4, 0.8, 0] },
      labels: ["question", "retrieve", "rank"],
      activeConnections: ["ask", "lookup", "rank"],
      nodes: {
        sources: { opacity: 0.13 },
        index: { opacity: 0.35 },
        answer: { opacity: 0.2 },
      },
    },
    {
      id: "grounded",
      title: "Bring the evidence back up.",
      caption:
        "The answer depends on selected evidence, not merely on having a large collection of documents.",
      camera: { position: [8, 6, 12], target: [1, 1.2, 0] },
      labels: ["rank", "answer", "index"],
      activeConnections: ["answer"],
      nodes: {
        sources: { opacity: 0.12 },
        question: { opacity: 0.12 },
        retrieve: { opacity: 0.25 },
      },
    },
  ],
};

export const parallelAgents: SlideStory = {
  id: "parallel-agents",
  title: "Fan out. Bring evidence back.",
  description:
    "Turn a single task into parallel investigations, then converge on a reviewed result.",
  nodes: [
    {
      id: "goal",
      label: "Goal",
      detail: "One clear outcome",
      position: [-6, 0, 0],
      tone: "request",
    },
    {
      id: "planner",
      label: "Coordinator",
      detail: "Bounded assignments",
      position: [-3, 0, 0],
      tone: "accent",
    },
    {
      id: "research",
      label: "Research",
      detail: "Sources + facts",
      position: [0, 0, 0],
      tone: "request",
    },
    {
      id: "build",
      label: "Build",
      detail: "An inspectable change",
      position: [0, 0, 0],
      tone: "change",
    },
    {
      id: "review",
      label: "Review",
      detail: "Independent checks",
      position: [0, 0, 0],
      tone: "response",
    },
    {
      id: "merge",
      label: "Synthesis",
      detail: "Resolve disagreements",
      position: [3.6, 0, 0],
      tone: "accent",
    },
    {
      id: "result",
      label: "Result",
      detail: "Evidence attached",
      position: [6.5, 0, 0],
      tone: "response",
    },
  ],
  connections: [
    { id: "goal", from: "goal", to: "planner", tone: "request" },
    ...["research", "build", "review"].flatMap((id, i) => [
      {
        id: `out-${id}`,
        from: "planner",
        to: id,
        tone: ["request", "change", "response"][i] as
          | "request"
          | "change"
          | "response",
      },
      {
        id: `in-${id}`,
        from: id,
        to: "merge",
        tone: ["request", "change", "response"][i] as
          | "request"
          | "change"
          | "response",
      },
    ]),
    { id: "result", from: "merge", to: "result", tone: "response" },
  ],
  stops: [
    {
      id: "goal",
      title: "Start with a bounded goal.",
      caption:
        "A coordinator owns the outcome and splits only the work that can proceed independently.",
      camera: { position: [10, 9, 19], target: [0, 0, 0] },
      labels: ["goal", "planner", "result"],
      activeConnections: ["goal"],
      nodes: {
        research: { opacity: 0 },
        build: { opacity: 0 },
        review: { opacity: 0 },
        merge: { opacity: 0.25 },
      },
    },
    {
      id: "fanout",
      title: "Give independent work its own lane.",
      caption:
        "Research, implementation, and review spread into separate lanes with explicit responsibilities.",
      camera: { position: [10, 11, 18], target: [0, 0, 0] },
      labels: ["planner", "research", "build", "review", "merge"],
      activeConnections: ["out-research", "out-build", "out-review"],
      nodes: {
        research: { position: [0, 0, -3.4] },
        build: { position: [0, 0, 0] },
        review: { position: [0, 0, 3.4] },
        goal: { opacity: 0.18 },
        result: { opacity: 0.18 },
      },
    },
    {
      id: "inspect",
      title: "Look across the lanes.",
      caption:
        "A change and its review are different artifacts. Independent evidence is useful precisely because it can disagree.",
      camera: { position: [-3, 12, 13], target: [0, 0, 0] },
      labels: ["research", "build", "review"],
      nodes: {
        research: { position: [-2.8, 0, -2] },
        build: { position: [0, 1.2, 0] },
        review: { position: [2.8, 0, 2] },
        goal: { opacity: 0.1 },
        planner: { opacity: 0.15 },
        merge: { opacity: 0.15 },
        result: { opacity: 0.1 },
      },
    },
    {
      id: "converge",
      title: "Converge on one reviewed result.",
      caption:
        "The coordinator reconciles the evidence. More agents do not remove the need for one accountable decision.",
      camera: { position: [11, 8, 16], target: [2, 0, 0] },
      labels: ["research", "build", "review", "merge", "result"],
      activeConnections: ["in-research", "in-build", "in-review", "result"],
      nodes: {
        research: { position: [0, 0, -2.6] },
        build: { position: [0, 0, 0] },
        review: { position: [0, 0, 2.6] },
        goal: { opacity: 0.08 },
        planner: { opacity: 0.15 },
      },
    },
  ],
};
export const slideStories = [
  harnessDive,
  retrievalLayers,
  parallelAgents,
] as const;
