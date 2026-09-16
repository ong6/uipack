import {
  Bus,
  Chip,
  Connector,
  Defs,
  Figure,
  Group,
  Label,
  Lane,
  Node,
  Packet,
  busStub,
  route
} from "./chunk-BSOMWVK4.js";
import "./chunk-M6VHM6HZ.js";

// src/presets/shared.tsx
import { useId } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var clean = (s) => s.replace(/:/g, "");
function PresetFigure({ spec, parts, id }) {
  const auto = useId();
  const fid = id ?? `p${clean(auto)}`;
  return toFigure(spec.figure, parts(spec, fid), fid);
}
function presetFigure(spec, parts, id) {
  return /* @__PURE__ */ jsx(PresetFigure, { spec, parts, id });
}
function toFigure(meta, parts, id) {
  return /* @__PURE__ */ jsx(
    Figure,
    {
      id,
      number: meta.number,
      eyebrow: meta.eyebrow,
      title: meta.title,
      caption: meta.caption,
      headingLevel: meta.headingLevel,
      legend: parts.legend,
      viewBox: parts.viewBox,
      narrow: parts.narrow,
      narrowViewBox: parts.narrowViewBox,
      alt: meta.alt,
      children: parts.wide
    }
  );
}
var NARROW_W = 360;
var SX = 16;
var SW = 328;
var SH = 48;
var GAP = 40;
function stackHeight(n, y0 = 24) {
  return y0 + n * SH + (n - 1) * GAP + 24;
}
function Stack({ steps, id, y0 = 24 }) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Defs, { id }),
    steps.map((s, i) => {
      const y = y0 + i * (SH + GAP);
      const into = [
        [SX + SW / 2, y - GAP],
        [SX + SW / 2, y]
      ];
      const kind = s.kind ?? "request";
      return /* @__PURE__ */ jsxs("g", { children: [
        i > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Connector, { points: into, defs: id, kind: kind === "neutral" ? void 0 : kind, flow: s.flow }),
          /* @__PURE__ */ jsx(Packet, { points: into, kind, dur: 1.4, delay: -i * 0.35, reverse: s.back, flow: s.flow, r: 4 })
        ] }) : null,
        /* @__PURE__ */ jsx(Node, { x: SX, y, w: SW, h: SH, label: s.label, sub: s.sub, icon: s.icon, size: 13, subSize: 10, flow: s.flow, accent: s.accent, dashed: s.dashed })
      ] }, i);
    })
  ] });
}

// src/presets/serviceMap.tsx
import { Fragment as Fragment2, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var defaultServiceMap = {
  figure: {
    number: "Figure 01",
    eyebrow: "Service map",
    title: "One gateway in front of every store",
    caption: "Clients call one platform; the platform owns auth, routing and caching, and is the only thing that talks to storage. Changes stream out to the warehouse.",
    alt: "Four clients on the left call a gateway platform in the middle, which reads and writes three stores on the right; a change stream under the platform feeds a warehouse and search."
  },
  clients: [
    { label: "Web app", icon: "client" },
    { label: "Mobile", icon: "client" },
    { label: "CLI", icon: "service" },
    { label: "Partners", icon: "more" }
  ],
  platform: {
    title: "Gateway",
    cells: [
      { label: "Auth", sub: "Sessions \xB7 keys" },
      { label: "Rate limit", sub: "Per tenant" },
      { label: "Routing", sub: "Schema lookup" },
      { label: "Caching", sub: "Read-through" },
      { label: "Encryption", sub: "At rest \xB7 in flight" },
      { label: "Audit", sub: "Every write" }
    ]
  },
  resources: [
    { label: "Postgres", sub: "Primary", icon: "db" },
    { label: "Redis", sub: "Cache", icon: "cache" },
    { label: "Object store", sub: "Blobs", icon: "blob" }
  ],
  sinks: {
    via: { label: "Change stream", sub: "CDC", icon: "queue" },
    items: [
      { label: "Warehouse", icon: "db" },
      { label: "Search", icon: "service" }
    ]
  }
};
var READ = "read";
var CDC = "cdc";
function serviceMapParts(spec = defaultServiceMap, id) {
  const [lc, lp, lr] = spec.laneTitles ?? ["Clients", "Platform", "Resources"];
  const client = { x: 24, w: 176, h: 48, step: 56, y0: 96 };
  const store = { x: 1024, w: 200, h: 48, step: 64, y0: 96 };
  const rows = Math.ceil(spec.platform.cells.length / 3);
  const platform = { x: 328, y: 64, w: 600, h: 44 + rows * 72 + (spec.platform.footer ? 72 : 0) };
  const busX = 232;
  const storeBusX = 1e3;
  const clientY = (i) => client.y0 + i * client.step + client.h / 2;
  const storeY = (i) => store.y0 + i * store.step + store.h / 2;
  const trunkY = 200;
  const lanesBottom = Math.max(platform.y + platform.h, client.y0 + spec.clients.length * client.step, store.y0 + spec.resources.length * store.step);
  const clientBus = {
    axis: "v",
    at: busX,
    stubs: [...spec.clients.map((_, i) => ({ at: clientY(i), to: client.x + client.w, flow: READ })), { at: trunkY, to: platform.x, arrow: true, flow: READ }]
  };
  const storeBus = {
    axis: "v",
    at: storeBusX,
    stubs: [...spec.resources.map((_, i) => ({ at: storeY(i), to: store.x, arrow: true, flow: READ })), { at: trunkY, to: platform.x + platform.w, flow: READ }]
  };
  const toPlatform = busStub(clientBus, clientBus.stubs[spec.clients.length]);
  const fromPlatform = busStub(storeBus, storeBus.stubs[spec.resources.length]);
  let height = lanesBottom + 24;
  let sinks = null;
  if (spec.sinks) {
    const via = { x: platform.x + platform.w / 2 - 100, y: platform.y + platform.h + 48, w: 200, h: 56 };
    const n = spec.sinks.items.length;
    const sw = 128;
    const gap = 24;
    const rowW = n * sw + (n - 1) * gap;
    const x0 = platform.x + platform.w / 2 - rowW / 2;
    const sinkY = via.y + via.h + 40;
    const viaPath = [
      [platform.x + platform.w / 2, platform.y + platform.h],
      [via.x + via.w / 2, via.y]
    ];
    const elbow = via.y + via.h + 24;
    sinks = /* @__PURE__ */ jsxs2(Fragment2, { children: [
      /* @__PURE__ */ jsx2(Connector, { points: viaPath, defs: id, kind: "change", flow: CDC }),
      /* @__PURE__ */ jsx2(Packet, { points: viaPath, kind: "change", dur: 2, flow: CDC }),
      /* @__PURE__ */ jsx2(Node, { ...via, label: spec.sinks.via.label, sub: spec.sinks.via.sub, icon: spec.sinks.via.icon ?? "queue", flow: CDC }),
      spec.sinks.items.map((s, i) => {
        const p = route([via.x + via.w / 2, via.y + via.h], [x0 + i * (sw + gap) + sw / 2, sinkY], elbow, "v");
        return /* @__PURE__ */ jsxs2("g", { children: [
          /* @__PURE__ */ jsx2(Connector, { points: p, defs: id, kind: "change", flow: CDC }),
          /* @__PURE__ */ jsx2(Packet, { points: p, kind: "change", dur: 2.2, delay: -i * 0.55, flow: CDC }),
          /* @__PURE__ */ jsx2(Node, { x: x0 + i * (sw + gap), y: sinkY, w: sw, h: 40, label: s.label, icon: s.icon, flow: CDC, size: 13 })
        ] }, s.label);
      })
    ] });
    height = sinkY + 40 + 24;
  }
  const wide = /* @__PURE__ */ jsxs2(Fragment2, { children: [
    /* @__PURE__ */ jsx2(Defs, { id }),
    /* @__PURE__ */ jsx2(Lane, { x: client.x, w: client.w, y: 44, title: lc }),
    /* @__PURE__ */ jsx2(Lane, { x: platform.x, w: platform.w, y: 44, title: lp }),
    /* @__PURE__ */ jsx2(Lane, { x: store.x, w: store.w, y: 44, title: lr }),
    spec.clients.map((c, i) => /* @__PURE__ */ jsx2(Node, { x: client.x, y: client.y0 + i * client.step, w: client.w, h: client.h, label: c.label, sub: c.sub, icon: c.icon, flow: READ }, c.label)),
    /* @__PURE__ */ jsxs2(Group, { ...platform, title: spec.platform.title, flow: spec.sinks ? [READ, CDC] : READ, children: [
      spec.platform.cells.map((c, i) => /* @__PURE__ */ jsx2(Node, { x: platform.x + 24 + i % 3 * 192, y: platform.y + 44 + Math.floor(i / 3) * 72, w: 168, h: 56, label: c.label, sub: c.sub, align: "left", flow: READ }, c.label)),
      spec.platform.footer ? /* @__PURE__ */ jsx2(Node, { x: platform.x + 24, y: platform.y + 44 + rows * 72, w: 552, h: 56, label: spec.platform.footer.label, sub: spec.platform.footer.sub, align: "left", flow: READ }) : null
    ] }),
    spec.resources.map((r, i) => /* @__PURE__ */ jsx2(Node, { x: store.x, y: store.y0 + i * store.step, w: store.w, h: store.h, label: r.label, sub: r.sub, icon: r.icon, flow: READ }, r.label)),
    /* @__PURE__ */ jsx2(Bus, { ...clientBus, from: Math.min(clientY(0), trunkY), to: Math.max(clientY(spec.clients.length - 1), trunkY), defs: id }),
    /* @__PURE__ */ jsx2(Bus, { ...storeBus, from: Math.min(storeY(0), trunkY), to: Math.max(storeY(spec.resources.length - 1), trunkY), defs: id }),
    /* @__PURE__ */ jsx2(Packet, { points: toPlatform, kind: "request", dur: 2.4, flow: READ }),
    /* @__PURE__ */ jsx2(Packet, { points: toPlatform, kind: "response", dur: 2.4, delay: -1.2, reverse: true, flow: READ }),
    /* @__PURE__ */ jsx2(Packet, { points: fromPlatform, kind: "request", dur: 2.4, delay: -0.3, reverse: true, flow: READ }),
    /* @__PURE__ */ jsx2(Packet, { points: fromPlatform, kind: "response", dur: 2.4, delay: -1.5, flow: READ }),
    spec.clients.map((_, i) => /* @__PURE__ */ jsx2(Packet, { points: busStub(clientBus, clientBus.stubs[i]), kind: i % 2 ? "response" : "request", dur: 1.6, delay: -i * 0.4, reverse: i % 2 === 0, r: 4, flow: READ }, i)),
    spec.resources.map((_, i) => /* @__PURE__ */ jsx2(Packet, { points: busStub(storeBus, storeBus.stubs[i]), kind: i % 2 ? "response" : "request", dur: 1.6, delay: -i * 0.5, reverse: i % 2 === 1, r: 4, flow: READ }, i)),
    sinks
  ] });
  const steps = [
    { label: spec.clients.map((c) => c.label).join(" \xB7 "), sub: lc, icon: "client", flow: READ },
    { label: spec.platform.title, sub: spec.platform.cells.map((c) => c.label).join(" \xB7 "), icon: "service", flow: READ },
    { label: spec.resources.map((r) => r.label).join(" \xB7 "), sub: lr, icon: "db", flow: READ },
    ...spec.sinks ? [{ label: spec.sinks.via.label, sub: spec.sinks.items.map((s) => s.label).join(" \xB7 "), icon: "queue", kind: "change", flow: CDC }] : []
  ];
  return {
    wide,
    narrow: /* @__PURE__ */ jsx2(Stack, { steps, id: `${id}-n` }),
    viewBox: `0 0 1248 ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Request", kind: "request" },
      { label: "Response", kind: "response" },
      ...spec.sinks ? [{ label: "Change", kind: "change" }] : []
    ]
  };
}
var serviceMap = (spec = defaultServiceMap, id) => presetFigure(spec, serviceMapParts, id);

// src/presets/agentLoop.tsx
import { Fragment as Fragment3, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var defaultAgentLoop = {
  figure: {
    number: "Figure 01",
    eyebrow: "Agent loop",
    title: "Tools answer, the boundary decides",
    caption: "The agent plans, calls tools, and drafts. Nothing reaches the user until a deterministic check passes the draft against what the tools recorded.",
    alt: "A user sends a request to an agent, the agent calls three tools and gets results back, then its draft passes through a deterministic boundary before becoming the output."
  },
  user: { label: "User", icon: "user" },
  agent: { label: "Agent", sub: "plan \xB7 call \xB7 draft", icon: "agent" },
  tools: [
    { label: "Search", sub: "tool", icon: "browser" },
    { label: "Database", sub: "tool", icon: "db" },
    { label: "Calculator", sub: "tool", icon: "tool" }
  ],
  boundary: { label: "Deterministic boundary", sub: "facts recorded \u2192 fields checked", icon: "lock" },
  output: { label: "Output", sub: "only what the facts support", icon: "doc" }
};
var ASK = "ask";
var TOOLS = "tools";
var CHECK = "check";
function agentLoopParts(spec = defaultAgentLoop, id) {
  const [lu, la, lt] = spec.laneTitles ?? ["User", "Agent", "Tools"];
  const user = { x: 24, y: 96, w: 176, h: 48 };
  const n = spec.tools.length;
  const tool = { x: 800, w: 176, h: 48, step: 56, y0: 96 };
  const toolY = (i) => tool.y0 + i * tool.step + tool.h / 2;
  const agentBox = { x: 328, y: 64, w: 336, h: Math.max(176, tool.y0 - 64 + n * tool.step - 8 + 16) };
  const busX = 744;
  const trunkY = 152;
  const bus = {
    axis: "v",
    at: busX,
    stubs: [...spec.tools.map((_, i) => ({ at: toolY(i), to: tool.x, arrow: true, flow: TOOLS })), { at: trunkY, to: agentBox.x + agentBox.w, flow: TOOLS }]
  };
  const fromAgent = busStub(bus, bus.stubs[n]);
  const ask = [
    [user.x + user.w, 120],
    [agentBox.x, 120]
  ];
  const boundary = { x: 328, y: agentBox.y + agentBox.h + 32, w: 336, h: 56 };
  const output = { x: 328, y: boundary.y + boundary.h + 48, w: 336, h: 48 };
  const cx = agentBox.x + agentBox.w / 2;
  const toBoundary = [
    [cx, agentBox.y + agentBox.h],
    [cx, boundary.y]
  ];
  const toOutput = [
    [cx, boundary.y + boundary.h],
    [cx, output.y]
  ];
  const height = output.y + output.h + 24;
  const wide = /* @__PURE__ */ jsxs3(Fragment3, { children: [
    /* @__PURE__ */ jsx3(Defs, { id }),
    /* @__PURE__ */ jsx3(Lane, { x: user.x, w: user.w, y: 44, title: lu }),
    /* @__PURE__ */ jsx3(Lane, { x: agentBox.x, w: agentBox.w, y: 44, title: la }),
    /* @__PURE__ */ jsx3(Lane, { x: tool.x, w: tool.w, y: 44, title: lt }),
    /* @__PURE__ */ jsx3(Node, { ...user, label: spec.user.label, sub: spec.user.sub, icon: spec.user.icon ?? "user", flow: ASK, hint: "Sends the request, reads the output" }),
    /* @__PURE__ */ jsxs3(Group, { ...agentBox, title: spec.agent.label, flow: [ASK, TOOLS, CHECK], children: [
      /* @__PURE__ */ jsx3(Node, { x: agentBox.x + 24, y: agentBox.y + 40, w: agentBox.w - 48, h: 56, label: spec.agent.sub ?? "plan \xB7 call \xB7 draft", sub: "model", icon: spec.agent.icon ?? "agent", flow: [ASK, TOOLS] }),
      /* @__PURE__ */ jsx3(Node, { x: agentBox.x + 24, y: agentBox.y + 112, w: agentBox.w - 48, h: 40, label: "Draft", sub: "structured output", icon: "doc", flow: CHECK, size: 13, subSize: 10 })
    ] }),
    spec.tools.map((t, i) => /* @__PURE__ */ jsx3(Node, { x: tool.x, y: tool.y0 + i * tool.step, w: tool.w, h: tool.h, label: t.label, sub: t.sub, icon: t.icon ?? "tool", flow: TOOLS }, t.label)),
    /* @__PURE__ */ jsx3(Connector, { points: ask, defs: id, kind: "request", flow: ASK }),
    /* @__PURE__ */ jsx3(Packet, { points: ask, kind: "request", dur: 2, flow: ASK }),
    /* @__PURE__ */ jsx3(Packet, { points: ask, kind: "response", dur: 2, delay: -1, reverse: true, flow: ASK }),
    /* @__PURE__ */ jsx3(Bus, { ...bus, from: Math.min(toolY(0), trunkY), to: Math.max(toolY(n - 1), trunkY), defs: id, kind: "change" }),
    /* @__PURE__ */ jsx3(Packet, { points: fromAgent, kind: "change", dur: 1.8, flow: TOOLS }),
    /* @__PURE__ */ jsx3(Packet, { points: fromAgent, kind: "response", dur: 1.8, delay: -0.9, reverse: true, flow: TOOLS }),
    spec.tools.map((_, i) => /* @__PURE__ */ jsx3(Packet, { points: busStub(bus, bus.stubs[i]), kind: i % 2 ? "response" : "change", dur: 1.4, delay: -i * 0.45, reverse: i % 2 === 1, r: 4, flow: TOOLS }, i)),
    /* @__PURE__ */ jsx3(Label, { x: (agentBox.x + agentBox.w + busX) / 2, y: trunkY - 10, text: "tool calls", anchor: "middle" }),
    /* @__PURE__ */ jsx3(Connector, { points: toBoundary, defs: id, kind: "request", flow: CHECK }),
    /* @__PURE__ */ jsx3(Packet, { points: toBoundary, kind: "request", dur: 1.6, flow: CHECK }),
    /* @__PURE__ */ jsx3(Node, { ...boundary, label: spec.boundary.label, sub: spec.boundary.sub, icon: spec.boundary.icon ?? "lock", accent: true, dashed: true, flow: CHECK, hint: "Code, not a model, decides what passes" }),
    /* @__PURE__ */ jsx3(Connector, { points: toOutput, defs: id, kind: "accent", flow: CHECK }),
    /* @__PURE__ */ jsx3(Packet, { points: toOutput, kind: "accent", dur: 1.6, delay: -0.8, flow: CHECK }),
    /* @__PURE__ */ jsx3(Label, { x: cx + 12, y: toOutput[0][1] + 28, text: "verdict", accent: true }),
    /* @__PURE__ */ jsx3(Node, { ...output, label: spec.output.label, sub: spec.output.sub, icon: spec.output.icon ?? "doc", flow: CHECK })
  ] });
  const steps = [
    { ...spec.user, icon: spec.user.icon ?? "user", flow: ASK },
    { ...spec.agent, icon: spec.agent.icon ?? "agent", flow: ASK },
    { label: spec.tools.map((t) => t.label).join(" \xB7 "), sub: lt.toLowerCase(), icon: "tool", kind: "change", flow: TOOLS },
    { label: "Tool results", sub: "back to the agent", icon: "doc", kind: "response", flow: TOOLS },
    { ...spec.boundary, icon: spec.boundary.icon ?? "lock", accent: true, dashed: true, flow: CHECK },
    { ...spec.output, icon: spec.output.icon ?? "doc", kind: "accent", flow: CHECK }
  ];
  return {
    wide,
    narrow: /* @__PURE__ */ jsx3(Stack, { steps, id: `${id}-n` }),
    viewBox: `0 0 1120 ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Request", kind: "request" },
      { label: "Tool call", kind: "change" },
      { label: "Tool result", kind: "response" },
      { label: "Verdict", kind: "accent" }
    ]
  };
}
var agentLoop = (spec = defaultAgentLoop, id) => presetFigure(spec, agentLoopParts, id);

// src/presets/ragPipeline.tsx
import { Fragment as Fragment4, jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var defaultRagPipeline = {
  figure: {
    number: "Figure 01",
    eyebrow: "RAG pipeline",
    title: "Two lanes, one index",
    caption: "Ingest chunks and embeds documents into the index on its own schedule. A query retrieves from the same index, reranks, and generates. The lanes never block each other.",
    alt: "Three document sources feed an ingest lane of chunk, embed and upsert stages into a vector index; below, a user query passes through retrieve, rerank and generate stages, with retrieve reading the index, and ends in an answer."
  },
  sources: [
    { label: "Docs", icon: "doc" },
    { label: "Tickets", icon: "queue" },
    { label: "Wiki", icon: "browser" }
  ],
  ingest: [
    { label: "Chunk", sub: "800 tokens \xB7 overlap" },
    { label: "Embed", sub: "batch \xB7 model", icon: "model" },
    { label: "Upsert", sub: "id \xB7 hash \xB7 version" }
  ],
  index: { label: "Vector index", sub: "HNSW \xB7 metadata", icon: "db" },
  query: { label: "Query", icon: "user" },
  stages: [
    { label: "Retrieve", sub: "top-k \xB7 filters" },
    { label: "Rerank", sub: "cross-encoder", icon: "model" },
    { label: "Generate", sub: "cited answer", icon: "agent" }
  ],
  answer: { label: "Answer", sub: "with citations", icon: "doc" }
};
var INGEST = "ingest";
var QUERY = "query";
function ragPipelineParts(spec = defaultRagPipeline, id) {
  const src = { x: 24, w: 160, h: 48, step: 56, y0: 80 };
  const srcY = (i) => src.y0 + i * src.step + src.h / 2;
  const stage = { w: 136, h: 48, step: 176, x0: 248 };
  const ingestY = 80;
  const iy = ingestY + stage.h / 2;
  const index = { x: 944, y: 136, w: 152, h: 64 };
  const queryY = 272;
  const qy = queryY + stage.h / 2;
  const answer = { x: 944, y: queryY, w: 152, h: 48 };
  const busX = 216;
  const bus = {
    axis: "v",
    at: busX,
    stubs: [...spec.sources.map((_, i) => ({ at: srcY(i), to: src.x + src.w, flow: INGEST })), { at: iy, to: stage.x0, arrow: true, flow: INGEST }]
  };
  const sx = (i) => stage.x0 + i * stage.step;
  const ingestLast = sx(spec.ingest.length - 1) + stage.w;
  const toIndex = [
    [ingestLast, iy],
    [index.x + index.w / 2, iy],
    [index.x + index.w / 2, index.y]
  ];
  const retrieveX = sx(0) + stage.w / 2;
  const read = [
    [retrieveX, queryY],
    [retrieveX, index.y + index.h / 2 + 16],
    [index.x, index.y + index.h / 2 + 16]
  ];
  const queryIn = [
    [src.x + src.w, qy],
    [sx(0), qy]
  ];
  const toAnswer = [
    [sx(spec.stages.length - 1) + stage.w, qy],
    [answer.x, qy]
  ];
  const height = queryY + stage.h + 32;
  const chain = (items, y, kind, flow) => items.slice(1).map((_, i) => {
    const p = [
      [sx(i) + stage.w, y],
      [sx(i + 1), y]
    ];
    return /* @__PURE__ */ jsxs4("g", { children: [
      /* @__PURE__ */ jsx4(Connector, { points: p, defs: id, kind, flow }),
      /* @__PURE__ */ jsx4(Packet, { points: p, kind, dur: 1.2, delay: -i * 0.4, r: 4, flow })
    ] }, i);
  });
  const wide = /* @__PURE__ */ jsxs4(Fragment4, { children: [
    /* @__PURE__ */ jsx4(Defs, { id }),
    /* @__PURE__ */ jsx4(Lane, { x: src.x, w: src.w, y: 44, title: "Sources" }),
    /* @__PURE__ */ jsx4(Lane, { x: stage.x0, w: ingestLast - stage.x0, y: 44, title: "Ingest" }),
    /* @__PURE__ */ jsx4(Lane, { x: index.x, w: index.w, y: 44, title: "Index" }),
    /* @__PURE__ */ jsx4(Lane, { x: stage.x0, w: sx(spec.stages.length - 1) + stage.w - stage.x0, y: 252, title: "Query" }),
    spec.sources.map((s, i) => /* @__PURE__ */ jsx4(Node, { x: src.x, y: src.y0 + i * src.step, w: src.w, h: src.h, label: s.label, icon: s.icon ?? "doc", flow: INGEST, size: 13 }, s.label)),
    /* @__PURE__ */ jsx4(Bus, { ...bus, from: Math.min(srcY(0), iy), to: Math.max(srcY(spec.sources.length - 1), iy), defs: id, kind: "change" }),
    spec.sources.map((_, i) => /* @__PURE__ */ jsx4(Packet, { points: busStub(bus, bus.stubs[i]), kind: "change", dur: 1.4, delay: -i * 0.5, reverse: true, r: 4, flow: INGEST }, i)),
    /* @__PURE__ */ jsx4(Packet, { points: busStub(bus, bus.stubs[spec.sources.length]), kind: "change", dur: 1.2, flow: INGEST, r: 4 }),
    spec.ingest.map((s, i) => /* @__PURE__ */ jsx4(Node, { x: sx(i), y: ingestY, w: stage.w, h: stage.h, label: s.label, sub: s.sub, icon: s.icon, flow: INGEST, size: 13, subSize: 10 }, s.label)),
    chain(spec.ingest, iy, "change", INGEST),
    /* @__PURE__ */ jsx4(Connector, { points: toIndex, defs: id, kind: "change", flow: INGEST }),
    /* @__PURE__ */ jsx4(Packet, { points: toIndex, kind: "change", dur: 2, flow: INGEST }),
    /* @__PURE__ */ jsx4(Node, { ...index, label: spec.index.label, sub: spec.index.sub, icon: spec.index.icon ?? "db", flow: [INGEST, QUERY], hint: "Shared by both lanes" }),
    /* @__PURE__ */ jsx4(Node, { x: src.x, y: queryY, w: src.w, h: stage.h, label: spec.query.label, icon: spec.query.icon ?? "user", flow: QUERY, size: 13 }),
    /* @__PURE__ */ jsx4(Connector, { points: queryIn, defs: id, kind: "request", flow: QUERY }),
    /* @__PURE__ */ jsx4(Packet, { points: queryIn, kind: "request", dur: 1.2, flow: QUERY, r: 4 }),
    spec.stages.map((s, i) => /* @__PURE__ */ jsx4(Node, { x: sx(i), y: queryY, w: stage.w, h: stage.h, label: s.label, sub: s.sub, icon: s.icon, flow: QUERY, size: 13, subSize: 10 }, s.label)),
    chain(spec.stages, qy, "request", QUERY),
    /* @__PURE__ */ jsx4(Connector, { points: read, defs: id, kind: "request", flow: QUERY }),
    /* @__PURE__ */ jsx4(Packet, { points: read, kind: "request", dur: 1.8, flow: QUERY, r: 4 }),
    /* @__PURE__ */ jsx4(Packet, { points: read, kind: "response", dur: 1.8, delay: -0.9, reverse: true, flow: QUERY, r: 4 }),
    /* @__PURE__ */ jsx4(Label, { x: (retrieveX + index.x) / 2, y: index.y + index.h / 2 + 6, text: "top-k", anchor: "middle" }),
    /* @__PURE__ */ jsx4(Connector, { points: toAnswer, defs: id, kind: "response", flow: QUERY }),
    /* @__PURE__ */ jsx4(Packet, { points: toAnswer, kind: "response", dur: 1.4, flow: QUERY, r: 4 }),
    /* @__PURE__ */ jsx4(Node, { ...answer, label: spec.answer.label, sub: spec.answer.sub, icon: spec.answer.icon ?? "doc", flow: QUERY, size: 13, subSize: 10 })
  ] });
  const steps = [
    { label: spec.sources.map((s) => s.label).join(" \xB7 "), sub: "sources", icon: "doc", flow: INGEST },
    ...spec.ingest.map((s) => ({ ...s, kind: "change", flow: INGEST })),
    { ...spec.index, icon: spec.index.icon ?? "db", kind: "change", flow: [INGEST, QUERY].join(" ") },
    { ...spec.query, icon: spec.query.icon ?? "user", kind: "request", flow: QUERY },
    ...spec.stages.map((s) => ({ ...s, kind: "request", flow: QUERY })),
    { ...spec.answer, icon: spec.answer.icon ?? "doc", kind: "response", flow: QUERY }
  ];
  return {
    wide,
    narrow: /* @__PURE__ */ jsx4(Stack, { steps, id: `${id}-n` }),
    viewBox: `0 0 1120 ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Write", kind: "change" },
      { label: "Query", kind: "request" },
      { label: "Result", kind: "response" }
    ]
  };
}
var ragPipeline = (spec = defaultRagPipeline, id) => presetFigure(spec, ragPipelineParts, id);

// src/presets/skillLifecycle.tsx
import { Fragment as Fragment5, jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
var defaultSkillLifecycle = {
  figure: {
    number: "Figure 01",
    eyebrow: "Skill lifecycle",
    title: "A skill earns its place, then flows back",
    caption: "A candidate skill is scored against a no-skill baseline before it gets a version. Versions install into every consumer; what breaks in use comes back as feedback to the author.",
    alt: "An author writes a skill, an evaluator scores it against a baseline, a version is cut and installed into three consumer repos, and feedback loops from the consumers back to the author."
  },
  author: { label: "Author", sub: "SKILL.md \xB7 examples", icon: "user" },
  evaluate: { label: "Evaluate", sub: "frozen cases \xB7 scored", icon: "chart", baseline: "no-skill run" },
  version: { label: "Version", sub: "immutable revision", icon: "git" },
  consumers: [
    { label: "Store", sub: "subtree", icon: "git" },
    { label: "Site", sub: "plugin", icon: "browser" },
    { label: "Agent box", sub: "plugin", icon: "robot" }
  ],
  feedback: { label: "Feedback", sub: "what broke in use", icon: "warning" }
};
var FWD = "forward";
var BACK = "feedback";
function skillLifecycleParts(spec = defaultSkillLifecycle, id) {
  const y = 96;
  const author = { x: 24, y, w: 176, h: 48 };
  const evaluate = { x: 264, y: y - 4, w: 192, h: 56 };
  const version = { x: 520, y, w: 176, h: 48 };
  const con = { x: 808, w: 176, h: 48, step: 56, y0: 96 };
  const n = spec.consumers.length;
  const conY = (i) => con.y0 + i * con.step + con.h / 2;
  const busX = 760;
  const cy = y + 24;
  const bus = {
    axis: "v",
    at: busX,
    stubs: [...spec.consumers.map((_, i) => ({ at: conY(i), to: con.x, arrow: true, flow: FWD })), { at: cy, to: version.x + version.w, flow: FWD }]
  };
  const a2e = [
    [author.x + author.w, cy],
    [evaluate.x, cy]
  ];
  const e2v = [
    [evaluate.x + evaluate.w, cy],
    [version.x, cy]
  ];
  const trunkEnd = Math.max(conY(n - 1), cy);
  const loopY = trunkEnd + 64;
  const back = [
    [busX, trunkEnd],
    [busX, loopY],
    [author.x + author.w / 2, loopY],
    [author.x + author.w / 2, author.y + author.h]
  ];
  const height = loopY + 40;
  const wide = /* @__PURE__ */ jsxs5(Fragment5, { children: [
    /* @__PURE__ */ jsx5(Defs, { id }),
    /* @__PURE__ */ jsx5(Lane, { x: author.x, w: author.w, y: 44, title: "Author" }),
    /* @__PURE__ */ jsx5(Lane, { x: evaluate.x, w: evaluate.w, y: 44, title: "Evaluate" }),
    /* @__PURE__ */ jsx5(Lane, { x: version.x, w: version.w, y: 44, title: "Version" }),
    /* @__PURE__ */ jsx5(Lane, { x: con.x, w: con.w, y: 44, title: "Consumers" }),
    /* @__PURE__ */ jsx5(Node, { ...author, label: spec.author.label, sub: spec.author.sub, icon: spec.author.icon ?? "user", flow: [FWD, BACK] }),
    /* @__PURE__ */ jsx5(Connector, { points: a2e, defs: id, kind: "request", flow: FWD }),
    /* @__PURE__ */ jsx5(Packet, { points: a2e, kind: "request", dur: 1.4, flow: FWD, r: 4 }),
    /* @__PURE__ */ jsx5(Node, { ...evaluate, label: spec.evaluate.label, sub: spec.evaluate.sub, icon: spec.evaluate.icon ?? "chart", flow: FWD, hint: `Scored against: ${spec.evaluate.baseline}` }),
    /* @__PURE__ */ jsx5(Chip, { x: evaluate.x, y: evaluate.y + evaluate.h + 12, w: evaluate.w, h: 20, label: `baseline \xB7 ${spec.evaluate.baseline}`, size: 9, dashed: true }),
    /* @__PURE__ */ jsx5(Connector, { points: e2v, defs: id, kind: "accent", flow: FWD }),
    /* @__PURE__ */ jsx5(Packet, { points: e2v, kind: "accent", dur: 1.4, delay: -0.7, flow: FWD, r: 4 }),
    /* @__PURE__ */ jsx5(Label, { x: (e2v[0][0] + e2v[1][0]) / 2, y: cy - 10, text: "passes", anchor: "middle", accent: true }),
    /* @__PURE__ */ jsx5(Node, { ...version, label: spec.version.label, sub: spec.version.sub, icon: spec.version.icon ?? "git", flow: FWD }),
    /* @__PURE__ */ jsx5(Bus, { ...bus, from: Math.min(conY(0), cy), to: trunkEnd, defs: id }),
    /* @__PURE__ */ jsx5(Packet, { points: busStub(bus, bus.stubs[n]), kind: "request", dur: 1.2, flow: FWD, r: 4 }),
    spec.consumers.map((c, i) => /* @__PURE__ */ jsxs5("g", { children: [
      /* @__PURE__ */ jsx5(Packet, { points: busStub(bus, bus.stubs[i]), kind: "request", dur: 1.2, delay: -i * 0.4, flow: FWD, r: 4 }),
      /* @__PURE__ */ jsx5(Node, { x: con.x, y: con.y0 + i * con.step, w: con.w, h: con.h, label: c.label, sub: c.sub, icon: c.icon, flow: [FWD, BACK] })
    ] }, c.label)),
    /* @__PURE__ */ jsx5(Label, { x: (version.x + version.w + busX) / 2, y: cy - 10, text: "install", anchor: "middle" }),
    /* @__PURE__ */ jsx5(Connector, { points: back, defs: id, kind: "change", flow: BACK, dashed: true }),
    /* @__PURE__ */ jsx5(Packet, { points: back, kind: "change", dur: 3.2, flow: BACK }),
    /* @__PURE__ */ jsx5(Packet, { points: back, kind: "change", dur: 3.2, delay: -1.6, flow: BACK }),
    /* @__PURE__ */ jsx5(Label, { x: (busX + author.x) / 2, y: loopY - 10, text: `${spec.feedback.label} \xB7 ${spec.feedback.sub ?? ""}`.trim(), anchor: "middle" })
  ] });
  const steps = [
    { ...spec.author, icon: spec.author.icon ?? "user", flow: FWD },
    { ...spec.evaluate, sub: `${spec.evaluate.sub ?? ""} \xB7 vs ${spec.evaluate.baseline}`.replace(/^ · /, ""), icon: spec.evaluate.icon ?? "chart", flow: FWD },
    { ...spec.version, icon: spec.version.icon ?? "git", kind: "accent", flow: FWD },
    { label: spec.consumers.map((c) => c.label).join(" \xB7 "), sub: "consumers", icon: "git", flow: FWD },
    { ...spec.feedback, icon: spec.feedback.icon ?? "warning", kind: "change", flow: BACK, dashed: true }
  ];
  return {
    wide,
    narrow: /* @__PURE__ */ jsx5(Stack, { steps, id: `${id}-n` }),
    viewBox: `0 0 1120 ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Candidate", kind: "request" },
      { label: "Passes baseline", kind: "accent" },
      { label: "Feedback", kind: "change" }
    ]
  };
}
var skillLifecycle = (spec = defaultSkillLifecycle, id) => presetFigure(spec, skillLifecycleParts, id);

// src/presets/syncLoop.tsx
import { Fragment as Fragment6, jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
var defaultSyncLoop = {
  figure: {
    number: "Figure 01",
    eyebrow: "Sync loop",
    title: "Edit where you use it, it flows back",
    caption: "One upstream repo is a subtree inside every consumer. A start hook merges what moved upstream; a stop hook pushes local edits back. A plugin install reads the same repo one way.",
    alt: "An upstream repo on the left holds skills, a catalog and a plugin manifest; three consumer repos on the right each pull at session start and push at session stop, and a plugin marketplace reads the upstream one way."
  },
  upstream: {
    label: "Upstream",
    sub: "ong6/skillpack",
    items: [
      { label: "skills/", sub: "one folder per skill", icon: "doc" },
      { label: "catalog.yaml", sub: "build fails on drift", icon: "doc" },
      { label: ".claude-plugin/", sub: "marketplace + plugin", icon: "tool" }
    ]
  },
  consumers: [
    { label: "personal-data-store", sub: "subtree", icon: "git", hooks: ["SessionStart", "Stop"] },
    { label: "junxiong-homepage", sub: "subtree", icon: "git", hooks: ["SessionStart", "Stop"] },
    { label: "Plugin marketplace", sub: "read-only", icon: "cloud", plugin: true }
  ],
  pull: "merge at start",
  push: "push at stop"
};
var PULL = "pull";
var PUSH = "push";
function syncLoopParts(spec = defaultSyncLoop, id) {
  const items = spec.upstream.items;
  const n = spec.consumers.length;
  const con = { x: 720, w: 336, h: 64, step: 88, y0: 72 };
  const up = { x: 24, y: 64, w: 320, h: Math.max(48 + items.length * 64 + 8, con.y0 + n * con.step - 64 - 8) };
  const conY = (i) => con.y0 + i * con.step + con.h / 2;
  const height = Math.max(up.y + up.h, con.y0 + n * con.step - 24) + 32;
  const wide = /* @__PURE__ */ jsxs6(Fragment6, { children: [
    /* @__PURE__ */ jsx6(Defs, { id }),
    /* @__PURE__ */ jsx6(Lane, { x: up.x, w: up.w, y: 44, title: "Upstream" }),
    /* @__PURE__ */ jsx6(Lane, { x: con.x, w: con.w, y: 44, title: "Consumers" }),
    /* @__PURE__ */ jsx6(Group, { ...up, title: spec.upstream.label, flow: [PULL, PUSH], children: items.map((it, i) => /* @__PURE__ */ jsx6(Node, { x: up.x + 16, y: up.y + 40 + i * 64, w: up.w - 32, h: 48, label: it.label, sub: it.sub, icon: it.icon, align: "left", flow: [PULL, PUSH], size: 13, subSize: 10 }, it.label)) }),
    spec.consumers.map((c, i) => {
      const cy = conY(i);
      const pull = [
        [up.x + up.w, cy - 8],
        [con.x, cy - 8]
      ];
      const push = [
        [con.x, cy + 8],
        [up.x + up.w, cy + 8]
      ];
      const single = [
        [up.x + up.w, cy],
        [con.x, cy]
      ];
      return /* @__PURE__ */ jsxs6("g", { children: [
        c.plugin ? /* @__PURE__ */ jsxs6(Fragment6, { children: [
          /* @__PURE__ */ jsx6(Connector, { points: single, defs: id, kind: "request", dashed: true, flow: PULL }),
          /* @__PURE__ */ jsx6(Packet, { points: single, kind: "request", dur: 2.6, delay: -i * 0.5, flow: PULL, r: 4 })
        ] }) : /* @__PURE__ */ jsxs6(Fragment6, { children: [
          /* @__PURE__ */ jsx6(Connector, { points: pull, defs: id, kind: "request", flow: PULL }),
          /* @__PURE__ */ jsx6(Packet, { points: pull, kind: "request", dur: 2.4, delay: -i * 0.6, flow: PULL, r: 4 }),
          /* @__PURE__ */ jsx6(Connector, { points: push, defs: id, kind: "change", flow: PUSH }),
          /* @__PURE__ */ jsx6(Packet, { points: push, kind: "change", dur: 2.4, delay: -i * 0.6 - 1.2, flow: PUSH, r: 4 })
        ] }),
        /* @__PURE__ */ jsx6(Node, { x: con.x, y: con.y0 + i * con.step, w: con.w, h: con.h, label: c.label, sub: c.hooks ? `${c.sub ?? ""} \xB7 ${c.hooks[0]} \u2192 ${c.hooks[1]}`.replace(/^ · /, "") : c.sub, icon: c.icon, align: "left", flow: c.plugin ? PULL : [PULL, PUSH] })
      ] }, c.label);
    }),
    /* @__PURE__ */ jsx6(Label, { x: (up.x + up.w + con.x) / 2, y: conY(0) - 16, text: spec.pull ?? "pull", anchor: "middle" }),
    /* @__PURE__ */ jsx6(Label, { x: (up.x + up.w + con.x) / 2, y: conY(0) + 28, text: spec.push ?? "push", anchor: "middle" })
  ] });
  const steps = [
    { label: spec.upstream.label, sub: spec.upstream.sub ?? items.map((i) => i.label).join(" \xB7 "), icon: "git", flow: [PULL, PUSH].join(" ") },
    ...spec.consumers.map((c) => ({ label: c.label, sub: c.plugin ? "reads one way" : (spec.pull ?? "pull") + " \xB7 " + (spec.push ?? "push"), icon: c.icon ?? "git", flow: c.plugin ? PULL : [PULL, PUSH].join(" "), kind: c.plugin ? "request" : "change", dashed: c.plugin }))
  ];
  return {
    wide,
    narrow: /* @__PURE__ */ jsx6(Stack, { steps, id: `${id}-n` }),
    viewBox: `0 0 1120 ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: spec.pull ?? "Pull", kind: "request" },
      { label: spec.push ?? "Push", kind: "change" }
    ]
  };
}
var syncLoop = (spec = defaultSyncLoop, id) => presetFigure(spec, syncLoopParts, id);

// src/presets/beforeAfter.tsx
import { Fragment as Fragment7, jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
var defaultBeforeAfter = {
  figure: {
    number: "Figure 01",
    eyebrow: "Before and after",
    title: "One check between the model and the reader",
    caption: "Before, the model's draft went straight to the customer. After, a deterministic check reads the recorded facts and raises on the first unsupported claim.",
    alt: "Two stacked panels. Before: tools, model, draft, customer in a line. After: the same line with a deterministic check inserted between the draft and the customer, highlighted."
  },
  before: {
    title: "Before",
    stages: [
      { label: "Tools", sub: "results", icon: "tool" },
      { label: "Model", sub: "drafts prose", icon: "model" },
      { label: "Draft", sub: "trusted as-is", icon: "doc" },
      { label: "Customer", sub: "reads it", icon: "user" }
    ]
  },
  after: {
    title: "After",
    stages: [
      { label: "Tools", sub: "facts recorded", icon: "tool" },
      { label: "Model", sub: "fills fields", icon: "model" },
      { label: "Check", sub: "facts vs fields", icon: "lock" },
      { label: "Customer", sub: "reads what passed", icon: "user" }
    ],
    changed: [2]
  }
};
function beforeAfterParts(spec = defaultBeforeAfter, id) {
  const stage = { w: 136, h: 48, step: 176 };
  const panelH = 120;
  const panel = (p, y, flow, pid) => {
    const n = p.stages.length;
    const w = 48 + n * stage.step - (stage.step - stage.w) + 48;
    const x0 = 24;
    const sy = y + 48;
    const cy = sy + stage.h / 2;
    const changed2 = new Set(p.changed ?? []);
    return /* @__PURE__ */ jsx7(Group, { x: x0, y, w, h: panelH, title: p.title, variant: "dashed", flow, accent: changed2.size > 0, children: p.stages.map((s, i) => {
      const x = x0 + 24 + i * stage.step;
      const into = [
        [x - stage.step + stage.w, cy],
        [x, cy]
      ];
      const hot = changed2.has(i);
      return /* @__PURE__ */ jsxs7("g", { children: [
        i > 0 ? /* @__PURE__ */ jsxs7(Fragment7, { children: [
          /* @__PURE__ */ jsx7(Connector, { points: into, defs: id, kind: hot ? "accent" : "request", flow }),
          /* @__PURE__ */ jsx7(Packet, { points: into, kind: hot ? "accent" : "request", dur: 1.2, delay: -i * 0.4, flow, r: 4, id: `${pid}-p${i}` })
        ] }) : null,
        /* @__PURE__ */ jsx7(Node, { x, y: sy, w: stage.w, h: stage.h, label: s.label, sub: s.sub, icon: s.icon, accent: hot, flow, size: 13, subSize: 10 })
      ] }, s.label + i);
    }) });
  };
  const afterY = 24 + panelH + 32;
  const height = afterY + panelH + 24;
  const panelW = (p) => 48 + p.stages.length * stage.step - (stage.step - stage.w) + 48;
  const width = Math.max(panelW(spec.before), panelW(spec.after)) + 48;
  const wide = /* @__PURE__ */ jsxs7(Fragment7, { children: [
    /* @__PURE__ */ jsx7(Defs, { id }),
    panel(spec.before, 24, "before", `${id}-b`),
    panel(spec.after, afterY, "after", `${id}-a`)
  ] });
  const changed = new Set(spec.after.changed ?? []);
  const steps = [
    ...spec.before.stages.map((s, i) => ({ ...s, sub: i === 0 ? spec.before.title.toLowerCase() : s.sub, flow: "before" })),
    ...spec.after.stages.map((s, i) => ({ ...s, sub: i === 0 ? spec.after.title.toLowerCase() : s.sub, flow: "after", accent: changed.has(i), kind: changed.has(i) ? "accent" : i === 0 ? "neutral" : "request" }))
  ];
  return {
    wide,
    narrow: /* @__PURE__ */ jsx7(Stack, { steps, id: `${id}-n` }),
    viewBox: `0 0 ${Math.max(width, 640)} ${height}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Unchanged", kind: "request" },
      { label: "Changed", kind: "accent" }
    ]
  };
}
var beforeAfter = (spec = defaultBeforeAfter, id) => presetFigure(spec, beforeAfterParts, id);

// src/presets/pipeline.tsx
import { Fragment as Fragment8, jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
var defaultPipeline = {
  figure: {
    number: "Figure 01",
    eyebrow: "Pipeline",
    title: "Fast in front, slow behind a queue",
    caption: "Validation and enrichment run inline. Embedding is slow and bursty, so it sits behind a queue; the writer drains at its own pace.",
    alt: "Five stages in a line: receive, validate, enrich, then a queue with three slots, then embed and write."
  },
  stages: [
    { label: "Receive", sub: "HTTP \xB7 2 ms", icon: "gateway" },
    { label: "Validate", sub: "schema \xB7 1 ms", icon: "lock" },
    { label: "Enrich", sub: "lookups \xB7 8 ms", icon: "service" },
    { label: "Embed", sub: "model \xB7 120 ms", icon: "model" },
    { label: "Write", sub: "batched", icon: "db" }
  ],
  queue: { label: "Queue", sub: "at-least-once", icon: "queue", after: 2, depth: 3 }
};
var FLOW = "job";
function pipelineParts(spec = defaultPipeline, id) {
  const stage = { w: 136, h: 48, step: 176, y: 96 };
  const cy = stage.y + stage.h / 2;
  const slots = [];
  spec.stages.forEach((_, i) => {
    slots.push("stage");
    if (spec.queue && spec.queue.after === i) slots.push("queue");
  });
  const x = (slot) => 24 + slot * stage.step;
  const width = 24 + slots.length * stage.step - (stage.step - stage.w) + 24;
  let si = 0;
  const nodes = slots.map((kind, slot) => {
    const into = [
      [x(slot - 1) + stage.w, cy],
      [x(slot), cy]
    ];
    const edge = slot > 0 ? /* @__PURE__ */ jsxs8(Fragment8, { children: [
      /* @__PURE__ */ jsx8(Connector, { points: into, defs: id, kind: kind === "queue" || slots[slot - 1] === "queue" ? "change" : "request", flow: FLOW }),
      /* @__PURE__ */ jsx8(Packet, { points: into, kind: kind === "queue" || slots[slot - 1] === "queue" ? "change" : "request", dur: 1.2, delay: -slot * 0.35, flow: FLOW, r: 4 })
    ] }) : null;
    if (kind === "queue") {
      const q = spec.queue;
      const depth = q.depth ?? 3;
      const cw = (stage.w - 16 - (depth - 1) * 6) / depth;
      return /* @__PURE__ */ jsxs8("g", { children: [
        edge,
        /* @__PURE__ */ jsx8(Group, { x: x(slot), y: stage.y - 16, w: stage.w, h: stage.h + 32, title: q.label, flow: FLOW, accent: true, children: Array.from({ length: depth }).map((_, k) => /* @__PURE__ */ jsx8(Chip, { x: x(slot) + 8 + k * (cw + 6), y: stage.y + 24, w: cw, h: 18, label: k < depth - 1 ? String(k + 1) : "", kind: k < depth - 1 ? "change" : void 0, dashed: k === depth - 1, size: 9, flow: FLOW }, k)) })
      ] }, "queue");
    }
    const s = spec.stages[si++];
    return /* @__PURE__ */ jsxs8("g", { children: [
      edge,
      /* @__PURE__ */ jsx8(Node, { x: x(slot), y: stage.y, w: stage.w, h: stage.h, label: s.label, sub: s.sub, icon: s.icon, flow: FLOW, size: 13, subSize: 10 })
    ] }, s.label);
  });
  const wide = /* @__PURE__ */ jsxs8(Fragment8, { children: [
    /* @__PURE__ */ jsx8(Defs, { id }),
    /* @__PURE__ */ jsx8(Lane, { x: 24, w: width - 48, y: 44, title: spec.laneTitle ?? "Stages, left to right" }),
    nodes
  ] });
  const steps = [
    ...spec.stages.slice(0, (spec.queue?.after ?? spec.stages.length - 1) + 1).map((s) => ({ ...s, flow: FLOW })),
    ...spec.queue ? [{ label: spec.queue.label, sub: spec.queue.sub, icon: spec.queue.icon ?? "queue", kind: "change", accent: true, flow: FLOW }] : [],
    ...spec.stages.slice((spec.queue?.after ?? spec.stages.length - 1) + 1).map((s) => ({ ...s, kind: "change", flow: FLOW }))
  ];
  return {
    wide,
    narrow: /* @__PURE__ */ jsx8(Stack, { steps, id: `${id}-n` }),
    viewBox: `0 0 ${Math.max(width, 640)} ${stage.y + stage.h + 48}`,
    narrowViewBox: `0 0 ${NARROW_W} ${stackHeight(steps.length)}`,
    legend: [
      { label: "Inline", kind: "request" },
      { label: "Queued", kind: "change" }
    ]
  };
}
var pipeline = (spec = defaultPipeline, id) => presetFigure(spec, pipelineParts, id);

// src/presets/index.ts
var PRESETS = {
  serviceMap: { render: serviceMap, spec: defaultServiceMap, name: "Service map" },
  agentLoop: { render: agentLoop, spec: defaultAgentLoop, name: "Agent loop" },
  ragPipeline: { render: ragPipeline, spec: defaultRagPipeline, name: "RAG pipeline" },
  skillLifecycle: { render: skillLifecycle, spec: defaultSkillLifecycle, name: "Skill lifecycle" },
  syncLoop: { render: syncLoop, spec: defaultSyncLoop, name: "Sync loop" },
  beforeAfter: { render: beforeAfter, spec: defaultBeforeAfter, name: "Before and after" },
  pipeline: { render: pipeline, spec: defaultPipeline, name: "Pipeline" }
};
export {
  NARROW_W,
  PRESETS,
  PresetFigure,
  Stack,
  agentLoop,
  agentLoopParts,
  beforeAfter,
  beforeAfterParts,
  defaultAgentLoop,
  defaultBeforeAfter,
  defaultPipeline,
  defaultRagPipeline,
  defaultServiceMap,
  defaultSkillLifecycle,
  defaultSyncLoop,
  pipeline,
  pipelineParts,
  presetFigure,
  ragPipeline,
  ragPipelineParts,
  serviceMap,
  serviceMapParts,
  skillLifecycle,
  skillLifecycleParts,
  stackHeight,
  syncLoop,
  syncLoopParts,
  toFigure
};
//# sourceMappingURL=presets.js.map